/* welt.js – zeigt einen Ort und lässt die Spielfigur dem Finger folgen
 *
 * Die Figur fährt dorthin, wo der Finger ist (antippen oder ziehen). Sie löst aus:
 *   Einstieg     Aufgabe startet, wenn die Figur darauf stehen bleibt (oder 0,6 s darüberfährt)
 *   Rand         Fährt die Figur an den Bildrand und der Finger zeigt dorthin, öffnet sich nach kurzem
 *                Verweilen der Nachbarort; das Bild schiebt sich weiter
 *   Tor          Durchgang zu einem Ort, der nicht nebenan liegt (z. B. Tür in die Rakete). Die Anlegestelle der
 *                Fähre öffnet die Seekarte, der Abflug im Weltraum die Sternenkarte (beide in js/app.js)
 *   Werkstatt    der Krebs-Mechaniker: zeigt seine Baupläne und was noch fehlt (App.werkstatt in js/app.js)
 *   Versteck     blinkendes Werkzeug-Zeichen: Die Figur bleibt stehen, nimmt das Werkzeug in den Arm und findet etwas
 * Braucht ein Ort ein Bauteil, das die Figur noch nicht hat, bleiben Rand oder Tor dorthin zu.
 * Eine Zone wird erst „scharf“, wenn die Figur einmal draußen war.
 * Hat der Ort eine Spurfarbe („spur“ in inhalt/welt.js), hinterlässt die Figur Fahrspuren, die langsam verblassen.
 */
"use strict";

(() => {
  const { $ } = App;
  const B = App.bilder;
  const TEMPO = 420;                 // Pixel pro Sekunde
  const HALB_B = 50, HALB_H = 43;    // halbe Größe der Spielfigur
  const FIGUR_MASS = 0.8;            // Einstiege werden etwas kleiner gezeichnet als in den Daten („breite“)
  const VERWEILEN = 600;             // so lange muss die Figur beim Durchfahren auf einem Einstieg bleiben (ms)
  const RAND_WARTEN = 300;           // so lange am Rand, bis der Nachbarort aufgeht (ms)
  const RAND = 16;                   // so nah am Rand gilt als „am Rand“ (Pixel)
  const MITFAHR_TEMPO = 25;          // Motorleistung, mit der der echte Roboter in der Welt mitfährt (langsam)
  const GEGEN = { oben: "unten", unten: "oben", links: "rechts", rechts: "links" };
  const SPUR_HALB = 25;              // halber Abstand der beiden Radspuren: So weit stehen die Räder der Figur auseinander
  const SPUR_FLACH = 0.4;            // die Welt ist schräg von oben gesehen: Abstände in die Tiefe erscheinen kürzer
  const SPUR_DREH = 10;              // so schnell dreht sich die Richtung der Spur mit (Bogenmaß pro Sekunde)
  const SPUR_FEIN = 2;               // die Zeichenfläche der Spuren ist doppelt so fein wie die Bühne (scharfe Linien)
  const SPUR_TAKT = 400;             // alle so viele ms verblassen die Spuren ein wenig

  let ortId = "", ort = null, pos = { x: 512, y: 540 }, ziel = null, zielRoh = null, zonen = [];
  let lauf = 0, fingerUnten = false, gesperrt = true, eingerichtet = false;
  let spur = null, spurAlt = null, spurTakt = 0, spurBis = 0;   // Zeichenfläche der Fahrspuren, letzte Radstellen
  let spurPos = { x: 0, y: 0 }, spurZeit = 0, spurKraft = 0;    // letzte Stelle der Figur, Zeitpunkt, Stärke der Spur (0 bis 1)
  let spurWinkel = null;                                        // Richtung, in der die Räder gerade stehen (null = noch keine)

  const ortVon = (id) => {
    const W = App.inhalt.welt;
    return W.orte[id] && !W.orte[id].bald ? id : W.start;
  };
  const grenzen = () => ({ x0: HALB_B, x1: 1024 - HALB_B, y0: (ort && ort.boden) || 150, y1: 716 });
  const begrenze = (p) => {
    const g = grenzen();
    return { x: Math.max(g.x0, Math.min(g.x1, p.x)), y: Math.max(g.y0, Math.min(g.y1, p.y)) };
  };
  const amRand = (richtung, p, spiel = RAND) => {
    const g = grenzen();
    return richtung === "links" ? p.x <= g.x0 + spiel : richtung === "rechts" ? p.x >= g.x1 - spiel
      : richtung === "oben" ? p.y <= g.y0 + spiel : p.y >= g.y1 - spiel;
  };
  const kreis = (x, y, r) => (p) => Math.hypot(p.x - x, p.y - y) <= r;

  function setze() {
    const r = $("#welt-rover");
    if (r) r.style.transform = `translate(${(pos.x - HALB_B).toFixed(1)}px, ${(pos.y - HALB_H).toFixed(1)}px)`;
    const m = $("#welt-ziel");
    if (m) {
      const zeigen = ziel && Math.hypot(ziel.x - pos.x, ziel.y - pos.y) > 30;
      m.style.display = zeigen ? "block" : "none";
      if (zeigen) m.style.transform = `translate(${ziel.x - 18}px, ${ziel.y - 18}px)`;
    }
  }

  // Fahrspuren: zwei Linien links und rechts der Fahrtrichtung auf Höhe der Räder.
  // Langsame Fahrt (die Figur folgt dem Finger dicht) hinterlässt eine zarte Spur, schnelle Fahrt eine kräftige.
  // Seit v0.27.2 folgen die Spuren der Figur genauer: Die Richtung der Räder (spurWinkel) dreht sich der
  // Fahrtrichtung nach, statt bei jedem Richtungswechsel zu springen, und zwischen zwei Bildern wird in kleinen
  // Teilschritten gemalt. So werden Ecken zu Bögen, und die Spuren kreuzen sich in Kurven nicht mehr. Der Abstand
  // der Spuren passt zu den Rädern der Figur. (Auf dem Malplatz der Malinsel sind die Spuren noch genauer, dort
  // fährt die Figur wie ein Fahrzeug: js/aufgaben/malen.js.)
  function zeichneSpur(dt, jetzt) {
    if (jetzt < spurBis && jetzt - spurTakt > SPUR_TAKT) {
      spurTakt = jetzt;
      spur.globalCompositeOperation = "destination-out";
      spur.fillStyle = "rgba(0, 0, 0, .07)";
      spur.fillRect(0, 0, 1024, 768);
      spur.globalCompositeOperation = "source-over";
    }
    const von = spurPos, dx = pos.x - von.x, dy = pos.y - von.y, d = Math.hypot(dx, dy);
    // Steht die Figur, ruht die Spur. Fährt sie wieder los, geht es an denselben Radstellen weiter: Die Räder drehen
    // sich dann aus ihrer alten Richtung in die neue, und die Spuren hängen auch nach einem Halt zusammen.
    if (d < 0.5 || dt <= 0) return;
    spurPos = { x: pos.x, y: pos.y }; spurZeit = jetzt;
    if (d > 60) { spurAlt = null; spurWinkel = null; return; }                        // Sprung an einen anderen Platz
    spurKraft += (Math.min(1, d / dt / TEMPO) - spurKraft) * 0.3;                     // 0 = sehr langsam, 1 = volle Fahrt
    // Die Räder drehen sich in die Fahrtrichtung, höchstens SPUR_DREH. Vorwärts und rückwärts sind für die Spur
    // dasselbe (die Figur wendet nicht, sie fährt zurück), deshalb zählt die Richtung nur bis 180 Grad.
    const hin = Math.atan2(dy, dx), w0 = spurWinkel == null ? hin : spurWinkel;
    let diff = Math.atan2(Math.sin(hin - w0), Math.cos(hin - w0));
    if (diff > Math.PI / 2) diff -= Math.PI; else if (diff < -Math.PI / 2) diff += Math.PI;
    const dreh = Math.max(-SPUR_DREH * dt, Math.min(SPUR_DREH * dt, diff));
    spurWinkel = w0 + dreh;
    // Radstellen unterwegs: t = 0 an der alten Stelle, t = 1 an der neuen
    const raeder = (t) => {
      const w = w0 + dreh * t, fx = von.x + dx * t, fy = von.y + dy * t + HALB_H - 8;
      const qx = -Math.sin(w) * SPUR_HALB, qy = Math.cos(w) * SPUR_HALB * SPUR_FLACH;
      return [fx + qx, fy + qy, fx - qx, fy - qy];
    };
    const n = Math.max(1, Math.ceil(Math.max(d / 4, Math.abs(dreh) / 0.1)));
    let alt = spurAlt || raeder(0);
    spur.globalAlpha = 0.25 + 0.75 * spurKraft;
    spur.lineWidth = 4 + 4.5 * spurKraft;
    spur.beginPath();
    for (let k = 1; k <= n; k++) {
      const neu = raeder(k / n);
      spur.moveTo(alt[0], alt[1]); spur.lineTo(neu[0], neu[1]);
      spur.moveTo(alt[2], alt[3]); spur.lineTo(neu[2], neu[3]);
      alt = neu;
    }
    spur.stroke();
    spur.globalAlpha = 1;
    spurBis = jetzt + 45000;         // danach ist alles verblasst, dann ruht die Zeichenfläche
    spurAlt = alt;
  }

  // Unter Wasser („blasen“ am Ort): Beim Fahren steigen über der Figur kleine Luftblasen auf
  let blaseZuletzt = 0;
  function blase() {
    const el = document.createElement("i"), g = 8 + Math.random() * 13;
    el.className = "blase";
    el.style.cssText = `left:${(pos.x - 22 + Math.random() * 44).toFixed(0)}px;top:${(pos.y - HALB_H - 14).toFixed(0)}px;width:${g.toFixed(0)}px;height:${g.toFixed(0)}px`;
    $("#welt").appendChild(el);
    setTimeout(() => el.remove(), 1600);
  }

  // Im Weltraum („duesen“ am Ort): Die Figur schwebt und steuert mit kleinen Luftdüsen. Solange sie fährt, stoßen
  // die Düsen Luft aus, immer entgegen der Fahrtrichtung (rx, ry): Der Stoß beginnt am Rand ihrer Blase und zieht weg.
  let dueseZuletzt = 0;
  function duese(rx, ry) {
    const el = document.createElement("i"), g = 9 + Math.random() * 9, quer = (Math.random() - 0.5) * 30;
    el.className = "duese";
    el.style.cssText = `left:${(pos.x - rx * 62 - ry * quer).toFixed(0)}px;top:${(pos.y - ry * 62 + rx * quer).toFixed(0)}px;width:${g.toFixed(0)}px;height:${g.toFixed(0)}px;--dx:${(-rx * 64).toFixed(0)}px;--dy:${(-ry * 64).toFixed(0)}px`;
    $("#welt").appendChild(el);
    setTimeout(() => el.remove(), 700);
  }

  // Finger auf der Welt: dorthin soll die Figur fahren
  function richteEin() {
    if (eingerichtet) return;
    eingerichtet = true;
    const schicht = $("#welt");
    const finger = (ev) => {
      if (gesperrt) return;
      const r = schicht.getBoundingClientRect();
      zielRoh = { x: (ev.clientX - r.left) * 1024 / r.width, y: (ev.clientY - r.top) * 768 / r.height };
      ziel = begrenze(zielRoh);
    };
    schicht.addEventListener("pointerdown", (ev) => { fingerUnten = true; finger(ev); });
    schicht.addEventListener("pointermove", (ev) => { if (fingerUnten) finger(ev); });
    for (const n of ["pointerup", "pointercancel", "pointerleave"]) schicht.addEventListener(n, () => { fingerUnten = false; });
  }

  function baue(klasse, x, y, breite, html) {
    const el = document.createElement("div");
    el.className = klasse;
    el.style.left = `${x}px`; el.style.top = `${y}px`;
    if (breite) el.style.width = `${breite}px`;
    el.innerHTML = html;
    $("#welt").appendChild(el);
    return el;
  }

  /* opt.von:    Seite, an der die Figur hereinkommt („links“ = sie kommt vom linken Rand)
   * opt.pos:    Stelle, an der sie den alten Ort verlassen hat (damit sie auf gleicher Höhe ankommt)
   * opt.bei:    Name des Einstiegs, neben dem die Figur stehen soll (nach einer Aufgabe)
   * opt.aus:    Ort, aus dem sie durch ein Tor kommt (sie steht dann neben dem Tor dorthin zurück)
   * opt.rein:   Art der Einblendung (Richtung oder „tor“)
   * opt.ansage: wird gesprochen */
  function zeige(id, opt = {}) {
    id = ortVon(id);
    const W = App.inhalt.welt;
    ortId = id; ort = W.orte[id];
    richteEin();
    const schicht = $("#welt");
    schicht.className = `schicht ort-${id} rein-${opt.rein || "start"}`;
    schicht.innerHTML = `<div class="ort-bild">${ort.male ? ort.male() : B[ort.bild]()}</div>${ort.spur ? `<canvas id="welt-spur" width="${1024 * SPUR_FEIN}" height="${768 * SPUR_FEIN}"></canvas>` : ""}`;
    const flaeche = $("#welt-spur");
    spur = flaeche ? flaeche.getContext("2d") : null;
    spurAlt = null; spurWinkel = null; spurBis = 0; spurKraft = 0;
    if (spur) { spur.scale(SPUR_FEIN, SPUR_FEIN); spur.strokeStyle = ort.spur; spur.lineCap = "round"; spur.lineJoin = "round"; }
    zonen = [];
    const g = grenzen();

    for (const e of ort.einstiege || []) {
      const b = e.breite * FIGUR_MASS, r = Math.max(52, b * 0.34);
      const el = baue("einstieg", e.x, e.y, b, `<span class="einstieg-ring"></span>${B[e.figur]()}${B.zeichen(e)}`);   // Zeichenpaar: Fach und Fundstück
      zonen.push({ art: "einstieg", e, el, x: e.x, y: e.y + 6, r, drin: kreis(e.x, e.y + 6, r) });
    }
    for (const t of ort.tore || []) {
      // Abflug zu den Planeten: zu ist das Tor nur, wenn es dort noch gar nichts gibt (kein Tank, kein besuchter Planet)
      const zu = t.reise ? (App.reise.planeten().length ? null : App.reise.fehlt()) : t.faehre ? null : App.werkstatt.gesperrt(t.ziel);
      const el = baue(`einstieg tor${t.leuchtet ? " leuchtet" : ""}`, t.x, t.y, t.breite || 110, `<span class="einstieg-ring"></span>${B[t.figur]()}${zu ? `<span class="schloss">${B.schloss()}</span>` : ""}`);
      zonen.push({ art: "tor", t, zu, el, x: t.x, y: t.y, r: t.r || 52, drin: kreis(t.x, t.y, t.r || 52) });
    }
    for (const t of ort.treffen || []) {
      const el = baue("treffen", t.x, t.y, t.breite || 110, t.bild);
      zonen.push({ art: "treffen", t, el, drin: kreis(t.x, t.y, t.r || 80) });
    }
    // Verstecke: nur zu sehen, wenn die Figur das passende Werkzeug hat (und heute noch nicht geöffnet)
    for (const f of ort.entdeckungen || []) {
      if (!App.verstecke.sichtbar(f)) continue;
      const el = baue("versteck", f.x, f.y, 0, App.verstecke.werkzeugBild(f));
      zonen.push({ art: "versteck", f, el, drin: kreis(f.x, f.y, f.r || 54) });
    }
    if (ort.werkstatt) {
      const w = ort.werkstatt, b = w.breite * FIGUR_MASS, r = Math.max(52, b * 0.34);
      const el = baue("einstieg werkstatt", w.x, w.y, b, `<span class="einstieg-ring"></span>${B[w.figur]()}${App.werkstatt.abzeichen()}`);
      zonen.push({ art: "werkstatt", el, x: w.x, y: w.y + 6, r, drin: kreis(w.x, w.y + 6, r) });
    }
    for (const [richtung, zielId] of Object.entries(ort.nachbarn || {})) {
      const zielOrt = W.orte[zielId];
      if (!zielOrt) continue;
      const mitte = (g.y0 + g.y1) / 2;
      const [x, y] = { oben: [512, 40], unten: [512, 734], links: [36, mitte], rechts: [988, mitte] }[richtung];
      const zu = App.werkstatt.gesperrt(zielId);
      const el = baue(`pfeil${zielOrt.bald || zu ? " bald" : ""}`, x, y, 0, B.pfeil(richtung) + (zielOrt.bald || zu ? `<span class="schloss">${B.schloss()}</span>` : ""));
      zonen.push({ art: "rand", richtung, zielId, bald: !!zielOrt.bald, zu, el, drin: (p) => amRand(richtung, p) });
    }
    schicht.insertAdjacentHTML("beforeend", `<div id="welt-ziel"></div><div id="welt-rover" class="rover">${B.rover()}${
      ort.anbau && App.werkstatt.hat(ort.anbau) ? `<span class="anbau anbau-${ort.anbau}">${App.werkstatt.teilBild(ort.anbau)}</span>` : ""}${
      ort.duesen ? `<span class="duesen"><i></i><i></i><i></i><i></i></span>` : ""}</div>`);   // vier kleine Düsen am Rand der Blase

    // Startplatz der Figur
    let start = ort.rover || { x: 512, y: 540 };
    const neben = zonen.find((z) => (z.art === "einstieg" && z.e.id === opt.bei) || (z.art === "tor" && opt.aus && (z.t.ziel === opt.aus || (z.t.faehre && opt.aus === "faehre")))
      || (z.art === "werkstatt" && opt.bei === "werkstatt"));
    if (neben) start = (neben.t && neben.t.ankunft) || { x: neben.x, y: neben.y + neben.r + 62 };   // „ankunft“ am Tor: fester Platz
    else if (opt.von) {
      const p = opt.pos || start;
      start = opt.von === "links" ? { x: g.x0 + 120, y: p.y } : opt.von === "rechts" ? { x: g.x1 - 120, y: p.y }
        : opt.von === "oben" ? { x: p.x, y: g.y0 + 110 } : { x: p.x, y: g.y1 - 110 };
    }
    pos = begrenze(start);
    if (neben && neben.drin(pos)) pos = begrenze({ x: neben.x + neben.r + 70, y: neben.y });   // unten war kein Platz
    ziel = null; zielRoh = null; fingerUnten = false; gesperrt = false;
    for (const z of zonen) { z.scharf = !z.drin(pos); z.seit = 0; }   // erst scharf, wenn die Figur einmal draußen war
    spurPos = { x: pos.x, y: pos.y };
    setze();

    if (App.stand.ort !== id || !App.stand.besucht[id]) { App.stand.ort = id; App.stand.besucht[id] = 1; App.speichere(); }
    if (ort.licht) MBot.reaktion.licht(...ort.licht);
    MBot.reaktion.leere();
    if (opt.ansage) App.sag(opt.ansage);

    const meinLauf = ++lauf;
    let zuletzt = performance.now(), fuhr = false;
    function schritt(jetzt) {
      if (meinLauf !== lauf) return;
      const dt = Math.min(100, jetzt - zuletzt) / 1000;
      zuletzt = jetzt;
      let faehrt = false, rx = 0, ry = 0;
      if (ziel) {
        const dx = ziel.x - pos.x, dy = ziel.y - pos.y, d = Math.hypot(dx, dy), s = TEMPO * dt;
        if (d <= s) { pos = { x: ziel.x, y: ziel.y }; if (!fingerUnten) ziel = null; }
        else { pos.x += dx / d * s; pos.y += dy / d * s; faehrt = true; rx = dx / d; ry = dy / d; }
        setze();
      }
      const rover = $("#welt-rover");
      if (rover) rover.classList.toggle("faehrt", faehrt);
      if (spur) zeichneSpur(dt, jetzt);
      if (ort.blasen && faehrt && jetzt - blaseZuletzt > 170) { blaseZuletzt = jetzt; blase(); }
      if (ort.duesen && faehrt && jetzt - dueseZuletzt > 55) { dueseZuletzt = jetzt; duese(rx, ry); }
      // Der echte Roboter fährt langsam mit: nach oben = vorwärts, nach unten = rückwärts, seitlich = drehen
      if (App.stand.einst.mitfahren) {
        if (faehrt) MBot.fahre(-ry, rx * 0.8, MITFAHR_TEMPO);
        else if (fuhr) MBot.fahre(0, 0);
      }
      fuhr = faehrt;

      for (const z of zonen) {
        if (!z.drin(pos)) { z.scharf = true; z.seit = 0; z.el.classList.remove("nah"); continue; }
        if (!z.scharf) continue;
        // Am Rand zählt es nur, wenn der Finger wirklich zum Rand zeigt (sonst fährt man nur daran entlang)
        if (z.art === "rand" && !(zielRoh && amRand(z.richtung, zielRoh, 44))) { z.seit = 0; z.el.classList.remove("nah"); continue; }
        if (!z.seit) { z.seit = jetzt; z.el.classList.add("nah"); }
        const warten = z.art === "treffen" ? 0 : z.art === "rand" ? RAND_WARTEN : faehrt ? VERWEILEN : 120;
        if (jetzt - z.seit >= warten && loeseAus(z)) return;
      }
      App.naechstesBild(schritt);
    }
    App.naechstesBild(schritt);
  }

  // true = der Ort wird verlassen, die Schleife endet
  function loeseAus(z) {
    z.scharf = false; z.seit = 0;
    z.el.classList.remove("nah");
    if (z.art === "rand" && z.bald) {
      z.el.classList.remove("wackel"); void z.el.offsetWidth; z.el.classList.add("wackel");
      App.sag("Dort geht es bald weiter.");
      return false;
    }
    // Bewohner eines Planeten: hüpft und sagt etwas, die Figur fährt weiter
    if (z.art === "treffen") {
      z.el.classList.remove("froh"); void z.el.offsetWidth; z.el.classList.add("froh");
      App.audio.klang("staunen");
      MBot.reaktion.staunen();
      if (z.t.sag) App.sag(z.t.sag);
      return false;
    }
    // Versteck: Es öffnet sich und verschwindet für heute
    if (z.art === "versteck") { z.el.remove(); z.drin = () => false; entdecke(z.f); return false; }
    // Anlegestelle: Die Seekarte geht auf, dort wählt man das Ziel der Fähre
    if (z.art === "tor" && z.t.faehre) { halt(); App.audio.klang("neugierig"); App.faehre.oeffne(); return false; }
    // Abflug im Weltraum: Die Sternenkarte geht auf, dort wählt man einen besuchten oder den neuen Planeten
    if (z.art === "tor" && z.t.reise && !z.zu) { halt(); App.audio.klang("neugierig"); App.reise.oeffne(); return false; }
    // Werkstatt: Die Figur bleibt stehen, der Krebs zeigt sein Rezept (die Welt läuft darunter weiter)
    if (z.art === "werkstatt") { halt(); App.audio.klang("neugierig"); App.werkstatt.oeffne(); return false; }
    // Der Ort dahinter braucht ein Bauteil, das die Figur noch nicht hat
    if (z.zu) {
      z.el.classList.remove("wackel"); void z.el.offsetWidth; z.el.classList.add("wackel");
      const bild = baue("fundbild", pos.x, pos.y - 96, 96, App.werkstatt.teilBild(z.zu));
      setTimeout(() => bild.remove(), 2800);
      halt();
      App.werkstatt.sagSperre(z.zu);
      return false;
    }
    gesperrt = true; ziel = null; lauf++;
    MBot.fahre(0, 0);
    const rover = $("#welt-rover");
    if (rover) rover.classList.remove("faehrt");
    const W = App.inhalt.welt, schicht = $("#welt"), von = ortId, stelle = { x: pos.x, y: pos.y };
    if (z.art === "einstieg") {
      App.audio.klang("neugierig");
      z.el.classList.add("gewaehlt");
      setTimeout(() => App.starteAufgabe(z.e), 350);
    } else if (z.art === "rand") {
      // Führt ein Spiel dieses Ortes zum Nachbarn (Countdown → Weltraum), startet am Rand dieses Spiel
      const spiel = (ort.einstiege || []).find((e) => e.inhalt && e.inhalt.ziel === z.zielId);
      if (spiel) { App.audio.klang("neugierig"); setTimeout(() => App.starteAufgabe(spiel), 250); return true; }
      App.audio.klang("tipp");
      schicht.classList.add(`raus-${z.richtung}`);
      setTimeout(() => zeige(z.zielId, { von: GEGEN[z.richtung], pos: stelle, rein: z.richtung, ansage: W.orte[z.zielId].ansage }), 220);
    } else {
      App.audio.klang("neugierig");
      schicht.classList.add("raus-tor");
      setTimeout(() => zeige(z.t.ziel, { aus: von, rein: "tor", ansage: z.t.ansage || W.orte[z.t.ziel].ansage }), 260);
    }
    return true;
  }

  // Versteck öffnen: Die Figur bleibt stehen und nimmt das Werkzeug in den Arm. Sie gräbt (Schaufel), greift nach
  // oben (Greifarm) oder schaut hindurch (Fernrohr). Danach taucht das Gefundene auf und ein Satz wird gesprochen.
  function entdecke(f) {
    halt();
    gesperrt = true;                                   // solange sie arbeitet, fährt die Figur nicht weiter
    const meinLauf = lauf, rover = $("#welt-rover");
    if (rover) {
      rover.classList.remove("faehrt");
      rover.insertAdjacentHTML("beforeend", `<span class="arm arm-${f.werkzeug} tut">${App.verstecke.armBild(f)}</span>`);
    }
    // Schaufel: Neben der Figur entsteht ein kleines Loch
    const loch = f.werkzeug === "schaufel" ? baue("grabloch", pos.x + 56, pos.y + 44, 0, "") : null;
    App.audio.klang("strich");
    MBot.reaktion.staunen();
    setTimeout(() => {
      const arm = rover && $(".arm", rover);
      if (arm) arm.remove();
      if (meinLauf !== lauf) return;                   // der Ort wurde inzwischen verlassen: Das Versteck bleibt zu
      gesperrt = false;
      App.audio.klang("staunen");
      const ding = baue(`fundbild${f.werkzeug === "fernrohr" ? " blick" : ""}`, f.bei.x, f.bei.y, f.breite || 90, B[f.zeigt]());
      if (f.farbe) ding.style.color = f.farbe;
      setTimeout(() => { ding.remove(); if (loch) loch.remove(); }, 2800);
      if (f.sag) App.sag(f.sag);
      App.verstecke.gefunden(f);
    }, 1350);
  }

  // Wird aufgerufen, wenn die Welt verdeckt wird (z. B. Elternbereich): Figur bleibt stehen
  function halt() { ziel = null; zielRoh = null; fingerUnten = false; MBot.fahre(0, 0); }

  // Tauscht nur das Bild des Ortes aus (z. B. wenn die große Rakete wächst); Figur und Zonen bleiben
  function bild(html) { const el = $("#welt .ort-bild"); if (el) el.innerHTML = html; }

  App.welt = { zeige, halt, bild };
})();
