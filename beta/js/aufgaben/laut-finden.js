/* Aufgabe „Laut hören → Buchstaben finden“
 * Drei Krebse tragen Buchstaben. Das iPad fragt nach dem Anlaut, das Kind tippt den passenden Krebs an.
 *
 * Mit eigener Aufnahme (audio/laute/m.m4a): Der Laut wird abgespielt („mmm“).
 * Ohne Aufnahme: Bild und Frage „Womit fängt Maus an?“. So wird kein Buchstabenname („Em“) vorgesagt.
 */
"use strict";

(() => {
  const { $ } = App;
  const B = App.bilder;
  const KREBSFARBEN = ["#f0715b", "#f59a3c", "#e2587a"];

  // Wählt die Buchstaben für die Runden: unsichere zuerst, keiner zweimal hintereinander
  function plane(alle, runden) {
    const st = App.stand.buchstaben;
    const wert = (b) => ((st[b] && st[b].richtig) || 0) - 2 * ((st[b] && st[b].fehler) || 0) + Math.random();
    const sortiert = alle.map((b) => [wert(b), b]).sort((a, c) => a[0] - c[0]).map((x) => x[1]);
    const liste = [];
    for (let i = 0; liste.length < runden; i++) liste.push(sortiert[i % sortiert.length]);
    let gemischt = App.misch(liste);
    for (let i = 1; i < gemischt.length; i++) {
      if (gemischt[i] === gemischt[i - 1] && i + 1 < gemischt.length) [gemischt[i], gemischt[i + 1]] = [gemischt[i + 1], gemischt[i]];
    }
    return gemischt;
  }

  App.aufgaben["laut-finden"] = {
    hintergrund: "sandNah",

    start(feld, ctx) {
      const BU = App.inhalt.buchstaben;
      const alle = App.buchstabenAktiv();
      const runden = ctx.einstieg.inhalt.runden || 5;
      const ziele = plane(alle, runden);
      let runde = 0, ziel = "", wort = "", fehler = 0, gesperrt = true, mitAufnahme = false;

      feld.innerHTML = `
        <button class="lf-frage papier" aria-label="Noch einmal hören">
          <span class="lf-bild"></span><span class="lf-ton">${B.lautsprecher()}</span>
        </button>
        <div class="lf-krebse"></div>`;
      const frageKnopf = $(".lf-frage", feld), reihe = $(".lf-krebse", feld);
      frageKnopf.addEventListener("click", () => frage(false));
      ctx.wiederhole(() => frage(false));

      async function frage(einleitung) {
        if (mitAufnahme) {
          if (einleitung) await ctx.sag("Hör genau hin. Welcher Krebs trägt diesen Laut?");
          if (!ctx.lebt()) return;
          await ctx.spielLaut(ziel);
        } else {
          await ctx.sag(einleitung ? `Hör genau hin. Womit fängt ${wort} an?` : `Womit fängt ${wort} an?`);
        }
      }

      async function neueRunde() {
        ziel = ziele[runde];
        fehler = 0;
        const w = BU.zeichen[ziel].woerter;
        const [neuesWort, bild] = w[App.zufall(0, w.length - 1)];
        wort = neuesWort;
        mitAufnahme = await App.laut.vorhanden(ziel);
        if (!ctx.lebt()) return;

        $(".lf-bild", feld).textContent = mitAufnahme ? "" : bild;
        frageKnopf.classList.toggle("nur-ton", mitAufnahme);

        // Keine Auswahl mit gleichem ersten Buchstaben (sonst wäre bei „Eis“ sowohl Ei als auch E richtig)
        let andere = alle.filter((b) => !App.klingtGleich(b, ziel));
        if (andere.length < 2) andere = alle.filter((b) => b !== ziel);
        const auswahl = App.misch([ziel, ...App.misch(andere).slice(0, 2)]);
        reihe.innerHTML = "";
        auswahl.forEach((b, i) => {
          const k = document.createElement("button");
          k.className = "lf-krebs kommt";
          k.style.animationDelay = `${i * 90}ms`;
          k.setAttribute("aria-label", b);
          const schrift = b.length > 1 ? b : `${b}<small>${b.toLowerCase()}</small>`;
          k.innerHTML = `<span class="lf-karte papier">${schrift}</span>${B.krebs(KREBSFARBEN[i % KREBSFARBEN.length])}`;
          k.addEventListener("click", () => antwort(k, b));
          reihe.appendChild(k);
        });

        ctx.runde(runde, runden);
        ctx.zeige("?");
        gesperrt = false;
        frage(runde === 0);
      }

      async function antwort(knopf, b) {
        if (gesperrt || knopf.disabled) return;
        if (b === ziel) {
          gesperrt = true;
          knopf.classList.add("richtig");
          App.merke("buchstaben", ziel, fehler ? "fehler" : "richtig");
          App.log(`Laut finden: ${ziel} richtig${fehler ? ` nach ${fehler} Fehlversuch(en)` : ""}`);
          ctx.zeige(ziel);
          ctx.richtig();
          await ctx.sag(mitAufnahme ? "Richtig!" : `Richtig! ${wort}.`);
          if (!(await ctx.warte(700))) return;
          runde++;
          if (runde >= runden) ctx.fertig(); else neueRunde();
        } else {
          fehler++;
          knopf.disabled = true;
          knopf.classList.add("falsch");
          ctx.nochmal();
          await ctx.sag("Hör noch einmal genau hin.");
          if (!ctx.lebt() || gesperrt) return;
          frage(false);
        }
      }

      neueRunde();
    },
  };
})();
