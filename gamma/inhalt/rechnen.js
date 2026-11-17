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
  // Vergleichen: zwei Haufen Münzen. „zeichen“ = zwischen zwei Zahlen <, > oder = wählen
  vergleichen: [
    { name: "mehr oder weniger bis 6", bis: 6 },
    { name: "mehr oder weniger bis 10", bis: 10 },
    { name: "Zeichen < > = bis 10", bis: 10, zeichen: true },
  ],
  // Winken: so oft vor dem Roboter winken (oder tippen), wie die Zahl zeigt
  winken: [
    { name: "Zahlen bis 5", bis: 5 },
    { name: "Zahlen bis 10", bis: 10 },
  ],
  // Zahlenstrahl: Planken von 0 bis „bis“; die Figur fährt höchstens „schritte“ Schritte. richtung 1 = nur vor, 0 = vor und zurück
  strahl: [
    { name: "vor bis 10", bis: 10, richtung: 1, schritte: 3 },
    { name: "vor und zurück bis 10", bis: 10, richtung: 0, schritte: 4 },
    { name: "vor und zurück bis 20", bis: 20, richtung: 0, schritte: 5 },
  ],
  // Blitzblick: Quallen leuchten „zeit“ Millisekunden lang auf. anordnung: "wuerfel" (Würfelbild), "gruppen"
  // (zwei Würfelbilder nebeneinander) oder "zehnerfeld" (zwei Reihen mit je fünf)
  blitz: [
    { name: "bis 4, Würfelbild", von: 1, bis: 4, anordnung: "wuerfel", zeit: 1100, auswahl: 3 },
    { name: "bis 6, Würfelbild", von: 2, bis: 6, anordnung: "wuerfel", zeit: 1000, auswahl: 3 },
    { name: "bis 8, zwei Gruppen", von: 4, bis: 8, anordnung: "gruppen", zeit: 1200, auswahl: 4 },
    { name: "bis 10 im Zehnerfeld", von: 5, bis: 10, anordnung: "zehnerfeld", zeit: 1400, auswahl: 4 },
  ],
  // Zahlenreihe: fünf Zahlen, eine fehlt
  reihe: [
    { name: "vorwärts bis 10", bis: 10, richtung: 1 },
    { name: "rückwärts ab 10 (Countdown)", bis: 10, richtung: -1 },
    { name: "vor und zurück bis 20", bis: 20, richtung: 0 },
  ],
};
