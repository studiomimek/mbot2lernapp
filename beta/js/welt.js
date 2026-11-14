/* welt.js – zeigt einen Ort, die Einstiege zu den Aufgaben, die Pfeile zu den Nachbarn und die Spielfigur */
"use strict";

(() => {
  const { $ } = App;
  const B = App.bilder;
  const ROVER_B = 120;           // Breite der Spielfigur
  let beschaeftigt = false;

  const ortVon = (id) => {
    const W = App.inhalt.welt;
    return W.orte[id] && !W.orte[id].bald ? id : W.start;
  };

  function setzeRover(x, y, sofort) {
    const r = $("#welt-rover");
    if (!r) return;
    if (sofort) r.classList.add("sofort");
    r.style.left = `${Math.max(8, Math.min(1024 - ROVER_B - 8, x))}px`;
    r.style.top = `${Math.max(90, Math.min(768 - 120, y))}px`;
    if (sofort) { void r.offsetWidth; r.classList.remove("sofort"); }
  }

  // von: Richtung, aus der die Figur kommt („oben“ = wir sind gerade nach unten getaucht)
  function zeige(id, opt = {}) {
    id = ortVon(id);
    const W = App.inhalt.welt, ort = W.orte[id];
    const schicht = $("#welt");
    beschaeftigt = false;
    schicht.className = `schicht ort-${id}`;
    schicht.innerHTML = `<div class="ort-bild">${B[ort.bild]()}</div>`;

    for (const e of ort.einstiege || []) {
      const b = document.createElement("button");
      b.className = "einstieg";
      b.style.left = `${e.x}px`; b.style.top = `${e.y}px`; b.style.width = `${e.breite}px`;
      b.setAttribute("aria-label", e.titel);
      b.innerHTML = `<span class="einstieg-ring"></span>${B[e.figur]()}<span class="abzeichen">${B.symbol(e.symbol)}</span>`;
      b.addEventListener("click", () => geheZu(e));
      schicht.appendChild(b);
    }

    for (const [richtung, ziel] of Object.entries(ort.nachbarn || {})) {
      const zielOrt = W.orte[ziel];
      if (!zielOrt) continue;
      const p = document.createElement("button");
      p.className = `pfeil pfeil-${richtung}${zielOrt.bald ? " bald" : ""}`;
      p.setAttribute("aria-label", zielOrt.name);
      p.innerHTML = B.pfeil(richtung) + (zielOrt.bald ? `<span class="schloss">${B.schloss()}</span>` : "");
      p.addEventListener("click", () => wechsle(richtung, ziel, p));
      schicht.appendChild(p);
    }

    const rover = document.createElement("div");
    rover.id = "welt-rover"; rover.className = "rover";
    rover.innerHTML = B.rover();
    schicht.appendChild(rover);
    const ziel = ort.rover || { x: 452, y: 400 };
    const start = {
      oben: { x: ziel.x, y: 60 }, unten: { x: ziel.x, y: 700 },
      links: { x: 0, y: ziel.y }, rechts: { x: 1024, y: ziel.y },
    }[opt.von];
    if (start) { setzeRover(start.x, start.y, true); setzeRover(ziel.x, ziel.y); }
    else setzeRover(ziel.x, ziel.y, true);

    if (App.stand.ort !== id) { App.stand.ort = id; App.speichere(); }
    if (ort.licht) MBot.reaktion.licht(...ort.licht);
    MBot.reaktion.leere();
    if (opt.ansage) App.sag(opt.ansage);
  }

  async function geheZu(e) {
    if (beschaeftigt) return;
    beschaeftigt = true;
    App.audio.klang("tipp");
    setzeRover(e.x - e.breite / 2 - 70, e.y - 30);
    await App.warte(750);
    if (!beschaeftigt) return;
    App.starteAufgabe(e);
  }

  async function wechsle(richtung, ziel, knopf) {
    if (beschaeftigt) return;
    const W = App.inhalt.welt;
    if (W.orte[ziel].bald) {
      knopf.classList.remove("wackel"); void knopf.offsetWidth; knopf.classList.add("wackel");
      App.sag("Dort geht es bald weiter.");
      return;
    }
    beschaeftigt = true;
    App.audio.klang("tipp");
    const r = $("#welt-rover");
    const jetzt = { x: parseFloat(r.style.left), y: parseFloat(r.style.top) };
    const rand = { oben: { x: jetzt.x, y: 90 }, unten: { x: 452, y: 648 }, links: { x: 8, y: jetzt.y }, rechts: { x: 896, y: jetzt.y } }[richtung];
    setzeRover(rand.x, rand.y);
    await App.warte(550);
    $("#welt").classList.add("blende");
    await App.warte(320);
    const gegen = { oben: "unten", unten: "oben", links: "rechts", rechts: "links" }[richtung];
    zeige(ziel, { von: gegen, ansage: W.orte[ziel].ansage });
  }

  App.welt = { zeige };
})();
