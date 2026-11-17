/* Extraspiel „Raketen bauen“ in der Raketenhalle (freies Spiel: keine Runden, kein Richtig und Falsch, kein Fundstück)
 *
 * Die Halle ist die Montagehalle. Links steht die Rakete des Kindes, rechts wählt es ihre Teile:
 *   Spitze (4 Formen), Rumpf (3 Formen), Unterteil (4 Formen) und die Farbe (5 Farben).
 * Darüber liegen drei Baupläne; ein Tipp setzt alle Teile auf einmal. Sie lehnen sich im Umriss an echte Raketen an
 * (Saturn V, Ariane, Starship). Gezeichnet ist alles frei, ohne Logos und ohne Schrift (B.bauRakete in js/bilder.js);
 * nur die Stimme nennt den Namen.
 *
 * Die Rakete wird bei jeder Änderung gespeichert (Spielstand „halle“). Seit v0.25 ist sie „die“ Rakete des Kindes
 * (App.meineRakete): Sie steht an der Raketenstation auf der Rampe, startet beim Countdown in der Rakete und fliegt
 * zu den Planeten.
 * Der rote Knopf bringt sie zur Startrampe und startet einen Probeflug: derselbe Start wie beim Countdown
 * (js/raketenstart.js: Zündung, Abheben, Flug durch die Sterne mit Stufentrennung), nur mit einem kurzen Countdown
 * von drei. Danach steht die Rakete wieder in der Halle.
 *
 * Roboter: beim Start die Reaktion „rakete“ (getestet: steigende Töne, ein Satz vor und zurück).
 */
"use strict";

(() => {
  const { $, $$ } = App;
  const B = App.bilder;
  const TEILE = [["spitze", 4, "Spitze"], ["rumpf", 3, "Rumpf"], ["unten", 4, "Unterteil"]];   // Art, Zahl der Formen, Name
  const FARBEN = 5;
  const PLAENE = [
    { spitze: 2, rumpf: 1, unten: 3, farbe: 0, sag: "Wie die Saturn fünf. Sie flog zum Mond." },
    { spitze: 1, rumpf: 0, unten: 1, farbe: 0, sag: "Wie die Ariane. Sie bringt Satelliten ins All." },
    { spitze: 3, rumpf: 2, unten: 2, farbe: 4, sag: "Wie das Starship. Es soll einmal zum Mars fliegen." },
  ];
  const FLUG = ["Das war ein guter Probeflug!", "Sie flog bis zu den Sternen!", "Was für ein Start!"];

  App.aufgaben["raketenbau"] = {
    hintergrund: "halleNah",

    start(feld, ctx) {
      const wahl = App.meineRakete();   // letzte Rakete aus dem Spielstand, sonst die einfache
      let laeuft = false, starts = 0;
      const merke = () => { App.stand.halle = Object.assign({}, wahl); App.speichere(); };

      // Rakete neu zeichnen und die gewählten Knöpfe hervorheben
      function zeichne(plopp) {
        const rakete = $(".rb-rakete", feld);
        rakete.innerHTML = B.bauRakete(wahl);
        $$(".rb-teil", feld).forEach((k) => k.classList.toggle("an", wahl[k.dataset.art] === +k.dataset.nr));
        $$(".rb-farbe", feld).forEach((k) => k.classList.toggle("an", wahl.farbe === +k.dataset.nr));
        $$(".rb-plan", feld).forEach((k) => { const p = PLAENE[+k.dataset.plan]; k.classList.toggle("an", ["spitze", "rumpf", "unten", "farbe"].every((a) => p[a] === wahl[a])); });
        if (plopp) { rakete.classList.remove("neu"); void rakete.offsetWidth; rakete.classList.add("neu"); }
      }

      // Die Halle aufbauen: Rakete, Auswahl, Startknopf (auch nach jedem Probeflug wieder)
      function baueHalle() {
        feld.innerHTML = `
          <div class="rb-rakete"></div>
          <div class="rb-wahl">
            <div class="rb-reihe rb-plaene">${PLAENE.map((p, i) => `<button class="rb-plan" data-plan="${i}" aria-label="Bauplan ${i + 1}">${B.bauTeil("plan", 0, p)}</button>`).join("")}</div>
            ${TEILE.map(([art, n, name]) => `<div class="rb-reihe">${Array.from({ length: n }, (_, i) =>
              `<button class="rb-teil" data-art="${art}" data-nr="${i}" aria-label="${name} ${i + 1}">${B.bauTeil(art, i)}</button>`).join("")}</div>`).join("")}
            <div class="rb-reihe rb-farben">${Array.from({ length: FARBEN }, (_, i) => `<button class="rb-farbe" data-nr="${i}" style="background:${B.bauFarbe(i)}" aria-label="Farbe ${i + 1}"></button>`).join("")}</div>
          </div>
          <button class="rb-start" aria-label="Zur Startrampe und starten">🚀</button>`;
        $$(".rb-teil", feld).forEach((k) => k.addEventListener("click", () => {
          wahl[k.dataset.art] = +k.dataset.nr;
          App.audio.klang("strich");
          merke();
          zeichne(true);
        }));
        $$(".rb-farbe", feld).forEach((k) => k.addEventListener("click", () => {
          wahl.farbe = +k.dataset.nr;
          App.audio.klang("tipp");
          merke();
          zeichne(false);
        }));
        $$(".rb-plan", feld).forEach((k) => k.addEventListener("click", () => {
          const p = PLAENE[+k.dataset.plan];
          Object.assign(wahl, { spitze: p.spitze, rumpf: p.rumpf, unten: p.unten, farbe: p.farbe });
          App.audio.klang("staunen");
          merke();
          zeichne(true);
          ctx.sag(p.sag);
        }));
        $(".rb-start", feld).addEventListener("click", probeflug);
        zeichne(false);
      }

      // Probeflug: zur Startrampe, kurzer Countdown, dann der gemeinsame Start; danach wieder in die Halle
      async function probeflug() {
        if (laeuft) return;
        laeuft = true;
        merke();
        App.still();
        App.log(`Probeflug aus der Halle: Spitze ${wahl.spitze + 1}, Rumpf ${wahl.rumpf + 1}, Unterteil ${wahl.unten + 1}, Farbe ${wahl.farbe + 1}`);
        App.raketenstart.rampe(feld, wahl, `<div class="cd-zahl">3</div>`);
        const zahl = $(".cd-zahl", feld);
        await ctx.sag("Deine Rakete steht an der Startrampe.");
        if (!ctx.lebt()) return;
        for (const [i, wort] of ["Drei", "Zwei", "Eins"].entries()) {
          zahl.textContent = String(3 - i);
          zahl.classList.remove("plopp"); void zahl.offsetWidth; zahl.classList.add("plopp");
          ctx.zeige(String(3 - i));
          ctx.tick();
          await Promise.all([ctx.sag(wort), App.warte(500)]);
          if (!ctx.lebt()) return;
        }
        zahl.textContent = "Los!";
        zahl.style.fontSize = "170px";
        ctx.sag("Und los!");
        if (!(await App.raketenstart.fliege(feld, ctx, wahl))) return;
        ctx.zeige(":)");
        ctx.sag(FLUG[starts++ % FLUG.length]);
        if (!(await ctx.warte(1800))) return;
        baueHalle();
        laeuft = false;
      }

      ctx.wiederhole(() => { if (!laeuft) ctx.sag("Bau deine eigene Rakete. Rechts wählst du die Spitze, den Rumpf, das Unterteil und die Farbe. Ganz oben sind drei Baupläne von echten Raketen. Der rote Knopf bringt die Rakete zur Startrampe. Dort startet sie zu einem Probeflug."); });
      ctx.beimEnde(merke);
      baueHalle();
      ctx.zeige(":)");
      ctx.sag("Hier baust du deine eigene Rakete. Wähle rechts die Teile. Der rote Knopf bringt sie zur Startrampe.");
    },
  };
})();
