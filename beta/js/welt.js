/* welt.js – zeigt einen Ort und lässt die Spielfigur dem Finger folgen
 *
 * Die Figur fährt dorthin, wo der Finger ist (antippen oder ziehen).
 * Fährt sie auf einen Einstieg und bleibt dort, startet die Aufgabe. Fährt sie auf einen Pfeil, wechselt der Ort.
 * Nur kurz darüber hinwegfahren löst nichts aus.
 */
"use strict";

(() => {
  const { $ } = App;
  const B = App.bilder;
  const TEMPO = 420;                 // Pixel pro Sekunde
  const HALB_B = 60, HALB_H = 52;    // halbe Größe der Spielfigur
  const VERWEILEN = 600;             // so lange muss die Figur beim Durchfahren in einer Zone bleiben (ms)
  const PFEIL_ORT = { oben: { x: 512, y: 56 }, unten: { x: 512, y: 710 }, links: { x: 58, y: 560 }, rechts: { x: 966, y: 560 } };

  let ort = null, pos = { x: 512, y: 540 }, ziel = null, zonen = [];
  let lauf = 0, fingerUnten = false, gesperrt = true, eingerichtet = false;

  const ortVon = (id) => {
    const W = App.inhalt.welt;
    return W.orte[id] && !W.orte[id].bald ? id : W.start;
  };
  const begrenze = (p) => ({
    x: Math.max(HALB_B, Math.min(1024 - HALB_B, p.x)),
    y: Math.max((ort && ort.boden) || 150, Math.min(716, p.y)),
  });
  const inZone = (z, p) => Math.hypot(p.x - z.x, p.y - z.y) <= z.r;

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
      ziel = begrenze({ x: (ev.clientX - r.left) * 1024 / r.width, y: (ev.clientY - r.top) * 768 / r.height });
    };
    schicht.addEventListener("pointerdown", (ev) => { fingerUnten = true; finger(ev); });
    schicht.addEventListener("pointermove", (ev) => { if (fingerUnten) finger(ev); });
    for (const n of ["pointerup", "pointercancel", "pointerleave"]) schicht.addEventListener(n, () => { fingerUnten = false; });
  }

  /* opt.von: Richtung, aus der die Figur kommt („links“ = sie kommt vom linken Rand herein)
   * opt.bei: Name des Einstiegs, neben dem die Figur stehen soll (nach einer Aufgabe)
   * opt.ansage: wird gesprochen */
  function zeige(id, opt = {}) {
    id = ortVon(id);
    const W = App.inhalt.welt;
    ort = W.orte[id];
    richteEin();
    const schicht = $("#welt");
    schicht.className = `schicht ort-${id}`;
    schicht.innerHTML = `<div class="ort-bild">${B[ort.bild]()}</div>`;
    zonen = [];

    for (const e of ort.einstiege || []) {
      const el = document.createElement("div");
      el.className = "einstieg";
      el.style.left = `${e.x}px`; el.style.top = `${e.y}px`; el.style.width = `${e.breite}px`;
      el.innerHTML = `<span class="einstieg-ring"></span>${B[e.figur]()}<span class="abzeichen">${B.symbol(e.symbol)}</span>`;
      schicht.appendChild(el);
      zonen.push({ art: "einstieg", e, el, x: e.x, y: e.y + 8, r: Math.max(66, e.breite * 0.3) });
    }
    for (const [richtung, zielId] of Object.entries(ort.nachbarn || {})) {
      const zielOrt = W.orte[zielId];
      if (!zielOrt) continue;
      const el = document.createElement("div");
      el.className = `pfeil pfeil-${richtung}${zielOrt.bald ? " bald" : ""}`;
      el.innerHTML = B.pfeil(richtung) + (zielOrt.bald ? `<span class="schloss">${B.schloss()}</span>` : "");
      schicht.appendChild(el);
      zonen.push({ art: "pfeil", richtung, zielId, bald: !!zielOrt.bald, el, x: PFEIL_ORT[richtung].x, y: PFEIL_ORT[richtung].y, r: 58 });
    }

    for (const f of ort.entdeckungen || []) {
      const el = document.createElement("div");
      el.className = "funkeln";
      el.style.left = `${f.x}px`; el.style.top = `${f.y}px`;
      schicht.appendChild(el);
      zonen.push({ art: "fund", f, el, x: f.x, y: f.y, r: f.r || 54 });
    }

    schicht.insertAdjacentHTML("beforeend", `<div id="welt-ziel"></div><div id="welt-rover" class="rover">${B.rover()}</div>`);

    // Startplatz der Figur
    let start = ort.rover || { x: 512, y: 540 };
    const einstieg = zonen.find((z) => z.art === "einstieg" && z.e.id === opt.bei);
    if (einstieg) start = { x: einstieg.x, y: einstieg.y + einstieg.r + 70 };
    else if (opt.von && PFEIL_ORT[opt.von]) {
      const p = PFEIL_ORT[opt.von];
      start = { x: p.x + (opt.von === "links" ? 130 : opt.von === "rechts" ? -130 : 0), y: p.y + (opt.von === "oben" ? 150 : opt.von === "unten" ? -150 : 0) };
    }
    pos = begrenze(start);
    ziel = null; fingerUnten = false; gesperrt = false;
    for (const z of zonen) z.scharf = !inZone(z, pos);   // erst scharf, wenn die Figur einmal draußen war
    setze();

    if (App.stand.ort !== id) { App.stand.ort = id; App.speichere(); }
    if (ort.licht) MBot.reaktion.licht(...ort.licht);
    MBot.reaktion.leere();
    if (opt.ansage) App.sag(opt.ansage);

    const meinLauf = ++lauf;
    let zuletzt = performance.now();
    function schritt(jetzt) {
      if (meinLauf !== lauf) return;
      const dt = Math.min(100, jetzt - zuletzt) / 1000;
      zuletzt = jetzt;
      let faehrt = false;
      if (ziel) {
        const dx = ziel.x - pos.x, dy = ziel.y - pos.y, d = Math.hypot(dx, dy), s = TEMPO * dt;
        if (d <= s) { pos = { x: ziel.x, y: ziel.y }; if (!fingerUnten) ziel = null; }
        else { pos.x += dx / d * s; pos.y += dy / d * s; faehrt = true; }
        setze();
      }
      const rover = $("#welt-rover");
      if (rover) rover.classList.toggle("faehrt", faehrt);

      for (const z of zonen) {
        if (!inZone(z, pos)) { z.scharf = true; z.seit = 0; z.el.classList.remove("nah"); continue; }
        if (!z.scharf) continue;
        if (!z.seit) { z.seit = jetzt; z.el.classList.add("nah"); }
        if (z.art === "fund" || !faehrt || jetzt - z.seit > VERWEILEN) { if (loeseAus(z)) return; }
      }
      App.naechstesBild(schritt);
    }
    App.naechstesBild(schritt);
  }

  // true = die Welt wird verlassen, die Schleife endet
  function loeseAus(z) {
    z.scharf = false; z.seit = 0;
    z.el.classList.remove("nah");
    if (z.art === "fund") { entdecke(z.f); return false; }
    if (z.art === "pfeil" && z.bald) {
      z.el.classList.remove("wackel"); void z.el.offsetWidth; z.el.classList.add("wackel");
      App.sag("Dort geht es bald weiter.");
      return false;
    }
    gesperrt = true; ziel = null; lauf++;
    App.audio.klang("neugierig");
    const rover = $("#welt-rover");
    if (rover) rover.classList.remove("faehrt");
    if (z.art === "einstieg") {
      z.el.classList.add("gewaehlt");
      setTimeout(() => App.starteAufgabe(z.e), 350);
    } else {
      const W = App.inhalt.welt;
      $("#welt").classList.add("blende");
      const gegen = { oben: "unten", unten: "oben", links: "rechts", rechts: "links" }[z.richtung];
      setTimeout(() => zeige(z.zielId, { von: gegen, ansage: W.orte[z.zielId].ansage }), 320);
    }
    return true;
  }

  // Entdeckung: Bild taucht auf, Satz wird gesprochen, der Roboter staunt
  function entdecke(f) {
    App.audio.klang("staunen");
    const el = document.createElement("div");
    el.className = "fundbild";
    el.style.left = `${f.bei.x}px`; el.style.top = `${f.bei.y}px`; el.style.width = `${f.breite || 90}px`;
    if (f.farbe) el.style.color = f.farbe;
    el.innerHTML = B[f.zeigt]();
    $("#welt").appendChild(el);
    setTimeout(() => el.remove(), 2800);
    if (f.sag) App.sag(f.sag);
    MBot.reaktion.staunen();
    if (!App.stand.entdeckt[f.id]) { App.stand.entdeckt[f.id] = 1; App.speichere(); App.log(`Entdeckt: ${f.id}`); }
  }

  // Wird aufgerufen, wenn die Welt verdeckt wird (z. B. Elternbereich): Figur bleibt stehen
  function halt() { ziel = null; fingerUnten = false; }

  App.welt = { zeige, halt };
})();
