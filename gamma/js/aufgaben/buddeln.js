/* Spielplatz „Im Sand buddeln“ auf der Buddelinsel (freies Spiel: keine Runden, kein Richtig und Falsch, kein Fundstück)
 *
 * Der Sand ist ein Raster aus Feldern (13 × 8, jedes 64 Pixel). Jedes Feld hat
 *   eine Höhe      -2 und -1 = Loch, 0 = flach, 1 bis 8 = Sandhaufen. Haufen nebeneinander wachsen zu einem Wall
 *                  oder Hügel zusammen.
 *   ein Bauwerk    0 = keins, 1 = kleiner Turm, 2 = Mauer, 3 = großer Turm, 4 = Burgtor. Noch einmal mit dem
 *                  Turm auf dasselbe Feld tippen: klein, groß, Tor, wieder klein. Ein Bauwerk steht auf dem Haufen
 *                  und steigt mit ihm (Mauer und Tor auf einem Wall aus Sand). In einem Loch steht es unten im
 *                  Loch, im Wasser steht es im Wasser. Mauern richten sich nach ihren Nachbarn aus (quer, nach
 *                  hinten und vorn, oder beides als Ecke).
 *   einen Schmuck  0 = keiner, 1 = Fahne, 2 = Muschel, 3 = Seestern. Auf Bauwerke und Haufen kommt zuerst eine
 *                  Fahne, auf den flachen Sand abwechselnd Muschel und Seestern; noch einmal tippen wechselt.
 * Löcher liegen in einer eigenen Schicht unter allem, was auf dem Sand steht.
 * Oben liegt das Meer. Ein Loch, das über andere Löcher bis zur obersten Reihe reicht, füllt sich mit Wasser;
 * wird der Graben zugeschüttet, trocknet der Rest wieder aus. Eine Physik-Bibliothek braucht es dafür nicht.
 *
 * Bedienung: Rechts wählt das Kind, was die Figur tun soll. Antippen oder Ziehen im Sand: Die Figur fährt zu jedem
 * berührten Feld und arbeitet dort (beim Ziehen entsteht so ein Graben oder eine Mauer). Sie hält dabei das
 * passende Gerät in den Armen. Mit „Einfach fahren“ (oberster Knopf) folgt sie nur dem Finger und verändert
 * nichts. Die Welle oben macht nach einer Rückfrage alles wieder glatt.
 * Was gebaut ist, bleibt liegen (Spielstand „buddel“).
 *
 * Roboter: fährt wie in der Welt langsam mit (Elternbereich „mitfahren“). Am Ende eines Zuges nur getestete
 * Reaktionen: der kleine Ruck aus dem Silbenspiel (vor und zurück), beim Wasser das Staunen.
 *
 * NEUES GERÄT? In WERKZEUGE eintragen (Bild für den Knopf, Bild in der Hand, Ansage, Ton) und in wende() sagen,
 * was es mit einem Feld macht.
 */
"use strict";

(() => {
  const { $, $$ } = App;
  const B = App.bilder;
  const S = 13, Z = 8, N = S * Z;          // Spalten, Zeilen, Felder
  const FELD = 64, X0 = 72, Y0 = 184;      // Größe eines Feldes, linke obere Ecke des Rasters (wie in stil.css)
  const TIEF = -2, HOCH = 8;               // tiefstes Loch, höchster Haufen
  // Farben der Löcher (wie in stil.css bei .bu-zelle): trocken und nass, je eine und zwei Stufen tief
  const LOCHFARBE = { trocken: ["#dcb873", "#c59d58"], nass: ["#58b9c9", "#2f9fb5"] };
  const HAND_X = 102, HAND_Y = 86;         // so weit rechts unter der Ecke der Figur trifft ihr Gerät den Sand
  const MITTE_X = 48, MITTE_Y = 44;        // Mitte der Figur in ihrem Bild (beim Fahren liegt sie unter dem Finger)
  const FAHRTEMPO = 520;                   // Pixel pro Sekunde beim einfachen Fahren
  const SCHLANGE = 80;                     // so viele Felder merkt sich die Figur höchstens im Voraus
  const ICON = "-12 -18 88 88";            // Bildausschnitt für die Knöpfe
  // Das erste Gerät ist keins: „Einfach fahren“. Die Figur folgt dem Finger und verändert nichts.
  const WERKZEUGE = [
    { id: "fahren", knopf: () => B.fahrZeichen(), hand: "", sag: "Einfach fahren.", ton: 0 },
    { id: "graben", knopf: () => B.teilSchaufel(), hand: "teilSchaufel", sag: "Löcher graben.", ton: 196 },
    { id: "haufen", knopf: () => B.sandBild({ h: 2 }, ICON), hand: "teilSchaufel", sag: "Sand aufhäufen.", ton: 294 },
    { id: "turm", knopf: () => B.sandBild({ auf: 1 }, ICON), hand: "eimer", sag: "Türme bauen. Tippe noch einmal auf den Turm, dann wird er größer oder ein Burgtor.", ton: 392 },
    { id: "mauer", knopf: () => B.sandBild({ auf: 2 }, ICON), hand: "eimer", sag: "Mauern bauen.", ton: 349 },
    { id: "schmuck", knopf: () => B.schmuckZeichen(), hand: "fahne", sag: "Schmücken: Fahnen auf Türme und Haufen, Muscheln in den Sand.", ton: 587 },
    { id: "glatt", knopf: () => B.harke(), hand: "harke", sag: "Glatt machen.", ton: 147 },
  ];

  App.aufgaben["buddeln"] = {
    hintergrund: "buddelNah",

    start(feld, ctx) {
      // Stand laden: nur übernehmen, wenn er zum Raster passt
      const alt = App.stand.buddel || {};
      const lade = (a, von, bis) => (Array.isArray(a) && a.length === N ? a.map((x) => Math.max(von, Math.min(bis, Math.round(+x) || 0))) : new Array(N).fill(0));
      const h = lade(alt.h, TIEF, HOCH), auf = lade(alt.auf, 0, 4), deko = lade(alt.deko, 0, 3);
      let nass = new Array(N).fill(false);
      let wahl = WERKZEUGE[1], weg = [], letzte = -1, fingerUnten = false, offen = false, wasserGesagt = false, zug = 0, ruckZuletzt = 0, schmuckNr = 0;   // am Anfang ist die Schaufel gewählt
      let fahrziel = null;   // „Einfach fahren“: Dorthin fährt die Figur, ohne etwas zu tun

      // zwei Schichten mit je einem Element pro Feld: unten die Löcher, darüber alles, was auf dem Sand steht
      // (so verdeckt kein Loch einen Haufen, der über sein Feld hinausragt)
      const felder = Array.from({ length: N }, (_, i) => `<i style="left:${(i % S) * FELD}px;top:${Math.floor(i / S) * FELD}px"></i>`).join("");
      feld.innerHTML = `
        <div class="bu-sand"><div class="bu-loecher">${felder}</div><div class="bu-dinge">${felder}</div></div>
        <div class="bu-leiste">${WERKZEUGE.map((w, i) => `<button class="bu-knopf${w === wahl ? " an" : ""}" data-w="${w.id}" aria-label="${w.sag}">${w.knopf()}</button>`).join("")}</div>
        <button class="knopf bu-welle" aria-label="Welle: alles wieder glatt machen">${B.welleZeichen()}</button>`;
      const sand = $(".bu-sand", feld), zellen = $$(".bu-loecher i", sand), dinge = $$(".bu-dinge i", sand);
      const robi = $("#aufgabe .rover");
      robi.classList.add("bu-robi");
      robi.insertAdjacentHTML("beforeend", `<span class="arm">${B.arm(wahl.hand)}</span>`);
      const arm = $(".arm", robi);

      /* ---------- Zeichnen ---------- */
      // Ist das Feld (Spalte, Zeile) ein Loch? Über der obersten Reihe liegt das Meer, es zählt als Loch.
      const loch = (c, r) => (r < 0 ? true : c < 0 || c >= S || r >= Z ? false : h[r * S + c] < 0);
      // Nachbarfeld für die Zeichnung: Höhe und Bauwerk (null = Rand). Haufen wachsen damit zusammen, Mauern
      // richten sich danach aus (B.sandBild in js/bilder.js).
      const nachbar = (c, r) => (c < 0 || c >= S || r < 0 || r >= Z ? null : { h: h[r * S + c], auf: auf[r * S + c] });
      const lochfarbe = (c, r) => { const j = r * S + c; return LOCHFARBE[nass[j] ? "nass" : "trocken"][h[j] < -1 ? 1 : 0]; };
      function male(i) {
        const el = zellen[i], c = i % S, r = (i - c) / S, t = h[i];
        let klasse = "bu-zelle";
        el.style.background = "";
        if (t < 0) {
          // Nachbarn, die auch Löcher sind, wachsen mit diesem zu einem Graben zusammen: dort keine runde Ecke
          const o = loch(c, r - 1), u = loch(c, r + 1), l = loch(c - 1, r), re = loch(c + 1, r), rund = (zu) => (zu ? "20px" : "0");
          klasse += ` t${-t}${nass[i] ? " nass" : ""}${o ? "" : " kante"}${r === 0 ? " zulauf" : ""}`;
          el.style.borderRadius = `${rund(!o && !l)} ${rund(!o && !re)} ${rund(!u && !re)} ${rund(!u && !l)}`;
        } else {
          el.style.borderRadius = "";
          // Sand zwischen Löchern (eine Insel im Graben): Wo der Graben um die Ecke läuft (Loch seitlich, darüber
          // oder darunter und schräg dazwischen), wird die Ecke rund. Sie bekommt die Farbe des Lochs daneben.
          const ecken = [[-1, -1, "100% 100%", "left top"], [1, -1, "0 100%", "right top"], [1, 1, "0 0", "right bottom"], [-1, 1, "100% 0", "left bottom"]]
            .filter(([dc, dr]) => r + dr >= 0 && loch(c + dc, r) && loch(c, r + dr) && loch(c + dc, r + dr))
            .map(([dc, , mitte, ort]) => `radial-gradient(circle at ${mitte}, transparent 19.5px, ${lochfarbe(c + dc, r)} 20px) ${ort} / 20px 20px no-repeat`);
          if (ecken.length) el.style.background = ecken.join(", ");
        }
        el.className = klasse;
        dinge[i].innerHTML = t > 0 || auf[i] || deko[i] ? B.sandBild({ h: t, auf: auf[i], deko: deko[i], nass: nass[i],
          nach: { o: nachbar(c, r - 1), u: nachbar(c, r + 1), l: nachbar(c - 1, r), r: nachbar(c + 1, r) } }) : "";
      }
      // Wasser: alle Löcher, die über Löcher mit der obersten Reihe verbunden sind. Liefert die Felder, die sich
      // geändert haben, und wie viele neu nass geworden sind.
      function flute() {
        const neu = new Array(N).fill(false), stapel = [];
        for (let c = 0; c < S; c++) if (h[c] < 0) { neu[c] = true; stapel.push(c); }
        while (stapel.length) {
          const i = stapel.pop(), c = i % S, r = (i - c) / S;
          for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const cc = c + dc, rr = r + dr, j = rr * S + cc;
            if (cc < 0 || cc >= S || rr < 0 || rr >= Z || neu[j] || h[j] >= 0) continue;
            neu[j] = true; stapel.push(j);
          }
        }
        const anders = [];
        let dazu = 0;
        for (let i = 0; i < N; i++) if (neu[i] !== nass[i]) { anders.push(i); if (neu[i]) dazu++; }
        nass = neu;
        return { anders, dazu };
      }

      /* ---------- Arbeiten ---------- */
      // Wendet ein Gerät (w = Eintrag aus WERKZEUGE) auf ein Feld an. true = es hat sich etwas geändert
      function wende(i, w) {
        const vorher = `${h[i]} ${auf[i]} ${deko[i]}`;
        if (w.id === "graben") { if (auf[i]) auf[i] = 0; else h[i] = Math.max(TIEF, h[i] - 1); deko[i] = 0; }   // ein Bauwerk fällt zuerst ein
        else if (w.id === "haufen") h[i] = Math.min(HOCH, h[i] + 1);
        else if (w.id === "turm") auf[i] = auf[i] === 1 ? 3 : auf[i] === 3 ? 4 : 1;                          // klein, groß, Burgtor, wieder klein
        else if (w.id === "mauer") auf[i] = 2;
        // Schmuck: auf Bauwerke und Haufen zuerst eine Fahne, auf den flachen Sand abwechselnd Muschel und Seestern;
        // noch einmal auf dasselbe Feld wechselt weiter (Fahne, Muschel, Seestern)
        else if (w.id === "schmuck") deko[i] = deko[i] ? deko[i] % 3 + 1 : auf[i] || h[i] > 0 ? 1 : 2 + schmuckNr++ % 2;
        else { h[i] = 0; auf[i] = 0; deko[i] = 0; }
        return vorher !== `${h[i]} ${auf[i]} ${deko[i]}`;
      }
      // Ein Eintrag der Schlange: Feld i mit dem Gerät w, das beim Berühren gewählt war
      function arbeite({ i, w }) {
        if (!wende(i, w)) { App.audio.ton(110, 0.08, 0, 0.08); return; }
        offen = true;
        const { anders, dazu } = flute();
        // Neu zeichnen: das Feld und seine vier Nachbarn (Ecken, Mauerrichtung, Haufen wachsen zusammen).
        // Hat sich Wasser bewegt, alles: Auch die Nachbarn nasser Felder sehen dann anders aus.
        if (anders.length) for (let k = 0; k < N; k++) male(k);
        else {
          const c = i % S, r = (i - c) / S;
          male(i);
          for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (c + dc >= 0 && c + dc < S && r + dr >= 0 && r + dr < Z) male((r + dr) * S + c + dc);
        }
        arm.classList.remove("tut"); void arm.offsetWidth; arm.classList.add("tut");
        if (!MBot.verbunden()) App.audio.ton(w.ton, 0.1, 0, 0.14);
        if (dazu > 0) {
          // Wasser läuft ein: drei Töne abwärts, beim ersten Mal ein Satz
          [660, 550, 440].forEach((f, k) => App.audio.ton(f, 0.12, 0.05 + k * 0.09, 0.12));
          MBot.reaktion.staunen();
          if (!wasserGesagt) { wasserGesagt = true; ctx.sag("Das Wasser läuft hinein!"); }
        } else if (!weg.length && performance.now() - ruckZuletzt > 1200) {
          // Ende eines Zuges: Der Roboter gräbt mit einem kleinen Ruck vor und zurück
          ruckZuletzt = performance.now();
          MBot.reaktion.silbe(zug++);
        }
      }
      // Was gebaut ist, bleibt liegen
      function merke() {
        App.stand.buddel = { h: h.slice(), auf: auf.slice(), deko: deko.slice() };
        App.speichere();
      }

      /* ---------- Die Figur fährt zu den berührten Feldern ---------- */
      const mitte = (i) => ({ x: X0 + (i % S) * FELD + FELD / 2, y: Y0 + Math.floor(i / S) * FELD + FELD / 2 });
      let pos = mitte(3 * S + 6);
      const setze = () => { robi.style.transform = `translate(${(pos.x - HAND_X).toFixed(1)}px, ${(pos.y - HAND_Y).toFixed(1)}px)`; };
      let zuletzt = performance.now(), fuhr = false;
      function schritt(jetzt) {
        if (!ctx.lebt()) return;
        const dt = Math.min(100, jetzt - zuletzt) / 1000;
        zuletzt = jetzt;
        let faehrt = false, rx = 0, ry = 0;
        if (weg.length) {
          const z = mitte(weg[0].i), dx = z.x - pos.x, dy = z.y - pos.y, d = Math.hypot(dx, dy);
          const s = Math.min(1500, 560 + weg.length * 70) * dt;            // je länger die Schlange, desto schneller
          if (d <= s + 0.5) { pos = z; arbeite(weg.shift()); }
          else { pos = { x: pos.x + dx / d * s, y: pos.y + dy / d * s }; faehrt = true; rx = dx / d; ry = dy / d; }
          setze();
        } else if (fahrziel) {
          // Einfach fahren: Die Figur folgt dem Finger, wie in der Welt
          const dx = fahrziel.x - pos.x, dy = fahrziel.y - pos.y, d = Math.hypot(dx, dy), s = FAHRTEMPO * dt;
          if (d <= s) { pos = { x: fahrziel.x, y: fahrziel.y }; if (!fingerUnten) fahrziel = null; }
          else { pos = { x: pos.x + dx / d * s, y: pos.y + dy / d * s }; faehrt = true; rx = dx / d; ry = dy / d; }
          setze();
        }
        robi.classList.toggle("faehrt", faehrt);
        // Der echte Roboter fährt langsam mit, wie in der Welt
        if (App.stand.einst.mitfahren) {
          if (faehrt) MBot.fahre(-ry, rx * 0.8, 25);
          else if (fuhr) MBot.fahre(0, 0);
        }
        fuhr = faehrt;
        if (offen && !weg.length && !fingerUnten) { offen = false; merke(); }
        App.naechstesBild(schritt);
      }

      /* ---------- Finger im Sand ---------- */
      const feldBei = (ev) => {
        const r = sand.getBoundingClientRect();
        const c = Math.floor((ev.clientX - r.left) / r.width * S), z = Math.floor((ev.clientY - r.top) / r.height * Z);
        return c < 0 || c >= S || z < 0 || z >= Z ? -1 : z * S + c;
      };
      // Das Gerät wird mit gemerkt: Wechselt das Kind es, während die Figur noch unterwegs ist, gilt für die schon
      // berührten Felder weiter das alte
      const merkeFeld = (i) => { if (weg.length < SCHLANGE) weg.push({ i, w: wahl }); };
      // Beim Ziehen: alle Felder von dem zuletzt berührten bis zu diesem, Schritt für Schritt waagrecht oder
      // senkrecht (so hängt ein Graben immer zusammen und das Wasser kann fließen)
      function zieheBis(i) {
        let c = letzte % S, r = Math.floor(letzte / S);
        const c1 = i % S, r1 = Math.floor(i / S);
        while (c !== c1 || r !== r1) {
          if (Math.abs(c1 - c) >= Math.abs(r1 - r)) c += Math.sign(c1 - c); else r += Math.sign(r1 - r);
          merkeFeld(r * S + c);
        }
        letzte = i;
      }
      // Einfach fahren: die Stelle im Sand, zu der die Figur fahren soll. „pos“ ist die Stelle, an der ihr Gerät den
      // Sand trifft; beim Fahren soll aber ihre Mitte unter dem Finger liegen. Sie bleibt dabei ganz auf dem Sand.
      const stelleBei = (ev) => {
        const r = sand.getBoundingClientRect();
        const x = X0 + (ev.clientX - r.left) / r.width * S * FELD + HAND_X - MITTE_X, y = Y0 + (ev.clientY - r.top) / r.height * Z * FELD + HAND_Y - MITTE_Y;
        return { x: Math.max(X0 + 30, Math.min(X0 + S * FELD - 10, x)), y: Math.max(Y0 + 10, Math.min(Y0 + Z * FELD - 10, y)) };
      };
      sand.addEventListener("pointerdown", (ev) => {
        ev.preventDefault();
        const i = feldBei(ev);
        if (i < 0) return;
        fingerUnten = true;
        try { sand.setPointerCapture(ev.pointerId); } catch (_) {}
        if (wahl.id === "fahren") { fahrziel = stelleBei(ev); return; }
        merkeFeld(i);
        letzte = i;
      });
      sand.addEventListener("pointermove", (ev) => {
        if (!fingerUnten) return;
        if (wahl.id === "fahren") { fahrziel = stelleBei(ev); return; }
        const i = feldBei(ev);
        if (i >= 0 && i !== letzte) zieheBis(i);
      });
      for (const n of ["pointerup", "pointercancel", "lostpointercapture"]) sand.addEventListener(n, () => { fingerUnten = false; });

      /* ---------- Knöpfe ---------- */
      $$(".bu-knopf", feld).forEach((k) => k.addEventListener("click", () => {
        // Noch einmal auf das gewählte Gerät tippen legt es weg: Dann fährt die Figur nur noch
        const weglegen = k.classList.contains("an") && k.dataset.w !== "fahren";
        wahl = (!weglegen && WERKZEUGE.find((w) => w.id === k.dataset.w)) || WERKZEUGE[0];
        $$(".bu-knopf", feld).forEach((x) => x.classList.toggle("an", x.dataset.w === wahl.id));
        arm.classList.remove("tut");
        arm.innerHTML = wahl.hand ? B.arm(wahl.hand) : "";   // beim einfachen Fahren hält die Figur nichts
        fahrziel = null;
        App.audio.klang("tipp");
        ctx.sag(wahl.sag);
      }));
      // Welle: erst fragen (damit nichts aus Versehen verschwindet), beim zweiten Tipp spült sie alles glatt
      const welle = $(".bu-welle", feld);
      let frageBis = 0, frageUhr = 0;
      welle.addEventListener("click", () => {
        clearTimeout(frageUhr);
        if (Date.now() > frageBis) {
          frageBis = Date.now() + 5000;
          welle.classList.add("frage");
          frageUhr = setTimeout(() => welle.classList.remove("frage"), 5000);
          App.audio.klang("tipp");
          ctx.sag("Soll die Welle alles glatt machen? Dann tippe noch einmal.");
          return;
        }
        frageBis = 0;
        welle.classList.remove("frage");
        weg = [];
        h.fill(0); auf.fill(0); deko.fill(0); nass.fill(false);
        offen = false;
        merke();
        const flut = document.createElement("div");
        flut.className = "bu-flut";
        feld.appendChild(flut);
        setTimeout(() => { if (ctx.lebt()) for (let i = 0; i < N; i++) male(i); }, 550);
        setTimeout(() => flut.remove(), 1500);
        if (!MBot.verbunden()) App.audio.klang("rakete");
        MBot.reaktion.staunen();
        App.log("Buddelinsel: Die Welle hat alles glatt gemacht");
        ctx.sag("Platsch! Alles ist wieder glatt.");
      });

      /* ---------- Los ---------- */
      flute();
      for (let i = 0; i < N; i++) male(i);
      setze();
      const schonGebaut = h.some((x) => x) || auf.some((x) => x) || deko.some((x) => x);
      ctx.wiederhole(() => ctx.sag("Rechts wählst du, was ich tun soll: einfach fahren, graben, Sand aufhäufen, Türme und Mauern bauen, schmücken oder glatt machen. Dann tippe in den Sand oder zieh mit dem Finger. Tippst du noch einmal auf einen Turm, wird er größer und dann ein Tor. Grabe bis zum Meer, dann läuft Wasser hinein. Die Welle oben macht alles wieder glatt."));
      ctx.beimEnde(() => { MBot.fahre(0, 0); merke(); });
      ctx.zeige(":)");
      ctx.sag(schonGebaut ? "Hier ist noch alles so, wie du es gebaut hast. Bau weiter!" : "Hier kannst du buddeln und bauen. Tippe in den Sand!");
      App.naechstesBild(schritt);
    },
  };
})();
