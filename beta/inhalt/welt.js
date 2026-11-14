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
 *   rover     Platz der Spielfigur beim Betreten (Bühne ist 1024 × 768)
 *   nachbarn  oben / unten / links / rechts → Name des Nachbarorts
 *   einstiege Figuren, die zu einer Aufgabe führen:
 *             aufgabe = Modul in js/aufgaben/, figur + symbol = Bilder, x/y = Mitte, fund = Fundstück als Belohnung
 *   bald      true = Ort ist noch nicht gebaut (Pfeil zeigt ein Schloss)
 */
"use strict";

App.inhalt.welt = {
  start: "strand",
  orte: {
    strand: {
      name: "Strand", bild: "strand", ansage: "Am Strand.", licht: [255, 150, 0],
      rover: { x: 452, y: 500 },
      nachbarn: { unten: "riff", rechts: "raketeninsel" },
      einstiege: [
        { id: "krebse", titel: "Laute hören", aufgabe: "laut-finden", figur: "figurKrebse", symbol: "ohr",
          x: 250, y: 572, breite: 230, fund: "muschel", inhalt: { runden: 5 } },
        { id: "sandspur", titel: "Buchstaben spuren", aufgabe: "nachspuren", figur: "figurSandspur", symbol: "spur",
          x: 730, y: 580, breite: 236, fund: "seestern", inhalt: { runden: 4 } },
      ],
    },
    riff: {
      name: "Riff", bild: "riff", ansage: "Im Riff.", licht: [0, 90, 255],
      rover: { x: 452, y: 180 },
      nachbarn: { oben: "strand", rechts: "wrack" },
      einstiege: [
        { id: "schwarm", titel: "Fische zählen", aufgabe: "mengen", figur: "figurSchwarm", symbol: "kiesel",
          x: 400, y: 420, breite: 260, fund: "perle", inhalt: { runden: 5 } },
      ],
    },
    raketeninsel: { name: "Raketeninsel", bald: true },
    wrack: { name: "Piratenwrack", bald: true },
  },
};
