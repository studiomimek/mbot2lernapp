/* Aufgabe „Silben klatschen“
 * Das iPad sagt ein Wort. Das Kind tippt für jede Silbe einmal auf den Klatsch-Knopf; jeder Tipp baut ein
 * Teil an die Rakete (und der Roboter ruckt mit). Mit dem Startknopf wird geprüft:
 * Stimmt die Zahl, werden die Silben einzeln gesprochen und die Rakete hebt ab.
 * Die Wörter stehen in inhalt/silben.js und werden nur gesprochen (Buchstaben müssen nicht bekannt sein).
 */
"use strict";

(() => {
  const { $, $$ } = App;
  const B = App.bilder;
  const F = App.farben;
  const SPITZE = `<svg viewBox="0 0 110 80"><path d="M0 80 Q4 30 55 0 Q106 30 110 80Z" fill="${F.koralle}"/></svg>`;
  const DUESE = `<svg viewBox="0 0 170 62"><path d="M30 0 L0 60 H30Z M140 0 L170 60 H140Z" fill="${F.koralle}"/><rect x="30" width="110" height="44" fill="${F.papier}"/><rect x="58" y="44" width="54" height="14" fill="${F.tinte}"/></svg>`;

  // Wörter mit wechselnder Silbenzahl auswählen
  function plane(woerter, runden) {
    const nachZahl = {};
    for (const w of woerter) (nachZahl[w[0].length] = nachZahl[w[0].length] || []).push(w);
    for (const k of Object.keys(nachZahl)) nachZahl[k] = App.misch(nachZahl[k]);
    const zahlen = App.misch([1, 2, 2, 3, 3, 3, 4, 4, 5].filter((z) => nachZahl[z]));
    const liste = [];
    let letzte = 0;
    for (let i = 0; liste.length < runden && i < 60; i++) {
      const z = zahlen[i % zahlen.length];
      if (z === letzte && zahlen.length > 1) continue;
      const w = nachZahl[z].pop();
      if (!w) continue;
      liste.push(w); letzte = z;
    }
    while (liste.length < runden) liste.push(woerter[App.zufall(0, woerter.length - 1)]);
    return liste;
  }

  App.aufgaben["silben"] = {
    hintergrund: "stationNah",

    start(feld, ctx) {
      const S = App.inhalt.silben;
      const runden = ctx.einstieg.inhalt.runden || 5;
      const liste = plane(S.woerter, runden);
      let runde = 0, silben = [], wort = "", getippt = 0, fehler = 0, gesperrt = true;

      feld.innerHTML = `
        <button class="sb-bild papier" aria-label="Wort noch einmal hören"><span class="sb-emoji"></span><span class="lf-ton">${B.lautsprecher()}</span></button>
        <div class="sb-wort"></div>
        <div class="sb-rampe"><div class="sb-rakete"></div></div>
        <button class="sb-klatsch" aria-label="Klatschen">👏</button>
        <button class="sb-start" aria-label="Rakete starten">🚀</button>`;
      const emoji = $(".sb-emoji", feld), wortEl = $(".sb-wort", feld), rakete = $(".sb-rakete", feld);
      const klatsch = $(".sb-klatsch", feld), startKnopf = $(".sb-start", feld);

      const frage = (lang) => ctx.sag(lang
        ? `Wie viele Silben hat ${wort}? Klatsche für jede Silbe einmal. Dann starte die Rakete${ctx.roboter() ? ": mit dem Knopf oder mit der Hand vor dem Roboter" : ""}.`
        : wort);
      $(".sb-bild", feld).addEventListener("click", () => { if (!gesperrt) frage(false); });
      ctx.wiederhole(() => { if (!gesperrt) frage(true); });

      function baueRakete() {
        rakete.className = "sb-rakete";
        rakete.innerHTML = `<div class="sb-flamme"></div><div class="sb-duese">${DUESE}</div><div class="sb-spitze">${SPITZE}</div>`;
        getippt = 0;
      }
      const wackle = (el) => { el.classList.remove("wackel"); void el.offsetWidth; el.classList.add("wackel"); };

      function neueRunde() {
        const [neueSilben, bild] = liste[runde];
        silben = neueSilben; wort = silben.join(""); fehler = 0;
        emoji.textContent = bild;
        wortEl.innerHTML = "";
        baueRakete();
        ctx.runde(runde, runden);
        ctx.zeige("?");
        gesperrt = false;
        frage(runde === 0);
      }

      // Eine Silbe: Tipp auf den Knopf oder (falls im Elternbereich eingeschaltet) ein echtes Klatschen
      function klatsche() {
        if (gesperrt) return;
        App.klatschen.sperre();          // der eigene Ton soll nicht als Klatschen zählen
        if (getippt >= S.hoechstens) { wackle(klatsch); return; }
        getippt++;
        const teil = document.createElement("div");
        teil.className = "sb-teil";
        rakete.insertBefore(teil, $(".sb-spitze", rakete));
        ctx.silbe(getippt - 1);
      }
      klatsch.addEventListener("click", klatsche);
      App.klatschen.starte(klatsche).then((hoert) => { if (ctx.lebt()) klatsch.classList.toggle("hoert", hoert); else App.klatschen.stoppe(); });
      ctx.beimEnde(() => App.klatschen.stoppe());

      function starte() {
        if (gesperrt) return;
        if (!getippt) { wackle(klatsch); ctx.sag("Klatsche zuerst die Silben."); return; }
        gesperrt = true;
        App.still();
        if (getippt === silben.length) richtig(); else falsch();
      }
      startKnopf.addEventListener("click", starte);
      // Mit verbundenem Roboter startet die Rakete auch, wenn man die Hand vor seine Augen hält
      (async () => {
        while (ctx.lebt()) {
          const bereit = () => !gesperrt && getippt > 0;
          if (ctx.roboter() && bereit()) { if (await ctx.hand(2000, bereit)) starte(); }
          else if (!(await ctx.warte(400))) return;
        }
      })();

      // Spricht die Silben einzeln und zeigt sie mit Silbenbögen
      async function sprichSilben(mitRakete) {
        wortEl.innerHTML = silben.map((s) => `<span class="sb-silbe">${s}</span>`).join("");
        const spans = $$(".sb-silbe", wortEl), teile = $$(".sb-teil", rakete).reverse();
        for (let i = 0; i < silben.length; i++) {
          spans[i].classList.add("an");
          if (mitRakete && teile[i]) teile[i].classList.add("an");
          ctx.silbe(i);
          await ctx.sag(silben[i]);
          if (!(await ctx.warte(140))) return false;
        }
        return true;
      }

      async function richtig() {
        App.log(`Silben: ${wort} (${silben.length}) richtig${fehler ? ` nach ${fehler} Fehlversuch(en)` : ""}`);
        ctx.zeige(String(silben.length));
        if (!(await sprichSilben(true))) return;
        rakete.classList.add("start");
        ctx.rakete();
        await ctx.sag(`Richtig! ${wort}.`);
        if (!(await ctx.warte(900))) return;
        runde++;
        if (runde >= runden) ctx.fertig(); else neueRunde();
      }

      async function falsch() {
        fehler++;
        App.log(`Silben: ${wort} – ${getippt} statt ${silben.length}`);
        ctx.nochmal();
        wackle(rakete);
        await ctx.sag("Hör noch einmal genau zu.");
        if (!ctx.lebt()) return;
        if (!(await sprichSilben(false))) return;
        baueRakete();
        gesperrt = false;
        ctx.sag(`Jetzt du: ${wort}.`);
      }

      neueRunde();
    },
  };
})();
