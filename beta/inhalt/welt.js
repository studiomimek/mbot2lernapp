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
 *   karte     Platz auf der Weltkarte [Spalte, Zeile]; Zeile 0 = oben
 *   rover     Platz der Spielfigur beim ersten Betreten (Bühne ist 1024 × 768)
 *   boden     höchste Stelle, bis zu der die Figur fahren darf (y-Wert; darüber sind Himmel, Meer oder Gebäude)
 *   nachbarn  oben / unten / links / rechts → Nachbarort; er geht auf, wenn die Figur an diesen Rand fährt
 *   einstiege Figuren, die zu einer Aufgabe führen. Die Aufgabe startet, wenn die Spielfigur darauf stehen bleibt.
 *             aufgabe = Modul in js/aufgaben/, figur + symbol = Bilder, x/y = Mitte, fund = Fundstück als Belohnung
 *   tore      Durchgänge zu Orten, die nicht nebenan liegen: figur = Bild, x/y = Mitte, r = Umkreis, ziel = Ort
 *   entdeckungen  funkelnde Stellen zum Erforschen: Fährt die Figur hin (x/y, Umkreis r), taucht das Bild „zeigt“
 *             an der Stelle „bei“ auf und der Satz „sag“ wird gesprochen. Beliebig viele pro Ort.
 *   bald      true = Ort ist noch nicht gebaut
 *
 * Zonen (Einstiege, Tore, Entdeckungen) sollen sich nicht überlappen.
 */
"use strict";

App.inhalt.welt = {
  start: "strand",
  orte: {
    strand: {
      name: "Strand", bild: "strand", ansage: "Am Strand.", licht: [255, 150, 0], karte: [1, 1],
      rover: { x: 512, y: 470 }, boden: 360,
      nachbarn: { unten: "riff", rechts: "raketenstation", links: "pirateninsel" },
      einstiege: [
        { id: "krebse", titel: "Laute hören", aufgabe: "laut-finden", figur: "figurKrebse", symbol: "ohr",
          x: 290, y: 566, breite: 230, fund: "muschel", inhalt: { runden: 5 } },
        { id: "sandspur", titel: "Buchstaben spuren", aufgabe: "nachspuren", figur: "figurSandspur", symbol: "spur",
          x: 760, y: 500, breite: 236, fund: "seestern", inhalt: { runden: 4 } },
      ],
      entdeckungen: [
        { id: "kokosnuss", x: 180, y: 402, r: 44, zeigt: "kokosnuss", bei: { x: 156, y: 330 }, breite: 70, sag: "Plumps! Eine Kokosnuss." },
        { id: "felsenkrebs", x: 870, y: 420, r: 44, zeigt: "krebs", bei: { x: 928, y: 352 }, breite: 96, sag: "Hallo, kleiner Krebs!" },
        { id: "sandmuschel", x: 450, y: 676, r: 44, zeigt: "muschel", bei: { x: 450, y: 640 }, breite: 70, sag: "Eine Muschel im Sand!" },
        { id: "sandburg", x: 560, y: 408, r: 40, zeigt: "muenze", bei: { x: 560, y: 300 }, breite: 70, sag: "In der Sandburg ist eine Münze versteckt!" },
      ],
    },
    riff: {
      name: "Riff", bild: "riff", ansage: "Im Riff.", licht: [0, 90, 255], karte: [1, 2],
      rover: { x: 512, y: 220 }, boden: 60,
      nachbarn: { oben: "strand", links: "wrack" },
      einstiege: [
        { id: "schwarm", titel: "Fische zählen", aufgabe: "mengen", figur: "figurSchwarm", symbol: "kiesel",
          x: 400, y: 420, breite: 260, fund: "perle", inhalt: { runden: 5 } },
      ],
      entdeckungen: [
        { id: "korallenfisch", x: 916, y: 630, r: 54, zeigt: "fisch", farbe: "#f9c23c", bei: { x: 900, y: 556 }, breite: 100, sag: "Ein Fisch hat sich versteckt!" },
        { id: "wrackperle", x: 210, y: 440, r: 60, zeigt: "perle", bei: { x: 200, y: 380 }, breite: 84, sag: "Da hinten liegt ein altes Schiff. Und davor eine Perle!" },
        { id: "steinstern", x: 574, y: 680, r: 48, zeigt: "seestern", bei: { x: 574, y: 644 }, breite: 78, sag: "Ein Seestern!" },
      ],
    },
    raketenstation: {
      name: "Raketenstation", bild: "station", ansage: "An der Raketenstation.", licht: [150, 60, 255], karte: [2, 1],
      rover: { x: 620, y: 560 }, boden: 380,
      nachbarn: { links: "strand" },
      tore: [
        { id: "raketentuer", x: 560, y: 410, r: 44, figur: "figurTuer", breite: 96, ziel: "rakete" },
      ],
      einstiege: [
        { id: "silben", titel: "Silben klatschen", aufgabe: "silben", figur: "figurSilben", symbol: "bogen",
          x: 210, y: 540, breite: 190, fund: "stern", inhalt: { runden: 5 } },
        { id: "plus", titel: "Plus rechnen", aufgabe: "plus", figur: "figurPlus", symbol: "plus",
          x: 400, y: 660, breite: 190, fund: "planet", inhalt: { runden: 5 } },
        { id: "reihe", titel: "Zahlenreihe", aufgabe: "reihe", figur: "figurReihe", symbol: "zahlen",
          x: 810, y: 600, breite: 200, fund: "rakete", inhalt: { runden: 5 } },
      ],
      entdeckungen: [
        { id: "sternschnuppe", x: 90, y: 700, r: 44, zeigt: "stern", bei: { x: 330, y: 150 }, breite: 90, sag: "Eine Sternschnuppe! Wünsch dir was." },
        { id: "funksignal", x: 900, y: 410, r: 46, zeigt: "funk", bei: { x: 912, y: 120 }, breite: 120, sag: "Piep, piep! Ein Funksignal aus dem All." },
      ],
    },
    rakete: {
      name: "In der Rakete", bild: "cockpit", ansage: "In der Rakete.", licht: [255, 255, 255], karte: [2, 0],
      rover: { x: 630, y: 690 }, boden: 520,
      nachbarn: { rechts: "weltraum" },   // am rechten Rand startet der Countdown (das Spiel mit inhalt.ziel = "weltraum")
      tore: [
        { id: "ausstieg", x: 120, y: 600, r: 50, figur: "figurTuer", breite: 100, ziel: "raketenstation", ansage: "Wieder draußen an der Raketenstation." },
      ],
      einstiege: [
        { id: "bordcomputer", titel: "Bordcomputer", aufgabe: "bordcomputer", figur: "figurPult", symbol: "ohr",
          x: 450, y: 600, breite: 200, fund: "zahnrad", inhalt: { runden: 5 } },
        { id: "startknopf", titel: "Countdown und Start", aufgabe: "countdown", figur: "figurStartknopf", symbol: "zahlen",
          x: 810, y: 610, breite: 190, inhalt: { ziel: "weltraum" } },
      ],
      entdeckungen: [
        { id: "fensterplanet", x: 290, y: 706, r: 40, zeigt: "planet", bei: { x: 512, y: 180 }, breite: 120, sag: "Im Fenster leuchtet ein Planet." },
      ],
    },
    weltraum: {
      name: "Weltraum", bild: "weltraum", ansage: "Im Weltraum.", licht: [80, 0, 255], karte: [3, 0],
      rover: { x: 480, y: 600 }, boden: 110,
      nachbarn: { links: "rakete" },
      tore: [
        { id: "landung", x: 150, y: 590, r: 56, figur: "figurLandung", breite: 96, ziel: "raketenstation", ansage: "Gelandet! Zurück an der Raketenstation." },
      ],
      einstiege: [
        { id: "satellit", titel: "Winken zählen", aufgabe: "winken", figur: "figurSatellit", symbol: "zahlen",
          x: 640, y: 360, breite: 210, fund: "komet", inhalt: { runden: 5 } },
      ],
      entdeckungen: [
        { id: "komet", x: 356, y: 330, r: 48, zeigt: "stern", bei: { x: 356, y: 250 }, breite: 90, sag: "Ein Komet saust vorbei!" },
        { id: "erde", x: 180, y: 300, r: 46, zeigt: "funk", bei: { x: 262, y: 140 }, breite: 100, sag: "Die Erde funkt: Hallo, kleiner Roboter!" },
        { id: "ringplanet", x: 770, y: 560, r: 54, zeigt: "planet", bei: { x: 770, y: 470 }, breite: 100, sag: "Ein Planet mit Ringen!" },
      ],
    },
    pirateninsel: {
      name: "Pirateninsel", bild: "pirateninsel", ansage: "Auf der Pirateninsel.", licht: [255, 60, 0], karte: [0, 1],
      rover: { x: 470, y: 500 }, boden: 390,
      nachbarn: { rechts: "strand", unten: "wrack" },
      einstiege: [
        { id: "steuern", titel: "Roboter steuern", aufgabe: "steuern", figur: "figurSteuerrad", symbol: "rad",
          x: 300, y: 560, breite: 170, inhalt: {} },
        { id: "papagei", titel: "Was fängt an wie …?", aufgabe: "anlaut-bilder", figur: "figurPapagei", symbol: "ohr",
          x: 640, y: 540, breite: 170, fund: "feder", inhalt: { runden: 5 } },
      ],
      entdeckungen: [
        { id: "fasskrebs", x: 150, y: 690, r: 44, zeigt: "krebs", bei: { x: 150, y: 590 }, breite: 96, sag: "Im Fass wohnt ein Krebs!" },
        { id: "schatzkreuz", x: 758, y: 680, r: 46, zeigt: "muenze", bei: { x: 758, y: 640 }, breite: 80, sag: "Hier ist ein Schatz vergraben. Eine Goldmünze!" },
        { id: "schatzkiste", x: 904, y: 470, r: 44, zeigt: "perle", bei: { x: 904, y: 380 }, breite: 80, sag: "In der Schatzkiste glänzt eine Perle!" },
      ],
    },
    wrack: {
      name: "Piratenwrack", bild: "wrack", ansage: "Beim Piratenwrack.", licht: [0, 200, 160], karte: [0, 2],
      rover: { x: 512, y: 220 }, boden: 60,
      nachbarn: { oben: "pirateninsel", rechts: "riff" },
      einstiege: [
        { id: "flaschenpost", titel: "Wörter lesen", aufgabe: "lesen", figur: "figurFlasche", symbol: "buch",
          x: 330, y: 250, breite: 180, fund: "flasche", inhalt: { runden: 5 } },
        { id: "muenzen", titel: "Mehr oder weniger", aufgabe: "vergleichen", figur: "figurMuenzen", symbol: "waage",
          x: 800, y: 650, breite: 190, fund: "muenze", inhalt: { runden: 5 } },
      ],
      entdeckungen: [
        { id: "ankerfisch", x: 150, y: 600, r: 52, zeigt: "fisch", farbe: "#b565c9", bei: { x: 150, y: 520 }, breite: 100, sag: "Ein Fisch wohnt beim Anker." },
        { id: "schiffsschatz", x: 640, y: 520, r: 50, zeigt: "truhe", bei: { x: 640, y: 470 }, breite: 100, sag: "Im Schiff steht eine Schatzkiste!" },
      ],
    },
  },
};
