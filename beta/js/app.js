/* app.js – Start, Rahmen für Aufgaben, Knöpfe am Rand, Schatzkiste, Elternbereich, Roboter-Anbindung */
"use strict";

(() => {
  const { $, $$ } = App;
  const B = App.bilder;
  const ZAEHLTOENE = [523, 587, 659, 698, 784, 880, 988, 1047, 1175, 1319];
  const FUNDNAME = { muschel: "eine Muschel", seestern: "einen Seestern", perle: "eine Perle" };
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
      zeige(text) { roverZeige(text); MBot.reaktion.zeige(text); },
      richtig() { roverStimmung("freu"); if (ohneRoboter()) App.audio.klang("richtig"); MBot.reaktion.richtig(); },
      nochmal() { roverStimmung("denk"); if (ohneRoboter()) App.audio.klang("nochmal"); MBot.reaktion.nochmal(); },
      zaehlton(n) { if (ohneRoboter()) App.audio.ton(ZAEHLTOENE[(n - 1) % ZAEHLTOENE.length], 0.14); else MBot.reaktion.zaehlton(n); },
      zaehle(n) { MBot.reaktion.zaehle(n); },
      tick() { if (ohneRoboter()) App.audio.ton(784, 0.12); },
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

  function zurWelt() {
    $("#aufgabe").innerHTML = "";
    zeigeModus("welt");
    App.welt.zeige(App.stand.ort);
    zeigeTruhenzahl();
  }

  function beende(erfolg) {
    const l = lauf;
    if (!l) return;
    l.lebt = false; lauf = null;
    App.still();
    if (!erfolg) { App.log("Aufgabe verlassen"); MBot.reaktion.ruhe(); zurWelt(); return; }

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
      zurWelt();
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
    const reihen = Object.entries(App.stand.fund).filter(([, z]) => z > 0).map(([art, z]) =>
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
      if (lauf) MBot.reaktion.zeige("?");
      else if (ort && ort.licht) MBot.reaktion.licht(...ort.licht);
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

  function zeigeStand() {
    const st = App.stand;
    const bu = App.inhalt.buchstaben.aktiv.map((b) => {
      const e = st.buchstaben[b] || {};
      return `${b}: gehört ${e.richtig || 0}✓ ${e.fehler || 0}✗, gespurt ${e.gespurt || 0}`;
    }).join("\n");
    const za = Object.keys(st.zahlen).sort((a, b) => a - b).map((z) => `${z}: ${st.zahlen[z].richtig || 0}✓ ${st.zahlen[z].fehler || 0}✗`).join("   ");
    $("#e-stand").textContent = `Fundstücke: ${fundAnzahl()} (Muscheln ${st.fund.muschel}, Seesterne ${st.fund.seestern}, Perlen ${st.fund.perle})\n\n${bu}\n\nZahlen: ${za || "noch nichts"}`;
  }

  function zeigeProtokoll() {
    const p = $("#e-log");
    p.textContent = App.protokoll.join("\n");
    p.scrollTop = p.scrollHeight;
  }

  function oeffneEltern() {
    const e = App.stand.einst;
    $("#e-bewegung").checked = !!e.bewegung;
    $("#e-tempo").value = e.tempo; $("#e-tempo-wert").textContent = e.tempo;
    $("#e-laut").value = e.lautstaerke; $("#e-laut-wert").textContent = e.lautstaerke;
    $("#e-sprechtempo").value = e.sprechtempo; $("#e-sprechtempo-wert").textContent = e.sprechtempo;
    $("#e-status").textContent = statusText;
    $("#e-kein-bt").classList.toggle("aus", MBot.kannBluetooth());
    const st = $("#e-stufe");
    st.innerHTML = App.inhalt.mengen.stufen.map((s, i) => `<option value="${i}"${i === (App.stand.mengenStufe | 0) ? " selected" : ""}>Stufe ${i + 1}: ${s.name}</option>`).join("");
    fuelleStimmen();
    zeigeStand();
    zeigeProtokoll();
    App.beiProtokoll = zeigeProtokoll;
    $("#e-reset").textContent = "Fortschritt löschen";
    $("#e-reset").dataset.sicher = "";
    $("#eltern").classList.remove("aus");
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
    $("#e-tempo").addEventListener("input", (ev) => { e.tempo = +ev.target.value; $("#e-tempo-wert").textContent = e.tempo; merke(); });
    $("#e-laut").addEventListener("input", (ev) => { e.lautstaerke = +ev.target.value; $("#e-laut-wert").textContent = e.lautstaerke; merke(); });
    $("#e-laut").addEventListener("change", () => { if (MBot.verbunden()) MBot.run(`cyberpi.audio.set_vol(${+e.lautstaerke})`).catch(() => {}); });
    $("#e-probe-robo").addEventListener("click", () => MBot.reaktion.richtig());

    $("#e-stimme").addEventListener("change", (ev) => { e.stimme = ev.target.value; merke(); });
    $("#e-sprechtempo").addEventListener("input", (ev) => { e.sprechtempo = +ev.target.value; $("#e-sprechtempo-wert").textContent = e.sprechtempo; merke(); });
    $("#e-probe").addEventListener("click", () => { App.audio.entsperre(); App.sag("Hallo! Womit fängt Maus an?"); });

    $("#e-stufe").addEventListener("change", (ev) => { App.stand.mengenStufe = +ev.target.value; App.speichere(); });

    $("#e-reset").addEventListener("click", (ev) => {
      const k = ev.currentTarget;
      if (!k.dataset.sicher) { k.dataset.sicher = "1"; k.textContent = "Wirklich alles löschen? Noch einmal tippen"; return; }
      App.loescheFortschritt();
      k.dataset.sicher = ""; k.textContent = "Gelöscht";
      App.log("Fortschritt gelöscht");
      zeigeStand(); zeigeTruhenzahl();
      $("#e-stufe").value = "0";
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

    // Öffnen: Versionsnummer unten rechts lange gedrückt halten
    const v = $("#version");
    let uhr = 0;
    const ab = () => { clearTimeout(uhr); v.classList.remove("haelt"); };
    v.addEventListener("pointerdown", () => { v.classList.add("haelt"); uhr = setTimeout(() => { ab(); oeffneEltern(); }, 1000); });
    for (const n of ["pointerup", "pointerleave", "pointercancel"]) v.addEventListener(n, ab);
  }

  /* ---------- Start ---------- */
  function los() {
    App.audio.entsperre();
    App.ladeStimmen();
    $("#start").classList.add("aus");
    zeigeModus("welt");
    App.welt.zeige(App.stand.ort, { ansage: "Hallo! Tippe an, wohin du möchtest." });
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
    $("#version").textContent = `v${App.VERSION}`;
    $$(".e-version").forEach((el) => { el.textContent = `App v${App.VERSION} · mbot.js v${MBot.VERSION}`; });

    $("#btn-los").addEventListener("click", los);
    $("#btn-truhe").addEventListener("click", () => { App.audio.klang("tipp"); oeffneTruhe(); });
    $("#btn-zurueck").addEventListener("click", () => { App.audio.klang("tipp"); beende(false); });
    $("#btn-nochmal").addEventListener("click", () => { if (lauf && lauf.wiederhole) lauf.wiederhole(); });
    $("#btn-robo").addEventListener("click", roboterKnopf);
    $("#btn-stopp").addEventListener("click", () => { MBot.stopp().catch(() => {}); });

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
