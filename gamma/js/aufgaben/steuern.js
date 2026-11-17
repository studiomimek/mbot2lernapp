/* Spiel „Roboter steuern“ (freies Spiel ohne Runden)
 * Links ein Steuerknüppel wie in der Makeblock-App: Der Roboter fährt, solange der Finger darauf liegt,
 * und hält an, sobald man loslässt. Rechts Knöpfe für Disco, Kreisel, Zwitschern, Licht,
 * Sprachaufnahme (gedrückt halten) und Abspielen. Schildkröte/Hase schaltet das Tempo um.
 * Ohne verbundenen Roboter bewegt sich nur die Figur auf dem Bildschirm.
 */
"use strict";

(() => {
  const { $ } = App;
  const B = App.bilder;
  const RADIUS = 105;                                  // so weit lässt sich der Knüppel auslenken (Pixel)
  const LICHTER = [[255, 0, 0], [255, 150, 0], [255, 255, 0], [0, 255, 0], [0, 200, 255], [150, 60, 255], [255, 255, 255], [0, 0, 0]];

  App.aufgaben["steuern"] = {
    hintergrund: "sandNah",

    start(feld, ctx) {
      let schnell = false, lichtNr = 0, zeiger = null, nimmtAuf = false, aufnahmeUhr = 0;
      const tempo = () => (schnell ? Math.max(35, +App.stand.einst.tempo || 50) : 28);

      feld.innerHTML = `
        <div class="st-bahn"><div class="st-figur rover">${B.rover()}</div></div>
        <div class="st-knueppel"><div class="st-knauf"></div></div>
        <div class="st-knoepfe">
          <button class="st-rund" data-was="disco" style="background:#b565c9" aria-label="Disco">🎉</button>
          <button class="st-rund" data-was="kreisel" style="background:#f9c23c" aria-label="Kreisel">🌀</button>
          <button class="st-rund" data-was="zwitschern" style="background:#3f9b6c" aria-label="Zwitschern">🎵</button>
          <button class="st-gross" data-was="licht" aria-label="Licht">💡</button>
          <button class="st-gross" data-was="tempo" aria-label="Tempo">🐢</button>
          <button class="st-gross st-mikro" data-was="aufnahme" aria-label="Aufnahme: gedrückt halten">🎤</button>
          <button class="st-gross" data-was="abspielen" aria-label="Aufnahme abspielen">▶️</button>
        </div>`;
      const basis = $(".st-knueppel", feld), knauf = $(".st-knauf", feld), figur = $(".st-figur", feld);

      /* ---------- Steuerknüppel ---------- */
      function lenke(ev) {
        const r = basis.getBoundingClientRect();
        const m = r.width / 2, skala = 300 / r.width;      // die Basis ist 300 Bühnen-Pixel breit
        let x = (ev.clientX - r.left - m) * skala, y = (ev.clientY - r.top - m) * skala;
        const d = Math.hypot(x, y);
        if (d > RADIUS) { x *= RADIUS / d; y *= RADIUS / d; }
        knauf.style.transform = `translate(${x.toFixed(0)}px, ${y.toFixed(0)}px)`;
        const vor = -y / RADIUS, dreh = x / RADIUS;
        figur.style.transform = `translate(${(dreh * 150).toFixed(0)}px, ${(-vor * 40).toFixed(0)}px) rotate(${(dreh * 14).toFixed(0)}deg)`;
        MBot.fahre(vor, dreh * 0.75, tempo());
      }
      function loslassen() {
        if (zeiger === null) return;
        zeiger = null;
        knauf.style.transform = "";
        figur.style.transform = "";
        MBot.fahre(0, 0);
      }
      basis.addEventListener("pointerdown", (ev) => {
        ev.preventDefault();
        zeiger = ev.pointerId;
        try { basis.setPointerCapture(ev.pointerId); } catch (_) {}
        if (!MBot.verbunden()) hinweis();
        lenke(ev);
      });
      basis.addEventListener("pointermove", (ev) => { if (ev.pointerId === zeiger) lenke(ev); });
      for (const n of ["pointerup", "pointercancel", "lostpointercapture"]) basis.addEventListener(n, loslassen);

      let hingewiesen = false;
      function hinweis() {
        if (hingewiesen) return;
        hingewiesen = true;
        ctx.sag("Der Roboter ist noch nicht verbunden. Tippe oben rechts auf den Roboter.");
        const k = $("#btn-robo");
        k.classList.remove("huepf"); void k.offsetWidth; k.classList.add("huepf");
      }

      /* ---------- Knöpfe ---------- */
      const aktionen = {
        disco() { App.audio.klang("feier"); figur.classList.add("disco"); setTimeout(() => figur.classList.remove("disco"), 6000); MBot.reaktion.disco(); },
        kreisel() { App.audio.klang("staunen"); figur.classList.add("kreisel"); setTimeout(() => figur.classList.remove("kreisel"), 1500); MBot.reaktion.kreisel(); },
        zwitschern() { if (MBot.verbunden()) MBot.reaktion.zwitschern(); else App.audio.klang("richtig"); },
        licht() { const [r, g, b] = LICHTER[lichtNr++ % LICHTER.length]; MBot.reaktion.licht(r, g, b); App.audio.klang("tipp"); },
        tempo(knopf) { schnell = !schnell; knopf.textContent = schnell ? "🐇" : "🐢"; App.audio.klang("tipp"); },
        abspielen() { if (!MBot.verbunden()) { hingewiesen = false; hinweis(); return; } MBot.aufnahme.spiele(); },
      };
      feld.querySelectorAll("[data-was]").forEach((knopf) => {
        const was = knopf.dataset.was;
        if (was !== "aufnahme") { knopf.addEventListener("click", () => aktionen[was](knopf)); return; }
        // Aufnahme: so lange der Knopf gedrückt ist (höchstens 8 Sekunden)
        const stopp = async () => {
          if (!nimmtAuf) return;
          nimmtAuf = false;
          clearTimeout(aufnahmeUhr);
          knopf.classList.remove("laeuft");
          await MBot.aufnahme.stopp();
          App.audio.klang("strich");
        };
        knopf.addEventListener("pointerdown", async () => {
          if (!MBot.verbunden()) { hingewiesen = false; hinweis(); return; }
          if (nimmtAuf) return;
          nimmtAuf = true;
          knopf.classList.add("laeuft");
          aufnahmeUhr = setTimeout(stopp, 8000);
          if (!(await MBot.aufnahme.start())) { stopp(); ctx.sag("Das Aufnehmen klappt bei diesem Roboter leider nicht."); }
        });
        for (const n of ["pointerup", "pointercancel", "pointerleave"]) knopf.addEventListener(n, stopp);
      });

      ctx.wiederhole(() => ctx.sag("Mit dem runden Knüppel links fährst du den Roboter. Lass los, dann bleibt er stehen. Rechts gibt es Disco, Kreisel, Licht und eine Aufnahme."));
      ctx.beimEnde(() => { MBot.fahre(0, 0); if (nimmtAuf) MBot.aufnahme.stopp(); });
      ctx.zeige(":)");
      ctx.sag("Jetzt steuerst du den Roboter!");
    },
  };
})();
