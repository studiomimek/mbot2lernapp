/* inhalt/welt.js – die Welt als Daten
 *
 * NEUER ORT?
 *   1. Bild in js/bilder.js zeichnen (Funktion mit dem Namen aus „bild“).
 *   2. Hier einen Eintrag in „orte“ anlegen und bei einem Nachbarn unter „nachbarn“ (oder als Tor) eintragen.
 *   3. „karte“ setzen, damit der Ort auf der Weltkarte erscheint.
 *
 * Ein Ort hat:
 *   bild      Name der Bildfunktion in js/bilder.js
 *   ansage    wird beim Betreten gesprochen
 *   licht     Farbe, in der der Roboter an diesem Ort leuchtet [rot, grün, blau]
 *   karte     Platz auf der Weltkarte [Spalte, Zeile]. Die Zeile bestimmt das Band: 0 = Weltall, 1 = Land und Meer,
 *             2 = unter Wasser. Zwischenwerte sind erlaubt (die Rakete steht mit 0.18 über der Station).
 *             Spalten 0 bis 9: Die Karte ist seit v0.26 breiter als der Bildschirm und rollt seitlich (KARTE in
 *             js/app.js). Frei gehalten ist [3, 0] für den „Neuen Planeten“, links davon liegen die besuchten
 *             Planeten. Die Wolke „Neue Insel“ liegt im Meer unter der Landzeile, vor der Reihe der besuchten
 *             kleinen Inseln. Plätze für noch nicht gebaute Orte stehen unten in „geplant“.
 *   rover     Platz der Spielfigur beim ersten Betreten (Bühne ist 1024 × 768)
 *   boden     höchste Stelle, bis zu der die Figur fahren darf (y-Wert; darüber sind Himmel, Meer oder Gebäude)
 *   nachbarn  oben / unten / links / rechts → Nachbarort; er geht auf, wenn die Figur an diesen Rand fährt
 *   einstiege Figuren, die zu einer Aufgabe führen. Die Aufgabe startet, wenn die Spielfigur darauf stehen bleibt.
 *             aufgabe = Modul in js/aufgaben/, figur = Bild, x/y = Mitte, fund = Fundstück als Belohnung,
 *             fach = "deutsch" oder "mathe". Am Spiel, auf der Karte und beim Krebs steht das Zeichenpaar aus
 *             Fach (ABC oder 123) und Fundstück. Ohne „fach“ ist es ein freies Spiel (Zeichen: Dreieck).
 *             zeichen = Name einer Bildfunktion, die statt des Fach-Zeichens steht. So trägt ein Spielplatz das
 *             Werkzeug, das ihn öffnet (Buddelinsel: "teilSchaufel").
 *   tore      Durchgänge zu Orten, die nicht nebenan liegen: figur = Bild, x/y = Mitte, r = Umkreis, ziel = Ort
 *             „karteWeg: false“ = auf der Weltkarte keine Linie für dieses Tor zeichnen (Landung aus dem Weltraum).
 *             Statt „ziel“ kann „reise: true“ stehen: Abflug zu den Planeten. Das Tor öffnet die Sternenkarte
 *             (besuchte Planeten und ein neuer; der neue braucht Treibstoff)
 *             oder „faehre: true“: Anlegestelle der Fähre. Sie öffnet die Seekarte; alle Orte mit Anlegestelle
 *             sind dort als Ziel wählbar. „nach“ am Ort ist die Wortform für die Ansage („zur Pirateninsel“).
 *   treffen   Figuren, die reagieren, wenn die Spielfigur kommt: x/y, r, breite, bild (fertiges SVG), sag
 *   male      Funktion, die das Bild liefert (statt „bild“); so entstehen die Planeten in js/planeten.js
 *   braucht   Bauteil, das die Figur haben muss, um diesen Ort zu betreten (Name aus inhalt/bauteile.js).
 *             Ohne „braucht“ ist der Ort offen. Im Elternbereich lassen sich alle Sperren abschalten.
 *             Ein Schlüssel-Teil öffnet einen Ort mit Lernspiel, ein Werkzeug einen Spielplatz (freies Spiel ohne
 *             Richtig und Falsch, ohne Fundstück; die Fähre dorthin kostet keinen Treibstoff).
 *   anbau     Bauteil, das an diesem Ort an der Figur zu sehen ist (nur wenn sie es schon hat)
 *   werkstatt Platz des Krebs-Mechanikers: x/y = Mitte, breite, figur = Bild. Er baut die Bauteile.
 *   blasen    true = unter Wasser: Beim Fahren steigen Luftblasen auf. duesen: true = im Weltraum: Beim Fahren
 *             stoßen kleine Düsen Luft aus, entgegen der Fahrtrichtung.
 *   spur      Farbe der Fahrspuren, die die Figur hinterlässt (Sand, Staub). Ohne „spur“ gibt es keine Spuren.
 *   entdeckungen  Verstecke: Stellen, die sich mit einem Werkzeug öffnen (seit v0.17). „werkzeug“ = Bauteil aus
 *             inhalt/bauteile.js (schaufel, greifarm, fernrohr). Zu sehen sind sie erst, wenn die Figur das
 *             Werkzeug hat, und jedes nur einmal am Tag. Stelle x/y mit Umkreis r, Bild „zeigt“ an der Stelle
 *             „bei“, Satz „sag“. Ist „zeigt“ ein Fundstück, kommt es in die Schatzkiste (oder „fund“ nennt eins).
 *             Einträge ohne „werkzeug“ werden nicht angezeigt.
 *   gehoertZu Innenraum eines anderen Ortes (z. B. der Leuchtturm am Hafen). Mit „karte“ und „karteKlein: true“
 *             bekommt er eine kleine Kachel, die an der Kachel des Hauptortes hängt (Spalte und Zeile dürfen
 *             Bruchzahlen sein). Ohne „karte“ stehen seine Spiele auf der Kachel des Hauptortes, und die Figur
 *             gilt auf der Karte als dort.
 *   Ein Tor mit „leuchtet: true“ bekommt einen großen gelben Schein (für Türen, die im Bild klein sind).
 *   bald      true = Ort ist noch nicht gebaut
 *
 * Zonen (Einstiege, Tore, Werkstatt) sollen sich nicht überlappen.
 */
"use strict";

App.inhalt.welt = {
  start: "strand",
  orte: {
    strand: {
      name: "Strand", bild: "strand", ansage: "Am Strand.", licht: [255, 150, 0], karte: [2, 1],
      rover: { x: 512, y: 470 }, boden: 360, spur: "rgba(170, 128, 70, .7)",
      nachbarn: { unten: "riff", rechts: "hafen" },
      werkstatt: { x: 904, y: 440, breite: 150, figur: "figurMechaniker" },   // am Felsen
      einstiege: [
        { id: "krebse", titel: "Laute hören", aufgabe: "laut-finden", figur: "figurKrebse", fach: "deutsch",
          x: 290, y: 566, breite: 230, fund: "muschel", inhalt: { runden: 5 } },
        { id: "sandspur", titel: "Buchstaben spuren", aufgabe: "nachspuren", figur: "figurSandspur", fach: "deutsch",
          x: 730, y: 500, breite: 236, fund: "seestern", inhalt: { runden: 4 } },
      ],
      entdeckungen: [
        { id: "kokosnuss", werkzeug: "greifarm", x: 180, y: 402, r: 44, zeigt: "kokosnuss", bei: { x: 156, y: 330 }, breite: 70, sag: "Plumps! Eine Kokosnuss." },
        { id: "felsenkrebs", x: 870, y: 420, r: 44, zeigt: "krebs", bei: { x: 928, y: 352 }, breite: 96, sag: "Hallo, kleiner Krebs!" },
        { id: "sandmuschel", werkzeug: "schaufel", x: 450, y: 676, r: 44, zeigt: "muschel", bei: { x: 450, y: 640 }, breite: 70, sag: "Eine Muschel im Sand!" },
        { id: "sandburg", werkzeug: "schaufel", x: 560, y: 408, r: 40, zeigt: "muenze", bei: { x: 560, y: 300 }, breite: 70, sag: "In der Sandburg ist eine Münze versteckt!" },
      ],
    },
    riff: {
      name: "Riff", bild: "riff", ansage: "Im Riff.", licht: [0, 90, 255], karte: [2, 2],
      rover: { x: 512, y: 220 }, boden: 60,
      braucht: "propeller", anbau: "propeller", blasen: true,   // blasen: beim Fahren steigen Luftblasen auf
      nachbarn: { oben: "strand", links: "wrack", rechts: "quallengarten" },
      einstiege: [
        { id: "schwarm", titel: "Fische zählen", aufgabe: "mengen", figur: "figurSchwarm", fach: "mathe",
          x: 400, y: 420, breite: 260, fund: "perle", inhalt: { runden: 5 } },
      ],
      entdeckungen: [
        { id: "korallenfisch", werkzeug: "fernrohr", x: 916, y: 630, r: 54, zeigt: "fisch", farbe: "#f9c23c", bei: { x: 900, y: 556 }, breite: 100, sag: "Ein Fisch hat sich versteckt!" },
        { id: "wrackperle", werkzeug: "greifarm", x: 210, y: 440, r: 60, zeigt: "perle", bei: { x: 200, y: 380 }, breite: 84, sag: "Da hinten liegt ein altes Schiff. Und davor eine Perle!" },
        { id: "steinstern", werkzeug: "schaufel", x: 574, y: 680, r: 48, zeigt: "seestern", bei: { x: 574, y: 644 }, breite: 78, sag: "Ein Seestern!" },
      ],
    },
    // Hafen der Heimatbucht: Von hier fährt die Fähre zu den anderen Inseln
    hafen: {
      name: "Hafen", bild: "hafen", ansage: "Am Hafen. Hier legt die Fähre ab.", nach: "zum Hafen", licht: [255, 200, 60], karte: [3, 1],
      rover: { x: 430, y: 620 }, boden: 446, spur: "rgba(170, 128, 70, .7)",
      nachbarn: { links: "strand" },
      tore: [
        { id: "faehre", x: 560, y: 382, r: 66, figur: "figurFaehre", breite: 250, faehre: true },
        { id: "turmtuer", x: 187, y: 420, r: 70, figur: "figurTuer", breite: 70, ziel: "leuchtturm", leuchtet: true },   // die Tür unten im Leuchtturm (großer Umkreis: auch ein Tipp knapp darunter führt hinein)
      ],
      einstiege: [
        // Die Zahlenreihe ist seit v0.23 im Leuchtturm (Ort „leuchtturm“). Hier bleibt der Zahlenstrahl.
        // Der Steg im Bild ist der Zahlenstrahl; der Einstieg ist der Platz davor
        { id: "steg", titel: "Zahlenstrahl", aufgabe: "zahlenstrahl", figur: "figurStandplatz", fach: "mathe",
          x: 765, y: 530, breite: 170, fund: "boje", inhalt: { runden: 5 } },
      ],
    },
    // Im Leuchtturm (Innenraum des Hafens, durch die Tür im Turm). Auf der Karte hat er eine kleine Kachel,
    // die am Hafen hängt („karteKlein“).
    leuchtturm: {
      name: "Im Leuchtturm", bild: "leuchtturmInnen", ansage: "Im Leuchtturm.", licht: [255, 210, 110], gehoertZu: "hafen",
      karte: [3.36, 0.74], karteKlein: true,   // kleine Kachel, sie sitzt oben rechts auf der Kachel des Hafens
      rover: { x: 400, y: 650 }, boden: 540,
      nachbarn: {},
      tore: [
        { id: "ausgang", x: 150, y: 610, r: 50, figur: "figurTuer", breite: 100, ziel: "hafen", ansage: "Wieder draußen am Hafen." },
      ],
      einstiege: [
        // Die Zahlen stehen auf Treppenstufen (treppe: true); am Ende geht oben die Lampe an
        { id: "reihe", titel: "Zahlenreihe", aufgabe: "reihe", figur: "figurTreppe", fach: "mathe",
          x: 660, y: 620, breite: 230, fund: "anker", inhalt: { runden: 5, ende: "leuchtturm", hintergrund: "turmNah", treppe: true } },
      ],
    },
    // Raketeninsel: nur mit der Fähre zu erreichen
    raketenstation: {
      // Die große Rakete im Bild wächst mit dem Baufortschritt (Sterne aus dem Silbenspiel, Planeten aus Plus)
      male: () => App.bilder.station(App.werkstatt.raketenbau()),
      name: "Raketenstation", bild: "station", ansage: "An der Raketenstation.", nach: "zur Raketeninsel", licht: [150, 60, 255], karte: [4, 1],
      rover: { x: 620, y: 560 }, boden: 380, spur: "rgba(92, 98, 138, .6)",
      braucht: "lampe", anbau: "lampe",
      nachbarn: {},
      tore: [
        { id: "raketentuer", x: 560, y: 410, r: 44, figur: "figurTuer", breite: 96, ziel: "rakete" },
        // die Tür im Kuppelbau links; der Umkreis ist groß, damit auch ein Tipp knapp unter die Tür hineinführt
        { id: "hallentor", x: 160, y: 318, r: 86, figur: "figurTuer", breite: 70, ziel: "halle", leuchtet: true },
        // Anlegestelle unten links: Dort hat das Bild ein Stück Meer und einen Steg. „ankunft“ = Platz an Land.
        { id: "faehre", x: 144, y: 672, r: 118, figur: "figurFaehre", breite: 210, faehre: true, ankunft: { x: 290, y: 590 } },
      ],
      einstiege: [
        { id: "silben", titel: "Silben klatschen", aufgabe: "silben", figur: "figurSilben", fach: "deutsch",
          x: 800, y: 560, breite: 190, fund: "stern", inhalt: { runden: 5 } },   // rechts, links liegt die Anlegestelle
        { id: "plus", titel: "Plus rechnen", aufgabe: "plus", figur: "figurPlus", fach: "mathe",
          x: 400, y: 660, breite: 190, fund: "planet", inhalt: { runden: 5 } },
      ],
      entdeckungen: [
        { id: "sternschnuppe", x: 90, y: 700, r: 44, zeigt: "stern", bei: { x: 330, y: 150 }, breite: 90, sag: "Eine Sternschnuppe! Wünsch dir was." },
        { id: "funksignal", werkzeug: "fernrohr", x: 900, y: 410, r: 46, zeigt: "funk", bei: { x: 912, y: 120 }, breite: 120, sag: "Piep, piep! Ein Funksignal aus dem All." },
      ],
    },
    // Raketenhalle (Innenraum der Raketenstation, durch die Tür im Kuppelbau): das Extraspiel „Raketen bauen“.
    // Ein freies Spiel ohne Fundstück, offen, sobald man auf der Raketeninsel ist.
    halle: {
      name: "Raketenhalle", bild: "halle", ansage: "In der Raketenhalle.", licht: [255, 130, 40], gehoertZu: "raketenstation",
      karte: [4.5, 0.74], karteKlein: true,   // kleine Kachel oben rechts auf der Kachel der Raketenstation (rechts neben der Linie zur Rakete)
      rover: { x: 400, y: 650 }, boden: 540,
      nachbarn: {},
      tore: [
        { id: "ausgang", x: 150, y: 610, r: 50, figur: "figurTuer", breite: 100, ziel: "raketenstation", ansage: "Wieder draußen an der Raketenstation." },
      ],
      einstiege: [
        { id: "raketenbau", titel: "Raketen bauen", aufgabe: "raketenbau", figur: "figurRaketenbau",
          x: 660, y: 600, breite: 250, inhalt: {} },
      ],
    },
    rakete: {
      name: "In der Rakete", bild: "cockpit", ansage: "In der Rakete.", licht: [255, 255, 255], karte: [4, 0.18],
      rover: { x: 630, y: 690 }, boden: 520,
      braucht: "triebwerk",
      nachbarn: { rechts: "weltraum" },   // am rechten Rand startet der Countdown (das Spiel mit inhalt.ziel = "weltraum")
      tore: [
        { id: "ausstieg", x: 120, y: 600, r: 50, figur: "figurTuer", breite: 100, ziel: "raketenstation", ansage: "Wieder draußen an der Raketenstation." },
      ],
      einstiege: [
        // Das große Pult im Bild ist der Bordcomputer; der Einstieg ist nur der Platz davor
        { id: "bordcomputer", titel: "Bordcomputer", aufgabe: "bordcomputer", figur: "figurStandplatz", fach: "deutsch",
          x: 512, y: 590, breite: 190, fund: "zahnrad", inhalt: { runden: 5 } },
        { id: "startknopf", titel: "Countdown und Start", aufgabe: "countdown", figur: "figurStartknopf",
          x: 810, y: 610, breite: 190, inhalt: { ziel: "weltraum" } },
      ],
      entdeckungen: [
        { id: "fensterplanet", werkzeug: "fernrohr", x: 290, y: 706, r: 40, zeigt: "planet", bei: { x: 512, y: 180 }, breite: 120, sag: "Im Fenster leuchtet ein Planet." },
      ],
    },
    weltraum: {
      name: "Weltraum", bild: "weltraum", ansage: "Im Weltraum.", licht: [80, 0, 255], karte: [5, 0],   // rechts von der Rakete, wie beim Fahren
      rover: { x: 480, y: 600 }, boden: 110, duesen: true,   // duesen: beim Fahren stoßen kleine Düsen Luft aus
      nachbarn: { links: "rakete" },
      tore: [
        { id: "landung", x: 150, y: 590, r: 56, figur: "figurLandung", breite: 96, ziel: "raketenstation", karteWeg: false, ansage: "Gelandet! Zurück an der Raketenstation." },
        // Abflug zu den Planeten: öffnet die Sternenkarte. Ein neuer Planet braucht einen vollen Tank vom Krebs
        // (reise: true, siehe App.reise in js/app.js)
        { id: "planetenflug", x: 862, y: 628, r: 60, figur: "figurPlanetenflug", breite: 84, reise: true },   // auf dem großen Planeten im Bild
      ],
      einstiege: [
        { id: "satellit", titel: "Winken zählen", aufgabe: "winken", figur: "figurSatellit", fach: "mathe",
          x: 640, y: 360, breite: 210, fund: "komet", inhalt: { runden: 5 } },
      ],
      entdeckungen: [
        { id: "komet", werkzeug: "fernrohr", x: 356, y: 330, r: 48, zeigt: "stern", bei: { x: 356, y: 250 }, breite: 90, sag: "Ein Komet saust vorbei!" },
        { id: "erde", werkzeug: "fernrohr", x: 180, y: 300, r: 46, zeigt: "funk", bei: { x: 262, y: 140 }, breite: 100, sag: "Die Erde funkt: Hallo, kleiner Roboter!" },
        { id: "ringplanet", x: 770, y: 560, r: 54, zeigt: "planet", bei: { x: 770, y: 470 }, breite: 100, sag: "Ein Planet mit Ringen!" },
      ],
    },
    pirateninsel: {
      name: "Pirateninsel", bild: "pirateninsel", ansage: "Auf der Pirateninsel.", licht: [255, 60, 0], karte: [1, 1],
      rover: { x: 470, y: 500 }, boden: 390, spur: "rgba(170, 128, 70, .7)",
      braucht: "kompass", nach: "zur Pirateninsel",
      nachbarn: { unten: "wrack" },
      tore: [
        { id: "faehre", x: 330, y: 306, r: 100, figur: "figurFaehre", breite: 220, faehre: true },   // im Meer vor dem Strand
      ],
      einstiege: [
        { id: "steuern", titel: "Roboter steuern", aufgabe: "steuern", figur: "figurSteuerrad",
          x: 300, y: 560, breite: 170, inhalt: {} },
        { id: "papagei", titel: "Was fängt an wie …?", aufgabe: "anlaut-bilder", figur: "figurPapagei", fach: "deutsch",
          x: 640, y: 540, breite: 170, fund: "feder", inhalt: { runden: 5 } },
      ],
      entdeckungen: [
        { id: "fasskrebs", werkzeug: "greifarm", x: 150, y: 690, r: 44, zeigt: "krebs", bei: { x: 150, y: 590 }, breite: 96, sag: "Im Fass wohnt ein Krebs!" },
        { id: "schatzkreuz", werkzeug: "schaufel", x: 758, y: 680, r: 46, zeigt: "muenze", bei: { x: 758, y: 640 }, breite: 80, sag: "Hier ist ein Schatz vergraben. Eine Goldmünze!" },
        { id: "schatzkiste", werkzeug: "greifarm", x: 904, y: 470, r: 44, zeigt: "perle", bei: { x: 904, y: 380 }, breite: 80, sag: "In der Schatzkiste glänzt eine Perle!" },
      ],
    },
    // Unter Wasser rechts vom Riff: der Quallengarten, dahinter die Schildkrötenwiese (beide seit v0.23)
    quallengarten: {
      name: "Quallengarten", bild: "quallengarten", ansage: "Im Quallengarten.", licht: [170, 80, 255], karte: [3, 2],
      rover: { x: 220, y: 420 }, boden: 60,
      braucht: "propeller", anbau: "propeller", blasen: true,
      nachbarn: { links: "riff", rechts: "schildkroetenwiese" },
      einstiege: [
        { id: "quallen", titel: "Blitzblick", aufgabe: "blitzblick", figur: "figurQuallen", fach: "mathe",
          x: 560, y: 400, breite: 260, fund: "schnecke", inhalt: { runden: 5 } },
      ],
    },
    schildkroetenwiese: {
      name: "Schildkrötenwiese", bild: "schildkroetenwiese", ansage: "Auf der Schildkrötenwiese.", licht: [60, 220, 130], karte: [4, 2],
      rover: { x: 220, y: 400 }, boden: 60,
      braucht: "propeller", anbau: "propeller", blasen: true,
      nachbarn: { links: "quallengarten" },
      einstiege: [
        // Die Schildkröte hütet Münzen aus dem Wrack: das Spiel „Mehr oder weniger“, hier mit eigenem Hintergrund
        { id: "muenzen", titel: "Mehr oder weniger", aufgabe: "vergleichen", figur: "figurSchildkroete", fach: "mathe",
          x: 620, y: 500, breite: 250, fund: "muenze", inhalt: { runden: 5, hintergrund: "wieseNah" } },
      ],
    },
    // Spielplatz der Schaufel: nur mit der Fähre zu erreichen. Im Sandplatz wird frei gegraben und gebaut
    // (js/aufgaben/buddeln.js); was dort entsteht, bleibt liegen.
    buddelinsel: {
      name: "Buddelinsel", bild: "buddelinsel", ansage: "Auf der Buddelinsel.", nach: "zur Buddelinsel", licht: [255, 190, 60], karte: [5, 1],
      rover: { x: 430, y: 610 }, boden: 400, spur: "rgba(170, 128, 70, .7)",
      braucht: "schaufel",
      nachbarn: {},
      tore: [
        { id: "faehre", x: 176, y: 322, r: 100, figur: "figurFaehre", breite: 220, faehre: true },   // im Meer vor dem Strand
      ],
      einstiege: [
        { id: "sandplatz", titel: "Im Sand buddeln", aufgabe: "buddeln", figur: "figurSandplatz", zeichen: "teilSchaufel",
          x: 600, y: 540, breite: 300, inhalt: {} },
      ],
    },
    // Spielplatz der Farbreifen (seit v0.27): helle Insel mit dem Malplatz. Nur mit der Fähre zu erreichen.
    malinsel: {
      name: "Malinsel", bild: "malinsel", ansage: "Auf der Malinsel.", nach: "zur Malinsel", licht: [255, 90, 160], karte: [6, 1],
      rover: { x: 430, y: 610 }, boden: 400, spur: "rgba(47, 127, 214, .6)",
      braucht: "farbreifen",
      nachbarn: {},
      tore: [
        { id: "faehre", x: 176, y: 322, r: 100, figur: "figurFaehre", breite: 220, faehre: true },   // im Meer vor dem Strand
      ],
      einstiege: [
        { id: "malplatz", titel: "Mit Reifen malen", aufgabe: "malen", figur: "figurMalplatz", zeichen: "teilFarbreifen",
          x: 600, y: 540, breite: 300, inhalt: {} },
      ],
    },
    // Erster Ort der neuen Insel (seit v0.28): der Bahnhof. Nur mit der Fähre zu erreichen. Rechts geht es zur
    // Baustelle weiter (seit v0.29), von dort später zum Dschungel (noch nicht gebaut, siehe „geplant“).
    bahnhof: {
      name: "Bahnhof", bild: "bahnhof", ansage: "Am Bahnhof.", nach: "zum Bahnhof", licht: [255, 60, 30], karte: [7, 1],
      rover: { x: 400, y: 650 }, boden: 410, spur: "rgba(110, 100, 92, .5)",
      braucht: "pfeife", anbau: "pfeife",
      nachbarn: { rechts: "baustelle" },
      tore: [
        { id: "faehre", x: 176, y: 322, r: 100, figur: "figurFaehre", breite: 220, faehre: true },   // im Meer vor dem Ufer
      ],
      einstiege: [
        { id: "zug", titel: "Silbenzug", aufgabe: "silbenzug", figur: "figurLok", fach: "deutsch",
          x: 640, y: 548, breite: 360, fund: "fahrkarte", inhalt: { runden: 5 } },
      ],
    },
    // Zweiter Ort der neuen Insel (seit v0.29): die Baustelle, rechts vom Bahnhof. Das Gleis kommt links herein und
    // endet hier. Rechts geht es später zum Dschungel.
    baustelle: {
      name: "Baustelle", bild: "baustelle", ansage: "Auf der Baustelle.", licht: [255, 180, 0], karte: [8, 1],
      rover: { x: 220, y: 540 }, boden: 410, spur: "rgba(130, 100, 70, .5)",
      braucht: "bauhelm", anbau: "bauhelm",
      nachbarn: { links: "bahnhof" },
      einstiege: [
        { id: "mauer", titel: "Zahlenmauer", aufgabe: "zahlenmauer", figur: "figurMauer", fach: "mathe",
          x: 620, y: 520, breite: 320, fund: "schraube", inhalt: { runden: 5 } },
      ],
    },
    wrack: {
      name: "Piratenwrack", bild: "wrack", ansage: "Beim Piratenwrack.", licht: [0, 200, 160], karte: [1, 2],
      rover: { x: 512, y: 220 }, boden: 60,
      braucht: "propeller", anbau: "propeller", blasen: true,   // blasen: beim Fahren steigen Luftblasen auf
      nachbarn: { oben: "pirateninsel", rechts: "riff" },
      einstiege: [
        { id: "flaschenpost", titel: "Wörter lesen", aufgabe: "lesen", figur: "figurFlasche", fach: "deutsch",
          x: 330, y: 250, breite: 180, fund: "flasche", inhalt: { runden: 5 } },
        // „Mehr oder weniger“ ist seit v0.23 auf der Schildkrötenwiese
      ],
      entdeckungen: [
        { id: "ankerfisch", werkzeug: "fernrohr", x: 150, y: 600, r: 52, zeigt: "fisch", farbe: "#b565c9", bei: { x: 150, y: 520 }, breite: 100, sag: "Ein Fisch wohnt beim Anker." },
        { id: "schiffsschatz", werkzeug: "greifarm", fund: "muenze", x: 640, y: 520, r: 50, zeigt: "truhe", bei: { x: 640, y: 470 }, breite: 100, sag: "Im Schiff steht eine Schatzkiste!" },
      ],
    },
  },
  // Geplante Orte (Paket 6 in KONZEPT.md, Abschnitt 13): noch nicht gebaut. Auf der Weltkarte liegt jeder schon als
  // blasse Wolke an seinem Platz, damit der Zuschnitt der Karte stimmt. Betreten lassen sie sich nicht; ein Tipp
  // darauf spricht „sag“. Wird ein Ort gebaut, kommt er nach „orte“ und sein Eintrag hier fällt weg.
  geplant: [
    { id: "sternwarte", name: "Sternwarte", karte: [0, 1], sag: "Die Sternwarte wird noch gebaut." },
    { id: "dschungel", name: "Dschungel", karte: [9, 1], sag: "Der Dschungel wird noch gebaut." },
    { id: "schrottplanet", name: "Schrottplanet", karte: [6, 0], sag: "Der Schrottplanet wird noch gebaut." },
  ],
};
