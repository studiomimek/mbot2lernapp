/* inhalt/bauteile.js – Bauteile für die Spielfigur und ihre Rezepte
 *
 * Der Krebs am Strand (Werkstatt) baut aus Fundstücken Bauteile. Es gibt drei Klassen:
 *   Schlüssel-Teil  („reihenfolge“) sitzt fest an der Figur und öffnet einen Ort mit Lernspiel
 *   Werkzeug        („werkzeuge“) hält die Figur nur beim Benutzen in den Armen; es öffnet einen Spielplatz
 *                   (Schaufel: Buddelinsel, Farbreifen: Malinsel) und die Verstecke an den bekannten Orten
 *                   (die Farbreifen öffnen keine Verstecke)
 *   Treibstoff      reicht für eine Reise zu einem neuen kleinen Ziel
 * Beim Krebs liegen zwei Baupläne nebeneinander: das nächste Schlüssel-Teil (nach dem letzten: Treibstoff) und
 * das nächste Werkzeug. Das Kind wählt, woran gebaut wird (js/app.js, Werkstatt).
 * Ein Bauteil öffnet Orte: In inhalt/welt.js steht beim Ort „braucht: "<bauteil>"“.
 *
 * Ein Bauteil hat:
 *   bild     Name der Bildfunktion in js/bilder.js
 *   name     für Protokoll und Elternbereich
 *   einen / den / mit   Wortformen für die Ansagen („Ich baue dir einen Propeller“, „… baue ich den Propeller“,
 *            „Dorthin komme ich erst mit einem Propeller“)
 *   aus      zwei Sorten Fundstücke (Namen wie bei „fund“ in inhalt/welt.js). Von jeder Sorte braucht es „preis“ Stück.
 *            Die Sorten sollen aus Spielen stammen, die vor diesem Bauteil erreichbar sind. Werkzeuge stehen von
 *            Anfang an zur Wahl, ihre Sorten kommen deshalb vom Strand und vom Hafen (beide sind immer offen).
 *   fertig   wird nach dem Bauen gesprochen: was die Figur jetzt kann und wo es weitergeht
 *
 * Nach dem letzten Schlüssel-Teil der Hauptreihe („reihenfolge“) geht es links mit Treibstoff weiter (siehe unten
 * und js/planeten.js). Seit v0.28 wechselt er sich mit den Teilen für die neue Insel ab („insel“): erst ein Tank,
 * dann ein Insel-Teil, wieder ein Tank … Sind alle Insel-Teile gebaut, gibt es links nur noch Treibstoff.
 *
 * NEUES BAUTEIL? Bild zeichnen, hier eintragen, in „reihenfolge“ oder „werkzeuge“ aufnehmen, beim Ort „braucht“ setzen.
 */
"use strict";

App.inhalt.bauteile = {
  preis: 2,   // Vorgabe: Fundstücke je Sorte (2 + 2 = vier Aufgaben). Im Elternbereich einstellbar (1 bis 3).
  reihenfolge: ["propeller", "kompass", "lampe", "triebwerk"],
  // Schlüssel-Teile für die neue Insel (Bahnhof, später Baustelle und Dschungel): nach dem Triebwerk, im Wechsel mit Treibstoff
  insel: ["pfeife", "bauhelm"],
  // Werkzeuge, der Reihe nach: Beim Krebs steht immer das nächste als zweiter Bauplan zur Wahl.
  // Zuerst kommen die Werkzeuge, deren Spielplatz die Fähre erreicht (seit v0.27).
  werkzeuge: ["schaufel", "farbreifen", "fernrohr", "greifarm"],
  teile: {
    propeller: {
      bild: "teilPropeller", name: "Propeller", einen: "einen Propeller", den: "den Propeller", mit: "einem Propeller",
      aus: ["muschel", "seestern"],
      fertig: "Jetzt kann ich tauchen! Das Riff liegt unter dem Strand.",
    },
    kompass: {
      bild: "teilKompass", name: "Kompass", einen: "einen Kompass", den: "den Kompass", mit: "einem Kompass",
      aus: ["perle", "muschel"],
      fertig: "Jetzt finde ich den Weg zur Pirateninsel! Die Fähre am Hafen bringt mich hin.",
    },
    lampe: {
      bild: "teilLampe", name: "Lampe", einen: "eine Lampe", den: "die Lampe", mit: "einer Lampe",
      aus: ["feder", "muenze"],
      fertig: "Jetzt habe ich Licht! Auf der Raketeninsel ist es dunkel. Die Fähre am Hafen bringt mich hin.",
    },
    triebwerk: {
      bild: "teilTriebwerk", name: "Triebwerk", einen: "ein Triebwerk", den: "das Triebwerk", mit: "einem Triebwerk",
      aus: ["stern", "planet"],
      fertig: "Jetzt kann die Rakete starten! Fahr an der Raketenstation durch die Tür.",
    },
    // Teile für die neue Insel („insel“). Ihre Sorten gibt es erst nach dem Triebwerk (in der Rakete und im Weltraum).
    pfeife: {
      bild: "teilPfeife", name: "Pfeife", einen: "eine Pfeife", den: "die Pfeife", mit: "einer Pfeife",
      aus: ["zahnrad", "komet"],
      fertig: "Jetzt kann ich pfeifen wie ein Zug! Die Fähre am Hafen bringt mich zum Bahnhof.",
    },
    bauhelm: {
      bild: "teilBauhelm", name: "Bauhelm", einen: "einen Bauhelm", den: "den Bauhelm", mit: "einem Bauhelm",
      aus: ["fahrkarte", "schnecke"],
      fertig: "Jetzt habe ich einen Helm! Am Bahnhof geht es rechts zur Baustelle.",
    },
    // Werkzeuge öffnen einen Spielplatz („braucht“ am Ort, z. B. die Buddelinsel) und die Verstecke an schon
    // bekannten Orten („entdeckungen“ mit „werkzeug“ in inhalt/welt.js). Ihre Sorten gibt es am Strand und am Hafen.
    schaufel: {
      bild: "teilSchaufel", name: "Schaufel", einen: "eine Schaufel", den: "die Schaufel", mit: "einer Schaufel",
      aus: ["muschel", "anker"],
      fertig: "Jetzt kann ich graben! Die Fähre am Hafen bringt mich zur Buddelinsel. Und wo eine kleine Schaufel blinkt, ist etwas vergraben.",
    },
    // Die Farbreifen sitzen an den Rädern der Figur, zu sehen nur auf der Malinsel. Wortformen in der Mehrzahl.
    farbreifen: {
      bild: "teilFarbreifen", name: "Farbreifen", einen: "Farbreifen", den: "die Farbreifen", mit: "Farbreifen",
      aus: ["seestern", "anker"],
      fertig: "Jetzt kann ich malen! Die Fähre am Hafen bringt mich zur Malinsel.",
    },
    greifarm: {
      bild: "teilGreifarm", name: "Greifarm", einen: "einen Greifarm", den: "den Greifarm", mit: "einem Greifarm",
      aus: ["seestern", "boje"],
      fertig: "Jetzt kann ich greifen! Wo ein kleiner Greifarm blinkt, hole ich etwas herunter.",
    },
    fernrohr: {
      bild: "teilFernrohr", name: "Fernrohr", einen: "ein Fernrohr", den: "das Fernrohr", mit: "einem Fernrohr",
      aus: ["muschel", "boje"],
      fertig: "Jetzt sehe ich, was sich versteckt! Wo ein kleines Fernrohr blinkt, schaue ich genau hin.",
    },
    // Treibstoff steht nicht in der Reihenfolge: Sind alle Schlüssel-Teile gebaut, ist er der linke Bauplan, immer wieder.
    // Jeder Tank reicht für eine Reise: mit der Rakete zu einem neuen Planeten (Abflug im Weltraum) oder mit der
    // Fähre zu einer neuen kleinen Insel (Seekarte). Seine Sorten wechseln, siehe „paare“.
    treibstoff: {
      bild: "teilTreibstoff", name: "Treibstoff", einen: "Treibstoff", den: "den Treibstoff", mit: "Treibstoff",
      fertig: "Der Tank ist voll! Damit fährt die Fähre zu einer neuen Insel. Oder die Rakete fliegt zu einem neuen Planeten.",
    },
  },
  // Sorten für den Treibstoff, der Reihe nach und dann wieder von vorn: immer eine aus Deutsch und eine aus Mathe
  paare: [["muschel", "perle"], ["seestern", "muenze"], ["feder", "planet"], ["flasche", "anker"], ["stern", "komet"], ["zahnrad", "boje"], ["flasche", "schnecke"], ["fahrkarte", "boje"], ["zahnrad", "schraube"]],
};
