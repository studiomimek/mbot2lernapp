/* inhalt/rechnen.js – Stufen für „Plus rechnen“ und „Zahlenreihe“
 * Die nächste Stufe öffnet sich, wenn in einer Runde höchstens eine Antwort nicht auf Anhieb stimmte.
 * Alle Stufen lassen sich im Elternbereich von Hand umstellen.
 */
"use strict";

App.inhalt.rechnen = {
  // Plus: zwei Sorten Sterne im Zehnerfeld. „ergaenzen“ = Platzhalteraufgabe (3 + ? = 7)
  plus: [
    { name: "Plus bis 5", summeBis: 5, auswahl: 3 },
    { name: "Plus bis 10", summeBis: 10, auswahl: 4 },
    { name: "Ergänzen bis 10 (3 + ? = 7)", summeBis: 10, auswahl: 4, ergaenzen: true },
  ],
  // Zahlenreihe: fünf Zahlen, eine fehlt
  reihe: [
    { name: "vorwärts bis 10", bis: 10, richtung: 1 },
    { name: "rückwärts ab 10 (Countdown)", bis: 10, richtung: -1 },
    { name: "vor und zurück bis 20", bis: 20, richtung: 0 },
  ],
};
