/* „Zahlenstrahl“ (am Steg im Hafen)
 * Der Steg hat nummerierte Planken. Die Figur steht auf einer Planke und fährt einige Schritte vor oder zurück:
 * Wo kommt sie an? Das Kind tippt die Planke an, dann fährt die Figur Schritt für Schritt hin (mit Zählton).
 * Hilfe nach dem zweiten Fehler: Die Figur fährt die Schritte vor, das Kind tippt, wo sie jetzt steht.
 * Stufen in inhalt/rechnen.js („strahl“). Die Figur ist die übliche Figur des Spielrahmens, sie wird nur
 * auf den Steg gesetzt (keine zweite Figur).
 */
"use strict";

(() => {
  const { $, $$ } = App;
  const SCHRITT = ["null", "einen Schritt", "zwei Schritte", "drei Schritte", "vier Schritte", "fünf Schritte", "sechs Schritte"];

  App.aufgaben["zahlenstrahl"] = {
    hintergrund: "hafenNah",

    start(feld, ctx) {
      const stufen = App.inhalt.rechnen.strahl;
      const stufenNr = Math.max(0, Math.min(stufen.length - 1, App.stand.strahlStufe | 0));
      const st = stufen[stufenNr];
      const runden = ctx.einstieg.inhalt.runden || 5;
      let runde = 0, von = 0, schritte = 0, ziel = 0, fehler = 0, aufAnhieb = 0, gesperrt = true, letzte = "";

      feld.innerHTML = `<div class="zs-aufgabe papier"></div><div class="zs-steg${st.bis > 10 ? " lang" : ""}">${
        Array.from({ length: st.bis + 1 }, (_, i) => `<button class="zs-planke" data-z="${i}">${i}</button>`).join("")}</div>`;
      const aufgabe = $(".zs-aufgabe", feld), steg = $(".zs-steg", feld), planken = $$(".zs-planke", feld);
      const robi = $("#aufgabe .rover-aufgabe");
      robi.classList.add("zs-robi");
      App.log(`Zahlenstrahl: Stufe ${stufenNr + 1} (${st.name})`);

      const richtung = () => (ziel > von ? "vor" : "zurück");
      const stelle = (z) => { const p = planken[z]; robi.style.left = `${steg.offsetLeft + p.offsetLeft + p.offsetWidth / 2 - 50}px`; };
      const frage = () => ctx.sag(`Ich stehe auf der ${von}. Ich fahre ${SCHRITT[schritte] || `${schritte} Schritte`} ${richtung()}. Wo komme ich an?`);
      ctx.wiederhole(() => { if (!gesperrt) frage(); });

      function neueRunde() {
        do {
          const dir = st.richtung || (Math.random() < 0.5 ? 1 : -1);
          schritte = App.zufall(1, st.schritte);
          von = dir > 0 ? App.zufall(0, st.bis - schritte) : App.zufall(schritte, st.bis);
          ziel = von + dir * schritte;
        } while (`${von}/${ziel}` === letzte);
        letzte = `${von}/${ziel}`; fehler = 0;
        planken.forEach((p) => { p.className = "zs-planke"; p.disabled = false; });
        planken[von].classList.add("start");
        aufgabe.innerHTML = `<b>${von}</b><span class="zs-pfeil">${ziel > von ? "→" : "←"}</span><b>${schritte}</b>`;
        stelle(von);
        ctx.runde(runde, runden);
        ctx.zeige(String(von));
        gesperrt = false;
        frage();
      }

      // Die Figur fährt Schritt für Schritt zur Zielplanke. false = das Spiel wurde verlassen
      async function fahre() {
        const dir = ziel > von ? 1 : -1;
        for (let i = 1; i <= schritte; i++) {
          stelle(von + dir * i);
          robi.classList.remove("zs-huepf"); void robi.offsetWidth; robi.classList.add("zs-huepf");
          ctx.zaehlton(i);
          ctx.zeige(String(von + dir * i));
          if (!(await ctx.warte(560))) return false;
        }
        return true;
      }

      async function antwort(p) {
        if (gesperrt || p.disabled) return;
        if (+p.dataset.z !== ziel) {
          fehler++;
          p.disabled = true;
          p.classList.add("falsch");
          if (fehler === 1) App.merke("zahlen", String(ziel), "fehler");
          ctx.nochmal();
          if (fehler < 2) { ctx.sag("Zähl die Schritte mit dem Finger."); return; }
          // Hilfe: Die Figur fährt die Schritte vor, das Kind tippt, wo sie jetzt steht
          gesperrt = true;
          await ctx.sag("Schau zu. Wir zählen die Schritte zusammen.");
          if (!ctx.lebt() || !(await fahre())) return;
          gesperrt = false;
          ctx.sag("Wo stehe ich jetzt? Tippe die Zahl an.");
          return;
        }
        gesperrt = true;
        p.classList.add("richtig");
        if (!fehler) { aufAnhieb++; App.merke("zahlen", String(ziel), "richtig"); }
        App.log(`Zahlenstrahl: ${von} ${richtung()} ${schritte} = ${ziel} richtig${fehler ? ` nach ${fehler} Fehlversuch(en)` : ""}`);
        App.still();
        if (fehler < 2 && !(await fahre())) return;        // nach der Hilfe steht die Figur schon dort
        ctx.richtig();
        await ctx.sag(`Genau! ${von} ${ziel > von ? "plus" : "minus"} ${schritte} ist ${ziel}.`);
        if (!(await ctx.warte(600))) return;
        runde++;
        if (runde < runden) { neueRunde(); return; }
        if (App.sicher(aufAnhieb, runden) && stufenNr < stufen.length - 1) {
          App.stand.strahlStufe = stufenNr + 1;
          App.speichere();
          App.log(`Zahlenstrahl: nächste Stufe freigeschaltet (${stufen[stufenNr + 1].name})`);
        }
        ctx.fertig();
      }

      planken.forEach((p) => p.addEventListener("click", () => antwort(p)));
      neueRunde();
    },
  };
})();
