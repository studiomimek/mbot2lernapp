/* Aufgabe „Buchstaben nachspuren“
 * Der Buchstabe liegt als Rille im nassen Sand. Erst wird vorgemacht (Reihenfolge und Richtung der Striche),
 * dann spurt das Kind mit Finger oder Stift nach. Die Rille füllt sich mit Wasser, so weit richtig gespurt wurde.
 *
 * Verzeiht viel: breiter Korridor, Absetzen erlaubt. Wer daneben oder in falscher Richtung fährt,
 * kommt einfach nicht weiter; es gibt keinen Fehlerton.
 *
 * Die Strichdaten stehen in inhalt/buchstaben.js.
 */
"use strict";

(() => {
  const { $ } = App;
  const B = App.bilder;

  const W = 520, H = 600;          // Zeichenfläche in Bühnen-Pixeln
  const MASS = 4.2, OBEN = 100;    // Pixel pro Einheit der Strichdaten; y der Oberlinie
  const SCHRITT = 8;               // Abstand der Prüfpunkte in Pixeln
  const TOL = 40;                  // so weit darf der Finger neben der Spur liegen
  const START_TOL = 54;            // so nah am Startpunkt muss der Finger aufsetzen
  const VORAUS = 6;                // so viele Prüfpunkte darf der Finger vorauseilen (auch: so früh darf er umkehren)
  const ENDE_NAH = 3;              // so viele Prüfpunkte vor dem Ende gilt der Strich als geschafft
  const DEMO_TEMPO = 300;          // Pixel pro Sekunde beim Vormachen
  const RILLE = "#cfa962", WASSER = "#2f9fb5", TINTE = "#23324a", KORALLE = "#f0715b";
  const LOB = ["Toll geschrieben!", "Super gemacht!", "Sehr schön!", "Prima!"];

  const abstand = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

  // Zwei am wenigsten geübte Buchstaben, jeweils groß und klein
  function plane(alle, runden) {
    const st = App.stand.buchstaben;
    const geuebt = (b) => (st[b] && st[b].gespurt) || 0;
    const sortiert = alle.map((b, i) => [geuebt(b), i, b]).sort((a, c) => a[0] - c[0] || a[1] - c[1]).map((x) => x[2]);
    const liste = [];
    for (let i = 0; liste.length < runden; i++) {
      const b = sortiert[i % sortiert.length];
      liste.push({ buchstabe: b, form: "gross", zeichen: b });
      if (liste.length < runden) liste.push({ buchstabe: b, form: "klein", zeichen: b.toLowerCase() });
    }
    return liste;
  }

  App.aufgaben["nachspuren"] = {
    hintergrund: "sandNah",

    start(feld, ctx) {
      const BU = App.inhalt.buchstaben;
      const alle = (ctx.einstieg.inhalt.buchstaben || BU.aktiv).filter((b) => BU.zeichen[b]);
      const glyphen = plane(alle, ctx.einstieg.inhalt.runden || 4);

      feld.innerHTML = `
        <div class="ns-tafel"><canvas class="ns-leinwand" width="${W * 2}" height="${H * 2}"></canvas></div>
        <div class="ns-vorbild papier"></div>
        <button class="ns-zeig knopf" aria-label="Zeig es mir">${B.auge()}</button>`;
      const tafel = $(".ns-tafel", feld), cv = $(".ns-leinwand", feld), vorbild = $(".ns-vorbild", feld);
      const g = cv.getContext("2d");
      g.scale(2, 2);

      let nr = 0;              // welcher Buchstabe
      let striche = [];        // Punktlisten in Pixeln, ein Eintrag pro Strich
      let strichNr = 0;        // welcher Strich ist dran
      let fortschritt = 0;     // bis zu welchem Punkt des Strichs gespurt ist
      let spur = [];           // was der Finger gerade malt
      let zeiger = false, gesperrt = true, fertig = false;
      let demo = null, fehlstarts = 0, pulsBis = 0;

      /* ---------- Zeichnen ---------- */
      function linie(p, von, bis, farbe, breite, strichelung) {
        if (bis <= von) return;
        g.beginPath();
        g.moveTo(p[von][0], p[von][1]);
        for (let i = von + 1; i <= bis; i++) g.lineTo(p[i][0], p[i][1]);
        g.strokeStyle = farbe; g.lineWidth = breite; g.lineCap = "round"; g.lineJoin = "round";
        g.setLineDash(strichelung || []);
        g.stroke();
        g.setLineDash([]);
      }
      function punkt(q, zahl, aktiv, radius) {
        g.beginPath(); g.arc(q[0], q[1], radius, 0, Math.PI * 2);
        g.fillStyle = aktiv ? KORALLE : "#fff8ea"; g.fill();
        g.lineWidth = 4; g.strokeStyle = aktiv ? "#fff" : RILLE; g.stroke();
        g.fillStyle = aktiv ? "#fff" : TINTE;
        g.font = `700 ${Math.round(radius * 1.1)}px -apple-system, "Segoe UI", sans-serif`;
        g.textAlign = "center"; g.textBaseline = "middle";
        g.fillText(String(zahl), q[0], q[1] + 1);
      }
      function pfeil(p, ab) {
        const i = Math.min(ab + 8, p.length - 1);
        if (i - ab < 5) return;
        const a = p[i - 2], b = p[i];
        const w = Math.atan2(b[1] - a[1], b[0] - a[0]);
        g.save();
        g.translate(b[0], b[1]); g.rotate(w);
        g.beginPath(); g.moveTo(12, 0); g.lineTo(-9, -11); g.lineTo(-9, 11); g.closePath();
        g.fillStyle = "#fff"; g.fill();
        g.restore();
      }

      function male() {
        g.clearRect(0, 0, W, H);
        // Lineatur: Oberlinie, Mittellinie (gestrichelt), Grundlinie
        for (const [y, strichelung] of [[OBEN, []], [OBEN + 50 * MASS, [10, 12]], [OBEN + 100 * MASS, []]]) {
          g.beginPath(); g.moveTo(24, y); g.lineTo(W - 24, y);
          g.strokeStyle = "rgba(35,50,74,.2)"; g.lineWidth = 3; g.lineCap = "round";
          g.setLineDash(strichelung); g.stroke(); g.setLineDash([]);
        }
        striche.forEach((p) => linie(p, 0, p.length - 1, RILLE, 46));

        if (demo) {
          striche.forEach((p, i) => {
            if (i < demo.strich) linie(p, 0, p.length - 1, WASSER, 34);
            else if (i === demo.strich) linie(p, 0, demo.idx, WASSER, 34);
          });
          striche.forEach((p, i) => { if (i > demo.strich) punkt(p[0], i + 1, false, 15); });
          const q = striche[demo.strich][demo.idx];
          g.beginPath(); g.arc(q[0], q[1], 17, 0, Math.PI * 2);
          g.fillStyle = KORALLE; g.fill(); g.lineWidth = 5; g.strokeStyle = "#fff"; g.stroke();
          return;
        }

        striche.forEach((p, i) => {
          const bis = fertig || i < strichNr ? p.length - 1 : i === strichNr ? fortschritt : 0;
          linie(p, 0, bis, WASSER, 34);
        });
        if (fertig) return;

        striche.forEach((p, i) => { if (i > strichNr) punkt(p[0], i + 1, false, 15); });
        const p = striche[strichNr];
        linie(p, fortschritt, p.length - 1, "rgba(255,255,255,.9)", 4, [1, 13]);
        pfeil(p, fortschritt);
        punkt(p[fortschritt], strichNr + 1, true, Date.now() < pulsBis ? 27 : 20);

        if (spur.length > 1) linie(spur, 0, spur.length - 1, "rgba(35,50,74,.3)", 7);
      }

      /* ---------- Buchstaben laden ---------- */
      function ladeGlyph() {
        const gl = glyphen[nr];
        const def = BU.zeichen[gl.buchstabe][gl.form];
        const links = (W - def.breite * MASS) / 2;
        striche = def.striche.map((d) => App.pfadPunkte(d, SCHRITT / MASS).map(([x, y]) => [links + x * MASS, OBEN + y * MASS]));
        strichNr = 0; fortschritt = 0; spur = []; zeiger = false; fertig = false; fehlstarts = 0;
        tafel.classList.remove("geschafft");
        vorbild.textContent = gl.zeichen;
        ctx.runde(nr, glyphen.length);
        ctx.zeige("?");
        male();
      }

      /* ---------- Vormachen ---------- */
      function starteDemo() {
        if (fertig || !striche.length) return Promise.resolve();
        const meins = demo = { strich: 0, idx: 0 };
        zeiger = false; spur = [];
        return new Promise((ende) => {
          let zu = false;
          const schluss = () => {
            if (zu) return;
            zu = true;
            if (demo === meins) demo = null;
            if (ctx.lebt()) male();
            ende();
          };
          const laenge = striche.reduce((s, p) => s + p.length * SCHRITT, 0);
          setTimeout(schluss, laenge / DEMO_TEMPO * 1500 + striche.length * 400 + 1500);   // falls die Animation hängt

          let zuletzt = performance.now(), rest = 0, pause = 250;
          function schritt(jetzt) {
            if (zu) return;
            if (!ctx.lebt() || demo !== meins) return schluss();
            const dt = Math.min(80, jetzt - zuletzt);
            zuletzt = jetzt;
            if (pause > 0) pause -= dt;
            else {
              rest += dt * DEMO_TEMPO / 1000 / SCHRITT;
              const n = Math.floor(rest);
              rest -= n;
              meins.idx += n;
              const p = striche[meins.strich];
              if (meins.idx >= p.length - 1) {
                meins.idx = p.length - 1;
                if (meins.strich >= striche.length - 1) { male(); setTimeout(schluss, 450); return; }
                male();
                meins.strich++; meins.idx = 0; rest = 0; pause = 350;
                requestAnimationFrame(schritt);
                return;
              }
            }
            male();
            requestAnimationFrame(schritt);
          }
          requestAnimationFrame(schritt);
        });
      }

      /* ---------- Nachspuren ---------- */
      function ort(ev) {
        const r = cv.getBoundingClientRect();
        return [(ev.clientX - r.left) * W / r.width, (ev.clientY - r.top) * H / r.height];
      }

      // Rückt den Fortschritt vor, wenn der Finger an einem der nächsten Prüfpunkte liegt
      function ruecke(q) {
        const p = striche[strichNr];
        for (let runde = 0; runde < 4; runde++) {
          let bester = -1, bd = Math.min(TOL, abstand(q, p[fortschritt]));
          for (let i = fortschritt + 1; i <= Math.min(fortschritt + VORAUS, p.length - 1); i++) {
            const d = abstand(q, p[i]);
            // „<=“ beim ersten Treffer: An Umkehrstellen (runter und denselben Weg zurück) liegt der
            // Punkt des Rückwegs genau auf dem aktuellen Punkt; sonst bliebe die Spur dort hängen.
            if (d < bd || (bester < 0 && d <= bd)) { bd = d; bester = i; }
          }
          if (bester < 0) break;
          fortschritt = bester;
        }
        if (fortschritt >= p.length - 1 - ENDE_NAH) strichFertig();
      }

      function strichFertig() {
        zeiger = false; spur = [];
        strichNr++;
        fortschritt = 0;
        fehlstarts = 0;
        if (strichNr >= striche.length) { glyphFertig(); return; }
        App.audio.klang("strich");
        male();
      }

      cv.addEventListener("pointerdown", (ev) => {
        ev.preventDefault();
        if (gesperrt || demo || fertig) return;
        const q = ort(ev), p = striche[strichNr];
        if (abstand(q, p[fortschritt]) <= START_TOL) {
          zeiger = true; spur = [q];
          try { cv.setPointerCapture(ev.pointerId); } catch (_) {}
          ruecke(q);
        } else {
          // Nicht am Punkt angesetzt: Punkt blinkt kurz auf
          fehlstarts++;
          pulsBis = Date.now() + 350;
          setTimeout(() => { if (ctx.lebt() && !demo) male(); }, 380);
          if (fehlstarts % 3 === 0) ctx.sag("Fang beim roten Punkt an.");
        }
        male();
      });
      cv.addEventListener("pointermove", (ev) => {
        if (!zeiger) return;
        ev.preventDefault();
        const q = ort(ev);
        spur.push(q);
        ruecke(q);
        if (!fertig) male();
      });
      const loslassen = () => { if (!zeiger) return; zeiger = false; spur = []; male(); };
      cv.addEventListener("pointerup", loslassen);
      cv.addEventListener("pointercancel", loslassen);

      async function glyphFertig() {
        fertig = true;
        male();
        tafel.classList.add("geschafft");
        const gl = glyphen[nr];
        App.merke("buchstaben", gl.buchstabe, "gespurt");
        App.log(`Nachspuren: ${gl.zeichen} geschafft`);
        ctx.zeige(gl.zeichen);
        ctx.richtig();
        await ctx.sag(LOB[nr % LOB.length]);
        if (!(await ctx.warte(700))) return;
        nr++;
        if (nr >= glyphen.length) { ctx.fertig(); return; }
        ladeGlyph();
        await starteDemo();
      }

      /* ---------- Knöpfe und Start ---------- */
      $(".ns-zeig", feld).addEventListener("click", () => { if (!gesperrt) starteDemo(); });
      ctx.wiederhole(() => {
        if (gesperrt) return;
        ctx.sag("Fang beim roten Punkt an und fahre die Spur nach.");
        starteDemo();
      });

      (async () => {
        ladeGlyph();
        await ctx.sag("Schau zu. So wird das geschrieben.");
        if (!ctx.lebt()) return;
        await starteDemo();
        if (!ctx.lebt()) return;
        gesperrt = false;
        ctx.sag("Jetzt du! Fang beim roten Punkt an.");
      })();
    },
  };
})();
