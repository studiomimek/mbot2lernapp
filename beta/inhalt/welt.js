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
      nachbarn: { unten: "riff", rechts: "raketenstation" },
      einstiege: [
        { id: "krebse", titel: "Laute hören", aufgabe: "laut-finden", figur: "figurKrebse", symbol: "ohr",
          x: 250, y: 572, breite: 230, fund: "muschel", inhalt: { runden: 5 } },
        { id: "sandspur", titel: "Buchstaben spuren", aufgabe: "nachspuren", figur: "figurSandspur", symbol: "spur",
          x: 730, y: 580, breite: 236, fund: "seestern", inhalt: { runden: 4 } },
      ],
      entdeckungen: [
        { id: "kokosnuss", x: 130, y: 524, r: 56, zeigt: "kokosnuss", bei: { x: 156, y: 470 }, breite: 70, sag: "Plumps! Eine Kokosnuss." },
        { id: "felsenkrebs", x: 858, y: 500, r: 48, zeigt: "krebs", bei: { x: 924, y: 470 }, breite: 96, sag: "Hallo, kleiner Krebs!" },
        { id: "sandmuschel", x: 384, y: 672, r: 48, zeigt: "muschel", bei: { x: 384, y: 636 }, breite: 70, sag: "Eine Muschel im Sand!" },
      ],
    },
    riff: {
      name: "Riff", bild: "riff", ansage: "Im Riff.", licht: [0, 90, 255],
      rover: { x: 512, y: 220 }, boden: 60,
      nachbarn: { oben: "strand", rechts: "wrack" },
      einstiege: [
        { id: "schwarm", titel: "Fische zählen", aufgabe: "mengen", figur: "figurSchwarm", symbol: "kiesel",
          x: 400, y: 420, breite: 260, fund: "perle", inhalt: { runden: 5 } },
      ],
      entdeckungen: [
        { id: "korallenfisch", x: 130, y: 620, r: 56, zeigt: "fisch", farbe: "#f9c23c", bei: { x: 160, y: 548 }, breite: 100, sag: "Ein Fisch hat sich versteckt!" },
        { id: "wrackperle", x: 830, y: 474, r: 66, zeigt: "perle", bei: { x: 836, y: 420 }, breite: 84, sag: "Ein altes Schiff. Und darin eine Perle!" },
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
    wrack: { name: "Piratenwrack", bald: true },
  },
};
