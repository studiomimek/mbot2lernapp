/* Aufgabe „Blitzblick“ (Quallengarten)
 * Im dunklen Wasser leuchten Quallen kurz auf und gehen wieder aus. Wie viele waren es? Das Kind wählt die Zahl.
 * Geübt wird, eine kleine Menge auf einen Blick zu erfassen, ohne einzeln zu zählen; deshalb stehen die Quallen
 * in bekannten Bildern (Würfelbild, zwei Gruppen, Zehnerfeld).
 *
 * Kein Zeitdruck: Nur das Zeigen ist kurz. Mit dem Auge-Knopf (oder dem Lautsprecher) leuchten die Quallen
 * beliebig oft noch einmal, das zählt nicht als Fehler. Nach dem ersten Fehler leuchten sie von selbst noch
 * einmal etwas länger, nach dem zweiten bleiben sie an und lassen sich in Ruhe zählen.
 * Die Stufen stehen in inhalt/rechnen.js („blitz“).
 *
 * Roboter: beim Aufleuchten der stille Lichtblitz (ctx.blitz), sonst die üblichen Reaktionen.
 */
"use strict";

(() => {
  const { $, $$ } = App;
  const B = App.bilder;
  const BW = 780, BH = 440;      // Becken (wie bei den Fischen)
  const QW = 96, QH = 106;       // eine Qualle
  const FARBEN = ["#f48fb1", "#f9d65c", "#6fd0e6", "#b9e36b"];
  const WUERFEL = {
    1: [[1, 1]], 2: [[0, 0], [2, 2]], 3: [[0, 0], [1, 1], [2, 2]], 4: [[0, 0], [2, 0], [0, 2], [2, 2]],
    5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]], 6: [[0, 0], [0, 1], [0, 2], [2, 0], [2, 1], [2, 2]],
  };
  // Würfelbild um die Mitte (mx, my); abstand = Abstand zwischen den Reihen
  const wuerfel = (n, mx, my, abstand) => (WUERFEL[n] || []).map(([s, z]) => [mx + (s - 1) * abstand - QW / 2, my + (z - 1) * abstand - QH / 2]);

  function plaetze(n, anordnung) {
    if (anordnung === "zehnerfeld") return Array.from({ length: n }, (_, i) => [70 + (i % 5) * 132 + (132 - QW) / 2, 70 + Math.floor(i / 5) * 160 + (160 - QH) / 2]);
    // zwei Gruppen nebeneinander, links die größere (7 = 4 und 3)
    if (anordnung === "gruppen" && n > 3) { const links = Math.ceil(n / 2); return [...wuerfel(links, BW * 0.27, BH / 2, 104), ...wuerfel(n - links, BW * 0.73, BH / 2, 104)]; }
    return wuerfel(n, BW / 2, BH / 2, 128);
  }

  App.aufgaben["blitzblick"] = {
    hintergrund: "quallenNah",

    start(feld, ctx) {
      const stufen = App.inhalt.rechnen.blitz, woerter = App.inhalt.mengen.zahlwoerter;
      const stufenNr = Math.max(0, Math.min(stufen.length - 1, App.stand.blitzStufe | 0));
      const st = stufen[stufenNr];
      const runden = ctx.einstieg.inhalt.runden || 5;
      let runde = 0, ziel = 0, letzte = 0, fehler = 0, aufAnhieb = 0, gesperrt = true, bleibtAn = false, zeigNr = 0, nochmal = 0;

      feld.innerHTML = `<div class="bb-becken"></div><button class="knopf bb-zeig" aria-label="Noch einmal zeigen">${B.auge()}</button><div class="mg-steine"></div>`;
      const becken = $(".bb-becken", feld), steine = $(".mg-steine", feld);
      App.log(`Blitzblick: Stufe ${stufenNr + 1} (${st.name})`);

      // Lässt die Quallen ms Millisekunden lang leuchten. Ein neuer Aufruf löst den alten ab.
      async function leuchte(ms) {
        const nr = ++zeigNr;
        becken.classList.add("an");
        ctx.blitz();
        if (!(await ctx.warte(ms))) return;
        if (nr === zeigNr && !bleibtAn) becken.classList.remove("an");
      }
      const nochEinmal = () => { if (gesperrt || bleibtAn) return; nochmal++; leuchte(st.zeit); };
      $(".bb-zeig", feld).addEventListener("click", () => { App.audio.klang("tipp"); nochEinmal(); });
      ctx.wiederhole(() => { ctx.sag("Wie viele Quallen haben geleuchtet? Tippe die Zahl an."); nochEinmal(); });

      async function neueRunde() {
        do { ziel = App.zufall(st.von, st.bis); } while (ziel === letzte);
        letzte = ziel; fehler = 0; nochmal = 0; bleibtAn = false; gesperrt = true;
        becken.classList.remove("an");
        const farbe = FARBEN[App.zufall(0, FARBEN.length - 1)];
        becken.innerHTML = plaetze(ziel, st.anordnung).map(([x, y]) => `<i class="bb-qualle" style="left:${Math.round(x)}px;top:${Math.round(y)}px;color:${farbe}">${B.qualle()}</i>`).join("");

        // Zahlen-Kiesel: die richtige Zahl und ihre Nachbarn
        const nachbarn = App.misch([ziel - 2, ziel - 1, ziel + 1, ziel + 2].filter((z) => z >= 1 && z <= 10));
        const auswahl = [ziel, ...nachbarn.slice(0, st.auswahl - 1)].sort((a, b) => a - b);
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
        const meine = runde;
        await ctx.sag(runde === 0 ? "Gleich leuchten Quallen auf. Schau genau hin!" : "Schau genau hin!");
        if (!ctx.lebt() || meine !== runde) return;
        await leuchte(st.zeit);
        if (!ctx.lebt() || meine !== runde) return;
        gesperrt = false;
        ctx.sag(runde === 0 ? "Wie viele Quallen haben geleuchtet? Tippe die Zahl an. Mit dem Auge siehst du sie noch einmal." : "Wie viele waren es?");
      }

      async function antwort(stein, zahl) {
        if (gesperrt || stein.disabled) return;
        if (zahl !== ziel) {
          fehler++;
          stein.disabled = true;
          stein.classList.add("falsch");
          ctx.nochmal();
          if (fehler >= 2) {
            // Hilfe: Die Quallen bleiben an und lassen sich zählen
            bleibtAn = true;
            becken.classList.add("an");
            ctx.sag("Jetzt bleiben sie an. Zähl in Ruhe.");
          } else {
            const meine = runde;
            ctx.sag("Schau noch einmal hin.").then(() => { if (ctx.lebt() && meine === runde && !gesperrt && !bleibtAn) leuchte(st.zeit + 600); });
          }
          return;
        }

        gesperrt = true;
        stein.classList.add("richtig");
        if (!fehler) aufAnhieb++;
        App.log(`Blitzblick: ${ziel} richtig${fehler ? ` nach ${fehler} Fehlversuch(en)` : ""}${nochmal ? `, ${nochmal}-mal noch einmal gezeigt` : ""}`);
        App.still();

        // Gemeinsam nachzählen: Die Quallen leuchten und hüpfen der Reihe nach
        bleibtAn = true;
        becken.classList.add("an");
        ctx.zeige(String(ziel));
        ctx.zaehle(ziel);
        for (const q of $$(".bb-qualle", becken)) {
          q.classList.add("auf");
          ctx.tick();
          if (!(await ctx.warte(420))) return;
        }
        ctx.richtig();
        await ctx.sag(ziel === 1 ? "Genau! Eine Qualle." : `Genau! ${woerter[ziel]} Quallen.`);
        if (!(await ctx.warte(600))) return;
        runde++;
        if (runde < runden) { neueRunde(); return; }

        if (App.sicher(aufAnhieb, runden) && stufenNr < stufen.length - 1) {
          App.stand.blitzStufe = stufenNr + 1;
          App.speichere();
          App.log(`Blitzblick: nächste Stufe freigeschaltet (${stufen[stufenNr + 1].name})`);
        }
        ctx.fertig();
      }

      neueRunde();
    },
  };
})();
