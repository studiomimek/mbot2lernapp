/* Aufgabe „Mengen bis 10“
 * Ein Fischschwarm erscheint. Das Kind kann die Fische zum Zählen antippen (jeder Tipp klingt einen Ton höher)
 * und wählt dann die passende Zahl auf einem Kiesel. Die Stufen stehen in inhalt/mengen.js.
 */
"use strict";

(() => {
  const { $, $$ } = App;
  const B = App.bilder;
  const BW = 780, BH = 440;      // Becken
  const FW = 108, FH = 66;       // ein Fisch

  // Frei verteilt, ohne Überlappung
  function plaetzeFrei(n) {
    const MIN = 124;
    for (let versuch = 0; versuch < 80; versuch++) {
      const p = [];
      for (let k = 0; k < 400 && p.length < n; k++) {
        const q = [App.zufall(16, BW - FW - 16), App.zufall(14, BH - FH - 14)];
        if (p.every((o) => Math.hypot(o[0] - q[0], o[1] - q[1]) >= MIN)) p.push(q);
      }
      if (p.length === n) return p;
    }
    // Ausweichlösung: Raster mit kleinem Versatz
    const raster = [];
    for (let z = 0; z < 2; z++) for (let s = 0; s < 5; s++) raster.push([40 + s * 145 + App.zufall(-10, 10), 70 + z * 190 + App.zufall(-20, 20)]);
    return App.misch(raster).slice(0, n);
  }

  function plaetzeWuerfel(n) {
    const MUSTER = {
      1: [[1, 1]], 2: [[0, 0], [2, 2]], 3: [[0, 0], [1, 1], [2, 2]], 4: [[0, 0], [2, 0], [0, 2], [2, 2]],
      5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]], 6: [[0, 0], [0, 1], [0, 2], [2, 0], [2, 1], [2, 2]],
    };
    return (MUSTER[n] || []).map(([s, z]) => [BW / 2 + (s - 1) * 122 - FW / 2, BH / 2 + (z - 1) * 122 - FH / 2]);
  }

  const ZF = { links: 60, oben: 96, bx: 132, by: 124 };   // Zehnerfeld: 2 Reihen mit je 5 Feldern
  function plaetzeZehnerfeld(n) {
    const p = [];
    for (let i = 0; i < n; i++) p.push([ZF.links + (i % 5) * ZF.bx + (ZF.bx - FW) / 2, ZF.oben + Math.floor(i / 5) * ZF.by + (ZF.by - FH) / 2]);
    return p;
  }

  App.aufgaben["mengen"] = {
    hintergrund: "wasserNah",

    start(feld, ctx) {
      const M = App.inhalt.mengen;
      const stufenNr = Math.max(0, Math.min(M.stufen.length - 1, App.stand.mengenStufe | 0));
      const stufe = M.stufen[stufenNr];
      const runden = ctx.einstieg.inhalt.runden || 5;
      let runde = 0, ziel = 0, letzte = 0, gezaehlt = 0, gesperrt = true, fehler = 0, aufAnhieb = 0;

      feld.innerHTML = `<div class="mg-becken"></div><div class="mg-steine"></div>`;
      const becken = $(".mg-becken", feld), steine = $(".mg-steine", feld);
      App.log(`Mengen: Stufe ${stufenNr + 1} (${stufe.name})`);

      const frage = (lang) => ctx.sag(lang ? "Wie viele Fische siehst du? Tippe die Zahl an." : "Wie viele Fische?");
      ctx.wiederhole(() => frage(true));

      function neueRunde() {
        do { ziel = App.zufall(stufe.von, stufe.bis); } while (ziel === letzte);
        letzte = ziel; gezaehlt = 0; fehler = 0;

        // Fische
        const plaetze = stufe.anordnung === "wuerfel" ? plaetzeWuerfel(ziel)
          : stufe.anordnung === "zehnerfeld" ? plaetzeZehnerfeld(ziel) : plaetzeFrei(ziel);
        const farbe = M.fischfarben[App.zufall(0, M.fischfarben.length - 1)];
        becken.innerHTML = stufe.anordnung === "wuerfel" ? `<div class="mg-wuerfel"></div>`
          : stufe.anordnung === "zehnerfeld" ? `<div class="mg-zehnerfeld">${"<i></i>".repeat(10)}</div>` : "";
        plaetze.forEach(([x, y], i) => {
          const f = document.createElement("button");
          f.className = "mg-fisch kommt";
          f.style.left = `${x}px`; f.style.top = `${y}px`; f.style.color = farbe;
          f.style.animationDelay = `${i * 60}ms`;
          f.setAttribute("aria-label", "Fisch");
          f.innerHTML = `<span>${B.fisch()}</span>`;
          f.firstChild.style.animationDelay = `${-App.zufall(0, 2500)}ms`;
          f.addEventListener("click", () => zaehle(f));
          becken.appendChild(f);
        });

        // Zahlen-Kiesel: die richtige Zahl und ihre Nachbarn
        const nachbarn = App.misch([ziel - 2, ziel - 1, ziel + 1, ziel + 2].filter((z) => z >= 1 && z <= 10));
        const auswahl = [ziel, ...nachbarn.slice(0, stufe.auswahl - 1)].sort((a, b) => a - b);
        steine.innerHTML = "";
        for (const z of auswahl) {
          const s = document.createElement("button");
          s.className = "mg-stein";
          s.textContent = String(z);
          s.addEventListener("click", () => antwort(s, z));
          steine.appendChild(s);
        }

        ctx.runde(runde, runden);
        ctx.zeige("?");
        gesperrt = false;
        frage(runde === 0);
      }

      function zaehle(f) {
        if (gesperrt || f.classList.contains("gezaehlt")) return;
        f.classList.add("gezaehlt");
        gezaehlt++;
        ctx.zaehlton(gezaehlt);
      }

      async function antwort(stein, zahl) {
        if (gesperrt || stein.disabled) return;
        if (zahl !== ziel) {
          fehler++;
          stein.disabled = true;
          stein.classList.add("falsch");
          App.merke("zahlen", String(ziel), "fehler");
          ctx.nochmal();
          $$(".mg-fisch", becken).forEach((f) => f.classList.remove("gezaehlt"));
          gezaehlt = 0;
          ctx.sag("Zähl noch einmal. Tippe jeden Fisch an.");
          return;
        }

        gesperrt = true;
        stein.classList.add("richtig");
        if (!fehler) { aufAnhieb++; App.merke("zahlen", String(ziel), "richtig"); }
        App.log(`Mengen: ${ziel} richtig${fehler ? ` nach ${fehler} Fehlversuch(en)` : ""}`);
        App.still();

        // Gemeinsam nachzählen: Fische leuchten der Reihe nach auf, der Roboter piept mit
        ctx.zeige(String(ziel));
        ctx.zaehle(ziel);
        const fische = $$(".mg-fisch", becken);
        fische.forEach((f) => f.classList.remove("gezaehlt"));
        for (let i = 0; i < fische.length; i++) {
          fische[i].classList.add("auf");
          ctx.tick();
          if (!(await ctx.warte(420))) return;
        }

        ctx.richtig();
        await ctx.sag(`Genau! ${M.zahlwoerter[ziel]} ${ziel === 1 ? "Fisch" : "Fische"}.`);
        if (!(await ctx.warte(600))) return;
        runde++;
        if (runde < runden) { neueRunde(); return; }

        if (App.sicher(aufAnhieb, runden) && stufenNr < M.stufen.length - 1) {
          App.stand.mengenStufe = stufenNr + 1;
          App.speichere();
          App.log(`Mengen: nächste Stufe freigeschaltet (${M.stufen[stufenNr + 1].name})`);
        }
        ctx.fertig();
      }

      neueRunde();
    },
  };
})();
