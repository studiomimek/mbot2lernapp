/* inhalt/silben.js – Wörter mit Silbentrennung für „Silben klatschen“
 * Jeder Eintrag: [Silben, Bild]. Das Wort wird nur gesprochen, die Buchstaben müssen also noch nicht bekannt sein.
 * Neue Wörter einfach anhängen; die Silben so trennen, wie man sie beim Klatschen spricht.
 */
"use strict";

App.inhalt.silben = {
  hoechstens: 5,   // so viele Raketenteile passen höchstens
  woerter: [
    // 1 Silbe
    [["Hund"], "🐶"], [["Maus"], "🐭"], [["Fisch"], "🐟"], [["Mond"], "🌙"], [["Stern"], "⭐"], [["Baum"], "🌳"],
    [["Haus"], "🏠"], [["Buch"], "📖"], [["Zug"], "🚂"], [["Brot"], "🍞"], [["Schiff"], "🚢"], [["Frosch"], "🐸"], [["Pilz"], "🍄"],
    // 2 Silben
    [["Ap", "fel"], "🍎"], [["Son", "ne"], "☀️"], [["Au", "to"], "🚗"], [["Ti", "ger"], "🐯"], [["Lö", "we"], "🦁"],
    [["En", "te"], "🦆"], [["Blu", "me"], "🌼"], [["Ker", "ze"], "🕯️"], [["Piz", "za"], "🍕"], [["Ze", "bra"], "🦓"],
    [["Ro", "se"], "🌹"], [["Kro", "ne"], "👑"], [["U", "fo"], "🛸"], [["Pla", "net"], "🪐"], [["Ko", "met"], "☄️"],
    [["Wol", "ke"], "☁️"], [["Ga", "bel"], "🍴"], [["I", "gel"], "🦔"], [["Af", "fe"], "🐒"], [["Kak", "tus"], "🌵"],
    [["Schne", "cke"], "🐌"], [["Spin", "ne"], "🕷️"], [["Bie", "ne"], "🐝"], [["Del", "fin"], "🐬"],
    // 3 Silben
    [["Ra", "ke", "te"], "🚀"], [["Ba", "na", "ne"], "🍌"], [["To", "ma", "te"], "🍅"], [["E", "le", "fant"], "🐘"],
    [["Kro", "ko", "dil"], "🐊"], [["Gi", "raf", "fe"], "🦒"], [["A", "na", "nas"], "🍍"], [["Zi", "tro", "ne"], "🍋"],
    [["Pa", "pa", "gei"], "🦜"], [["Gi", "tar", "re"], "🎸"], [["Te", "le", "fon"], "☎️"], [["Pin", "gu", "in"], "🐧"],
    [["Ro", "bo", "ter"], "🤖"], [["Erd", "bee", "re"], "🍓"], [["As", "tro", "naut"], "🧑‍🚀"], [["Sa", "tel", "lit"], "🛰️"],
    [["Schmet", "ter", "ling"], "🦋"], [["Re", "gen", "schirm"], "☂️"], [["Fla", "min", "go"], "🦩"],
    [["Schild", "krö", "te"], "🐢"], [["Hub", "schrau", "ber"], "🚁"], [["Kän", "gu", "ru"], "🦘"], [["Rie", "sen", "rad"], "🎡"],
    // 4 Silben
    [["Scho", "ko", "la", "de"], "🍫"], [["Re", "gen", "bo", "gen"], "🌈"], [["A", "vo", "ca", "do"], "🥑"],
    [["Ba", "de", "wan", "ne"], "🛁"], [["Ta", "schen", "lam", "pe"], "🔦"],
    // 5 Silben
    [["Was", "ser", "me", "lo", "ne"], "🍉"], [["Di", "no", "sau", "ri", "er"], "🦕"], [["Ma", "ri", "en", "kä", "fer"], "🐞"],
  ],
};
