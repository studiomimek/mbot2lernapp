/* inhalt/woerter.js – Lesewörter für „Wörter lesen“ (Flaschenpost im Piratenwrack)
 * Jeder Eintrag: [Silben, Bild]. Ein Wort kommt nur dran, wenn alle seine Buchstaben im Elternbereich aktiv sind.
 * Enthält ein Wort au, ei, eu oder sch, muss die Lautverbindung (Au, Ei, Eu, Sch) aktiv sein.
 * Als falsche Bilder zur Auswahl dienen alle Wörter der Liste.
 * Neue Wörter einfach anhängen (bitte nur Wörter, zu denen es ein eindeutiges Bild gibt).
 */
"use strict";

App.inhalt.woerter = [
  // lesbar mit M A L O U S R E
  [["O", "ma"], "👵"], [["La", "ma"], "🦙"], [["Ro", "se"], "🌹"], [["Rol", "ler"], "🛴"], [["Mes", "ser"], "🔪"],
  [["Rol", "le"], "🧻"], [["Meer"], "🌊"], [["Arm"], "💪"], [["A", "ra"], "🦜"], [["Lamm"], "🐑"],
  // mit Au, Ei
  [["Maus"], "🐭"], [["Mau", "er"], "🧱"], [["Sau"], "🐷"], [["Au", "to"], "🚗"], [["Ei"], "🥚"], [["Eis"], "🍦"],
  // mit weiteren Buchstaben
  [["Na", "se"], "👃"], [["Ha", "se"], "🐰"], [["Hund"], "🐶"], [["Mond"], "🌙"], [["Son", "ne"], "☀️"], [["En", "te"], "🦆"],
  [["To", "ma", "te"], "🍅"], [["O", "pa"], "👴"], [["So", "fa"], "🛋️"], [["I", "gel"], "🦔"], [["Di", "no"], "🦕"],
  [["Ba", "na", "ne"], "🍌"], [["Wal"], "🐳"], [["Ze", "bra"], "🦓"], [["Kuh"], "🐮"], [["Ra", "ke", "te"], "🚀"],
  [["Ti", "ger"], "🐯"], [["Do", "se"], "🥫"], [["Hut"], "🎩"], [["Bus"], "🚌"], [["Uhr"], "🕐"], [["U", "fo"], "🛸"],
  [["A", "na", "nas"], "🍍"], [["Me", "lo", "ne"], "🍉"], [["Lu", "pe"], "🔍"], [["In", "sel"], "🏝️"], [["An", "ker"], "⚓"],
  [["Pal", "me"], "🌴"], [["Kro", "ne"], "👑"], [["Fisch"], "🐟"], [["Schal"], "🧣"], [["Schu", "le"], "🏫"],
];
