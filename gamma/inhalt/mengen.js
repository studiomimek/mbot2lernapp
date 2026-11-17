/* inhalt/mengen.js – Stufen für „Mengen bis 10“
 * Reihenfolge: zählen → kleine Mengen erfassen → strukturierte Mengen (Würfelbild, Zehnerfeld) → bis 10 frei.
 * Die nächste Stufe öffnet sich, wenn in einer Runde höchstens eine Antwort nicht auf Anhieb stimmte.
 * Die Stufe lässt sich im Elternbereich von Hand umstellen.
 */
"use strict";

App.inhalt.mengen = {
  stufen: [
    { name: "bis 5, frei verteilt", von: 1, bis: 5, anordnung: "frei", auswahl: 3 },
    { name: "Würfelbilder bis 6", von: 1, bis: 6, anordnung: "wuerfel", auswahl: 3 },
    { name: "bis 10 im Zehnerfeld", von: 4, bis: 10, anordnung: "zehnerfeld", auswahl: 4 },
    { name: "bis 10, frei verteilt", von: 5, bis: 10, anordnung: "frei", auswahl: 4 },
  ],
  zahlwoerter: ["null", "ein", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun", "zehn"],
  // Gezählte Fische werden weiß, beim gemeinsamen Nachzählen gelb; diese beiden Farben hier nicht verwenden
  fischfarben: ["#f0715b", "#f59a3c", "#b9e36b", "#f48fb1"],
};
