/* Aufgabe „Zahlenreihe“ (Countdown)
 * Fünf Zahlen in einer Reihe, eine fehlt. Das Kind wählt die fehlende Zahl.
 * Nach der letzten Runde startet die Rakete: mit dem Startknopf oder, wenn der Roboter verbunden ist,
 * indem das Kind die Hand vor die „Augen“ (Ultraschallsensor) des Roboters hält.
 * Die Stufen stehen in inhalt/rechnen.js.
 */
"use strict";

(() => {
  const { $, $$ } = App;
  const B = App.bilder;

  App.aufgaben["reihe"] = {
    hintergrund: "stationNah",

    start(feld, ctx) {
      const stufen = App.inhalt.rechnen.reihe;
      const stufenNr = Math.max(0, Math.min(stufen.length - 1, App.stand.reiheStufe | 0));
      const st = stufen[stufenNr];
      const runden = ctx.einstieg.inhalt.runden || 5;
      let runde = 0, folge = [], luecke = 0, letzte = "", fehler = 0, aufAnhieb = 0, gesperrt = true;

      feld.innerHTML = `
        <div class="rh-reihe"></div>
        <div class="rh-rakete">${B.rakete()}<div class="sb-flamme"></div></div>
        <div class="mg-steine"></div>
        <button class="rh-start aus" aria-label="Rakete starten">🚀</button>`;
      const reihe = $(".rh-reihe", feld), steine = $(".mg-steine", feld);
      App.log(`Zahlenreihe: Stufe ${stufenNr + 1} (${st.name})`);

      const frage = (lang) => ctx.sag(lang ? "Welche Zahl fehlt in der Reihe? Tippe sie an." : "Welche Zahl fehlt?");
      ctx.wiederhole(() => frage(true));

      function neueRunde() {
        do {
          const richtung = st.richtung || (Math.random() < 0.5 ? 1 : -1);
          const start = richtung > 0 ? App.zufall(st.bis > 10 ? 6 : 1, st.bis - 4) : App.zufall(st.bis > 10 ? 10 : 5, st.bis);
          folge = Array.from({ length: 5 }, (_, i) => start + i * richtung);
          luecke = App.zufall(st.richtung === 0 ? 0 : 1, 4);
        } while (`${folge[0]}/${luecke}` === letzte);
        letzte = `${folge[0]}/${luecke}`; fehler = 0;
        const ziel = folge[luecke];

        reihe.innerHTML = folge.map((z, i) => `<div class="rh-feld papier kommt${i === luecke ? " luecke" : ""}" style="animation-delay:${i * 70}ms">${i === luecke ? "?" : z}</div>`).join("");

        const nachbarn = App.misch([ziel - 2, ziel - 1, ziel + 1, ziel + 2].filter((z) => z >= 0 && z <= st.bis));
        const auswahl = [ziel, ...nachbarn.slice(0, 2)].sort((x, y) => x - y);
        steine.innerHTML = "";
        for (const z of auswahl) {
          const k = document.createElement("button");
          k.className = "mg-stein";
          k.textContent = String(z);
          k.addEventListener("click", () => antwort(k, z));
          steine.appendChild(k);
        }

        ctx.runde(runde, runden);
        ctx.zeige("?");
        gesperrt = false;
        frage(runde === 0);
      }

      async function antwort(stein, zahl) {
        if (gesperrt || stein.disabled) return;
        const ziel = folge[luecke];
        if (zahl !== ziel) {
          fehler++;
          stein.disabled = true;
          stein.classList.add("falsch");
          ctx.nochmal();
          ctx.sag("Zähl die Reihe noch einmal.");
          return;
        }

        gesperrt = true;
        stein.classList.add("richtig");
        if (!fehler) aufAnhieb++;
        App.log(`Zahlenreihe: ${folge.join(" ")} – ${ziel} richtig${fehler ? ` nach ${fehler} Fehlversuch(en)` : ""}`);
        App.still();
        const felder = $$(".rh-feld", reihe);
        felder[luecke].textContent = String(ziel);
        felder[luecke].classList.remove("luecke");
        felder[luecke].classList.add("gefuellt");
        ctx.zeige(String(ziel));
        ctx.richtig();
        const gesprochen = ctx.sag(folge.join(", ") + ".");
        for (const f of felder) {
          f.classList.remove("kommt");
          f.classList.add("huepf");
          if (!(await ctx.warte(260))) return;
        }
        await gesprochen;
        if (!(await ctx.warte(500))) return;
        runde++;
        if (runde < runden) { neueRunde(); return; }

        if (aufAnhieb >= runden - 1 && stufenNr < stufen.length - 1) {
          App.stand.reiheStufe = stufenNr + 1;
          App.speichere();
          App.log(`Zahlenreihe: nächste Stufe freigeschaltet (${stufen[stufenNr + 1].name})`);
        }
        raketenstart();
      }

      // Zum Schluss: Rakete starten (Knopf oder Hand vor dem Roboter)
      async function raketenstart() {
        reihe.innerHTML = [3, 2, 1].map((z) => `<div class="rh-feld papier">${z}</div>`).join("");
        steine.innerHTML = "";
        const knopf = $(".rh-start", feld);
        knopf.classList.remove("aus");
        let gestartet = false;
        const los = async (wie) => {
          if (gestartet || !ctx.lebt()) return;
          gestartet = true;
          knopf.classList.add("aus");
          App.log(`Raketenstart ausgelöst: ${wie}`);
          const felder = $$(".rh-feld", reihe);
          for (let i = 0; i < 3; i++) {
            felder[i].classList.add("gefuellt", "huepf");
            ctx.tick();
            await ctx.sag(["Drei", "Zwei", "Eins"][i]);
            if (!ctx.lebt()) return;
          }
          $(".rh-rakete", feld).classList.add("start");
          ctx.rakete();
          await ctx.sag("Und los!");
          if (!(await ctx.warte(1300))) return;
          ctx.fertig();
        };
        knopf.addEventListener("click", () => los("Startknopf"));
        if (ctx.roboter()) {
          ctx.sag("Geschafft! Halte deine Hand vor die Augen vom Roboter. Dann startet die Rakete.");
          if (await ctx.hand(25000, () => !gestartet)) los("Hand vor dem Roboter");
        } else {
          ctx.sag("Geschafft! Drück auf den Startknopf.");
        }
      }

      neueRunde();
    },
  };
})();
