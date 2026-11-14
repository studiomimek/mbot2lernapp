/* Aufgabe „Mehr oder weniger“ (Mengen und Zahlen vergleichen)
 * Zwei Haufen Goldmünzen. Stufen 1 und 2: den Haufen mit mehr bzw. weniger Münzen antippen.
 * Stufe 3: zwischen zwei Zahlen das passende Zeichen wählen (<, > oder =).
 * Die Stufen stehen in inhalt/rechnen.js.
 */
"use strict";

(() => {
  const { $, $$ } = App;
  const B = App.bilder;

  App.aufgaben["vergleichen"] = {
    hintergrund: "wrackNah",

    start(feld, ctx) {
      const stufen = App.inhalt.rechnen.vergleichen;
      const stufenNr = Math.max(0, Math.min(stufen.length - 1, App.stand.vergleichStufe | 0));
      const st = stufen[stufenNr];
      const runden = ctx.einstieg.inhalt.runden || 5;
      let runde = 0, a = 0, b = 0, mehr = true, letzte = "", fehler = 0, aufAnhieb = 0, gesperrt = true;

      feld.innerHTML = `
        <button class="vg-haufen" data-seite="links"><span class="vg-muenzen"></span><b class="vg-zahl"></b></button>
        <div class="vg-zeichen papier">?</div>
        <button class="vg-haufen" data-seite="rechts"><span class="vg-muenzen"></span><b class="vg-zahl"></b></button>
        <div class="mg-steine"></div>`;
      const haufen = $$(".vg-haufen", feld), zeichen = $(".vg-zeichen", feld), steine = $(".mg-steine", feld);
      zeichen.classList.toggle("aus", !st.zeichen);
      App.log(`Vergleichen: Stufe ${stufenNr + 1} (${st.name})`);

      const frage = () => ctx.sag(st.zeichen ? "Welches Zeichen passt zwischen die Zahlen?" : mehr ? "Wo sind mehr Münzen?" : "Wo sind weniger Münzen?");
      ctx.wiederhole(frage);

      function neueRunde() {
        do {
          a = App.zufall(1, st.bis); b = App.zufall(1, st.bis);
          if (!st.zeichen && a === b) b = a < st.bis ? a + 1 : a - 1;
        } while (`${a}/${b}` === letzte);
        letzte = `${a}/${b}`; fehler = 0;
        mehr = Math.random() < 0.6;
        [a, b].forEach((n, i) => {
          $(".vg-muenzen", haufen[i]).innerHTML = Array.from({ length: n }, () => `<i>${B.muenze()}</i>`).join("");
          $(".vg-zahl", haufen[i]).textContent = st.zeichen ? String(n) : "";
          haufen[i].className = "vg-haufen kommt";
          haufen[i].disabled = false;
        });
        zeichen.textContent = "?";
        zeichen.classList.remove("gefuellt");
        steine.innerHTML = "";
        if (st.zeichen) {
          for (const z of ["<", "=", ">"]) {
            const k = document.createElement("button");
            k.className = "mg-stein";
            k.textContent = z;
            k.addEventListener("click", () => antwort(k, z === (a < b ? "<" : a > b ? ">" : "=")));
            steine.appendChild(k);
          }
        }
        ctx.runde(runde, runden);
        ctx.zeige("?");
        gesperrt = false;
        frage();
      }

      haufen.forEach((h, i) => h.addEventListener("click", () => {
        if (st.zeichen) return;
        const meine = i === 0 ? a : b, andere = i === 0 ? b : a;
        antwort(h, mehr ? meine > andere : meine < andere);
      }));

      async function antwort(el, stimmt) {
        if (gesperrt || el.disabled) return;
        if (!stimmt) {
          fehler++;
          el.disabled = true;
          el.classList.add("falsch");
          ctx.nochmal();
          ctx.sag("Schau noch einmal genau hin. Zähl die Münzen.");
          return;
        }
        gesperrt = true;
        el.classList.add("richtig");
        if (!fehler) aufAnhieb++;
        App.log(`Vergleichen: ${a} und ${b} richtig${fehler ? ` nach ${fehler} Fehlversuch(en)` : ""}`);
        App.still();
        $(".vg-zahl", haufen[0]).textContent = String(a);
        $(".vg-zahl", haufen[1]).textContent = String(b);
        const z = a < b ? "<" : a > b ? ">" : "=";
        zeichen.textContent = z;
        zeichen.classList.add("gefuellt");
        ctx.zeige(`${a}${z}${b}`);
        ctx.richtig();
        await ctx.sag(a === b ? `Genau! ${a} ist gleich ${b}.` : `Genau! ${a} ist ${a > b ? "mehr" : "weniger"} als ${b}.`);
        if (!(await ctx.warte(700))) return;
        runde++;
        if (runde < runden) { neueRunde(); return; }

        if (aufAnhieb >= runden - 1 && stufenNr < stufen.length - 1) {
          App.stand.vergleichStufe = stufenNr + 1;
          App.speichere();
          App.log(`Vergleichen: nächste Stufe freigeschaltet (${stufen[stufenNr + 1].name})`);
        }
        ctx.fertig();
      }

      neueRunde();
    },
  };
})();
