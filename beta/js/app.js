/* app.js – Start, Rahmen für Aufgaben, Knöpfe am Rand, Schatzkiste, Elternbereich, Roboter-Anbindung */
"use strict";

(() => {
  const { $, $$ } = App;
  const B = App.bilder;
  const ZAEHLTOENE = [523, 587, 659, 698, 784, 880, 988, 1047, 1175, 1319];
  const FUNDNAME = {
    muschel: "eine Muschel", seestern: "einen Seestern", perle: "eine Perle",
    stern: "einen Stern", planet: "einen Planeten", rakete: "eine kleine Rakete",
    feder: "eine Papageienfeder", flasche: "eine Flaschenpost", muenze: "eine Goldmünze",
  };
  let lauf = null;   // laufende Aufgabe

  /* ---------- Bühne auf den Bildschirm einpassen (feste Größe 1024 × 768) ---------- */
  function skaliere() {
    const s = Math.min(window.innerWidth / 1024, window.innerHeight / 768);
    $("#buehne").style.setProperty("--s", String(s));
  }

  function zeigeModus(name) { $("#buehne").dataset.modus = name; }   // start | welt | aufgabe

  /* ---------- Spielfigur auf dem Bildschirm ---------- */
  function roverZeige(text) { $$(".rover-anzeige").forEach((t) => { t.textContent = text; }); }
  function roverStimmung(name) {
    const r = $("#aufgabe .rover");
    if (!r) return;
    r.classList.remove("freu", "denk");
    void r.offsetWidth;
    r.classList.add(name);
  }

  /* ---------- Aufgabe starten und beenden ---------- */
  App.starteAufgabe = (einstieg) => {
    const modul = App.aufgaben[einstieg.aufgabe];
    if (!modul) { App.log(`Aufgabe „${einstieg.aufgabe}“ gibt es nicht.`, "e"); App.welt.zeige(App.stand.ort); return; }
    const schicht = $("#aufgabe");
    schicht.innerHTML = `<div class="ort-bild">${B[modul.hintergrund]()}</div><div class="feld"></div><div class="rover rover-aufgabe">${B.rover()}</div>`;
    const meins = lauf = { einstieg, lebt: true, wiederhole: null };
    const lebt = () => meins.lebt;
    const ohneRoboter = () => !MBot.verbunden();

    // Das bekommt jede Aufgabe an die Hand
    const ctx = {
      einstieg,
      lebt,
      warte: async (ms) => { await App.warte(ms); return lebt(); },
      sag: (text) => (lebt() ? App.sag(text) : Promise.resolve()),
      spielLaut: (b) => (lebt() ? App.laut.spiele(b) : Promise.resolve(false)),
      runde(i, n) {
        $("#punkte").innerHTML = Array.from({ length: n }, (_, k) => `<i class="${k < i ? "voll" : k === i ? "jetzt" : ""}"></i>`).join("");
      },
      wiederhole(fn) { meins.wiederhole = fn; },
      beimEnde(fn) { meins.ende = fn; },                 // Aufräumen, wenn die Aufgabe verlassen wird
      // Reaktionen: Figur auf dem Bildschirm, Klang auf dem iPad (nur ohne Roboter), echter Roboter
      zeige(text) { roverZeige(text); MBot.reaktion.zeige(text); },
      richtig() { roverStimmung("freu"); if (ohneRoboter()) App.audio.klang("richtig"); MBot.reaktion.richtig(); },
      nochmal() { roverStimmung("denk"); if (ohneRoboter()) App.audio.klang("nochmal"); MBot.reaktion.nochmal(); },
      zaehlton(n) { if (ohneRoboter()) App.audio.ton(ZAEHLTOENE[(n - 1) % ZAEHLTOENE.length], 0.14); else MBot.reaktion.zaehlton(n); },
      zaehle(n) { MBot.reaktion.zaehle(n); },
      tick() { if (ohneRoboter()) App.audio.ton(784, 0.12); },
      silbe(i) { roverStimmung("freu"); if (ohneRoboter()) App.audio.ton(880, 0.14); MBot.reaktion.silbe(i); },
      rakete() { roverStimmung("freu"); if (ohneRoboter()) App.audio.klang("rakete"); MBot.reaktion.rakete(); },
      // Eingabe über den Roboter
      roboter: () => MBot.verbunden(),
      hand: (maxMs, weiter = () => true) => (MBot.verbunden() ? MBot.warteAufHand(maxMs, () => lebt() && weiter()) : Promise.resolve(false)),
      fertig() { beende(true); },
    };

    $("#punkte").innerHTML = "";
    zeigeModus("aufgabe");
    roverZeige("?");
    MBot.reaktion.neugierig();
    App.log(`Aufgabe gestartet: ${einstieg.aufgabe}`);
    try { modul.start($(".feld", schicht), ctx); }
    catch (e) { App.log(`Aufgabe abgebrochen: ${MBot.hilfen.errText(e)}`, "e"); beende(false); }
  };

  function zurWelt(bei) {
    $("#aufgabe").innerHTML = "";
    zeigeModus("welt");
    App.welt.zeige(App.stand.ort, { bei });
    zeigeTruhenzahl();
  }

  function beende(erfolg) {
    const l = lauf;
    if (!l) return;
    l.lebt = false; lauf = null;
    if (l.ende) { try { l.ende(); } catch (_) {} }
    App.still();
    if (!erfolg) { App.log("Aufgabe verlassen"); MBot.reaktion.ruhe(); zurWelt(l.einstieg.id); return; }

    // Geschafft: Fundstück für die Schatzkiste
    const art = l.einstieg.fund || "muschel";
    App.stand.fund[art] = (App.stand.fund[art] || 0) + 1;
    App.speichere();
    App.log(`Aufgabe geschafft: ${l.einstieg.aufgabe}, Fundstück ${art}`);
    const f = $("#feier");
    f.innerHTML = `<div class="feier-strahlen"></div><div class="feier-fund">${B[art]()}</div>`;
    f.classList.remove("aus");
    if (!MBot.verbunden()) App.audio.klang("feier");
    MBot.reaktion.feier();
    App.sag(`Geschafft! Du hast ${FUNDNAME[art] || "etwas"} gefunden.`);
    let zu = false;
    const schliesse = () => {
      if (zu) return;
      zu = true;
      f.classList.add("aus"); f.innerHTML = "";
      zurWelt(l.einstieg.id);
      const t = $("#btn-truhe");
      t.classList.remove("huepf"); void t.offsetWidth; t.classList.add("huepf");
    };
    const frueh = Date.now() + 900;
    f.onclick = () => { if (Date.now() > frueh) schliesse(); };
    setTimeout(schliesse, 5000);
  }

  /* ---------- Schatzkiste ---------- */
  const fundAnzahl = () => Object.values(App.stand.fund).reduce((a, b) => a + (b || 0), 0);
  function zeigeTruhenzahl() { $("#truhe-zahl").textContent = String(fundAnzahl()); }

  function oeffneTruhe() {
    const n = fundAnzahl();
    const f = $("#feier");
    const reihen = Object.entries(App.stand.fund).filter(([art, z]) => z > 0 && B[art]).map(([art, z]) =>
      `<div class="truhe-reihe">${Array.from({ length: Math.min(z, 10) }, () => `<span>${B[art]()}</span>`).join("")}${z > 10 ? `<b>+${z - 10}</b>` : ""}</div>`).join("");
    f.innerHTML = `<div class="truhe-blick papier"><div class="truhe-kopf">${B.truhe()}</div>${reihen || `<div class="truhe-leer"></div>`}</div>`;
    f.classList.remove("aus");
    f.onclick = () => { f.classList.add("aus"); f.innerHTML = ""; App.still(); };
    App.sag(n === 0 ? "Deine Schatzkiste ist noch leer. Löse eine Aufgabe!" : n === 1 ? "Du hast schon ein Fundstück." : `Du hast schon ${n} Fundstücke.`);
  }

  /* ---------- Roboter ---------- */
  function uebernimmEinstellungen() {
    const e = App.stand.einst;
    MBot.einstellungen.bewegung = !!e.bewegung;
    MBot.einstellungen.tempo = +e.tempo || 50;
    MBot.einstellungen.lautstaerke = +e.lautstaerke || 0;
    MBot.einstellungen.steuerung = e.steuerung === "einfach" ? "einfach" : "fein";
  }

  let statusText = "Nicht verbunden";
  MBot.beiLog((msg, cls) => App.log(msg, cls));
  MBot.beiStatus((art, text) => {
    statusText = text;
    $("#buehne").dataset.robo = art || "aus";
    $("#e-status").textContent = text;
    const an = art === "on";
    $("#e-verbinden").disabled = an; $("#e-alle").disabled = an; $("#e-trennen").disabled = !an;
    if (an) {
      const ort = App.inhalt.welt.orte[App.stand.ort];
      if (ort && ort.licht) MBot.reaktion.licht(...ort.licht);
      if (lauf) MBot.reaktion.zeige("?");
    }
  });

  async function roboterKnopf() {
    App.audio.klang("tipp");
    if (MBot.verbunden()) { MBot.reaktion.neugierig(); return; }
    if (!MBot.kannBluetooth()) {
      const k = $("#btn-robo");
      k.classList.remove("wackel"); void k.offsetWidth; k.classList.add("wackel");
      App.log("Dieser Browser kann kein Bluetooth. Auf dem iPad Bluefy verwenden, am Computer Chrome oder Edge.", "w");
      return;
    }
    uebernimmEinstellungen();
    await MBot.verbinde(false);
  }

  /* ---------- Elternbereich ---------- */
  const STUFEN = () => [
    ["mengenStufe", "Mengen (Fische)", App.inhalt.mengen.stufen],
    ["plusStufe", "Plus (Sterne)", App.inhalt.rechnen.plus],
    ["reiheStufe", "Zahlenreihe", App.inhalt.rechnen.reihe],
    ["vergleichStufe", "Vergleichen (Münzen)", App.inhalt.rechnen.vergleichen],
  ];

  function fuelleStimmen() {
    const sel = $("#e-stimme");
    const liste = App.ladeStimmen();
    sel.innerHTML = "";
    if (!liste.length) { sel.innerHTML = `<option value="">Standardstimme</option>`; return; }
    for (const v of liste) {
      const o = document.createElement("option");
      o.value = v.name; o.textContent = `${v.name} (${v.lang})`;
      if (v.name === App.stand.einst.stimme) o.selected = true;
      sel.appendChild(o);
    }
  }

  // Buchstaben zum An- und Abwählen
  function zeigeBuchstaben() {
    const BU = App.inhalt.buchstaben;
    const aktiv = App.buchstabenAktiv();
    const feld = $("#e-buchstaben");
    feld.innerHTML = "";
    for (const b of Object.keys(BU.zeichen)) {
      const k = document.createElement("button");
      k.className = `e-chip${aktiv.includes(b) ? " an" : ""}${BU.zeichen[b].gross ? "" : " nur-hoeren"}`;
      k.textContent = b.length > 1 ? b : `${b}${b.toLowerCase()}`;
      k.addEventListener("click", () => {
        let liste = App.buchstabenAktiv();
        if (liste.includes(b)) {
          if (liste.length <= 3) { $("#e-buchstaben-hinweis").textContent = "Mindestens drei Buchstaben müssen aktiv bleiben."; return; }
          liste = liste.filter((x) => x !== b);
        } else liste = Object.keys(BU.zeichen).filter((x) => liste.includes(x) || x === b);
        App.stand.einst.buchstaben = liste;
        App.speichere();
        App.log(`Aktive Buchstaben: ${liste.join(" ")}`);
        zeigeBuchstaben();
      });
      feld.appendChild(k);
    }
    $("#e-buchstaben-hinweis").textContent = `${aktiv.length} aktiv: ${aktiv.join(" ")}`;
  }

  function zeigeStufen() {
    const feld = $("#e-stufen");
    feld.innerHTML = "";
    for (const [schluessel, name, stufen] of STUFEN()) {
      const reihe = document.createElement("div");
      reihe.className = "e-reihe";
      reihe.innerHTML = `<span class="e-name">${name}</span><select>${stufen.map((s, i) =>
        `<option value="${i}"${i === (App.stand[schluessel] | 0) ? " selected" : ""}>Stufe ${i + 1}: ${s.name}</option>`).join("")}</select>`;
      $("select", reihe).addEventListener("change", (ev) => { App.stand[schluessel] = +ev.target.value; App.speichere(); });
      feld.appendChild(reihe);
    }
  }

  function zeigeStand() {
    const st = App.stand;
    const bu = App.buchstabenAktiv().map((b) => {
      const e = st.buchstaben[b] || {};
      return `${b}: gehört ${e.richtig || 0}✓ ${e.fehler || 0}✗, gespurt ${e.gespurt || 0}`;
    }).join("\n");
    const za = Object.keys(st.zahlen).sort((a, b) => a - b).map((z) => `${z}: ${st.zahlen[z].richtig || 0}✓ ${st.zahlen[z].fehler || 0}✗`).join("   ");
    const fund = Object.entries(st.fund).filter(([, z]) => z > 0).map(([art, z]) => `${art} ${z}`).join(", ");
    $("#e-stand").textContent = `Fundstücke: ${fundAnzahl()}${fund ? ` (${fund})` : ""}\nEntdeckungen in der Welt: ${Object.keys(st.entdeckt).length}\n\n${bu}\n\nMengen: ${za || "noch nichts"}`;
  }

  function zeigeProtokoll() {
    const p = $("#e-log");
    p.textContent = App.protokoll.join("\n");
    p.scrollTop = p.scrollHeight;
  }

  function oeffneEltern() {
    const e = App.stand.einst;
    App.welt.halt();
    $("#e-bewegung").checked = !!e.bewegung;
    $("#e-mitfahren").checked = !!e.mitfahren;
    $("#e-steuerung").value = e.steuerung === "einfach" ? "einfach" : "fein";
    $("#e-tempo").value = e.tempo; $("#e-tempo-wert").textContent = e.tempo;
    $("#e-laut").value = e.lautstaerke; $("#e-laut-wert").textContent = e.lautstaerke;
    $("#e-sprechtempo").value = e.sprechtempo; $("#e-sprechtempo-wert").textContent = e.sprechtempo;
    $("#e-status").textContent = statusText;
    $("#e-kein-bt").classList.toggle("aus", MBot.kannBluetooth());
    fuelleStimmen();
    zeigeBuchstaben();
    zeigeStufen();
    zeigeStand();
    zeigeProtokoll();
    App.beiProtokoll = zeigeProtokoll;
    $("#e-reset").textContent = "Fortschritt löschen";
    $("#e-reset").dataset.sicher = "";
    $("#eltern").classList.remove("aus");
    $(".e-inhalt").scrollTop = 0;
  }
  function schliesseEltern() {
    App.beiProtokoll = null;
    $("#eltern").classList.add("aus");
  }

  function richteElternEin() {
    const e = App.stand.einst;
    const merke = () => { App.speichere(); uebernimmEinstellungen(); };

    $("#e-zu").addEventListener("click", schliesseEltern);
    $("#e-verbinden").addEventListener("click", () => { uebernimmEinstellungen(); MBot.verbinde(false); });
    $("#e-alle").addEventListener("click", () => { uebernimmEinstellungen(); MBot.verbinde(true); });
    $("#e-trennen").addEventListener("click", () => MBot.trenne());

    $("#e-bewegung").addEventListener("change", (ev) => { e.bewegung = ev.target.checked; merke(); });
    $("#e-mitfahren").addEventListener("change", (ev) => { e.mitfahren = ev.target.checked; merke(); });
    $("#e-steuerung").addEventListener("change", (ev) => { e.steuerung = ev.target.value; merke(); if (MBot.verbunden()) MBot.pruefeFein(); });
    $("#e-tempo").addEventListener("input", (ev) => { e.tempo = +ev.target.value; $("#e-tempo-wert").textContent = e.tempo; merke(); });
    $("#e-laut").addEventListener("input", (ev) => { e.lautstaerke = +ev.target.value; $("#e-laut-wert").textContent = e.lautstaerke; merke(); });
    $("#e-laut").addEventListener("change", () => { if (MBot.verbunden()) MBot.run(`cyberpi.audio.set_vol(${+e.lautstaerke})`).catch(() => {}); });
    $("#e-probe-robo").addEventListener("click", () => MBot.reaktion.richtig());

    $("#e-stimme").addEventListener("change", (ev) => { e.stimme = ev.target.value; merke(); });
    $("#e-sprechtempo").addEventListener("input", (ev) => { e.sprechtempo = +ev.target.value; $("#e-sprechtempo-wert").textContent = e.sprechtempo; merke(); });
    $("#e-probe").addEventListener("click", () => { App.audio.entsperre(); App.sag("Hallo! Womit fängt Maus an?"); });
    $("#e-probe-klang").addEventListener("click", () => { App.audio.entsperre(); App.audio.klang("feier"); });

    $("#e-buchstaben-vorgabe").addEventListener("click", () => {
      App.stand.einst.buchstaben = null;
      App.speichere();
      zeigeBuchstaben();
    });

    $("#e-reset").addEventListener("click", (ev) => {
      const k = ev.currentTarget;
      if (!k.dataset.sicher) { k.dataset.sicher = "1"; k.textContent = "Wirklich alles löschen? Noch einmal tippen"; return; }
      App.loescheFortschritt();
      k.dataset.sicher = ""; k.textContent = "Gelöscht";
      App.log("Fortschritt gelöscht");
      zeigeStand(); zeigeStufen(); zeigeTruhenzahl();
    });

    $("#e-kopieren").addEventListener("click", async () => {
      const text = App.protokoll.join("\n");
      try { await navigator.clipboard.writeText(text); App.log("Protokoll kopiert."); }
      catch (_) {
        const ta = document.createElement("textarea");
        ta.value = text; document.body.appendChild(ta); ta.select();
        try { document.execCommand("copy"); App.log("Protokoll kopiert."); } catch (e) { App.log("Kopieren ging nicht. Text bitte markieren.", "e"); }
        ta.remove();
      }
    });

    // Öffnen: Zahnrad unten rechts eine Sekunde gedrückt halten (damit das Kind nicht versehentlich hineingerät)
    const griff = $("#eltern-griff");
    let uhr = 0;
    const ab = () => { clearTimeout(uhr); griff.classList.remove("haelt"); };
    griff.addEventListener("pointerdown", (ev) => {
      ev.stopPropagation();
      griff.classList.add("haelt");
      uhr = setTimeout(() => { ab(); oeffneEltern(); }, 1000);
    });
    for (const n of ["pointerup", "pointerleave", "pointercancel"]) griff.addEventListener(n, ab);
  }

  /* ---------- Start ---------- */
  function los() {
    App.audio.entsperre();
    App.ladeStimmen();
    $("#start").classList.add("aus");
    zeigeModus("welt");
    App.welt.zeige(App.stand.ort, { ansage: "Hallo! Zeig mit dem Finger, wohin ich fahren soll." });
    zeigeTruhenzahl();
  }

  function init() {
    skaliere();
    window.addEventListener("resize", skaliere);
    window.addEventListener("orientationchange", () => setTimeout(skaliere, 200));
    for (const n of ["gesturestart", "dblclick", "contextmenu"]) document.addEventListener(n, (ev) => ev.preventDefault());

    // Bilder für die festen Knöpfe
    $("#start-rover").innerHTML = B.rover();
    $("#btn-los").innerHTML = B.spielen();
    $("#btn-truhe").insertAdjacentHTML("afterbegin", B.truhe());
    $("#btn-zurueck").innerHTML = B.zurueck();
    $("#btn-nochmal").innerHTML = B.lautsprecher();
    $("#btn-robo").insertAdjacentHTML("afterbegin", B.rover());
    $("#eltern-zahnrad").innerHTML = B.zahnrad();
    $("#version").textContent = `v${App.VERSION}`;
    $$(".e-version").forEach((el) => { el.textContent = `App v${App.VERSION} · mbot.js v${MBot.VERSION}`; });

    $("#btn-los").addEventListener("click", los);
    $("#btn-truhe").addEventListener("click", () => { App.audio.klang("tipp"); oeffneTruhe(); });
    $("#btn-zurueck").addEventListener("click", () => { App.audio.klang("tipp"); beende(false); });
    $("#btn-nochmal").addEventListener("click", () => { if (lauf && lauf.wiederhole) lauf.wiederhole(); });
    $("#btn-robo").addEventListener("click", roboterKnopf);
    $("#btn-stopp").addEventListener("click", () => { MBot.stopp().catch(() => {}); });
    // Knöpfe am Rand sollen die Spielfigur nicht losschicken
    for (const id of ["btn-truhe", "btn-robo", "btn-stopp"]) $(`#${id}`).addEventListener("pointerdown", (ev) => ev.stopPropagation());

    uebernimmEinstellungen();
    richteElternEin();
    zeigeTruhenzahl();
    zeigeModus("start");

    App.log(`App v${App.VERSION} gestartet (mbot.js v${MBot.VERSION})`);
    App.log(`Browser: ${navigator.userAgent}`);
    App.log(`Sichere Verbindung (HTTPS/Datei): ${window.isSecureContext ? "ja" : "NEIN – Bluetooth braucht HTTPS"}`, window.isSecureContext ? "" : "e");
    App.log(`Web Bluetooth: ${MBot.kannBluetooth() ? "vorhanden" : "fehlt"}`, MBot.kannBluetooth() ? "" : "w");
    App.log(`Sprachausgabe: ${"speechSynthesis" in window ? "vorhanden" : "fehlt"}`);
    setTimeout(() => App.log(`Deutsche Stimmen: ${App.ladeStimmen().map((s) => s.name).join(", ") || "keine gefunden"}`), 900);
  }

  // Für Tests in der Browser-Konsole
  App.eltern = { oeffne: oeffneEltern, schliesse: schliesseEltern };
  init();
})();
