/* Aufgabe „Winken zählen“ (im Weltraum)
 * Eine Zahl wird gezeigt. Das Kind winkt so oft vor den Sensor-Augen des Roboters, wie die Zahl sagt;
 * jedes Winken lässt einen Stern aufleuchten und klingt einen Ton höher. Dann den Haken antippen.
 * Ohne Roboter (oder zusätzlich) zählt jeder Tipp auf die Hand.
 * Die Stufen stehen in inhalt/rechnen.js.
 */
"use strict";

(() => {
  const { $, $$ } = App;
  const B = App.bilder;

  App.aufgaben["winken"] = {
    hintergrund: "stationNah",

    start(feld, ctx) {
      const stufen = App.inhalt.rechnen.winken;
      const stufenNr = Math.max(0, Math.min(stufen.length - 1, App.stand.winkStufe | 0));
      const st = stufen[stufenNr];
      const runden = ctx.einstieg.inhalt.runden || 5;
      let runde = 0, ziel = 0, letzte = 0, gezaehlt = 0, fehler = 0, aufAnhieb = 0, gesperrt = true;

      feld.innerHTML = `
        <div class="wk-zahl papier"></div>
        <div class="wk-sterne">${`<span class="wk-stern">${B.sternchen()}</span>`.repeat(10)}</div>
        <button class="sb-klatsch wk-hand" aria-label="Einmal winken">✋</button>
        <button class="sb-start" aria-label="Fertig">✅</button>`;
      const sterne = $$(".wk-stern", feld);
      App.log(`Winken: Stufe ${stufenNr + 1} (${st.name})`);

      const frage = (lang) => ctx.sag(!lang ? `Winke ${ziel} mal.`
        : ctx.roboter() ? `Der Satellit braucht ${ziel} Sterne. Winke ${ziel} mal vor den Augen vom Roboter. Dann tippe auf den Haken.`
          : `Der Satellit braucht ${ziel} Sterne. Tippe ${ziel} mal auf die Hand. Dann tippe auf den Haken.`);
      ctx.wiederhole(() => { if (!gesperrt) frage(true); });

      function zeigeSterne() { sterne.forEach((s, i) => s.classList.toggle("voll", i < gezaehlt)); }

      function winke() {
        if (gesperrt || gezaehlt >= 10) return;
        gezaehlt++;
        zeigeSterne();
        ctx.zaehlton(gezaehlt);
      }
      $(".wk-hand", feld).addEventListener("click", winke);
      ctx.winken(winke);   // Hand vor dem Roboter zählt genauso

      function neueRunde() {
        do { ziel = App.zufall(1, st.bis); } while (ziel === letzte);
        letzte = ziel; gezaehlt = 0; fehler = 0;
        $(".wk-zahl", feld).textContent = String(ziel);
        zeigeSterne();
        ctx.runde(runde, runden);
        ctx.zeige(String(ziel));
        gesperrt = false;
        frage(runde === 0);
      }

      $(".sb-start", feld).addEventListener("click", async () => {
        if (gesperrt) return;
        if (!gezaehlt) { ctx.sag("Winke zuerst."); return; }
        if (gezaehlt !== ziel) {
          fehler++;
          App.log(`Winken: ${gezaehlt} statt ${ziel}`);
          ctx.nochmal();
          const war = gezaehlt;
          gezaehlt = 0;
          zeigeSterne();
          ctx.sag(`Das waren ${war}. Wir brauchen ${ziel}. Versuch es noch einmal.`);
          return;
        }
        gesperrt = true;
        if (!fehler) aufAnhieb++;
        App.merke("zahlen", String(ziel), fehler ? "fehler" : "richtig");
        App.log(`Winken: ${ziel} richtig${fehler ? ` nach ${fehler} Fehlversuch(en)` : ""}`);
        App.still();
        sterne.slice(0, ziel).forEach((s) => s.classList.add("auf"));
        ctx.richtig();
        await ctx.sag(`Genau! ${ziel === 1 ? "Ein Stern" : `${ziel} Sterne`}.`);
        sterne.forEach((s) => s.classList.remove("auf"));
        if (!(await ctx.warte(500))) return;
        runde++;
        if (runde < runden) { neueRunde(); return; }

        if (aufAnhieb >= runden - 1 && stufenNr < stufen.length - 1) {
          App.stand.winkStufe = stufenNr + 1;
          App.speichere();
          App.log(`Winken: nächste Stufe freigeschaltet (${stufen[stufenNr + 1].name})`);
        }
        ctx.fertig();
      });

      neueRunde();
    },
  };
})();
