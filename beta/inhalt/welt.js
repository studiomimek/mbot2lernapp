/* inhalt/welt.js – die Welt als Daten
 *
 * NEUER ORT?
 *   1. Bild in js/bilder.js zeichnen (Funktion mit dem Namen aus „bild“).
 *   2. Hier einen Eintrag in „orte“ anlegen und bei einem Nachbarn unter „nachbarn“ eintragen.
 *
 * Ein Ort hat:
 *   bild      Name der Bildfunktion in js/bilder.js
 *   ansage    wird beim Betreten gesprochen
 *   licht     Farbe, in der der Roboter an diesem Ort leuchtet [rot, grün, blau]
 *   rover     Platz der Spielfigur beim ersten Betreten (Bühne ist 1024 × 768)
 *   boden     höchste Stelle, bis zu der die Figur fahren darf (y-Wert; am Strand beginnt dort der Sand)
 *   nachbarn  oben / unten / links / rechts → Name des Nachbarorts
 *   einstiege Figuren, die zu einer Aufgabe führen. Die Aufgabe startet, wenn die Spielfigur darüberfährt.
 *             aufgabe = Modul in js/aufgaben/, figur + symbol = Bilder, x/y = Mitte, fund = Fundstück als Belohnung
 *   entdeckungen  funkelnde Stellen zum Erforschen: Fährt die Figur hin (x/y, Umkreis r), taucht das Bild „zeigt“
 *             an der Stelle „bei“ auf und der Satz „sag“ wird gesprochen. Beliebig viele pro Ort.
 *   bald      true = Ort ist noch nicht gebaut (Pfeil zeigt ein Schloss)
 */
"use strict";

App.inhalt.welt = {
  start: "strand",
  orte: {
    strand: {
      name: "Strand", bild: "strand", ansage: "Am Strand.", licht: [255, 150, 0],
      rover: { x: 512, y: 540 }, boden: 480,
      nachbarn: { unten: "riff", rechts: "raketenstation", links: "pirateninsel" },
      einstiege: [
        { id: "krebse", titel: "Laute hören", aufgabe: "laut-finden", figur: "figurKrebse", symbol: "ohr",
          x: 310, y: 572, breite: 230, fund: "muschel", inhalt: { runden: 5 } },
        { id: "sandspur", titel: "Buchstaben spuren", aufgabe: "nachspuren", figur: "figurSandspur", symbol: "spur",
          x: 730, y: 580, breite: 236, fund: "seestern", inhalt: { runden: 4 } },
      ],
      entdeckungen: [
        { id: "kokosnuss", x: 176, y: 500, r: 46, zeigt: "kokosnuss", bei: { x: 156, y: 440 }, breite: 70, sag: "Plumps! Eine Kokosnuss." },
        { id: "felsenkrebs", x: 858, y: 500, r: 48, zeigt: "krebs", bei: { x: 924, y: 470 }, breite: 96, sag: "Hallo, kleiner Krebs!" },
        { id: "sandmuschel", x: 384, y: 672, r: 48, zeigt: "muschel", bei: { x: 384, y: 636 }, breite: 70, sag: "Eine Muschel im Sand!" },
      ],
    },
    riff: {
      name: "Riff", bild: "riff", ansage: "Im Riff.", licht: [0, 90, 255],
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
      name: "Raketenstation", bild: "station", ansage: "An der Raketenstation.", licht: [150, 60, 255],
      rover: { x: 470, y: 670 }, boden: 500,
      nachbarn: { links: "strand" },
      einstiege: [
        { id: "silben", titel: "Silben klatschen", aufgabe: "silben", figur: "figurSilben", symbol: "bogen",
          x: 345, y: 566, breite: 190, fund: "stern", inhalt: { runden: 5 } },
        { id: "plus", titel: "Plus rechnen", aufgabe: "plus", figur: "figurPlus", symbol: "plus",
          x: 585, y: 566, breite: 190, fund: "planet", inhalt: { runden: 5 } },
        { id: "reihe", titel: "Zahlenreihe", aufgabe: "reihe", figur: "figurReihe", symbol: "zahlen",
          x: 810, y: 566, breite: 200, fund: "rakete", inhalt: { runden: 5 } },
      ],
      entdeckungen: [
        { id: "sternschnuppe", x: 150, y: 640, r: 52, zeigt: "stern", bei: { x: 330, y: 190 }, breite: 90, sag: "Eine Sternschnuppe! Wünsch dir was." },
        { id: "funksignal", x: 934, y: 524, r: 50, zeigt: "funk", bei: { x: 912, y: 250 }, breite: 120, sag: "Piep, piep! Ein Funksignal aus dem All." },
      ],
    },
    pirateninsel: {
      name: "Pirateninsel", bild: "pirateninsel", ansage: "Auf der Pirateninsel.", licht: [255, 60, 0],
      rover: { x: 470, y: 600 }, boden: 520,
      nachbarn: { rechts: "strand", unten: "wrack" },
      einstiege: [
        { id: "steuern", titel: "Roboter steuern", aufgabe: "steuern", figur: "figurSteuerrad", symbol: "rad",
          x: 300, y: 596, breite: 170, inhalt: {} },
        { id: "papagei", titel: "Was fängt an wie …?", aufgabe: "anlaut-bilder", figur: "figurPapagei", symbol: "ohr",
          x: 610, y: 600, breite: 170, fund: "feder", inhalt: { runden: 5 } },
      ],
      entdeckungen: [
        { id: "fasskrebs", x: 150, y: 690, r: 46, zeigt: "krebs", bei: { x: 150, y: 590 }, breite: 96, sag: "Im Fass wohnt ein Krebs!" },
        { id: "schatzkreuz", x: 758, y: 680, r: 48, zeigt: "muenze", bei: { x: 758, y: 640 }, breite: 80, sag: "Hier ist ein Schatz vergraben. Eine Goldmünze!" },
      ],
    },
    wrack: {
      name: "Piratenwrack", bild: "wrack", ansage: "Beim Piratenwrack.", licht: [0, 200, 160],
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
