/* kern.js – Grundgerüst der App: Namensraum, Protokoll, Speicher, Sprache, Töne, Aufnahmen */
"use strict";

const App = { VERSION: "0.29.1", inhalt: {}, aufgaben: {}, bilder: {} };

(() => {
  /* ---------- Kleine Hilfen ---------- */
  App.$ = (sel, el = document) => el.querySelector(sel);
  App.$$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));
  App.warte = (ms) => new Promise((r) => setTimeout(r, ms));
  App.zufall = (von, bis) => von + Math.floor(Math.random() * (bis - von + 1));
  App.misch = (liste) => {
    const a = liste.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };

  // Nächster Animationsschritt. Liefert der Browser gerade keine Bilder (Energiesparen, Seite im Hintergrund),
  // sorgt ein Zeitgeber dafür, dass es trotzdem weitergeht.
  App.naechstesBild = (fn) => {
    let erledigt = false;
    const los = () => { if (!erledigt) { erledigt = true; fn(performance.now()); } };
    requestAnimationFrame(los);
    setTimeout(los, 60);
  };

  /* ---------- Protokoll (im Elternbereich sichtbar und kopierbar) ---------- */
  App.protokoll = [];
  App.beiProtokoll = null;
  App.log = (msg, cls = "") => {
    const t = new Date().toLocaleTimeString("de-DE");
    const marke = cls === "e" ? "FEHLER  " : cls === "w" ? "!  " : "";
    App.protokoll.push(`${t}  ${marke}${msg}`);
    if (App.protokoll.length > 800) App.protokoll.splice(0, 200);
    if (App.beiProtokoll) { try { App.beiProtokoll(); } catch (_) {} }
  };
  window.addEventListener("error", (e) => App.log(`JS-Fehler: ${e.message} (${String(e.filename || "").split("/").pop()}:${e.lineno})`, "e"));
  window.addEventListener("unhandledrejection", (e) => App.log(`Fehler: ${MBot.hilfen.errText(e.reason)}`, "e"));

  /* ---------- Speicher (localStorage, ein Gerät, mehrere Spieler) ----------
   * Im Speicher liegt ein einziger Eintrag: { einst, aktiv, spieler: [{ id, bild, stand }] }.
   *   einst    Einstellungen des Geräts (Roboter, Stimme, Buchstabenwahl …), gelten für alle Spieler
   *   spieler  jeder Spieler hat ein Bild (statt eines Namens) und seinen eigenen Spielstand
   * App.stand ist immer der Spielstand des gewählten Spielers plus „einst“. Ist niemand gewählt
   * (Startbild), ist App.stand ein leerer Stand, der nicht gespeichert wird.
   * Daneben gibt es je Spieler eigene Einträge für große Dinge (App.extra, siehe unten).
   */
  const SCHLUESSEL = "mbot2-lernapp-v2";
  const ALT = "mbot2-lernapp-stand-v1";           // bis v0.10.1: ein einziger Stand. Daraus werden nur die Einstellungen übernommen.
  const SPIELER_BILDER = ["krebs", "fisch", "seestern", "planet", "stern", "muschel"];   // Bildfunktionen in js/bilder.js
  const standardSpiel = () => ({
    ort: null,                                    // Ort, an dem die Figur gerade ist
    besucht: {},                                  // Orte, die schon entdeckt wurden (für die Karte)
    fund: { muschel: 0, seestern: 0, perle: 0, stern: 0, planet: 0, rakete: 0, feder: 0, flasche: 0, muenze: 0, komet: 0, zahnrad: 0, anker: 0, boje: 0, schnecke: 0, fahrkarte: 0, schraube: 0 },   // Fundstücke in der Schatzkiste
    entdeckt: {},                                 // gefundene Verstecke (zurzeit ungenutzt)
    buchstaben: {},                               // "M": { richtig, fehler, gespurt }
    zahlen: {},                                   // "7": { richtig, fehler }
    mengenStufe: 0, plusStufe: 0, reiheStufe: 0, vergleichStufe: 0, winkStufe: 0, strahlStufe: 0, blitzStufe: 0, zugStufe: 0, mauerStufe: 0,
    teile: {},                                    // gebaute Bauteile: { propeller: 1 } (siehe inhalt/bauteile.js)
    treibstoff: 0,                                // volle Tanks: jeder reicht für eine Reise zu einem neuen Planeten
    tanks: 0,                                     // so viele Tanks hat der Krebs schon gemacht (bestimmt die Sorten des nächsten)
    reisen: [],                                   // Reisealbum: [{ z: Bauzahl, name }] (siehe js/planeten.js)
    bauplan: "teil",                              // woran der Krebs gerade baut: "teil" (Schlüssel-Teil, Treibstoff) oder "werkzeug"
    buddel: {},                                   // Buddelinsel: was im Sand gebaut ist (js/aufgaben/buddeln.js)
    halle: {},                                    // Raketenhalle: die zuletzt gebaute Rakete (js/aufgaben/raketenbau.js)
  });
  const standardEinst = () => ({
    bewegung: true, tempo: 50, lautstaerke: 60, stimme: "", sprechtempo: 0.85,
    buchstaben: null,                             // null = Vorgabe aus inhalt/buchstaben.js, sonst die im Elternbereich gewählte Liste
    mitfahren: true, steuerung: "fein",           // mitfahren: echter Roboter fährt in der Welt langsam mit
    klatschen: "auto", klatschSchwelle: 0.35,     // klatschen: "auto" | "aus" | "ipad" | "roboter" (Mikrofon fürs Silben-Klatschen)
    runden: 3,                                    // Aufgaben pro Spiel (2 bis 5)
    preis: 2,                                     // Fundstücke je Sorte für ein Bauteil (1 bis 3)
    offen: false,                                 // true = alle Orte offen, Bauteile sperren nichts
  });
  // Übernimmt bekannte Felder aus gespeicherten Daten in eine frische Vorlage (eine Ebene tief)
  function fuelle(vorlage, roh) {
    if (roh && typeof roh === "object") {
      for (const k of Object.keys(vorlage)) {
        if (!(k in roh)) continue;
        if (vorlage[k] && typeof vorlage[k] === "object" && !Array.isArray(vorlage[k])) Object.assign(vorlage[k], roh[k]); else vorlage[k] = roh[k];
      }
    }
    return vorlage;
  }
  const lies = (schluessel) => { try { return JSON.parse(localStorage.getItem(schluessel) || "null"); } catch (_) { return null; } };

  const daten = { einst: standardEinst(), aktiv: null, spieler: [] };
  (() => {
    const roh = lies(SCHLUESSEL);
    if (roh && typeof roh === "object") {
      fuelle(daten.einst, roh.einst);
      for (const s of Array.isArray(roh.spieler) ? roh.spieler : []) {
        if (s && s.id && SPIELER_BILDER.includes(s.bild)) daten.spieler.push({ id: String(s.id), bild: s.bild, stand: fuelle(standardSpiel(), s.stand) });
      }
    } else {
      const alt = lies(ALT);
      if (alt && alt.einst) fuelle(daten.einst, alt.einst);
    }
  })();

  const nimm = (spiel) => { App.stand = spiel; App.stand.einst = daten.einst; };
  nimm(standardSpiel());

  App.speichere = () => {
    const s = daten.spieler.find((x) => x.id === daten.aktiv);
    if (s) { s.stand = Object.assign({}, App.stand); delete s.stand.einst; }
    try { localStorage.setItem(SCHLUESSEL, JSON.stringify(daten)); return true; } catch (_) { return false; }   // false = Speicher voll oder gesperrt
  };
  // Große Dinge eines Spielers (das Bild von der Malinsel) liegen als eigene Einträge neben dem Spielstand, damit
  // nicht jedes Speichern sie mitschreibt: Schlüssel „mbot2-lernapp-<name>-<Spieler>“. Ohne gewählten Spieler
  // (Startbild) gibt es sie nicht. Sie verschwinden mit „neu beginnen“ und mit dem Löschen des Spielers.
  const EXTRAS = ["malbild"];
  const extraSchluessel = (name, id) => `mbot2-lernapp-${name}-${id}`;
  const loescheExtras = (id) => { if (id) for (const name of EXTRAS) { try { localStorage.removeItem(extraSchluessel(name, id)); } catch (_) {} } };
  App.extra = {
    lies(name) { if (!daten.aktiv) return null; try { return localStorage.getItem(extraSchluessel(name, daten.aktiv)); } catch (_) { return null; } },
    // text = null löscht den Eintrag. false = es ließ sich nicht speichern (zum Beispiel, weil der Speicher voll ist).
    // Der Spielstand geht vor: Lässt er sich nach dem Schreiben nicht mehr speichern, fliegt der Eintrag wieder raus.
    schreibe(name, text) {
      if (!daten.aktiv) return false;
      const schluessel = extraSchluessel(name, daten.aktiv);
      try {
        if (text == null) { localStorage.removeItem(schluessel); return true; }
        localStorage.setItem(schluessel, text);
      } catch (_) { return false; }
      if (App.speichere()) return true;
      try { localStorage.removeItem(schluessel); } catch (_) {}
      App.speichere();
      return false;
    },
  };

  // Löscht den Spielstand des gewählten Spielers (neu beginnen); Bild und Einstellungen bleiben
  App.loescheFortschritt = () => { loescheExtras(daten.aktiv); nimm(standardSpiel()); App.speichere(); };

  App.spieler = {
    BILDER: SPIELER_BILDER,
    liste: () => daten.spieler.map((s) => ({ id: s.id, bild: s.bild, funde: Object.values(s.stand.fund || {}).reduce((a, b) => a + (b || 0), 0) })),
    aktiv: () => daten.spieler.find((s) => s.id === daten.aktiv) || null,
    frei: () => SPIELER_BILDER.filter((b) => !daten.spieler.some((s) => s.bild === b)),
    waehle(id) {
      const s = daten.spieler.find((x) => x.id === id);
      if (!s) return false;
      App.speichere();                            // Stand des bisherigen Spielers sichern
      daten.aktiv = s.id;
      nimm(fuelle(standardSpiel(), s.stand));
      App.speichere();
      return true;
    },
    neu(bild) {
      if (!App.spieler.frei().includes(bild)) return false;
      const id = `s${Date.now().toString(36)}`;
      daten.spieler.push({ id, bild, stand: standardSpiel() });
      return App.spieler.waehle(id);
    },
    loesche(id) {
      const i = daten.spieler.findIndex((x) => x.id === id);
      if (i < 0) return;
      daten.spieler.splice(i, 1);
      loescheExtras(id);
      if (daten.aktiv === id) { daten.aktiv = null; nimm(standardSpiel()); }
      App.speichere();
    },
    // Zurück zum Startbild: Stand sichern, niemand ist mehr gewählt
    abmelden() { App.speichere(); daten.aktiv = null; nimm(standardSpiel()); },
  };

  // Stufe hoch? Nur wenn (fast) alles auf Anhieb richtig war; bei kurzen Spielen (bis 3 Aufgaben) alles.
  App.sicher = (aufAnhieb, runden) => aufAnhieb >= Math.max(runden - 1, Math.min(runden, 3));
  // Sind alle Buchstaben des Wortes aktiv? (au, ei, eu, sch zählen als eigene Lautverbindung.) Für „Wörter lesen“
  // und den „Silbenzug“: Es kommen nur Wörter dran, die das Kind schon lesen kann. Geprüft wird Silbe für Silbe:
  // In „Mu-se-um“ treffen e und u nur an der Silbengrenze aufeinander, das ist kein „eu“.
  App.lesbar = (silben, aktiv) => silben.every((silbe) => {
    let w = silbe.toLowerCase();
    for (const g of ["sch", "ei", "au", "eu"]) {
      if (!w.includes(g)) continue;
      if (!aktiv.includes(g[0].toUpperCase() + g.slice(1))) return false;
      w = w.split(g).join("");
    }
    return Array.from(w).every((c) => aktiv.includes(c.toUpperCase()));
  });
  // Buchstaben, die gerade geübt werden (mindestens drei, sonst gilt die Vorgabe)
  App.buchstabenAktiv = () => {
    const BU = App.inhalt.buchstaben;
    const liste = (App.stand.einst.buchstaben || BU.aktiv).filter((b) => BU.zeichen[b]);
    return liste.length >= 3 ? liste : BU.aktiv.slice();
  };

  // Fangen zwei Einträge mit demselben Laut an? Dann dürfen sie nicht zusammen zur Auswahl stehen
  // (gleicher erster Buchstabe wie E und Ei, oder gleicher Klang wie F und V, C und K, J und Y).
  App.klingtGleich = (a, b) => {
    const x = a[0].toUpperCase(), y = b[0].toUpperCase();
    return x === y || ["CK", "FV", "JY"].some((p) => p.includes(x) && p.includes(y));
  };

  // Zähler für einen Buchstaben oder eine Zahl
  App.merke = (bereich, schluessel, feld) => {
    const b = App.stand[bereich];
    const e = b[schluessel] || (b[schluessel] = {});
    e[feld] = (e[feld] || 0) + 1;
    App.speichere();
  };

  /* ---------- Sprachausgabe (Web Speech API) ---------- */
  let stimmen = [], sprechNr = 0, haltU = null, sprichtBis = 0, leerBis = 0;   // leerBis: bis dahin läuft nur die stumme Entsperrung
  // Spricht das iPad gerade? (Dann wird nicht auf Klatschen gehört.)
  App.spricht = () => performance.now() < sprichtBis;
  App.ladeStimmen = () => {
    if (!("speechSynthesis" in window)) return [];
    stimmen = speechSynthesis.getVoices().filter((v) => (v.lang || "").toLowerCase().startsWith("de"));
    return stimmen;
  };
  if ("speechSynthesis" in window) {
    App.ladeStimmen();
    if (speechSynthesis.addEventListener) speechSynthesis.addEventListener("voiceschanged", App.ladeStimmen);
    else speechSynthesis.onvoiceschanged = App.ladeStimmen;
  }
  App.stimmen = () => stimmen;

  // Spricht den Text. Das Versprechen erfüllt sich, wenn fertig gesprochen ist (oder abgebrochen wurde).
  // Eine Zahl direkt vor einem Punkt liest die Computerstimme als Ordnungszahl („ist 8.“ → „ist achter“).
  // Deshalb werden solche Zahlen vor dem Sprechen ausgeschrieben (bis 20), größere bekommen einen Abstand.
  const ZAHLWOERTER = ["null", "eins", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun", "zehn", "elf", "zwölf",
    "dreizehn", "vierzehn", "fünfzehn", "sechzehn", "siebzehn", "achtzehn", "neunzehn", "zwanzig"];
  const sprechtext = (t) => String(t).replace(/(\d+)\./g, (m, z) => `${ZAHLWOERTER[+z] || `${z} `}.`);
  // opt.tempo: Faktor auf das Sprechtempo (0.6 = langsam) · opt.beiStart: wird gerufen, wenn die Stimme wirklich anfängt
  App.sag = (text, opt = {}) => new Promise((fertig) => {
    if (!("speechSynthesis" in window) || !text) return fertig();
    const nr = ++sprechNr;
    // Was gerade gesprochen wird, bricht ab. Ausnahme: die allererste Ansage direkt nach dem stummen
    // „Entsperren“ (App.audio.entsperre). Dort läuft noch nichts Echtes, und Firefox lässt die Ansage
    // fallen, wenn unmittelbar vorher abgebrochen wird. Sie reiht sich dann einfach hinter die Stille ein.
    const ohneAbbruch = !App.spricht() && performance.now() < leerBis;
    sprichtBis = Infinity;
    if (!ohneAbbruch) { try { speechSynthesis.cancel(); } catch (_) {} }
    if (!stimmen.length) App.ladeStimmen();
    let zu = false, gestartet = false;
    const ende = () => { if (!zu) { zu = true; if (nr === sprechNr) sprichtBis = performance.now() + 350; fertig(); } };
    const sprich = () => {
      const u = new SpeechSynthesisUtterance(sprechtext(text));
      u.lang = "de-DE";
      const v = stimmen.find((s) => s.name === App.stand.einst.stimme) || stimmen[0];
      if (v) u.voice = v;
      u.rate = Math.max(0.3, (+App.stand.einst.sprechtempo || 0.85) * (opt.tempo || 1));
      u.onstart = () => { gestartet = true; if (opt.beiStart) opt.beiStart(); };
      u.onend = () => { if (u === haltU) ende(); };
      u.onerror = (e) => {                               // „interrupted“ beim schnellen Weitertippen ist harmlos
        if (u !== haltU) return;
        if (e && e.error && !/interrupted|cancell?ed/.test(e.error)) App.log(`Sprachausgabe: Fehler „${e.error}“ bei „${text.slice(0, 30)}“`, "w");
        ende();
      };
      haltU = u;                                         // Referenz halten, sonst geht onend manchmal verloren
      try { speechSynthesis.speak(u); } catch (_) { ende(); }
    };
    setTimeout(ende, (2500 + text.length * 120) / (opt.tempo || 1));   // falls onend ausbleibt
    const wache = setInterval(() => { if (zu || nr !== sprechNr) { clearInterval(wache); ende(); } }, 150);
    sprich();
    // Rückfall: Kommt die Ansage nicht in Gang (die Warteschlange hängt), abbrechen und noch einmal sprechen
    if (ohneAbbruch) setTimeout(() => {
      if (zu || gestartet || nr !== sprechNr) return;
      App.log("Sprachausgabe kam nicht in Gang, zweiter Versuch", "w");
      haltU = null;
      try { speechSynthesis.cancel(); } catch (_) {}
      sprich();
    }, 900);
  });

  // Spricht ein Wort langsam als Ganzes und meldet dabei Silbe für Silbe (beiSilbe(i)), z. B. für Silbenbögen.
  // Einzeln gesprochene Silben klingen mit der Computerstimme falsch („te“ wie „Tee“, „Ti“ wie englisch);
  // im ganzen Wort stimmt die Aussprache. Wann welche Silbe dran ist, wird geschätzt und an der gemessenen
  // Sprechdauer nachgeführt. Mit eigenen Aufnahmen (Wort in Silben gesprochen) wird das später ersetzt.
  let silbenZeit = 0.6;                                // Sekunden je Silbe beim langsamen Sprechen (Startwert, wird nachgeführt)
  App.sagSilben = (silben, beiSilbe) => new Promise((fertig) => {
    const n = silben.length;
    let beginn = 0, echt = false, i = 0, uhr = 0, zu = false;
    const weiter = () => {
      if (zu || i >= n) return;
      beiSilbe(i++);
      uhr = setTimeout(weiter, silbenZeit * 1000);
    };
    const los = (vonStimme) => { if (!beginn) { beginn = performance.now(); echt = !!vonStimme; weiter(); } };
    const not = setTimeout(() => los(false), 700);     // die Stimme meldet ihren Anfang nicht (oder fehlt)
    App.sag(silben.join(""), { tempo: n > 1 ? 0.6 : 1, beiStart: () => los(true) }).then(() => {
      clearTimeout(not); clearTimeout(uhr);
      if (echt && n > 1) {
        const gemessen = (performance.now() - beginn) / 1000 / n;
        if (gemessen > 0.15 && gemessen < 1.2) silbenZeit = (silbenZeit + gemessen) / 2;
      }
      zu = true;
      while (i < n) beiSilbe(i++);                     // die Stimme war schneller als geschätzt
      fertig();
    });
  });

  /* ---------- Töne auf dem iPad (Web Audio) ---------- */
  let ac = null;
  // Zwitscher-Klänge wie bei einem kleinen Filmroboter: kurze Pfiffe, die in der Tonhöhe gleiten
  // Jeder Eintrag: [von Hz, bis Hz, Dauer in s]
  const KLAENGE = {
    tipp: [[1400, 2100, 0.05]],
    strich: [[1200, 1900, 0.05], [2000, 2700, 0.07]],
    neugierig: [[900, 1500, 0.07], [1600, 1100, 0.05], [1300, 2500, 0.13]],
    staunen: [[1500, 2600, 0.08], [2600, 1800, 0.05], [2000, 3100, 0.12]],
    richtig: [[1300, 2200, 0.06], [2400, 1700, 0.05], [1900, 2900, 0.06], [1500, 2300, 0.05], [2600, 3300, 0.14]],
    nochmal: [[720, 540, 0.14], [500, 300, 0.26]],
    feier: [[1200, 2000, 0.06], [2200, 1500, 0.05], [1700, 2700, 0.06], [2900, 2100, 0.05], [1400, 2400, 0.06],
            [2500, 1800, 0.05], [2000, 3000, 0.07], [1600, 2600, 0.06], [1200, 3400, 0.32]],
    rakete: [[260, 520, 0.25], [520, 1100, 0.3], [1100, 2600, 0.5]],
  };
  function zirp(von, bis, dauer, ab, laut = 0.13) {
    if (!ac) return;
    try {
      const t = ac.currentTime + ab;
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(von, t);
      o.frequency.exponentialRampToValueAtTime(bis, t + dauer);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(laut, t + 0.008);
      g.gain.setValueAtTime(laut, t + Math.max(0.01, dauer - 0.015));
      g.gain.linearRampToValueAtTime(0.0001, t + dauer);
      o.connect(g); g.connect(ac.destination);
      o.start(t); o.stop(t + dauer + 0.03);
    } catch (_) {}
  }
  App.audio = {
    kontext: () => ac,
    // Muss aus einer Berührung heraus aufgerufen werden (iOS gibt Ton und Sprache sonst nicht frei)
    entsperre() {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!ac && AC) ac = new AC();
        if (ac && ac.state === "suspended") ac.resume();
      } catch (e) { App.log(`Ton nicht verfügbar: ${MBot.hilfen.errText(e)}`, "w"); }
      try {
        // Stumme Ansage in der Berührung: Danach darf die Stimme auch ohne Berührung sprechen (iPad)
        if ("speechSynthesis" in window) { const u = new SpeechSynthesisUtterance(" "); u.volume = 0; speechSynthesis.speak(u); leerBis = performance.now() + 500; }
      } catch (_) {}
    },
    ton(freq, dauer, ab = 0, laut = 0.16) {
      if (!ac) return;
      try {
        const t = ac.currentTime + ab;
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = "triangle"; o.frequency.value = freq;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(laut, t + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dauer);
        o.connect(g); g.connect(ac.destination);
        o.start(t); o.stop(t + dauer + 0.03);
      } catch (_) {}
    },
    klang(name) {
      let t = 0;
      for (const [von, bis, d] of KLAENGE[name] || []) { zirp(von, bis, d, t); t += d + 0.025; }
    },
  };

  /* ---------- Klatschen erkennen (für das Silben-Spiel) ----------
   * Quelle laut Elternbereich: "ipad" (Mikrofon des iPads, braucht die Erlaubnis des Browsers) oder
   * "roboter" (Lautstärke-Sensor des CyberPi, wird über Bluetooth abgefragt). Erkannt wird ein kurzer, lauter Knall:
   * Pegel über der Schwelle und deutlich über dem Grundgeräusch, mindestens 320 ms nach dem letzten.
   * Während das iPad spricht, wird nicht gehört. sperre() verhindert, dass der eigene Ton mitgezählt wird.
   */
  App.klatschen = (() => {
    let strom = null, uhr = 0, hoerer = null, mittel = 0.02, letzter = 0, lauf = 0, zahl = 0, spitze = 0;
    const K = { pegel: 0, quelle: "aus" };
    function pruefe(pegel) {
      const jetzt = performance.now();
      K.pegel = pegel;
      spitze = Math.max(spitze, pegel);
      const schwelle = Math.max(+App.stand.einst.klatschSchwelle || 0.35, mittel * 3);
      if (pegel > schwelle && jetzt > letzter && !App.spricht()) {
        letzter = jetzt + 320;
        zahl++;
        App.log(`Klatschen erkannt (Pegel ${Math.round(pegel * 100)}, Schwelle ${Math.round(schwelle * 100)})`);
        if (hoerer) { try { hoerer(); } catch (_) {} }
      }
      mittel = mittel * 0.95 + Math.min(pegel, 0.3) * 0.05;
    }
    async function starteIpad() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error("Dieser Browser gibt das Mikrofon nicht frei");
      if (!ac) App.audio.entsperre();
      if (!strom) strom = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      const analyser = ac.createAnalyser();
      analyser.fftSize = 512;
      ac.createMediaStreamSource(strom).connect(analyser);
      const buf = new Uint8Array(analyser.fftSize);
      uhr = setInterval(() => {
        analyser.getByteTimeDomainData(buf);
        let max = 0;
        for (let i = 0; i < buf.length; i++) max = Math.max(max, Math.abs(buf[i] - 128) / 128);
        pruefe(max);
      }, 25);
    }
    async function starteRoboter(mein) {
      if (!MBot.verbunden()) throw new Error("Roboter nicht verbunden");
      await MBot.lautstaerke();   // antwortet der Sensor überhaupt?
      (async () => {
        while (mein === lauf && MBot.verbunden()) {
          try { pruefe((await MBot.lautstaerke()) / 100); } catch (_) {}
          await App.warte(8);
        }
      })();
    }
    /* Liefert true, wenn gehört wird. fn wird bei jedem erkannten Klatschen aufgerufen.
     * Einstellung „auto“: Ist der Roboter verbunden, hört sein Mikrofon, sonst das des iPads. */
    K.starte = async (fn) => {
      K.stoppe();
      const wahl = App.stand.einst.klatschen || "auto";
      K.quelle = wahl === "auto" ? (MBot.verbunden() ? "roboter" : "ipad") : wahl;
      if (K.quelle === "aus") return false;
      hoerer = fn; mittel = 0.02; zahl = 0; spitze = 0; letzter = 0;
      const mein = ++lauf;
      try {
        if (K.quelle === "ipad") await starteIpad(); else await starteRoboter(mein);
        App.log(`Klatschen: höre über ${K.quelle === "ipad" ? "das iPad-Mikrofon" : "das Roboter-Mikrofon"}`);
        return true;
      } catch (e) {
        App.log(`Klatschen erkennen geht nicht (${K.quelle}): ${MBot.hilfen.errText(e)}`, "w");
        K.stoppe();
        K.quelle = "aus";
        return false;
      }
    };
    K.stoppe = () => {
      if (hoerer) App.log(`Klatschen: beendet, ${zahl} erkannt, höchster Pegel ${Math.round(spitze * 100)}`);
      hoerer = null; lauf++;
      clearInterval(uhr); uhr = 0;
      if (strom) { try { strom.getTracks().forEach((t) => t.stop()); } catch (_) {} strom = null; }
      K.pegel = 0;
    };
    // Für ms Millisekunden nichts zählen (z. B. solange der Roboter selbst piept oder fährt)
    K.sperre = (ms = 350) => { letzter = Math.max(letzter, performance.now() + ms); };
    return K;
  })();

  /* ---------- Eigene Laut-Aufnahmen (audio/laute/m.m4a usw.) ----------
   * Fehlt eine Aufnahme, meldet spiele() false und die Aufgabe weicht auf die Sprachausgabe aus.
   * Als lokale Datei (file://) kann der Browser die Aufnahmen nicht laden; über GitHub Pages geht es.
   */
  const puffer = {};   // "m" → Promise<AudioBuffer|null>
  let quelle = null;
  function ladeLaut(b) {
    const k = String(b).toLowerCase();
    if (!(k in puffer)) {
      puffer[k] = (async () => {
        if (!ac || location.protocol === "file:") return null;
        for (const endung of ["m4a", "mp3", "wav"]) {
          try {
            const r = await fetch(`audio/laute/${encodeURIComponent(k)}.${endung}`);
            if (!r.ok) continue;
            const roh = await r.arrayBuffer();
            const buf = await new Promise((ok, nein) => ac.decodeAudioData(roh, ok, nein));
            App.log(`Aufnahme gefunden: ${k}.${endung}`);
            return buf;
          } catch (_) {}
        }
        return null;
      })();
    }
    return puffer[k];
  }
  App.laut = {
    vorhanden: async (b) => !!(await ladeLaut(b)),
    spiele: async (b) => {
      const buf = await ladeLaut(b);
      if (!buf || !ac) return false;
      App.laut.stopp();
      await new Promise((fertig) => {
        const q = ac.createBufferSource();
        q.buffer = buf; q.connect(ac.destination);
        q.onended = fertig;
        setTimeout(fertig, buf.duration * 1000 + 400);
        quelle = q; q.start();
      });
      return true;
    },
    stopp() { try { if (quelle) quelle.stop(); } catch (_) {} quelle = null; },
  };

  // Sprache und Aufnahmen sofort abbrechen
  App.still = () => {
    sprechNr++; sprichtBis = performance.now() + 250;
    try { if ("speechSynthesis" in window) speechSynthesis.cancel(); } catch (_) {}
    App.laut.stopp();
  };

  /* ---------- SVG-Pfad in Punkte zerlegen (für Nachspuren, später auch fürs Roboter-Display) ---------- */
  App.pfadPunkte = (d, abstand) => {
    const p = App.$("#messpfad");
    p.setAttribute("d", d);
    const lang = p.getTotalLength();
    const n = Math.max(1, Math.round(lang / abstand));
    const punkte = [];
    for (let i = 0; i <= n; i++) { const q = p.getPointAtLength(lang * i / n); punkte.push([q.x, q.y]); }
    return punkte;
  };
})();

// Die Rakete des Kindes aus der Raketenhalle (Spielstand „halle“); ohne Umbau ist es die einfache Rakete.
// Sie steht an der Raketenstation, startet beim Countdown und fliegt zu den Planeten (seit v0.25).
App.meineRakete = () => {
  const a = App.stand.halle || {}, zahl = (x, n) => (Number.isInteger(x) && x >= 0 && x < n ? x : 0);
  return { spitze: zahl(a.spitze, 4), rumpf: zahl(a.rumpf, 3), unten: zahl(a.unten, 4), farbe: zahl(a.farbe, 5) };
};
