/* Aufgabe „Wörter lesen“
 * Ein Wort steht in Grundschrift mit Silbenbögen da (es wird NICHT vorgelesen). Das Kind liest und tippt das
 * passende Bild an. Danach liest die App das Wort Silbe für Silbe vor.
 * Es kommen nur Wörter aus Buchstaben dran, die im Elternbereich aktiv sind (inhalt/woerter.js).
 * Der Lautsprecher-Knopf oben liest das Wort als Hilfe langsam vor.
 */
"use strict";

(() => {
  const { $, $$ } = App;

  // Sind alle Buchstaben des Wortes aktiv? (au, ei, eu, sch zählen als eigene Lautverbindung)
  function lesbar(silben, aktiv) {
    let w = silben.join("").toLowerCase();
    for (const g of ["sch", "ei", "au", "eu"]) {
      if (!w.includes(g)) continue;
      if (!aktiv.includes(g[0].toUpperCase() + g.slice(1))) return false;
      w = w.split(g).join("");
    }
    return Array.from(w).every((c) => aktiv.includes(c.toUpperCase()));
  }

  App.aufgaben["lesen"] = {
    hintergrund: "wrackNah",

    start(feld, ctx) {
      const alle = App.inhalt.woerter;
      const aktiv = App.buchstabenAktiv();
      let vorrat = alle.filter(([silben]) => lesbar(silben, aktiv));
      if (vorrat.length < 3) { App.log(`Lesen: nur ${vorrat.length} lesbare Wörter, nehme alle Wörter.`, "w"); vorrat = alle; }
      const runden = ctx.einstieg.inhalt.runden || 5;
      const liste = [];
      while (liste.length < runden) liste.push(...App.misch(vorrat));
      let runde = 0, silben = [], wort = "", fehler = 0, gesperrt = true;
      App.log(`Lesen: ${vorrat.length} lesbare Wörter (${vorrat.map((x) => x[0].join("")).join(", ")})`);

      feld.innerHTML = `<div class="ls-wort papier"></div><div class="ab-karten ls-karten"></div>`;
      const wortEl = $(".ls-wort", feld), karten = $(".ls-karten", feld);

      async function liesVor() {
        const spans = $$(".sb-silbe", wortEl);
        spans.forEach((s) => s.classList.remove("an"));
        // erst langsam mit Silbenbögen, dann in normalem Tempo (einzelne Silben spricht die Computerstimme falsch)
        await ctx.sagSilben(silben, (i) => spans[i].classList.add("an"));
        if (!(await ctx.warte(250))) return false;
        if (silben.length > 1) await ctx.sag(wort);
        return ctx.lebt();
      }
      ctx.wiederhole(() => { if (!gesperrt) { fehler++; liesVor(); } });

      function neueRunde() {
        const [neueSilben, bild] = liste[runde];
        silben = neueSilben; wort = silben.join(""); fehler = 0;
        wortEl.innerHTML = silben.map((s) => `<span class="sb-silbe">${s}</span>`).join("");
        const falsche = App.misch(alle.filter(([s, b]) => s.join("") !== wort && b !== bild)).slice(0, 2);
        karten.innerHTML = "";
        App.misch([[silben, bild], ...falsche]).forEach(([s, b], i) => {
          const k = document.createElement("button");
          k.className = "ab-karte papier kommt";
          k.style.animationDelay = `${i * 80}ms`;
          k.dataset.wort = s.join("");
          k.textContent = b;
          k.addEventListener("click", () => antwort(k));
          karten.appendChild(k);
        });
        ctx.runde(runde, runden);
        ctx.zeige("?");
        gesperrt = false;
        ctx.sag(runde === 0 ? "Lies das Wort. Welches Bild passt dazu?" : "Welches Bild passt?");
      }

      async function antwort(karte) {
        if (gesperrt || karte.disabled) return;
        if (karte.dataset.wort !== wort) {
          fehler++;
          karte.disabled = true;
          karte.classList.add("falsch");
          ctx.nochmal();
          ctx.sag(`${karte.dataset.wort}? Lies noch einmal genau.`);
          return;
        }
        gesperrt = true;
        karte.classList.add("richtig");
        App.log(`Lesen: ${wort} richtig${fehler ? ` (mit Hilfe oder ${fehler} Fehlversuch)` : ""}`);
        App.still();
        ctx.zeige(wort.slice(0, 8));
        if (!(await liesVor())) return;
        ctx.richtig();
        await ctx.sag("Richtig gelesen!");
        if (!(await ctx.warte(600))) return;
        runde++;
        if (runde >= runden) ctx.fertig(); else neueRunde();
      }

      neueRunde();
    },
  };
})();
