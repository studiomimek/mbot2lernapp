/* mbot.js – gemeinsamer Roboter-Teil für App und Testkonsole
 *
 * Verbindung (Web Bluetooth), Makeblock-Live-Modus-Protokoll (f3/f4) und Roboter-Reaktionen.
 * Aus dem Prototyp v0.5 übernommen; die Rahmen sind unverändert.
 * Die Datei greift auf keine Seitenelemente zu. Meldungen gehen über beiLog()/beiStatus().
 */
"use strict";

const MBot = (() => {
  const VERSION = "0.7.0";

  /* ---------- Konstanten: Makeblock Live-Mode-Protokoll (f3/f4) ---------- */
  const uuid16 = (x) => `0000${x}-0000-1000-8000-00805f9b34fb`;
  const SERVICES = [uuid16("ffe1"), uuid16("ffe0"), uuid16("ffe4"), uuid16("ffe5")];
  const WRITE_SHORT = "ffe3";   // hierhin schreiben wir
  const NOTIFY_SHORT = "ffe2";  // hier antwortet der Roboter
  const HEADER = 0xF3, FOOTER = 0xF4, TYPE_SCRIPT = 0x28;
  const MODE_NO_RESPONSE = 0x00, MODE_WITH_RESPONSE = 0x01;
  const ONLINE_MODE_FRAME = new Uint8Array([0xF3, 0xF6, 0x03, 0x00, 0x0D, 0x00, 0x01, 0x0E, 0xF4]);
  const BLE_CHUNK = 20, CHUNK_DELAY = 8;

  /* ---------- Hilfen ---------- */
  // Bluefy liefert "FFE3", Chrome "0000ffe3-0000-1000-8000-00805f9b34fb"
  function shortUuid(u) {
    const s = String(u).toLowerCase().replace(/^0x/, "");
    if (/^[0-9a-f]{1,8}$/.test(s)) return s.padStart(8, "0").slice(-4);
    const m = s.match(/^0000([0-9a-f]{4})-0000-1000-8000-00805f9b34fb$/);
    return m ? m[1] : s;
  }
  // Fehlerobjekte aus Bluefy haben teils weder name noch message
  function errText(e) {
    if (e == null) return "unbekannter Fehler";
    if (typeof e === "string") return e;
    const parts = [e.name, e.message, e.code].filter((x) => x !== undefined && x !== "");
    if (parts.length) return parts.join(": ");
    try { return JSON.stringify(e); } catch (_) { return String(e); }
  }
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const hex = (u8) => Array.from(u8, (b) => b.toString(16).padStart(2, "0")).join(" ");
  // Text für show_label: keine Zeichen, die den Python-Ausdruck aufbrechen
  const safeText = (s) => String(s).replace(/[\\'"\n\r]/g, "").slice(0, 12);

  /* ---------- Meldungen nach außen ---------- */
  let logFn = () => {}, statusFn = () => {};
  function log(msg, cls = "") { try { logFn(msg, cls); } catch (_) {} }
  function setStatus(kind, text) {
    bot.connected = kind === "on";
    try { statusFn(kind, text); } catch (_) {}
  }

  // Werden von der Seite gesetzt (App: aus dem Speicher, Testkonsole: aus den Reglern)
  const einstellungen = { bewegung: false, tempo: 50, lautstaerke: 60, rohdaten: false };

  /* ---------- Protokoll ---------- */
  function buildScriptFrame(script, idx, mode) {
    const sb = new TextEncoder().encode(script);
    const data = new Uint8Array(2 + sb.length);
    data[0] = sb.length & 0xFF; data[1] = (sb.length >> 8) & 0xFF; data.set(sb, 2);
    const idxLo = idx & 0xFF, idxHi = (idx >> 8) & 0xFF;
    const datalen = data.length + 4;
    const hdrCheck = (((datalen >> 8) & 0xFF) + (datalen & 0xFF) + 0xF3) & 0xFF;
    let sum = TYPE_SCRIPT + mode + idxLo + idxHi;
    for (const b of data) sum += b;
    const out = new Uint8Array(8 + data.length + 2);
    out.set([HEADER, hdrCheck, datalen & 0xFF, (datalen >> 8) & 0xFF, TYPE_SCRIPT, mode, idxLo, idxHi], 0);
    out.set(data, 8);
    out[8 + data.length] = sum & 0xFF;
    out[9 + data.length] = FOOTER;
    return out;
  }

  function parseRet(raw) {
    try { const j = JSON.parse(raw); if (j && typeof j === "object" && "ret" in j) return j.ret; } catch (_) {}
    const m = raw.match(/["']ret["']\s*:\s*(.*?)\s*\}?\s*$/s);
    if (m) {
      const s = m[1];
      try { return JSON.parse(s); } catch (_) {}
      try { return JSON.parse(s.replace(/'/g, '"').replace(/\bTrue\b/g, "true").replace(/\bFalse\b/g, "false").replace(/\bNone\b/g, "null")); } catch (_) {}
      return s;
    }
    return null;
  }

  function parseFrame(f) {
    if (f.length < 10 || f[4] !== TYPE_SCRIPT) return null;
    const idx = f[6] + (f[7] << 8);
    const data = f.slice(8, f.length - 2);
    if (data.length < 3) return null;
    const raw = new TextDecoder().decode(new Uint8Array(data.slice(2)));
    return { idx, value: parseRet(raw), raw };
  }

  class F3Parser {
    constructor() { this.reset(); }
    reset() { this.buf = []; this.rx = false; this.len = 0; }
    feed(bytes) { const out = []; for (const b of bytes) { const r = this.byte(b); if (r) out.push(r); } return out; }
    byte(b) {
      this.buf.push(b);
      const n = this.buf.length;
      if (n > 3) {
        const b3 = this.buf[n - 4], b2 = this.buf[n - 3], b1 = this.buf[n - 2], b0 = this.buf[n - 1];
        if (b3 === HEADER && ((b0 + b1 + b3) & 0xFF) === b2) {
          this.buf = [HEADER, b2, b1, b0]; this.len = b1 + (b0 << 8); this.rx = true;
        }
      }
      if (this.rx && this.buf.length === this.len + 6 && this.buf[0] === HEADER) {
        const frame = this.buf; this.reset(); return parseFrame(frame);
      }
      if (this.buf.length > 4096) this.reset();
      return null;
    }
  }

  /* ---------- Bluetooth-Verbindung ---------- */
  const bot = {
    device: null, writeChar: null, notifyChar: null, noResp: false,
    idx: 1, pending: new Map(), parser: new F3Parser(), anyReply: null,
    chain: Promise.resolve(), connected: false,
  };

  function nextIdx() { const i = bot.idx; bot.idx = (bot.idx % 0xFFFE) + 1; return i; }

  function onNotify(ev) {
    const dv = ev.target.value;
    const bytes = new Uint8Array(dv.buffer, dv.byteOffset, dv.byteLength);
    if (einstellungen.rohdaten) log(`⇠ ${hex(bytes)}`, "s");
    for (const resp of bot.parser.feed(bytes)) {
      if (bot.anyReply) { bot.anyReply(resp); bot.anyReply = null; continue; }
      const p = bot.pending.get(resp.idx);
      if (p) { bot.pending.delete(resp.idx); p(resp.value); }
      else log(`← Antwort #${resp.idx}: ${resp.raw}`, "r");
    }
  }

  // Alle Schreibvorgänge laufen nacheinander durch eine Warteschlange (keine parallelen GATT-Operationen)
  function writeFrame(frame) {
    const job = bot.chain.then(async () => {
      if (!bot.writeChar) throw new Error("Nicht verbunden");
      if (einstellungen.rohdaten) log(`⇢ ${hex(frame)}`, "s");
      for (let i = 0; i < frame.length; i += BLE_CHUNK) {
        const chunk = frame.slice(i, i + BLE_CHUNK);
        if (bot.noResp) await bot.writeChar.writeValueWithoutResponse(chunk);
        else await bot.writeChar.writeValue(chunk);
        await sleep(CHUNK_DELAY);
      }
    });
    bot.chain = job.catch(() => {});
    return job;
  }

  // Befehl ohne Antwort
  async function run(code) {
    log(`→ ${code}`);
    await writeFrame(buildScriptFrame(code, nextIdx(), MODE_NO_RESPONSE));
  }

  // Ausdruck mit Antwort ({"ret": wert} über ffe2)
  // leise = true: nicht ins Protokoll schreiben (für Abfragen, die sich oft wiederholen)
  async function evalExpr(code, timeout = 3000, leise = false) {
    const idx = nextIdx();
    if (!leise) log(`→ ${code}  (wartet auf Antwort)`);
    const answer = new Promise((resolve, reject) => {
      bot.pending.set(idx, resolve);
      setTimeout(() => { if (bot.pending.delete(idx)) reject(new Error(`Keine Antwort auf „${code}“ nach ${timeout / 1000} s`)); }, timeout);
    });
    await writeFrame(buildScriptFrame(code, idx, MODE_WITH_RESPONSE));
    const v = await answer;
    if (!leise) log(`← ${code} = ${JSON.stringify(v)}`, "r");
    return v;
  }

  async function handshake() {
    log("Starte Live-Modus …");
    await writeFrame(ONLINE_MODE_FRAME);
    await sleep(500);
    for (let i = 1; i <= 12; i++) {
      const got = new Promise((r) => { bot.anyReply = r; setTimeout(() => r(null), 500); });
      await writeFrame(buildScriptFrame("cyberpi.get_bri()", nextIdx(), MODE_WITH_RESPONSE));
      const resp = await got;
      bot.anyReply = null;
      if (resp) {
        log(`Handshake ok nach ${i} Versuch(en). Helligkeit = ${JSON.stringify(resp.value)}`, "r");
        bot.idx = 1; bot.pending.clear();
        return true;
      }
    }
    log("Keine Antwort beim Handshake. Befehle werden trotzdem versucht.", "w");
    bot.idx = 1; bot.pending.clear();
    return false;
  }

  async function findCharacteristics(server) {
    let services = [];
    try { services = await server.getPrimaryServices(); }
    catch (e) {
      log(`getPrimaryServices() ging nicht (${errText(e)}), probiere einzeln …`, "w");
      for (const u of SERVICES) { try { services.push(await server.getPrimaryService(u)); } catch (_) {} }
    }
    if (!services.length) throw new Error("Keine passenden Bluetooth-Dienste gefunden");
    let write = null, notify = null;
    for (const s of services) {
      log(`Dienst ${s.uuid}`);
      let chars = [];
      try { chars = await s.getCharacteristics(); } catch (e) { log(`  Kanäle nicht lesbar: ${errText(e)}`, "w"); }
      for (const c of chars) {
        const p = c.properties;
        const props = ["read", "write", "writeWithoutResponse", "notify", "indicate"].filter((k) => p[k]).join(", ");
        log(`  Kanal ${c.uuid}  [${props}]`);
        if (!write && shortUuid(c.uuid) === WRITE_SHORT) write = c;
        if (!notify && shortUuid(c.uuid) === NOTIFY_SHORT) notify = c;
      }
    }
    return { write, notify };
  }

  const kannBluetooth = () => !!navigator.bluetooth;

  // alle = true: Liste aller Bluetooth-Geräte (in Bluefy zuverlässig); sonst Filter „Makeblock“
  async function verbinde(alle) {
    if (!kannBluetooth()) { log("navigator.bluetooth fehlt: kein Web Bluetooth in diesem Browser.", "e"); return false; }
    if (bot.connected) return true;
    bot.device = null;
    try {
      setStatus("busy", "Suche …");
      const options = alle
        ? { acceptAllDevices: true, optionalServices: SERVICES }
        : { filters: [{ namePrefix: "Makeblock" }], optionalServices: SERVICES };
      log(alle ? "Suche alle Bluetooth-Geräte …" : "Suche mBot2 …");
      const device = await navigator.bluetooth.requestDevice(options);
      bot.device = device;
      log(`Gerät gewählt: ${device.name || "(ohne Namen)"}`);
      device.addEventListener("gattserverdisconnected", onDisconnected);
      setStatus("busy", "Verbinde …");
      const server = await device.gatt.connect();
      log("Bluetooth verbunden, suche Kanäle …");
      const { write, notify } = await findCharacteristics(server);
      if (!write) throw new Error(`Schreibkanal ${WRITE_SHORT} nicht gefunden. Ist das wirklich der mBot2?`);
      bot.writeChar = write;
      bot.noResp = !!(write.properties.writeWithoutResponse && typeof write.writeValueWithoutResponse === "function");
      log(`Schreibmodus: ${bot.noResp ? "ohne Bestätigung" : "mit Bestätigung"}`);
      if (notify) {
        await notify.startNotifications();
        notify.addEventListener("characteristicvaluechanged", onNotify);
        bot.notifyChar = notify;
        log("Antwortkanal aktiv");
      } else {
        log(`Antwortkanal ${NOTIFY_SHORT} nicht gefunden. Der Rückkanal wird nicht funktionieren.`, "w");
      }
      bot.parser.reset();
      await handshake();
      await run(`cyberpi.audio.set_vol(${+einstellungen.lautstaerke || 0})`);
      await run("cyberpi.led.on(0,0,255)");
      await run("cyberpi.audio.play_tone(660,0.15)");
      log("Bereit. Roboter sollte kurz blau leuchten und piepen.", "r");
      setStatus("on", `Verbunden: ${device.name || "mBot2"}`);
      return true;
    } catch (e) {
      if (e && e.name === "NotFoundError") { log("Suche abgebrochen oder kein Gerät gewählt.", "w"); setStatus("", "Nicht verbunden"); }
      else if (!bot.device) { log(`Suche beendet ohne Gerät (${errText(e)}). Wenn der mBot2 nicht in der Liste stand: „Alle Geräte zeigen“.`, "w"); setStatus("", "Nicht verbunden"); }
      else { log(`Verbindung fehlgeschlagen: ${errText(e)}`, "e"); setStatus("err", "Fehler"); }
      try { bot.device && bot.device.gatt.connected && bot.device.gatt.disconnect(); } catch (_) {}
      return false;
    }
  }

  function onDisconnected() {
    log("Verbindung getrennt.", "w");
    bot.writeChar = null; bot.notifyChar = null; bot.pending.clear();
    epoche++; faehrt = false;
    setStatus("", "Nicht verbunden");
  }

  async function trenne() {
    epoche++; faehrt = false;
    try { await run("mbot2.EM_stop()"); await run("cyberpi.led.on(0,0,0)"); } catch (_) {}
    try { bot.device && bot.device.gatt.disconnect(); } catch (_) {}
  }

  /* ---------- Bewegung ----------
   * Zeitgesteuerte Befehle wie mbot2.forward(50,1) blockieren den Roboter, bis sie fertig sind;
   * STOPP käme erst danach an. Deshalb: ohne Zeit losfahren, die Seite stoppt nach Ablauf.
   * Die „Epoche“ zählt bei jedem STOPP und bei jeder neuen Reaktion hoch und bricht laufende Abläufe ab.
   */
  let epoche = 0, faehrt = false;
  const gestoppt = (ep) => ep !== epoche;

  async function move(fn, spd, secs, ep = epoche) {
    if (!einstellungen.bewegung) { log("Bewegung übersprungen (nicht erlaubt)", "w"); return; }
    if (!bot.connected || gestoppt(ep)) return;
    faehrt = true;
    await run(`mbot2.${fn}(${spd})`);
    const end = Date.now() + secs * 1000;
    while (Date.now() < end && !gestoppt(ep)) await sleep(20);
    if (!gestoppt(ep)) { await run("mbot2.EM_stop()"); faehrt = false; }
  }

  async function tones(list, ep = epoche) {
    for (const [f, s] of list) {
      if (gestoppt(ep)) return;
      await run(`cyberpi.audio.play_tone(${f},${s})`);
      await sleep(s * 1000 + 30);
    }
  }

  // Hält sofort an und bricht alle laufenden Abläufe ab
  async function stopp() {
    epoche++; faehrt = false;
    log("STOPP", "w");
    if (bot.connected) await run("mbot2.EM_stop()");
  }

  /* ---------- Reaktionen ----------
   * Jede Reaktion bricht die vorherige ab. Ohne Verbindung passiert nichts, Fehler werden nur geloggt.
   * Bewegungen sind kurz (höchstens 0,4 s am Stück) und laufen nur mit einstellungen.bewegung.
   */
  async function neueEpoche() {
    epoche++;
    if (faehrt) { faehrt = false; await run("mbot2.EM_stop()"); }
    return epoche;
  }
  function alsReaktion(name, fn) {
    return async (...args) => {
      if (!bot.connected) return;
      try { const ep = await neueEpoche(); await fn(ep, ...args); }
      catch (e) { log(`Reaktion „${name}“ fehlgeschlagen: ${errText(e)}`, "e"); }
    };
  }
  function still(code) {   // einzelner Befehl, der keinen Ablauf abbricht
    if (!bot.connected) return Promise.resolve();
    return run(code).catch((e) => log(`Befehl fehlgeschlagen: ${errText(e)}`, "e"));
  }

  // Grundlicht: Farbe, in der der Roboter zwischen den Reaktionen leuchtet (in der App: Farbe des Ortes)
  let grundlicht = null;
  const grund = () => (grundlicht ? `cyberpi.led.on(${grundlicht.join(",")})` : "cyberpi.led.on(0,0,0)");

  const ZAEHLTOENE = [523, 587, 659, 698, 784, 880, 988, 1047, 1175, 1319];
  const tempo = () => Math.max(20, Math.min(60, +einstellungen.tempo || 50));
  const zufall = (liste) => liste[Math.floor(Math.random() * liste.length)];

  // Zwitschern wie ein kleiner Filmroboter: viele sehr kurze Töne in wechselnder Höhe
  const ZIRP = [988, 1175, 1319, 1568, 1760, 2093, 2349, 2637];
  const zwitscher = (n) => Array.from({ length: n }, () => [zufall(ZIRP), zufall([0.04, 0.05, 0.06, 0.08])]);
  const FROH = () => [...zwitscher(4), [2093, 0.05], [2637, 0.12]];
  const FRAGE = [[1175, 0.05], [1568, 0.05], [1319, 0.04], [2349, 0.12]];
  const OHOH = [[587, 0.12], [440, 0.2]];

  // Kleine Bewegungen, jeweils höchstens 0,4 s am Stück
  const BEWEGUNG = {
    wackeln: async (ep) => { await move("turn_left", tempo(), 0.3, ep); await move("turn_right", tempo(), 0.3, ep); },
    nicken: async (ep) => { await move("forward", 40, 0.22, ep); await move("backward", 40, 0.22, ep); },
    drehen: async (ep) => { await move("turn_right", tempo(), 0.4, ep); await move("turn_left", tempo(), 0.4, ep); },
    zappeln: async (ep) => { for (let i = 0; i < 2; i++) { await move("turn_left", 40, 0.12, ep); await move("turn_right", 40, 0.12, ep); } },
  };

  const reaktion = {
    // Text (z. B. Buchstabe oder Zahl) auf dem Roboter-Display; Schriftgröße 32 ist das Maximum
    zeige: (text) => still(`cyberpi.display.show_label('${safeText(text)}',32,'center')`),
    leere: () => still("cyberpi.display.clear()"),
    licht: (r, g, b) => { grundlicht = [r | 0, g | 0, b | 0]; return still(grund()); },
    // Ton beim Antippen des n-ten Dings (Tonleiter aufwärts)
    zaehlton: (n) => still(`cyberpi.audio.play_tone(${ZAEHLTOENE[(Math.max(1, n) - 1) % ZAEHLTOENE.length]},0.08)`),

    // Aufgabe beginnt: „?“, fragendes Zwitschern, kurzes Nicken
    neugierig: alsReaktion("neugierig", async (ep) => {
      await run("cyberpi.display.show_label('?',32,'center')");
      await tones(FRAGE, ep);
      await BEWEGUNG.nicken(ep);
    }),

    // Richtige Antwort: grün, fröhliches Zwitschern, eine von vier Bewegungen
    richtig: alsReaktion("richtig", async (ep) => {
      await run("cyberpi.led.on(0,255,0)");
      await tones(FROH(), ep);
      await BEWEGUNG[zufall(Object.keys(BEWEGUNG))](ep);
      await sleep(400);
      if (!gestoppt(ep)) await run(grund());
    }),

    // Falsche Antwort: sanft, kein Alarm
    nochmal: alsReaktion("nochmal", async (ep) => {
      await run("cyberpi.led.on(255,120,0)");
      await tones(OHOH, ep);
      await move("turn_left", 30, 0.12, ep);
      await move("turn_right", 30, 0.12, ep);
      await sleep(400);
      if (!gestoppt(ep)) await run(grund());
    }),

    // n gleiche Töne mit Lichtblitz zum Mitzählen
    zaehle: alsReaktion("zaehle", async (ep, n) => {
      for (let i = 0; i < n && !gestoppt(ep); i++) {
        await run("cyberpi.led.on(255,200,0)");
        await run("cyberpi.audio.play_tone(784,0.12)");
        await sleep(160);
        await run("cyberpi.led.on(0,0,0)");
        await sleep(160);
      }
      if (!gestoppt(ep)) await run(grund());
    }),

    // Eine Silbe mitschwingen: Ton, Lichtblitz, kleiner Ruck (abwechselnd vor und zurück)
    silbe: alsReaktion("silbe", async (ep, i = 0) => {
      await run("cyberpi.led.on(255,200,0)");
      await tones([[880, 0.1]], ep);                      // wartet, bis der Ton vorbei ist (er blockiert den Roboter)
      await move(i % 2 ? "backward" : "forward", 35, 0.15, ep);
      if (!gestoppt(ep)) await run(grund());
    }),

    // Raketenstart: Töne steigen an, dann ein Satz nach vorn und wieder zurück
    rakete: alsReaktion("rakete", async (ep) => {
      await run("cyberpi.led.on(255,40,0)");
      await tones([[523, 0.1], [659, 0.1], [784, 0.1], [1047, 0.1], [1319, 0.1], [1568, 0.25]], ep);
      if (!gestoppt(ep)) await run("cyberpi.led.on(255,255,255)");
      await move("forward", 45, 0.4, ep);
      await move("backward", 45, 0.4, ep);
      if (!gestoppt(ep)) await run(grund());
    }),

    // Aufgabe geschafft: Regenbogen, langes Zwitschern, kleiner Tanz
    feier: alsReaktion("feier", async (ep) => {
      await run("cyberpi.led.play(name='rainbow')");
      await tones([...zwitscher(8), [1568, 0.08], [2093, 0.08], [2637, 0.25]], ep);
      await BEWEGUNG.wackeln(ep);
      await BEWEGUNG.nicken(ep);
      await BEWEGUNG.drehen(ep);
      await sleep(300);
      if (!gestoppt(ep)) await run(grund());
    }),

    // Etwas entdeckt: weißes Licht, kurzes Zwitschern, Zappeln
    staunen: alsReaktion("staunen", async (ep) => {
      await run("cyberpi.led.on(255,255,255)");
      await tones(zwitscher(3), ep);
      await BEWEGUNG.zappeln(ep);
      if (!gestoppt(ep)) await run(grund());
    }),

    // Bricht die laufende Reaktion ab (und hält an, falls der Roboter gerade fährt)
    ruhe: alsReaktion("ruhe", async () => {}),

    aus: alsReaktion("aus", async () => {
      grundlicht = null;
      await run("cyberpi.led.on(0,0,0)");
      await run("cyberpi.display.clear()");
    }),
  };

  /* ---------- Eingabe über den Roboter ----------
   * Wartet, bis jemand die Hand vor den Ultraschallsensor hält (näher als 15 cm, zweimal hintereinander gemessen).
   * weiter() = false bricht ab. Ergebnis: true = Hand erkannt.
   */
  async function warteAufHand(maxMs = 15000, weiter = () => true) {
    const ende = Date.now() + maxMs;
    let nah = 0;
    while (bot.connected && Date.now() < ende && weiter()) {
      let d = NaN;
      try { d = +(await evalExpr("cyberpi.ultrasonic2.get(1)", 1200, true)); } catch (_) {}
      if (d > 0 && d < 15) { if (++nah >= 2) { log(`Hand erkannt (${d} cm)`, "r"); return true; } }
      else nah = 0;
      await sleep(200);
    }
    return false;
  }

  return {
    VERSION,
    einstellungen,
    beiLog(fn) { logFn = fn; },
    beiStatus(fn) { statusFn = fn; },
    kannBluetooth,
    verbunden: () => bot.connected,
    verbinde, trenne,
    run, evalExpr,
    move, tones, stopp, warteAufHand,
    epoche: () => epoche,
    gestoppt,
    reaktion,
    hilfen: { errText, sleep, shortUuid, safeText, hex, buildScriptFrame, F3Parser },
  };
})();
