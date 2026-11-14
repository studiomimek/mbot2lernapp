/* welt.js – zeigt einen Ort und lässt die Spielfigur dem Finger folgen
 *
 * Die Figur fährt dorthin, wo der Finger ist (antippen oder ziehen). Sie löst aus:
 *   Einstieg     Aufgabe startet, wenn die Figur darauf stehen bleibt (oder 0,6 s darüberfährt)
 *   Rand         Fährt die Figur an den Bildrand und der Finger zeigt dorthin, öffnet sich nach kurzem
 *                Verweilen der Nachbarort; das Bild schiebt sich weiter
 *   Tor          Durchgang zu einem Ort, der nicht nebenan liegt (z. B. Tür in die Rakete)
 *   Entdeckung   funkelnde Stelle, löst sofort aus
 * Eine Zone wird erst „scharf“, wenn die Figur einmal draußen war.
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

  let ortId = "", ort = null, pos = { x: 512, y: 540 }, ziel = null, zielRoh = null, zonen = [];
  let lauf = 0, fingerUnten = false, gesperrt = true, eingerichtet = false;

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
    schicht.innerHTML = `<div class="ort-bild">${B[ort.bild]()}</div>`;
    zonen = [];
    const g = grenzen();

    for (const e of ort.einstiege || []) {
      const b = e.breite * FIGUR_MASS, r = Math.max(52, b * 0.34);
      const el = baue("einstieg", e.x, e.y, b, `<span class="einstieg-ring"></span>${B[e.figur]()}<span class="abzeichen">${B.symbol(e.symbol)}</span>`);
      zonen.push({ art: "einstieg", e, el, x: e.x, y: e.y + 6, r, drin: kreis(e.x, e.y + 6, r) });
    }
    for (const t of ort.tore || []) {
      const el = baue("einstieg tor", t.x, t.y, t.breite || 110, `<span class="einstieg-ring"></span>${B[t.figur]()}`);
      zonen.push({ art: "tor", t, el, x: t.x, y: t.y, r: t.r || 52, drin: kreis(t.x, t.y, t.r || 52) });
    }
    for (const [richtung, zielId] of Object.entries(ort.nachbarn || {})) {
      const zielOrt = W.orte[zielId];
      if (!zielOrt) continue;
      const mitte = (g.y0 + g.y1) / 2;
      const [x, y] = { oben: [512, 40], unten: [512, 734], links: [36, mitte], rechts: [988, mitte] }[richtung];
      const el = baue(`pfeil${zielOrt.bald ? " bald" : ""}`, x, y, 0, B.pfeil(richtung) + (zielOrt.bald ? `<span class="schloss">${B.schloss()}</span>` : ""));
      zonen.push({ art: "rand", richtung, zielId, bald: !!zielOrt.bald, el, drin: (p) => amRand(richtung, p) });
    }
    for (const f of ort.entdeckungen || []) {
      const el = baue("funkeln", f.x, f.y, 0, "");
      zonen.push({ art: "fund", f, el, drin: kreis(f.x, f.y, f.r || 54) });
    }
    schicht.insertAdjacentHTML("beforeend", `<div id="welt-ziel"></div><div id="welt-rover" class="rover">${B.rover()}</div>`);

    // Startplatz der Figur
    let start = ort.rover || { x: 512, y: 540 };
    const neben = zonen.find((z) => (z.art === "einstieg" && z.e.id === opt.bei) || (z.art === "tor" && opt.aus && z.t.ziel === opt.aus));
    if (neben) start = { x: neben.x, y: neben.y + neben.r + 62 };
    else if (opt.von) {
      const p = opt.pos || start;
      start = opt.von === "links" ? { x: g.x0 + 120, y: p.y } : opt.von === "rechts" ? { x: g.x1 - 120, y: p.y }
        : opt.von === "oben" ? { x: p.x, y: g.y0 + 110 } : { x: p.x, y: g.y1 - 110 };
    }
    pos = begrenze(start);
    if (neben && neben.drin(pos)) pos = begrenze({ x: neben.x + neben.r + 70, y: neben.y });   // unten war kein Platz
    ziel = null; zielRoh = null; fingerUnten = false; gesperrt = false;
    for (const z of zonen) { z.scharf = !z.drin(pos); z.seit = 0; }   // erst scharf, wenn die Figur einmal draußen war
    setze();

    if (App.stand.ort !== id) { App.stand.ort = id; App.speichere(); }
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
        const warten = z.art === "fund" ? 0 : z.art === "rand" ? RAND_WARTEN : faehrt ? VERWEILEN : 120;
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
    if (z.art === "fund") { entdecke(z.f); return false; }
    if (z.art === "rand" && z.bald) {
      z.el.classList.remove("wackel"); void z.el.offsetWidth; z.el.classList.add("wackel");
      App.sag("Dort geht es bald weiter.");
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

  // Entdeckung: Bild taucht auf, Satz wird gesprochen, der Roboter staunt
  function entdecke(f) {
    App.audio.klang("staunen");
    const el = baue("fundbild", f.bei.x, f.bei.y, f.breite || 90, B[f.zeigt]());
    if (f.farbe) el.style.color = f.farbe;
    setTimeout(() => el.remove(), 2800);
    if (f.sag) App.sag(f.sag);
    MBot.reaktion.staunen();
    if (!App.stand.entdeckt[f.id]) { App.stand.entdeckt[f.id] = 1; App.speichere(); App.log(`Entdeckt: ${f.id}`); }
  }

  // Wird aufgerufen, wenn die Welt verdeckt wird (z. B. Elternbereich): Figur bleibt stehen
  function halt() { ziel = null; zielRoh = null; fingerUnten = false; MBot.fahre(0, 0); }

  App.welt = { zeige, halt };
})();
