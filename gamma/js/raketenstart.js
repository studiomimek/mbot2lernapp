/* raketenstart.js – der gemeinsame Raketenstart (seit v0.25)
 *
 * Es gibt nur noch einen Start, und er gilt für die Rakete des Kindes (App.meineRakete: die Rakete aus der
 * Raketenhalle, ohne Umbau die einfache). Zwei Spiele benutzen ihn:
 *   countdown   in der Rakete: zählt von 10 bis 1, danach geht es in den Weltraum
 *   raketenbau  in der Raketenhalle: Probeflug, danach steht die Rakete wieder in der Halle
 *
 *   App.raketenstart.rampe(feld, wahl, extra)   baut die Startrampe mit der Rakete in „feld“ (ersetzt den Inhalt).
 *                                               extra = zusätzliches HTML, z. B. die große Zahl und der Startknopf
 *   App.raketenstart.fliege(feld, ctx, wahl)    Arm klappt weg, Zündung mit Rauch, Abheben; dann der Flug durch
 *                                               Wolken in die Sterne. Hat die Rakete Booster, fallen sie ab; danach
 *                                               trennt sich bei jeder Rakete die untere Stufe. Das Versprechen
 *                                               liefert true, wenn alles bis zum Ende gelaufen ist (false = das
 *                                               Spiel wurde verlassen).
 *
 * Stufentrennung: Die Rakete liegt im Flug zweimal übereinander, einmal nur der obere Teil sichtbar, einmal nur
 * der untere (clip-path, Trennlinie aus B.bauMasse). Der untere fällt nach unten weg, der obere bekommt eine
 * eigene Flamme und fliegt weiter.
 *
 * Roboter: bei der Zündung die getestete Reaktion „rakete“ (über ctx.rakete), sonst nichts.
 */
"use strict";

(() => {
  const { $ } = App;
  const B = App.bilder;

  function rampe(feld, wahl, extra = "") {
    feld.innerHTML = `<div class="rs-szene"><div class="rs-grund">${B.stationNah()}</div>${extra}
      <div class="cd-rampe">${B.rampe()}</div><div class="cd-arm"></div>
      <div class="rs-rakete">${B.bauRakete(wahl)}</div>
      <div class="cd-rauch">${"<i></i>".repeat(6)}</div></div>`;
  }

  async function fliege(feld, ctx, wahl) {
    const szene = $(".rs-szene", feld), rakete = $(".rs-rakete", feld), robi = $("#aufgabe .rover");
    if (!szene || !rakete) return false;
    const zeigeRobi = (an) => { if (robi) robi.style.visibility = an ? "" : "hidden"; };
    const aus = () => { zeigeRobi(true); return false; };
    const masse = B.bauMasse(wahl);

    // An der Rampe: Arm weg, Zündung, Abheben
    $(".cd-arm", feld).classList.add("weg");
    if (!(await ctx.warte(500))) return false;
    rakete.classList.add("zuendet");
    $(".cd-rauch", feld).classList.add("an");
    szene.classList.add("cd-beben");
    ctx.rakete();
    if (!(await ctx.warte(900))) return false;
    zeigeRobi(false);                                   // die Figur fliegt mit
    rakete.classList.add("hebtab");
    if (!(await ctx.warte(1900))) return aus();

    // Im Flug: Sterne ziehen vorbei, am Anfang ein paar Wolken
    const schnitt = (masse.schnitt / 720 * 100).toFixed(1);
    szene.classList.remove("cd-beben");
    szene.innerHTML = `<div class="flug rs-flug" style="--schnitt:${schnitt}%"><div class="flug-sterne">${App.planeten.sterneBild()}</div>
      ${[[40, 320], [540, 400], [260, 280], [720, 250]].map(([x, b], i) => `<i class="rs-wolke" style="left:${x}px;width:${b}px;animation-delay:${(i * 0.2).toFixed(1)}s"></i>`).join("")}
      <div class="rs-flieger"><div class="rs-stufe rs-unten">${B.bauRakete(wahl)}</div>
        <div class="rs-ober"><div class="rs-stufe rs-oben">${B.bauRakete(wahl, false)}</div><i class="rs-flamme2" style="top:${schnitt}%"></i></div></div></div>`;
    const flug = $(".rs-flug", szene);
    if (!(await ctx.warte(1700))) return aus();
    if (masse.booster) {
      flug.classList.add("ohne-booster");
      App.audio.klang("strich");
      ctx.sag("Die Booster fallen ab!");
      if (!(await ctx.warte(2000))) return aus();
    }
    flug.classList.add("getrennt");
    App.audio.klang("strich");
    ctx.sag("Stufentrennung!");
    if (!(await ctx.warte(2500))) return aus();
    zeigeRobi(true);
    return true;
  }

  App.raketenstart = { rampe, fliege };
})();
