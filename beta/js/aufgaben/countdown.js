/* „Countdown und Start“ (in der Rakete)
 * Kein Lernspiel mit Runden, sondern der Übergang in den Weltraum: Der Countdown von 10 bis 1 wird laut
 * gesprochen und groß gezeigt, dann hebt die Rakete ab und es geht zum Ort aus einstieg.inhalt.ziel.
 * Start per Knopf oder, wenn der Roboter verbunden ist, mit der Hand vor seinen Sensor-Augen.
 */
"use strict";

(() => {
  const { $ } = App;
  const B = App.bilder;

  App.aufgaben["countdown"] = {
    hintergrund: "stationNah",

    start(feld, ctx) {
      feld.innerHTML = `
        <div class="cd-zahl">10</div>
        <div class="cd-rakete">${B.rakete()}<div class="sb-flamme"></div></div>
        <button class="rh-start cd-start" aria-label="Countdown starten">🚀</button>`;
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
          ctx.zeige(String(z));
          ctx.zaehlton(11 - z);
          await ctx.sag(String(z));
          if (!(await ctx.warte(120))) return;
        }
        zahl.textContent = "Los!";
        zahl.style.fontSize = "170px";
        $(".cd-rakete", feld).classList.add("start");
        feld.classList.add("cd-beben");
        ctx.rakete();
        await ctx.sag("Und los! Wir fliegen in den Weltraum!");
        if (!(await ctx.warte(1200))) return;
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
