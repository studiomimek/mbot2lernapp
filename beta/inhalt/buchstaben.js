/* inhalt/buchstaben.js – Buchstaben als Daten: Anlautwörter und Strichdaten fürs Nachspuren
 *
 * Welche Buchstaben drankommen, wird im ELTERNBEREICH angetippt (Zahnrad unten rechts gedrückt halten).
 * „aktiv“ unten ist nur die Vorgabe, solange dort nichts gewählt wurde.
 *
 * Wörter: Der Anlaut muss wie der Buchstabe klingen (also nicht „Stein“ für S, nicht „Eis“ für E, nicht „Auto“ für A).
 *
 * Striche: Jeder Strich ist ein SVG-Pfad in Schreibrichtung, in der Reihenfolge, in der geschrieben wird.
 *   Maßsystem: x von 0 bis „breite“, y = 0 Oberlinie, y = 50 Mittellinie, y = 100 Grundlinie, y = 140 Unterlänge.
 *   Bitte mit dem Schulbuch vergleichen und Reihenfolge/Richtung bei Bedarf hier anpassen.
 *   Einträge ohne Striche (Sch, Ei, Au …) kommen nur beim Laute-Hören vor.
 */
"use strict";

App.inhalt.buchstaben = {
  // Stand der Schule im November 2026
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
      woerter: [["Ente", "🦆"], ["Elefant", "🐘"], ["Engel", "👼"], ["Erdbeere", "🍓"]],
      gross: { breite: 76, striche: ["M12,0 L12,100 L64,100", "M12,0 L64,0", "M12,50 L56,50"] },
      klein: { breite: 76, striche: ["M15,79 L62,70 C61,58 51,50 38,50 C23,50 13,61 13,75 C13,89 24,100 39,100 C49,100 57,96 62,89"] },
    },

    /* ----- Noch nicht im Unterricht: im Elternbereich dazuschalten ----- */
    B: {
      woerter: [["Banane", "🍌"], ["Bär", "🐻"], ["Baum", "🌳"], ["Biene", "🐝"], ["Buch", "📖"]],
      gross: { breite: 84, striche: ["M12,0 L12,100", "M12,0 L42,0 C60,0 68,10 68,24 C68,38 60,48 44,48 L28,48 L46,48 C66,48 74,60 74,74 C74,90 64,100 44,100 L12,100"] },
      klein: { breite: 78, striche: ["M14,0 L14,100 L14,72 C16,58 26,50 40,50 C56,50 66,61 66,75 C66,89 56,100 40,100 C28,100 18,94 14,84"] },
    },
    C: {
      woerter: [["Clown", "🤡"], ["Computer", "💻"]],
      gross: { breite: 82, striche: ["M72,20 C66,8 56,0 44,0 C22,0 8,22 8,50 C8,78 22,100 44,100 C56,100 66,92 72,80"] },
      klein: { breite: 72, striche: ["M62,60 C57,54 50,50 41,50 C24,50 12,61 12,75 C12,89 24,100 41,100 C50,100 57,96 62,90"] },
    },
    D: {
      woerter: [["Dino", "🦕"], ["Delfin", "🐬"], ["Dose", "🥫"]],
      gross: { breite: 88, striche: ["M12,0 L12,100", "M12,0 L36,0 C62,0 78,20 78,50 C78,80 62,100 36,100 L12,100"] },
      klein: { breite: 84, striche: ["M66,60 C60,54 52,50 43,50 C26,50 14,61 14,75 C14,89 25,100 41,100 C54,100 64,92 66,80 L66,0 L66,90 Q66,100 77,98"] },
    },
    F: {
      woerter: [["Fisch", "🐟"], ["Fuchs", "🦊"], ["Feder", "🪶"], ["Feuer", "🔥"], ["Fahrrad", "🚲"]],
      gross: { breite: 72, striche: ["M12,0 L12,100", "M12,0 L64,0", "M12,48 L54,48"] },
      klein: { breite: 66, striche: ["M62,10 C58,3 52,0 45,0 C34,0 28,8 28,20 L28,100", "M10,50 L52,50"] },
    },
    G: {
      woerter: [["Gabel", "🍴"], ["Giraffe", "🦒"], ["Gitarre", "🎸"], ["Geist", "👻"]],
      gross: { breite: 86, striche: ["M72,20 C66,8 56,0 44,0 C22,0 8,22 8,50 C8,78 22,100 44,100 C62,100 74,90 74,70 L74,56 L48,56"] },
      klein: { breite: 80, striche: ["M66,60 C60,54 52,50 43,50 C26,50 14,61 14,75 C14,89 25,100 41,100 C54,100 64,92 66,80 L66,50 L66,112 C66,130 56,140 40,140 C30,140 22,136 16,130"] },
    },
    H: {
      woerter: [["Hund", "🐶"], ["Haus", "🏠"], ["Hase", "🐰"], ["Hut", "🎩"], ["Herz", "❤️"]],
      gross: { breite: 86, striche: ["M12,0 L12,100", "M74,0 L74,100", "M12,50 L74,50"] },
      klein: { breite: 78, striche: ["M14,0 L14,100 L14,70 C16,58 26,50 38,50 C52,50 60,58 60,72 L60,90 Q60,100 71,98"] },
    },
    I: {
      woerter: [["Igel", "🦔"], ["Insel", "🏝️"]],
      gross: { breite: 40, striche: ["M20,0 L20,100"] },
      klein: { breite: 44, striche: ["M16,50 L16,90 Q16,100 27,98", "M16,29 L16,31"] },
    },
    J: {
      woerter: [["Jacke", "🧥"], ["Jojo", "🪀"]],
      gross: { breite: 66, striche: ["M52,0 L52,70 C52,90 42,100 28,100 C18,100 10,94 6,84"] },
      klein: { breite: 50, striche: ["M34,50 L34,114 C34,131 26,140 14,140 C9,140 5,138 2,135", "M34,29 L34,31"] },
    },
    K: {
      woerter: [["Katze", "🐱"], ["Kuh", "🐮"], ["Koffer", "🧳"], ["Kerze", "🕯️"], ["Kaktus", "🌵"]],
      gross: { breite: 84, striche: ["M12,0 L12,100", "M70,0 L16,52 L74,100"] },
      klein: { breite: 74, striche: ["M14,0 L14,100", "M58,50 L16,76 L50,92 Q56,100 67,98"] },
    },
    N: {
      woerter: [["Nase", "👃"], ["Nashorn", "🦏"], ["Nuss", "🥜"]],
      gross: { breite: 86, striche: ["M12,0 L12,100", "M12,0 L74,100 L74,0"] },
      klein: { breite: 72, striche: ["M12,50 L12,100 L12,66 C14,56 23,50 34,50 C46,50 54,57 54,70 L54,90 Q54,100 65,98"] },
    },
    P: {
      woerter: [["Pinguin", "🐧"], ["Pizza", "🍕"], ["Papagei", "🦜"], ["Panda", "🐼"]],
      gross: { breite: 80, striche: ["M12,0 L12,100", "M12,0 L42,0 C62,0 72,12 72,27 C72,42 62,54 42,54 L12,54"] },
      klein: { breite: 78, striche: ["M14,50 L14,140 L14,72 C16,58 26,50 40,50 C56,50 66,61 66,75 C66,89 56,100 40,100 C28,100 18,94 14,84"] },
    },
    Q: {
      woerter: [["Qualle", "🪼"], ["Quadrat", "🟧"]],
      gross: { breite: 92, striche: ["M45,0 C22,0 8,24 8,50 C8,77 22,100 45,100 C68,100 82,77 82,50 C82,24 68,0 45,0", "M56,76 L84,104"] },
      klein: { breite: 80, striche: ["M66,60 C60,54 52,50 43,50 C26,50 14,61 14,75 C14,89 25,100 41,100 C54,100 64,92 66,80 L66,50 L66,140"] },
    },
    T: {
      woerter: [["Tiger", "🐯"], ["Tasse", "☕"], ["Tomate", "🍅"], ["Telefon", "☎️"]],
      gross: { breite: 84, striche: ["M42,0 L42,100", "M6,0 L78,0"] },
      klein: { breite: 62, striche: ["M28,10 L28,86 Q28,100 44,98", "M8,50 L52,50"] },
    },
    V: {
      woerter: [["Vogel", "🐦"], ["Vase", "🏺"]],
      gross: { breite: 84, striche: ["M8,0 L42,100 L76,0"] },
      klein: { breite: 72, striche: ["M8,50 L36,100 L64,50"] },
    },
    W: {
      woerter: [["Wal", "🐳"], ["Wolke", "☁️"], ["Wurm", "🪱"], ["Würfel", "🎲"], ["Welle", "🌊"]],
      gross: { breite: 100, striche: ["M6,0 L28,100 L50,0 L72,100 L94,0"] },
      klein: { breite: 92, striche: ["M6,50 L26,100 L46,50 L66,100 L86,50"] },
    },
    X: {
      woerter: [["Xylofon", "🎶"]],
      gross: { breite: 84, striche: ["M10,0 L74,100", "M74,0 L10,100"] },
      klein: { breite: 72, striche: ["M10,50 L62,100", "M62,50 L10,100"] },
    },
    Y: {
      woerter: [["Yoga", "🧘"]],
      gross: { breite: 84, striche: ["M8,0 L42,50", "M76,0 L42,50 L42,100"] },
      klein: { breite: 74, striche: ["M8,50 L37,100", "M66,50 L14,140"] },
    },
    Z: {
      woerter: [["Zebra", "🦓"], ["Zug", "🚂"], ["Zahn", "🦷"], ["Zitrone", "🍋"], ["Zelt", "⛺"]],
      gross: { breite: 86, striche: ["M10,0 L74,0 L10,100 L76,100"] },
      klein: { breite: 74, striche: ["M10,50 L62,50 L10,100 L64,100"] },
    },

    /* ----- Lautverbindungen: nur Laute hören, kein Nachspuren ----- */
    Ei: { woerter: [["Ei", "🥚"], ["Eis", "🍦"], ["Eimer", "🪣"]] },
    Au: { woerter: [["Auto", "🚗"], ["Auge", "👁️"], ["Aubergine", "🍆"]] },
    Eu: { woerter: [["Eule", "🦉"], ["Euro", "💶"]] },
    Sch: { woerter: [["Schaf", "🐑"], ["Schuh", "👟"], ["Schere", "✂️"], ["Schiff", "🚢"], ["Schlange", "🐍"]] },
    St: { woerter: [["Stern", "⭐"], ["Stuhl", "🪑"], ["Stiefel", "🥾"]] },
    Sp: { woerter: [["Spinne", "🕷️"], ["Spiegel", "🪞"], ["Spaghetti", "🍝"]] },
  },
};
