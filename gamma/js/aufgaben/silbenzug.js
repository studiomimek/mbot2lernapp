/* Aufgabe „Silbenzug“ (Bahnhof)
 * Oben steht das Bild eines Wortes, die Stimme sagt das ganze Wort. Auf dem unteren Gleis stehen Waggons mit den
 * Silben, durcheinander. Das Kind tippt sie in der richtigen Reihenfolge an; jeder richtige rollt nach oben und
 * hängt sich an die Lok. Ein falscher wackelt. Nach dem zweiten Fehler leuchtet der richtige Waggon.
 * Ist der Zug vollständig, spricht die Stimme das ganze Wort langsam, die Waggons leuchten Silbe für Silbe mit
 * (App.sagSilben), dann pfeift die Lok und der Zug fährt ab.
 *
 * Die Stimme spricht nie eine einzelne Silbe: immer nur das ganze Wort.
 * Die Lok steht links und schaut nach links, die Waggons hängen rechts an. So stehen die Silben in Leserichtung.
 * Sie steht so weit rechts, wie der Zug Platz lässt: Dann ist von der Abfahrt nach links mehr zu sehen.
 * Bei jeder Aufgabe fährt ein anderer Zug ein (B.zuege in js/bilder.js): die Dampflok mit bunten Güterwagen, ein
 * Schnellzug, ein Kugelkopf-Zug oder ein Regionalzug, jeweils mit Wagen in ihren Farben.
 *
 * Wörter: aus inhalt/woerter.js, nur die mit mindestens zwei Silben, und nur aus Buchstaben, die im Elternbereich
 * aktiv sind (wie bei „Wörter lesen“). Stufen: App.inhalt.zugStufen (auch in inhalt/woerter.js).
 *
 * Roboter: bei jedem angehängten Waggon der kleine Ruck aus dem Silbenspiel (ctx.silbe), am Ende die übliche
 * Freude (ctx.richtig). Keine neuen Befehle.
 */
"use strict";

(() => {
  const { $, $$ } = App;
  const B = App.bilder;
  const GLEIS_OBEN = 440, GLEIS_UNTEN = 668;   // Oberkante der beiden Gleise (wie in B.zugNah in js/bilder.js)
  const LOK_FUSS = 146;                        // Lok: so weit unter ihrer Oberkante stehen die Räder
  const LOK_RECHTS = 216, LOK_LINKS = 36;      // linker Rand der Lok: am liebsten weit rechts, bei langen Wörtern weiter links
  const KUPPLUNG = 192;                        // so weit rechts vom linken Rand der Lok beginnt der erste Waggon
  const WAGGON_B = 170, WAGGON_FUSS = 117;     // Waggon: Breite; so weit unter seiner Oberkante stehen die Räder
  const ABSTAND = 166;                         // Abstand von Waggon zu Waggon im Zug
  const WEIT = 190;                            // Abstand der abgestellten Waggons auf dem unteren Gleis
  const ZUEGE = Object.keys(B.zuege);          // dampf, schnell, kugel, regio

  App.aufgaben["silbenzug"] = {
    hintergrund: "zugNah",

    start(feld, ctx) {
      const stufen = App.inhalt.zugStufen;
      const stufenNr = Math.max(0, Math.min(stufen.length - 1, App.stand.zugStufe | 0));
      const st = stufen[stufenNr];
      const runden = ctx.einstieg.inhalt.runden || 5;
      const aktiv = App.buchstabenAktiv();
      const mehrsilbig = App.inhalt.woerter.filter(([s]) => s.length >= 2);
      let lesbare = mehrsilbig.filter(([s]) => App.lesbar(s, aktiv));
      if (lesbare.length < 3) { App.log(`Silbenzug: nur ${lesbare.length} lesbare Wörter mit mehreren Silben, nehme alle.`, "w"); lesbare = mehrsilbig; }
      let vorrat = lesbare.filter(([s]) => s.length <= st.silben);
      if (vorrat.length < 3) vorrat = lesbare;
      const liste = [];
      while (liste.length < runden) liste.push(...App.misch(vorrat));
      let runde = 0, silben = [], wort = "", naechste = 0, fehler = 0, aufAnhieb = 0, gesperrt = true;
      let zug = "", lokX = LOK_RECHTS;               // welcher Zug gerade dasteht, und wo seine Lok steht
      App.log(`Silbenzug: Stufe ${stufenNr + 1} (${st.name}), ${vorrat.length} Wörter (${vorrat.map((x) => x[0].join("")).join(", ")})`);

      feld.innerHTML = `<div class="zg-bild papier"></div><div class="zg-lok" style="top:${GLEIS_OBEN - LOK_FUSS}px"></div><div class="zg-waggons"></div>`;
      const bildEl = $(".zg-bild", feld), lok = $(".zg-lok", feld), platz = $(".zg-waggons", feld);
      ctx.wiederhole(() => { if (!gesperrt) ctx.sag(`${wort}.`); });

      function neueRunde() {
        const [neueSilben, bild] = liste[runde];
        silben = neueSilben; wort = silben.join(""); naechste = 0; fehler = 0;
        bildEl.textContent = bild;
        // Ein anderer Zug als eben fährt ein. Die Lok steht so weit rechts, dass alle Silben noch dahinter passen.
        zug = App.misch(ZUEGE.filter((z) => z !== zug))[0];
        const art = B.zuege[zug];
        lokX = Math.max(LOK_LINKS, Math.min(LOK_RECHTS, 1004 - KUPPLUNG - silben.length * ABSTAND - 4));
        lok.innerHTML = B.lok(zug);
        lok.style.left = `${lokX}px`;
        lok.classList.remove("ab");                    // die neue Lok rollt von links ein
        // Waggons: die Silben des Wortes, auf der höchsten Stufe dazu eine Silbe aus einem anderen Wort
        const teile = silben.map((s, i) => ({ s, i }));
        if (st.falsch) {
          const fremd = App.misch(lesbare.flatMap(([s]) => s).filter((s) => !silben.some((x) => x.toLowerCase() === s.toLowerCase())))[0];
          if (fremd) teile.push({ s: fremd, i: -1 });
        }
        // mischen; die Silben sollen nicht schon in der richtigen Reihenfolge dastehen
        let gemischt = App.misch(teile);
        for (let k = 0; k < 8 && gemischt.filter((t) => t.i >= 0).every((t, j) => t.i === j); k++) gemischt = App.misch(teile);
        // in der Mitte; bei vier Waggons ein Stück nach rechts, damit links die Figur frei bleibt
        const x0 = Math.max(168, (1024 - (gemischt.length - 1) * WEIT - WAGGON_B) / 2);
        platz.innerHTML = "";
        gemischt.forEach((t, k) => {
          const w = document.createElement("button");
          w.className = "zg-waggon kommt";
          w.style.left = `${Math.round(x0 + k * WEIT)}px`;
          w.style.top = `${GLEIS_UNTEN - WAGGON_FUSS}px`;
          w.style.animationDelay = `${k * 90}ms`;
          w.dataset.silbe = t.s;
          w.setAttribute("aria-label", `Waggon ${t.s}`);
          w.innerHTML = `${B.waggon(art.wagen[k % art.wagen.length], art.streifen)}<b class="${t.s.length > 4 ? "lang" : t.s.length > 3 ? "mittel" : ""}">${t.s}</b>`;
          w.addEventListener("click", () => tipp(w));
          platz.appendChild(w);
        });
        ctx.runde(runde, runden);
        ctx.zeige("?");
        gesperrt = false;
        ctx.sag(runde === 0 ? `Baue den Zug für das Wort: ${wort}. Tippe die Waggons der Reihe nach an.` : `${wort}.`);
      }

      async function tipp(w) {
        if (gesperrt || w.classList.contains("dran")) return;
        if (w.dataset.silbe !== silben[naechste]) {
          fehler++;
          w.classList.remove("wackel", "kommt"); void w.offsetWidth; w.classList.add("wackel");
          ctx.nochmal();
          if (fehler >= 2) {
            // Hilfe: Der richtige Waggon leuchtet
            const richtig = $$(".zg-waggon:not(.dran)", platz).find((x) => x.dataset.silbe === silben[naechste]);
            if (richtig) richtig.classList.add("hilfe");
            ctx.sag(`${wort}. Der Waggon, der leuchtet, kommt jetzt.`);
          } else ctx.sag(`${wort}. Welcher Waggon kommt ${naechste === 0 ? "zuerst" : "jetzt"}?`);
          return;
        }
        // richtig: Der Waggon rollt nach oben und hängt sich an
        $$(".zg-waggon.hilfe", platz).forEach((x) => x.classList.remove("hilfe"));
        w.classList.remove("wackel", "kommt");
        w.classList.add("dran");
        w.dataset.platz = String(naechste);
        w.style.left = `${lokX + KUPPLUNG + naechste * ABSTAND}px`;
        w.style.top = `${GLEIS_OBEN - WAGGON_FUSS}px`;
        ctx.silbe(naechste);
        naechste++;
        if (naechste < silben.length) return;

        // Der Zug ist vollständig
        gesperrt = true;
        if (!fehler) aufAnhieb++;
        App.log(`Silbenzug: ${wort} richtig${fehler ? ` nach ${fehler} Fehlversuch(en)` : ""}`);
        App.still();
        ctx.zeige(wort.slice(0, 8));
        $$(".zg-waggon:not(.dran)", platz).forEach((x) => x.classList.add("bleibt"));   // ein falscher Waggon bleibt stehen
        if (!(await ctx.warte(600))) return;                                             // der letzte Waggon rollt noch heran
        const dran = $$(".zg-waggon.dran", platz).sort((a, b) => a.dataset.platz - b.dataset.platz);
        // das ganze Wort langsam, die Waggons leuchten Silbe für Silbe mit; danach noch einmal in normalem Tempo
        await ctx.sagSilben(silben, (i) => { if (dran[i]) dran[i].classList.add("an"); });
        if (!(await ctx.warte(250))) return;
        await ctx.sag(wort);
        if (!ctx.lebt()) return;
        // Abfahrt: Die Dampflok pfeift, die anderen hupen tiefer; der Zug fährt nach links aus dem Bild
        if (!MBot.verbunden()) { const [a, b] = zug === "dampf" ? [988, 1175] : [440, 554]; App.audio.ton(a, 0.3, 0, 0.12); App.audio.ton(b, 0.3, 0, 0.1); }
        lok.classList.add("ab");
        dran.forEach((x) => x.classList.add("ab"));
        if (!(await ctx.warte(350))) return;
        ctx.richtig();
        await ctx.sag("Abfahrt!");
        if (!(await ctx.warte(1300))) return;                                            // der Zug ist noch unterwegs
        runde++;
        if (runde < runden) { neueRunde(); return; }

        if (App.sicher(aufAnhieb, runden) && stufenNr < stufen.length - 1) {
          App.stand.zugStufe = stufenNr + 1;
          App.speichere();
          App.log(`Silbenzug: nächste Stufe freigeschaltet (${stufen[stufenNr + 1].name})`);
        }
        ctx.fertig();
      }

      neueRunde();
    },
  };
})();
