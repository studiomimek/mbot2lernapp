/* Aufgabe „Bordcomputer“ (in der Rakete)
 * Ein Steuerpult mit vier farbigen Knöpfen, einem Hebel und Buchstabentasten. Der Bordcomputer gibt Aufträge,
 * das Kind hört zu und bedient das Pult:
 *   farbe   „Drück den roten Knopf.“
 *   anzahl  „Drück den gelben Knopf 3 mal.“            (zählen)
 *   hebel   „Schieb den Hebel nach oben.“
 *   taste   „Drück die Taste, mit der Mond anfängt.“   (Anlaut)
 *   hand    „Halte die Hand vor die Augen vom Roboter.“ (nur mit verbundenem Roboter)
 * Jeder Knopf leuchtet und klingt auch am Roboter in seiner Farbe.
 */
"use strict";

(() => {
  const { $, $$ } = App;
  const FARBEN = {
    rot: { hex: "#e2483d", rgb: [255, 0, 0], wen: "roten", ton: 523 },
    gelb: { hex: "#f9c23c", rgb: [255, 200, 0], wen: "gelben", ton: 659 },
    gruen: { hex: "#3f9b6c", rgb: [0, 255, 0], wen: "grünen", ton: 784 },
    blau: { hex: "#2f9fb5", rgb: [0, 90, 255], wen: "blauen", ton: 988 },
  };
  const LOB = ["Auftrag ausgeführt!", "Sehr gut!", "Genau richtig!", "Prima gemacht!"];

  App.aufgaben["bordcomputer"] = {
    hintergrund: "stationNah",

    start(feld, ctx) {
      const BU = App.inhalt.buchstaben;
      const einzel = App.buchstabenAktiv().filter((b) => b.length === 1);
      const runden = ctx.einstieg.inhalt.runden || 5;
      const arten = App.misch(["farbe", "hebel", "taste", "anzahl", ctx.roboter() ? "hand" : "anzahl"]);
      let runde = 0, auftrag = null, zaehler = 0, uhr = 0, fehler = 0, gesperrt = true, hebelOben = false;

      feld.innerHTML = `
        <div class="bc-pult">
          <button class="bc-schirm" aria-label="Auftrag noch einmal hören"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></button>
          <div class="bc-knoepfe">${Object.keys(FARBEN).map((f) => `<button class="bc-knopf" data-farbe="${f}" style="background:${FARBEN[f].hex}" aria-label="${f}"></button>`).join("")}</div>
          <div class="bc-tasten"></div>
          <button class="bc-hebel" aria-label="Hebel"><span class="bc-griff"></span></button>
        </div>`;
      const schirm = $(".bc-schirm", feld), tasten = $(".bc-tasten", feld), hebel = $(".bc-hebel", feld);

      function zeigeTasten(liste) {
        tasten.innerHTML = "";
        for (const b of liste) {
          const k = document.createElement("button");
          k.className = "bc-taste";
          k.textContent = b;
          k.addEventListener("click", () => { App.audio.klang("tipp"); druecke("taste", b); });
          tasten.appendChild(k);
        }
      }

      function neuerAuftrag(art) {
        const farbe = Object.keys(FARBEN)[App.zufall(0, 3)];
        if (art === "farbe") return { art, farbe, text: `Drück den ${FARBEN[farbe].wen} Knopf.` };
        if (art === "anzahl") { const n = App.zufall(2, 4); return { art, farbe, n, text: `Drück den ${FARBEN[farbe].wen} Knopf ${n} mal.` }; }
        if (art === "hebel") { const richtung = hebelOben ? "unten" : "oben"; return { art, richtung, text: `Schieb den Hebel nach ${richtung}.` }; }
        if (art === "hand") return { art, text: "Halte die Hand vor die Augen vom Roboter." };
        const ziel = einzel[App.zufall(0, einzel.length - 1)];
        const w = BU.zeichen[ziel].woerter;
        const andere = App.misch(einzel.filter((b) => !App.klingtGleich(b, ziel))).slice(0, 3);
        zeigeTasten(App.misch([ziel, ...andere]));
        return { art: "taste", ziel, text: `Drück die Taste, mit der ${w[App.zufall(0, w.length - 1)][0]} anfängt.` };
      }

      const sagAuftrag = () => ctx.sag(auftrag.text);
      schirm.addEventListener("click", () => { if (!gesperrt) sagAuftrag(); });
      ctx.wiederhole(() => { if (!gesperrt) sagAuftrag(); });

      function neueRunde() {
        clearTimeout(uhr);
        zaehler = 0; fehler = 0;
        const meiner = auftrag = neuerAuftrag(arten[runde % arten.length]);
        schirm.classList.remove("ok");
        ctx.runde(runde, runden);
        ctx.zeige("?");
        gesperrt = false;
        ctx.sag((runde === 0 ? "Hier spricht der Bordcomputer. " : "") + auftrag.text);
        if (auftrag.art === "hand") ctx.hand(60000, () => auftrag === meiner && !gesperrt).then((da) => { if (da && auftrag === meiner) geschafft(); });
      }

      // Jede Bedienung am Pult landet hier
      function druecke(typ, wert) {
        if (gesperrt) return;
        const a = auftrag;
        if (a.art === "anzahl" && typ === "knopf" && wert === a.farbe) {
          zaehler++;
          clearTimeout(uhr);
          if (zaehler > a.n) { falsch("Das war zu oft."); return; }
          // Nach dem letzten Druck kurz warten, ob noch einer kommt; bei zu wenigen nach einer Weile helfen
          uhr = setTimeout(zaehler === a.n ? geschafft : () => falsch("Das war noch zu wenig."), zaehler === a.n ? 1300 : 5000);
          return;
        }
        const richtig = (a.art === "farbe" && typ === "knopf" && wert === a.farbe)
          || (a.art === "hebel" && typ === "hebel" && wert === a.richtung)
          || (a.art === "taste" && typ === "taste" && wert === a.ziel);
        if (richtig) geschafft(); else falsch("");
      }

      function falsch(grund) {
        clearTimeout(uhr);
        fehler++; zaehler = 0;
        ctx.nochmal();
        ctx.sag(`${grund} Hör noch einmal zu. ${auftrag.text}`.trim());
      }

      async function geschafft() {
        if (gesperrt) return;
        gesperrt = true;
        clearTimeout(uhr);
        App.log(`Bordcomputer: „${auftrag.text}“ richtig${fehler ? ` nach ${fehler} Fehlversuch(en)` : ""}`);
        schirm.classList.add("ok");
        ctx.zeige(":)");
        ctx.richtig();
        await ctx.sag(LOB[runde % LOB.length]);
        if (!(await ctx.warte(500))) return;
        runde++;
        if (runde >= runden) ctx.fertig(); else neueRunde();
      }

      $$(".bc-knopf", feld).forEach((k) => k.addEventListener("click", () => {
        const f = FARBEN[k.dataset.farbe];
        k.classList.remove("blitzt"); void k.offsetWidth; k.classList.add("blitzt");
        if (!gesperrt) ctx.knopf(f.rgb, f.ton);
        druecke("knopf", k.dataset.farbe);
      }));
      hebel.addEventListener("click", () => {
        hebelOben = !hebelOben;
        hebel.classList.toggle("oben", hebelOben);
        App.audio.klang("strich");
        druecke("hebel", hebelOben ? "oben" : "unten");
      });
      ctx.beimEnde(() => clearTimeout(uhr));

      zeigeTasten(App.misch(einzel).slice(0, 4));
      neueRunde();
    },
  };
})();
