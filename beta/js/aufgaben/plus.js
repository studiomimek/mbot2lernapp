/* Aufgabe „Plus rechnen“
 * Gelbe und rote Sterne liegen im Zehnerfeld, darunter steht die Rechnung. Das Kind wählt das Ergebnis.
 * Stufe „Ergänzen“: 3 + ? = 7, die fehlenden Sterne sind nur als Umriss zu sehen.
 * Die Stufen stehen in inhalt/rechnen.js.
 */
"use strict";

(() => {
  const { $, $$ } = App;
  const B = App.bilder;
  const ZF = { links: 60, oben: 96, bx: 132, by: 124, stern: 84 };   // Zehnerfeld wie bei den Mengen

  App.aufgaben["plus"] = {
    hintergrund: "stationNah",

    start(feld, ctx) {
      const stufen = App.inhalt.rechnen.plus;
      const stufenNr = Math.max(0, Math.min(stufen.length - 1, App.stand.plusStufe | 0));
      const st = stufen[stufenNr];
      const runden = ctx.einstieg.inhalt.runden || 5;
      let runde = 0, a = 0, b = 0, antwortZahl = 0, letzte = "", gezaehlt = 0, fehler = 0, aufAnhieb = 0, gesperrt = true;

      feld.innerHTML = `
        <div class="mg-becken">
          <div class="mg-zehnerfeld">${"<i></i>".repeat(10)}</div>
          <div class="pl-sterne"></div>
          <div class="pl-rechnung papier"></div>
        </div>
        <div class="mg-steine"></div>`;
      const sterne = $(".pl-sterne", feld), rechnung = $(".pl-rechnung", feld), steine = $(".mg-steine", feld);
      App.log(`Plus: Stufe ${stufenNr + 1} (${st.name})`);

      const frage = (lang) => ctx.sag(st.ergaenzen
        ? (lang ? `Wie viele Sterne fehlen noch bis ${a + b}? Tippe die Zahl an.` : `Wie viele fehlen bis ${a + b}?`)
        : (lang ? "Gelbe und rote Sterne. Wie viele sind es zusammen? Tippe die Zahl an." : "Wie viele sind es zusammen?"));
      ctx.wiederhole(() => frage(true));

      function neueRunde() {
        let summe;
        do {
          summe = App.zufall(Math.min(3, st.summeBis), st.summeBis);
          a = App.zufall(1, summe - 1);
          b = summe - a;
        } while (`${a}+${b}` === letzte);
        letzte = `${a}+${b}`; gezaehlt = 0; fehler = 0;
        antwortZahl = st.ergaenzen ? b : summe;

        sterne.innerHTML = "";
        for (let i = 0; i < summe; i++) {
          const s = document.createElement("button");
          s.className = `pl-stern kommt ${i < a ? "gelb" : "rot"}${st.ergaenzen && i >= a ? " geist" : ""}`;
          s.style.left = `${ZF.links + (i % 5) * ZF.bx + (ZF.bx - ZF.stern) / 2}px`;
          s.style.top = `${ZF.oben + Math.floor(i / 5) * ZF.by + (ZF.by - ZF.stern) / 2}px`;
          s.style.animationDelay = `${i * 50}ms`;
          s.setAttribute("aria-label", "Stern");
          s.innerHTML = B.sternchen();
          s.addEventListener("click", () => {
            if (gesperrt || s.classList.contains("gezaehlt")) return;
            s.classList.add("gezaehlt");
            ctx.zaehlton(++gezaehlt);
          });
          sterne.appendChild(s);
        }

        rechnung.innerHTML = st.ergaenzen
          ? `<span class="gelb">${a}</span><span>+</span><span class="pl-luecke rot">?</span><span>=</span><span>${summe}</span>`
          : `<span class="gelb">${a}</span><span>+</span><span class="rot">${b}</span><span>=</span><span class="pl-luecke">?</span>`;

        const nachbarn = App.misch([antwortZahl - 2, antwortZahl - 1, antwortZahl + 1, antwortZahl + 2].filter((z) => z >= 1 && z <= 10));
        const auswahl = [antwortZahl, ...nachbarn.slice(0, st.auswahl - 1)].sort((x, y) => x - y);
        steine.innerHTML = "";
        for (const z of auswahl) {
          const k = document.createElement("button");
          k.className = "mg-stein";
          k.textContent = String(z);
          k.addEventListener("click", () => antwort(k, z));
          steine.appendChild(k);
        }

        ctx.runde(runde, runden);
        ctx.zeige("?");
        gesperrt = false;
        frage(runde === 0);
      }

      async function antwort(stein, zahl) {
        if (gesperrt || stein.disabled) return;
        if (zahl !== antwortZahl) {
          fehler++;
          stein.disabled = true;
          stein.classList.add("falsch");
          ctx.nochmal();
          $$(".pl-stern", sterne).forEach((s) => s.classList.remove("gezaehlt"));
          gezaehlt = 0;
          ctx.sag("Zähl noch einmal nach. Tippe jeden Stern an.");
          return;
        }

        gesperrt = true;
        stein.classList.add("richtig");
        if (!fehler) aufAnhieb++;
        App.log(`Plus: ${a} + ${b} = ${a + b} richtig${fehler ? ` nach ${fehler} Fehlversuch(en)` : ""}`);
        App.still();
        const luecke = $(".pl-luecke", rechnung);
        luecke.textContent = String(antwortZahl);
        luecke.classList.add("gefuellt");
        ctx.zeige(String(antwortZahl));
        const alle = $$(".pl-stern", sterne);
        alle.forEach((s) => s.classList.remove("gezaehlt", "geist"));
        for (const s of alle) {
          s.classList.add("auf");
          ctx.tick();
          if (!(await ctx.warte(220))) return;
        }
        ctx.richtig();
        await ctx.sag(`Genau! ${a} plus ${b} ist ${a + b}.`);
        if (!(await ctx.warte(600))) return;
        runde++;
        if (runde < runden) { neueRunde(); return; }

        if (aufAnhieb >= runden - 1 && stufenNr < stufen.length - 1) {
          App.stand.plusStufe = stufenNr + 1;
          App.speichere();
          App.log(`Plus: nächste Stufe freigeschaltet (${stufen[stufenNr + 1].name})`);
        }
        ctx.fertig();
      }

      neueRunde();
    },
  };
})();
