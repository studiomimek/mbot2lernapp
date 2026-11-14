/* inhalt/buchstaben.js – Buchstaben als Daten: Anlautwörter und Strichdaten fürs Nachspuren
 *
 * NEUER BUCHSTABE AUS DER SCHULE?
 *   1. Unten in „zeichen“ einen Eintrag anlegen (Wörter + Striche).
 *   2. Den Buchstaben in „aktiv“ anhängen.
 *
 * Wörter: Der Anlaut muss wie der Buchstabe klingen (also nicht „Stein“ für S, nicht „Eis“ für E, nicht „Auto“ für A).
 *
 * Striche: Jeder Strich ist ein SVG-Pfad in Schreibrichtung, in der Reihenfolge, in der geschrieben wird.
 *   Maßsystem: x von 0 bis „breite“, y = 0 Oberlinie (Großbuchstaben), y = 50 Mittellinie, y = 100 Grundlinie.
 *   Bitte mit dem Schulbuch vergleichen und Reihenfolge/Richtung bei Bedarf hier anpassen.
 */
"use strict";

App.inhalt.buchstaben = {
  // Stand der Schule (Reihenfolge wie im Unterricht)
  aktiv: ["M", "A", "L", "O", "U", "S", "R", "E"],

  zeichen: {
    M: {
      woerter: [["Maus", "🐭"], ["Mond", "🌙"], ["Milch", "🥛"]],
      gross: { breite: 90, striche: ["M10,0 L10,100", "M10,0 L45,96 L80,0 L80,100"] },
      klein: { breite: 96, striche: ["M12,50 L12,100 L12,66 C14,56 22,50 31,50 C41,50 46,57 46,68 L46,100 L46,66 C48,56 56,50 65,50 C75,50 80,57 80,68 L80,90 Q80,100 91,98"] },
    },
    A: {
      woerter: [["Affe", "🐒"], ["Apfel", "🍎"], ["Ameise", "🐜"], ["Ampel", "🚦"], ["Ananas", "🍍"]],
      gross: { breite: 90, striche: ["M45,0 L10,100", "M45,0 L80,100", "M23,64 L67,64"] },
      klein: { breite: 82, striche: ["M66,58 C60,53 52,50 44,50 C26,50 14,61 14,75 C14,89 25,100 41,100 C54,100 64,92 66,80 L66,50 L66,90 Q66,100 77,98"] },
    },
    L: {
      woerter: [["Löwe", "🦁"], ["Lampe", "💡"], ["Leiter", "🪜"], ["Lama", "🦙"]],
      gross: { breite: 76, striche: ["M12,0 L12,100 L64,100"] },
      klein: { breite: 42, striche: ["M14,0 L14,88 Q14,100 27,98"] },
    },
    O: {
      woerter: [["Oma", "👵"], ["Opa", "👴"], ["Otter", "🦦"], ["Orange", "🍊"]],
      gross: { breite: 90, striche: ["M45,0 C22,0 8,24 8,50 C8,77 22,100 45,100 C68,100 82,77 82,50 C82,24 68,0 45,0"] },
      klein: { breite: 70, striche: ["M35,50 C19,50 9,61 9,75 C9,89 19,100 35,100 C51,100 61,89 61,75 C61,61 51,50 35,50"] },
    },
    U: {
      woerter: [["Ufo", "🛸"], ["Uhr", "🕐"], ["Uhu", "🦉"]],
      gross: { breite: 90, striche: ["M12,0 L12,62 C12,86 26,100 45,100 C64,100 78,86 78,62 L78,0"] },
      klein: { breite: 84, striche: ["M12,50 L12,80 C12,93 21,100 34,100 C48,100 60,92 60,78 L60,50 L60,90 Q60,100 71,98"] },
    },
    S: {
      woerter: [["Sonne", "☀️"], ["Sofa", "🛋️"], ["Salat", "🥗"], ["Socke", "🧦"], ["Seife", "🧼"]],
      gross: { breite: 80, striche: ["M68,18 C63,6 53,0 41,0 C24,0 12,10 12,25 C12,41 26,46 41,50 C57,54 70,60 70,76 C70,91 57,100 41,100 C27,100 15,93 10,82"] },
      klein: { breite: 66, striche: ["M54,59 C50,53 43,50 34,50 C22,50 13,55 13,63 C13,71 23,73 33,75 C45,77 55,80 55,88 C55,95 46,100 33,100 C23,100 15,97 10,91"] },
    },
    R: {
      woerter: [["Rakete", "🚀"], ["Rose", "🌹"], ["Roboter", "🤖"], ["Regenbogen", "🌈"], ["Ring", "💍"]],
      gross: { breite: 84, striche: ["M12,0 L12,100", "M12,0 L40,0 C60,0 70,11 70,26 C70,41 60,52 40,52 L30,52 L72,100"] },
      klein: { breite: 64, striche: ["M12,50 L12,100 L12,68 C14,57 23,50 34,50 C42,50 48,53 52,59"] },
    },
    E: {
      woerter: [["Ente", "🦆"], ["Elefant", "🐘"], ["Engel", "👼"], ["Erdbeere", "🍓"], ["Eimer", "🪣"]],
      gross: { breite: 76, striche: ["M12,0 L12,100 L64,100", "M12,0 L64,0", "M12,50 L56,50"] },
      klein: { breite: 76, striche: ["M15,79 L62,70 C61,58 51,50 38,50 C23,50 13,61 13,75 C13,89 24,100 39,100 C49,100 57,96 62,89"] },
    },
  },
};
