/* Aufgabe „Zahlenmauer“ (Baustelle)
 * Eine Mauer aus Steinen mit Zahlen: Zwei Zahlen nebeneinander ergeben zusammen die Zahl darüber. Ein Stein fehlt
 * (auf der höchsten Stufe zwei nacheinander). Unten auf der Palette liegen drei oder vier Steine zur Wahl. Der
 * richtige wird vom Kran in die Lücke gesetzt, ein falscher wackelt. Danach sagt die Stimme die Rechnung
 * („3 plus 4 ist 7“), und die drei Steine leuchten dabei.
 *
 * Hilfe: Nach dem zweiten Fehler erscheinen Punkte auf den Steinen. Fehlt eine Summe, zeigen die zwei Steine
 * darunter ihre Punkte (weiß und gelb) zum Zusammenzählen. Fehlt ein unterer Stein, zeigt der Stein darüber alle
 * Punkte: weiß die, die schon unten liegen, gelb die, die fehlen.
 * Am Ende des Spiels steht auf der Mauer eine Fahne.
 *
 * Ansagen: immer von ZAHLEN sprechen, die zusammen eine Zahl ergeben. Nicht davon, wie „groß“ ein Stein ist: Auf
 * einem Stein steht eine Zahl, aber er ist nur ein Stein; „so groß wie“ lässt an große Steine denken (Rückmeldung
 * von Michael, v0.29.1).
 * Die Stufen stehen in inhalt/rechnen.js („mauer“).
 *
 * Roboter: die üblichen Reaktionen auf richtig und falsch. Keine neuen Befehle.
 */
"use strict";

(() => {
  const { $, $$ } = App;
  const B = App.bilder;
  const STEIN_B = 150, STEIN_H = 84;       // ein Stein (wie in stil.css bei .zm-stein)
  const WEIT = 156, HOCH = 90;             // Abstand von Stein zu Stein, waagrecht und senkrecht (mit Fuge)
  const BODEN = 520;                       // Oberkante des Sockels, auf dem die unterste Reihe steht
  const WAHL_Y = 618, WAHL_WEIT = 176;     // die Steine zur Wahl stehen auf der Palette (B.mauerNah)
  const SEIL_Y = 112;                      // dort hängt das Seil am Ausleger des Krans

  App.aufgaben["zahlenmauer"] = {
    hintergrund: "mauerNah",

    start(feld, ctx) {
      const stufen = App.inhalt.rechnen.mauer;
      const stufenNr = Math.max(0, Math.min(stufen.length - 1, App.stand.mauerStufe | 0));
      const st = stufen[stufenNr];
      const runden = ctx.einstieg.inhalt.runden || 5;
      // reihen[r][i] = Zahl auf dem Stein; r = 0 ist die unterste Reihe. luecken = die fehlenden Steine, der Reihe nach
      let runde = 0, reihen = [], luecken = [], nr = 0, fehler = 0, fehlerMauer = 0, aufAnhieb = 0, gesperrt = true, letzte = "";

      feld.innerHTML = `<div class="zm-sockel"></div><div class="zm-mauer"></div><div class="zm-wahlen"></div><i class="zm-katze"></i><i class="zm-seil"></i>`;
      const mauer = $(".zm-mauer", feld), wahlen = $(".zm-wahlen", feld), sockel = $(".zm-sockel", feld), seil = $(".zm-seil", feld), katze = $(".zm-katze", feld);
      App.log(`Zahlenmauer: Stufe ${stufenNr + 1} (${st.name})`);

      const platz = (r, i) => ({ x: Math.round(512 - ((st.reihen - r) * WEIT - (WEIT - STEIN_B)) / 2 + i * WEIT), y: BODEN - STEIN_H - r * HOCH });
      const steinEl = (r, i) => $(`.zm-stein[data-r="${r}"][data-i="${i}"]`, mauer);
      const istLuecke = (r, i) => luecken.slice(nr).some((l) => l.r === r && l.i === i);

      // Zahlen für eine neue Mauer; nicht dieselbe wie eben
      function wuerfle() {
        let neu, schluessel;
        do {
          if (st.reihen === 2) {
            const summe = App.zufall(st.fehlt === "oben" ? 2 : 3, st.bis), a = App.zufall(1, summe - 1);
            neu = [[a, summe - a], [summe]];
          } else {
            const b = App.zufall(1, Math.min(3, Math.floor((st.bis - 2) / 2))), rest = st.bis - 2 * b;
            const a = App.zufall(1, rest - 1), c = App.zufall(1, rest - a);
            neu = [[a, b, c], [a + b, b + c], [a + 2 * b + c]];
          }
          schluessel = neu[0].join(" ");
        } while (schluessel === letzte);
        letzte = schluessel;
        return neu;
      }
      // Steine zur Wahl: die richtige Zahl und ihre Nachbarn
      const auswahl = (ziel) => {
        const nah = App.misch([ziel - 2, ziel - 1, ziel + 1, ziel + 2].filter((z) => z >= 1 && z <= st.bis + 2));
        return [ziel, ...nah.slice(0, st.auswahl - 1)].sort((a, b) => a - b);
      };
      // Punkte in einem Stein: weiss weiße, danach gelb gelbe (zum Abzählen)
      const punkte = (weiss, gelb) => `${"<i></i>".repeat(weiss)}${'<i class="b"></i>'.repeat(gelb)}`;

      function neueRunde() {
        reihen = wuerfle();
        const oben = st.reihen - 1;
        luecken = st.fehlt === "oben" ? [{ r: oben, i: 0 }] : st.fehlt === "unten" ? [{ r: 0, i: App.zufall(0, 1) }] : [{ r: 1, i: App.zufall(0, 1) }, { r: oben, i: 0 }];
        nr = 0; fehlerMauer = 0;
        mauer.innerHTML = reihen.map((reihe, r) => reihe.map((wert, i) => {
          const { x, y } = platz(r, i), fehlt = istLuecke(r, i);
          return `<div class="zm-stein${fehlt ? " luecke wartet" : ""}" data-r="${r}" data-i="${i}" style="left:${x}px;top:${y}px"><b>${fehlt ? "?" : wert}</b><span class="zm-punkte"></span></div>`;
        }).join("")).join("");
        const links = platz(0, 0).x - 22;
        sockel.style.cssText = `left:${links}px;top:${BODEN}px;width:${st.reihen * WEIT - (WEIT - STEIN_B) + 44}px`;
        ctx.runde(runde, runden);
        aktiviere();
      }

      // Die nächste Lücke ist dran: Steine zur Wahl hinlegen und fragen
      function aktiviere() {
        const l = luecken[nr], ziel = reihen[l.r][l.i];
        fehler = 0;
        $$(".zm-stein", mauer).forEach((el) => el.classList.remove("an", "mit-punkten"));
        steinEl(l.r, l.i).classList.replace("wartet", "dran");
        const liste = auswahl(ziel), x0 = Math.round(512 - ((liste.length - 1) * WAHL_WEIT + STEIN_B) / 2);
        wahlen.innerHTML = "";
        liste.forEach((z, k) => {
          const s = document.createElement("button");
          s.className = "zm-stein zm-wahl kommt";
          s.style.cssText = `left:${x0 + k * WAHL_WEIT}px;top:${WAHL_Y}px;animation-delay:${k * 70}ms`;
          s.innerHTML = `<b>${z}</b>`;
          s.setAttribute("aria-label", `Stein ${z}`);
          s.addEventListener("click", () => antwort(s, z));
          wahlen.appendChild(s);
        });
        ctx.zeige("?");
        gesperrt = false;
        frage();
      }
      // Die Regel in Worten, je nach Stufe. Beim ersten Mal ausführlich, danach nur noch die Frage.
      const regel = "Zwei Zahlen nebeneinander ergeben zusammen die Zahl darüber.";
      const erklaerung = () => (st.fehlt === "oben" ? "Zähle die zwei Zahlen unten zusammen. Welche Zahl kommt nach oben?"
        : st.fehlt === "unten" ? "Die zwei Zahlen unten ergeben zusammen die Zahl oben. Welche Zahl fehlt unten?"
          : `${regel} Welche Zahl fehlt in der Mitte?`);
      function frage() {
        if (nr > 0) return ctx.sag("Und welche Zahl kommt ganz nach oben?");
        return ctx.sag(runde === 0 ? erklaerung() : "Welche Zahl fehlt?");
      }
      ctx.wiederhole(() => { if (!gesperrt) ctx.sag(nr > 0 ? `${regel} Welche Zahl kommt ganz nach oben?` : erklaerung()); });

      // Die drei Steine einer Rechnung: links und rechts unten, darüber die Summe. Für die Lücke l.
      function rechnung(l) {
        if (l.r > 0) return { a: { r: l.r - 1, i: l.i }, b: { r: l.r - 1, i: l.i + 1 }, s: l };
        return { a: { r: 0, i: 0 }, b: { r: 0, i: 1 }, s: { r: 1, i: 0 } };   // unten fehlt (nur bei der kleinen Mauer)
      }
      // Hilfe: Punkte zum Abzählen
      function zeigePunkte(l) {
        const { a, b, s } = rechnung(l), wa = reihen[a.r][a.i], wb = reihen[b.r][b.i];
        const setze = (p, html) => { const el = steinEl(p.r, p.i); $(".zm-punkte", el).innerHTML = html; el.classList.add("mit-punkten"); };
        if (l.r > 0) { setze(a, punkte(wa, 0)); setze(b, punkte(0, wb)); return "Die Punkte helfen dir. Zähl sie zusammen."; }
        // unten fehlt: Der Stein darüber zeigt alle Punkte, weiß die bekannten, gelb die fehlenden
        const bekannt = l.i === 0 ? b : a, wBekannt = reihen[bekannt.r][bekannt.i];
        setze(s, punkte(wBekannt, reihen[s.r][s.i] - wBekannt));
        setze(bekannt, punkte(wBekannt, 0));
        return "Die Punkte helfen dir. Wie viele gelbe Punkte sind es?";
      }
      // Der Kran hebt den Stein von der Palette in die Lücke: Seil und Laufkatze fahren mit
      function kran(stein, ziel) {
        const vonX = parseFloat(stein.style.left) + STEIN_B / 2;
        for (const el of [seil, katze]) el.classList.add("zm-sofort");
        seil.style.left = katze.style.left = `${vonX}px`;
        seil.style.height = `${WAHL_Y - SEIL_Y}px`;
        void seil.offsetWidth;
        for (const el of [seil, katze]) el.classList.remove("zm-sofort");
        stein.classList.remove("kommt");
        stein.classList.add("fliegt");
        stein.style.left = `${ziel.x}px`;
        stein.style.top = `${ziel.y}px`;
        seil.style.left = katze.style.left = `${ziel.x + STEIN_B / 2}px`;
        seil.style.height = `${ziel.y - SEIL_Y}px`;
      }

      async function antwort(stein, zahl) {
        if (gesperrt || stein.disabled) return;
        const l = luecken[nr], ziel = reihen[l.r][l.i];
        if (zahl !== ziel) {
          fehler++; fehlerMauer++;
          stein.disabled = true;
          stein.classList.remove("kommt");
          stein.classList.add("falsch");
          ctx.nochmal();
          ctx.sag(fehler >= 2 ? zeigePunkte(l) : "Rechne noch einmal.");
          return;
        }
        gesperrt = true;
        App.still();
        const meine = runde;
        kran(stein, platz(l.r, l.i));
        if (!(await ctx.warte(750))) return;
        // Der Stein sitzt: Die Lücke wird zum Stein, das Seil fährt hoch
        const el = steinEl(l.r, l.i);
        el.classList.remove("luecke", "dran", "wartet");
        $("b", el).textContent = String(ziel);
        stein.remove();
        seil.style.height = "0px";
        // die Rechnung sagen, die drei Steine leuchten
        const { a, b, s } = rechnung(l), wa = reihen[a.r][a.i], wb = reihen[b.r][b.i];
        $$(".zm-stein", mauer).forEach((x) => x.classList.remove("mit-punkten"));
        for (const p of [a, b, s]) steinEl(p.r, p.i).classList.add("an");
        ctx.zeige(String(ziel));
        App.log(`Zahlenmauer: ${wa} + ${wb} = ${wa + wb}, gesucht ${ziel}${fehler ? `, ${fehler} Fehlversuch(e)` : ""}`);
        await ctx.sag(`${wa} plus ${wb} ist ${wa + wb}.`);
        if (!ctx.lebt() || meine !== runde) return;
        nr++;
        if (nr < luecken.length) { if (!(await ctx.warte(350))) return; aktiviere(); return; }

        // Die Mauer ist fertig
        if (!fehlerMauer) aufAnhieb++;
        ctx.richtig();
        wahlen.innerHTML = "";
        runde++;
        if (runde < runden) {
          await ctx.sag("Genau!");
          if (!(await ctx.warte(500))) return;
          neueRunde();
          return;
        }
        // Ende des Spiels: eine Fahne auf dem obersten Stein
        $$(".zm-stein", mauer).forEach((x) => x.classList.remove("an"));
        const spitze = platz(st.reihen - 1, 0);
        mauer.insertAdjacentHTML("beforeend", `<span class="zm-fahne" style="left:${spitze.x + STEIN_B / 2 - 6}px;top:${spitze.y - 78}px">${B.fahne()}</span>`);
        await ctx.sag("Genau! Die Mauer steht.");
        if (!(await ctx.warte(700))) return;
        if (App.sicher(aufAnhieb, runden) && stufenNr < stufen.length - 1) {
          App.stand.mauerStufe = stufenNr + 1;
          App.speichere();
          App.log(`Zahlenmauer: nächste Stufe freigeschaltet (${stufen[stufenNr + 1].name})`);
        }
        ctx.fertig();
      }

      neueRunde();
    },
  };
})();
