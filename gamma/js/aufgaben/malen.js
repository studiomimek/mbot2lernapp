/* Spielplatz „Mit Reifen malen“ auf der Malinsel (freies Spiel: keine Runden, kein Richtig und Falsch, kein Fundstück)
 *
 * Die Figur ist hier von oben zu sehen. Sie folgt dem Finger wie ein echtes Fahrzeug: Sie dreht sich in die
 * Richtung und fährt dann los. Ihre zwei Räder hinterlassen Spuren, die nicht verblassen.
 *
 * GENAUE SPUREN: Die Figur hat eine Stelle (die Mitte ihrer Achse) und eine Richtung. Daraus ergeben sich die
 * beiden Räder, ein halber Radabstand links und rechts der Achse. Gemalt wird immer von der letzten Radstelle zur
 * neuen, in kleinen Teilschritten (höchstens drei Pixel oder gut drei Grad). So liegt jede Spur genau unter ihrem
 * Rad, auch in engen Kurven und beim Drehen auf der Stelle: Das innere Rad malt den kleinen Bogen, das äußere den
 * großen. Bild der Figur und Spuren entstehen aus denselben Zahlen.
 *
 * Farben: Am oberen Rand liegen Farbpfützen. Fährt die Figur durch eine oder tippt das Kind sie an, malen die
 * Reifen in dieser Farbe. Im Regenbogen wandert die Farbe beim Fahren, das Wasser macht die Reifen sauber (fahren,
 * ohne zu malen).
 * Rechts stehen sieben Knöpfe in drei Gruppen:
 *   Reifen   schmal, breit, die Walze (ein Band über die ganze Achse) und die Radierer-Walze (sie wischt weg).
 *            Einer davon ist immer gewählt.
 *   Muster   Punkte oder Striche statt durchgezogener Spuren. Noch einmal tippen schaltet das Muster wieder aus.
 *   Kippen   Die Figur kippt sich auf ihr rechtes Rad und malt nur noch eine Linie, so breit wie der gewählte
 *            Reifen (bei den Walzen ein mittelbreiter Strich). Die Linie liegt dann genau dort, wohin der Finger
 *            zeigt; so lässt sich am besten schreiben. Noch einmal tippen stellt sie wieder auf beide Räder.
 * Reifen, Muster und Kippen lassen sich frei verbinden. Die Regenwolke oben wäscht nach einer Rückfrage alles ab.
 *
 * Das Bild bleibt liegen. Es liegt nicht im Spielstand, sondern als eigener Eintrag daneben (App.extra in
 * js/kern.js, Name „malbild“), damit nicht jedes Speichern das ganze Bild mitschreibt.
 *
 * Roboter: fährt langsam mit, und zwar so, wie die Figur wirklich fährt (vorwärts und drehen; MBot.fahre wie in
 * der Welt). Bei einer neuen Farbe leuchtet er in dieser Farbe (MBot.reaktion.licht, wie das Licht eines Ortes).
 * Beim Regen staunt er. Keine neuen Befehle.
 *
 * NEUE FARBE? In PFUETZEN eintragen (und in B.malFarben in js/bilder.js). NEUER REIFEN? In REIFEN eintragen
 * (dick = Breite der zwei Spuren, 0 = ein Band; kipp = Breite der einen Linie), Zeichen in B.reifenZeichen, und in
 * stil.css, wie die Räder der Figur dann aussehen (.ma-robi.r-…). NEUES MUSTER? In MUSTER eintragen und in
 * strich() und band() sagen, was es malt.
 */
"use strict";

(() => {
  const { $, $$ } = App;
  const B = App.bilder;
  const X0 = 72, Y0 = 100, BREIT = 832, HOCH = 600;   // Malgrund auf der Bühne (wie in stil.css bei .ma-grund)
  const FEIN = 2;                                     // die Zeichenfläche ist doppelt so fein wie die Bühne (scharfe Linien)
  const SPUR = 49;                                    // Abstand der beiden Räder; passt zu B.roverOben in 72 Pixel Breite
  const ACHSE_X = 36, ACHSE_Y = 47.5;                 // Mitte der Achse im Bild der Figur (72 Pixel breit)
  const KIPP_X = 60.5;                                // gekippt steht die Figur auf dem rechten Rad: seine Mitte im Bild
  const WALZE = 62;                                   // Breite des Bandes, das die Walze malt
  const TEMPO = 520;                                  // Pixel pro Sekunde bei Geradeausfahrt
  const DREH = 9;                                     // schnellste Drehung (Bogenmaß pro Sekunde, gut 500 Grad)
  const RAND = 34;                                    // so nah kommt die Figur an den Rand des Malgrunds
  const NAH = 4;                                      // so nah am Ziel bleibt die Figur stehen
  const PF_Y = 42, PF_RX = 46, PF_RY = 26;            // Pfützen: Höhe ihrer Mitte, halbe Breite und Höhe („durchgefahren“)
  const SAUBER = "#c3ccd6";                           // Farbe der Lauffläche, wenn die Reifen sauber sind
  const WISCHER = "#ffffff";                          // Farbe der Lauffläche der Radierer-Walze
  const GROSS = 350000;                               // ab so vielen Zeichen wird das Bild halb so fein gespeichert
  const KREIS = Math.PI * 2;
  const M = B.malFarben;
  // Pfützen am oberen Rand, von links nach rechts. licht = Farbe, in der der echte Roboter dann leuchtet
  const PFUETZEN = [
    { id: "rot", name: "Rot", farbe: M.rot, licht: [255, 0, 0], ton: 262 },
    { id: "gelb", name: "Gelb", farbe: M.gelb, licht: [255, 170, 0], ton: 294 },
    { id: "gruen", name: "Grün", farbe: M.gruen, licht: [0, 220, 40], ton: 330 },
    { id: "blau", name: "Blau", farbe: M.blau, licht: [0, 60, 255], ton: 392 },
    { id: "lila", name: "Lila", farbe: M.lila, licht: [170, 0, 255], ton: 440 },
    { id: "bunt", name: "Regenbogen", farbe: "bunt", licht: [255, 255, 255], ton: 523 },   // die Farbe wandert beim Fahren
    { id: "wasser", name: "Wasser", farbe: "", licht: null, ton: 196 },                    // macht die Reifen sauber
  ];
  // dick = Breite der zwei Spuren (0 = ein Band über die ganze Achse), kipp = Breite der einen Linie, wenn die Figur gekippt ist
  const REIFEN = [
    { id: "schmal", dick: 6, kipp: 6, sag: "Schmale Reifen." },
    { id: "breit", dick: 14, kipp: 14, sag: "Breite Reifen." },
    { id: "walze", dick: 0, kipp: 26, sag: "Die Walze. Sie malt ein breites Band." },
    { id: "radierer", dick: 0, kipp: 26, sag: "Die Radierer-Walze. Sie wischt weg, was ich überfahre." },
  ];
  const MUSTER = [
    { id: "punkte", sag: "Gepunktete Spuren." },
    { id: "striche", sag: "Gestrichelte Spuren." },
  ];
  const pfX = (i) => (i + 0.5) * BREIT / PFUETZEN.length;   // Mitte der Pfütze i
  const grenze = (v, von, bis) => Math.max(von, Math.min(bis, v));

  App.aufgaben["malen"] = {
    hintergrund: "malNah",

    start(feld, ctx) {
      let reifen = REIFEN[0], farbe = PFUETZEN[0], muster = "", gekippt = false;   // am Anfang: schmale Reifen in Rot
      let x = BREIT / 2, y = HOCH - 110, th = -Math.PI / 2;     // Mitte der Achse und Richtung (0 = nach rechts, −90 Grad = nach oben)
      let ziel = null, fingerUnten = false, fuhr = false, inPfuetze = -1, strecke = 0;
      let wegL = 0, wegR = 0, wegM = 0;                         // gefahrene Strecke je Spur (für Punkte und Striche)
      let leer = true, offen = false, sicherUhr = 0, wasserGesagt = false, radFarbe = "";
      const ortLicht = (App.inhalt.welt.orte[App.stand.ort] || {}).licht;

      feld.innerHTML = `
        <div class="ma-grund"><canvas class="ma-bild" width="${BREIT * FEIN}" height="${HOCH * FEIN}"></canvas>${
          PFUETZEN.map((p, i) => `<button class="ma-pfuetze" data-p="${p.id}" style="left:${pfX(i).toFixed(0)}px" aria-label="${p.name}">${B.pfuetze(p.id)}</button>`).join("")}</div>
        <div class="ma-leiste">${
          REIFEN.map((r) => `<button class="ma-knopf${r === reifen ? " an" : ""}" data-r="${r.id}" aria-label="${r.sag}">${B.reifenZeichen(r.id)}</button>`).join("")}${
          MUSTER.map((m, i) => `<button class="ma-knopf${i ? "" : " abstand"}" data-m="${m.id}" aria-label="${m.sag}">${B.reifenZeichen(m.id)}</button>`).join("")}
          <button class="ma-knopf abstand" data-kipp="1" aria-label="Robi kippen: nur eine Linie malen">${B.kippZeichen()}</button></div>
        <button class="knopf ma-regen" aria-label="Regen: alles wieder abwaschen">${B.regenZeichen()}</button>`;
      const grund = $(".ma-grund", feld), bild = $(".ma-bild", feld).getContext("2d");
      bild.scale(FEIN, FEIN);
      bild.lineCap = "round";
      bild.lineJoin = "round";
      // Die Figur des Spielrahmens wird zur Figur von oben
      const robi = $("#aufgabe .rover");
      robi.classList.add("ma-robi", `r-${reifen.id}`);
      robi.innerHTML = B.roverOben();
      const laufflaechen = $$(".ma-rad", robi);

      /* ---------- Das Bild von früher ---------- */
      const alt = App.extra.lies("malbild");
      if (alt) {
        const img = new Image();
        // unter das legen, was vielleicht schon neu gemalt ist
        img.onload = () => {
          if (!ctx.lebt()) return;
          bild.save();
          bild.globalCompositeOperation = "destination-over";
          bild.drawImage(img, 0, 0, BREIT, HOCH);
          bild.restore();
          leer = false;
        };
        img.src = alt;
      }
      // Speichert das Bild in Bühnengröße (halb so fein wie die Zeichenfläche, das hält den Eintrag klein)
      function merke() {
        clearTimeout(sicherUhr);
        sicherUhr = 0;
        if (!offen) return;
        offen = false;
        if (leer) { App.extra.schreibe("malbild", null); return; }
        try {
          const alsText = (mass) => {
            const klein = document.createElement("canvas");
            klein.width = BREIT * mass;
            klein.height = HOCH * mass;
            klein.getContext("2d").drawImage(bild.canvas, 0, 0, klein.width, klein.height);
            return klein.toDataURL("image/png");
          };
          let text = alsText(1);
          if (text.length > GROSS) text = alsText(0.5);   // ein sehr volles Bild wird nur halb so fein gespeichert
          if (!App.extra.schreibe("malbild", text)) App.log("Malinsel: Das Bild ließ sich nicht speichern (Speicher voll?).", "w");
        } catch (e) { App.log(`Malinsel: Das Bild ließ sich nicht speichern: ${e && e.message}`, "w"); }
      }

      /* ---------- Farbe ---------- */
      const farbeJetzt = () => (farbe.farbe === "bunt" ? `hsl(${Math.round(strecke * 0.8) % 360}, 88%, 54%)` : farbe.farbe);
      const faerbeRaeder = () => {
        const f = reifen.id === "radierer" ? WISCHER : farbeJetzt() || SAUBER;
        if (f === radFarbe) return;
        radFarbe = f;
        laufflaechen.forEach((el) => { el.style.stroke = f; });
      };
      // platsch = die Figur ist gerade durch die Pfütze gefahren, oder das Kind hat sie angetippt (nicht beim Start)
      function nimmFarbe(p, platsch) {
        farbe = p;
        faerbeRaeder();
        $$(".ma-pfuetze", grund).forEach((el) => { el.classList.toggle("an", el.dataset.p === p.id); el.classList.remove("platsch"); });
        if (!platsch) return;
        const el = $(`.ma-pfuetze[data-p="${p.id}"]`, grund);
        el.classList.remove("platsch"); void el.offsetWidth; el.classList.add("platsch");
        if (!MBot.verbunden()) App.audio.ton(p.ton, 0.14, 0, 0.14);
        const l = p.licht || ortLicht;
        if (l) MBot.reaktion.licht(l[0], l[1], l[2]);
        if (p.id === "wasser" && !wasserGesagt) { wasserGesagt = true; ctx.sag("Jetzt sind die Reifen sauber. Ich fahre, ohne zu malen."); }
      }

      /* ---------- Malen: von der letzten Radstelle zur neuen ---------- */
      // Wo die Figur den Boden berührt: m = Mitte der Achse (gekippt: das eine Rad), l und r = linkes und rechtes Rad
      const stellen = () => {
        const nx = -Math.sin(th) * SPUR / 2, ny = Math.cos(th) * SPUR / 2;
        return { m: [x, y], l: [x - nx, y - ny], r: [x + nx, y + ny] };
      };
      // Eine Spur von p nach q, je nach Muster. weg = bisher gefahrene Strecke dieser Spur; zurück kommt die neue.
      function strich(p, q, breite, weg) {
        const lang = Math.hypot(q[0] - p[0], q[1] - p[1]);
        if (muster === "punkte") {
          // ein Punkt alle „ab“ Pixel, genau an der Stelle der Strecke, an der er fällig ist
          const ab = Math.max(14, breite * 2.2), r = Math.max(3.5, breite / 2 + 0.5);
          for (let k = Math.floor(weg / ab) + 1; k * ab <= weg + lang; k++) {
            const t = lang ? (k * ab - weg) / lang : 0;
            bild.beginPath();
            bild.arc(p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, r, 0, KREIS);
            bild.fill();
          }
        } else if (muster !== "striche" || (weg + lang / 2) % (breite * 4.2 + 8) < breite * 1.6 + 4) {
          // Striche: gemalt wird nur im ersten Teil jedes Abschnitts (die runden Enden machen den Strich etwas länger)
          bild.lineWidth = breite;
          bild.beginPath();
          bild.moveTo(p[0], p[1]);
          bild.lineTo(q[0], q[1]);
          bild.stroke();
        }
        return weg + lang;
      }
      // Die Walze ist breiter als der Radabstand: die Achse nach beiden Seiten verlängern. [links x, links y, rechts x, rechts y]
      const walzenEnden = (l, r) => {
        const k = (WALZE / SPUR - 1) / 2, dx = (r[0] - l[0]) * k, dy = (r[1] - l[1]) * k;
        return [l[0] - dx, l[1] - dy, r[0] + dx, r[1] + dy];
      };
      // Das Band der Walze zwischen alter und neuer Achse
      function band(a, b) {
        const lang = (Math.hypot(b.l[0] - a.l[0], b.l[1] - a.l[1]) + Math.hypot(b.r[0] - a.r[0], b.r[1] - a.r[1])) / 2;
        if (muster === "punkte") {
          // eine Reihe aus vier Punkten quer über die Walze, alle 17 Pixel
          const ab = 17;
          for (let k = Math.floor(wegM / ab) + 1; k * ab <= wegM + lang; k++) {
            const t = lang ? (k * ab - wegM) / lang : 0, u = 1 - t;
            const e = walzenEnden([a.l[0] * u + b.l[0] * t, a.l[1] * u + b.l[1] * t], [a.r[0] * u + b.r[0] * t, a.r[1] * u + b.r[1] * t]);
            for (const q of [0.08, 0.36, 0.64, 0.92]) {
              bild.beginPath();
              bild.arc(e[0] + (e[2] - e[0]) * q, e[1] + (e[3] - e[1]) * q, 4.5, 0, KREIS);
              bild.fill();
            }
          }
        } else if (muster !== "striche" || (wegM + lang / 2) % 58 < 30) {
          // ein Viereck zwischen alter und neuer Achse; der dünne Rand schließt die Fuge zum nächsten Stück
          const p = walzenEnden(a.l, a.r), q = walzenEnden(b.l, b.r);
          bild.lineWidth = 1.2;
          bild.beginPath();
          bild.moveTo(p[0], p[1]); bild.lineTo(p[2], p[3]); bild.lineTo(q[2], q[3]); bild.lineTo(q[0], q[1]);
          bild.closePath();
          bild.fill();
          bild.stroke();
        }
        wegM += lang;
      }
      function male(a, b) {
        const wischt = reifen.id === "radierer";
        const f = wischt ? "#000" : farbeJetzt();
        if (!f) return;                                        // saubere Reifen malen nicht
        bild.globalCompositeOperation = wischt ? "destination-out" : "source-over";
        bild.fillStyle = f;
        bild.strokeStyle = f;
        if (gekippt) wegM = strich(a.m, b.m, reifen.kipp, wegM);               // auf einem Rad: eine Linie
        else if (!reifen.dick) band(a, b);                                     // Walze: ein Band
        else { wegL = strich(a.l, b.l, reifen.dick, wegL); wegR = strich(a.r, b.r, reifen.dick, wegR); }   // zwei Spuren
        bild.globalCompositeOperation = "source-over";
        if (!wischt) leer = false;
        offen = true;
      }

      /* ---------- Die Figur folgt dem Finger ---------- */
      // Gesetzt wird die Stelle, an der die Figur den Boden berührt: die Mitte der Achse, gekippt das rechte Rad
      const setze = () => {
        const ax = gekippt ? KIPP_X : ACHSE_X;
        robi.style.transformOrigin = `${ax}px ${ACHSE_Y}px`;
        robi.style.transform = `translate(${(X0 + x - ax).toFixed(1)}px, ${(Y0 + y - ACHSE_Y).toFixed(1)}px) rotate(${(th * 180 / Math.PI + 90).toFixed(1)}deg)`;
      };
      // Kippen: Das rechte Rad bleibt stehen, wo es ist. Gekippt ist es die Stelle, die dem Finger folgt.
      function kippe(an) {
        if (an === gekippt) return;
        const nx = -Math.sin(th) * SPUR / 2, ny = Math.cos(th) * SPUR / 2, s = an ? 1 : -1;
        x = grenze(x + s * nx, RAND, BREIT - RAND);
        y = grenze(y + s * ny, RAND, HOCH - RAND);
        gekippt = an;
        ziel = null;
        robi.classList.toggle("gekippt", an);
        setze();
      }
      let zuletzt = performance.now();
      function schritt(jetzt) {
        if (!ctx.lebt()) return;
        const dt = Math.min(100, jetzt - zuletzt) / 1000;
        zuletzt = jetzt;
        let v = 0, w = 0;                                       // Tempo vorwärts (Pixel pro Sekunde), Drehung (Bogenmaß pro Sekunde)
        if (ziel && dt > 0) {
          const dx = ziel.x - x, dy = ziel.y - y, d = Math.hypot(dx, dy);
          if (d <= NAH) { if (!fingerUnten) ziel = null; }
          else {
            let fehler = Math.atan2(dy, dx) - th;
            fehler = Math.atan2(Math.sin(fehler), Math.cos(fehler));        // auf −180 bis 180 Grad bringen
            w = grenze(fehler / dt, -DREH, DREH);
            const gerade = Math.max(0, Math.cos(fehler));
            v = Math.min(TEMPO, d * 9) * gerade * gerade;                   // erst drehen, dann fahren; kurz vor dem Ziel langsamer
            // in Teilschritten fahren und nach jedem malen: höchstens drei Pixel oder 0,06 Bogenmaß
            const n = Math.max(1, Math.ceil(Math.max(v * dt / 3, Math.abs(w * dt) / 0.06)));
            let vorher = stellen();
            for (let k = 0; k < n; k++) {
              th += w * dt / n;
              x = grenze(x + Math.cos(th) * v * dt / n, RAND, BREIT - RAND);
              y = grenze(y + Math.sin(th) * v * dt / n, RAND, HOCH - RAND);
              strecke += v * dt / n + Math.abs(w * dt / n) * SPUR / 2;
              const neu = stellen();
              male(vorher, neu);
              vorher = neu;
            }
            setze();
            if (farbe.farbe === "bunt") faerbeRaeder();
          }
        }
        // Durch eine Pfütze gefahren? Dann malen die Reifen jetzt in dieser Farbe (einmal je Durchfahrt)
        let drin = -1;
        if (y < PF_Y + PF_RY) {
          for (let i = 0; i < PFUETZEN.length; i++) {
            const ex = (x - pfX(i)) / PF_RX, ey = (y - PF_Y) / PF_RY;
            if (ex * ex + ey * ey <= 1) { drin = i; break; }
          }
        }
        if (drin !== inPfuetze) { inPfuetze = drin; if (drin >= 0 && PFUETZEN[drin] !== farbe) nimmFarbe(PFUETZEN[drin], true); }
        // Der echte Roboter fährt langsam mit: vorwärts und drehen wie die Figur
        const faehrt = v > 8 || Math.abs(w) > 0.4;
        if (App.stand.einst.mitfahren) {
          if (faehrt) MBot.fahre(v / TEMPO, grenze(w / DREH, -1, 1) * 0.8, 25);
          else if (fuhr) MBot.fahre(0, 0);
        }
        fuhr = faehrt;
        // Steht die Figur und ist der Finger weg, wird das Bild nach einer kurzen Pause gespeichert
        if (offen && !ziel && !fingerUnten && !sicherUhr) sicherUhr = setTimeout(merke, 2500);
        App.naechstesBild(schritt);
      }

      /* ---------- Finger auf dem Malgrund ---------- */
      const stelle = (ev) => {
        const r = grund.getBoundingClientRect();
        return { x: grenze((ev.clientX - r.left) / r.width * BREIT, RAND, BREIT - RAND), y: grenze((ev.clientY - r.top) / r.height * HOCH, RAND, HOCH - RAND) };
      };
      grund.addEventListener("pointerdown", (ev) => {
        ev.preventDefault();
        fingerUnten = true;
        clearTimeout(sicherUhr);
        sicherUhr = 0;
        try { grund.setPointerCapture(ev.pointerId); } catch (_) {}
        ziel = stelle(ev);
      });
      grund.addEventListener("pointermove", (ev) => { if (fingerUnten) ziel = stelle(ev); });
      for (const n of ["pointerup", "pointercancel", "lostpointercapture"]) grund.addEventListener(n, () => { fingerUnten = false; });
      // Eine Pfütze antippen wechselt die Farbe sofort; die Figur bleibt, wo sie ist. (Fährt der Finger beim Malen
      // über eine Pfütze, fährt die Figur wie bisher hindurch.)
      $$(".ma-pfuetze", grund).forEach((el) => {
        el.addEventListener("pointerdown", (ev) => ev.stopPropagation());
        el.addEventListener("click", () => nimmFarbe(PFUETZEN.find((p) => p.id === el.dataset.p) || PFUETZEN[0], true));
      });

      /* ---------- Knöpfe ---------- */
      const zeigeKnoepfe = () => $$(".ma-knopf", feld).forEach((b) =>
        b.classList.toggle("an", b.dataset.r ? b.dataset.r === reifen.id : b.dataset.m ? b.dataset.m === muster : gekippt));
      $$(".ma-knopf", feld).forEach((k) => k.addEventListener("click", () => {
        let satz;
        if (k.dataset.r) {
          // Reifen: einer ist immer gewählt
          robi.classList.remove(`r-${reifen.id}`);
          reifen = REIFEN.find((r) => r.id === k.dataset.r) || REIFEN[0];
          robi.classList.add(`r-${reifen.id}`);
          faerbeRaeder();
          satz = reifen.sag;
        } else if (k.dataset.m) {
          // Muster: an, oder beim zweiten Tipp wieder aus
          if (muster) robi.classList.remove(`m-${muster}`);
          muster = muster === k.dataset.m ? "" : k.dataset.m;
          if (muster) robi.classList.add(`m-${muster}`);
          satz = muster ? MUSTER.find((m) => m.id === muster).sag : "Wieder durchgezogene Spuren.";
        } else {
          kippe(!gekippt);
          satz = gekippt ? "Ich kippe mich auf ein Rad. Jetzt male ich nur eine Linie." : "Jetzt stehe ich wieder auf beiden Rädern.";
        }
        zeigeKnoepfe();
        App.audio.klang("tipp");
        ctx.sag(satz);
      }));
      // Regenwolke: erst fragen (damit nichts aus Versehen verschwindet), beim zweiten Tipp wäscht der Regen alles ab
      const regen = $(".ma-regen", feld);
      let frageBis = 0, frageUhr = 0;
      regen.addEventListener("click", () => {
        clearTimeout(frageUhr);
        if (Date.now() > frageBis) {
          frageBis = Date.now() + 5000;
          regen.classList.add("frage");
          frageUhr = setTimeout(() => regen.classList.remove("frage"), 5000);
          App.audio.klang("tipp");
          ctx.sag("Soll der Regen alles abwaschen? Dann tippe noch einmal.");
          return;
        }
        frageBis = 0;
        regen.classList.remove("frage");
        ziel = null;
        leer = true;
        offen = true;
        merke();                                               // das gespeicherte Bild ist damit gleich weg
        const fall = document.createElement("div");
        fall.className = "ma-regenfall";
        feld.appendChild(fall);
        setTimeout(() => { if (ctx.lebt()) { bild.clearRect(0, 0, BREIT, HOCH); leer = true; offen = false; } }, 500);
        setTimeout(() => fall.remove(), 1500);
        if (!MBot.verbunden()) [880, 784, 698, 659, 587].forEach((f, k) => App.audio.ton(f, 0.08, k * 0.07, 0.1));
        MBot.reaktion.staunen();
        App.log("Malinsel: Der Regen hat alles abgewaschen");
        ctx.sag("Es regnet! Alles ist wieder sauber.");
      });

      /* ---------- Los ---------- */
      nimmFarbe(farbe, false);
      setze();
      ctx.wiederhole(() => ctx.sag("Zieh mit dem Finger über das Blatt. Ich fahre hinterher und male mit meinen Reifen. Oben liegen Farbpfützen: Tippe eine an oder fahr mit mir hindurch, dann malen die Reifen in dieser Farbe. Im Regenbogen wechselt die Farbe von selbst. Das Wasser macht die Reifen sauber. Rechts wählst du die Reifen: schmal, breit, die Walze oder die Radierer-Walze. Darunter gibt es Punkte und Striche. Mit dem untersten Knopf kippe ich mich auf ein Rad und male nur eine Linie. Die Regenwolke oben wäscht alles wieder ab."));
      ctx.beimEnde(() => { MBot.fahre(0, 0); merke(); });
      ctx.zeige(":)");
      ctx.sag(alt ? "Dein Bild ist noch da. Mal weiter!" : "Hier malen meine Reifen. Zieh mit dem Finger über das Blatt!");
      App.naechstesBild(schritt);
    },
  };
})();
