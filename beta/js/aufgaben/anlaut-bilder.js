/* Aufgabe „Was fängt an wie …?“
 * Oben ein Vorbild (Bild und Buchstabe), darunter vier Bilder. Erst werden alle Bilder benannt,
 * dann tippt das Kind die Bilder an, die mit demselben Laut anfangen wie das Vorbild.
 * Es wird kein Buchstabenname vorgesagt. Wörter und Bilder kommen aus inhalt/buchstaben.js.
 */
"use strict";

(() => {
  const { $, $$ } = App;

  App.aufgaben["anlaut-bilder"] = {
    hintergrund: "sandNah",

    start(feld, ctx) {
      const BU = App.inhalt.buchstaben;
      const aktiv = App.buchstabenAktiv();
      const mitWoertern = aktiv.filter((b) => BU.zeichen[b].woerter.length >= 2);
      const runden = ctx.einstieg.inhalt.runden || 5;
      const ziele = [];
      for (let i = 0; ziele.length < runden; i++) ziele.push(...App.misch(mitWoertern.length ? mitWoertern : aktiv));
      let runde = 0, vorbild = "", offen = 0, fehler = 0, gesperrt = true;

      feld.innerHTML = `
        <button class="ab-vorbild papier" aria-label="Noch einmal hören"><span class="ab-emoji"></span><span class="ab-buchstabe"></span></button>
        <div class="ab-karten"></div>`;
      const karten = $(".ab-karten", feld);

      // Nennt alle Bilder der Reihe nach, dann die Frage
      async function benenne() {
        gesperrt = true;
        for (const k of $$(".ab-karte", karten)) {
          k.classList.add("spricht");
          await ctx.sag(k.dataset.wort);
          k.classList.remove("spricht");
          if (!(await ctx.warte(120))) return;
        }
        gesperrt = false;
        ctx.sag(`Was fängt an wie ${vorbild}?`);
      }
      $(".ab-vorbild", feld).addEventListener("click", () => { if (!gesperrt) ctx.sag(`Was fängt an wie ${vorbild}?`); });
      ctx.wiederhole(() => { if (!gesperrt) benenne(); });

      async function neueRunde() {
        const ziel = ziele[runde];
        const w = App.misch(BU.zeichen[ziel].woerter);
        vorbild = w[0][0];
        const richtige = w.slice(1, 3);
        // Falsche Bilder: Wörter anderer Buchstaben (mit anderem ersten Buchstaben, damit es eindeutig bleibt)
        const andere = App.misch(Object.keys(BU.zeichen).filter((b) => !App.klingtGleich(b, ziel))
          .map((b) => BU.zeichen[b].woerter[App.zufall(0, BU.zeichen[b].woerter.length - 1)]));
        const falsche = andere.slice(0, 4 - richtige.length);
        offen = richtige.length; fehler = 0;

        $(".ab-emoji", feld).textContent = w[0][1];
        $(".ab-buchstabe", feld).textContent = ziel;
        karten.innerHTML = "";
        App.misch([...richtige.map((x) => [x, true]), ...falsche.map((x) => [x, false])]).forEach(([[wort, bild], stimmt], i) => {
          const k = document.createElement("button");
          k.className = "ab-karte papier kommt";
          k.style.animationDelay = `${i * 80}ms`;
          k.dataset.wort = wort;
          k.textContent = bild;
          k.setAttribute("aria-label", wort);
          k.addEventListener("click", () => antwort(k, stimmt, ziel));
          karten.appendChild(k);
        });
        ctx.runde(runde, runden);
        ctx.zeige("?");
        if (runde === 0) await ctx.sag("Hör gut zu.");
        if (!ctx.lebt()) return;
        benenne();
      }

      async function antwort(karte, stimmt, ziel) {
        if (gesperrt || karte.disabled || karte.classList.contains("richtig")) return;
        if (!stimmt) {
          fehler++;
          karte.disabled = true;
          karte.classList.add("falsch");
          ctx.nochmal();
          ctx.sag(`${karte.dataset.wort}. Das fängt anders an.`);
          return;
        }
        karte.classList.add("richtig");
        offen--;
        if (offen > 0) { ctx.tick(); ctx.sag(`${karte.dataset.wort}. Ja! Da ist noch eins.`); return; }

        gesperrt = true;
        App.merke("buchstaben", ziel, fehler ? "fehler" : "richtig");
        App.log(`Anlaut-Bilder: ${ziel} (wie ${vorbild}) richtig${fehler ? ` nach ${fehler} Fehlversuch(en)` : ""}`);
        ctx.zeige(ziel);
        ctx.richtig();
        await ctx.sag(`${karte.dataset.wort}. Richtig!`);
        if (!(await ctx.warte(600))) return;
        runde++;
        if (runde >= runden) ctx.fertig(); else neueRunde();
      }

      neueRunde();
    },
  };
})();
