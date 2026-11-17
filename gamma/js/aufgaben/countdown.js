/* „Countdown und Start“ (in der Rakete)
 * Kein Lernspiel mit Runden, sondern der Übergang in den Weltraum: Der Countdown von 10 bis 1 wird laut
 * gesprochen und groß gezeigt, dann hebt die Rakete ab und es geht zum Ort aus einstieg.inhalt.ziel.
 * Start per Knopf oder, wenn der Roboter verbunden ist, mit der Hand vor seinen Sensor-Augen.
 */
"use strict";

(() => {
  const { $ } = App;

  App.aufgaben["countdown"] = {
    hintergrund: "stationNah",

    start(feld, ctx) {
      // Die Rakete des Kindes steht an der Startrampe (seit v0.25 der gemeinsame Start aus js/raketenstart.js).
      // Bei „Drei“ klappt der Arm weg; nach dem Countdown zündet sie, hebt ab und fliegt durch die Sterne.
      const wahl = App.meineRakete();
      App.raketenstart.rampe(feld, wahl, `<div class="cd-zahl">10</div><button class="rh-start cd-start" aria-label="Countdown starten">🚀</button>`);
      const zahl = $(".cd-zahl", feld), knopf = $(".cd-start", feld);
      let gestartet = false;

      async function los(wie) {
        if (gestartet || !ctx.lebt()) return;
        gestartet = true;
        knopf.classList.add("aus");
        App.still();
        App.log(`Countdown gestartet: ${wie}`);
        for (let z = 10; z >= 1; z--) {
          zahl.textContent = String(z);
          zahl.classList.remove("plopp"); void zahl.offsetWidth; zahl.classList.add("plopp");
          if (z === 3) $(".cd-arm", feld).classList.add("weg");
          ctx.zeige(String(z));
          ctx.zaehlton(11 - z);
          await ctx.sag(String(z));
          if (!(await ctx.warte(120))) return;
        }
        zahl.textContent = "Los!";
        zahl.style.fontSize = "170px";
        ctx.sag("Und los! Wir fliegen in den Weltraum!");
        if (!(await App.raketenstart.fliege(feld, ctx, wahl))) return;   // Zündung, Abheben, Flug mit Stufentrennung
        ctx.reise(ctx.einstieg.inhalt.ziel);
      }

      knopf.addEventListener("click", () => los("Startknopf"));
      ctx.wiederhole(() => { if (!gestartet) ctx.sag("Drück den Startknopf. Dann zählen wir von zehn bis eins."); });
      (async () => {
        if (ctx.roboter()) {
          ctx.sag("Alles bereit zum Start! Halte die Hand vor die Augen vom Roboter. Dann zählen wir.");
          if (await ctx.hand(40000, () => !gestartet)) los("Hand vor dem Roboter");
        } else {
          ctx.sag("Alles bereit zum Start! Drück den Startknopf.");
        }
      })();
    },
  };
})();
