/* app.js – Start, Rahmen für Aufgaben, Knöpfe am Rand, Schatzkiste, Elternbereich, Roboter-Anbindung */
"use strict";

(() => {
  const { $, $$ } = App;
  const B = App.bilder;
  const ZAEHLTOENE = [523, 587, 659, 698, 784, 880, 988, 1047, 1175, 1319];
  // Fundstücke: [ein Stück, mehrere Stücke], so wie es nach „Du hast …“ gesprochen wird
  const FUNDNAME = {
    muschel: ["eine Muschel", "Muscheln"], seestern: ["einen Seestern", "Seesterne"], perle: ["eine Perle", "Perlen"],
    stern: ["einen Stern", "Sterne"], planet: ["einen Planeten", "Planeten"], rakete: ["eine kleine Rakete", "kleine Raketen"],
    feder: ["eine Papageienfeder", "Papageienfedern"], flasche: ["eine Flaschenpost", "Flaschen"], muenze: ["eine Goldmünze", "Goldmünzen"],
    komet: ["einen Kometen", "Kometen"], zahnrad: ["ein Zahnrad", "Zahnräder"], anker: ["einen Anker", "Anker"], boje: ["eine Boje", "Bojen"], schnecke: ["ein Schneckenhaus", "Schneckenhäuser"],
    fahrkarte: ["eine Fahrkarte", "Fahrkarten"], schraube: ["eine Schraube", "Schrauben"],
  };
  const ZAHLWORT = ["null", "eins", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun", "zehn"];
  const BILDNAME = { krebs: "Krebs", fisch: "Fisch", seestern: "Seestern", planet: "Planet", stern: "Stern", muschel: "Muschel" };   // Spieler-Bilder
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
    // Wie viele Aufgaben ein Spiel hat, bestimmt der Elternbereich (nur bei Spielen mit Runden)
    const wunsch = Math.round(+App.stand.einst.runden);
    if (einstieg.inhalt && einstieg.inhalt.runden && wunsch >= 2 && wunsch <= 5) {
      einstieg = Object.assign({}, einstieg, { inhalt: Object.assign({}, einstieg.inhalt, { runden: wunsch }) });
    }
    const schicht = $("#aufgabe");
    // Hintergrund: der des Spiels, außer der Einstieg nennt einen eigenen (z. B. Zahlenreihe am Leuchtturm)
    schicht.innerHTML = `<div class="ort-bild">${B[(einstieg.inhalt && einstieg.inhalt.hintergrund) || modul.hintergrund]()}</div><div class="feld"></div><div class="rover rover-aufgabe">${B.rover()}</div>`;
    const meins = lauf = { einstieg, lebt: true, wiederhole: null, geloest: 0, warBereit: fertigePlaene(), bauVorher: App.werkstatt.raketenbau() };
    const lebt = () => meins.lebt;
    const ohneRoboter = () => !MBot.verbunden();

    // Das bekommt jede Aufgabe an die Hand
    const ctx = {
      einstieg,
      lebt,
      warte: async (ms) => { await App.warte(ms); return lebt(); },
      sag: (text) => (lebt() ? App.sag(text) : Promise.resolve()),
      spielLaut: (b) => (lebt() ? App.laut.spiele(b) : Promise.resolve(false)),
      // Wort langsam sprechen und dabei Silbe für Silbe melden: fn(i)
      sagSilben: (silben, fn) => (lebt() ? App.sagSilben(silben, (i) => { if (lebt()) fn(i); }) : Promise.resolve()),
      // Fortschritt oben: i Aufgaben sind gelöst, n gibt es. Jede gelöste Aufgabe bringt sofort ein Fundstück.
      runde(i, n) {
        const neu = belohne(meins, i);
        const art = einstieg.fund;
        $("#punkte").innerHTML = Array.from({ length: n }, (_, k) =>
          k < i && art && B[art] ? `<i class="fund${neu && k === i - 1 ? " neu" : ""}">${B[art]()}</i>` : `<i class="${k < i ? "voll" : k === i ? "jetzt" : ""}"></i>`).join("");
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
      blitz() { roverStimmung("freu"); App.audio.ton(880, 0.12); MBot.reaktion.blitz(); },   // leise Rückmeldung fürs Klatschen
      knopf(rgb, ton) { if (ohneRoboter()) App.audio.ton(ton, 0.16); else MBot.reaktion.knopf(rgb[0], rgb[1], rgb[2], ton); },
      rakete() { roverStimmung("freu"); if (ohneRoboter()) App.audio.klang("rakete"); MBot.reaktion.rakete(); },
      // Eingabe über den Roboter
      roboter: () => MBot.verbunden(),
      winken: (fn, wechsel = () => {}) => {
        if (MBot.verbunden()) MBot.beobachteHand(() => { if (lebt()) { wechsel(true); fn(); } }, lebt, () => wechsel(false));
      },
      hand: (maxMs, weiter = () => true) => (MBot.verbunden() ? MBot.warteAufHand(maxMs, () => lebt() && weiter()) : Promise.resolve(false)),
      fertig() { beende(true); },
      reise(ortId) { beende(false, ortId); },            // Aufgabe endet ohne Fundstück, weiter an einem anderen Ort
    };

    $("#punkte").innerHTML = "";
    zeigeModus("aufgabe");
    roverZeige("?");
    MBot.reaktion.neugierig();
    App.log(`Aufgabe gestartet: ${einstieg.aufgabe}`);
    try { modul.start($(".feld", schicht), ctx); }
    catch (e) { App.log(`Aufgabe abgebrochen: ${MBot.hilfen.errText(e)}`, "e"); beende(false); }
  };

  function zurWelt(bei, ansage, l) {
    $("#aufgabe").innerHTML = "";
    zeigeModus("welt");
    App.welt.zeige(App.stand.ort, { bei, ansage });
    zeigeTruhenzahl();
    if (l) zeigeRaketenbau(l.bauVorher);
  }
  // Die große Rakete wächst sichtbar: Nach einem Spiel an der Raketenstation steht sie zuerst im alten Zustand
  // da, dann kommt Stück für Stück dazu, was das Spiel gebracht hat (Raketenteile, Tankfüllung).
  function zeigeRaketenbau(vorher) {
    if (App.stand.ort !== "raketenstation" || !vorher || vorher.fertig) return;
    const jetzt = App.werkstatt.raketenbau(), schritte = [], s = Object.assign({}, vorher), teil = 1 / preis();
    if (jetzt.fertig) return;
    while (s.stufe < jetzt.stufe) { s.stufe++; schritte.push(Object.assign({}, s)); }
    while (s.tank < jetzt.tank - 0.001) { s.tank = Math.min(jetzt.tank, s.tank + teil); schritte.push(Object.assign({}, s)); }
    if (!schritte.length) return;
    App.welt.bild(B.station(vorher));
    schritte.forEach((b, i) => setTimeout(() => {
      if (App.stand.ort !== "raketenstation" || $("#buehne").dataset.modus !== "welt") return;
      App.welt.bild(B.station(b));
      App.audio.klang("strich");
    }, 800 + i * 800));
    App.log(`Raketenbau: ${schritte.length} Schritt(e) gezeigt`);
  }
  // Hat dieses Spiel ein Rezept voll gemacht (das gewählte oder das des anderen Bauplans)? Dann ruft die Figur zum Krebs.
  function rufZumKrebs(l) {
    const id = fertigePlaene().find((p) => !l.warBereit.includes(p));
    return id ? `Jetzt haben wir alles für ${BT().teile[id].den}. Fahr zum Krebs am Strand!` : undefined;
  }

  // Legt für jede neu gelöste Aufgabe ein Fundstück in die Schatzkiste (sofort gespeichert,
  // es bleibt also auch, wenn das Spiel vorzeitig verlassen wird). true = es kam etwas dazu.
  function belohne(l, geloest) {
    const art = l.einstieg.fund;
    if (!art || geloest <= l.geloest) return false;
    App.stand.fund[art] = (App.stand.fund[art] || 0) + (geloest - l.geloest);
    l.geloest = geloest;
    App.speichere();
    App.log(`Aufgabe ${geloest} gelöst (${l.einstieg.aufgabe}): Fundstück ${art}`);
    return true;
  }

  function beende(erfolg, reiseziel) {
    const l = lauf;
    if (!l) return;
    l.lebt = false; lauf = null;
    if (l.ende) { try { l.ende(); } catch (_) {} }
    App.still();
    if (reiseziel) {
      $("#aufgabe").innerHTML = "";
      zeigeModus("welt");
      App.welt.zeige(reiseziel, { rein: "tor", ansage: App.inhalt.welt.orte[reiseziel].ansage });
      zeigeTruhenzahl();
      return;
    }
    if (!erfolg) { App.log(`Spiel verlassen nach ${l.geloest} gelösten Aufgaben (${l.einstieg.aufgabe})`); MBot.reaktion.ruhe(); zurWelt(l.einstieg.id, rufZumKrebs(l), l); return; }

    // Geschafft: Die letzte Aufgabe bringt ihr Fundstück, dann zeigt die Feier alle Fundstücke dieses Spiels
    const art = l.einstieg.fund;
    if (!art || !B[art]) { App.log(`Spiel geschafft: ${l.einstieg.aufgabe}`); MBot.reaktion.ruhe(); zurWelt(l.einstieg.id); return; }
    belohne(l, l.geloest + 1);
    const n = l.geloest;
    App.log(`Spiel geschafft: ${l.einstieg.aufgabe}, ${n} Fundstücke ${art}`);
    const f = $("#feier");
    const breite = Math.min(260, Math.floor(880 / n) - 24);
    f.innerHTML = `<div class="feier-strahlen"></div><div class="feier-reihe">${Array.from({ length: n }, (_, k) =>
      `<span style="width:${breite}px;animation-delay:${(k * 0.16).toFixed(2)}s">${B[art]()}</span>`).join("")}</div>`;
    f.classList.remove("aus");
    if (!MBot.verbunden()) App.audio.klang("feier");
    MBot.reaktion.feier();
    const name = FUNDNAME[art] || ["etwas", "Fundstücke"];
    App.sag(n === 1 ? `Geschafft! Du hast ${name[0]} gefunden.` : `Geschafft! Du hast ${ZAHLWORT[n] || n} ${name[1]} gefunden.`);
    let zu = false;
    const schliesse = () => {
      if (zu) return;
      zu = true;
      f.classList.add("aus"); f.innerHTML = "";
      zurWelt(l.einstieg.id, rufZumKrebs(l), l);
      const t = $("#btn-truhe");
      t.classList.remove("huepf"); void t.offsetWidth; t.classList.add("huepf");
    };
    const frueh = Date.now() + 900;
    f.onclick = () => { if (Date.now() > frueh) schliesse(); };
    setTimeout(schliesse, 5000);
  }

  /* ---------- Werkstatt: Der Krebs baut aus Fundstücken Bauteile ----------
   * Daten: inhalt/bauteile.js. Beim Krebs liegen zwei Baupläne nebeneinander, das Kind wählt, woran gebaut wird:
   *   links   das nächste Schlüssel-Teil der Reihenfolge (es öffnet einen Ort). Sind alle gebaut, steht hier der
   *           Treibstoff (jeder Tank reicht für eine Reise zu einem neuen kleinen Ziel).
   *   rechts  das nächste Werkzeug (es öffnet einen Spielplatz und Verstecke). Sind alle gebaut, fehlt dieser Plan.
   * Die Wahl steht im Spielstand („bauplan“: "teil" oder "werkzeug") und lässt sich jederzeit ändern; Fundstücke
   * gehen dabei nicht verloren. Ein Rezept braucht von zwei Sorten Fundstücken je „preis“ Stück; beim Bauen
   * werden sie aus der Schatzkiste genommen. */
  const BT = () => App.inhalt.bauteile;
  const preis = () => { const p = Math.round(+App.stand.einst.preis); return p >= 1 && p <= 3 ? p : BT().preis; };
  // Das nächste Schlüssel-Teil (linker Bauplan): erst die Hauptreihe bis zum Triebwerk. Danach wechseln sich
  // Treibstoff und die Teile für die neue Insel ab: erst ein Tank, dann ein Insel-Teil, wieder ein Tank … Ein
  // Insel-Teil ist also dran, wenn schon mehr Tanks gemacht sind als Insel-Teile gebaut. Am Ende bleibt Treibstoff.
  const inselTeile = () => BT().insel || [];
  const naechstesSchluessel = () => {
    const haupt = BT().reihenfolge.find((id) => !App.stand.teile[id]);
    if (haupt) return haupt;
    const offen = inselTeile().find((id) => !App.stand.teile[id]), gebaut = inselTeile().filter((id) => App.stand.teile[id]).length;
    return offen && (App.stand.tanks || 0) > gebaut ? offen : "treibstoff";
  };
  const naechstesWerkzeug = () => BT().werkzeuge.find((id) => !App.stand.teile[id]) || null;
  const plaene = () => [naechstesSchluessel(), naechstesWerkzeug()].filter(Boolean);   // die Baupläne beim Krebs: einer oder zwei
  // Das Teil, an dem gerade gebaut wird (der gewählte Bauplan). Funk-Krebs, Karte und Abzeichen zeigen dieses Teil.
  const naechstesTeil = () => (App.stand.bauplan === "werkzeug" && naechstesWerkzeug()) || naechstesSchluessel();
  const fertigePlaene = () => plaene().filter((id) => bereit(id));   // Baupläne, für die schon alles da ist
  const alleTeile = () => [...BT().reihenfolge, ...inselTeile(), ...BT().werkzeuge];
  const sorten = (id) => (id === "treibstoff" ? BT().paare[(App.stand.tanks || 0) % BT().paare.length] : BT().teile[id].aus);
  const rezept = (id) => sorten(id).map((art) => ({ art, soll: preis(), da: Math.min(preis(), App.stand.fund[art] || 0) }));
  const bereit = (id) => !!id && rezept(id).every((r) => r.da >= r.soll);
  const fundText = (art, n) => { const name = FUNDNAME[art] || ["ein Fundstück", "Fundstücke"]; return n === 1 ? name[0] : `${ZAHLWORT[n] || n} ${name[1]}`; };
  const fehltText = (id) => rezept(id).filter((r) => r.da < r.soll).map((r) => fundText(r.art, r.soll - r.da)).join(" und ");
  // Das Spiel, in dem es diese Sorte Fundstück gibt (für das kleine Bild neben dem Rezept)
  const woher = (art) => {
    for (const o of Object.values(App.inhalt.welt.orte)) for (const e of o.einstiege || []) if (e.fund === art) return e;
    return null;
  };

  // Was ein Bauteil öffnet, als kleines Bild in der Ecke des Bauplans: den Ort (Schlüssel-Teil oder Spielplatz eines
  // Werkzeugs) oder die Wolke mit Fragezeichen (Treibstoff: ein neues Reiseziel). Ein Werkzeug ohne Spielplatz
  // (es öffnet nur Verstecke) bekommt kein Bild; das Bauteil selbst ist die Hauptsache.
  const oeffnet = (id) => {
    if (id === "treibstoff") return `<span class="ws-ziel fremd">${B.wolke()}<b>?</b></span>`;
    const o = Object.values(App.inhalt.welt.orte).find((x) => x.braucht === id);
    return o ? `<span class="ws-ziel">${o.male ? o.male() : B[o.bild]()}</span>` : "";
  };

  function oeffneWerkstatt() {
    const f = $("#feier");
    App.welt.halt();
    let gebaut = false, gewechselt = false, frueh = Date.now() + 500;
    const schliesse = () => {
      f.classList.add("aus"); f.innerHTML = ""; f.onclick = null;
      App.still();
      zeigeTruhenzahl();
      if (gebaut || gewechselt) App.welt.zeige(App.stand.ort, { bei: "werkstatt" });   // Sperren und Abzeichen neu zeichnen
    };
    // Schließen: Zurück-Knopf oder Tipp neben die Baupläne. Ein Tipp auf einen Bauplan wählt ihn.
    f.onclick = () => { if (Date.now() >= frueh) schliesse(); };
    f.classList.remove("aus");

    // Ansage zu einem Bauplan. wechsel = das Kind hat ihn gerade gewählt
    const sage = (id, wechsel) => {
      const t = BT().teile[id], andere = plaene().find((p) => p !== id), a = andere && BT().teile[andere];
      if (bereit(id)) { App.sag(`Alles da! Tippe auf den Schraubenschlüssel. Dann baue ich ${t.den}.`); return; }
      const text = `${wechsel ? `Gut, ich baue ${t.den}.` : `Ich baue dir ${t.einen}.`} Dafür brauche ich noch ${fehltText(id)}.`;
      App.sag(!a || wechsel ? text : bereit(andere) ? `${text} Für ${a.den} ist schon alles da. Tippe auf ${a.den}.` : `${text} Oder tippe auf ${a.den}.`);
    };
    const plan = (id) => {
      const t = BT().teile[id], aktiv = id === naechstesTeil(), fertig = bereit(id), ziel = oeffnet(id);
      const zeilen = rezept(id).map((r) => {
        const e = woher(r.art);
        return `<div class="ws-zeile"><span class="ws-woher">${e ? `${B[e.figur]()}<i class="ws-fach">${B.fach(e.fach)}</i>` : ""}</span><span class="ws-plaetze">${Array.from({ length: r.soll }, (_, k) =>
          `<i class="${k < r.da ? "voll" : ""}">${B[r.art]()}</i>`).join("")}</span></div>`;
      }).join("");
      return `<div class="ws-plan${aktiv ? " aktiv" : ""}${fertig ? " bereit" : ""}" data-teil="${id}" role="button" aria-label="Bauplan ${t.name}">
        <div class="ws-kopf"><span class="ws-teil">${B[t.bild]()}</span>${ziel ? `<i class="ws-pfeil">${B.pfeil("rechts")}</i>${ziel}` : ""}</div>
        <div class="ws-mitte">${aktiv && fertig ? `<button class="ws-bauen" aria-label="${t.name} bauen">${B.schluessel()}</button>` : ""}</div>
        <div class="ws-rezept">${zeilen}</div></div>`;   // oben das Bauteil, das Rezept immer ganz unten, dazwischen der Schraubenschlüssel
    };
    const baue = (id) => {
      const t = BT().teile[id];
      gebaut = true; frueh = Date.now() + 1200;
      for (const r of rezept(id)) App.stand.fund[r.art] = Math.max(0, (App.stand.fund[r.art] || 0) - r.soll);
      if (id === "treibstoff") { App.stand.treibstoff = (App.stand.treibstoff || 0) + 1; App.stand.tanks = (App.stand.tanks || 0) + 1; }
      else App.stand.teile[id] = 1;
      App.speichere();
      App.log(`Bauteil gebaut: ${t.name}${id === "treibstoff" ? ` (volle Tanks: ${App.stand.treibstoff})` : ""}`);
      // Das fertige Teil groß, daneben (wenn es einen Ort öffnet) ein Pfeil und der Ort
      const ziel = oeffnet(id);
      f.innerHTML = `<div class="ws papier gebaut${ziel ? "" : " allein"}"><div class="ws-krebs">${B.figurMechaniker()}</div><div class="ws-teil">${B[t.bild]()}</div>${
        ziel ? `<i class="ws-pfeil">${B.pfeil("rechts")}</i>${ziel}` : ""}</div>`;
      if (!MBot.verbunden()) App.audio.klang("feier");
      MBot.reaktion.feier();
      App.sag(`Fertig! ${t.fertig}`);
      zeigeTruhenzahl();
    };
    const zeichne = () => {
      f.innerHTML = `<div class="ws papier"><div class="ws-krebs">${B.figurMechaniker()}</div><div class="ws-plaene">${plaene().map(plan).join("")}</div></div>
        <button class="knopf ws-zu" aria-label="Zurück zur Welt">${B.zurueck()}</button>`;
      $$(".ws-plan", f).forEach((el) => el.addEventListener("click", (ev) => {
        ev.stopPropagation();
        const id = el.dataset.teil;
        if (ev.target.closest(".ws-bauen")) { if (!gebaut) baue(id); return; }
        App.audio.klang("tipp");
        if (id !== naechstesTeil()) {
          App.stand.bauplan = id === naechstesWerkzeug() ? "werkzeug" : "teil";
          App.speichere();
          gewechselt = true;
          App.log(`Werkstatt: Bauplan gewählt: ${BT().teile[id].name}`);
          zeichne();
          $(".ws", f).style.animation = "none";   // beim Wechseln nicht noch einmal aufploppen
          sage(id, true);
        } else sage(id, false);
      }));
    };
    zeichne();
    App.log(`Werkstatt: ${plaene().map((id) => `${BT().teile[id].name}${id === naechstesTeil() ? " (gewählt)" : ""} ${rezept(id).map((r) => `${r.art} ${r.da}/${r.soll}`).join(", ")}`).join(" · ")}`);
    sage(naechstesTeil(), false);
  }

  /* ---------- Funk-Krebs: Was fehlt noch? ----------
   * Knopf oben neben der Karte, in der Welt immer zu sehen. Antippen: Der Krebs sagt über Funk, was er gerade baut
   * und was dafür noch fehlt. Darunter klappt eine kleine Liste auf: das Bauteil, darunter je Sorte eine Zeile mit
   * dem Fach-Zeichen des Spiels und den Plätzen (farbig = schon da, grau = fehlt noch). Sie schließt sich von
   * selbst, beim nächsten Tipp auf den Knopf oder sobald die Figur weiterfährt. */
  let funkUhr = 0;
  function schliesseFunk() {
    clearTimeout(funkUhr);
    $("#funk-liste").classList.add("aus");
    $("#btn-funk").classList.remove("an");
  }
  function oeffneFunk() {
    const l = $("#funk-liste");
    if (!l.classList.contains("aus")) { schliesseFunk(); App.still(); return; }
    const id = naechstesTeil(), t = BT().teile[id], rz = rezept(id), fertig = bereit(id);
    l.innerHTML = `<div class="fl-teil${fertig ? " bereit" : ""}">${B[t.bild]()}</div>${rz.map((r) => {
      const e = woher(r.art);
      return `<div class="fl-zeile"><i class="fl-fach">${e ? B.fach(e.fach) : ""}</i>${Array.from({ length: r.soll }, (_, k) =>
        `<i class="fl-platz${k < r.da ? " voll" : ""}">${B[r.art]()}</i>`).join("")}</div>`;
    }).join("")}`;
    l.classList.remove("aus");
    $("#btn-funk").classList.add("an");
    App.log(`Funk-Krebs: ${t.name}, ${rz.map((r) => `${r.art} ${r.da}/${r.soll}`).join(", ")}`);
    App.sag(fertig ? `Alles da! Komm zu mir an den Strand. Dann baue ich ${t.den}.` : `Für ${t.den} brauche ich noch ${fehltText(id)}.`);
    clearTimeout(funkUhr);
    funkUhr = setTimeout(schliesseFunk, 9000);
  }

  App.werkstatt = {
    oeffne: oeffneWerkstatt,
    hat: (teilId) => !!App.stand.teile[teilId],
    // Baufortschritt der großen Rakete an der Station: Sie wächst mit den Sternen (Silben), der Tank füllt
    // sich mit den Planeten (Plus). Fertig ist sie, wenn der Krebs das Triebwerk gebaut hat. Das gilt auch
    // mit „Alle Orte offen“: Der Schalter nimmt nur die Sperren weg, die Rakete zeigt weiter den echten Stand.
    raketenbau() {
      if (App.stand.teile.triebwerk) return { stufe: 3, tank: 1, fertig: true };
      const [bau, tank] = rezept("triebwerk");
      return { stufe: bau.da >= bau.soll ? 2 : bau.da > 0 ? 1 : 0, tank: tank.da / tank.soll, fertig: false };
    },
    teilBild: (teilId) => B[BT().teile[teilId].bild](),
    // Welches Bauteil fehlt für diesen Ort? null = der Ort ist offen
    gesperrt(ortId) {
      const o = App.inhalt.welt.orte[ortId];
      return !o || !o.braucht || App.stand.einst.offen || App.stand.teile[o.braucht] ? null : o.braucht;
    },
    sagSperre(teilId) {
      App.log(`Gesperrt: dafür fehlt ${BT().teile[teilId].name}`);
      MBot.reaktion.nochmal();
      App.sag(`Dorthin komme ich erst mit ${BT().teile[teilId].mit}. Der Krebs am Strand hilft mir.`);
    },
    // Abzeichen am Krebs in der Welt: das Teil, an dem er gerade baut; es pulsiert, wenn für einen der Baupläne alles da ist
    abzeichen() {
      const id = naechstesTeil();
      return id ? `<span class="abzeichen${fertigePlaene().length ? " bereit" : ""}">${B[BT().teile[id].bild]()}</span>` : "";
    },
  };

  /* ---------- Reisen: mit einem vollen Tank zu einem neuen Planeten, Reisealbum ----------
   * Die Planeten entstehen in js/planeten.js aus einer Bauzahl. Im Spielstand steht pro Reise { z, name }. */
  function fliege(eintrag, neu) {
    const P = App.planeten, f = $("#feier");
    App.welt.halt();
    // Kleine Insel: Die Fähre bringt die Figur hin
    if (eintrag.art === "insel") {
      const insel = App.inhalt.welt.orte.insel = P.ort(eintrag.z, eintrag.name, "insel");
      f.innerHTML = `<div class="fahrt">${B.meerBild()}<div class="fahrt-schiff">${B.faehre()}</div></div>`;
      f.onclick = null;
      f.classList.remove("aus");
      if (!MBot.verbunden()) App.audio.klang("neugierig");
      MBot.reaktion.neugierig();
      App.sag(neu ? "Leinen los! Wir fahren zu einer neuen Insel." : `Leinen los! Wir fahren zur Insel ${eintrag.name}.`);
      setTimeout(() => {
        f.classList.add("aus"); f.innerHTML = "";
        zeigeModus("welt");
        App.welt.zeige("insel", { rein: "tor", aus: "faehre", ansage: neu ? insel.ansage : `Angekommen auf ${eintrag.name}.` });
        zeigeTruhenzahl();
      }, 3000);
      return;
    }
    App.inhalt.welt.orte.planet = P.ort(eintrag.z, eintrag.name);
    f.innerHTML = `<div class="flug"><div class="flug-sterne">${P.sterneBild()}</div><div class="flug-ziel">${P.kleinBild(eintrag.z)}</div><div class="flug-rakete eigene">${B.bauRakete(App.meineRakete())}</div></div>`;   // die Rakete des Kindes
    f.onclick = null;
    f.classList.remove("aus");
    if (!MBot.verbunden()) App.audio.klang("rakete");
    MBot.reaktion.rakete();
    App.sag(neu ? "Wir fliegen zu einem neuen Planeten!" : `Wir fliegen zum Planeten ${eintrag.name}!`);
    setTimeout(() => {
      f.classList.add("aus"); f.innerHTML = "";
      zeigeModus("welt");
      App.welt.zeige("planet", { rein: "tor", ansage: neu ? App.inhalt.welt.orte.planet.ansage : `Gelandet auf ${eintrag.name}.` });
      zeigeTruhenzahl();
    }, 2800);
  }

  /* ---------- Sternenkarte: Abflug im Weltraum ----------
   * Das Gegenstück zur Seekarte der Fähre. In der Mitte der neue Planet („?“, kostet einen vollen Tank), auf der
   * Umlaufbahn darum die zuletzt besuchten Planeten mit Namen; dorthin fliegt die Rakete ohne Treibstoff. */
  function oeffneSterne() {
    const k = $("#karte"), tank = App.reise.fehlt(), planeten = App.reise.planeten().slice(-11);
    App.welt.halt();
    const ziele = planeten.map((r, i) => {
      const w = (-90 + (i + 0.5) * 360 / 11) * Math.PI / 180;   // elf Plätze auf der Umlaufbahn, im Uhrzeigersinn ab oben
      return `<button class="stern-ziel" data-z="${r.z}" style="left:${Math.round(512 + 380 * Math.cos(w))}px;top:${Math.round(372 + 250 * Math.sin(w))}px" aria-label="Planet ${r.name}">${
        App.planeten.kleinBild(r.z)}<b>${r.name}</b></button>`;
    }).join("");
    k.classList.add("sterne");
    k.onclick = null;
    k.innerHTML = `<div class="karte-grund">${B.sternGrund()}</div>${ziele}<button class="stern-neu${tank ? " zu" : ""}" aria-label="Neuer Planet">${B.figurPlanetenflug()}${
      tank ? `<span class="schloss">${B.schloss()}</span>` : ""}</button><button class="knopf karte-zu" aria-label="Sternenkarte schließen">${B.zurueck()}</button>`;
    k.classList.remove("aus");
    const zu = () => { k.classList.add("aus"); k.classList.remove("sterne"); k.innerHTML = ""; };
    $(".karte-zu", k).addEventListener("click", () => { App.audio.klang("tipp"); zu(); });
    $$(".stern-ziel", k).forEach((el) => el.addEventListener("click", () => {
      const eintrag = App.stand.reisen.find((r) => String(r.z) === el.dataset.z);
      if (!eintrag) return;
      zu();
      fliege(eintrag, false);
    }));
    $(".stern-neu", k).addEventListener("click", (ev) => {
      if (tank) { wackle(ev.currentTarget); App.werkstatt.sagSperre(tank); return; }
      zu();
      App.reise.starte("planet");
    });
    App.log(`Sternenkarte: ${planeten.length} besuchte Planeten, ${tank ? "kein voller Tank" : "Tank voll"}`);
    App.sag(planeten.length ? "Wohin soll die Rakete fliegen? Tippe einen Planeten an." : "Wohin soll die Rakete fliegen? Tippe auf das Fragezeichen.");
  }

  App.reise = {
    // Fehlt etwas für die Reise zu einem neuen Ziel? null = es kann losgehen
    fehlt: () => (App.stand.einst.offen || App.stand.treibstoff > 0 ? null : "treibstoff"),
    // Schon besuchte Planeten (ohne die kleinen Inseln), älteste zuerst
    planeten: () => App.stand.reisen.filter((r) => r.art !== "insel"),
    // Abflug-Tor im Weltraum: öffnet die Sternenkarte
    oeffne: oeffneSterne,
    // art: "planet" (Abflug im Weltraum) oder "insel" (neue Insel auf der Seekarte der Fähre)
    starte(art = "planet") {
      if (!App.stand.einst.offen) App.stand.treibstoff = Math.max(0, (App.stand.treibstoff || 0) - 1);
      const z = 1 + Math.floor(Math.random() * 2000000000);
      const eintrag = { z, name: App.planeten.name(z, App.stand.reisen.map((r) => r.name)), art };
      App.stand.reisen.push(eintrag);
      App.speichere();
      App.log(`Reise ${App.stand.reisen.length}: ${art === "insel" ? "Insel" : "Planet"} ${eintrag.name} (Bauzahl ${z}), volle Tanks übrig: ${App.stand.treibstoff}`);
      fliege(eintrag, true);
    },
  };

  /* ---------- Verstecke: Stellen, die sich nur mit einem Werkzeug öffnen ----------
   * Daten: „entdeckungen“ mit „werkzeug“ in inhalt/welt.js. Zu sehen sind sie erst, wenn die Figur das Werkzeug
   * hat, als kleines blinkendes Werkzeug-Zeichen. Jedes Versteck lässt sich einmal am Tag öffnen. */
  const heute = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
  App.verstecke = {
    // Zu sehen, wenn die Figur das Werkzeug hat (mit „Alle Orte offen“ auch ohne) und es heute noch nicht geöffnet wurde
    sichtbar: (f) => !!f.werkzeug && (!!App.stand.teile[f.werkzeug] || !!App.stand.einst.offen) && App.stand.entdeckt[f.id] !== heute(),
    werkzeugBild: (f) => B[BT().teile[f.werkzeug].bild](),
    armBild: (f) => B.arm(BT().teile[f.werkzeug].bild),   // Arm der Figur mit dem Werkzeug in der Hand
    // Geöffnet: für heute merken; ist das Gefundene ein Fundstück, kommt es in die Schatzkiste
    gefunden(f) {
      App.stand.entdeckt[f.id] = heute();
      const art = f.fund || (f.zeigt in App.stand.fund ? f.zeigt : null);
      if (art) App.stand.fund[art] = (App.stand.fund[art] || 0) + 1;
      App.speichere();
      App.log(`Versteck geöffnet: ${f.id} (${BT().teile[f.werkzeug].name})${art ? `, Fundstück ${art}` : ""}`);
      zeigeTruhenzahl();
    },
  };

  /* ---------- Schatzkiste ---------- */
  const fundAnzahl = () => Object.values(App.stand.fund).reduce((a, b) => a + (b || 0), 0);
  function zeigeTruhenzahl() { $("#truhe-zahl").textContent = String(fundAnzahl()); }

  function oeffneTruhe() {
    const n = fundAnzahl();
    const f = $("#feier");
    const reihen = Object.entries(App.stand.fund).filter(([art, z]) => z > 0 && B[art]).map(([art, z]) =>
      `<div class="truhe-reihe">${Array.from({ length: Math.min(z, 10) }, () => `<span>${B[art]()}</span>`).join("")}${z > 10 ? `<b>+${z - 10}</b>` : ""}</div>`).join("");
    // Zwei Reihen: die Schlüssel-Teile (mit den vollen Tanks) und darunter der Werkzeugkasten
    const gebaut = (liste) => liste.filter((id) => App.stand.teile[id]).map((id) => `<span>${B[BT().teile[id].bild]()}</span>`).join("");
    const teile = gebaut([...BT().reihenfolge, ...inselTeile()]), werkzeuge = gebaut(BT().werkzeuge);
    const tanks = Array.from({ length: Math.min(App.stand.treibstoff || 0, 6) }, () => `<span>${B.teilTreibstoff()}</span>`).join("");
    // Reisealbum: die zuletzt besuchten Planeten mit Namen. Antippen fliegt noch einmal hin (kostet nichts).
    const album = App.stand.reisen.slice(-12).map((r) => `<button class="album-ziel" data-z="${r.z}">${App.planeten.kleinBild(r.z, r.art)}<b>${r.name}</b></button>`).join("");
    f.innerHTML = `<div class="truhe-blick papier"><div class="truhe-kopf">${B.truhe()}</div>${teile || tanks ? `<div class="truhe-reihe truhe-teile">${teile}${tanks}</div>` : ""}${
      werkzeuge ? `<div class="truhe-reihe truhe-werkzeug">${werkzeuge}</div>` : ""}${
      reihen || (album ? "" : `<div class="truhe-leer"></div>`)}${album ? `<div class="album">${album}</div>` : ""}</div>`;
    f.classList.remove("aus");
    f.onclick = () => { f.classList.add("aus"); f.innerHTML = ""; App.still(); };
    $$(".album-ziel", f).forEach((k) => k.addEventListener("click", (ev) => {
      ev.stopPropagation();
      const eintrag = App.stand.reisen.find((r) => String(r.z) === k.dataset.z);
      if (eintrag) fliege(eintrag, false);
    }));
    App.sag(n === 0 ? "Deine Schatzkiste ist noch leer. Löse eine Aufgabe!" : n === 1 ? "Du hast schon ein Fundstück." : `Du hast schon ${n} Fundstücke.`);
  }

  /* ---------- Weltkarte: wächst mit den entdeckten Orten, Antippen springt dorthin ----------
   * Drei Bänder (Hintergrund B.karteGrund): oben das Weltall, in der Mitte Land und Meer, unten die Welt unter
   * Wasser. Die Zeile eines Ortes („karte“ in inhalt/welt.js) bestimmt sein Band: 0 = Weltall, 1 = Land,
   * 2 = unter Wasser. Jede Reiseart hat ihre eigene Linie:
   *   Landweg (sandfarben) · Weg unter Wasser (hell) · Tauchen (Luftblasen) · Rakete (gelbe Punkte) ·
   *   Fähre (gestrichelter Bogen durchs Meer, vom kleinen Schiff unter dem Hafen aus)
   * Im Meer liegen die besuchten kleinen Inseln und die Wolke „Neue Insel“, im Weltall die besuchten Planeten
   * und der „Neue Planet“. Antippen reist noch einmal hin; zu einem neuen Ziel bringt nur die Fähre (Seekarte)
   * oder die Rakete (Sternenkarte im Weltraum).
   * An einer Anlegestelle öffnet sich die Karte als Seekarte der Fähre (faehre = true): Wählbar sind dann alle
   * Orte mit Anlegestelle, auch noch unentdeckte (sie liegen unter einer Wolke).
   * Seit v0.26 ist die Karte breiter als der Bildschirm (zehn Spalten) und rollt seitlich: mit dem Finger wischen,
   * mit der Maus ziehen, am Mausrad drehen oder auf einen Pfeil am Rand tippen. Sie öffnet sich dort, wo die Figur
   * gerade ist. Zurück-Knopf, „ABC“, „123“ und die Pfeile bleiben beim Rollen stehen. Noch nicht gebaute Orte
   * („geplant“ in inhalt/welt.js) liegen als blasse Wolken an ihrem Platz. */
  // Raster der Karte: zehn Spalten; zeilen = oberer Rand der Kacheln in den Zeilen 0, 1 und 2 (dazwischen gleitend)
  // neueInsel = Platz der kleinen Wolke „Neue Insel“ im Meer (Pixel), inseln = Anfang der Reihe der besuchten Inseln
  // (die letzten inselZahl), planeten = Anfang der zwei Reihen der besuchten Planeten (die letzten planetZahl, fünf
  // je Reihe; sie enden vor dem „Neuen Planeten“), breite = Breite der ganzen Karte in Pixeln
  const KARTE = { x0: 56, dx: 188, b: 160, h: 120, spalten: 10, zeilen: [26, 308, 640], neueInsel: [784, 494], inseln: [882, 496], inselZahl: 9,
    neuerPlanet: [3, 0], planeten: [166, 16], planetZahl: 10 };
  KARTE.breite = 2 * KARTE.x0 + (KARTE.spalten - 1) * KARTE.dx + KARTE.b;   // 1964: links und rechts derselbe Rand wie früher
  const kartePlatz = ([spalte, zeile]) => {   // linke obere Ecke der Kachel
    const i = Math.max(0, Math.min(KARTE.zeilen.length - 2, Math.floor(zeile)));
    return [KARTE.x0 + spalte * KARTE.dx, Math.round(KARTE.zeilen[i] + (zeile - i) * (KARTE.zeilen[i + 1] - KARTE.zeilen[i]))];
  };
  const wackle = (el) => { el.classList.remove("wackel"); void el.offsetWidth; el.classList.add("wackel"); };
  function oeffneKarte(faehre = false) {
    const W = App.inhalt.welt, k = $("#karte");
    const allesOffen = !!App.stand.einst.offen;   // Elternbereich „Alle Orte offen“: auf der Karte ist alles aufgedeckt
    const haefen = Object.keys(W.orte).filter((id) => (W.orte[id].tore || []).some((t) => t.faehre));
    App.welt.halt();
    // An jedem besuchten Ort stehen seine Spiele als Zeichenpaar (Fach und Fundstück, freie Spiele als Dreieck).
    // Ein Tipp auf ein Zeichenpaar setzt die Figur neben dieses Spiel. Was der Krebs gerade noch braucht, ist
    // gelb hinterlegt. Die Knöpfe „ABC“ und „123“ am linken Rand heben die Spiele eines Fachs hervor.
    const gesucht = rezept(naechstesTeil()).filter((r) => r.da < r.soll).map((r) => r.art);
    // Zu einem Ort zählen auch die Spiele seiner Innenräume („gehoertZu“, z. B. der Leuchtturm am Hafen): Sie haben
    // keine eigene Kachel. Im Innenraum gilt die Figur auf der Karte als am Hauptort.
    // (Ein Innenraum mit eigener kleiner Kachel, „karteKlein“, zeigt seine Spiele dort selbst.)
    const ohneKachel = (x) => !!x && !!x.gehoertZu && !x.karte;
    const spieleVon = (id) => Object.entries(W.orte).filter(([oid, x]) => oid === id || (ohneKachel(x) && x.gehoertZu === id))
      .flatMap(([oid, x]) => (x.einstiege || []).map((e) => ({ e, ort: oid })));
    const hierOrt = ohneKachel(W.orte[App.stand.ort]) ? W.orte[App.stand.ort].gehoertZu : App.stand.ort;
    const spiele = (id) => (spieleVon(id).length ? `<span class="karte-spiele">${spieleVon(id).map(({ e, ort }) =>
      B.zeichen(e, ` f-${e.fach || "spiel"}${gesucht.includes(e.fund) ? " gesucht" : ""}`, ` data-spiel="${e.id}" data-in="${ort}"`)).join("")}</span>` : "");
    // Ein noch unentdeckter Spielplatz zeigt schon auf seiner Wolke das Werkzeug, das ihn öffnet
    const spielplatz = (o) => { const e = (o.einstiege || []).filter((x) => x.zeichen); return e.length ? `<span class="karte-spiele">${e.map((x) => B.zeichen(x, " f-spiel")).join("")}</span>` : ""; };
    const faecher = (id) => [...new Set(spieleVon(id).map(({ e }) => e.fach).filter(Boolean))].map((f) => ` hat-${f}`).join("");
    const mitte = (o) => { const [x, y] = kartePlatz(o.karte); return o.karteKlein ? [x + 56, y + 42] : [x + KARTE.b / 2, y + KARTE.h / 2]; };   // kleine Kachel: 112 × 84
    const unten = (karte) => { const [x, y] = kartePlatz(karte); return [x + KARTE.b / 2, y + KARTE.h]; };   // Mitte der Unterkante
    const band = (o) => Math.round(o.karte[1]);   // 0 = Weltall, 1 = Land und Meer, 2 = unter Wasser
    const gezeichnet = new Set();
    let wege = "", knoten = "";
    // Weg zwischen zwei Orten, jedes Paar nur einmal. Die Art der Linie ergibt sich aus den Bändern.
    const weg = (a, b) => {
      if (!a || !b || a === b || !a.karte || !b.karte) return;
      if (a.karteKlein || b.karteKlein) return;   // die kleine Kachel eines Innenraums hängt an ihrem Hauptort, ohne Linie
      const [x1, y1] = mitte(a), [x2, y2] = mitte(b);
      if (gezeichnet.has(`${x2} ${y2} ${x1} ${y1}`) || gezeichnet.has(`${x1} ${y1} ${x2} ${y2}`)) return;
      gezeichnet.add(`${x1} ${y1} ${x2} ${y2}`);
      const ba = band(a), bb = band(b);
      const art = ba === 0 || bb === 0 ? "rakete" : ba !== bb ? "tauchen" : ba === 2 ? "wasser" : "land";
      // Die Linie läuft von Kachelrand zu Kachelrand, damit unter einer blassen Kachel (Seekarte) nichts durchscheint
      const dx = x2 - x1, dy = y2 - y1;
      const t = Math.min(dx ? KARTE.b / 2 / Math.abs(dx) : 1, dy ? KARTE.h / 2 / Math.abs(dy) : 1);
      if (t >= 0.5) return;   // die Kacheln berühren sich
      wege += `<path class="w-${art}" d="M${Math.round(x1 + dx * t)} ${Math.round(y1 + dy * t)} L${Math.round(x2 - dx * t)} ${Math.round(y2 - dy * t)}"/>`;
    };
    for (const [id, o] of Object.entries(W.orte)) {
      if (!o.karte) continue;
      for (const z of Object.values(o.nachbarn || {})) weg(o, W.orte[z]);
      for (const t of o.tore || []) if (t.ziel && t.karteWeg !== false) weg(o, W.orte[t.ziel]);
      for (const e of o.einstiege || []) if (e.inhalt && e.inhalt.ziel) weg(o, W.orte[e.inhalt.ziel]);
      // „da“ = der Ort ist aufgedeckt: schon besucht, oder im Elternbereich ist „Alle Orte offen“ an (dann liegt
      // nichts mehr unter einer Wolke, und jeder Ort lässt sich gleich antippen)
      const [x, y] = kartePlatz(o.karte), da = allesOffen || !!App.stand.besucht[id];
      const art = !faehre ? "" : haefen.includes(id) && id !== hierOrt ? " ziel" : id === hierOrt ? "" : " matt";
      knoten += `<button class="karte-ort${o.karteKlein ? " innen" : ""}${da ? faecher(id) : " fremd"}${id === hierOrt ? " hier" : ""}${art}" data-ort="${id}" style="left:${x}px;top:${y}px" aria-label="${o.name}">${
        da ? B[o.bild]() + spiele(id) : B.wolke() + spielplatz(o)}${App.werkstatt.gesperrt(id) ? `<span class="schloss">${B.schloss()}</span>` : ""}</button>`;
    }
    // Geplante Orte: blasse Wolken an ihrem Platz. Sie lassen sich nicht betreten (siehe „geplant“ in inhalt/welt.js).
    for (const g of W.geplant || []) {
      const [x, y] = kartePlatz(g.karte);
      knoten += `<button class="karte-ort fremd geplant${faehre ? " matt" : ""}" data-geplant="${g.id}" style="left:${x}px;top:${y}px" aria-label="${g.name} (noch nicht gebaut)">${B.wolke()}</button>`;
    }
    // Fähre: Unter dem Hafen der Heimatbucht liegt ein kleines Schiff. Von dort führen gestrichelte Bögen durchs
    // Meer zu jeder anderen Anlegestelle und zur Wolke „Neue Insel“ (je weiter das Ziel, desto tiefer der Bogen).
    if (W.orte.hafen && W.orte.hafen.karte) {
      const [sx, hy] = unten(W.orte.hafen.karte), sy = hy + 24;
      const bogen = ([zx, zy]) => {
        // höchstens 80 tief, damit auch der Bogen zu einer fernen Insel über der Reihe der kleinen Inseln bleibt
        const x1 = sx + (zx < sx ? -30 : 30), tiefe = Math.min(80, 40 + Math.abs(zx - x1) * 0.15);
        wege += `<path class="w-faehre" d="M${x1} ${sy} Q${(x1 + zx) / 2} ${Math.round(sy + tiefe)} ${zx} ${zy + 4}"/>`;
      };
      for (const id of haefen) if (id !== "hafen" && W.orte[id].karte) bogen(unten(W.orte[id].karte));
      bogen([KARTE.neueInsel[0] + 2, KARTE.neueInsel[1] + 30]);   // zur kleinen Wolke: an ihren linken Rand
      knoten += `<span class="karte-schiff" style="left:${sx - 32}px;top:${sy - 22}px">${B.faehre()}</span>`;
    }
    // Kleine Inseln, im Meer rechts unter der Landzeile: Die kleine Wolke mit Fragezeichen führt zu einer neuen
    // Insel (nur mit der Fähre und einem vollen Tank). Rechts daneben liegen in einer Reihe die schon besuchten
    // Inseln; Antippen fährt wieder hin.
    const schloss = `<span class="schloss">${B.schloss()}</span>`;
    const [ix, iy] = KARTE.neueInsel;
    knoten += `<button class="karte-ort fremd klein${faehre ? " ziel" : ""}" data-neu="insel" style="left:${ix}px;top:${iy}px" aria-label="Neue Insel">${B.wolke()}<span class="karte-frage">?</span>${
      App.reise.fehlt() ? schloss : ""}</button>`;
    // Kleines Ziel (Insel oder Planet) mit Bild und Namen. „hier“ = dort ist die Figur gerade.
    const hier = (W.orte[App.stand.ort] || {}).name;
    const klein = (r, x, y) => {
      const insel = r.art === "insel", name = `${insel ? "Insel" : "Planet"} ${r.name}`;
      return `<button class="karte-insel${insel ? "" : " karte-planet"}${hier === name ? " hier" : ""}${faehre && !insel ? " matt" : ""}" data-z="${r.z}" style="left:${x}px;top:${y}px" aria-label="${name}">${
        App.planeten.kleinBild(r.z, r.art)}<b>${r.name}</b></button>`;
    };
    App.stand.reisen.filter((r) => r.art === "insel").slice(-KARTE.inselZahl).forEach((r, i) => { knoten += klein(r, KARTE.inseln[0] + i * 62, KARTE.inseln[1]); });
    // Weltall: links die zuletzt besuchten Planeten (zwei Reihen zu je fünf), daneben der „Neue Planet“. Er erscheint
    // erst, wenn der Weltraum entdeckt ist; ein Flugbogen verbindet ihn mit dem Weltraum (dort ist der Abflug).
    const planeten = App.reise.planeten();
    planeten.slice(-KARTE.planetZahl).forEach((r, i) => { knoten += klein(r, KARTE.planeten[0] + (i % 5) * 88, KARTE.planeten[1] + Math.floor(i / 5) * 84); });
    if (allesOffen || App.stand.besucht.weltraum || planeten.length) {
      const [px, py] = kartePlatz(KARTE.neuerPlanet);
      if (W.orte.weltraum && W.orte.weltraum.karte) {
        const [wx, wy] = kartePlatz(W.orte.weltraum.karte);
        wege += `<path class="w-rakete" d="M${wx} ${wy + 36} Q${(wx + px + KARTE.b) / 2} ${Math.min(wy, py) - 22} ${px + KARTE.b} ${py + 36}"/>`;
      }
      knoten += `<button class="karte-ort fremd${faehre ? " matt" : ""}" data-neu="planet" style="left:${px}px;top:${py}px" aria-label="Neuer Planet">${B.planetFremd()}<span class="karte-frage">?</span>${
        App.reise.fehlt() ? schloss : ""}</button>`;
    }
    // Fest über der rollenden Karte: der Zurück-Knopf, die Pfeile am Rand und (nicht auf der Seekarte) die zwei
    // Knöpfe „Spiele finden“ am linken Rand, einer je Fach
    let fest = `<button class="knopf karte-pfeil links aus" aria-label="Karte nach links rollen">${B.pfeil("links")}</button>
      <button class="knopf karte-pfeil rechts aus" aria-label="Karte nach rechts rollen">${B.pfeil("rechts")}</button>`;
    if (!faehre) {
      fest += `<button class="knopf karte-fach" data-fach="deutsch" style="top:98px" aria-label="Spiele mit Buchstaben zeigen">${B.fach("deutsch")}</button>
        <button class="knopf karte-fach" data-fach="mathe" style="top:182px" aria-label="Spiele mit Zahlen zeigen">${B.fach("mathe")}</button>`;
    }
    k.classList.remove("sterne", "zeig-deutsch", "zeig-mathe");
    k.innerHTML = `<div class="karte-rolle"><div class="karte-flaeche" style="width:${KARTE.breite}px"><div class="karte-grund">${B.karteGrund(KARTE.breite)}</div><svg class="karte-wege" viewBox="0 0 ${KARTE.breite} 768">${wege}</svg>${knoten}</div></div>${
      fest}<button class="knopf karte-zu" aria-label="Karte schließen">${B.zurueck()}</button>`;
    k.classList.remove("aus");
    const zu = () => { k.classList.add("aus"); k.classList.remove("zeig-deutsch", "zeig-mathe"); k.innerHTML = ""; k.onclick = null; };
    $(".karte-zu", k).addEventListener("click", () => { App.audio.klang("tipp"); zu(); });
    // Rollen: Mit dem Finger wischt man die Karte seitlich, das macht der Browser selbst (wie im Elternbereich).
    // Für die Maus gibt es Ziehen und das Mausrad. Die Pfeile am Rand sind nur zu sehen, wenn es in ihrer Richtung
    // weitergeht; ein Tipp rollt drei Spalten weiter. Liegt dort, außerhalb des Bildes, ein Ziel der Fähre oder ein
    // Spiel des gewählten Fachs, pulsiert der Pfeil gelb („ruft“).
    const rolle = $(".karte-rolle", k), weite = () => Math.max(0, rolle.scrollWidth - rolle.clientWidth);
    const mitteVon = (el) => el.offsetLeft + el.offsetWidth / 2;
    const pfeile = () => {
      if (!rolle.isConnected) return;   // die Karte ist schon zu (ein Roll-Ereignis kann noch nachkommen)
      const l = rolle.scrollLeft, r = l + rolle.clientWidth;
      const fach = k.classList.contains("zeig-deutsch") ? "deutsch" : k.classList.contains("zeig-mathe") ? "mathe" : "";
      const wichtig = (faehre ? $$(".karte-ort.ziel", rolle) : fach ? $$(`.karte-ort.hat-${fach}`, rolle) : []).map(mitteVon);
      const setze = (el, da, ruft) => { el.classList.toggle("aus", !da); el.classList.toggle("ruft", da && ruft); };
      setze($(".karte-pfeil.links", k), l > 4, wichtig.some((x) => x < l));
      setze($(".karte-pfeil.rechts", k), l < weite() - 4, wichtig.some((x) => x > r));
    };
    const rolleZu = (x, weich) => {
      const links = Math.max(0, Math.min(weite(), Math.round(x)));
      try { rolle.scrollTo({ left: links, behavior: weich ? "smooth" : "auto" }); } catch (e) { rolle.scrollLeft = links; }
    };
    // Am Anfang steht die Stelle in der Mitte, an der die Figur gerade ist (sonst der Strand)
    const hierEl = $(".hier", rolle) || $(`[data-ort="${W.start}"]`, rolle);
    if (hierEl) rolle.scrollLeft = Math.max(0, Math.min(weite(), Math.round(mitteVon(hierEl) - rolle.clientWidth / 2)));
    pfeile();
    rolle.addEventListener("scroll", pfeile, { passive: true });
    rolle.addEventListener("wheel", (ev) => { rolle.scrollLeft += ev.deltaX + ev.deltaY; ev.preventDefault(); }, { passive: false });
    $$(".karte-pfeil", k).forEach((el) => el.addEventListener("click", () => {
      App.audio.klang("tipp");
      rolleZu(rolle.scrollLeft + (el.classList.contains("links") ? -3 : 3) * KARTE.dx, true);
    }));
    // Ziehen mit der Maus. Erst ab acht Pixeln gilt es als Ziehen; der Klick danach zählt dann nicht als Tipp.
    let zug = null, gezogen = false;
    rolle.addEventListener("pointerdown", (ev) => {
      gezogen = false;   // jedes neue Drücken zählt wieder (der Zeitgeber unten kann in einem Fenster im Hintergrund trödeln)
      if (ev.pointerType !== "mouse" || ev.button !== 0) return;
      zug = { x: ev.clientX, links: rolle.scrollLeft, mass: 1024 / (rolle.getBoundingClientRect().width || 1024), weit: false };   // mass: die Bühne ist skaliert
    });
    rolle.addEventListener("pointermove", (ev) => {
      if (!zug) return;
      const d = (ev.clientX - zug.x) * zug.mass;
      if (!zug.weit && Math.abs(d) < 8) return;
      if (!zug.weit) { zug.weit = true; rolle.classList.add("zieht"); try { rolle.setPointerCapture(ev.pointerId); } catch (e) { /* ohne Fangen geht es auch */ } }
      rolle.scrollLeft = zug.links - d;
    });
    const zugEnde = () => {
      if (zug && zug.weit) { gezogen = true; setTimeout(() => { gezogen = false; }, 0); }
      zug = null;
      rolle.classList.remove("zieht");
    };
    rolle.addEventListener("pointerup", zugEnde);
    rolle.addEventListener("pointercancel", zugEnde);
    rolle.addEventListener("click", (ev) => { if (gezogen) { ev.stopPropagation(); ev.preventDefault(); } }, true);
    // Fach-Knopf: an = alle Orte ohne ein Spiel dieses Fachs werden blass. Wieder aus: noch einmal auf den Knopf
    // tippen oder irgendwo neben die Kacheln (ins Meer, in den Himmel).
    k.onclick = (ev) => {
      if (!k.classList.contains("zeig-deutsch") && !k.classList.contains("zeig-mathe")) return;
      if (ev.target.closest("button")) return;
      k.classList.remove("zeig-deutsch", "zeig-mathe");
      $$(".karte-fach", k).forEach((b) => b.classList.remove("an"));
      pfeile();
      App.audio.klang("tipp");
      App.still();
    };
    $$(".karte-fach", k).forEach((el) => el.addEventListener("click", () => {
      const fach = el.dataset.fach, an = !k.classList.contains(`zeig-${fach}`);
      k.classList.remove("zeig-deutsch", "zeig-mathe");
      $$(".karte-fach", k).forEach((b) => b.classList.toggle("an", an && b === el));
      App.audio.klang("tipp");
      if (!an) { pfeile(); App.still(); return; }
      k.classList.add(`zeig-${fach}`);
      pfeile();   // liegt ein Spiel dieses Fachs außerhalb des Bildes, pulsiert der Pfeil dorthin
      App.sag(fach === "deutsch" ? "Hier gibt es Spiele mit Buchstaben. Tippe eins an." : "Hier gibt es Spiele mit Zahlen. Tippe eins an.");
    }));
    $$(".karte-insel", k).forEach((el) => el.addEventListener("click", () => {
      const eintrag = App.stand.reisen.find((r) => String(r.z) === el.dataset.z);
      if (!eintrag) return;
      if (faehre && eintrag.art !== "insel") { wackle(el); App.sag("Dorthin fährt die Fähre nicht."); return; }
      App.audio.klang("neugierig");
      zu();
      fliege(eintrag, false);
    }));
    $$(".karte-ort", k).forEach((el) => el.addEventListener("click", (ev) => {
      const id = el.dataset.ort;
      // Auf ein Zeichenpaar getippt? Dann geht es an diesem Ort gleich neben das Spiel (nicht auf der Seekarte)
      const zeichen = faehre ? null : ev.target.closest("[data-spiel]");
      const eintrag = zeichen && spieleVon(id).find((s) => s.e.id === zeichen.dataset.spiel && s.ort === zeichen.dataset.in);
      const spiel = eintrag && eintrag.e, spielOrt = eintrag ? eintrag.ort : id;   // das Spiel kann in einem Innenraum liegen
      if (el.dataset.geplant) {   // noch nicht gebaut
        const g = (W.geplant || []).find((x) => x.id === el.dataset.geplant);
        wackle(el);
        App.sag(g && g.sag ? g.sag : "Dieser Ort wird noch gebaut.");
        return;
      }
      if (el.dataset.neu === "planet") {
        wackle(el);
        App.sag(faehre ? "Dorthin fährt die Fähre nicht." : "Zu einem neuen Planeten fliegt nur die Rakete. Der Abflug ist im Weltraum.");
        return;
      }
      if (el.dataset.neu) {
        if (!faehre) {
          el.classList.remove("wackel"); void el.offsetWidth; el.classList.add("wackel");
          App.sag("Zu einer neuen Insel fährt nur die Fähre. Sie liegt am Hafen.");
          return;
        }
        const tank = App.reise.fehlt();
        if (tank) { el.classList.remove("wackel"); void el.offsetWidth; el.classList.add("wackel"); App.werkstatt.sagSperre(tank); return; }
        zu();
        App.reise.starte("insel");
        return;
      }
      if (faehre && !el.classList.contains("ziel")) {
        if (id === hierOrt) return;
        el.classList.remove("wackel"); void el.offsetWidth; el.classList.add("wackel");
        App.sag("Dorthin fährt die Fähre nicht.");
        return;
      }
      if (!faehre && el.classList.contains("fremd")) {
        el.classList.remove("wackel"); void el.offsetWidth; el.classList.add("wackel");
        App.sag("Diesen Ort musst du erst entdecken.");
        return;
      }
      const fehlt = App.werkstatt.gesperrt(id);
      if (fehlt) {
        el.classList.remove("wackel"); void el.offsetWidth; el.classList.add("wackel");
        App.werkstatt.sagSperre(fehlt);
        return;
      }
      App.audio.klang("neugierig");
      zu();
      if (faehre) fahre(id);
      else if (spiel) {
        // Die Figur steht neben dem Spiel. Es startet erst, wenn das Kind das letzte Stück selbst hinfährt.
        App.log(`Karte: zum Spiel ${spiel.aufgabe} (${spielOrt})`);
        const titel = /[.?!]$/.test(spiel.titel) ? spiel.titel : `${spiel.titel}.`;
        App.welt.zeige(spielOrt, { rein: "tor", bei: spiel.id, ansage: `${spielOrt !== App.stand.ort ? `${W.orte[spielOrt].ansage} ` : ""}${titel}` });
      } else if (id !== App.stand.ort) App.welt.zeige(id, { rein: "tor", ansage: W.orte[id].ansage });   // aus einem Innenraum heraus geht es so auch zum Hauptort
    }));
    App.sag(faehre ? "Wohin soll die Fähre fahren? Tippe eine Insel an." : "Das ist deine Karte. Tippe an, wohin du möchtest.");
  }

  // Überfahrt mit der Fähre zu einer anderen Anlegestelle
  function fahre(id) {
    const o = App.inhalt.welt.orte[id], f = $("#feier");
    App.welt.halt();
    // Richtung der Überfahrt wie auf der Karte: Liegt das Ziel links vom Abfahrtsort, fährt die Fähre nach links
    const von = App.inhalt.welt.orte[App.stand.ort];
    const links = !!o.karte && (!von || !von.karte || o.karte[0] < von.karte[0]);
    f.innerHTML = `<div class="fahrt${links ? " links" : ""}">${B.meerBild()}<div class="fahrt-schiff">${B.faehre()}</div></div>`;
    f.onclick = null;
    f.classList.remove("aus");
    if (!MBot.verbunden()) App.audio.klang("neugierig");
    MBot.reaktion.neugierig();
    App.log(`Fähre: ${App.stand.ort} → ${id}`);
    App.sag(`Leinen los! Wir fahren ${o.nach || "weiter"}.`);
    setTimeout(() => {
      f.classList.add("aus"); f.innerHTML = "";
      App.welt.zeige(id, { rein: "tor", aus: "faehre", ansage: o.ansage });
      zeigeTruhenzahl();
    }, 3000);
  }
  App.faehre = { oeffne: () => oeffneKarte(true) };

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
  const RESET_TEXT = "Neu beginnen (Fortschritt dieses Spielers löschen)";
  const STUFEN = () => [
    ["mengenStufe", "Mengen (Fische)", App.inhalt.mengen.stufen],
    ["blitzStufe", "Blitzblick (Quallen)", App.inhalt.rechnen.blitz],
    ["plusStufe", "Plus (Sterne)", App.inhalt.rechnen.plus],
    ["mauerStufe", "Zahlenmauer (Baustelle)", App.inhalt.rechnen.mauer],
    ["reiheStufe", "Zahlenreihe", App.inhalt.rechnen.reihe],
    ["zugStufe", "Silbenzug (Bahnhof)", App.inhalt.zugStufen],
    ["strahlStufe", "Zahlenstrahl (Steg)", App.inhalt.rechnen.strahl],
    ["vergleichStufe", "Vergleichen (Münzen)", App.inhalt.rechnen.vergleichen],
    ["winkStufe", "Winken zählen", App.inhalt.rechnen.winken],
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
    const wer = App.spieler.aktiv();
    $("#e-stand").textContent = `Spieler: ${wer ? BILDNAME[wer.bild] || wer.bild : "niemand gewählt (Startbild)"}\nFundstücke: ${fundAnzahl()}${fund ? ` (${fund})` : ""}\nBauteile: ${alleTeile().filter((id) => st.teile[id]).map((id) => BT().teile[id].name).join(", ") || "noch keins"}${st.einst.offen ? " (alle Orte offen)" : ""}\nDer Krebs baut gerade: ${BT().teile[naechstesTeil()].name}${plaene().length > 1 ? ` (zur Wahl: ${plaene().map((id) => BT().teile[id].name).join(" oder ")})` : ""}\nVolle Tanks: ${st.treibstoff || 0} · Reisen: ${st.reisen.length}${st.reisen.length ? ` (${st.reisen.map((r) => r.name).join(", ")})` : ""}\n\n${bu}\n\nMengen: ${za || "noch nichts"}`;
  }

  // Liste der Spieler: wer gerade spielt, Fundstücke, Löschen (zweimal tippen)
  function zeigeSpieler() {
    const feld = $("#e-spieler");
    const liste = App.spieler.liste(), wer = App.spieler.aktiv();
    feld.innerHTML = "";
    if (!liste.length) feld.innerHTML = `<p class="e-hinweis">Noch kein Spieler. Auf dem Startbild ein Bild antippen.</p>`;
    for (const s of liste) {
      const reihe = document.createElement("div");
      reihe.className = "e-reihe";
      reihe.innerHTML = `<span class="e-spielerbild bild-${s.bild}">${B[s.bild]()}</span><span class="e-name">${BILDNAME[s.bild] || s.bild}${wer && wer.id === s.id ? " (spielt gerade)" : ""}</span><span>${s.funde} Fundstücke</span><button class="e-knopf">Spieler löschen</button>`;
      const k = $("button", reihe);
      k.addEventListener("click", () => {
        if (!k.dataset.sicher) { k.dataset.sicher = "1"; k.classList.add("e-rot"); k.textContent = "Wirklich löschen? Noch einmal tippen"; return; }
        const war = wer && wer.id === s.id;
        App.spieler.loesche(s.id);
        App.log(`Spieler gelöscht: ${BILDNAME[s.bild] || s.bild}`);
        if (war) { zumStartbild(); return; }
        zeigeSpieler();
      });
      feld.appendChild(reihe);
    }
    $("#e-wechseln").disabled = !wer;
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
    $("#e-klatschen").value = e.klatschen || "auto";
    $("#e-klatsch-schwelle").value = e.klatschSchwelle; $("#e-klatsch-schwelle-wert").textContent = e.klatschSchwelle;
    $("#e-klatsch-anzeige").textContent = "";
    $("#e-status").textContent = statusText;
    $("#e-kein-bt").classList.toggle("aus", MBot.kannBluetooth());
    $("#e-runden").value = String(e.runden);
    $("#e-preis").value = String(preis());
    $("#e-offen").checked = !!e.offen;
    fuelleStimmen();
    zeigeSpieler();
    zeigeBuchstaben();
    zeigeStufen();
    zeigeStand();
    zeigeProtokoll();
    App.beiProtokoll = zeigeProtokoll;
    $("#e-reset").textContent = RESET_TEXT;
    $("#e-reset").dataset.sicher = "";
    $("#e-reset").disabled = !App.spieler.aktiv();
    $("#eltern").classList.remove("aus");
    $(".e-inhalt").scrollTop = 0;
  }
  let weltNeu = false;   // Preis oder Sperren geändert: Die Welt wird beim Schließen neu gezeichnet
  function schliesseEltern() {
    App.beiProtokoll = null;
    $("#eltern").classList.add("aus");
    if (weltNeu && $("#buehne").dataset.modus === "welt") App.welt.zeige(App.stand.ort);
    weltNeu = false;
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

    // Klatschen erkennen: Quelle wählen, Empfindlichkeit einstellen, 10 Sekunden ausprobieren
    $("#e-klatschen").addEventListener("change", (ev) => { e.klatschen = ev.target.value; merke(); });
    $("#e-klatsch-schwelle").addEventListener("input", (ev) => { e.klatschSchwelle = +ev.target.value; $("#e-klatsch-schwelle-wert").textContent = e.klatschSchwelle; merke(); });
    $("#e-klatsch-test").addEventListener("click", async () => {
      const anzeige = $("#e-klatsch-anzeige");
      App.audio.entsperre();
      let n = 0;
      anzeige.textContent = "starte …";
      if (!(await App.klatschen.starte(() => { n++; }))) {
        anzeige.textContent = e.klatschen === "aus" ? "Bitte zuerst eine Quelle wählen." : "Geht hier leider nicht (siehe Protokoll). Das Tippen auf den Klatsch-Knopf funktioniert immer.";
        return;
      }
      const ende = Date.now() + 10000;
      const uhr = setInterval(() => {
        const balken = "█".repeat(Math.round(Math.min(1, App.klatschen.pegel) * 20)).padEnd(20, "░");
        anzeige.textContent = `Jetzt klatschen!  ${balken}  erkannt: ${n}`;
        if (Date.now() > ende || $("#eltern").classList.contains("aus")) { clearInterval(uhr); App.klatschen.stoppe(); anzeige.textContent = `Test beendet. Erkannt: ${n} mal.`; }
      }, 80);
    });

    $("#e-buchstaben-vorgabe").addEventListener("click", () => {
      App.stand.einst.buchstaben = null;
      App.speichere();
      zeigeBuchstaben();
    });

    $("#e-runden").addEventListener("change", (ev) => { e.runden = +ev.target.value; merke(); App.log(`Aufgaben pro Spiel: ${e.runden}`); });
    $("#e-wechseln").addEventListener("click", zumStartbild);
    $("#e-preis").addEventListener("change", (ev) => { e.preis = +ev.target.value; merke(); weltNeu = true; App.log(`Preis eines Bauteils: ${e.preis} + ${e.preis}`); });
    $("#e-offen").addEventListener("change", (ev) => { e.offen = ev.target.checked; merke(); weltNeu = true; zeigeStand(); App.log(`Alle Orte offen: ${e.offen ? "ja" : "nein"}`); });

    // Neu beginnen: Der Spielstand dieses Spielers wird gelöscht, es geht am Strand wieder los
    $("#e-reset").addEventListener("click", (ev) => {
      const k = ev.currentTarget;
      if (!k.dataset.sicher) { k.dataset.sicher = "1"; k.textContent = "Wirklich alles löschen? Noch einmal tippen"; return; }
      App.loescheFortschritt();
      k.dataset.sicher = ""; k.textContent = "Gelöscht";
      App.log("Fortschritt gelöscht, neu begonnen");
      zeigeSpieler(); zeigeStand(); zeigeStufen(); zeigeTruhenzahl();
      if ($("#buehne").dataset.modus === "welt") App.welt.zeige(App.inhalt.welt.start);
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

  /* ---------- Start: Wer spielt? Jeder Spieler hat ein Bild. ---------- */
  // waehlen = true zeigt die freien Bilder für einen neuen Spieler
  function zeigeStart(waehlen) {
    const feld = $("#start-spieler");
    const liste = App.spieler.liste(), frei = App.spieler.frei();
    if (!liste.length) waehlen = true;
    const kachel = (klasse, bild, attr) => `<button class="spieler ${klasse} bild-${bild}" ${attr}>${B[bild]()}</button>`;
    feld.innerHTML = waehlen
      ? frei.map((b) => kachel("frei", b, `data-bild="${b}" aria-label="Neuer Spieler: ${BILDNAME[b]}"`)).join("")
        + (liste.length ? `<button class="spieler klein" data-zurueck="1" aria-label="Zurück">${B.zurueck()}</button>` : "")
      : liste.map((s) => kachel("", s.bild, `data-id="${s.id}" aria-label="Spieler ${BILDNAME[s.bild]}"`)).join("")
        + (frei.length ? `<button class="spieler klein" data-neu="1" aria-label="Neuer Spieler">+</button>` : "");
    feld.classList.toggle("wahl", !!waehlen);
    $("#start").dataset.schritt = "wahl";
    $$(".spieler", feld).forEach((k) => k.addEventListener("click", () => {
      App.audio.entsperre();
      if (k.dataset.neu) { App.audio.klang("tipp"); zeigeStart(true); App.sag("Wähle dein Bild."); return; }
      if (k.dataset.zurueck) { App.audio.klang("tipp"); zeigeStart(false); return; }
      if (k.dataset.bild) { if (!App.spieler.neu(k.dataset.bild)) return; App.log(`Neuer Spieler: ${BILDNAME[k.dataset.bild]}`); }
      else if (!App.spieler.waehle(k.dataset.id)) return;
      los();
    }));
  }

  // Ansage zur Spielerwahl. Die Stimme darf erst nach einer Berührung sprechen, deshalb zeigt das Startbild
  // zuerst nur den Start-Knopf; nach dem Tippen erscheinen die Bilder und die Ansage kommt.
  function sagStart() {
    App.sag(App.spieler.liste().length ? "Wer spielt? Tippe auf dein Bild." : "Hallo! Such dir ein Bild aus.");
  }

  // Los geht es immer am Strand
  function los() {
    App.audio.entsperre();
    App.ladeStimmen();
    const wer = App.spieler.aktiv();
    App.log(`Spieler: ${wer ? BILDNAME[wer.bild] : "?"}, Aufgaben pro Spiel: ${App.stand.einst.runden}`);
    $("#start").classList.add("aus");
    zeigeModus("welt");
    const gruss = fertigePlaene().length ? "Hallo! Der Krebs kann jetzt etwas bauen. Fahr zu ihm!"
      : Object.keys(App.stand.teile).length ? "Hallo! Zeig mit dem Finger, wohin ich fahren soll."
      : "Hallo! Zeig mit dem Finger, wohin ich fahren soll. Der Krebs am Felsen will mir etwas bauen.";
    App.welt.zeige(App.inhalt.welt.start, { ansage: gruss });
    zeigeTruhenzahl();
  }

  // Zurück zum Startbild (Spieler wechseln)
  function zumStartbild() {
    schliesseEltern();
    App.welt.halt();
    App.still();
    MBot.reaktion.ruhe();
    App.spieler.abmelden();
    roverZeige("");
    $("#start").classList.remove("aus");
    zeigeModus("start");
    zeigeStart(false);
    zeigeTruhenzahl();
    sagStart();
  }

  function init() {
    skaliere();
    window.addEventListener("resize", skaliere);
    window.addEventListener("orientationchange", () => setTimeout(skaliere, 200));
    for (const n of ["gesturestart", "dblclick", "contextmenu"]) document.addEventListener(n, (ev) => ev.preventDefault());

    // Bilder für die festen Knöpfe
    $("#start-rover").innerHTML = B.rover();
    $("#btn-truhe").insertAdjacentHTML("afterbegin", B.truhe());
    $("#btn-karte").innerHTML = B.karte();
    $("#btn-funk").innerHTML = B.funkKrebs();
    $("#btn-zurueck").innerHTML = B.zurueck();
    $("#btn-nochmal").innerHTML = B.lautsprecher();
    $("#btn-robo").insertAdjacentHTML("afterbegin", B.rover());
    $("#eltern-zahnrad").innerHTML = B.zahnrad();
    $("#version").textContent = `v${App.VERSION}`;
    $$(".e-version").forEach((el) => { el.textContent = `App v${App.VERSION} · mbot.js v${MBot.VERSION}`; });

    // Startbild: erst der Start-Knopf, dann die Bilder der Spieler mit Ansage.
    // Tippen neben die Bilder (z. B. auf die Figur) wiederholt die Ansage.
    $("#btn-los").innerHTML = B.spielen();
    $("#btn-los").addEventListener("click", (ev) => {
      ev.stopPropagation();
      App.audio.entsperre();
      App.ladeStimmen();
      App.audio.klang("tipp");
      zeigeStart(false);
      sagStart();
    });
    $("#start").addEventListener("click", (ev) => {
      if ($("#start").dataset.schritt !== "wahl" || ev.target.closest(".spieler")) return;
      App.audio.entsperre();
      sagStart();
    });
    $("#btn-truhe").addEventListener("click", () => { App.audio.klang("tipp"); schliesseFunk(); oeffneTruhe(); });
    $("#btn-karte").addEventListener("click", () => { App.audio.klang("tipp"); schliesseFunk(); oeffneKarte(); });
    $("#btn-funk").addEventListener("click", () => { App.audio.klang("tipp"); oeffneFunk(); });
    $("#welt").addEventListener("pointerdown", schliesseFunk);   // die Figur fährt weiter: Die Liste des Funk-Krebses geht zu
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
