/* inhalt/woerter.js – Lesewörter für „Wörter lesen“ (Flaschenpost im Piratenwrack) und den „Silbenzug“ (Bahnhof)
 * Jeder Eintrag: [Silben, Bild]. Ein Wort kommt nur dran, wenn alle seine Buchstaben im Elternbereich aktiv sind.
 * Enthält ein Wort au, ei, eu oder sch, muss die Lautverbindung (Au, Ei, Eu, Sch) aktiv sein.
 * Als falsche Bilder zur Auswahl dienen alle Wörter der Liste.
 * Neue Wörter einfach anhängen (bitte nur Wörter, zu denen es ein eindeutiges Bild gibt).
 * Der Silbenzug nimmt nur die Wörter mit zwei oder mehr Silben. Seine Stufen stehen unten („zugStufen“).
 */
"use strict";

App.inhalt.woerter = [
  // lesbar mit M A L O U S R E
  [["O", "ma"], "👵"], [["La", "ma"], "🦙"], [["Ro", "se"], "🌹"], [["Rol", "ler"], "🛴"], [["Mes", "ser"], "🔪"],
  [["Rol", "le"], "🧻"], [["Meer"], "🌊"], [["Arm"], "💪"], [["A", "ra"], "🦜"], [["Lamm"], "🐑"],
  [["Ma", "ma"], "👩"], [["Ma", "ler"], "🧑‍🎨"], [["A", "larm"], "🚨"], [["Mu", "se", "um"], "🏛️"],
  // mit Au, Ei
  [["Maus"], "🐭"], [["Mau", "er"], "🧱"], [["Sau"], "🐷"], [["Au", "to"], "🚗"], [["Ei"], "🥚"], [["Eis"], "🍦"],
  [["Ei", "mer"], "🪣"], [["Eu", "le"], "🦉"],
  // mit weiteren Buchstaben
  [["Na", "se"], "👃"], [["Ha", "se"], "🐰"], [["Hund"], "🐶"], [["Mond"], "🌙"], [["Son", "ne"], "☀️"], [["En", "te"], "🦆"],
  [["To", "ma", "te"], "🍅"], [["O", "pa"], "👴"], [["So", "fa"], "🛋️"], [["I", "gel"], "🦔"], [["Di", "no"], "🦕"],
  [["Ba", "na", "ne"], "🍌"], [["Wal"], "🐳"], [["Ze", "bra"], "🦓"], [["Kuh"], "🐮"], [["Ra", "ke", "te"], "🚀"],
  [["Ti", "ger"], "🐯"], [["Do", "se"], "🥫"], [["Hut"], "🎩"], [["Bus"], "🚌"], [["Uhr"], "🕐"], [["U", "fo"], "🛸"],
  [["A", "na", "nas"], "🍍"], [["Me", "lo", "ne"], "🍉"], [["Lu", "pe"], "🔍"], [["In", "sel"], "🏝️"], [["An", "ker"], "⚓"],
  [["Pal", "me"], "🌴"], [["Kro", "ne"], "👑"], [["Fisch"], "🐟"], [["Schal"], "🧣"], [["Schu", "le"], "🏫"],
];

// Stufen für den „Silbenzug“: silben = so viele Silben hat ein Wort höchstens; falsch = ein Waggon zu viel (eine
// Silbe aus einem anderen Wort, sie bleibt am Ende stehen). Im Elternbereich einstellbar.
App.inhalt.zugStufen = [
  { name: "zwei Silben", silben: 2 },
  { name: "zwei oder drei Silben", silben: 3 },
  { name: "mit einem falschen Waggon", silben: 3, falsch: true },
];
