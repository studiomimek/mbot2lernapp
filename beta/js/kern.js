/* kern.js – Grundgerüst der App: Namensraum, Protokoll, Speicher, Sprache, Töne, Aufnahmen */
"use strict";

const App = { VERSION: "0.7.0", inhalt: {}, aufgaben: {}, bilder: {} };

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

  /* ---------- Speicher (localStorage, ein Gerät) ---------- */
  const SCHLUESSEL = "mbot2-lernapp-stand-v1";
  const standard = () => ({
    ort: null,                                    // zuletzt besuchter Ort
    fund: { muschel: 0, seestern: 0, perle: 0, stern: 0, planet: 0, rakete: 0 },   // Fundstücke in der Schatzkiste
    entdeckt: {},                                 // gefundene Entdeckungen in der Welt
    buchstaben: {},                               // "M": { richtig, fehler, gespurt }
    zahlen: {},                                   // "7": { richtig, fehler }
    mengenStufe: 0, plusStufe: 0, reiheStufe: 0,
    // buchstaben: null = Vorgabe aus inhalt/buchstaben.js, sonst die im Elternbereich gewählte Liste
    einst: { bewegung: true, tempo: 50, lautstaerke: 60, stimme: "", sprechtempo: 0.85, buchstaben: null },
  });
  function lade() {
    const s = standard();
    try {
      const roh = JSON.parse(localStorage.getItem(SCHLUESSEL) || "null");
      if (roh && typeof roh === "object") {
        for (const k of Object.keys(s)) {
          if (!(k in roh)) continue;
          if (s[k] && typeof s[k] === "object") Object.assign(s[k], roh[k]); else s[k] = roh[k];
        }
      }
    } catch (_) {}
    return s;
  }
  App.stand = lade();
  App.speichere = () => { try { localStorage.setItem(SCHLUESSEL, JSON.stringify(App.stand)); } catch (_) {} };
  App.loescheFortschritt = () => {
    const einst = App.stand.einst;
    App.stand = standard();
    App.stand.einst = einst;
    App.speichere();
  };
  // Buchstaben, die gerade geübt werden (mindestens drei, sonst gilt die Vorgabe)
  App.buchstabenAktiv = () => {
    const BU = App.inhalt.buchstaben;
    const liste = (App.stand.einst.buchstaben || BU.aktiv).filter((b) => BU.zeichen[b]);
    return liste.length >= 3 ? liste : BU.aktiv.slice();
  };

  // Zähler für einen Buchstaben oder eine Zahl
  App.merke = (bereich, schluessel, feld) => {
    const b = App.stand[bereich];
    const e = b[schluessel] || (b[schluessel] = {});
    e[feld] = (e[feld] || 0) + 1;
    App.speichere();
  };

  /* ---------- Sprachausgabe (Web Speech API) ---------- */
  let stimmen = [], sprechNr = 0, haltU = null;
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
  App.sag = (text) => new Promise((fertig) => {
    if (!("speechSynthesis" in window) || !text) return fertig();
    const nr = ++sprechNr;
    try { speechSynthesis.cancel(); } catch (_) {}
    if (!stimmen.length) App.ladeStimmen();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "de-DE";
    const v = stimmen.find((s) => s.name === App.stand.einst.stimme) || stimmen[0];
    if (v) u.voice = v;
    u.rate = +App.stand.einst.sprechtempo || 0.85;
    let zu = false;
    const ende = () => { if (!zu) { zu = true; fertig(); } };
    u.onend = ende;
    u.onerror = ende;                                   // „interrupted“ beim schnellen Weitertippen ist harmlos
    setTimeout(ende, 2500 + text.length * 120);          // falls onend ausbleibt
    const wache = setInterval(() => { if (zu || nr !== sprechNr) { clearInterval(wache); ende(); } }, 150);
    haltU = u;                                           // Referenz halten, sonst geht onend manchmal verloren
    try { speechSynthesis.speak(u); } catch (_) { ende(); }
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
    // Muss aus einer Berührung heraus aufgerufen werden (iOS gibt Ton und Sprache sonst nicht frei)
    entsperre() {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!ac && AC) ac = new AC();
        if (ac && ac.state === "suspended") ac.resume();
      } catch (e) { App.log(`Ton nicht verfügbar: ${MBot.hilfen.errText(e)}`, "w"); }
      try {
        if ("speechSynthesis" in window) { const u = new SpeechSynthesisUtterance(" "); u.volume = 0; speechSynthesis.speak(u); }
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
    sprechNr++;
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
