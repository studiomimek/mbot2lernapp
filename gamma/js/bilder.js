/* bilder.js – alle Illustrationen als SVG im Papierschnitt-Stil (flächige, überlappende Formen)
 * Jede Funktion liefert einen SVG-Text. Neue Orte und Figuren kommen hier dazu.
 */
"use strict";

(() => {
  const F = {
    himmel: "#bfe6ee", sonne: "#f9c23c", papier: "#fff8ea", tinte: "#23324a",
    sand: "#f2d9a0", sand2: "#e2c483", sand3: "#d3b06e",
    meer: "#2f9fb5", meer2: "#58b9c9", tief: "#176b87", tief2: "#125a73", riff: "#1b7f9c",
    koralle: "#f0715b", lila: "#b565c9", blatt: "#3f9b6c", blatt2: "#2c7d55",
    holz: "#9a6a44", holz2: "#7c5233", stein: "#b9a98f", rover: "#1f8fa8", rover2: "#187a91",
  };
  App.farben = F;
  const B = App.bilder;
  const svg = (vb, inhalt) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" aria-hidden="true">${inhalt}</svg>`;
  const welle = (y, hub) => `M0 ${y} Q64 ${y - hub} 128 ${y} T256 ${y} T384 ${y} T512 ${y} T640 ${y} T768 ${y} T896 ${y} T1024 ${y}`;

  /* ---------- Bausteine für „Papierschnitt mit etwas Tiefe“ ----------
   * Regel für alle Bilder: Nichts soll mit dem Hintergrund verbacken. Jedes Ding bekommt eine dunklere zweite
   * Schicht (schwarz, 10 bis 16 % deckend), einen hellen Rand oder Glanz (weiß, 25 bis 40 %) und, wenn es auf
   * dem Boden steht, einen weichen Schatten (flache Ellipse in Tinte, 13 bis 16 %). Nur Flächen, keine Verläufe. */
  const z1 = (n) => +n.toFixed(1);
  // Dunkle Sichel unten in einem Kreis. ab: Beginn unter der Mitte (Anteil des Radius), flach: je kleiner, desto
  // dicker; dreh: Grad um die Mitte (negativ = die Sichel wandert nach rechts unten)
  const sichel = (cx, cy, r, deck = 0.13, dreh = 0, ab = 0.3, flach = 0.6) => {
    const dy = r * ab, a = Math.sqrt(r * r - dy * dy), l = z1(cx - a), re = z1(cx + a), y = z1(cy + dy);
    return `<path d="M${l} ${y} A${r} ${r} 0 0 0 ${re} ${y} A${r} ${z1(r * flach)} 0 0 1 ${l} ${y}Z" fill="#000" opacity="${deck}"${dreh ? ` transform="rotate(${dreh} ${cx} ${cy})"` : ""}/>`;
  };
  // Kreisbogen im Uhrzeigersinn; von und bis in Grad (0 = rechts, 90 = unten, 180 = links, 270 = oben)
  const bogen = (cx, cy, r, von, bis) => {
    const p = (w) => `${z1(cx + r * Math.cos(w * Math.PI / 180))} ${z1(cy + r * Math.sin(w * Math.PI / 180))}`;
    return `M${p(von)} A${r} ${r} 0 0 1 ${p(bis)}`;
  };
  // Heller Glanzbogen, ohne weitere Angaben links oben
  const glanz = (cx, cy, r, von = 200, bis = 250, dick = 3.5, deck = 0.35) =>
    `<path d="${bogen(cx, cy, r, von, bis)}" stroke="#fff" stroke-width="${dick}" fill="none" stroke-linecap="round" opacity="${deck}"/>`;
  // Dinge aus dicken Strichen (Korallen, Anker): dunkler Streifen rechts (schraeg: rechts unten), heller links
  const strichTiefe = (d, dick, schraeg) => {
    const dx = z1(dick * (schraeg ? 0.2 : 0.22)), dy = schraeg ? z1(dick * 0.2) : 0;
    return `<path d="${d}" transform="translate(${dx} ${dy})" stroke="#000" stroke-width="${z1(dick * 0.36)}" stroke-linecap="round" fill="none" opacity=".13"/>
      <path d="${d}" transform="translate(${-dx} ${-dy})" stroke="#fff" stroke-width="${z1(dick * 0.17)}" stroke-linecap="round" fill="none" opacity=".24"/>`;
  };
  // Koralle mit Ästen: erst die Äste, dann der Stamm noch einmal darüber, damit sich die Streifen nicht kreuzen
  const astTiefe = (farbe, dick, stamm, aeste) => `${strichTiefe(aeste, dick)}
      <path d="${stamm}" stroke="${farbe}" stroke-width="${dick}" stroke-linecap="round" fill="none"/>${strichTiefe(stamm, dick)}`;

  /* ---------- Deko, die man nirgends sammeln kann (seit v0.28.2) ----------
   * REGEL: Was es in einem Spiel als Fundstück gibt (Muschel, Seestern, Münze, Perle, Stern, Anker, Boje …), liegt
   * nicht als bloße Deko in einem Ortsbild herum; das Kind hält es sonst für etwas zum Einsammeln. Ausnahme sind
   * große Dinge, die sichtbar zum Ort oder zu einem Spiel gehören (der große Anker am Wrack). Stattdessen: */
  const kiesel = (x, y, r = 9, farbe = F.stein) => `<ellipse cx="${x}" cy="${z1(y + r * 0.55)}" rx="${z1(r * 1.1)}" ry="${z1(r * 0.3)}" fill="${F.tinte}" opacity=".12"/>
    <ellipse cx="${x}" cy="${y}" rx="${r}" ry="${z1(r * 0.68)}" fill="${farbe}"/>
    <path d="M${z1(x - r)} ${y} A${r} ${z1(r * 0.68)} 0 0 0 ${z1(x + r)} ${y} A${r} ${z1(r * 0.3)} 0 0 1 ${z1(x - r)} ${y}Z" fill="#000" opacity=".13"/>
    <ellipse cx="${z1(x - r * 0.3)}" cy="${z1(y - r * 0.3)}" rx="${z1(r * 0.35)}" ry="${z1(r * 0.14)}" fill="#fff" opacity=".35"/>`;
  const kieselHaufen = (x, y, s = 1) => `${kiesel(x, y, 10 * s)}${kiesel(z1(x + 19 * s), z1(y + 5 * s), 7 * s, "#a39378")}${kiesel(z1(x - 15 * s), z1(y + 7 * s), 6 * s, "#cdbfa6")}`;
  // Treibholz: ein Ast mit einem Stummel
  const treibholz = (x, y, s = 1, dreh = -8) => `<g transform="translate(${x} ${y}) rotate(${dreh}) scale(${s})">
    <ellipse cx="0" cy="12" rx="56" ry="5" fill="${F.tinte}" opacity=".12"/>
    <path d="M-52 0 H52" stroke="#b08a63" stroke-width="15" stroke-linecap="round"/><path d="M8 -2 L30 -22" stroke="#b08a63" stroke-width="9" stroke-linecap="round"/>
    <path d="M-52 5 H52" stroke="#000" stroke-width="5" stroke-linecap="round" opacity=".13"/><path d="M-46 -4 H30" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".28"/>
    <circle cx="-52" cy="0" r="5" fill="#8f6d4b"/></g>`;
  // Strandgras: ein Büschel aus fünf Halmen
  const strandgras = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})" stroke-linecap="round" fill="none">
    <ellipse cx="0" cy="2" rx="22" ry="4" fill="${F.tinte}" opacity=".12"/>
    <path d="M-10 0 Q-20 -22 -26 -30 M-4 0 Q-8 -30 -6 -44 M2 0 Q8 -28 16 -40 M8 0 Q20 -18 30 -24" stroke="${F.blatt}" stroke-width="6"/>
    <path d="M-1 0 Q0 -24 4 -34" stroke="${F.blatt2}" stroke-width="6"/></g>`;
  // Schaum am Saum einer Welle: eine helle Linie entlang des Pfades d, dazu ein paar Bläschen [x, y, r]
  const schaum = (d, blasen = []) => `<path d="${d}" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round" opacity=".7"/>
    <g fill="#fff" opacity=".75">${blasen.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join("")}</g>`;
  // Korallenstück für den Meeresboden
  const korallenstueck = (x, y, farbe = F.koralle, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0 V-22 M0 -12 L-12 -24 M0 -14 L12 -28" stroke="${farbe}" stroke-width="8" stroke-linecap="round" fill="none"/>
    <path d="M3 0 V-20" stroke="#000" stroke-width="3" stroke-linecap="round" opacity=".13"/></g>`;
  // Kleiner Hafen an einer Anlegestelle (seit v0.28.2): eine runde Bucht mit Kaimauer, in der die Fähre liegt, und ein
  // Holzsteg mit zwei Pollern, der von ihr an Land führt (unter dem Steg kommt die Figur an). x, y = Mitte der Fähre
  // (wie am Tor in inhalt/welt.js); wasser = Farben des Meeres an diesem Ort. Keine Bojen und Anker: beides Fundstücke.
  const anleger = (x, y, wasser = F.meer, wasser2 = F.meer2) => `
    <path d="M${x - 152} ${y - 16} V${y + 26} Q${x - 152} ${y + 78} ${x - 96} ${y + 78} H${x + 96} Q${x + 152} ${y + 78} ${x + 152} ${y + 26} V${y - 16}Z" fill="${F.stein}"/>
    <path d="M${x - 152} ${y + 30} Q${x - 152} ${y + 78} ${x - 96} ${y + 78} H${x + 96} Q${x + 152} ${y + 78} ${x + 152} ${y + 30} Q${x + 148} ${y + 70} ${x + 96} ${y + 70} H${x - 96} Q${x - 148} ${y + 70} ${x - 152} ${y + 30}Z" fill="#000" opacity=".12"/>
    <path d="M${x - 140} ${y - 44} V${y + 24} Q${x - 140} ${y + 66} ${x - 94} ${y + 66} H${x + 94} Q${x + 140} ${y + 66} ${x + 140} ${y + 24} V${y - 44}Z" fill="${wasser}"/>
    <path d="M${x - 140} ${y + 12} q20 -9 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 V${y + 24} Q${x + 140} ${y + 66} ${x + 94} ${y + 66} H${x - 94} Q${x - 140} ${y + 66} ${x - 140} ${y + 24}Z" fill="${wasser2}" opacity=".55"/>
    <rect x="${x - 26}" y="${y + 46}" width="52" height="64" rx="4" fill="${F.holz}"/>
    <path d="M${x - 26} ${y + 62} h52 M${x - 26} ${y + 78} h52 M${x - 26} ${y + 94} h52" stroke="${F.holz2}" stroke-width="4"/>
    <rect x="${x + 16}" y="${y + 46}" width="10" height="64" fill="#000" opacity=".1"/>
    ${[-1, 1].map((k) => `<rect x="${x + k * 34 - 7}" y="${y + 50}" width="14" height="26" rx="5" fill="${F.holz2}"/><rect x="${x + k * 34 - 9}" y="${y + 46}" width="18" height="9" rx="4" fill="${F.papier}"/>`).join("")}`;

  /* ---------- Figuren (Innenteile, damit sie sich in Szenen einsetzen lassen) ---------- */
  const teil = {
    // Mit etwas Tiefe (seit v0.18.3): Schatten am Boden (Klasse „rs“, unter Wasser und im All ausgeblendet),
    // Glanz auf Gehäuse, Rädern und Augen
    rover: () => `
      <ellipse class="rs" cx="60" cy="100" rx="50" ry="4" fill="${F.tinte}" opacity=".16"/>
      <rect x="36" y="4" width="48" height="36" rx="8" fill="${F.papier}"/>
      <path d="M36 28 H84 V32 Q84 40 76 40 H44 Q36 40 36 32Z" fill="#000" opacity=".08"/>
      <rect x="42" y="9" width="36" height="23" rx="4" fill="${F.tinte}"/>
      <path d="M45 12 H55 L47 21Z" fill="#fff" opacity=".14"/>
      <text class="rover-anzeige" x="60" y="27" text-anchor="middle" font-family="Grundschrift, sans-serif" font-size="16" fill="#9ff3ff"></text>
      <rect x="12" y="36" width="96" height="40" rx="14" fill="${F.rover}"/>
      <path d="M12 60 H108 V62 Q108 76 94 76 H26 Q12 76 12 62Z" fill="${F.rover2}"/>
      <circle cx="42" cy="54" r="12" fill="${F.papier}"/><circle cx="78" cy="54" r="12" fill="${F.papier}"/>
      <circle cx="42" cy="55" r="5.5" fill="${F.tinte}"/><circle cx="78" cy="55" r="5.5" fill="${F.tinte}"/>
      <circle cx="44" cy="53" r="1.8" fill="#fff"/><circle cx="80" cy="53" r="1.8" fill="#fff"/>
      <path d="M26 42 Q60 37 94 42" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".3"/>
      <path d="M52 69 Q60 75 68 69" stroke="${F.papier}" stroke-width="3" fill="none" stroke-linecap="round"/>
      <circle cx="30" cy="84" r="17" fill="${F.tinte}"/><circle cx="30" cy="84" r="7" fill="${F.sonne}"/>
      <circle cx="90" cy="84" r="17" fill="${F.tinte}"/><circle cx="90" cy="84" r="7" fill="${F.sonne}"/>
      <path d="M18 79 A13 13 0 0 1 29 71 M78 79 A13 13 0 0 1 89 71" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".28"/>
      <circle cx="28" cy="82" r="2" fill="#fff" opacity=".6"/><circle cx="88" cy="82" r="2" fill="#fff" opacity=".6"/>`,

    // Papierschnitt mit etwas Tiefe (seit v0.18.2): Schatten am Boden, eine dunklere Schicht unter Beinen und
    // Bauch, Schatten unten an den Scheren, Glanz auf Panzer, Scheren und Augen, helle Wangen
    krebs: (farbe = F.koralle) => `
      <ellipse cx="70" cy="98" rx="46" ry="5.5" fill="${F.tinte}" opacity=".14"/>
      <g stroke="#000" opacity=".16" stroke-width="7" stroke-linecap="round" fill="none" transform="translate(0 3)">
        <path d="M36 74 L14 84 M38 82 L20 98 M104 74 L126 84 M102 82 L120 98"/>
        <path d="M40 62 Q22 58 21 44 M100 62 Q118 58 119 44"/>
      </g>
      <g stroke="${farbe}" stroke-width="7" stroke-linecap="round" fill="none">
        <path d="M36 74 L14 84 M38 82 L20 98 M104 74 L126 84 M102 82 L120 98"/>
        <path d="M40 62 Q22 58 21 44 M100 62 Q118 58 119 44"/>
        <path d="M58 50 L54 30 M82 50 L86 30"/>
      </g>
      <path d="M20 32 L9.4 21.4 A15 15 0 1 0 30.6 21.4 Z" fill="${farbe}"/>
      <path d="M120 32 L109.4 21.4 A15 15 0 1 0 130.6 21.4 Z" fill="${farbe}"/>
      <path d="M7 40 A15 15 0 0 0 33 40 A16 12 0 0 1 7 40Z M107 40 A15 15 0 0 0 133 40 A16 12 0 0 1 107 40Z" fill="#000" opacity=".15"/>
      <ellipse cx="11.5" cy="31" rx="3" ry="5.5" fill="#fff" opacity=".3" transform="rotate(20 11.5 31)"/>
      <ellipse cx="111.5" cy="31" rx="3" ry="5.5" fill="#fff" opacity=".3" transform="rotate(20 111.5 31)"/>
      <ellipse cx="70" cy="70" rx="42" ry="27" fill="${farbe}"/>
      <path d="M29 76 Q70 95 111 76 Q104 97 70 97 Q36 97 29 76Z" fill="#000" opacity=".15"/>
      <ellipse cx="70" cy="60" rx="30" ry="11" fill="#fff" opacity=".2"/>
      <path d="M46 55 Q70 45 94 55" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".4"/>
      <circle cx="42" cy="74" r="5.5" fill="#fff" opacity=".22"/><circle cx="98" cy="74" r="5.5" fill="#fff" opacity=".22"/>
      <circle cx="54" cy="26" r="9" fill="${F.papier}"/><circle cx="86" cy="26" r="9" fill="${F.papier}"/>
      <path d="M46 29 Q54 37 62 29 Q54 33 46 29Z M78 29 Q86 37 94 29 Q86 33 78 29Z" fill="#000" opacity=".1"/>
      <circle cx="55" cy="27" r="4.5" fill="${F.tinte}"/><circle cx="85" cy="27" r="4.5" fill="${F.tinte}"/>
      <circle cx="56.6" cy="25.2" r="1.6" fill="#fff"/><circle cx="86.6" cy="25.2" r="1.6" fill="#fff"/>
      <path d="M58 77 Q70 87 82 77" stroke="${F.tinte}" stroke-width="4" fill="none" stroke-linecap="round"/>`,

    // Farbe kommt über CSS „color“ (damit gezählte Fische umgefärbt werden können)
    fisch: () => `
      <path d="M68 32 L100 8 Q93 32 100 56 Z" fill="currentColor"/>
      <path d="M68 32 L100 8 Q93 32 100 56 Z" fill="#000" opacity=".16"/>
      <path d="M36 14 Q50 -2 64 16 Z" fill="currentColor"/>
      <path d="M36 14 Q50 -2 64 16 Z" fill="#000" opacity=".16"/>
      <ellipse cx="44" cy="33" rx="36" ry="22" fill="currentColor"/>
      <path d="M46 38 Q60 42 54 54 Q42 52 46 38Z" fill="#000" opacity=".16"/>
      <path d="M11 41 Q44 58 78 39 Q62 55 44 55 Q22 55 11 41Z" fill="#000" opacity=".12"/>
      <path d="M22 19 Q44 10 62 19" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round" opacity=".38"/>
      <circle cx="24" cy="27" r="7.5" fill="${F.papier}"/><circle cx="23" cy="28" r="3.6" fill="${F.tinte}"/>
      <circle cx="24.3" cy="26.6" r="1.3" fill="#fff"/>
      <path d="M10 39 Q16 43 22 39" stroke="${F.tinte}" stroke-width="3" fill="none" stroke-linecap="round"/>`,

    muschel: () => `
      <path d="M50 90 C18 82 4 52 11 33 C19 13 37 6 50 6 C63 6 81 13 89 33 C96 52 82 82 50 90Z" fill="#f7b9a3"/>
      <path d="M50 90 C82 82 96 52 89 33 Q80 62 50 90Z" fill="#000" opacity=".1"/>
      <g stroke="#e48d76" stroke-width="3.5" stroke-linecap="round"><path d="M50 86 L22 30 M50 86 L36 14 M50 86 L50 10 M50 86 L64 14 M50 86 L78 30"/></g>
      <path d="M18 31 Q22 18 39 13" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".4"/>
      <path d="M36 84 Q50 99 64 84 Z" fill="#e48d76"/>`,

    seestern: () => {
      const pts = [];
      for (let i = 0; i < 10; i++) {
        const r = i % 2 ? 19 : 42, w = -Math.PI / 2 + i * Math.PI / 5;
        pts.push(`${(50 + r * Math.cos(w)).toFixed(1)},${(52 + r * Math.sin(w)).toFixed(1)}`);
      }
      // darunter derselbe Stern noch einmal, dunkler und ein Stück tiefer: das zweite Blatt
      return `<polygon points="${pts.join(" ")}" fill="#d9822b" stroke="#d9822b" stroke-width="10" stroke-linejoin="round" transform="translate(0 3.5)"/>
        <polygon points="${pts.join(" ")}" fill="#f59a3c" stroke="#f59a3c" stroke-width="10" stroke-linejoin="round"/>
        <path d="M48.7 17 L39.8 38.1 L19 39.8" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".35"/>
        <g fill="#fbd08a"><circle cx="50" cy="52" r="5"/><circle cx="50" cy="30" r="3.5"/><circle cx="71" cy="45" r="3.5"/><circle cx="63" cy="70" r="3.5"/><circle cx="37" cy="70" r="3.5"/><circle cx="29" cy="45" r="3.5"/></g>`;
    },

    perle: () => `
      <path d="M8 52 Q50 20 92 52 Q50 44 8 52Z" fill="#9486d6"/>
      <path d="M20 46 Q50 26 80 46" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".35"/>
      <path d="M8 54 Q50 108 92 54 Q50 72 8 54Z" fill="#7d6fc1"/>
      <path d="M8 54 Q50 108 92 54 Q50 96 8 54Z" fill="#000" opacity=".12"/>
      <circle cx="50" cy="52" r="21" fill="#fbf3ff"/>${sichel(50, 52, 21, 0.12, 0, 0.4, 0.65)}<circle cx="43" cy="45" r="6.5" fill="#fff"/>`,

    truhe: () => `
      <path d="M10 46 Q10 14 50 14 Q90 14 90 46 Z" fill="#b07a4c"/>
      <rect x="10" y="44" width="80" height="42" rx="6" fill="${F.holz}"/>
      <path d="M27 18 V86 M73 18 V86" stroke="${F.holz2}" stroke-width="6"/>
      <path d="M10 74 H90 V80 A6 6 0 0 1 84 86 H16 A6 6 0 0 1 10 80Z" fill="#000" opacity=".13"/>
      <path d="M35 21 Q50 18 65 21" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round" opacity=".35"/>
      <rect x="10" y="41" width="80" height="8" fill="${F.sonne}"/>
      <rect x="42" y="37" width="16" height="22" rx="4" fill="${F.sonne}"/><circle cx="50" cy="49" r="3.2" fill="${F.tinte}"/>`,
  };

  B.rover = () => svg("0 0 120 104", teil.rover());
  B.krebs = (farbe) => svg("0 0 140 104", teil.krebs(farbe));
  B.fisch = () => svg("0 0 104 64", teil.fisch());
  B.muschel = () => svg("0 0 100 100", teil.muschel());
  B.seestern = () => svg("0 0 100 100", teil.seestern());
  B.perle = () => svg("0 0 100 100", teil.perle());
  B.truhe = () => svg("0 0 100 100", teil.truhe());

  /* ---------- Einstiege in der Welt ---------- */
  B.figurKrebse = () => svg("0 0 240 150", `
    <g transform="translate(96 4) scale(.82)">${teil.krebs("#f59a3c")}</g>
    <g transform="translate(6 44)">${teil.krebs(F.koralle)}</g>`);

  B.figurSandspur = () => svg("0 0 240 150", `
    <ellipse cx="120" cy="82" rx="114" ry="62" fill="${F.sand2}"/>
    <ellipse cx="120" cy="84" rx="98" ry="50" fill="${F.sand3}" opacity=".55"/>
    <g stroke="#000" opacity=".13" stroke-width="11" stroke-linecap="round" stroke-linejoin="round" fill="none" transform="translate(0 3.5)">
      <path d="M52 112 V62 L78 96 L104 62 V112"/>
      <path d="M134 112 L158 58 L182 112 M144 94 H172"/>
    </g>
    <g stroke="${F.papier}" stroke-width="11" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <path d="M52 112 V62 L78 96 L104 62 V112"/>
      <path d="M134 112 L158 58 L182 112 M144 94 H172"/>
    </g>
    <circle cx="182" cy="112" r="11" fill="${F.koralle}"/>${sichel(182, 112, 11)}<circle cx="178.5" cy="108.5" r="2.6" fill="#fff" opacity=".4"/>`);

  B.figurSchwarm = () => svg("0 0 260 170", `
    <g style="color:#f9c23c" transform="translate(120 8) scale(1.05)">${teil.fisch()}</g>
    <g style="color:#f0715b" transform="translate(10 52) scale(1.25)">${teil.fisch()}</g>
    <g style="color:#fff8ea" transform="translate(150 96) scale(.95)">${teil.fisch()}</g>`);

  /* ---------- Zeichen und Knöpfe ---------- */
  // Fach-Zeichen: „ABC“ = Deutsch (Buchstaben), „123“ = Mathe (Zahlen). Ohne Fach: Dreieck = freies Spiel.
  const FACH = { deutsch: [F.koralle, "ABC"], mathe: [F.meer, "123"] };
  B.fach = (name) => {
    const f = FACH[name];
    if (!f) return svg("0 0 100 100", `<circle cx="50" cy="50" r="48" fill="${F.sonne}"/>${sichel(50, 50, 48, 0.12)}<path d="M40 30 L74 50 L40 70Z" fill="${F.tinte}" stroke="${F.tinte}" stroke-width="8" stroke-linejoin="round"/>`);
    return svg("0 0 100 100", `<circle cx="50" cy="50" r="48" fill="${f[0]}"/>${sichel(50, 50, 48, 0.12)}
      <text x="50" y="64" text-anchor="middle" font-family="-apple-system, 'Segoe UI', sans-serif" font-size="37" font-weight="800" fill="#fff">${f[1]}</text>`);
  };
  // Zeichenpaar eines Spiels: links das Fach, rechts das Fundstück, das es dort gibt (freie Spiele: nur das Dreieck).
  // e = Einstieg aus inhalt/welt.js. Dasselbe Paar steht am Spiel in der Welt, auf der Karte und beim Krebs.
  // Ein Spielplatz trägt statt des Fach-Zeichens das Werkzeug, das ihn öffnet („zeichen“ am Einstieg).
  B.zeichen = (e, klasse = "", zusatz = "") => `<span class="zeichen${klasse}"${zusatz}>${
    e.zeichen && B[e.zeichen] ? `<i class="z-fach z-werkzeug">${B[e.zeichen]()}</i>` : `<i class="z-fach">${B.fach(e.fach)}</i>`}${
    e.fund && B[e.fund] ? `<i class="z-fund">${B[e.fund]()}</i>` : ""}</span>`;
  // Funk-Krebs (Knopf oben in der Welt): der Mechaniker mit Helm und Funkgerät
  B.funkKrebs = () => svg("0 0 100 100", `
    <g transform="translate(0 32) scale(.62)">${teil.krebs("#4a90c2")}
      <path d="M46 56 Q46 30 70 30 Q94 30 94 56Z" fill="${F.sonne}"/><path d="M94 56 Q94 30 70 30 Q85 34 85 56Z" fill="#000" opacity=".12"/>
      <rect x="40" y="52" width="60" height="9" rx="4.5" fill="#e8a81c"/></g>
    <path d="M80 26 V9" stroke="${F.tinte}" stroke-width="3.5" stroke-linecap="round"/><circle cx="80" cy="8" r="3.5" fill="${F.koralle}"/>
    <rect x="66" y="24" width="20" height="32" rx="5" fill="${F.tinte}"/><rect x="70" y="29" width="12" height="9" rx="2" fill="#9ff3ff"/>
    <path d="M71 44 H81 M71 49 H81" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".5"/>
    <path d="M89 3 Q95 8 89 14 M94 -2 Q104 8 94 18" stroke="${F.koralle}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`);

  B.pfeil = (richtung) => {
    const dreh = { oben: 0, rechts: 90, unten: 180, links: 270 }[richtung] || 0;
    return svg("0 0 100 100", `<g transform="rotate(${dreh} 50 50)"><path d="M26 60 L50 34 L74 60" stroke="${F.tinte}" stroke-width="13" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>`);
  };
  B.schloss = () => svg("0 0 100 100", `<path d="M32 46 V34 Q32 14 50 14 Q68 14 68 34 V46" stroke="${F.tinte}" stroke-width="9" fill="none" stroke-linecap="round"/><rect x="22" y="44" width="56" height="42" rx="9" fill="${F.sonne}"/><circle cx="50" cy="64" r="6" fill="${F.tinte}"/>`);
  B.zurueck = () => svg("0 0 100 100", `<path d="M58 26 L32 50 L58 74" stroke="${F.tinte}" stroke-width="13" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`);
  B.lautsprecher = () => svg("0 0 100 100", `<path d="M16 40 H32 L54 22 V78 L32 60 H16Z" fill="${F.tinte}"/><path d="M66 36 Q78 50 66 64 M76 26 Q96 50 76 74" stroke="${F.tinte}" stroke-width="7" fill="none" stroke-linecap="round"/>`);
  B.auge = () => svg("0 0 100 100", `<path d="M8 50 Q50 10 92 50 Q50 90 8 50Z" fill="${F.papier}" stroke="${F.tinte}" stroke-width="7" stroke-linejoin="round"/><circle cx="50" cy="50" r="15" fill="${F.tinte}"/>`);
  B.spielen = () => svg("0 0 100 100", `<path d="M36 24 L78 50 L36 76Z" fill="${F.papier}" stroke="${F.papier}" stroke-width="10" stroke-linejoin="round"/>`);

  /* ---------- Orte ---------- */
  // Strand: Horizont weit oben, darunter viel Sand zum Fahren
  B.strand = () => svg("0 0 1024 768", `
    <rect width="1024" height="768" fill="${F.himmel}"/>
    <circle cx="860" cy="84" r="78" fill="#fff" opacity=".35"/><circle cx="860" cy="84" r="50" fill="${F.sonne}"/>
    <g fill="#fff" opacity=".92"><ellipse cx="230" cy="70" rx="76" ry="22"/><ellipse cx="278" cy="54" rx="48" ry="22"/><ellipse cx="560" cy="110" rx="58" ry="17"/><ellipse cx="596" cy="98" rx="36" ry="16"/></g>
    <g stroke="${F.tinte}" stroke-width="3.5" fill="none" stroke-linecap="round"><path d="M392 60 q9 -10 18 0 q9 -10 18 0"/><path d="M450 96 q7 -8 14 0 q7 -8 14 0"/><path d="M690 52 q8 -9 16 0 q8 -9 16 0"/></g>
    <rect y="186" width="1024" height="160" fill="${F.meer}"/>
    <g transform="translate(0 -76)">
      <g fill="${F.tief}" opacity=".6"><path d="M610 262 Q680 206 772 232 Q850 210 930 262 Z"/><path d="M755 238 V192 Q755 166 768 150 Q781 166 781 192 V238 Z"/><path d="M755 212 L738 240 H755Z M781 212 L798 240 H781Z"/></g>
      <circle cx="768" cy="190" r="6" fill="${F.meer2}" opacity=".7"/>
    </g>
    <ellipse cx="332" cy="243" rx="32" ry="3" fill="${F.tinte}" opacity=".13"/>
    <path d="M300 226 h64 l-12 16 h-40z" fill="${F.papier}"/><path d="M307.5 236 H356.5 L352 242 H312Z" fill="#000" opacity=".14"/>
    <path d="M332 222 V176 L366 222Z" fill="${F.koralle}"/><path d="M332 176 L366 222 H355 L332 191Z" fill="#000" opacity=".13"/>
    <path d="M328 222 V184 L304 222Z" fill="${F.papier}"/><path d="M304 222 L309 214 H328 V222Z" fill="#000" opacity=".08"/>
    <path d="${welle(232, 10)} V262 H0Z" fill="${F.meer2}" opacity=".5"/>
    <path d="${welle(276, 12)} V320 H0Z" fill="${F.meer2}" opacity=".85"/>
    <path d="M0 318 Q180 286 400 306 T800 298 T1024 310 V768 H0Z" fill="${F.sand2}"/>
    <path d="M0 344 Q200 314 420 334 T820 326 T1024 338 V768 H0Z" fill="${F.sand}"/>
    <g transform="translate(0 -112)">
      <ellipse cx="134" cy="508" rx="60" ry="9" fill="${F.tinte}" opacity=".13"/>
      <path d="M98 500 Q82 400 122 306 L144 312 Q114 400 130 500Z" fill="${F.holz}"/>
      <path d="M144 312 Q114 400 130 500 H120 Q106 400 135 309.5Z" fill="#000" opacity=".14"/>
      <path d="M104 480 Q90 400 127 315" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round" opacity=".25"/>
      <ellipse cx="114" cy="502" rx="44" ry="13" fill="${F.sand2}"/>
      <g fill="${F.blatt}"><path d="M132 308 Q60 252 6 296 Q70 284 132 308Z"/><path d="M132 308 Q92 222 28 218 Q92 248 132 308Z"/><path d="M132 308 Q154 222 228 210 Q174 250 132 308Z"/><path d="M132 308 Q214 256 268 302 Q198 286 132 308Z"/></g>
      <g fill="#000" opacity=".14"><path d="M132 308 Q70 284 6 296 Q69 276 132 308Z"/><path d="M132 308 Q92 248 28 218 Q93 241 132 308Z"/><path d="M132 308 Q174 250 228 210 Q171 243 132 308Z"/><path d="M132 308 Q198 286 268 302 Q200 277 132 308Z"/></g>
      <path d="M132 308 Q118 236 152 190 Q154 254 132 308Z" fill="${F.blatt2}"/>
      <circle cx="126" cy="312" r="10" fill="${F.holz2}"/><circle cx="142" cy="318" r="9" fill="${F.holz2}"/>
      <circle cx="123" cy="309" r="2.5" fill="#fff" opacity=".3"/><circle cx="139.5" cy="315.5" r="2.2" fill="#fff" opacity=".3"/>
    </g>
    <g transform="translate(0 -120)"><ellipse cx="930" cy="549" rx="68" ry="8" fill="${F.tinte}" opacity=".14"/>
      <path d="M866 520 Q884 478 934 488 Q986 498 990 540 Q934 558 866 542Z" fill="${F.stein}"/><path d="M916 532 Q928 506 958 512 Q984 520 986 544 Q950 552 916 546Z" fill="#a39378"/>
      <path d="M880 512 Q892 490 926 492" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".3"/></g>
    <!-- Sandburg -->
    <!-- kräftigere Farben, Schatten am Boden und dunklere Seiten, damit sie sich vom Sand abhebt (v0.18.3) -->
    <g><ellipse cx="562" cy="394" rx="66" ry="9" fill="${F.tinte}" opacity=".14"/>
      <path d="M498 396 Q520 380 560 382 Q600 380 622 396Z" fill="#cda45c"/>
      <rect x="522" y="352" width="76" height="40" fill="#d2a85e"/><rect x="522" y="352" width="76" height="7" fill="#000" opacity=".1"/>
      <rect x="514" y="330" width="24" height="62" fill="#e3bb72"/><rect x="582" y="330" width="24" height="62" fill="#e3bb72"/><rect x="548" y="318" width="24" height="74" fill="#e3bb72"/>
      <path d="M514 330 h6 v-7 h6 v7 h6 v-7 h6 v7 M582 330 h6 v-7 h6 v7 h6 v-7 h6 v7 M548 318 h6 v-7 h6 v7 h6 v-7 h6 v7" stroke="#e3bb72" stroke-width="6" fill="none"/>
      <g fill="#000" opacity=".12"><rect x="528" y="330" width="10" height="62"/><rect x="596" y="330" width="10" height="62"/><rect x="562" y="318" width="10" height="74"/></g>
      <g fill="#fff" opacity=".3"><rect x="514" y="333" width="5" height="56"/><rect x="582" y="333" width="5" height="56"/><rect x="548" y="321" width="5" height="68"/></g>
      <g fill="${F.holz2}" opacity=".75"><rect x="522" y="344" width="6" height="11" rx="3"/><rect x="590" y="344" width="6" height="11" rx="3"/><rect x="556" y="334" width="6" height="11" rx="3"/></g>
      <path d="M552 392 v-22 q8 -8 16 0 v22z" fill="${F.holz2}"/><path d="M560 318 V288" stroke="${F.holz2}" stroke-width="4"/><path d="M560 288 L584 296 L560 304Z" fill="${F.koralle}"/></g>
    <!-- Kleinkram im Sand: nichts, was man sammeln kann (siehe Regel bei „kiesel“) -->
    ${treibholz(926, 642, 0.9, -10)}${kieselHaufen(648, 676)}${strandgras(76, 642, 1.1)}${strandgras(986, 420, 0.8)}
    ${schaum("M0 321 Q180 289 400 309 T800 301 T1024 313", [[150, 312, 4], [520, 318, 3.5], [880, 316, 4]])}
    <ellipse cx="240" cy="456" rx="25" ry="4.5" fill="${F.tinte}" opacity=".15"/>
    <circle cx="238" cy="430" r="26" fill="${F.papier}"/><path d="M238 404 A26 26 0 0 1 264 430 L238 430Z" fill="${F.koralle}"/><path d="M238 456 A26 26 0 0 1 212 430 L238 430Z" fill="${F.meer}"/>
    ${sichel(238, 430, 26, 0.13, 0, 0.38, 0.65)}${glanz(238, 430, 20, 292, 338, 3, 0.4)}
    <g fill="${F.sand2}"><ellipse cx="660" cy="470" rx="9" ry="6"/><ellipse cx="690" cy="488" rx="9" ry="6"/><ellipse cx="664" cy="508" rx="9" ry="6"/><ellipse cx="694" cy="526" rx="9" ry="6"/>
      <circle cx="420" cy="430" r="5"/><circle cx="820" cy="560" r="5"/><circle cx="330" cy="660" r="4"/><circle cx="500" cy="600" r="5"/><circle cx="960" cy="470" r="4"/><circle cx="130" cy="520" r="5"/></g>
    <path d="M0 704 Q130 676 260 698 T520 690 T780 702 T1024 686 V768 H0Z" fill="${F.meer2}"/>
    <path d="M0 732 Q140 714 280 730 T560 724 T840 734 T1024 720 V768 H0Z" fill="${F.meer}"/>
    ${schaum("M0 702 Q130 674 260 696 T520 688 T780 700 T1024 684", [[90, 682, 4], [118, 674, 3], [400, 684, 4], [640, 690, 3.5], [668, 684, 3], [930, 684, 4]])}`);

  B.riff = () => svg("0 0 1024 768", `
    <rect width="1024" height="768" fill="${F.riff}"/>
    <path d="M0 0 H1024 V70 Q960 94 896 70 T768 70 T640 70 T512 70 T384 70 T256 70 T128 70 T0 70Z" fill="${F.meer2}"/>
    <g fill="#fff" opacity=".07"><path d="M190 70 L60 768 H270Z"/><path d="M520 70 L470 768 H700Z"/><path d="M830 70 L860 768 H1010Z"/></g>
    <path d="M0 566 Q120 504 260 544 T520 524 T800 552 T1024 504 V768 H0Z" fill="${F.tief}"/>
    <g fill="${F.tief2}" opacity=".85" transform="translate(1024 0) scale(-1 1)">
      <path d="M694 536 Q712 480 760 470 L944 446 Q986 478 972 540 Z"/>
      <path d="M822 464 L828 322 L840 322 L844 460Z"/><path d="M840 334 L908 368 L840 392Z"/>
    </g>
    <path d="M0 664 Q160 630 320 656 T640 650 T1024 642 V768 H0Z" fill="${F.sand2}"/>
    <path d="M0 712 Q200 690 400 706 T800 702 T1024 696 V768 H0Z" fill="${F.sand}"/>
    <ellipse cx="114" cy="684" rx="27" ry="5" fill="${F.tinte}" opacity=".14"/><ellipse cx="932" cy="675" rx="24" ry="4.5" fill="${F.tinte}" opacity=".14"/>
    <g stroke="${F.koralle}" stroke-width="18" stroke-linecap="round" fill="none"><path d="M112 676 V596 M112 634 L80 592 M112 648 L150 600"/></g>
    ${astTiefe(F.koralle, 18, "M112 676 V596", "M112 634 L80 592 M112 648 L150 600")}
    <g stroke="${F.lila}" stroke-width="16" stroke-linecap="round" fill="none"><path d="M930 668 V610 M930 640 L902 606 M930 648 L962 612"/></g>
    ${astTiefe(F.lila, 16, "M930 668 V610", "M930 640 L902 606 M930 648 L962 612")}
    <g class="tang" stroke="${F.blatt}" stroke-width="14" stroke-linecap="round" fill="none">
      <path d="M236 684 Q216 624 238 564 Q258 514 236 464"/><path d="M272 688 Q286 634 268 594 Q254 554 274 520"/>
    </g>
    <g class="tang" stroke="${F.blatt2}" stroke-width="14" stroke-linecap="round" fill="none">
      <path d="M760 690 Q778 640 760 596 Q744 560 762 524"/><path d="M800 694 Q786 650 802 612"/>
    </g>
    <ellipse cx="576" cy="718" rx="58" ry="6" fill="${F.tinte}" opacity=".14"/>
    <path d="M520 700 Q540 664 584 672 Q624 680 628 712 Q574 724 520 716Z" fill="#8fa3ad"/>
    <path d="M572 708 Q584 690 606 694 Q622 699 624 711 Q598 718 572 716Z" fill="#000" opacity=".13"/>
    <path d="M534 696 Q546 676 580 678" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round" opacity=".3"/>
    <g class="blasen" fill="#fff" opacity=".5">
      <circle cx="330" cy="430" r="8"/><circle cx="346" cy="388" r="5"/><circle cx="660" cy="300" r="7"/><circle cx="672" cy="262" r="4"/><circle cx="150" cy="330" r="6"/>
    </g>`);

  /* ---------- Hintergründe für Aufgaben ---------- */
  B.sandNah = () => svg("0 0 1024 768", `
    <rect width="1024" height="768" fill="${F.sand}"/>
    <path d="M0 0 H1024 V56 Q960 78 896 56 T768 56 T640 56 T512 56 T384 56 T256 56 T128 56 T0 56Z" fill="${F.meer2}"/>
    <path d="M0 0 H1024 V26 Q960 44 896 26 T768 26 T640 26 T512 26 T384 26 T256 26 T128 26 T0 26Z" fill="${F.meer}"/>
    <g fill="${F.sand2}">
      <circle cx="90" cy="180" r="6"/><circle cx="960" cy="240" r="5"/><circle cx="70" cy="420" r="5"/><circle cx="940" cy="520" r="6"/>
      <circle cx="520" cy="740" r="5"/><circle cx="220" cy="730" r="4"/><circle cx="830" cy="738" r="4"/>
    </g>`);

  B.wasserNah = () => svg("0 0 1024 768", `
    <rect width="1024" height="768" fill="${F.riff}"/>
    <path d="M0 0 H1024 V44 Q960 66 896 44 T768 44 T640 44 T512 44 T384 44 T256 44 T128 44 T0 44Z" fill="${F.meer2}"/>
    <g fill="#fff" opacity=".06"><path d="M240 44 L120 768 H330Z"/><path d="M700 44 L690 768 H900Z"/></g>
    <path d="M0 716 Q200 694 400 710 T800 706 T1024 700 V768 H0Z" fill="${F.sand2}"/>
    <g class="tang" stroke="${F.blatt}" stroke-width="14" stroke-linecap="round" fill="none">
      <path d="M44 720 Q24 660 46 600 Q66 550 44 500"/><path d="M84 724 Q98 670 80 630"/>
    </g>
    <g class="tang" stroke="${F.blatt2}" stroke-width="14" stroke-linecap="round" fill="none">
      <path d="M980 720 Q998 664 980 610 Q964 566 982 524"/><path d="M944 724 Q932 680 946 642"/>
    </g>`);
  /* ---------- Raketenstation ---------- */
  const N = { nacht: "#27365f", nacht2: "#33457a", boden: "#8f95ad", boden2: "#a6abc0", bau: "#dfe2ec", stahl: "#c8ccd9", platz: "#6f7590" };
  const sterne = (liste) => `<g class="sterne" fill="${F.papier}">${liste.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join("")}</g>`;
  const zacken = (cx, cy, aussen, innen) => {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? innen : aussen, w = -Math.PI / 2 + i * Math.PI / 5;
      pts.push(`${(cx + r * Math.cos(w)).toFixed(1)},${(cy + r * Math.sin(w)).toFixed(1)}`);
    }
    return pts.join(" ");
  };

  // Tiefe für die Rakete (auch für die große Rakete im Bau): rechte Flosse und rechte Seite dunkler,
  // Glanz auf der Spitze und im Fenster
  const raketeTiefe = `
    <path d="M78 150 L98 196 H78Z" fill="#000" opacity=".13"/>
    <path d="M78 186 V84 Q78 36 50 4 Q67 38 67 84 V186Z" fill="#000" opacity=".1"/>
    <path d="M37 50 Q40 34 47 20" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".35"/>
    <circle cx="46.5" cy="88.5" r="2.6" fill="#fff" opacity=".6"/>`;
  // stehende Rakete, 100 breit und 200 hoch
  teil.rakete = () => `
    <path d="M22 150 L2 196 H22Z M78 150 L98 196 H78Z" fill="${F.koralle}"/>
    <path d="M22 186 V84 Q22 36 50 4 Q78 36 78 84 V186Z" fill="${F.papier}"/>
    <path d="M30 60 Q36 30 50 4 Q64 30 70 60Z" fill="${F.koralle}"/>
    <circle cx="50" cy="92" r="15" fill="${F.tinte}"/><circle cx="50" cy="92" r="10" fill="${F.meer2}"/>
    <rect x="22" y="136" width="56" height="12" fill="${F.koralle}"/>${raketeTiefe}
    <rect x="34" y="186" width="32" height="10" fill="${F.tinte}"/>`;
  // Stern in der Farbe aus CSS „color“ (bleibt flach: Er wird auch halb durchsichtig als leerer Stern benutzt)
  teil.stern = () => `<polygon points="${zacken(50, 53, 40, 18)}" fill="currentColor" stroke="currentColor" stroke-width="9" stroke-linejoin="round"/>`;
  // Dunklere zweite Schicht, die unter einen Stern mit fester Farbe gelegt wird
  const sternUnten = (farbe) => `<polygon points="${zacken(50, 57, 40, 18)}" fill="${farbe}" stroke="${farbe}" stroke-width="9" stroke-linejoin="round"/>`;

  B.sternchen = () => svg("0 0 100 100", teil.stern());
  // Fundstücke der Raketenstation
  B.stern = () => svg("0 0 100 100", `${sternUnten("#dba21f")}<g style="color:${F.sonne}">${teil.stern()}</g>
    <path d="M49 20.5 L40.8 40.3 L20 42" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".45"/>
    <circle cx="40" cy="50" r="4" fill="${F.tinte}"/><circle cx="60" cy="50" r="4" fill="${F.tinte}"/><circle cx="41.3" cy="48.7" r="1.4" fill="#fff"/><circle cx="61.3" cy="48.7" r="1.4" fill="#fff"/>
    <path d="M41 62 Q50 70 59 62" stroke="${F.tinte}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`);
  B.planet = () => svg("0 0 100 100", `
    <circle cx="50" cy="50" r="30" fill="#7fc8a9"/><path d="M26 40 Q50 28 74 40 Q50 46 26 40Z" fill="#5fae8d"/><path d="M24 58 Q50 70 76 58 Q50 62 24 58Z" fill="#5fae8d"/>
    ${sichel(50, 50, 30, 0.13, -35)}${glanz(50, 50, 23)}
    <ellipse cx="50" cy="52" rx="46" ry="11" fill="none" stroke="#f59a3c" stroke-width="7" transform="rotate(-16 50 52)"/>`);
  B.rakete = () => svg("-50 0 200 200", teil.rakete());

  // Die große Rakete im Bau: Sie wächst von unten nach oben (stufe 0 bis 3), die Düse kommt mit dem Triebwerk.
  // Daneben am Turm die Tankanzeige (tank 0 bis 1).
  // Seit v0.25 ist es die Rakete des Kindes aus der Raketenhalle (App.meineRakete, gezeichnet von bauRakete weiter
  // unten; ohne Umbau die einfache Rakete). Was noch nicht gebaut ist, steht blass da; die Triebwerke kommen erst
  // mit dem Triebwerk vom Krebs (fertig).
  let bauNr = 0;
  const raketeImBau = (bau) => {
    const wahl = App.meineRakete ? App.meineRakete() : {}, m = B.bauMasse(wahl), ganz = bauRakete(wahl, false);
    const grenze = Math.round(m.unten - (m.unten - m.oben) * Math.min(3, bau.stufe) / 3), id = `raketenbau${++bauNr}`;
    return `<g transform="translate(485 44) scale(.5)">
      ${bau.fertig ? `<ellipse cx="150" cy="549" rx="104" ry="7" fill="${F.tinte}" opacity=".2"/>${ganz}`
        : `<g opacity=".2">${ganz}</g><clipPath id="${id}"><rect x="0" y="${grenze}" width="300" height="${Math.max(0, 520 - grenze)}"/></clipPath><g clip-path="url(#${id})">${ganz}</g>`}</g>
      <rect x="436" y="196" width="18" height="124" rx="6" fill="${N.platz}"/>
      <rect x="439" y="${(317 - 118 * bau.tank).toFixed(0)}" width="12" height="${(118 * bau.tank).toFixed(0)}" rx="4" fill="${F.sonne}"/>`;
  };

  // Raketenstation: Gebäude und Rakete stehen weit hinten, davor viel Platz zum Fahren.
  // bau = Baufortschritt der großen Rakete (ohne Angabe: fertig, z. B. für die Karte)
  B.station = (bau = { stufe: 3, tank: 1, fertig: true }) => svg("0 0 1024 768", `
    <rect width="1024" height="768" fill="${N.nacht}"/>
    ${sterne([[60, 50, 3], [250, 40, 2], [330, 130, 2], [400, 60, 3], [690, 70, 2], [752, 150, 3], [800, 40, 2], [900, 110, 2.5], [980, 190, 2], [36, 190, 2], [960, 40, 3], [300, 200, 2], [620, 170, 2]])}
    <circle cx="320" cy="92" r="52" fill="#fff3c9"/><circle cx="302" cy="78" r="11" fill="#ecdca6"/><circle cx="336" cy="110" r="8" fill="#ecdca6"/><circle cx="342" cy="70" r="5" fill="#ecdca6"/>
    <path d="M0 252 Q170 206 340 236 T680 222 T1024 232 V768 H0Z" fill="${N.nacht2}"/>
    <path d="M0 300 Q200 280 420 294 T820 288 T1024 298 V768 H0Z" fill="${N.boden}"/>
    <path d="M0 338 Q220 320 440 332 T840 326 T1024 334 V768 H0Z" fill="${N.boden2}"/>
    <g transform="translate(0 -140)">
      <ellipse cx="164" cy="457" rx="102" ry="7" fill="${F.tinte}" opacity=".16"/><ellipse cx="884" cy="457" rx="26" ry="4" fill="${F.tinte}" opacity=".16"/>
      <path d="M70 456 V392 Q70 330 160 330 Q250 330 250 392 V456Z" fill="${N.bau}"/>
      <path d="M250 456 V392 Q250 330 160 330 Q232 336 232 392 V456Z" fill="#000" opacity=".1"/>
      <path d="M77 440 V394 Q77 340 132 335.5" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".4"/>
      <rect x="96" y="382" width="34" height="26" rx="5" fill="${F.sonne}"/><rect x="143" y="382" width="34" height="26" rx="5" fill="${F.sonne}"/><rect x="190" y="382" width="34" height="26" rx="5" fill="${F.sonne}"/>
      <rect x="142" y="420" width="36" height="36" rx="4" fill="${N.platz}"/>
      <rect x="156" y="298" width="8" height="36" fill="${N.stahl}"/><circle cx="160" cy="294" r="8" fill="${F.koralle}"/>
      <rect x="876" y="340" width="12" height="116" fill="${N.stahl}"/><rect x="883" y="356" width="5" height="100" fill="#000" opacity=".14"/>
      <g transform="rotate(-32 882 332)"><path d="M822 332 Q882 392 942 332Z" fill="${N.bau}"/><path d="M822 332 Q882 392 942 332 Q882 374 822 332Z" fill="#000" opacity=".13"/><rect x="879" y="296" width="6" height="40" fill="${N.stahl}"/><circle cx="882" cy="294" r="7" fill="${F.koralle}"/></g>
    </g>
    <ellipse cx="560" cy="330" rx="136" ry="18" fill="${N.platz}"/>
    <rect x="470" y="86" width="18" height="244" fill="${N.stahl}"/><rect x="482" y="86" width="6" height="244" fill="#000" opacity=".12"/><rect x="470" y="86" width="3" height="244" fill="#fff" opacity=".3"/>
    <path d="M470 116 L488 150 M488 116 L470 150 M470 186 L488 220 M488 186 L470 220 M470 256 L488 290 M488 256 L470 290" stroke="${N.platz}" stroke-width="3.5"/>
    <rect x="488" y="160" width="26" height="8" fill="${N.stahl}"/>
    ${raketeImBau(bau)}
    <!-- Lampen, Kisten, Markierungen -->
    <g><ellipse cx="331" cy="334" rx="16" ry="3" fill="${F.tinte}" opacity=".16"/><ellipse cx="771" cy="334" rx="16" ry="3" fill="${F.tinte}" opacity=".16"/>
      <rect x="326" y="270" width="8" height="64" fill="${N.stahl}"/><rect x="330" y="278" width="4" height="56" fill="#000" opacity=".14"/><circle cx="330" cy="266" r="12" fill="${F.sonne}"/><circle cx="330" cy="266" r="24" fill="${F.sonne}" opacity=".2"/><circle cx="326" cy="262" r="3" fill="#fff" opacity=".5"/>
      <rect x="766" y="270" width="8" height="64" fill="${N.stahl}"/><rect x="770" y="278" width="4" height="56" fill="#000" opacity=".14"/><circle cx="770" cy="266" r="12" fill="${F.sonne}"/><circle cx="770" cy="266" r="24" fill="${F.sonne}" opacity=".2"/><circle cx="766" cy="262" r="3" fill="#fff" opacity=".5"/></g>
    <g><ellipse cx="292" cy="327" rx="32" ry="4" fill="${F.tinte}" opacity=".16"/>
      <rect x="268" y="296" width="36" height="30" rx="4" fill="${F.holz}"/><path d="M297 296 H300 A4 4 0 0 1 304 300 V322 A4 4 0 0 1 300 326 H297Z" fill="#000" opacity=".14"/><rect x="271" y="298.5" width="24" height="3" rx="1.5" fill="#fff" opacity=".28"/>
      <rect x="290" y="270" width="30" height="28" rx="4" fill="${F.holz2}"/><path d="M314 270 H316 A4 4 0 0 1 320 274 V294 A4 4 0 0 1 316 298 H314Z" fill="#000" opacity=".14"/><rect x="293" y="272.5" width="19" height="3" rx="1.5" fill="#fff" opacity=".25"/></g>
    <path d="M560 356 V748" stroke="${N.boden}" stroke-width="10" stroke-dasharray="34 30"/>
    <path d="M60 470 H330 M700 470 H980" stroke="${N.boden}" stroke-width="6" stroke-dasharray="24 22"/>
    <g fill="${N.boden}"><ellipse cx="170" cy="700" rx="48" ry="10"/><ellipse cx="700" cy="716" rx="60" ry="11"/><ellipse cx="936" cy="640" rx="34" ry="8"/><ellipse cx="300" cy="420" rx="30" ry="7"/><ellipse cx="880" cy="520" rx="40" ry="9"/></g>
    <ellipse cx="631" cy="398" rx="15" ry="2.5" fill="${F.tinte}" opacity=".16"/><ellipse cx="487" cy="398" rx="15" ry="2.5" fill="${F.tinte}" opacity=".16"/>
    <g fill="${F.koralle}"><path d="M630 372 l12 26 h-24z"/><path d="M486 372 l12 26 h-24z"/></g>
    <path d="M630 372 l12 26 h-8z M486 372 l12 26 h-8z" fill="#000" opacity=".14"/>
    <!-- Die Station liegt auf einer Insel: unten links ein Stück Meer mit Steg, dort legt die Fähre an
         (links, weil die Fähre vom Hafen der Heimatbucht kommt, der auf der Karte links liegt) -->
    <path d="M324 768 Q254 630 0 580 V768Z" fill="#1d4f72"/>
    <path d="M274 768 Q204 676 0 636 V768Z" fill="#2a6a8f" opacity=".75"/>
    <path d="M170 700 q16 -9 32 0 t32 0 M70 650 q16 -9 32 0 t32 0" stroke="${F.papier}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".5"/>
    <path d="M360 640 L234 592 L218 622 L344 670Z" fill="#000" opacity=".16" transform="translate(-3 7)"/>
    <path d="M360 640 L234 592 L218 622 L344 670Z" fill="${F.holz}"/>
    <path d="M330 630 l-14 28 M298 618 l-14 28 M266 606 l-14 28" stroke="${F.holz2}" stroke-width="4"/>
    <path d="M350 640 L240 598" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".28"/>
    <rect x="354" y="640" width="12" height="36" rx="5" fill="${F.holz2}"/><rect x="224" y="590" width="12" height="36" rx="5" fill="${F.holz2}"/>
    <rect x="360" y="646" width="6" height="24" fill="#000" opacity=".14"/><rect x="230" y="596" width="6" height="24" fill="#000" opacity=".14"/>`);

  B.stationNah = () => svg("0 0 1024 768", `
    <rect width="1024" height="768" fill="${N.nacht}"/>
    ${sterne([[40, 130, 3], [120, 330, 2], [960, 150, 2.5], [1000, 360, 2], [230, 108, 2], [770, 100, 2], [60, 520, 2], [984, 540, 3], [520, 96, 2]])}
    <path d="M0 716 Q200 694 400 710 T800 706 T1024 700 V768 H0Z" fill="${N.boden}"/>
    <path d="M0 742 Q220 726 440 738 T840 734 T1024 740 V768 H0Z" fill="${N.boden2}"/>`);

  // Einstieg „Silben“: Raketenteile, die auf den Einbau warten. Die große Rakete im Bild ist das Ziel
  // (keine zweite kleine Rakete mehr daneben).
  B.figurSilben = () => svg("0 0 200 150", `
    <ellipse cx="58" cy="139" rx="38" ry="4" fill="${F.tinte}" opacity=".13"/><ellipse cx="140" cy="139" rx="42" ry="4" fill="${F.tinte}" opacity=".13"/>
    <path d="M28 138 V92 Q28 68 58 68 Q88 68 88 92 V138Z" fill="${F.papier}"/><rect x="28" y="114" width="60" height="10" fill="${F.koralle}"/>
    <path d="M88 138 V92 Q88 68 58 68 Q77 71 77 92 V138Z" fill="#000" opacity=".1"/>
    <circle cx="58" cy="94" r="10" fill="${F.tinte}"/><circle cx="58" cy="94" r="6" fill="${F.meer2}"/><circle cx="55.8" cy="91.8" r="1.7" fill="#fff" opacity=".6"/>
    <path d="M104 138 Q112 82 140 58 Q168 82 176 138Z" fill="${F.koralle}"/>
    <path d="M176 138 Q168 82 140 58 Q157 86 160 138Z" fill="#000" opacity=".13"/>
    <path d="M113 124 Q118 94 132 77" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".3"/>
    <path d="M18 146 Q48 132 78 146 M100 146 Q140 132 180 146" stroke="${F.sonne}" stroke-width="7" fill="none" stroke-linecap="round"/>`);
  // Startrampe für den Countdown: Turm und Plattform (der Arm zur Rakete ist ein eigenes Element und klappt weg)
  B.rampe = () => svg("0 0 340 420", `
    <ellipse cx="170" cy="414" rx="166" ry="5" fill="${F.tinte}" opacity=".14"/>
    <rect x="20" y="16" width="26" height="366" fill="${N.stahl}"/>
    <rect x="38" y="20" width="8" height="354" fill="#000" opacity=".1"/><rect x="20" y="20" width="4" height="354" fill="#fff" opacity=".3"/>
    <path d="M20 40 L46 84 M46 40 L20 84 M20 120 L46 164 M46 120 L20 164 M20 200 L46 244 M46 200 L20 244 M20 280 L46 324 M46 280 L20 324" stroke="${N.platz}" stroke-width="4"/>
    <rect x="10" y="6" width="46" height="14" rx="4" fill="${N.platz}"/><circle cx="33" cy="4" r="6" fill="${F.koralle}"/>
    <path d="M0 380 H340 L318 414 H22Z" fill="${N.platz}"/><rect x="0" y="374" width="340" height="12" rx="4" fill="${N.stahl}"/>
    <path d="M4 386 H336 L333 391 H7Z" fill="#000" opacity=".14"/><rect x="6" y="376" width="328" height="3" rx="1.5" fill="#fff" opacity=".3"/>`);
  // Platz vor dem großen Pult im Cockpit: Hier steht die Figur, wenn der Bordcomputer spricht
  B.figurStandplatz = () => svg("0 0 180 110", `
    <ellipse cx="90" cy="66" rx="78" ry="34" fill="none" stroke="${F.papier}" stroke-width="8" stroke-dasharray="16 12" opacity=".9"/>
    <path d="M66 62 L90 40 L114 62 M66 86 L90 64 L114 86" stroke="${F.sonne}" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`);

  B.figurPlus = () => svg("0 0 200 160", `
    <ellipse cx="100" cy="154" rx="78" ry="5" fill="${F.tinte}" opacity=".14"/>
    <g style="color:${F.sonne}" transform="translate(28 0) scale(.62)">${sternUnten("#dba21f")}${teil.stern()}</g>
    <g style="color:${F.koralle}" transform="translate(110 4) scale(.62)">${sternUnten("#c9543f")}${teil.stern()}</g>
    <g style="color:${F.sonne}" transform="translate(70 26) scale(.62)">${sternUnten("#dba21f")}${teil.stern()}</g>
    <rect x="30" y="72" width="140" height="82" rx="10" fill="${F.holz}"/>
    <path d="M30 100 H170 M30 128 H170" stroke="${F.holz2}" stroke-width="5"/>
    <path d="M158 72 H160 A10 10 0 0 1 170 82 V144 A10 10 0 0 1 160 154 H158Z" fill="#000" opacity=".13"/>
    <rect x="38" y="75.5" width="118" height="3.5" rx="1.75" fill="#fff" opacity=".28"/>
    <path d="M100 92 V136 M78 114 H122" stroke="${F.papier}" stroke-width="11" stroke-linecap="round"/>`);

  B.figurReihe = () => svg("0 0 210 160", `
    <ellipse cx="105" cy="156" rx="82" ry="3.5" fill="${F.tinte}" opacity=".14"/>
    <rect x="40" y="96" width="12" height="60" fill="${N.stahl}"/><rect x="158" y="96" width="12" height="60" fill="${N.stahl}"/>
    <path d="M47 112 H52 V156 H47Z M165 112 H170 V156 H165Z" fill="#000" opacity=".12"/><path d="M40 112 H52 V118 H40Z M158 112 H170 V118 H158Z" fill="#000" opacity=".16"/>
    <rect x="8" y="12" width="194" height="100" rx="18" fill="${F.papier}"/>
    <path d="M8.5 98 H201.5 A18 18 0 0 1 184 112 H26 A18 18 0 0 1 8.5 98Z" fill="#000" opacity=".07"/>
    <text x="105" y="84" text-anchor="middle" font-family="Grundschrift, sans-serif" font-size="56" fill="${F.tinte}">3 2 1</text>`);

  // Entdeckungen
  B.kokosnuss = () => svg("0 0 100 100", `<circle cx="50" cy="52" r="40" fill="${F.holz}"/>${sichel(50, 52, 40, 0.14)}${glanz(50, 52, 33, 212, 252, 3.5, 0.3)}<path d="M18 40 Q50 22 82 40 Q50 34 18 40Z" fill="${F.holz2}"/><circle cx="40" cy="50" r="5" fill="${F.holz2}"/><circle cx="60" cy="50" r="5" fill="${F.holz2}"/><circle cx="50" cy="64" r="5" fill="${F.holz2}"/>`);
  B.funk = () => {
    const wellen = `<path d="M34 62 Q50 46 66 62"/><path d="M22 48 Q50 20 78 48"/><path d="M10 34 Q50 -6 90 34"/>`;
    return svg("0 0 100 100", `<g stroke="#dba21f" stroke-width="8" fill="none" stroke-linecap="round" transform="translate(0 3)">${wellen}</g>
      <g stroke="${F.sonne}" stroke-width="8" fill="none" stroke-linecap="round">${wellen}</g><circle cx="50" cy="78" r="9" fill="${F.sonne}"/>${sichel(50, 78, 9, 0.15)}<circle cx="47" cy="75" r="2.2" fill="#fff" opacity=".5"/>`);
  };

  B.zahnrad = () => svg("0 0 100 100", `
    <circle cx="50" cy="50" r="31" fill="none" stroke="${F.tinte}" stroke-width="18" stroke-dasharray="12.2 12.15"/>
    <circle cx="50" cy="50" r="27" fill="${F.tinte}"/>${glanz(50, 50, 20, 200, 250, 3.5, 0.28)}<circle cx="50" cy="50" r="11" fill="${F.papier}"/>
    <path d="M39 50 A11 11 0 0 1 61 50 A11 7.5 0 0 0 39 50Z" fill="#000" opacity=".16"/>`);
  /* ---------- Piratenwelt ---------- */
  const P = { abend: "#fbd9ae", abendsonne: "#f59a3c", see: "#2a90aa", tiefsee: "#14607a", tiefsee2: "#0f4f66", planke: "#6b4a30" };

  // Münze: darunter eine dunklere Scheibe (die Dicke der Münze), oben links ein Glanzbogen
  teil.muenze = () => `<circle cx="50" cy="53.5" r="40" fill="#c98d12"/><circle cx="50" cy="50" r="40" fill="#e8a81c"/><circle cx="50" cy="50" r="31" fill="${F.sonne}"/>${glanz(50, 50, 24.5, 198, 252, 3.5, 0.45)}<path d="M50 30 V70 M38 40 H62 M38 60 H62" stroke="#e8a81c" stroke-width="6" stroke-linecap="round"/>`;
  B.muenze = () => svg("0 0 100 100", teil.muenze());
  B.feder = () => svg("0 0 100 100", `<path d="M22 84 Q20 40 60 12 Q88 30 70 60 Q56 80 22 84Z" fill="${F.koralle}"/><path d="M70 60 Q56 80 22 84 Q50 74 63 56Z" fill="#000" opacity=".14"/>
    <path d="M34 70 Q40 44 60 12 Q64 44 34 70Z" fill="${F.sonne}"/><path d="M32 50 Q36 38 45 29" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".35"/>
    <path d="M14 92 Q30 62 58 22" stroke="${F.tinte}" stroke-width="4" fill="none" stroke-linecap="round"/>`);
  B.flasche = () => svg("0 0 100 100", `<g transform="rotate(-28 50 50)"><rect x="40" y="6" width="20" height="24" rx="4" fill="#9fd9c2"/><rect x="43" y="2" width="14" height="9" rx="3" fill="${F.holz}"/><path d="M40 28 Q24 36 24 52 V86 Q24 94 34 94 H66 Q76 94 76 86 V52 Q76 36 60 28Z" fill="#b9e8d6"/>
    <path d="M24 78 H76 V86 Q76 94 66 94 H34 Q24 94 24 86Z" fill="#000" opacity=".1"/><path d="M31 50 V74" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".45"/>
    <rect x="38" y="46" width="24" height="36" rx="5" fill="${F.papier}"/><path d="M38 58 H62 M38 70 H62" stroke="${F.koralle}" stroke-width="4"/></g>`);

  // Tiefe für die beiden Palmen der Pirateninsel (gleiche Zeichnung): Schatten am Boden, dunklere rechte Seite
  // und heller Rand am Stamm, dunklere Unterseite der Blätter
  const palmeSchatten = `<ellipse cx="94" cy="541" rx="46" ry="7" fill="${F.tinte}" opacity=".14"/>`;
  const palmeStamm = `<path d="M112 372 Q86 452 100 540 H91 Q78 452 104 369.6Z" fill="#000" opacity=".14"/><path d="M76 520 Q65 450 96 375" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round" opacity=".25"/>`;
  const palmeBlaetter = `<g fill="#000" opacity=".14"><path d="M102 368 Q50 346 0 356 Q48 338 102 368Z"/><path d="M102 368 Q68 318 14 292 Q70 311 102 368Z"/><path d="M102 368 Q140 320 186 286 Q137 313 102 368Z"/><path d="M102 368 Q158 350 216 362 Q160 342 102 368Z"/></g>`;

  // Pirateninsel: Schiff weit hinten auf dem Meer, davor die große Insel
  B.pirateninsel = () => svg("0 0 1024 768", `
    <rect width="1024" height="768" fill="${P.abend}"/>
    <circle cx="230" cy="160" r="92" fill="#fff" opacity=".3"/><circle cx="230" cy="160" r="60" fill="${P.abendsonne}"/>
    <g fill="#fff" opacity=".85"><ellipse cx="470" cy="70" rx="76" ry="22"/><ellipse cx="518" cy="54" rx="46" ry="22"/><ellipse cx="60" cy="60" rx="50" ry="15"/></g>
    <rect y="186" width="1024" height="160" fill="${P.see}"/>
    <path d="${welle(226, 10)} V256 H0Z" fill="${F.meer2}" opacity=".45"/>
    <g transform="translate(250 -40) scale(.72)">
      <rect x="700" y="96" width="13" height="250" fill="${F.holz2}"/><rect x="852" y="136" width="13" height="210" fill="${F.holz2}"/>
      <path d="M640 150 Q706 128 772 150 L764 292 Q706 272 648 292Z" fill="${F.papier}"/><path d="M806 180 Q858 162 910 180 L904 292 Q858 276 812 292Z" fill="${F.papier}"/>
      <path d="M646.3 262 Q706 243 765.7 262 L764 292 Q706 272 648 292Z M810.6 266 Q858 251 905.4 266 L904 292 Q858 276 812 292Z" fill="#000" opacity=".1"/>
      <path d="M660 200 Q706 188 754 200 M656 244 Q706 230 758 244" stroke="${F.sand2}" stroke-width="4" fill="none"/>
      <path d="M713 96 L776 112 L713 132Z" fill="${F.tinte}"/><circle cx="734" cy="112" r="7" fill="${F.papier}"/>
      <path d="M592 330 Q612 432 700 442 H904 Q966 430 986 320 Z" fill="${F.holz2}"/>
      <path d="M629 409 Q656 437 700 442 H904 Q935 436 955.5 405.5 Q932 422 904 426 H700 Q660 422 629 409Z" fill="#000" opacity=".16"/>
      <path d="M592 330 H986 L980 356 H598Z" fill="${F.holz}"/><path d="M606 337 H972" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".25"/>
      <g fill="${F.sonne}"><circle cx="676" cy="392" r="11"/><circle cx="756" cy="398" r="11"/><circle cx="836" cy="398" r="11"/><circle cx="912" cy="388" r="11"/></g>
    </g>
    <path d="${welle(280, 12)} V326 H0Z" fill="${F.meer2}" opacity=".85"/>
    <path d="M0 316 Q170 284 390 304 T770 316 T1024 334 V768 H0Z" fill="${F.sand2}"/>
    <path d="M0 344 Q200 314 420 332 T800 344 T1024 360 V768 H0Z" fill="${F.sand}"/>
    ${anleger(330, 306, P.see)}
    <path d="M690 318 L760 280 L772 290 L706 330Z" fill="#000" opacity=".14" transform="translate(4 6)"/>
    <path d="M690 318 L760 280 L772 290 L706 330Z" fill="${F.holz}"/><path d="M697 318 L760 284" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".3"/>
    <g transform="translate(0 -150)">
      ${palmeSchatten}<path d="M70 540 Q58 450 92 366 L112 372 Q86 452 100 540Z" fill="${F.holz}"/>${palmeStamm}
      <g fill="${F.blatt}"><path d="M102 368 Q40 320 0 356 Q50 346 102 368Z"/><path d="M102 368 Q70 296 14 292 Q68 318 102 368Z"/><path d="M102 368 Q122 296 186 286 Q140 320 102 368Z"/><path d="M102 368 Q170 324 216 362 Q158 350 102 368Z"/></g>${palmeBlaetter}
    </g>
    <g transform="translate(900 250) scale(.6)">${palmeSchatten}<path d="M70 540 Q58 450 92 366 L112 372 Q86 452 100 540Z" fill="${F.holz}"/>${palmeStamm}<g fill="${F.blatt2}"><path d="M102 368 Q40 320 0 356 Q50 346 102 368Z"/><path d="M102 368 Q70 296 14 292 Q68 318 102 368Z"/><path d="M102 368 Q122 296 186 286 Q140 320 102 368Z"/><path d="M102 368 Q170 324 216 362 Q158 350 102 368Z"/></g>${palmeBlaetter}</g>
    <!-- Piratenflagge, Fass, Schatzkiste, Schatzkreuz -->
    <ellipse cx="492" cy="396" rx="16" ry="3" fill="${F.tinte}" opacity=".14"/>
    <rect x="486" y="300" width="8" height="96" fill="${F.holz2}"/><rect x="490" y="341" width="4" height="55" fill="#000" opacity=".16"/><path d="M494 302 L560 318 L494 340Z" fill="${F.tinte}"/><path d="M500 307.5 L544 318.2" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".2"/><circle cx="514" cy="320" r="7" fill="${F.papier}"/>
    <g><ellipse cx="152" cy="672" rx="40" ry="6" fill="${F.tinte}" opacity=".14"/><rect x="118" y="596" width="64" height="76" rx="12" fill="${F.holz}"/><path d="M118 618 H182 M118 650 H182" stroke="${F.holz2}" stroke-width="6"/>
      <path d="M170 596 A12 12 0 0 1 182 608 V660 A12 12 0 0 1 170 672Z" fill="#000" opacity=".14"/><path d="M127 607 V661" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".28"/></g>
    <ellipse cx="903" cy="458" rx="35" ry="5" fill="${F.tinte}" opacity=".14"/>
    <g transform="translate(866 394) scale(.74)">${teil.truhe()}</g>
    <path d="M736 656 l44 44 m0 -44 l-44 44" stroke="${F.koralle}" stroke-width="12" stroke-linecap="round"/>
    <path d="M560 470 q30 -24 60 0 t60 0 t60 30" stroke="${F.sand2}" stroke-width="5" fill="none" stroke-dasharray="4 14" stroke-linecap="round"/>
    ${kieselHaufen(316, 708)}${strandgras(976, 636, 1)}
    <g fill="${F.sand2}"><circle cx="420" cy="430" r="5"/><circle cx="560" cy="700" r="5"/><circle cx="900" cy="560" r="4"/><circle cx="250" cy="480" r="5"/><circle cx="660" cy="410" r="4"/></g>
    <path d="M0 734 Q140 714 280 732 T560 726 T840 736 T1024 720 V768 H0Z" fill="${P.see}"/>`);

  B.wrack = () => svg("0 0 1024 768", `
    <rect width="1024" height="768" fill="${P.tiefsee}"/>
    <path d="M0 0 H1024 V60 Q960 82 896 60 T768 60 T640 60 T512 60 T384 60 T256 60 T128 60 T0 60Z" fill="${F.riff}"/>
    <g fill="#fff" opacity=".05"><path d="M260 60 L160 768 H360Z"/><path d="M640 60 L620 768 H820Z"/></g>
    <path d="M0 520 Q140 470 300 500 T620 480 T1024 470 V768 H0Z" fill="${P.tiefsee2}"/>
    <path d="M548 372 L590 132 L612 136 L586 370Z" fill="${F.holz2}"/><path d="M604 134.5 L612 136 L586 370 L574 370.6Z" fill="#000" opacity=".15"/>
    <path d="M604 150 L716 196 Q680 232 700 280 L596 250Z" fill="${F.papier}" opacity=".75"/><path d="M597.1 236 L694.2 261.3 Q696 270.4 700 280 L596 250Z" fill="#000" opacity=".12"/>
    <path d="M318 610 Q700 650 968 566 Q700 674 318 610Z" fill="${F.tinte}" opacity=".2"/>
    <path d="M318 610 Q324 430 470 386 L912 326 Q992 404 968 566 Q700 650 318 610Z" fill="${P.planke}"/>
    <path d="M968 566 Q700 650 318 610 Q700 620 968 566Z" fill="#000" opacity=".16"/>
    <path d="M352 520 Q620 480 972 440 M336 566 Q640 540 968 506" stroke="${F.holz2}" stroke-width="6" fill="none"/>
    <path d="M482 391 L900 334" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".18"/>
    <ellipse cx="640" cy="520" rx="52" ry="66" fill="${P.tiefsee2}"/>
    <g fill="${F.sonne}" opacity=".8"><circle cx="470" cy="470" r="13"/><circle cx="800" cy="430" r="13"/><circle cx="890" cy="418" r="13"/></g>
    <path d="M0 664 Q160 632 320 656 T640 650 T1024 644 V768 H0Z" fill="${F.sand2}"/>
    <path d="M0 714 Q200 692 400 708 T800 704 T1024 698 V768 H0Z" fill="${F.sand}"/>
    <ellipse cx="152" cy="657" rx="54" ry="6" fill="${F.tinte}" opacity=".14"/><ellipse cx="62" cy="697" rx="23" ry="4.5" fill="${F.tinte}" opacity=".14"/>
    <g stroke="#9aa7ad" stroke-width="14" fill="none" stroke-linecap="round"><path d="M150 500 V640 M104 594 Q110 650 150 650 Q190 650 196 594 M120 536 H180"/><circle cx="150" cy="484" r="15"/></g>
    ${strichTiefe("M150 500 V640 M104 594 Q110 650 150 650 Q190 650 196 594 M120 536 H180 M135 484 A15 15 0 1 0 165 484 A15 15 0 1 0 135 484", 14, true)}
    <g class="tang" stroke="${F.blatt}" stroke-width="14" stroke-linecap="round" fill="none"><path d="M250 690 Q232 640 252 590 Q268 550 250 512"/></g>
    <g class="tang" stroke="${F.blatt2}" stroke-width="14" stroke-linecap="round" fill="none"><path d="M986 690 Q1000 640 984 600"/></g>
    <g stroke="${F.lila}" stroke-width="16" stroke-linecap="round" fill="none"><path d="M60 690 V636 M60 664 L36 632 M60 670 L88 638"/></g>
    ${astTiefe(F.lila, 16, "M60 690 V636", "M60 664 L36 632 M60 670 L88 638")}
    <g class="blasen" fill="#fff" opacity=".45"><circle cx="640" cy="440" r="8"/><circle cx="656" cy="398" r="5"/><circle cx="330" cy="330" r="6"/><circle cx="880" cy="270" r="5"/></g>`);

  B.wrackNah = () => svg("0 0 1024 768", `
    <rect width="1024" height="768" fill="${P.tiefsee}"/>
    <path d="M0 0 H1024 V44 Q960 66 896 44 T768 44 T640 44 T512 44 T384 44 T256 44 T128 44 T0 44Z" fill="${F.riff}"/>
    <path d="M0 716 Q200 694 400 710 T800 706 T1024 700 V768 H0Z" fill="${F.sand2}"/>
    <g class="tang" stroke="${F.blatt2}" stroke-width="14" stroke-linecap="round" fill="none"><path d="M984 720 Q1000 664 982 610 Q968 570 984 530"/></g>
    <g fill="#fff" opacity=".4" class="blasen"><circle cx="60" cy="430" r="7"/><circle cx="74" cy="390" r="4"/><circle cx="970" cy="330" r="6"/></g>`);

  B.figurSteuerrad = () => svg("0 0 200 190", `
    <ellipse cx="100" cy="187" rx="38" ry="3" fill="${F.tinte}" opacity=".14"/>
    <rect x="92" y="110" width="16" height="78" fill="${F.holz2}"/><rect x="102" y="150" width="6" height="38" fill="#000" opacity=".14"/>
    <g stroke="${F.holz}" stroke-width="13" stroke-linecap="round"><path d="M100 14 V166 M24 90 H176 M46 36 L154 144 M154 36 L46 144"/></g>
    <circle cx="100" cy="90" r="56" fill="none" stroke="${F.holz2}" stroke-width="16"/>
    <path d="${bogen(100, 90, 60, 20, 160)}" stroke="#000" stroke-width="8" fill="none" stroke-linecap="round" opacity=".15"/>${glanz(100, 90, 58, 200, 250, 4, 0.3)}
    <circle cx="100" cy="90" r="18" fill="${F.sonne}"/>${sichel(100, 90, 18, 0.14)}<circle cx="94" cy="84" r="3.5" fill="#fff" opacity=".4"/>`);

  B.figurPapagei = () => svg("0 0 200 190", `
    <rect x="30" y="150" width="140" height="12" rx="6" fill="${F.holz}"/><rect x="94" y="158" width="12" height="32" fill="${F.holz2}"/>
    <path d="M118 148 Q150 176 142 188 Q118 176 108 150Z" fill="${F.meer}"/>
    <ellipse cx="100" cy="188" rx="44" ry="2.5" fill="${F.tinte}" opacity=".14"/>
    <ellipse cx="100" cy="100" rx="42" ry="56" fill="${F.koralle}"/>
    <path d="M61 122 Q100 160 139 122 Q132 156 100 156 Q68 156 61 122Z" fill="#000" opacity=".13"/>
    <path d="M104 84 Q150 96 132 150 Q104 136 104 84Z" fill="${F.blatt}"/>
    <path d="M114 100 Q130 112 124 134" stroke="#000" stroke-width="4" fill="none" stroke-linecap="round" opacity=".16"/>
    <circle cx="86" cy="52" r="34" fill="${F.koralle}"/>
    <path d="M64 34 Q84 20 106 30" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".3"/>
    <path d="M58 52 Q30 56 44 86 Q62 78 66 60Z" fill="${F.sonne}"/>
    <path d="M40 70 Q40 80 44 86 Q62 78 66 60 Q56 74 40 70Z" fill="#000" opacity=".13"/>
    <circle cx="84" cy="46" r="10" fill="${F.papier}"/><circle cx="82" cy="47" r="5" fill="${F.tinte}"/>
    <circle cx="83.8" cy="45" r="1.8" fill="#fff"/>
    <path d="M86 150 v8 M108 150 v8" stroke="${F.tinte}" stroke-width="5" stroke-linecap="round"/>`);

  B.figurFlasche = () => svg("0 0 200 170", `
    <ellipse cx="100" cy="140" rx="92" ry="22" fill="#fff" opacity=".12"/>
    <g transform="translate(40 14) scale(1.3)">${B.flasche().replace(/<\/?svg[^>]*>/g, "")}</g>`);

  B.figurMuenzen = () => svg("0 0 210 170", `
    <ellipse cx="105" cy="158" rx="92" ry="7" fill="${F.tinte}" opacity=".14"/>
    <g transform="translate(6 78) scale(.8)">${teil.muenze()}</g><g transform="translate(64 86) scale(.8)">${teil.muenze()}</g><g transform="translate(122 78) scale(.8)">${teil.muenze()}</g>
    <g transform="translate(36 38) scale(.8)">${teil.muenze()}</g><g transform="translate(94 40) scale(.8)">${teil.muenze()}</g>
    <g transform="translate(66 0) scale(.8)">${teil.muenze()}</g>`);
  /* ---------- In der Rakete und im Weltraum ---------- */
  const W = { wand: "#39426b", pult: "#5a6390", pult2: "#7480b3", all: "#141a3a" };
  // Bullauge: Rahmen unten außen dunkler, oben links ein Glanzbogen
  const fenster = (cx, cy, r, sternchen) => `<circle cx="${cx}" cy="${cy}" r="${r + 16}" fill="${N.stahl}"/>
    <path d="${bogen(cx, cy, r + 12, 25, 155)}" stroke="#000" stroke-width="8" fill="none" stroke-linecap="round" opacity=".12"/>${glanz(cx, cy, r + 8, 200, 250, 4, 0.4)}
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${W.all}"/>${sterne(sternchen)}`;
  // Runder Knopf: unten dunkler, oben links ein Glanzpunkt
  const knopfTiefe = (cx, cy, r) => `${sichel(cx, cy, r, 0.14)}<circle cx="${z1(cx - r * 0.32)}" cy="${z1(cy - r * 0.32)}" r="${z1(r * 0.23)}" fill="#fff" opacity=".4"/>`;

  B.cockpit = () => svg("0 0 1024 768", `
    <rect width="1024" height="768" fill="${W.wand}"/>
    ${fenster(200, 190, 70, [[170, 170, 3], [222, 214, 2], [210, 150, 2]])}
    ${fenster(512, 180, 78, [[480, 150, 3], [540, 206, 2.5], [520, 140, 2], [470, 214, 2]])}
    ${fenster(824, 190, 70, [[800, 160, 2.5], [850, 210, 3], [846, 160, 2]])}
    <path d="M120 332 H904 L964 480 H60Z" fill="${W.pult}"/><path d="M120 332 H904 L912 352 H112Z" fill="${W.pult2}"/>
    <path d="M67.3 462 H956.7 L964 480 H60Z" fill="#000" opacity=".12"/>
    <circle cx="230" cy="412" r="17" fill="${F.koralle}"/><circle cx="286" cy="412" r="17" fill="${F.sonne}"/><circle cx="342" cy="412" r="17" fill="${F.blatt}"/>
    ${knopfTiefe(230, 412, 17)}${knopfTiefe(286, 412, 17)}${knopfTiefe(342, 412, 17)}
    <rect x="420" y="378" width="184" height="74" rx="12" fill="${W.all}"/><path d="M432 388 H462 L438 414Z" fill="#fff" opacity=".12"/><path d="M436 426 l30 -22 l26 14 l34 -30 l28 22 l34 -12" stroke="#7df0a8" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="650" y="382" width="110" height="64" rx="10" fill="${F.meer2}"/><path d="M650 433 H760 V436 A10 10 0 0 1 750 446 H660 A10 10 0 0 1 650 436Z" fill="#000" opacity=".12"/><path d="M662 390 H690" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".4"/><circle cx="705" cy="414" r="18" fill="${F.papier}"/>
    <rect x="806" y="372" width="12" height="60" rx="6" fill="${N.stahl}"/><rect x="813" y="384" width="5" height="42" fill="#000" opacity=".14"/><circle cx="812" cy="368" r="15" fill="${F.koralle}"/>${knopfTiefe(812, 368, 15)}
    <rect y="480" width="1024" height="288" fill="${N.boden}"/><rect y="536" width="1024" height="232" fill="${N.boden2}"/>
    <rect x="52" y="480" width="920" height="9" fill="${F.tinte}" opacity=".14"/>
    <path d="M0 610 H1024 M0 690 H1024" stroke="${N.boden}" stroke-width="4"/>`);

  B.weltraum = () => svg("0 0 1024 768", `
    <rect width="1024" height="768" fill="${W.all}"/>
    <ellipse cx="700" cy="230" rx="270" ry="120" fill="${F.lila}" opacity=".13"/><ellipse cx="270" cy="540" rx="230" ry="110" fill="${F.meer}" opacity=".13"/>
    ${sterne([[60, 80, 3], [130, 420, 2], [240, 60, 2], [300, 420, 2.5], [380, 130, 2], [420, 620, 3], [470, 260, 2], [520, 470, 2], [560, 700, 2.5], [680, 60, 2], [720, 420, 3], [770, 250, 2], [830, 110, 2.5], [900, 330, 2], [960, 190, 3], [990, 470, 2], [60, 640, 2.5], [200, 720, 2], [650, 560, 2], [330, 250, 2]])}
    <circle cx="170" cy="176" r="66" fill="${F.meer}"/><path d="M130 146 Q160 126 186 150 Q170 176 140 172Z M176 196 Q206 182 222 204 Q202 230 178 220Z" fill="${F.blatt}"/>
    ${sichel(170, 176, 66, 0.14, -35)}${glanz(170, 176, 56, 205, 250, 5, 0.3)}
    <circle cx="610" cy="130" r="38" fill="${N.bau}"/><circle cx="598" cy="120" r="8" fill="${N.stahl}"/><circle cx="624" cy="142" r="6" fill="${N.stahl}"/>${sichel(610, 130, 38, 0.12, -35)}
    <circle cx="884" cy="660" r="150" fill="#f59a3c"/><path d="M742 620 Q884 590 1024 630 V664 Q884 624 738 652Z" fill="#e2803a"/><path d="M748 700 Q884 676 1024 712 V740 Q884 706 760 730Z" fill="#fbb866"/>
    ${sichel(884, 660, 150, 0.12, -35)}${glanz(884, 660, 132, 200, 240, 9, 0.2)}
    <ellipse cx="884" cy="660" rx="236" ry="44" fill="none" stroke="#fbd08a" stroke-width="16" transform="rotate(-14 884 660)"/>
    <path d="M356 318 L262 258 L282 292 L250 300Z" fill="${F.papier}" opacity=".45"/><circle cx="356" cy="318" r="12" fill="${F.papier}"/>`);

  B.komet = () => svg("0 0 100 100", `<path d="M6 94 L52 28 L72 60Z" fill="${F.sonne}" opacity=".55"/><g style="color:${F.papier}" transform="translate(36 2) scale(.62)">${sternUnten("#dccdb0")}${teil.stern()}</g>`);

  B.figurTuer = () => svg("0 0 120 132", `
    <ellipse cx="60" cy="128" rx="55" ry="3.5" fill="${F.tinte}" opacity=".14"/>
    <path d="M36 62 H84 L110 128 H10Z" fill="${N.stahl}"/><path d="M75 62 H84 L110 128 H94Z" fill="#000" opacity=".12"/><path d="M30 84 H90 M22 106 H98" stroke="${N.platz}" stroke-width="5"/>
    <path d="M32 64 V32 Q32 4 60 4 Q88 4 88 32 V64Z" fill="${F.tinte}"/><path d="M38.5 30 Q39 11 57 9.5" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".22"/>
    <circle cx="60" cy="32" r="11" fill="${F.sonne}"/><circle cx="56.5" cy="28.5" r="2.8" fill="#fff" opacity=".5"/>`);

  B.figurStartknopf = () => svg("0 0 180 150", `
    <ellipse cx="90" cy="144.5" rx="78" ry="4.5" fill="${F.tinte}" opacity=".14"/>
    <rect x="16" y="84" width="148" height="60" rx="14" fill="${W.pult}"/><rect x="16" y="84" width="148" height="16" rx="8" fill="${W.pult2}"/>
    <path d="M16 126 H164 V130 A14 14 0 0 1 150 144 H30 A14 14 0 0 1 16 130Z" fill="#000" opacity=".12"/>
    <path d="M40 90 Q40 18 90 18 Q140 18 140 90Z" fill="${F.koralle}"/><path d="M140 90 Q140 18 90 18 Q125 28 125 90Z" fill="#000" opacity=".12"/><ellipse cx="74" cy="46" rx="20" ry="11" fill="#fff" opacity=".3" transform="rotate(-24 74 46)"/>`);

  B.figurSatellit = () => svg("0 0 240 150", `
    <rect x="76" y="68" width="88" height="12" fill="${N.stahl}"/>
    <g fill="${F.meer2}"><rect x="4" y="46" width="76" height="56" rx="6"/><rect x="160" y="46" width="76" height="56" rx="6"/></g>
    <path d="M4 74 H80 V96 A6 6 0 0 1 74 102 H10 A6 6 0 0 1 4 96Z M160 74 H236 V96 A6 6 0 0 1 230 102 H166 A6 6 0 0 1 160 96Z" fill="#000" opacity=".1"/>
    <path d="M11 52 H24 M167 52 H180" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".4"/>
    <path d="M30 46 V102 M56 46 V102 M4 74 H80 M186 46 V102 M212 46 V102 M160 74 H236" stroke="${F.tief}" stroke-width="3"/>
    <rect x="86" y="34" width="68" height="84" rx="14" fill="${F.papier}"/><path d="M86 102 H154 V104 A14 14 0 0 1 140 118 H100 A14 14 0 0 1 86 104Z" fill="#000" opacity=".1"/>
    <circle cx="108" cy="68" r="9" fill="${F.tinte}"/><circle cx="132" cy="68" r="9" fill="${F.tinte}"/><circle cx="111" cy="65" r="2.4" fill="#fff"/><circle cx="135" cy="65" r="2.4" fill="#fff"/><path d="M106 92 Q120 102 134 92" stroke="${F.tinte}" stroke-width="4" fill="none" stroke-linecap="round"/>
    <rect x="117" y="10" width="6" height="26" fill="${N.stahl}"/><circle cx="120" cy="10" r="8" fill="${F.koralle}"/>`);

  B.figurLandung = () => svg("-30 0 160 204", `<ellipse cx="50" cy="196" rx="74" ry="8" fill="#fff" opacity=".15"/><ellipse cx="50" cy="197" rx="54" ry="4.5" fill="${F.tinte}" opacity=".16"/>${teil.rakete()}`);
  /* ---------- Zusätzliche Details für Riff, Wrack, Weltraum und Rakete ---------- */
  const kleinerFisch = (x, y, s, farbe, gespiegelt) => `<g style="color:${farbe}" transform="translate(${x} ${y}) scale(${gespiegelt ? -s : s} ${s})" opacity=".9">${teil.fisch()}</g>`;
  const DETAIL = {
    riff: `${kleinerFisch(700, 180, 0.45, "#f9c23c")}${kleinerFisch(760, 210, 0.38, "#f9c23c")}${kleinerFisch(120, 240, 0.5, "#f48fb1", true)}${kleinerFisch(880, 380, 0.42, "#b9e36b")}
      ${kieselHaufen(350, 712)}${kiesel(716, 716, 9, "#a39378")}${kiesel(742, 722, 6)}
      <ellipse cx="421" cy="696" rx="17" ry="3.5" fill="${F.tinte}" opacity=".14"/><ellipse cx="665" cy="700" rx="17" ry="3.5" fill="${F.tinte}" opacity=".14"/>
      <g stroke="${F.koralle}" stroke-width="12" stroke-linecap="round" fill="none"><path d="M420 690 V650 M420 672 L402 648 M420 676 L440 652"/></g>
      ${astTiefe(F.koralle, 12, "M420 690 V650", "M420 672 L402 648 M420 676 L440 652")}
      <g stroke="#f59a3c" stroke-width="12" stroke-linecap="round" fill="none"><path d="M664 694 V660 M664 678 L648 658 M664 680 L682 660"/></g>
      ${astTiefe("#f59a3c", 12, "M664 694 V660", "M664 678 L648 658 M664 680 L682 660")}
      <g fill="#fff" opacity=".45"><circle cx="500" cy="200" r="6"/><circle cx="512" cy="170" r="4"/><circle cx="880" cy="250" r="5"/><circle cx="210" cy="150" r="5"/></g>`,
    wrack: `${kleinerFisch(260, 200, 0.45, "#f9c23c")}${kleinerFisch(320, 180, 0.36, "#f9c23c")}${kleinerFisch(940, 250, 0.5, "#f0715b", true)}
      <g fill="none" stroke="#9aa7ad" stroke-width="7"><circle cx="196" cy="660" r="11"/><circle cx="214" cy="674" r="11"/><circle cx="234" cy="684" r="11"/></g>
      ${kieselHaufen(536, 682)}${kiesel(960, 704, 8, "#a39378")}${kiesel(436, 706, 9)}
      <path d="M388 470 l30 -8 M410 540 l34 -6 M760 380 l40 -8 M700 560 l36 -6" stroke="${F.holz2}" stroke-width="6" stroke-linecap="round"/>`,
    weltraum: `<circle cx="470" cy="470" r="26" fill="${F.koralle}"/><path d="M448 462 Q470 452 492 462 Q470 468 448 462Z" fill="#c9503e"/>${sichel(470, 470, 26, 0.14, -35)}
      <circle cx="930" cy="120" r="18" fill="#b6a6d8"/>${sichel(930, 120, 18, 0.13, -35)}
      <g transform="translate(420 150) scale(.36)"><rect x="76" y="68" width="88" height="12" fill="${N.stahl}"/><g fill="${F.meer2}"><rect x="4" y="46" width="76" height="56" rx="6"/><rect x="160" y="46" width="76" height="56" rx="6"/></g><rect x="86" y="34" width="68" height="84" rx="14" fill="${N.bau}"/></g>`,
    cockpit: `<g fill="${N.stahl}"><circle cx="70" cy="110" r="26"/><circle cx="954" cy="110" r="26"/></g><g fill="${W.all}"><circle cx="70" cy="110" r="19"/><circle cx="954" cy="110" r="19"/></g>
      <path d="M70 110 L82 96 M954 110 L942 96" stroke="${F.koralle}" stroke-width="4" stroke-linecap="round"/>
      <path d="M0 300 H110 M914 300 H1024 M0 320 H96 M928 320 H1024" stroke="${N.platz}" stroke-width="8"/>
      <rect x="330" y="286" width="364" height="30" rx="8" fill="${W.pult2}"/><g fill="${F.sonne}"><circle cx="360" cy="301" r="7"/><circle cx="390" cy="301" r="7"/><circle cx="634" cy="301" r="7"/><circle cx="664" cy="301" r="7"/></g>
      <g fill="${N.boden}"><rect x="40" y="560" width="70" height="8" rx="4"/><rect x="900" y="590" width="80" height="8" rx="4"/><rect x="300" y="740" width="90" height="8" rx="4"/></g>`,
  };
  for (const name of Object.keys(DETAIL)) {
    const ohne = B[name];
    B[name] = () => ohne().replace(/<\/svg>$/, DETAIL[name] + "</svg>");
  }

  // Einstieg zum Bordcomputer und Symbol für die Karte
  B.figurPult = () => svg("0 0 180 140", `
    <ellipse cx="90" cy="133" rx="86" ry="5" fill="${F.tinte}" opacity=".14"/>
    <path d="M20 60 H160 L176 132 H4Z" fill="${W.pult}"/><path d="M20 60 H160 L164 76 H16Z" fill="${W.pult2}"/>
    <path d="M5.8 124 H174.2 L176 132 H4Z" fill="#000" opacity=".12"/>
    <circle cx="52" cy="102" r="13" fill="${F.koralle}"/><circle cx="90" cy="102" r="13" fill="${F.sonne}"/><circle cx="128" cy="102" r="13" fill="${F.blatt}"/>
    ${knopfTiefe(52, 102, 13)}${knopfTiefe(90, 102, 13)}${knopfTiefe(128, 102, 13)}
    <rect x="52" y="8" width="76" height="50" rx="8" fill="${W.all}"/><path d="M60 15 H78 L62 32Z" fill="#fff" opacity=".12"/><path d="M62 40 l14 -12 l12 8 l16 -16 l14 10" stroke="#7df0a8" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`);
  B.karte = () => svg("0 0 100 100", `
    <path d="M10 24 L36 14 L64 24 L90 14 V76 L64 86 L36 76 L10 86Z" fill="${F.papier}" stroke="${F.tinte}" stroke-width="6" stroke-linejoin="round"/>
    <path d="M36 14 V76 M64 24 V86" stroke="${F.tinte}" stroke-width="4"/><path d="M22 60 q10 -14 20 -4 t22 -8" stroke="${F.koralle}" stroke-width="5" fill="none" stroke-dasharray="3 8" stroke-linecap="round"/>
    <path d="M70 38 l10 10 m0 -10 l-10 10" stroke="${F.koralle}" stroke-width="5" stroke-linecap="round"/>`);

  /* ---------- Werkstatt: Krebs-Mechaniker und Bauteile ---------- */
  const METALL = "#9aa5b1", METALL2 = "#6f8792";
  // Maulschlüssel, Griff nach unten, Spitze bei (0, 0)
  const schluessel = (farbe) => `<path d="M-13 0 V11 A13 13 0 0 0 13 11 V0 H6 V13 H-6 V0Z" fill="${farbe}"/><rect x="-5" y="20" width="10" height="46" rx="5" fill="${farbe}"/>`;
  B.figurMechaniker = () => svg("0 0 190 150", `
    <ellipse cx="29" cy="142" rx="28" ry="3.5" fill="${F.tinte}" opacity=".14"/>
    <rect x="6" y="112" width="46" height="30" rx="6" fill="${F.koralle}"/><rect x="6" y="122" width="46" height="6" fill="#c9543f"/>
    <path d="M6 134 H52 V136 A6 6 0 0 1 46 142 H12 A6 6 0 0 1 6 136Z" fill="#000" opacity=".12"/><rect x="10" y="114.5" width="38" height="3" rx="1.5" fill="#fff" opacity=".3"/>
    <path d="M18 112 V104 Q18 98 24 98 H34 Q40 98 40 104 V112" stroke="${F.tinte}" stroke-width="5" fill="none"/>
    <g transform="translate(30 38)">${teil.krebs("#4a90c2")}</g>
    <path d="M76 94 Q76 68 100 68 Q124 68 124 94Z" fill="${F.sonne}"/><path d="M124 94 Q124 68 100 68 Q115 72 115 94Z" fill="#000" opacity=".12"/>
    <path d="M82 86 Q83 77 93 73.5" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round" opacity=".4"/><rect x="70" y="90" width="60" height="9" rx="4.5" fill="#e8a81c"/>
    <g transform="translate(156 6) rotate(24)">${schluessel(METALL)}<path d="M1 20.1 A5 5 0 0 1 5 25 V61 A5 5 0 0 1 1 65.9Z" fill="#000" opacity=".14"/><rect x="-3.2" y="25" width="2.2" height="34" rx="1.1" fill="#fff" opacity=".4"/></g>`);
  B.schluessel = () => svg("0 0 100 100", `<g transform="translate(66 14) rotate(38) scale(1.15)">${schluessel(F.papier)}</g>`);

  B.teilPropeller = () => svg("0 0 100 100", `
    <g fill="#7fb2d9"><ellipse cx="50" cy="25" rx="13" ry="24"/><ellipse cx="50" cy="25" rx="13" ry="24" transform="rotate(120 50 50)"/><ellipse cx="50" cy="25" rx="13" ry="24" transform="rotate(240 50 50)"/></g>
    <g fill="#5b93bf"><ellipse cx="54" cy="25" rx="5" ry="18"/><ellipse cx="54" cy="25" rx="5" ry="18" transform="rotate(120 50 50)"/><ellipse cx="54" cy="25" rx="5" ry="18" transform="rotate(240 50 50)"/></g>
    <g fill="#fff" opacity=".35"><ellipse cx="43.5" cy="23" rx="2" ry="11"/><ellipse cx="43.5" cy="23" rx="2" ry="11" transform="rotate(120 50 50)"/><ellipse cx="43.5" cy="23" rx="2" ry="11" transform="rotate(240 50 50)"/></g>
    <circle cx="50" cy="50" r="13" fill="${F.sonne}"/>${sichel(50, 50, 13, 0.15)}<circle cx="50" cy="50" r="5" fill="${F.tinte}"/>`);
  B.teilKompass = () => svg("0 0 100 100", `
    <rect x="43" y="3" width="14" height="14" rx="5" fill="${F.holz2}"/>
    <circle cx="50" cy="54" r="41" fill="${F.holz}"/>${sichel(50, 54, 41, 0.15, 0, 0.45, 0.62)}${glanz(50, 54, 36.5, 205, 245, 3, 0.35)}<circle cx="50" cy="54" r="32" fill="${F.papier}"/>
    <path d="M50 26 L60 54 H40Z" fill="${F.koralle}"/><path d="M50 82 L60 54 H40Z" fill="${F.tinte}"/>
    <circle cx="50" cy="54" r="5" fill="${F.sonne}"/>`);
  B.teilLampe = () => svg("0 0 100 100", `
    <g stroke="${F.sonne}" stroke-width="7" stroke-linecap="round"><path d="M50 5 V17 M17 18 L26 27 M83 18 L74 27 M5 50 H17 M95 50 H83"/></g>
    <path d="M27 58 Q27 30 50 30 Q73 30 73 58Z" fill="${F.sonne}"/><path d="M27 58 Q27 54 27.5 51 H72.5 Q73 54 73 58Z" fill="#000" opacity=".12"/><circle cx="42" cy="44" r="6" fill="#fff" opacity=".7"/>
    <rect x="22" y="56" width="56" height="12" rx="6" fill="${F.tinte}"/><rect x="39" y="68" width="22" height="24" rx="5" fill="${METALL}"/><path d="M54 68 H61 V87 A5 5 0 0 1 56 92 H54Z" fill="#000" opacity=".14"/>`);
  B.teilTriebwerk = () => svg("0 0 100 100", `
    <path d="M30 64 Q50 104 70 64Z" fill="${F.koralle}"/><path d="M40 64 Q50 88 60 64Z" fill="${F.sonne}"/>
    <path d="M36 8 H64 L78 56 H22Z" fill="${METALL}"/><path d="M36 8 H64 L68 22 H32Z" fill="${METALL2}"/>
    <path d="M56 8 H64 L78 56 H66Z" fill="#000" opacity=".14"/><path d="M36.5 27 L30 50" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity=".35"/>
    <rect x="17" y="54" width="66" height="11" rx="5" fill="${F.tinte}"/>`);

  /* ---------- Hafen: Leuchtturm, Fähre, Seekarte (v0.14) ---------- */
  // Leuchtturm, 120 breit und 400 hoch, Fuß bei y = 400. Die Lampe hat die Klasse „lt-lampe“.
  // Mit etwas Tiefe: Schatten am Fuß, rechte Seite dunkler, heller Rand links auf den roten Ringen
  const leuchtturm = () => `
    <ellipse cx="60" cy="396.5" rx="56" ry="3.5" fill="${F.tinte}" opacity=".14"/>
    <path d="M20 400 L40 110 H80 L100 400Z" fill="${F.papier}"/>
    <path d="M36 165 H84 L88 222 H32Z" fill="${F.koralle}"/><path d="M28 280 H92 L96 338 H24Z" fill="${F.koralle}"/>
    <path d="M68 110 H80 L100 400 H82Z" fill="#000" opacity=".1"/>
    <path d="M40 170 L36.8 217 M32.2 285 L28.9 333" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity=".3"/>
    <path d="M39.9 112 H80.1 L80.5 117 H39.5Z" fill="#000" opacity=".14"/>
    <rect x="26" y="98" width="68" height="14" rx="4" fill="${F.tinte}"/>
    <rect x="38" y="52" width="44" height="48" rx="6" fill="${F.meer2}"/><path d="M43 58 V93" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".35"/><circle class="lt-lampe" cx="60" cy="76" r="14" fill="${F.sonne}"/>
    <path d="M30 54 L60 14 L90 54Z" fill="${F.koralle}"/><path d="M60 14 L90 54 H73Z" fill="#000" opacity=".13"/>
    <path d="M46 400 V356 Q60 338 74 356 V400Z" fill="${F.holz2}"/>
    <rect x="52" y="240" width="16" height="22" rx="6" fill="${F.meer}"/>`;
  // Kleine Inselfähre (frei gezeichnet, an kleine griechische Inselfähren angelehnt)
  const faehre = () => `
    <path d="M18 92 H232 L214 128 H40Z" fill="#2a5d8f"/><path d="M18 92 H232 L229 101 H22Z" fill="${F.papier}"/>
    <path d="M32.7 116 H220 L214 128 H40Z" fill="#000" opacity=".14"/>
    <rect x="60" y="56" width="120" height="38" rx="6" fill="${F.papier}"/><path d="M170 56 H174 A6 6 0 0 1 180 62 V88 A6 6 0 0 1 174 94 H170Z" fill="#000" opacity=".08"/>
    <rect x="84" y="58" width="60" height="4" fill="#000" opacity=".1"/>
    ${[0, 1, 2, 3, 4].map((i) => `<rect x="${70 + i * 21}" y="66" width="13" height="13" rx="3" fill="${F.meer}"/>`).join("")}
    <rect x="84" y="34" width="60" height="24" rx="5" fill="${F.papier}"/><rect x="92" y="40" width="44" height="10" rx="3" fill="${F.meer}"/>
    <rect x="152" y="26" width="20" height="32" rx="3" fill="${F.sonne}"/><path d="M165 35 H172 V55 A3 3 0 0 1 169 58 H165Z" fill="#000" opacity=".13"/><path d="M156 38 V54" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".4"/><rect x="152" y="26" width="20" height="9" rx="3" fill="${F.tinte}"/>
    <path d="M112 34 V10" stroke="${F.tinte}" stroke-width="4" stroke-linecap="round"/><path d="M112 10 L130 16 L112 22Z" fill="${F.koralle}"/>`;
  const meer = (y) => `<rect y="${y}" width="1024" height="${768 - y}" fill="${F.meer}"/>
    <path d="${welle(y + 44, 10)} V768 H0Z" fill="${F.meer2}" opacity=".55"/><path d="${welle(y + 110, 12)} V768 H0Z" fill="${F.tief}" opacity=".3"/>`;

  B.faehre = () => svg("0 0 250 140", faehre());
  // Die Fähre als Tor. Seit v0.28.2 ohne eigene Wasserfläche: Sie liegt im Meer oder in der Bucht des kleinen Hafens (anleger).
  B.figurFaehre = () => svg("0 0 250 150", `<ellipse cx="127" cy="128" rx="94" ry="5" fill="${F.tinte}" opacity=".13"/>${faehre()}
    <path d="M24 136 q12 -8 24 0 t24 0 M150 138 q12 -8 24 0 t24 0" stroke="${F.papier}" stroke-width="4" fill="none" stroke-linecap="round"/>`);
  B.wolke = () => svg("0 0 100 100", `<g fill="${F.papier}"><circle cx="34" cy="56" r="20"/><circle cx="56" cy="44" r="24"/><circle cx="74" cy="60" r="16"/><rect x="18" y="56" width="68" height="22" rx="11"/></g>`);
  // Fundstück am Hafen
  B.anker = () => {
    // darunter derselbe Anker noch einmal, dunkler und ein Stück tiefer: das zweite Blatt
    const form = `<circle cx="50" cy="17" r="9" stroke-width="7"/><path d="M50 27 V86 M30 42 H70"/><path d="M18 62 Q22 88 50 88 Q78 88 82 62"/>`;
    return svg("0 0 100 100", `<g stroke="#44586a" stroke-width="9" fill="none" stroke-linecap="round" transform="translate(0 3)">${form}</g>
    <g stroke="#5f7482" stroke-width="9" fill="none" stroke-linecap="round">${form}</g>
    <path d="M47.5 31 V80" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".35"/>`);
  };
  // Fundstück vom Zahlenstrahl am Steg
  B.boje = () => svg("0 0 100 100", `
    <ellipse cx="50" cy="88" rx="32" ry="8" fill="${F.meer2}"/>
    <path d="M50 12 V32" stroke="${F.tinte}" stroke-width="5" stroke-linecap="round"/><circle cx="50" cy="10" r="6" fill="${F.sonne}"/>
    <path d="M30 86 Q26 42 50 30 Q74 42 70 86Z" fill="${F.koralle}"/><path d="M29 62 Q50 56 71 62 V74 Q50 68 29 74Z" fill="${F.papier}"/>
    <path d="M70 86 Q74 42 50 30 Q63 45 60 86Z" fill="#000" opacity=".13"/>
    <path d="M37 52 Q38 44 45 38" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".4"/>`);
  // Werkzeuge (v0.17): Sie öffnen Verstecke und sind dort als kleines blinkendes Zeichen zu sehen
  B.teilSchaufel = () => svg("0 0 100 100", `
    <rect x="46" y="10" width="8" height="50" rx="4" fill="${F.holz}"/><rect x="47.5" y="18" width="2" height="34" rx="1" fill="#fff" opacity=".3"/><rect x="36" y="4" width="28" height="11" rx="5.5" fill="${F.holz2}"/>
    <path d="M30 56 H70 V74 Q70 96 50 96 Q30 96 30 74Z" fill="${METALL}"/><path d="M50 56 H70 V74 Q70 96 50 96Z" fill="#000" opacity=".12"/><path d="M50 58 V94" stroke="${METALL2}" stroke-width="3"/>`);
  B.teilGreifarm = () => svg("0 0 100 100", `
    <rect x="44" y="52" width="12" height="44" rx="5" fill="${METALL}"/><rect x="46.5" y="64" width="2.5" height="26" rx="1.25" fill="#fff" opacity=".35"/><circle cx="50" cy="52" r="11" fill="${F.tinte}"/>
    <g stroke="#c9543f" fill="none" stroke-linecap="round" transform="translate(0 3)"><path d="M43 46 Q20 36 26 12 M57 46 Q80 36 74 12" stroke-width="10"/><path d="M26 12 L39 19 M74 12 L61 19" stroke-width="8"/></g>
    <path d="M43 46 Q20 36 26 12 M57 46 Q80 36 74 12" stroke="${F.koralle}" stroke-width="10" fill="none" stroke-linecap="round"/>
    <path d="M26 12 L39 19 M74 12 L61 19" stroke="${F.koralle}" stroke-width="8" stroke-linecap="round"/>`);
  B.teilFernrohr = () => svg("0 0 100 100", `<g transform="rotate(-28 50 50)">
    <rect x="8" y="41" width="34" height="18" rx="4" fill="${F.holz}"/><rect x="40" y="37" width="30" height="26" rx="4" fill="${F.sonne}"/>
    <rect x="68" y="33" width="20" height="34" rx="5" fill="${F.holz}"/>
    <path d="M8 53 H40 V59 H12 Q8 59 8 55Z M40 55 H68 V63 H44 Q40 63 40 59Z M68 57 H88 V62 Q88 67 83 67 H73 Q68 67 68 62Z" fill="#000" opacity=".13"/>
    <path d="M13 45 H36 M45 42 H64 M73 39 H83" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".35"/>
    <ellipse cx="89" cy="50" rx="5" ry="14" fill="${F.meer2}"/><ellipse cx="88" cy="44" rx="1.5" ry="4" fill="#fff" opacity=".5"/></g>`);
  // Leuchtturm fürs Spiel „Zahlenreihe“: mit zwei Lichtkegeln (Klasse „lt-strahl“), die am Ende angehen
  B.leuchtturm = () => svg("-150 0 420 400", `<path class="lt-strahl" d="M74 76 L270 20 L270 132Z" fill="${F.sonne}"/><path class="lt-strahl" d="M46 76 L-150 20 L-150 132Z" fill="${F.sonne}"/>${leuchtturm()}`);
  /* ---------- Hintergründe für Weltkarte und Sternenkarte ---------- */
  // Sterne an festen Plätzen: Dieselbe Saat ergibt immer dasselbe Bild (die Karte soll nicht bei jedem Öffnen anders aussehen)
  const festeSterne = (saat, n, breite, hoehe) => {
    let a = saat;
    const z = () => { a = (a * 16807) % 2147483647; return a / 2147483647; };
    return Array.from({ length: n }, () => `<circle cx="${z1(z() * breite)}" cy="${z1(z() * hoehe)}" r="${z1(1.2 + z() * 2.2)}"/>`).join("");
  };
  // Weltkarte: drei Bänder. Oben das Weltall, in der Mitte Himmel und Meer, unten die Welt unter Wasser.
  // Die Höhen passen zu den Zeilen der Karte in js/app.js (KARTE.zeilen). Seit v0.26 ist die Karte breiter als der
  // Bildschirm (b = KARTE.breite): Wellen und Sandboden laufen über die ganze Breite, Wolken und Luftblasen
  // wiederholen sich alle 1024 Pixel.
  const welleBreit = (y, hub, b) => { let d = `M0 ${y} Q64 ${y - hub} 128 ${y}`; for (let x = 256; x < b + 128; x += 128) d += ` T${x} ${y}`; return d; };
  const jeBild = (b, fn) => { let s = ""; for (let x = 0; x < b; x += 1024) s += fn(x); return s; };
  B.karteGrund = (b = 1024) => svg(`0 0 ${b} 768`, `
    <rect width="${b}" height="768" fill="${F.meer}"/>
    <rect width="${b}" height="352" fill="${F.himmel}"/>
    <path d="M0 0 H${b} V216 Q${b / 2} 180 0 216Z" fill="#3b4488"/>
    <path d="M0 0 H${b} V202 Q${b / 2} 166 0 202Z" fill="#141a3a"/>
    <g fill="#fff" opacity=".85">${festeSterne(11, Math.round(54 * b / 1024), b, 170)}</g>
    <g fill="#fff" opacity=".8">${jeBild(b, (x) => `<ellipse cx="${x + 250}" cy="266" rx="44" ry="12"/><ellipse cx="${x + 278}" cy="257" rx="26" ry="11"/><ellipse cx="${x + 940}" cy="262" rx="38" ry="11"/><ellipse cx="${x + 914}" cy="254" rx="22" ry="10"/><ellipse cx="${x + 120}" cy="300" rx="30" ry="9"/>`)}</g>
    <path d="${welleBreit(356, 9, b)} V382 H0Z" fill="${F.meer2}" opacity=".75"/>
    <path d="${welleBreit(596, 11, b)} V768 H0Z" fill="${F.tief}"/>
    <path d="${welleBreit(620, 9, b)} V768 H0Z" fill="${F.tief2}" opacity=".55"/>
    <g fill="none" stroke="#fff" stroke-width="3" opacity=".3">${jeBild(b, (x) => `<circle cx="${x + 470}" cy="676" r="9"/><circle cx="${x + 492}" cy="644" r="6"/><circle cx="${x + 860}" cy="700" r="10"/><circle cx="${x + 884}" cy="660" r="6"/><circle cx="${x + 700}" cy="726" r="7"/>`)}</g>
    <path d="${(() => { let d = "M0 744 Q256 728 512 742"; for (let x = 1024; x < b + 512; x += 512) d += ` T${x} ${x % 1024 ? 742 : 738}`; return d; })()} V768 H0Z" fill="${F.sand3}"/>`);
  // Sternenkarte: Sterne und eine Umlaufbahn, auf der die besuchten Planeten liegen
  B.sternGrund = () => svg("0 0 1024 768", `
    <rect width="1024" height="768" fill="#141a3a"/>
    <g fill="#fff" opacity=".85">${festeSterne(23, 110, 1024, 768)}</g>
    <ellipse cx="512" cy="372" rx="380" ry="250" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="4 14" stroke-linecap="round" opacity=".3"/>`);
  // Noch unbekannter Planet auf der Weltkarte (wie die Wolke über einer unentdeckten Insel)
  B.planetFremd = () => svg("0 0 100 100", `<circle cx="50" cy="52" r="27" fill="${F.papier}"/><ellipse cx="50" cy="52" rx="42" ry="10" fill="none" stroke="${F.papier}" stroke-width="5" transform="rotate(-16 50 52)"/>`);

  B.meerBild = () => svg("0 0 1024 768",`<rect width="1024" height="768" fill="${F.himmel}"/><circle cx="820" cy="130" r="56" fill="${F.sonne}"/>${meer(400)}`);
  B.hafenNah = () => svg("0 0 1024 768", `<rect width="1024" height="768" fill="${F.himmel}"/>${meer(330)}<path d="M0 600 Q512 570 1024 600 V768 H0Z" fill="${F.sand}"/>`);

  // Hafen: links der Leuchtturm auf seinem Felsen, rechts der Steg; die Fähre liegt als Tor davor im Wasser
  B.hafen = () => svg("0 0 1024 768", `
    <rect width="1024" height="768" fill="${F.himmel}"/>
    <circle cx="880" cy="104" r="50" fill="${F.sonne}"/>
    <g fill="#fff" opacity=".9"><ellipse cx="420" cy="96" rx="74" ry="22"/><ellipse cx="470" cy="80" rx="46" ry="20"/><ellipse cx="700" cy="150" rx="56" ry="16"/></g>
    <path d="M30 262 Q110 214 200 262Z" fill="${F.tief}" opacity=".45"/>
    <path d="M610 262 Q720 206 840 262Z" fill="${F.tief}" opacity=".45"/><path d="M712 226 q9 -34 18 0 v10 h-18Z" fill="${F.tief}" opacity=".45"/>
    ${meer(256)}
    <g opacity=".32"><path class="lichtkegel" d="M200 132 L580 70 L580 200Z" fill="${F.sonne}"/></g>
    <path d="M60 470 Q170 396 330 470Z" fill="${F.stein}"/>
    <g transform="translate(130 60) scale(.95)">${leuchtturm()}</g>
    <path d="M0 448 Q512 420 1024 448 V768 H0Z" fill="${F.sand}"/>
    <path d="M0 448 Q512 420 1024 448 V470 Q512 442 0 470Z" fill="${F.sand2}"/>
    <ellipse cx="190" cy="444" rx="58" ry="6" fill="${F.tinte}" opacity=".14"/>
    <rect x="848" y="300" width="6" height="152" fill="${F.tinte}" opacity=".14"/>
    <rect x="690" y="300" width="150" height="150" fill="${F.holz}"/>
    <path d="M690 330 H840 M690 360 H840 M690 390 H840 M690 420 H840" stroke="${F.holz2}" stroke-width="5"/>
    <rect x="698" y="300" width="5" height="150" fill="#000" opacity=".1"/>
    <rect x="682" y="290" width="16" height="170" rx="6" fill="${F.holz2}"/><rect x="832" y="290" width="16" height="170" rx="6" fill="${F.holz2}"/>
    <path d="M691 296 H698 V454 H691Z M841 296 H848 V454 H841Z" fill="#000" opacity=".14"/>
    <path d="M685.5 298 V452 M835.5 298 V452" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".22"/>
    <ellipse cx="361" cy="456" rx="14" ry="3" fill="${F.tinte}" opacity=".16"/><ellipse cx="941" cy="458" rx="14" ry="3" fill="${F.tinte}" opacity=".16"/>
    <g fill="${F.tinte}"><rect x="350" y="430" width="18" height="26" rx="6"/><rect x="930" y="432" width="18" height="26" rx="6"/></g>
    <path d="M354.5 436 V450 M934.5 438 V452" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".25"/>
    <ellipse cx="937" cy="577" rx="42" ry="5" fill="${F.tinte}" opacity=".14"/>
    <rect x="900" y="520" width="70" height="56" rx="8" fill="${F.holz}"/><path d="M900 548 H970 M935 520 V576" stroke="${F.holz2}" stroke-width="5"/>
    <path d="M962 520 A8 8 0 0 1 970 528 V568 A8 8 0 0 1 962 576Z" fill="#000" opacity=".14"/><rect x="906" y="523" width="54" height="3.5" rx="1.75" fill="#fff" opacity=".28"/>
    <g fill="${F.sand3}" opacity=".7"><circle cx="150" cy="640" r="5"/><circle cx="520" cy="560" r="4"/><circle cx="780" cy="700" r="5"/><circle cx="330" cy="720" r="4"/></g>`);
  /* ---------- Buddelinsel (v0.22): Sandbauten, Werkzeug in den Armen, Ort und Hintergrund ---------- */
  // Was auf einem Feld im Sand steht (js/aufgaben/buddeln.js). Ein Feld ist 64 breit; sein Boden reicht von y = 0
  // (hinten) bis y = 64 (vorn). Hohes ragt nach oben hinaus, Breites zur Seite (das Bild schneidet nichts ab).
  //   h      Höhe: -2 und -1 = Loch (das Loch selbst zeichnet das Spiel), 0 = flach, 1 bis 5 = Sandhaufen
  //   auf    Bauwerk: 0 = keins, 1 = Turm, 2 = Mauer, 3 = großer Turm, 4 = Burgtor
  //   deko   Schmuck obenauf: 0 = keiner, 1 = Fahne, 2 = Muschel, 3 = Seestern
  //   nass   im Loch steht Wasser: Ein Bauwerk steht dann im Wasser
  //   nach   Nachbarfelder { o, u, l, r } (oben, unten, links, rechts), je { h, auf }; fehlt eins, ist dort der Rand.
  //          Haufen wachsen mit Nachbarhaufen zusammen (Sattel nach rechts, Flanke nach unten). Eine Mauer richtet
  //          sich nach ihren Nachbarn aus: quer, längs (nach hinten und vorn) oder beides als Ecke.
  const BURG = "#e3bb72", BURG2 = "#d2a85e", BURG_HELL = "#efd08f", HAUFEN = "#f9e8bd";
  const haufenHoehe = (h) => (h > 0 ? 10 + h * 11 : 0);
  const sandDing = ({ h = 0, auf = 0, deko = 0, nass = false, nach = {} }) => {
    const H = haufenHoehe(h), W = 38 + Math.max(0, h - 3) * 8;       // Höhe und halbe Breite des Haufens (ab Stufe 4 wird er auch breiter)
    const yb = h > 0 ? 74 - H : h < 0 ? 62 - h * 5 : 62;               // Fuß eines Bauwerks: auf dem Haufen höher, im Loch tiefer
    const lift = 62 - yb;                                              // so weit steht es über (oder unter) dem flachen Sand
    const nb = (k) => nach[k] || {};
    const schatten = (rx) => (h === 0 ? `<ellipse cx="33" cy="${yb + 1}" rx="${rx}" ry="4" fill="${F.tinte}" opacity=".14"/>` : "");
    // Wall unter Mauer und Tor, wenn sie auf einem Haufen stehen
    const wall = () => (h > 0 ? `<rect x="-2" y="${yb - 2}" width="68" height="${66 - yb}" fill="${HAUFEN}"/><rect x="-2" y="${z1(64 - (64 - yb) * 0.4)}" width="68" height="${z1((64 - yb) * 0.4)}" fill="#000" opacity=".07"/>` : "");
    // Bauwerk im Wasser: Das Wasser steht ein Stück am Fuß, davor kleine Wellen
    const wasser = (x0, x1) => (nass && h < 0 ? `<rect x="${x0}" y="${yb - 7}" width="${x1 - x0}" height="8" fill="${F.meer2}" opacity=".7"/>
      <path d="M${x0 + 1} ${yb - 7} ${Array.from({ length: Math.floor((x1 - x0 - 2) / 12) }, () => "q3 -3.5 6 0 t6 0").join(" ")}" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".75"/>` : "");
    let t = "";

    if (h > 0) {
      const hr = haufenHoehe(nb("r").h || 0), hu = haufenHoehe(nb("u").h || 0);
      t += `<ellipse cx="34" cy="64" rx="${W}" ry="4.5" fill="${F.tinte}" opacity=".12"/>`;
      // nach unten: eine Flanke bis in den Haufen darunter (er wird später gezeichnet und liegt darüber)
      if (hu) { const y0 = 64 - H * 0.5, y1 = 128 - hu * 0.6;   // von der halben Höhe dieses Haufens bis in den unteren hinein
        t += `<ellipse cx="32" cy="${z1((y0 + y1) / 2)}" rx="${z1(W * 0.86)}" ry="${z1((y1 - y0) / 2)}" fill="${HAUFEN}"/>
        <path d="M${z1(32 + W * 0.3)} ${z1(y0 + 6)} A${z1(W * 0.56)} ${z1((y1 - y0) / 2)} 0 0 1 ${z1(32 + W * 0.3)} ${z1(y1 - 6)} A${z1(W * 0.3)} ${z1((y1 - y0) / 2)} 0 0 0 ${z1(32 + W * 0.3)} ${z1(y0 + 6)}Z" fill="#000" opacity=".08"/>`; }
      // nach rechts: ein Sattel bis zur Mitte des Nachbarhaufens
      if (hr) { const a = z1(64 - H * 0.9), b = z1(64 - hr * 0.9), m = z1(64 - Math.min(H, hr) * 0.72);
        t += `<path d="M32 64 V${a} C48 ${a} 48 ${m} 64 ${m} C80 ${m} 80 ${b} 96 ${b} V64Z" fill="${HAUFEN}"/>`; }
      t += `<path d="M${32 - W} 64 C${z1(32 - W * 0.74)} ${z1(64 - H * 1.3)} ${z1(32 + W * 0.74)} ${z1(64 - H * 1.3)} ${32 + W} 64Z" fill="${HAUFEN}"/>
        <path d="M32 ${z1(64 - H * 0.97)} C${z1(32 + W * 0.47)} ${z1(64 - H * 0.95)} ${z1(32 + W * 0.79)} ${z1(64 - H * 0.55)} ${32 + W} 64 H${z1(32 + W * 0.26)} C${z1(32 + W * 0.37)} ${z1(64 - H * 0.5)} ${z1(32 + W * 0.26)} ${z1(64 - H * 0.85)} 32 ${z1(64 - H * 0.97)}Z" fill="#000" opacity=".1"/>
        <path d="M${z1(32 - W * 0.6)} ${z1(64 - H * 0.5)} Q${z1(32 - W * 0.45)} ${z1(64 - H * 0.86)} ${z1(32 - W * 0.16)} ${z1(64 - H * 0.95)}" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".5"/>`;
    }

    if (auf === 1) t += `${schatten(25)}
      <path d="M12 ${yb} L17 ${yb - 40} H47 L52 ${yb}Z" fill="${BURG}"/>
      <path d="M15 ${yb - 40} v-8 h8 v8 M28 ${yb - 40} v-8 h8 v8 M41 ${yb - 40} v-8 h8 v8" fill="${BURG}"/>
      <path d="M39 ${yb - 40} H47 L52 ${yb} H41Z" fill="#000" opacity=".12"/>
      <path d="M18.5 ${yb - 6} L22 ${yb - 36}" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".32"/>
      <path d="M27 ${yb} v-12 q5 -6 10 0 v12z" fill="${F.holz2}" opacity=".8"/>${wasser(12, 52)}`;
    if (auf === 3) t += `${schatten(28)}
      <path d="M8 ${yb} L13 ${yb - 58} H51 L56 ${yb}Z" fill="${BURG}"/>
      <rect x="8" y="${yb - 68}" width="48" height="12" fill="${BURG}"/>
      <path d="M8 ${yb - 68} v-8 h9 v8 M21 ${yb - 68} v-8 h9 v8 M34 ${yb - 68} v-8 h9 v8 M47 ${yb - 68} v-8 h9 v8" fill="${BURG}"/>
      <path d="M43 ${yb - 56} H51 L56 ${yb} H45Z" fill="#000" opacity=".12"/><rect x="47" y="${yb - 68}" width="9" height="12" fill="#000" opacity=".12"/>
      <rect x="13" y="${yb - 56}" width="38" height="4" fill="#000" opacity=".1"/>
      <path d="M14.5 ${yb - 6} L18.5 ${yb - 50}" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".32"/>
      <rect x="29" y="${yb - 44}" width="6" height="12" rx="3" fill="${F.holz2}" opacity=".75"/>
      <path d="M25 ${yb} v-15 q7 -8 14 0 v15z" fill="${F.holz2}" opacity=".8"/>${wasser(8, 56)}`;
    if (auf === 4) t += `${wall()}${h === 0 ? `<rect x="-2" y="${yb - 1}" width="68" height="5" rx="2.5" fill="${F.tinte}" opacity=".12"/>` : ""}
      <rect x="-2" y="${yb - 44}" width="68" height="44" fill="${BURG}"/>
      <path d="M1 ${yb - 44} v-8 h10 v8 M18 ${yb - 44} v-8 h10 v8 M35 ${yb - 44} v-8 h10 v8 M52 ${yb - 44} v-8 h10 v8" fill="${BURG}"/>
      <rect x="54" y="${yb - 44}" width="12" height="44" fill="#000" opacity=".1"/><rect x="-2" y="${yb - 44}" width="68" height="3.5" fill="#fff" opacity=".25"/>
      <path d="M13 ${yb} v-19 q19 -25 38 0 v19z" fill="${F.holz2}"/><path d="M32 ${yb} v-31" stroke="#000" stroke-width="2.5" opacity=".25"/>
      <path d="M17 ${yb - 3} v-15 q4 -6 9 -9" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".2"/>
      <circle cx="27.5" cy="${yb - 12}" r="2" fill="${F.sonne}"/><circle cx="36.5" cy="${yb - 12}" r="2" fill="${F.sonne}"/>${wasser(-2, 66)}`;

    let laengsAllein = false, ecke = false;
    if (auf === 2) {
      const l = nb("l").auf || 0, r = nb("r").auf || 0, o = nb("o").auf || 0, u = nb("u").auf || 0;
      const quer = !!(l || r) || !(o || u);
      laengsAllein = !quer;
      ecke = quer && !!(o || u);                                          // hier treffen sich Mauern: In der Mitte steht ein Eckpfosten
      // Längsstück von der Bodenlinie y0 (hinten) bis y1 (vorn): helle Oberseite mit Zinnen, vorn die Stirnseite
      const laengs = (y0, y1, stirn) => {
        const a = y0 - 24 - lift, b = y1 - 24 - lift;
        let s = `<rect x="21" y="${a}" width="22" height="${b - a}" fill="${BURG_HELL}"/><rect x="39" y="${a}" width="4" height="${b - a}" fill="#000" opacity=".1"/>`;
        for (let y = a + 4; y <= b - 8; y += 16) s += `<rect x="19" y="${y - 6}" width="26" height="8" fill="${BURG_HELL}"/><rect x="19" y="${y + 2}" width="26" height="6" fill="${BURG}"/><rect x="41" y="${y + 2}" width="4" height="6" fill="#000" opacity=".1"/>`;
        if (stirn) s += `${h > 0 ? `<rect x="15" y="${b + 22}" width="34" height="${lift + 4}" fill="${HAUFEN}"/>` : ""}
          <rect x="21" y="${b}" width="22" height="24" fill="${BURG2}"/><rect x="21" y="${b + 17}" width="22" height="7" fill="#000" opacity=".1"/>`;
        return s;
      };
      const hinten = o === 2 ? 0 : o ? 12 : 8;                            // an eine Mauer anschließen, an einen Turm heranreichen, sonst frei enden
      const vorn = u === 1 ? 88 : u === 4 ? 76 : u ? 64 : 56;
      if (!quer) t += `${h === 0 ? `<rect x="19" y="${vorn - 3}" width="26" height="5" rx="2.5" fill="${F.tinte}" opacity=".12"/>` : ""}${laengs(hinten, vorn, true)}${wasser(21, 43)}`;
      else {
        // Das Querstück reicht bis an einen Turm heran. An einer Ecke läuft es nur zu den Seiten, an denen es
        // weitergeht, und endet sonst am Eckpfosten (x = 19 bis 45).
        const x0 = !l && ecke ? 21 : l === 1 ? -14 : l === 3 ? -10 : -2, x1 = !r && ecke ? 43 : r === 1 ? 78 : r === 3 ? 74 : 66;
        const zinnen = [1, 18, 35, 52].filter((x) => x >= x0 && x + 10 <= x1 && (!ecke || x + 10 <= 19 || x >= 45)).map((x) => `M${x} ${yb - 24} v-8 h10 v8`).join(" ");
        if (o) t += laengs(hinten, 50, false);                             // von hinten bis an die Deckfläche des Eckstücks
        t += `${wall()}${h === 0 ? `<rect x="${x0}" y="${yb - 1}" width="${x1 - x0}" height="5" rx="2.5" fill="${F.tinte}" opacity=".12"/>` : ""}
          <rect x="${x0}" y="${yb - 24}" width="${x1 - x0}" height="24" fill="${BURG2}"/>${zinnen ? `<path d="${zinnen}" fill="${BURG}"/>` : ""}
          <rect x="${x0}" y="${yb - 7}" width="${x1 - x0}" height="7" fill="#000" opacity=".1"/><rect x="${x0}" y="${yb - 24}" width="${x1 - x0}" height="3.5" fill="#fff" opacity=".25"/>${wasser(x0, x1)}`;
        // Eckstück: so hoch wie die Mauer und nur wenig tief, damit es oben kaum über die Mauer hinausragt.
        // Oben die helle Deckfläche (bis knapp über die Zinnen), vorn die Seite.
        if (ecke) t += `<rect x="19" y="${yb - 36}" width="26" height="12" fill="${BURG_HELL}"/><rect x="41" y="${yb - 36}" width="4" height="12" fill="#000" opacity=".08"/>
          <rect x="19" y="${yb - 24}" width="26" height="24" fill="${BURG}"/><rect x="41" y="${yb - 24}" width="4" height="24" fill="#000" opacity=".12"/>
          <rect x="19" y="${yb - 7}" width="26" height="7" fill="#000" opacity=".1"/><path d="M21.5 ${yb - 5} V${yb - 21}" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".3"/>`;
        if (u) t += laengs(62, vorn, true);                                // nach vorn geht es an der Vorderseite des Pfostens weiter
      }
    }

    // Schmuck: sitzt oben auf dem, was auf dem Feld steht, sonst liegt er im Sand
    const oben = auf === 1 ? yb - 48 : auf === 3 ? yb - 76 : auf === 4 ? yb - 52 : auf === 2 ? (laengsAllein ? yb - 54 : ecke ? yb - 34 : yb - 32) : h > 0 ? 64 - H : 0;
    const fuss = auf || h > 0 ? oben + 3 : 58;
    if (deko === 1) t += `<path d="M32 ${fuss} V${fuss - 30}" stroke="${F.holz2}" stroke-width="3.5" stroke-linecap="round"/><path d="M32 ${fuss - 30} L53 ${fuss - 23} L32 ${fuss - 16}Z" fill="${F.koralle}"/>`;
    if (deko === 2) t += `<g transform="translate(18 ${fuss - 26}) scale(.28)">${teil.muschel()}</g>`;
    if (deko === 3) t += `<g transform="translate(18 ${fuss - 27}) scale(.28)">${teil.seestern()}</g>`;
    return t;
  };
  B.sandBild = (z, vb = "0 -44 64 108") => svg(vb, sandDing(z));
  // Zeichen für das Schmücken (Knopf auf der Buddelinsel): Haufen mit Fahne, daneben Muschel und Seestern
  B.schmuckZeichen = () => svg("-8 -12 80 80", `${sandDing({ h: 1, deko: 1 })}<g transform="translate(-6 40) scale(.26)">${teil.muschel()}</g><g transform="translate(46 42) scale(.25)">${teil.seestern()}</g>`);
  // Zeichen für „Einfach fahren“ (Knopf auf der Buddelinsel): die Figur mit vier Pfeilen. So unterscheidet es sich
  // vom Roboter-Knopf oben rechts, der auch die Figur zeigt.
  B.fahrZeichen = () => svg("0 0 120 120", `<g transform="translate(24 30) scale(.6)">${teil.rover()}</g>
    <g fill="${F.tinte}" stroke="${F.tinte}" stroke-width="5" stroke-linejoin="round"><path d="M60 5 L70 18 H50Z"/><path d="M60 115 L70 102 H50Z"/><path d="M5 62 L18 52 V72Z"/><path d="M115 62 L102 52 V72Z"/></g>`);
  // Sandförmchen und Geräte, die die Figur auf der Buddelinsel in den Armen hält
  B.eimer = () => svg("0 0 100 100", `
    <path d="M24 34 Q50 4 76 34" stroke="${F.tinte}" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M18 34 H82 L72 92 Q50 98 28 92Z" fill="${F.meer}"/><path d="M60 34 H82 L72 92 Q64 95 56 96Z" fill="#000" opacity=".13"/>
    <rect x="14" y="28" width="72" height="12" rx="6" fill="${F.meer2}"/><path d="M27 46 L33 84" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".35"/>`);
  B.harke = () => svg("0 0 100 100", `
    <rect x="46" y="4" width="8" height="64" rx="4" fill="${F.holz}"/><rect x="47.5" y="12" width="2" height="46" rx="1" fill="#fff" opacity=".3"/>
    <rect x="20" y="64" width="60" height="11" rx="5" fill="${F.koralle}"/>
    <path d="M26 74 V92 M38 74 V92 M50 74 V92 M62 74 V92 M74 74 V92" stroke="${F.koralle}" stroke-width="7" stroke-linecap="round"/>
    <path d="M64 64 H75 Q80 64 80 69.5 Q80 75 75 75 H64Z" fill="#000" opacity=".13"/>`);
  B.fahne = () => svg("0 0 100 100", `<path d="M50 96 V8" stroke="${F.holz2}" stroke-width="7" stroke-linecap="round"/><path d="M50 8 L90 22 L50 38Z" fill="${F.koralle}"/><path d="M50 26 L90 22 L50 38Z" fill="#000" opacity=".12"/>`);
  // Welle (Knopf auf der Buddelinsel: Sie macht den ganzen Sand wieder glatt)
  B.welleZeichen = () => svg("0 0 100 100", `
    <path d="M6 66 Q20 28 48 30 Q76 32 70 54 Q58 44 46 52 Q40 62 54 70 H94 V90 H6Z" fill="${F.meer}"/>
    <path d="M6 76 Q22 66 38 76 T70 76 T94 74 V90 H6Z" fill="${F.meer2}"/>
    <path d="M22 44 Q32 34 46 34" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".5"/>
    <circle cx="74" cy="56" r="4" fill="${F.papier}"/><circle cx="64" cy="50" r="3" fill="${F.papier}"/>`);
  // Arm der Figur mit einem Werkzeug in der Hand (bildName = Bildfunktion des Werkzeugs, z. B. "teilSchaufel").
  // Die Schulter liegt bei (8, 58), die Hand bei (57, 46). Das Bild wird rechts an die Figur gesetzt (Klasse „arm“).
  B.arm = (bildName) => svg("0 0 100 100", `${(B[bildName] ? B[bildName]() : "").replace("<svg ", `<svg x="22" y="10" width="70" height="70" `)}
    <path d="M8 58 L30 68 L57 46" stroke="${F.rover2}" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="30" cy="68" r="5.5" fill="${F.tinte}"/><circle cx="57" cy="46" r="8.5" fill="${F.rover}"/><circle cx="55" cy="44" r="3" fill="#fff" opacity=".4"/>`);

  // Buddelinsel: viel Sand, ein Sonnenschirm, eine fertige Burg als Vorbild; die Fähre liegt links im Meer
  B.buddelinsel = () => svg("0 0 1024 768", `
    <rect width="1024" height="768" fill="${F.himmel}"/>
    <circle cx="560" cy="88" r="74" fill="#fff" opacity=".35"/><circle cx="560" cy="88" r="46" fill="${F.sonne}"/>
    <g fill="#fff" opacity=".92"><ellipse cx="250" cy="84" rx="76" ry="22"/><ellipse cx="298" cy="68" rx="48" ry="22"/><ellipse cx="800" cy="120" rx="58" ry="17"/><ellipse cx="836" cy="108" rx="36" ry="16"/></g>
    <g stroke="${F.tinte}" stroke-width="3.5" fill="none" stroke-linecap="round"><path d="M410 70 q9 -10 18 0 q9 -10 18 0"/><path d="M700 60 q7 -8 14 0 q7 -8 14 0"/></g>
    <rect y="186" width="1024" height="170" fill="${F.meer}"/>
    <path d="M640 228 Q740 176 860 228Z" fill="${F.tief}" opacity=".45"/>
    <path d="${welle(232, 10)} V262 H0Z" fill="${F.meer2}" opacity=".5"/>
    <path d="${welle(280, 12)} V326 H0Z" fill="${F.meer2}" opacity=".85"/>
    <path d="M0 322 Q200 292 430 310 T820 304 T1024 316 V768 H0Z" fill="${F.sand2}"/>
    <path d="M0 348 Q200 318 430 336 T820 330 T1024 342 V768 H0Z" fill="${F.sand}"/>
    ${anleger(176, 322)}
    <!-- Sonnenschirm -->
    <ellipse cx="900" cy="486" rx="74" ry="9" fill="${F.tinte}" opacity=".13"/>
    <rect x="895" y="330" width="9" height="156" fill="${F.holz2}"/>
    <path d="M790 362 Q900 240 1010 362 Q955 346 900 362 Q845 346 790 362Z" fill="${F.koralle}"/>
    <path d="M860 300 Q900 262 940 300 Q932 330 900 362 Q868 330 860 300Z" fill="${F.papier}"/>
    <path d="M900 276 Q960 290 1010 362 Q955 346 900 362Z" fill="#000" opacity=".1"/><circle cx="900" cy="274" r="7" fill="${F.sonne}"/>
    <!-- fertige Burg -->
    <g transform="translate(404 350) scale(1.25)">
      <g transform="translate(64 0)">${sandDing({ h: 2 })}</g>
      <g transform="translate(0 6)">${sandDing({ auf: 1 })}</g><g transform="translate(64 0)">${sandDing({ h: 2, auf: 1, deko: 1 })}</g><g transform="translate(128 6)">${sandDing({ auf: 1 })}</g>
      <g transform="translate(40 16) scale(.75 1)">${sandDing({ auf: 2 })}</g><g transform="translate(100 16) scale(.75 1)">${sandDing({ auf: 2 })}</g>
    </g>
    <!-- Eimer, Förmchen, Sandhaufen -->
    <ellipse cx="142" cy="668" rx="36" ry="6" fill="${F.tinte}" opacity=".14"/>
    <g transform="translate(104 588) scale(.8)"><path d="M24 34 Q50 4 76 34" stroke="${F.tinte}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M18 34 H82 L72 92 Q50 98 28 92Z" fill="${F.koralle}"/><path d="M60 34 H82 L72 92 Q64 95 56 96Z" fill="#000" opacity=".13"/><rect x="14" y="28" width="72" height="12" rx="6" fill="#f59a8a"/></g>
    <g transform="translate(206 628)">${sandDing({ h: 2 })}</g><g transform="translate(780 620)">${sandDing({ h: 1, deko: 1 })}</g>
    ${kieselHaufen(266, 716)}${treibholz(944, 676, 0.8, 6)}
    <g fill="${F.sand2}"><circle cx="420" cy="470" r="5"/><circle cx="700" cy="440" r="5"/><circle cx="330" cy="660" r="4"/><circle cx="520" cy="700" r="5"/><circle cx="960" cy="560" r="4"/><circle cx="90" cy="500" r="5"/>
      <ellipse cx="840" cy="700" rx="9" ry="6"/><ellipse cx="870" cy="716" rx="9" ry="6"/></g>`);
  // Einstieg auf der Buddelinsel: der Sandplatz mit einem Turm, einem Haufen mit Fahne und einem Wasserloch
  B.figurSandplatz = () => svg("0 0 300 190", `
    <ellipse cx="150" cy="126" rx="146" ry="60" fill="${F.sand3}"/><ellipse cx="150" cy="120" rx="136" ry="52" fill="#f6e3b4"/>
    <ellipse cx="216" cy="142" rx="40" ry="14" fill="#c59d58"/><ellipse cx="216" cy="145" rx="34" ry="10" fill="${F.meer2}"/>
    <path d="M190 144 q8 -5 16 0 t16 0 t16 0" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".6"/>
    <g transform="translate(54 44) scale(1.15)">${sandDing({ auf: 1 })}</g>
    <g transform="translate(122 50) scale(1.15)">${sandDing({ h: 2, deko: 1 })}</g>
    ${kiesel(102, 112, 8)}`);
  // Hintergrund im Spiel: oben das Meer, darunter nasser und trockener Sand. Das Raster der Felder beginnt bei y = 184.
  B.buddelNah = () => svg("0 0 1024 768", `
    <rect width="1024" height="768" fill="${F.meer}"/>
    <path d="${welle(70, 9)} V200 H0Z" fill="${F.meer2}" opacity=".55"/>
    <path d="${welle(118, 9)} V200 H0Z" fill="${F.meer2}"/>
    <path d="${welle(156, 8)} V768 H0Z" fill="${F.papier}" opacity=".8"/>
    <path d="${welle(161, 8)} V768 H0Z" fill="${F.sand2}"/>
    <path d="${welle(180, 5)} V768 H0Z" fill="${F.sand}"/>
    <g fill="${F.sand2}"><circle cx="34" cy="300" r="5"/><circle cx="40" cy="560" r="5"/><circle cx="930" cy="730" r="5"/><circle cx="300" cy="736" r="4"/><circle cx="640" cy="740" r="5"/></g>`);

  /* ---------- v0.23: Im Leuchtturm, Quallengarten, Schildkrötenwiese ---------- */
  // Qualle: Schirm mit Gesicht, darunter vier Fäden. Ohne Farbe nimmt sie die CSS-Farbe (für das Spiel Blitzblick);
  // „schein“ legt einen hellen Hof dahinter (sie leuchtet).
  teil.qualle = (farbe = "currentColor", schein = false) => `${schein ? `<circle cx="50" cy="48" r="62" fill="${farbe}" opacity=".22"/>` : ""}
    <g stroke="${farbe}" stroke-width="6" fill="none" stroke-linecap="round" opacity=".85"><path d="M30 56 q-6 12 0 24 t0 22"/><path d="M44 58 q6 12 0 24 t0 20"/><path d="M58 58 q-6 12 0 24 t0 20"/><path d="M72 56 q6 12 0 24 t0 22"/></g>
    <path d="M12 58 Q12 10 50 10 Q88 10 88 58 Q78 50 69 58 Q60 50 50 58 Q40 50 31 58 Q22 50 12 58Z" fill="${farbe}"/>
    <path d="M50 10 Q88 10 88 58 Q78 50 69 58 Q72 30 50 10Z" fill="#000" opacity=".12"/>
    <path d="M24 36 Q28 22 42 17" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".5"/>
    <circle cx="40" cy="40" r="5" fill="${F.tinte}"/><circle cx="60" cy="40" r="5" fill="${F.tinte}"/><circle cx="41.6" cy="38.4" r="1.7" fill="#fff"/><circle cx="61.6" cy="38.4" r="1.7" fill="#fff"/>
    <path d="M44 49 Q50 54 56 49" stroke="${F.tinte}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  B.qualle = (schein = true) => svg("0 0 100 110", teil.qualle("currentColor", schein));
  // Fundstück aus dem Quallengarten: ein Schneckenhaus
  B.schnecke = () => svg("0 0 100 100", `
    <path d="M10 82 Q8 70 26 66 L46 78 Q40 90 22 90 Q10 90 10 82Z" fill="#f6e3b4"/><path d="M14 84 Q26 88 40 82" stroke="#000" stroke-width="3" fill="none" stroke-linecap="round" opacity=".12"/>
    <circle cx="56" cy="50" r="36" fill="#2a9d8f" transform="translate(0 3)"/><circle cx="56" cy="50" r="36" fill="#3fb8a4"/>${sichel(56, 50, 36, 0.13, 0, 0.4, 0.62)}
    <path d="M56 50 m-3 0 a7 7 0 1 1 7 7 a15 15 0 1 1 -15 -15 a24 24 0 1 1 24 24" stroke="#23796d" stroke-width="5" fill="none" stroke-linecap="round"/>
    ${glanz(56, 50, 30, 205, 250, 3.5, 0.4)}`);
  // Einstiege
  B.figurQuallen = () => svg("0 0 250 170", `
    <g transform="translate(12 46) scale(.78)">${teil.qualle("#6fd0e6", true)}</g><g transform="translate(160 30) scale(.82)">${teil.qualle("#f9d65c", true)}</g>
    <g transform="translate(70 8) scale(1.15)">${teil.qualle("#f48fb1", true)}</g>`);
  // Schildkröte ohne Schatten (250 × 170, schaut nach rechts); auch für die Schildkröten im Bild der Wiese
  teil.schildkroete = () => `
    <g fill="#7fc08a"><ellipse cx="74" cy="132" rx="26" ry="12" transform="rotate(-24 74 132)"/><ellipse cx="170" cy="136" rx="26" ry="12" transform="rotate(20 170 136)"/><path d="M40 104 q-20 2 -26 14 q16 2 28 -4z"/></g>
    <path d="M186 96 Q204 70 226 78 Q244 86 240 106 Q234 124 208 122 Q192 120 186 110Z" fill="#8fd09a"/><path d="M208 122 Q234 124 240 106 Q232 116 212 114 Q196 113 188 106 Q192 120 208 122Z" fill="#000" opacity=".12"/>
    <circle cx="222" cy="94" r="5.5" fill="${F.tinte}"/><circle cx="223.8" cy="92.2" r="1.8" fill="#fff"/><path d="M222 108 Q230 112 236 106" stroke="${F.tinte}" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M36 122 Q40 44 116 40 Q192 44 196 122 Q116 150 36 122Z" fill="${F.blatt}"/>
    <path d="M116 40 Q192 44 196 122 Q160 135 124 137 Q170 100 116 40Z" fill="#000" opacity=".13"/>
    <g stroke="${F.blatt2}" stroke-width="5" fill="none" stroke-linejoin="round"><path d="M92 66 L116 56 L140 66 L140 92 L116 104 L92 92Z"/><path d="M92 92 L66 104 M140 92 L166 104 M116 104 V132 M92 66 L70 58 M140 66 L162 58"/></g>
    <path d="M52 100 Q58 66 92 52" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".3"/>`;
  B.figurSchildkroete = () => svg("0 0 250 170", `<ellipse cx="128" cy="152" rx="96" ry="8" fill="${F.tinte}" opacity=".14"/>${teil.schildkroete()}
    <g transform="translate(2 118) scale(.34)">${teil.muenze()}</g><g transform="translate(26 126) scale(.34)">${teil.muenze()}</g><g transform="translate(12 104) scale(.34)">${teil.muenze()}</g>`);
  B.figurTreppe = () => svg("0 0 230 160", `
    <ellipse cx="118" cy="150" rx="104" ry="7" fill="${F.tinte}" opacity=".14"/>
    ${[0, 1, 2].map((i) => `<rect x="${14 + i * 68}" y="${104 - i * 36}" width="${204 - i * 68}" height="${46 + i * 36}" fill="${["#b9a98f", "#c4b59b", "#cfc1a8"][i]}"/><rect x="${14 + i * 68}" y="${104 - i * 36}" width="${204 - i * 68}" height="7" fill="#fff" opacity=".3"/>
      <text x="${48 + i * 68}" y="${144 - i * 36}" text-anchor="middle" font-family="Grundschrift, sans-serif" font-size="34" fill="${F.tinte}">${i + 1}</text>`).join("")}
    <rect x="14" y="140" width="204" height="10" fill="#000" opacity=".12"/>`);
  // Lampe oben im Leuchtturm (Ende der Zahlenreihe): Lichtkegel mit Klasse „lt-strahl“, Lampe mit „lt-lampe“
  B.turmLampe = () => svg("-160 0 400 200", `
    <path class="lt-strahl" d="M92 96 L-160 20 L-160 180Z" fill="${F.sonne}"/><path class="lt-strahl" d="M148 96 L240 60 L240 140Z" fill="${F.sonne}"/>
    <path d="M70 60 L120 14 L170 60Z" fill="${F.koralle}"/><path d="M120 14 L170 60 H142Z" fill="#000" opacity=".13"/>
    <rect x="80" y="58" width="80" height="84" rx="8" fill="${F.meer2}"/><path d="M90 68 V132" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".35"/>
    <circle class="lt-lampe" cx="120" cy="100" r="26" fill="${F.sonne}"/>
    <rect x="62" y="140" width="116" height="18" rx="5" fill="${F.tinte}"/><rect x="96" y="158" width="48" height="42" fill="#a89a80"/>`);

  // Im Leuchtturm: runde Steinwand, ein Bullauge, die Wendeltreppe nach oben, Holzboden zum Fahren
  const steinwand = (farbe, fuge) => `<rect width="1024" height="768" fill="${farbe}"/>
    <g stroke="${fuge}" stroke-width="4" opacity=".55">${[70, 140, 210, 280, 350, 420, 490].map((y, k) => `<path d="M0 ${y} H1024"/>${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<path d="M${i * 146 + (k % 2) * 73} ${y} v-70"/>`).join("")}`).join("")}</g>`;
  B.leuchtturmInnen = () => svg("0 0 1024 768", `${steinwand("#d2c4a8", "#b7a888")}
    <path d="M0 0 H1024 V90 Q512 30 0 90Z" fill="#000" opacity=".1"/>
    <circle cx="250" cy="250" r="84" fill="${F.holz2}"/><circle cx="250" cy="250" r="68" fill="${F.himmel}"/><path d="M182 262 A68 68 0 0 0 318 262 Q284 250 250 262 T182 262Z" fill="${F.meer}"/>
    <circle cx="282" cy="222" r="14" fill="${F.sonne}"/><path d="M250 182 V318 M182 250 H318" stroke="${F.holz2}" stroke-width="8"/>${glanz(250, 250, 76, 200, 250, 5, 0.3)}
    ${[0, 1, 2, 3, 4, 5, 6].map((k) => `<rect x="${560 + k * 68}" y="${488 - k * 62}" width="${1024 - 560 - k * 68}" height="${62 + k * 62 + 60}" fill="${k % 2 ? "#a89a80" : "#b2a48a"}"/><rect x="${560 + k * 68}" y="${488 - k * 62}" width="${1024 - 560 - k * 68}" height="8" fill="#fff" opacity=".25"/>`).join("")}
    <path d="M560 420 L1024 -4" stroke="${F.holz2}" stroke-width="12" stroke-linecap="round"/><path d="M560 420 V488 M696 296 V364 M832 172 V240 M968 48 V116" stroke="${F.holz2}" stroke-width="8"/>
    <rect x="394" y="356" width="120" height="150" rx="10" fill="${F.holz}"/><path d="M394 406 H514 M394 456 H514" stroke="${F.holz2}" stroke-width="6"/><circle cx="424" cy="382" r="14" fill="${F.koralle}"/><rect x="454" y="366" width="40" height="32" rx="6" fill="${F.meer}"/>
    <path d="M0 520 Q512 496 1024 520 V768 H0Z" fill="${F.holz}"/><path d="M0 520 Q512 496 1024 520 V548 Q512 524 0 548Z" fill="#000" opacity=".14"/>
    <g stroke="${F.holz2}" stroke-width="5" opacity=".7"><path d="M0 600 Q512 580 1024 600 M0 680 Q512 664 1024 680 M180 536 V768 M430 528 V768 M700 528 V768 M900 536 V768"/></g>
    <ellipse cx="512" cy="700" rx="230" ry="38" fill="${F.koralle}" opacity=".5"/><ellipse cx="512" cy="700" rx="180" ry="27" fill="${F.papier}" opacity=".45"/>`);
  B.turmNah = () => svg("0 0 1024 768", `${steinwand("#d2c4a8", "#b7a888")}<path d="M0 0 H1024 V70 Q512 20 0 70Z" fill="#000" opacity=".1"/>
    <path d="M0 552 Q512 536 1024 552 V768 H0Z" fill="${F.holz}"/><path d="M0 552 Q512 536 1024 552 V572 Q512 556 0 572Z" fill="#000" opacity=".14"/>`);

  // Quallengarten: dunkleres, violettes Wasser, in dem die Quallen leuchten
  const QW = { wasser: "#2b3f86", hell: "#3c56a8", boden: "#1f2f66", boden2: "#18264f" };
  B.quallengarten = () => svg("0 0 1024 768", `
    <rect width="1024" height="768" fill="${QW.wasser}"/>
    <path d="M0 0 H1024 V70 Q960 94 896 70 T768 70 T640 70 T512 70 T384 70 T256 70 T128 70 T0 70Z" fill="${QW.hell}"/>
    <g fill="#fff" opacity=".05"><path d="M190 70 L60 768 H270Z"/><path d="M560 70 L500 768 H740Z"/><path d="M850 70 L880 768 H1010Z"/></g>
    <g transform="translate(90 150) scale(.7)" color="#f48fb1">${teil.qualle("#f48fb1", true)}</g><g transform="translate(820 110) scale(.9)">${teil.qualle("#6fd0e6", true)}</g>
    <g transform="translate(300 90) scale(.5)">${teil.qualle("#f9d65c", true)}</g><g transform="translate(900 380) scale(.55)">${teil.qualle("#b9e36b", true)}</g><g transform="translate(40 470) scale(.5)">${teil.qualle("#6fd0e6", true)}</g>
    <path d="M0 640 Q160 600 320 632 T640 620 T1024 610 V768 H0Z" fill="${QW.boden}"/><path d="M0 704 Q200 680 400 698 T800 694 T1024 688 V768 H0Z" fill="${QW.boden2}"/>
    <g class="tang" stroke="#7a5fd0" stroke-width="14" stroke-linecap="round" fill="none"><path d="M150 660 Q130 600 152 540 Q172 490 150 440"/><path d="M190 668 Q204 610 186 570"/><path d="M880 650 Q898 596 880 548 Q864 508 882 470"/></g>
    <g>${[[300, 664, "#f9d65c"], [360, 684, "#f48fb1"], [700, 660, "#6fd0e6"], [760, 690, "#b9e36b"], [560, 700, "#f9d65c"]].map(([x, y, f]) => `<path d="M${x} ${y + 30} V${y}" stroke="#4d62b8" stroke-width="6" stroke-linecap="round"/><circle cx="${x}" cy="${y - 8}" r="20" fill="${f}" opacity=".25"/><circle cx="${x}" cy="${y - 8}" r="11" fill="${f}"/>`).join("")}</g>
    <g fill="none" stroke="#fff" stroke-width="3" opacity=".35"><circle cx="440" cy="250" r="8"/><circle cx="456" cy="212" r="5"/><circle cx="700" cy="330" r="7"/><circle cx="250" cy="360" r="6"/></g>`);
  B.quallenNah = () => svg("0 0 1024 768", `
    <rect width="1024" height="768" fill="#22326e"/>
    <path d="M0 0 H1024 V44 Q960 66 896 44 T768 44 T640 44 T512 44 T384 44 T256 44 T128 44 T0 44Z" fill="${QW.hell}"/>
    <path d="M0 716 Q200 694 400 710 T800 706 T1024 700 V768 H0Z" fill="${QW.boden2}"/>
    <g class="tang" stroke="#7a5fd0" stroke-width="14" stroke-linecap="round" fill="none"><path d="M44 720 Q24 660 46 600 Q66 550 44 500"/><path d="M84 724 Q98 670 80 630"/></g>
    <g fill="none" stroke="#fff" stroke-width="3" opacity=".3"><circle cx="960" cy="640" r="8"/><circle cx="976" cy="600" r="5"/><circle cx="40" cy="300" r="6"/></g>`);

  // Schildkrötenwiese: grünes, helles Wasser über einer Wiese aus Seegras
  const SW = { wasser: "#2a9a8c", hell: "#5cc3b0", gras: "#2f8f5f", gras2: "#267a50" };
  const seegras = (x, y, h, farbe, neig = 0) => `<path d="M${x} ${y} Q${x - 14 + neig} ${y - h * 0.5} ${x + neig} ${y - h} Q${x + 16 + neig} ${y - h * 0.5} ${x + 12} ${y}Z" fill="${farbe}"/>`;
  // Eine Reihe Seegras quer durchs Bild: n Halme ab Höhe y; hf = Faktor für die Halmlänge, farben = zwei Grüntöne
  const wiese = (y, n, saat, hf = 1, farben = [SW.gras2, SW.gras]) => Array.from({ length: n }, (_, i) => seegras(Math.round(i * 1040 / n + ((i * saat) % 23) - 10), y + ((i * 7) % 18), Math.round((70 + ((i * saat) % 60)) * hf), farben[i % 2], ((i * 5) % 20) - 10)).join("");
  // Seeblume: Stiel und fünf Blütenblätter um eine gelbe Mitte
  const seeblume = (x, y, farbe) => `<path d="M${x} ${y} V${y - 44}" stroke="${SW.gras2}" stroke-width="6" stroke-linecap="round"/>
    <g fill="${farbe}">${[0, 72, 144, 216, 288].map((w) => `<circle cx="${z1(x + 12 * Math.cos(w * Math.PI / 180))}" cy="${z1(y - 50 + 12 * Math.sin(w * Math.PI / 180))}" r="9"/>`).join("")}</g><circle cx="${x}" cy="${y - 50}" r="7" fill="${F.sonne}"/>`;
  // Seit v0.23.1 reicher gezeichnet: ferne Seegras-Hügel in zwei Schichten, schwimmende Schildkröten, ein
  // Fischschwarm, Felsen, Seeblumen, drei Reihen Seegras (hinten klein und dunkel, vorn groß)
  B.schildkroetenwiese = () => svg("0 0 1024 768", `
    <rect width="1024" height="768" fill="${SW.wasser}"/>
    <path d="M0 0 H1024 V70 Q960 94 896 70 T768 70 T640 70 T512 70 T384 70 T256 70 T128 70 T0 70Z" fill="${SW.hell}"/>
    <g stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".35"><path d="M120 34 q16 -8 32 0"/><path d="M420 26 q14 -7 28 0"/><path d="M700 40 q18 -9 36 0"/><path d="M900 24 q12 -6 24 0"/></g>
    <g fill="#fff" opacity=".08"><path d="M240 70 L110 768 H340Z"/><path d="M560 70 L520 768 H720Z"/><path d="M860 70 L880 768 H1010Z"/></g>
    <path d="M0 452 Q150 384 330 436 T660 420 T1024 404 V768 H0Z" fill="#24897c"/>
    <g opacity=".9">${wiese(446, 44, 13, 0.5, ["#1f7a6e", "#24897c"])}</g>
    <path d="M0 520 Q210 468 430 508 T830 488 T1024 498 V768 H0Z" fill="#1f7a6e"/>
    <g transform="translate(590 120) scale(.52)">${teil.schildkroete()}</g>
    <g transform="translate(360 236) scale(-.34 .34)">${teil.schildkroete()}</g>
    <g color="#f9d65c"><g transform="translate(96 190) scale(.42)">${teil.fisch()}</g><g transform="translate(150 224) scale(.36)">${teil.fisch()}</g><g transform="translate(84 244) scale(.32)">${teil.fisch()}</g><g transform="translate(160 176) scale(.3)">${teil.fisch()}</g></g>
    <g color="#f48fb1"><g transform="translate(868 300) scale(-.4 .4)">${teil.fisch()}</g><g transform="translate(930 334) scale(-.32 .32)">${teil.fisch()}</g></g>
    ${wiese(540, 38, 19, 0.75, ["#27855a", "#2f9566"])}
    <path d="M0 600 Q200 570 420 596 T820 588 T1024 580 V768 H0Z" fill="#e2c483"/>
    <ellipse cx="124" cy="612" rx="92" ry="9" fill="${F.tinte}" opacity=".13"/>
    <path d="M36 610 Q48 546 118 540 Q196 546 206 612Z" fill="${F.stein}"/><path d="M118 540 Q196 546 206 612 H150 Q166 572 118 540Z" fill="#000" opacity=".13"/><path d="M56 590 Q64 560 100 550" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".3"/>
    <ellipse cx="900" cy="604" rx="62" ry="7" fill="${F.tinte}" opacity=".13"/>
    <path d="M846 602 Q856 562 900 558 Q950 562 956 604Z" fill="#a39378"/><path d="M900 558 Q950 562 956 604 H922 Q930 578 900 558Z" fill="#000" opacity=".13"/>
    ${seeblume(250, 640, "#f48fb1")}${seeblume(292, 656, F.koralle)}${seeblume(736, 636, "#b565c9")}${seeblume(780, 652, "#f48fb1")}${seeblume(520, 628, F.koralle)}
    ${wiese(640, 34, 11)}
    <path d="M0 700 Q200 680 400 696 T800 692 T1024 686 V768 H0Z" fill="${F.sand}"/>
    ${kieselHaufen(438, 716)}${korallenstueck(660, 732, "#f48fb1", 1.1)}${kiesel(694, 728, 8, "#a39378")}
    ${wiese(758, 26, 17, 1.15, ["#2f9566", SW.gras])}
    <g fill="none" stroke="#fff" stroke-width="3" opacity=".45"><circle cx="330" cy="330" r="8"/><circle cx="346" cy="292" r="5"/><circle cx="820" cy="430" r="7"/><circle cx="700" cy="250" r="6"/><circle cx="712" cy="222" r="4"/><circle cx="470" cy="160" r="5"/></g>`);
  B.wieseNah = () => svg("0 0 1024 768", `
    <rect width="1024" height="768" fill="${SW.wasser}"/>
    <path d="M0 0 H1024 V44 Q960 66 896 44 T768 44 T640 44 T512 44 T384 44 T256 44 T128 44 T0 44Z" fill="${SW.hell}"/>
    <path d="M0 716 Q200 694 400 710 T800 706 T1024 700 V768 H0Z" fill="${F.sand2}"/>
    ${[18, 46, 78, 950, 984, 1010].map((x, i) => seegras(x, 740, 150 + (i % 3) * 50, i % 2 ? SW.gras : SW.gras2, i < 3 ? 8 : -8)).join("")}`);

  /* ---------- v0.24: Raketenhalle, Raketen aus Teilen bauen ---------- */
  // Eine Rakete aus drei Teilen und einer Farbe (Spiel js/aufgaben/raketenbau.js). Die Mitte liegt bei x = 150,
  // der Rumpf steht auf y = 520, die Triebwerke enden bei y = 548; die Flamme (Klasse „br-flamme“) hängt darunter.
  //   spitze  0 = Kegel, 1 = runde Verkleidung, 2 = Kapsel mit Rettungsturm, 3 = Nase mit zwei Klappen
  //   rumpf   0 = mittel mit Fenster, 1 = lang mit schwarzem Muster, 2 = breit aus Stahl
  //   unten   0 = drei Flossen, 1 = zwei Booster, 2 = Heckklappen, 3 = fünf Triebwerke mit Schürze
  //   farbe   0 = weiß, 1 = rot, 2 = blau, 3 = gelb, 4 = silber
  // Die Formen sind frei gezeichnet und lehnen sich nur im Umriss an echte Raketen an; keine Logos, keine Schrift.
  const RAKETENFARBEN = [["#f4efe6", "#d6cfc0"], [F.koralle, "#c9543f"], ["#4a90c2", "#356f99"], [F.sonne, "#e8a81c"], ["#c3cad6", "#96a0b4"]];
  const RUMPF = [{ b: 90, h: 240 }, { b: 90, h: 330 }, { b: 112, h: 280 }];
  const DUESE = "#6f8792";
  const duese = (x) => `<path d="M${x - 13} 520 L${x - 19} 548 H${x + 19} L${x + 13} 520Z" fill="${DUESE}"/><path d="M${x + 4} 520 H${x + 13} L${x + 19} 548 H${x + 8}Z" fill="#000" opacity=".15"/>`;
  const flamme = (x, b, l) => `<path d="M${x - b} 548 Q${x} ${548 + l} ${x + b} 548Z" fill="${F.koralle}"/><path d="M${x - b * 0.5} 548 Q${x} ${548 + l * 0.6} ${x + b * 0.5} 548Z" fill="${F.sonne}"/>`;
  const raketenTeil = {
    rumpf(i, c) {
      const { b, h } = RUMPF[i], x0 = 150 - b / 2, y0 = 520 - h, akzent = c[0] === F.koralle ? F.papier : F.koralle;
      let t = `<rect x="${x0}" y="${y0}" width="${b}" height="${h}" fill="${c[0]}"/>`;
      if (i === 0) t += `<rect x="${x0}" y="${y0 + h - 78}" width="${b}" height="22" fill="${akzent}"/>
        <circle cx="150" cy="${y0 + 70}" r="25" fill="${F.tinte}"/><circle cx="150" cy="${y0 + 70}" r="17" fill="${F.meer2}"/><circle cx="144" cy="${y0 + 64}" r="5" fill="#fff" opacity=".6"/>`;
      if (i === 1) t += `<rect x="${x0}" y="${z1(y0 + h * 0.3)}" width="${b}" height="10" fill="${F.tinte}"/><rect x="${x0}" y="${z1(y0 + h * 0.63)}" width="${b}" height="10" fill="${F.tinte}"/>
        <rect x="${x0}" y="${z1(y0 + h * 0.33)}" width="${b / 2}" height="${z1(h * 0.12)}" fill="${F.tinte}"/><rect x="150" y="${z1(y0 + h * 0.66)}" width="${b / 2}" height="${z1(h * 0.14)}" fill="${F.tinte}"/>
        <rect x="${x0}" y="${z1(y0 + h * 0.08)}" width="${b / 2}" height="${z1(h * 0.1)}" fill="${F.tinte}"/>`;
      if (i === 2) t += `<rect x="${x0}" y="${y0}" width="${z1(b * 0.26)}" height="${h}" fill="${F.tinte}" opacity=".8"/>
        <g stroke="#000" stroke-width="2.5" opacity=".14">${[1, 2, 3, 4, 5].map((k) => `<path d="M${x0} ${z1(y0 + k * h / 6)} H${x0 + b}"/>`).join("")}</g>`;
      return `${t}<rect x="${z1(150 + b * 0.22)}" y="${y0}" width="${z1(b * 0.28)}" height="${h}" fill="#000" opacity=".12"/>
        <path d="M${x0 + 9} ${y0 + 14} V${520 - 14}" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".3"/>`;
    },
    spitze(i, r, c) {
      const { b, h } = RUMPF[r], x0 = 150 - b / 2, x1 = 150 + b / 2, y = 520 - h, akzent = c[0] === F.koralle ? F.papier : F.koralle;
      if (i === 0) return `<path d="M${x0} ${y} L150 ${y - 112} L${x1} ${y}Z" fill="${akzent}"/><path d="M150 ${y - 112} L${x1} ${y} H${z1(150 + b * 0.2)}Z" fill="#000" opacity=".13"/>`;
      if (i === 1) return `<path d="M${x0} ${y} L${x0 - 10} ${y - 22} V${y - 78} Q${x0 - 10} ${y - 152} 150 ${y - 162} Q${x1 + 10} ${y - 152} ${x1 + 10} ${y - 78} V${y - 22} L${x1} ${y}Z" fill="${c[0]}"/>
        <path d="M150 ${y - 162} Q${x1 + 10} ${y - 152} ${x1 + 10} ${y - 78} V${y - 22} L${x1} ${y} H${z1(150 + b * 0.2)} V${y - 80} Q${z1(150 + b * 0.2)} ${y - 140} 150 ${y - 162}Z" fill="#000" opacity=".12"/>
        <rect x="${x0 - 10}" y="${y - 40}" width="${b + 20}" height="10" fill="${akzent}"/>`;
      if (i === 2) return `<path d="M${x0} ${y} L${x0 + 16} ${y - 30} H${x1 - 16} L${x1} ${y}Z" fill="${F.tinte}"/>
        <path d="M${x0 + 16} ${y - 30} L${150 - 12} ${y - 78} H${150 + 12} L${x1 - 16} ${y - 30}Z" fill="${c[0]}"/><path d="M${150 + 4} ${y - 78} H${150 + 12} L${x1 - 16} ${y - 30} H${x1 - 30}Z" fill="#000" opacity=".13"/>
        <path d="M150 ${y - 78} V${y - 132}" stroke="${F.tinte}" stroke-width="6"/><rect x="142" y="${y - 150}" width="16" height="24" rx="3" fill="${c[0]}"/><path d="M142 ${y - 150} L150 ${y - 166} L158 ${y - 150}Z" fill="${akzent}"/>`;
      return `<path d="M${x0 + 4} ${y - 64} L${x0 - 20} ${y - 30} V${y - 6} L${x0} ${y - 12}Z M${x1 - 4} ${y - 64} L${x1 + 20} ${y - 30} V${y - 6} L${x1} ${y - 12}Z" fill="${F.tinte}" opacity=".85"/>
        <path d="M${x0} ${y} Q${x0} ${y - 112} 150 ${y - 154} Q${x1} ${y - 112} ${x1} ${y}Z" fill="${c[0]}"/><path d="M150 ${y - 154} Q${x1} ${y - 112} ${x1} ${y} H${z1(150 + b * 0.22)} Q${z1(150 + b * 0.22)} ${y - 100} 150 ${y - 154}Z" fill="#000" opacity=".12"/>
        <path d="M${x0} ${y} Q${x0} ${y - 112} 150 ${y - 154} Q${z1(x0 + b * 0.26)} ${y - 104} ${z1(x0 + b * 0.26)} ${y}Z" fill="${F.tinte}" opacity=".8"/>`;
    },
    // Unterteil: „hinten“ liegt hinter dem Rumpf (Flossen, Booster, Klappen), „vorn“ davor (Triebwerke)
    unten(i, r, c, fl = true) {   // fl = mit Flammen
      const { b, h } = RUMPF[r], x0 = 150 - b / 2, x1 = 150 + b / 2, akzent = c[0] === F.koralle ? F.papier : F.koralle;
      if (i === 0) return { hinten: `<path d="M${x0} 410 L${x0 - 46} 500 V532 L${x0} 520Z M${x1} 410 L${x1 + 46} 500 V532 L${x1} 520Z" fill="${akzent}"/><path d="M${x1} 410 L${x1 + 46} 500 V532 L${x1} 520Z" fill="#000" opacity=".12"/>`,
        vorn: `${duese(150)}<path d="M144 440 H156 V532 H144Z" fill="${akzent}"/>`, flammen: flamme(150, 20, 150) };
      if (i === 1) { const oben = z1(520 - h * 0.62), booster = (x) => `<rect x="${x}" y="${oben}" width="30" height="${z1(528 - oben)}" fill="${c[0]}"/><path d="M${x} ${oben} L${x + 15} ${oben - 34} L${x + 30} ${oben}Z" fill="${akzent}"/>
          <rect x="${x + 19}" y="${oben}" width="11" height="${z1(528 - oben)}" fill="#000" opacity=".12"/><path d="M${x + 6} 528 L${x + 2} 548 H${x + 28} L${x + 24} 528Z" fill="${DUESE}"/>`;
        // Jeder Booster ist eine eigene Gruppe mit seiner Flamme: Im Flug fallen sie einzeln ab (js/raketenstart.js)
        const bf = (x) => (fl ? `<g class="br-flamme">${flamme(x, 13, 120)}</g>` : "");
        return { hinten: `<g class="br-booster br-bl">${bf(x0 - 19)}${booster(x0 - 34)}</g><g class="br-booster br-br">${bf(x1 + 19)}${booster(x1 + 4)}</g>`, vorn: duese(150), flammen: flamme(150, 20, 150) }; }
      if (i === 2) return { hinten: `<path d="M${x0} 396 L${x0 - 42} 452 V522 H${x0}Z M${x1} 396 L${x1 + 42} 452 V522 H${x1}Z" fill="${F.tinte}" opacity=".85"/>`,
        vorn: `${duese(150 - 26)}${duese(150 + 26)}${duese(150)}`, flammen: `${flamme(150 - 26, 15, 130)}${flamme(150 + 26, 15, 130)}${flamme(150, 17, 160)}` };
      return { hinten: `<path d="M${x0} 470 L${x0 - 30} 520 V534 L${x0} 524Z M${x1} 470 L${x1 + 30} 520 V534 L${x1} 524Z" fill="${F.tinte}"/>`,
        vorn: `<path d="M${x0} 492 L${x0 - 12} 522 H${x1 + 12} L${x1} 492Z" fill="${F.tinte}"/>${duese(150 - 34)}${duese(150 + 34)}${duese(150)}`,
        flammen: `${flamme(150 - 34, 15, 130)}${flamme(150 + 34, 15, 130)}${flamme(150, 17, 170)}` };
    },
  };
  // Die ganze Rakete (ohne <svg>): Flamme, Teile hinter dem Rumpf, Rumpf, Triebwerke, Spitze. fl = mit Flammen
  const bauRakete = ({ spitze = 0, rumpf = 0, unten = 0, farbe = 0 }, fl = true) => {
    const c = RAKETENFARBEN[farbe] || RAKETENFARBEN[0], u = raketenTeil.unten(unten, rumpf, c, fl);
    return `${fl ? `<g class="br-flamme">${u.flammen}</g>` : ""}${u.hinten}${raketenTeil.rumpf(rumpf, c)}${u.vorn}${raketenTeil.spitze(spitze, rumpf, c)}`;
  };
  B.bauRakete = (wahl, fl = true) => svg("0 0 300 720", bauRakete(wahl, fl));
  // Maße einer Rakete im Bild (y-Werte): oben = Spitze, schnitt = dort trennt sich im Flug die untere Stufe
  const NASE = [112, 162, 166, 154];
  B.bauMasse = ({ spitze = 0, rumpf = 0, unten = 0 }) => {
    const h = (RUMPF[rumpf] || RUMPF[0]).h;
    return { oben: 520 - h - (NASE[spitze] || NASE[0]), schnitt: Math.round(520 - h * 0.48), unten: 548, booster: unten === 1 };
  };
  // Ein einzelnes Teil für die Knöpfe im Spiel. art = "spitze", "rumpf", "unten" oder "plan" (ganze Rakete, klein)
  B.bauTeil = (art, i, wahl = {}) => {
    const c = RAKETENFARBEN[0];
    if (art === "plan") return svg("20 20 260 540", bauRakete(wahl, false));
    if (art === "spitze") return svg("60 104 180 190", `${raketenTeil.spitze(i, 0, c)}<rect x="105" y="280" width="90" height="14" fill="${c[1]}"/>`);
    if (art === "rumpf") return svg("20 170 260 370", raketenTeil.rumpf(i, c));
    const u = raketenTeil.unten(i, 0, c, false);
    return svg("50 376 200 184", `${u.hinten}<rect x="105" y="390" width="90" height="130" fill="${c[0]}"/><rect x="170" y="390" width="25" height="130" fill="#000" opacity=".12"/>${u.vorn}`);
  };
  B.bauFarbe = (i) => (RAKETENFARBEN[i] || RAKETENFARBEN[0])[0];

  // Einstieg in der Halle: eine kleine Rakete im Bau auf einem Wagen, daneben eine Kiste mit Teilen
  B.figurRaketenbau = () => svg("0 0 250 210", `
    <ellipse cx="124" cy="198" rx="104" ry="8" fill="${F.tinte}" opacity=".14"/>
    <rect x="52" y="172" width="120" height="16" rx="6" fill="${F.sonne}"/><circle cx="76" cy="192" r="9" fill="${F.tinte}"/><circle cx="148" cy="192" r="9" fill="${F.tinte}"/>
    <g transform="translate(48 -14) scale(.34)">${bauRakete({ spitze: 0, rumpf: 0, unten: 0, farbe: 0 }, false)}</g>
    <rect x="178" y="140" width="62" height="50" rx="7" fill="${F.holz}"/><path d="M178 160 H240" stroke="${F.holz2}" stroke-width="5"/>
    <path d="M190 140 L200 104 L214 140Z" fill="${F.koralle}"/><rect x="216" y="116" width="16" height="26" rx="3" fill="#c3cad6"/>`);
  // Raketenhalle: hohe Halle mit Stahlträgern, hinten ein offenes Tor in die Nacht, Regale mit Raketenteilen
  const HF = { wand: "#4a5578", wand2: "#3d4768", boden: "#7d86a3", boden2: "#6b7491", traeger: "#2c3554" };
  B.halle = () => svg("0 0 1024 768", `
    <rect width="1024" height="768" fill="${HF.wand}"/>
    <path d="M0 0 H1024 V120 Q512 20 0 120Z" fill="${HF.wand2}"/>
    <g stroke="${HF.traeger}" stroke-width="14" fill="none"><path d="M0 150 Q512 40 1024 150"/><path d="M130 128 V520 M894 128 V520 M512 96 V180"/></g>
    <rect x="352" y="180" width="320" height="330" rx="14" fill="${N.nacht}"/><path d="M352 400 Q512 372 672 400 V510 H352Z" fill="${N.boden}"/>
    ${sterne([[400, 220, 3], [470, 260, 2], [560, 214, 2.5], [620, 280, 2], [520, 320, 2], [430, 330, 2]])}
    <circle cx="610" cy="230" r="22" fill="#fff3c9"/>
    <g transform="translate(468 270) scale(.26)">${bauRakete({ spitze: 2, rumpf: 1, unten: 3, farbe: 0 }, false)}</g>
    <rect x="340" y="168" width="344" height="18" fill="${F.sonne}"/><g fill="${F.tinte}">${[0, 1, 2, 3, 4, 5, 6, 7].map((k) => `<path d="M${352 + k * 43} 168 h20 l-12 18 h-20z"/>`).join("")}</g>
    <rect x="52" y="300" width="14" height="230" fill="${HF.traeger}"/><rect x="250" y="300" width="14" height="230" fill="${HF.traeger}"/>
    <rect x="46" y="372" width="224" height="12" fill="#c8ccd9"/><rect x="46" y="456" width="224" height="12" fill="#c8ccd9"/>
    <path d="M84 372 L104 316 L124 372Z" fill="${F.koralle}"/><rect x="150" y="320" width="34" height="52" rx="4" fill="#f4efe6"/><rect x="204" y="330" width="40" height="42" rx="6" fill="#4a90c2"/>
    <rect x="76" y="412" width="44" height="44" rx="6" fill="${F.sonne}"/><path d="M150 456 L166 408 L182 456Z" fill="#f4efe6"/><circle cx="222" cy="434" r="22" fill="#c3cad6"/><circle cx="222" cy="434" r="10" fill="${F.tinte}"/>
    <path d="M800 96 V250" stroke="${HF.traeger}" stroke-width="8"/><path d="M786 250 h28 v16 q0 16 -14 16 q-14 0 -14 -16z" fill="${F.sonne}"/>
    <rect x="770" y="330" width="190" height="180" rx="10" fill="${HF.wand2}"/><g fill="${F.sonne}" opacity=".85"><rect x="790" y="352" width="44" height="34" rx="5"/><rect x="848" y="352" width="44" height="34" rx="5"/><rect x="906" y="352" width="34" height="34" rx="5"/></g>
    <path d="M0 520 Q512 498 1024 520 V768 H0Z" fill="${HF.boden}"/><path d="M0 520 Q512 498 1024 520 V544 Q512 522 0 544Z" fill="#000" opacity=".14"/>
    <g stroke="${F.sonne}" stroke-width="10" stroke-dasharray="34 26" opacity=".8"><path d="M300 740 Q512 720 724 740"/></g>
    <g fill="${HF.boden2}" opacity=".7"><ellipse cx="220" cy="700" rx="60" ry="10"/><ellipse cx="860" cy="650" rx="70" ry="11"/></g>`);
  // Hintergrund im Spiel: die Halle mit offenem Dach (oben die Nacht), unten die Startplattform
  B.halleNah = () => svg("0 0 1024 768", `
    <rect width="1024" height="768" fill="${HF.wand}"/>
    <rect x="120" y="0" width="420" height="150" fill="${N.nacht}"/>${sterne([[170, 40, 3], [250, 96, 2], [330, 30, 2.5], [420, 80, 2], [490, 36, 2], [210, 124, 2]])}
    <path d="M100 0 H120 V150 H540 V0 H560 V168 H100Z" fill="${HF.traeger}"/>
    <g stroke="${HF.wand2}" stroke-width="6" opacity=".8"><path d="M0 250 H100 M560 250 H1024 M0 420 H100 M560 420 H1024"/></g>
    <rect x="60" y="168" width="16" height="480" fill="${HF.traeger}"/><g stroke="${HF.traeger}" stroke-width="6">${[0, 1, 2, 3, 4].map((k) => `<path d="M76 ${220 + k * 90} H130"/>`).join("")}</g>
    <path d="M0 668 Q512 650 1024 668 V768 H0Z" fill="${HF.boden}"/><path d="M0 668 Q512 650 1024 668 V690 Q512 672 0 690Z" fill="#000" opacity=".14"/>
    <rect x="190" y="640" width="280" height="30" rx="8" fill="${HF.traeger}"/><rect x="190" y="640" width="280" height="9" rx="4" fill="${F.sonne}"/>`);

  /* ---------- v0.27: Malinsel (Spielplatz der Farbreifen) ---------- */
  // Farben der Pfützen; dieselben nimmt das Spiel (js/aufgaben/malen.js)
  const MAL = { rot: "#e5484d", gelb: "#f7b500", gruen: "#2fa65a", blau: "#2f7fd6", lila: "#a44fc4" };
  B.malFarben = MAL;
  const MALGRUND = "#fbf3e2", MALGRUND2 = "#ecdfc4";   // heller Boden der Insel und sein Rand
  // Farbklecks: ein großer und drei kleine Kreise, mit Glanz
  const klecks = (x, y, r, farbe) => `<g fill="${farbe}"><circle cx="${x}" cy="${y}" r="${r}"/><circle cx="${z1(x + r * 0.9)}" cy="${z1(y - r * 0.35)}" r="${z1(r * 0.45)}"/><circle cx="${z1(x - r * 0.8)}" cy="${z1(y + r * 0.5)}" r="${z1(r * 0.38)}"/><circle cx="${z1(x + r * 0.35)}" cy="${z1(y + r * 0.95)}" r="${z1(r * 0.28)}"/></g>
    <ellipse cx="${z1(x - r * 0.3)}" cy="${z1(y - r * 0.35)}" rx="${z1(r * 0.35)}" ry="${z1(r * 0.18)}" fill="#fff" opacity=".35"/>`;
  // derselbe Klecks flach auf dem Boden (im Ortsbild)
  const klecksFlach = (x, y, r, farbe) => `<g transform="translate(${x} ${y}) scale(1 .45)">${klecks(0, 0, r, farbe)}</g>`;
  // Farbeimer aus Blech: Die Farbe steht bis zum Rand und läuft vorn herunter (Platz 100 × 100)
  const farbeimer = (farbe) => `<ellipse cx="50" cy="94" rx="40" ry="7" fill="${F.tinte}" opacity=".13"/>
    <path d="M24 34 Q50 6 76 34" stroke="${F.tinte}" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M18 34 H82 L72 92 Q50 98 28 92Z" fill="${METALL}"/><path d="M60 34 H82 L72 92 Q64 95 56 96Z" fill="#000" opacity=".13"/>
    <ellipse cx="50" cy="34" rx="34" ry="9" fill="${farbe}"/>
    <path d="M20 34 Q21 58 27 58 Q33 58 33 42 Q37 44 38 66 Q40 78 46 68 L50 40Z" fill="${farbe}"/>
    <path d="M62 46 L64 84" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".3"/>`;
  // Werkzeug Farbreifen: ein Reifen von der Seite, die Lauffläche in drei Farben, darunter eine Farbspur
  B.teilFarbreifen = () => svg("0 0 100 100", `
    <path d="M10 92 H90" stroke="${MAL.blau}" stroke-width="8" stroke-linecap="round"/>
    <circle cx="50" cy="48" r="30" fill="none" stroke="${F.tinte}" stroke-width="20"/>
    <g fill="none" stroke-width="8"><path d="${bogen(50, 48, 37, 150, 270)}" stroke="${MAL.rot}"/><path d="${bogen(50, 48, 37, 270, 30)}" stroke="${MAL.gelb}"/><path d="${bogen(50, 48, 37, 30, 150)}" stroke="${MAL.blau}"/></g>
    <circle cx="50" cy="48" r="13" fill="${F.sonne}"/><circle cx="50" cy="48" r="5" fill="${F.tinte}"/>
    ${sichel(50, 48, 41, 0.14)}${glanz(50, 48, 30, 205, 250, 4, 0.4)}`);
  // Malinsel: heller Boden, ein Regenbogen über dem Meer, Farbeimer und Kleckse; die Fähre liegt links im Meer
  B.malinsel = () => svg("0 0 1024 768", `
    <rect width="1024" height="768" fill="${F.himmel}"/>
    <circle cx="150" cy="96" r="70" fill="#fff" opacity=".35"/><circle cx="150" cy="96" r="44" fill="${F.sonne}"/>
    <g fill="none" stroke-width="13" opacity=".9">${[MAL.rot, MAL.gelb, MAL.gruen, MAL.blau, MAL.lila].map((f, i) =>
      `<path d="M${520 + i * 13} 200 A${170 - i * 13} ${170 - i * 13} 0 0 1 ${860 - i * 13} 200" stroke="${f}"/>`).join("")}</g>
    <g fill="#fff" opacity=".95"><ellipse cx="546" cy="180" rx="66" ry="22"/><ellipse cx="520" cy="164" rx="40" ry="18"/><ellipse cx="834" cy="180" rx="66" ry="22"/><ellipse cx="866" cy="164" rx="40" ry="18"/>
      <ellipse cx="330" cy="76" rx="70" ry="20"/><ellipse cx="372" cy="62" rx="44" ry="19"/></g>
    <g stroke="${F.tinte}" stroke-width="3.5" fill="none" stroke-linecap="round"><path d="M250 150 q9 -10 18 0 q9 -10 18 0"/><path d="M960 90 q7 -8 14 0 q7 -8 14 0"/></g>
    <rect y="186" width="1024" height="170" fill="${F.meer}"/>
    <path d="${welle(232, 10)} V262 H0Z" fill="${F.meer2}" opacity=".5"/>
    <path d="${welle(280, 12)} V326 H0Z" fill="${F.meer2}" opacity=".85"/>
    <path d="M0 322 Q200 292 430 310 T820 304 T1024 316 V768 H0Z" fill="${MALGRUND2}"/>
    <path d="M0 348 Q200 318 430 336 T820 330 T1024 342 V768 H0Z" fill="${MALGRUND}"/>
    ${anleger(176, 322)}
    <!-- drei Farbeimer rechts hinten und ein bemalter Stein in der Mitte: beides hinter der Bodenlinie (y = 400) -->
    <g transform="translate(752 290) scale(1.05)">${farbeimer(MAL.rot)}</g><g transform="translate(866 278) scale(1.2)">${farbeimer(MAL.gelb)}</g><g transform="translate(808 318) scale(.85)">${farbeimer(MAL.blau)}</g>
    <g transform="translate(380 -84)">
      <ellipse cx="94" cy="482" rx="76" ry="9" fill="${F.tinte}" opacity=".13"/>
      <path d="M24 480 Q22 420 70 404 Q126 390 156 430 Q172 458 164 480Z" fill="${F.stein}"/>
      <path d="M124 408 Q160 428 164 480 H130 Q146 440 124 408Z" fill="#000" opacity=".12"/>
      <g fill="none" stroke-width="9" stroke-linecap="round"><path d="M44 452 Q70 430 100 446" stroke="${MAL.lila}"/><path d="M50 470 Q80 450 118 466" stroke="${MAL.gruen}"/><path d="M62 428 Q84 414 108 424" stroke="${MAL.rot}"/></g>
    </g>
    <!-- Kleckse und eine Reifenspur am Boden -->
    ${klecksFlach(300, 470, 34, MAL.gelb)}${klecksFlach(930, 590, 30, MAL.lila)}${klecksFlach(250, 706, 26, MAL.gruen)}${klecksFlach(700, 420, 22, MAL.rot)}
    <g fill="none" stroke="${MAL.rot}" stroke-width="7" stroke-linecap="round" opacity=".85"><path d="M40 610 Q150 560 250 606"/><path d="M46 632 Q152 584 246 628"/></g>
    <g fill="${MALGRUND2}"><circle cx="420" cy="460" r="5"/><circle cx="560" cy="430" r="5"/><circle cx="380" cy="690" r="4"/><circle cx="520" cy="720" r="5"/><circle cx="960" cy="700" r="4"/><circle cx="820" cy="700" r="5"/></g>`);
  // Einstieg auf der Malinsel: der Malplatz mit zwei Reifenspuren, einer Spirale und Klecksen
  B.figurMalplatz = () => svg("0 0 300 190", `
    <ellipse cx="150" cy="128" rx="146" ry="58" fill="${F.sand3}" opacity=".55"/><ellipse cx="150" cy="122" rx="138" ry="52" fill="#fffdf6"/>
    <g fill="none" stroke="${MAL.blau}" stroke-width="6" stroke-linecap="round"><path d="M40 124 Q104 74 186 108"/><path d="M50 142 Q108 96 180 126"/></g>
    <path d="M222 112 q16 -14 28 0 q8 16 -10 20 q-18 2 -18 -12 q2 -8 10 -6" stroke="${MAL.rot}" stroke-width="6" fill="none" stroke-linecap="round"/>
    <g transform="translate(118 150) scale(1 .5)">${klecks(0, 0, 17, MAL.gelb)}</g><g transform="translate(226 154) scale(1 .5)">${klecks(0, 0, 13, MAL.gruen)}</g>
    <g transform="translate(72 96) scale(1 .5)">${klecks(0, 0, 11, MAL.lila)}</g>`);
  // Hintergrund im Spiel: nur der helle Boden. Der Malgrund selbst liegt als weiße Fläche darüber (stil.css, .ma-grund).
  B.malNah = () => svg("0 0 1024 768", `
    <rect width="1024" height="768" fill="${MALGRUND2}"/>
    <path d="M0 0 H1024 V70 Q512 92 0 70Z" fill="${MALGRUND}"/>
    ${klecks(36, 330, 13, MAL.gelb)}${klecks(30, 560, 10, MAL.blau)}${klecks(968, 720, 12, MAL.rot)}${klecks(330, 738, 9, MAL.lila)}${klecks(700, 742, 8, MAL.gruen)}`);
  // Farbpfütze auf dem Malgrund (100 × 56): eine Farbe aus MAL, "bunt" = Regenbogen, "wasser" = macht die Reifen sauber
  const PFUETZE = "M8 30 Q4 14 24 12 Q34 2 52 8 Q70 2 80 14 Q98 18 92 34 Q94 50 70 48 Q52 56 34 48 Q10 52 8 30Z";
  B.pfuetze = (art) => svg("0 0 100 56", art === "bunt"
    ? `<path d="${PFUETZE}" transform="translate(0 3)" fill="#000" opacity=".12"/>
      <ellipse cx="24" cy="30" rx="18" ry="17" fill="${MAL.rot}"/><ellipse cx="38" cy="26" rx="16" ry="19" fill="${MAL.gelb}"/><ellipse cx="52" cy="29" rx="15" ry="20" fill="${MAL.gruen}"/>
      <ellipse cx="66" cy="27" rx="15" ry="19" fill="${MAL.blau}"/><ellipse cx="79" cy="30" rx="14" ry="16" fill="${MAL.lila}"/>
      <ellipse cx="34" cy="18" rx="14" ry="4" fill="#fff" opacity=".4"/>`
    : art === "wasser"
      ? `<path d="${PFUETZE}" transform="translate(0 3)" fill="#000" opacity=".1"/><path d="${PFUETZE}" fill="${F.meer2}"/>
        <path d="M24 30 q7 -5 14 0 t14 0 t14 0 M38 40 q6 -4 12 0 t12 0" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".6"/>
        <path d="M74 8 Q84 20 84 26 A10 10 0 0 1 64 26 Q64 20 74 8Z" fill="#fff" opacity=".85"/><path d="M74 8 Q84 20 84 26 A10 10 0 0 1 64 26 Q64 20 74 8Z" fill="${F.meer}" opacity=".35"/>`
      : `<path d="${PFUETZE}" transform="translate(0 3)" fill="#000" opacity=".12"/><path d="${PFUETZE}" fill="${MAL[art] || art}"/>
        <ellipse cx="34" cy="18" rx="14" ry="4" fill="#fff" opacity=".4"/><circle cx="70" cy="36" r="3.5" fill="#fff" opacity=".25"/>`);
  // Zeichen für die Knöpfe auf dem Malplatz: die Spur, oben das Rad von oben. Reifen: "schmal", "breit", "walze",
  // "radierer" (die Walze, die wegwischt: ein heller Streifen durch drei Kleckse). Muster: "punkte", "striche".
  const RADIERER = "#f3a6b5";   // Farbe der Radierer-Walze
  B.reifenZeichen = (art) => {
    const spur = (x) => `M${x} 92 C${x} 66 ${x + 12} 60 ${x + 12} 40 V26`;
    if (art === "walze") return svg("0 0 100 100", `<path d="${spur(44)}" stroke="${MAL.blau}" stroke-width="46" fill="none"/><rect x="28" y="10" width="56" height="18" rx="7" fill="${F.tinte}"/>`);
    if (art === "radierer") return svg("0 0 100 100", `<circle cx="22" cy="58" r="17" fill="${MAL.rot}"/><circle cx="52" cy="76" r="19" fill="${MAL.gelb}"/><circle cx="80" cy="54" r="17" fill="${MAL.blau}"/>
      <path d="${spur(44)}" stroke="#fffdf6" stroke-width="40" fill="none"/><rect x="28" y="10" width="56" height="18" rx="7" fill="${RADIERER}"/><rect x="28" y="20" width="56" height="8" rx="4" fill="#000" opacity=".12"/>`);
    const dick = art === "breit" ? 15 : art === "punkte" ? 10 : art === "striche" ? 8 : 6, rad = art === "breit" ? 19 : 10;
    const muster = art === "punkte" ? ` stroke-dasharray=".1 15" stroke-linecap="round"` : art === "striche" ? ` stroke-dasharray="13 9"` : ` stroke-linecap="round"`;
    return svg("0 0 100 100", `<g stroke="${MAL.blau}" stroke-width="${dick}" fill="none"${muster}><path d="${spur(24)}"/><path d="${spur(64)}"/></g>
      <rect x="${36 - rad / 2}" y="8" width="${rad}" height="24" rx="${Math.min(6, rad / 2)}" fill="${F.tinte}"/><rect x="${76 - rad / 2}" y="8" width="${rad}" height="24" rx="${Math.min(6, rad / 2)}" fill="${F.tinte}"/>`);
  };
  // Zeichen für „Robi kippen“: die Figur von vorn, auf ein Rad gekippt, darunter eine einzelne Linie
  B.kippZeichen = () => svg("0 0 120 120", `<path d="M10 100 H110" stroke="${MAL.blau}" stroke-width="8" stroke-linecap="round"/>
    <g transform="rotate(24 70 93) translate(5 20) scale(.72)">${teil.rover()}</g>`);
  // Regenwolke (Knopf auf der Malinsel: Der Regen wäscht alles ab)
  B.regenZeichen = () => svg("0 0 100 100", `
    <g fill="#8fa3b8"><circle cx="34" cy="42" r="18"/><circle cx="56" cy="32" r="22"/><circle cx="74" cy="46" r="14"/><rect x="18" y="42" width="70" height="20" rx="10"/></g>
    <path d="M40 24 Q50 14 62 18" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".45"/>
    <g stroke="${F.meer}" stroke-width="6" stroke-linecap="round"><path d="M32 72 L27 86"/><path d="M52 72 L47 92"/><path d="M72 72 L67 86"/></g>`);
  // Die Figur von oben (nur auf dem Malplatz): vorn ist oben. Die Achse liegt bei y = 66, die Räder bei x = 16 und
  // x = 84; daraus ergibt sich im Spiel der Abstand der beiden Spuren. „ma-rad“ = Lauffläche (ein Strich, er nimmt
  // die Farbe und das Muster an), „ma-walze“ = die breite Walze, „ma-koerper“ = alles über den Rädern. stil.css
  // blendet Räder oder Walze ein, macht die Räder schmal oder breit und kippt die Figur auf ihr rechtes Rad
  // (Klasse „gekippt“: Der Körper wird schmal und rückt ans rechte Rad, das linke ist in der Luft).
  B.roverOben = () => svg("0 0 100 110", `
    <g class="ma-walze"><rect x="6" y="57" width="88" height="18" rx="7" fill="${F.tinte}"/><path class="ma-rad" d="M14 66 H86" stroke="${F.sonne}" stroke-width="10" stroke-linecap="round" fill="none"/></g>
    <g class="ma-raeder"><g class="ma-reifen links"><rect x="8" y="40" width="16" height="52" rx="6" fill="${F.tinte}"/><path class="ma-rad" d="M16 48 V84" stroke="${F.sonne}" stroke-width="8" stroke-linecap="round" fill="none"/></g>
      <g class="ma-reifen rechts"><rect x="76" y="40" width="16" height="52" rx="6" fill="${F.tinte}"/><path class="ma-rad" d="M84 48 V84" stroke="${F.sonne}" stroke-width="8" stroke-linecap="round" fill="none"/></g></g>
    <g class="ma-koerper">
      <rect x="22" y="12" width="56" height="92" rx="16" fill="${F.rover}"/>
      <path d="M22 78 H78 V88 Q78 104 62 104 H38 Q22 104 22 88Z" fill="${F.rover2}"/>
      <path d="M30 19 Q50 13 70 19" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".3"/>
      <circle cx="38" cy="28" r="10" fill="${F.papier}"/><circle cx="62" cy="28" r="10" fill="${F.papier}"/>
      <circle cx="38" cy="25" r="4.8" fill="${F.tinte}"/><circle cx="62" cy="25" r="4.8" fill="${F.tinte}"/><circle cx="39.6" cy="23.4" r="1.6" fill="#fff"/><circle cx="63.6" cy="23.4" r="1.6" fill="#fff"/>
      <rect x="30" y="46" width="40" height="34" rx="7" fill="${F.papier}"/><rect x="34" y="50" width="32" height="26" rx="4" fill="${F.tinte}"/>
      <text class="rover-anzeige" x="50" y="69" text-anchor="middle" font-family="Grundschrift, sans-serif" font-size="15" fill="#9ff3ff"></text>
    </g>`);

  /* ---------- v0.28: Bahnhof (erster Ort der neuen Insel) und der Silbenzug ---------- */
  const ZUG = { rot: "#d8483f", wiese: "#d3e3a8", wiese2: "#b9cf88", schotter: "#c9bfae", haus: "#f7e7c6", haus2: "#e8d3a6" };
  // Rad von der Seite: Reifen, Nabe, Schatten unten, Glanz
  const zugRad = (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${F.tinte}"/><circle cx="${cx}" cy="${cy}" r="${z1(r * 0.4)}" fill="${F.sonne}"/>${sichel(cx, cy, r, 0.2)}${glanz(cx, cy, z1(r * 0.72), 205, 255, 3, 0.3)}`;
  // Lok von der Seite (Platz 220 × 170). Sie schaut nach links: Dort fährt der Zug hin, und die Waggons hängen
  // rechts an, damit die Silben in Leserichtung stehen. Die Räder stehen bei y = 162 auf der Schiene.
  teil.lok = () => `
    <ellipse cx="112" cy="164" rx="100" ry="5" fill="${F.tinte}" opacity=".13"/>
    <rect x="198" y="112" width="18" height="9" rx="4" fill="${F.tinte}"/>
    <path d="M6 150 L30 116 V150Z" fill="${F.tinte}"/>
    <rect x="26" y="68" width="112" height="62" rx="20" fill="${ZUG.rot}"/>
    <path d="M26 104 H138 V110 Q138 130 118 130 H46 Q26 130 26 110Z" fill="#000" opacity=".12"/>
    <path d="M46 78 H118" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".3"/>
    <rect x="120" y="34" width="80" height="96" rx="10" fill="${ZUG.rot}"/>
    <path d="M120 106 H200 V120 Q200 130 190 130 H130 Q120 130 120 120Z" fill="#000" opacity=".12"/>
    <rect x="134" y="48" width="52" height="38" rx="7" fill="${F.himmel}"/><path d="M138 52 H158 L142 72Z" fill="#fff" opacity=".5"/>
    <rect x="112" y="24" width="96" height="14" rx="6" fill="${F.tinte}"/>
    <rect x="44" y="34" width="22" height="38" fill="${F.tinte}"/><rect x="38" y="26" width="34" height="12" rx="5" fill="${F.tinte}"/>
    <path d="M82 70 A16 16 0 0 1 114 70Z" fill="${F.sonne}"/><path d="M98 54 A16 16 0 0 1 114 70 H104 A10 10 0 0 0 98 60Z" fill="#000" opacity=".12"/>
    <circle cx="30" cy="96" r="9" fill="${F.sonne}"/><circle cx="28" cy="94" r="3" fill="#fff" opacity=".6"/>
    <rect x="20" y="126" width="184" height="10" rx="5" fill="${F.tinte}"/>
    ${zugRad(150, 140, 22)}${zugRad(96, 140, 22)}${zugRad(44, 148, 14)}
    <path d="M96 140 H150" stroke="${METALL}" stroke-width="6" stroke-linecap="round"/><circle cx="96" cy="140" r="4" fill="${METALL2}"/><circle cx="150" cy="140" r="4" fill="${METALL2}"/>`;
  // Drei weitere Loks für den Silbenzug (seit v0.28.1), frei gezeichnet und nur im Umriss an echte Züge angelehnt,
  // ohne Logos und ohne Schrift. Alle im selben Platz wie die Dampflok (220 × 170, Nase links, Räder bei y = 162,
  // Kupplung rechts auf derselben Höhe), damit sie im Spiel austauschbar sind.
  const ZUGWEISS = "#f4f6f8", ZUGROT = "#d23b34", ZUGBLAU = "#2b5fb4", ZUGGRAU = "#6f7c8a";
  const zugUnten = (raeder, r) => `<ellipse cx="112" cy="164" rx="102" ry="5" fill="${F.tinte}" opacity=".13"/>
    <rect x="198" y="112" width="18" height="9" rx="4" fill="${F.tinte}"/><rect x="22" y="132" width="184" height="10" rx="4" fill="${ZUGGRAU}"/>
    ${raeder.map((x) => zugRad(x, 162 - r, r)).join("")}`;
  // Schnellzug: weiße Hülle mit runder Nase, rotes Band, dunkles Fensterband (angelehnt an einen ICE)
  teil.lokSchnell = () => `${zugUnten([56, 84, 150, 178], 11)}
    <path d="M8 128 Q8 104 34 84 Q66 58 104 56 H196 Q206 56 206 66 V132 H18 Q8 132 8 128Z" fill="${ZUGWEISS}"/>
    <path d="M9 122 H206 V132 H18 Q8 132 8 128Z" fill="#000" opacity=".1"/>
    <path d="M15 106 H206 V115 H10 Q11 110 15 106Z" fill="${ZUGROT}"/>
    <path d="M42 80 Q66 64 94 62 L86 86 Q62 88 40 96Z" fill="${F.tinte}"/><path d="M52 78 Q64 70 78 67 L74 78Z" fill="#fff" opacity=".3"/>
    <rect x="106" y="67" width="92" height="23" rx="8" fill="${F.tinte}"/><path d="M112 71 H130 L116 85Z" fill="#fff" opacity=".25"/>
    <path d="M106 57 H196" stroke="#c9d1d9" stroke-width="4" stroke-linecap="round"/>
    <circle cx="19" cy="122" r="4" fill="${F.sonne}"/>`;
  // Kugelkopf-Zug: lange flache Nase, unten blau, oben weiß (angelehnt an einen Shinkansen)
  teil.lokKugel = () => `${zugUnten([64, 92, 150, 178], 11)}
    <path d="M4 130 Q22 116 54 98 Q98 74 132 65 Q152 60 172 60 H196 Q206 60 206 70 V132 H10 Q4 132 4 130Z" fill="${ZUGWEISS}"/>
    <path d="M4 130 Q22 116 46 103 H206 V132 H10 Q4 132 4 130Z" fill="${ZUGBLAU}"/>
    <path d="M6 126 H206 V132 H10 Q4 132 4 130Z" fill="#000" opacity=".14"/>
    <path d="M114 73 Q130 67 148 65 L144 80 Q128 82 112 87Z" fill="${F.tinte}"/><path d="M120 74 Q130 70 140 68 L138 75Z" fill="#fff" opacity=".3"/>
    <rect x="160" y="70" width="16" height="15" rx="4" fill="${F.tinte}"/><rect x="182" y="70" width="16" height="15" rx="4" fill="${F.tinte}"/>
    <path d="M150 61 H196" stroke="#c9d1d9" stroke-width="4" stroke-linecap="round"/>
    <ellipse cx="32" cy="114" rx="8" ry="3.5" fill="${F.sonne}" transform="rotate(-28 32 114)"/>`;
  // Regionalzug: kantige rote Lok mit großer Frontscheibe, hellem Band und Stromabnehmer (angelehnt an einen Regionalexpress)
  teil.lokRegio = () => `${zugUnten([56, 90, 146, 180], 13)}
    <path d="M128 52 L144 28 L160 52 M134 28 H154" stroke="${F.tinte}" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M12 132 L24 66 Q26 52 42 52 H196 Q206 52 206 62 V132Z" fill="${ZUGROT}"/>
    <path d="M13.5 122 H206 V132 H12Z" fill="#000" opacity=".13"/>
    <path d="M16 106 H206 V114 H14.6Z" fill="${ZUGWEISS}"/>
    <path d="M27 70 Q29 60 42 60 H76 V94 H22.6Z" fill="${F.tinte}"/><path d="M36 64 H56 L34 86Z" fill="#fff" opacity=".28"/>
    <rect x="92" y="62" width="44" height="28" rx="6" fill="${F.tinte}"/><path d="M96 66 H112 L100 80Z" fill="#fff" opacity=".25"/>
    <rect x="152" y="62" width="34" height="38" rx="6" fill="#000" opacity=".16"/><rect x="158" y="68" width="22" height="20" rx="4" fill="${F.tinte}"/>
    <path d="M44 53 H194" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".28"/>
    <circle cx="20" cy="122" r="4.5" fill="${F.sonne}"/>`;
  // Waggon von der Seite (Platz 180 × 130) mit einem hellen Schild für die Silbe; Räder bei y = 124.
  // streifen = Farbe eines Bandes unten am Wagen (bei den Wagen der drei neuen Züge)
  teil.waggon = (farbe, streifen) => `
    <ellipse cx="90" cy="125" rx="78" ry="4.5" fill="${F.tinte}" opacity=".13"/>
    <rect x="0" y="78" width="14" height="9" rx="4" fill="${F.tinte}"/><rect x="166" y="78" width="14" height="9" rx="4" fill="${F.tinte}"/>
    <rect x="10" y="30" width="160" height="70" rx="12" fill="${farbe}"/>
    ${streifen ? `<path d="M10 90 H170 V93 Q170 97 168 99 H12 Q10 97 10 93Z" fill="${streifen}"/>` : ""}
    <path d="M10 78 H170 V88 Q170 100 158 100 H22 Q10 100 10 88Z" fill="#000" opacity=".13"/>
    <path d="M26 37 H154" stroke="${streifen ? "#c9d1d9" : "#fff"}" stroke-width="5" stroke-linecap="round" opacity="${streifen ? ".8" : ".3"}"/>
    <rect class="zg-schild" x="22" y="43" width="136" height="46" rx="9" fill="${F.papier}" stroke="${F.tinte}" stroke-opacity=".16" stroke-width="2"/>
    <rect x="14" y="96" width="152" height="9" rx="4.5" fill="${F.tinte}"/>
    ${zugRad(48, 108, 16)}${zugRad(132, 108, 16)}`;
  // Die Züge des Silbenzugs: Lok und die Farben ihrer Wagen (wagen = Farben der Reihe nach; streifen = Band am Wagen)
  B.zuege = {
    dampf: { lok: teil.lok, wagen: [MAL.blau, MAL.gruen, MAL.gelb, MAL.lila] },
    schnell: { lok: teil.lokSchnell, wagen: [ZUGWEISS], streifen: ZUGROT },
    kugel: { lok: teil.lokKugel, wagen: [ZUGWEISS], streifen: ZUGBLAU },
    regio: { lok: teil.lokRegio, wagen: [ZUGROT], streifen: ZUGWEISS },
  };
  B.lok = (art) => svg("0 0 220 170", (B.zuege[art] || B.zuege.dampf).lok());
  B.waggon = (farbe, streifen) => svg("0 0 180 130", teil.waggon(farbe, streifen));
  // Schiene mit Schwellen von x0 bis x1; y = Oberkante der Schiene (dort stehen die Räder)
  const gleis = (x0, x1, y) => {
    let schwellen = "";
    for (let x = x0 + 10; x < x1 - 20; x += 38) schwellen += `<rect x="${x}" y="${y + 5}" width="22" height="9" rx="3"/>`;
    return `<rect x="${x0}" y="${y - 2}" width="${x1 - x0}" height="24" fill="${ZUG.schotter}" opacity=".7"/><g fill="${F.holz2}">${schwellen}</g>
      <rect x="${x0}" y="${y}" width="${x1 - x0}" height="6" fill="${F.tinte}" opacity=".75"/><rect x="${x0}" y="${y}" width="${x1 - x0}" height="2" fill="#fff" opacity=".25"/>`;
  };
  // Runder Baum (Stamm bei x, Boden bei y)
  const rundbaum = (x, y, r) => `<ellipse cx="${x}" cy="${y}" rx="${z1(r * 0.8)}" ry="5" fill="${F.tinte}" opacity=".13"/><rect x="${x - 6}" y="${z1(y - r * 1.1)}" width="12" height="${z1(r * 1.1)}" fill="${F.holz2}"/>
    <circle cx="${x}" cy="${z1(y - r * 1.6)}" r="${r}" fill="${F.blatt}"/>${sichel(x, z1(y - r * 1.6), r, 0.14, -18)}${glanz(x, z1(y - r * 1.6), z1(r * 0.7), 200, 250, 4, 0.3)}`;
  // Einstieg am Bahnhof: die Lok mit zwei leeren Waggons (das ist das Spiel Silbenzug)
  B.figurLok = () => svg("0 0 360 190", `
    <g transform="translate(4 70) scale(.68)">${teil.lok()}</g>
    <g transform="translate(152 109) scale(.56)">${teil.waggon(MAL.blau)}</g><g transform="translate(250 109) scale(.56)">${teil.waggon(MAL.gelb)}</g>`);
  // Bahnhof: Wiese am Meer, hinten das Bahnhofshaus mit Uhr und ein Signal, vorn das Gleis; die Fähre liegt links im Meer
  B.bahnhof = () => svg("0 0 1024 768", `
    <rect width="1024" height="768" fill="${F.himmel}"/>
    <circle cx="180" cy="92" r="70" fill="#fff" opacity=".35"/><circle cx="180" cy="92" r="44" fill="${F.sonne}"/>
    <g fill="#fff" opacity=".92"><ellipse cx="420" cy="84" rx="76" ry="22"/><ellipse cx="468" cy="68" rx="48" ry="22"/><ellipse cx="900" cy="110" rx="60" ry="17"/><ellipse cx="864" cy="98" rx="38" ry="16"/></g>
    <g stroke="${F.tinte}" stroke-width="3.5" fill="none" stroke-linecap="round"><path d="M610 70 q9 -10 18 0 q9 -10 18 0"/><path d="M300 150 q7 -8 14 0 q7 -8 14 0"/></g>
    <rect y="186" width="1024" height="170" fill="${F.meer}"/>
    <path d="${welle(232, 10)} V262 H0Z" fill="${F.meer2}" opacity=".5"/>
    <path d="${welle(280, 12)} V326 H0Z" fill="${F.meer2}" opacity=".85"/>
    <path d="M0 322 Q200 292 430 310 T820 304 T1024 316 V768 H0Z" fill="${ZUG.wiese2}"/>
    <path d="M0 348 Q200 318 430 336 T820 330 T1024 342 V768 H0Z" fill="${ZUG.wiese}"/>
    ${anleger(176, 322)}
    <!-- Bäume, Bahnhofshaus mit Uhr, Bahnsteig, Signal: alles hinter der Bodenlinie (y = 410) -->
    ${rundbaum(440, 404, 40)}${rundbaum(506, 398, 30)}
    <ellipse cx="730" cy="404" rx="170" ry="9" fill="${F.tinte}" opacity=".13"/>
    <rect x="606" y="252" width="248" height="150" fill="${ZUG.haus}"/><rect x="800" y="252" width="54" height="150" fill="#000" opacity=".08"/>
    <path d="M582 256 L730 188 L878 256Z" fill="${F.koralle}"/><path d="M730 188 L878 256 H800Z" fill="#000" opacity=".12"/>
    <circle cx="730" cy="232" r="19" fill="${F.papier}"/><circle cx="730" cy="232" r="19" fill="none" stroke="${F.tinte}" stroke-width="4"/>
    <path d="M730 232 V220 M730 232 L739 237" stroke="${F.tinte}" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M708 402 V338 Q708 314 730 314 Q752 314 752 338 V402Z" fill="${F.holz}"/><path d="M730 314 Q752 314 752 338 V402 H738 V326 Q738 318 730 314Z" fill="#000" opacity=".14"/><circle cx="716" cy="364" r="3.5" fill="${F.sonne}"/>
    <g fill="${F.meer2}"><rect x="630" y="288" width="52" height="52" rx="7"/><rect x="778" y="288" width="52" height="52" rx="7"/></g>
    <g fill="none" stroke="${F.papier}" stroke-width="5"><path d="M656 288 V340 M630 314 H682"/><path d="M804 288 V340 M778 314 H830"/></g>
    <g fill="#fff" opacity=".4"><path d="M634 292 H650 L638 308Z"/><path d="M782 292 H798 L786 308Z"/></g>
    <rect x="560" y="398" width="344" height="16" rx="5" fill="${F.stein}"/><rect x="560" y="398" width="344" height="5" rx="2.5" fill="${F.sonne}"/>
    <rect x="952" y="250" width="9" height="154" fill="${F.tinte}"/><ellipse cx="956" cy="404" rx="22" ry="5" fill="${F.tinte}" opacity=".13"/>
    <rect x="920" y="258" width="46" height="14" rx="4" fill="${F.koralle}"/><rect x="932" y="258" width="10" height="14" fill="${F.papier}"/>
    <circle cx="956" cy="292" r="8" fill="${F.sonne}"/><circle cx="954" cy="290" r="2.5" fill="#fff" opacity=".6"/>
    <!-- das Gleis: links der Prellbock, rechts läuft es aus dem Bild (dort geht es später weiter) -->
    ${gleis(240, 1024, 620)}
    <rect x="226" y="590" width="12" height="42" fill="${F.holz2}"/><rect x="216" y="586" width="32" height="14" rx="4" fill="${F.koralle}"/>
    <!-- Koffer und Blumen -->
    <ellipse cx="318" cy="470" rx="30" ry="5" fill="${F.tinte}" opacity=".13"/>
    <rect x="292" y="430" width="52" height="38" rx="7" fill="${F.holz}"/><rect x="292" y="454" width="52" height="14" rx="6" fill="#000" opacity=".13"/><path d="M308 430 V424 Q308 418 314 418 H322 Q328 418 328 424 V430" stroke="${F.tinte}" stroke-width="4" fill="none"/>
    <rect x="300" y="430" width="6" height="38" fill="${F.sonne}"/><rect x="330" y="430" width="6" height="38" fill="${F.sonne}"/>
    <g fill="${F.papier}"><circle cx="90" cy="520" r="6"/><circle cx="150" cy="700" r="6"/><circle cx="930" cy="500" r="6"/><circle cx="860" cy="720" r="6"/><circle cx="470" cy="716" r="6"/></g>
    <g fill="${F.sonne}"><circle cx="90" cy="520" r="2.5"/><circle cx="150" cy="700" r="2.5"/><circle cx="930" cy="500" r="2.5"/><circle cx="860" cy="720" r="2.5"/><circle cx="470" cy="716" r="2.5"/></g>
    <g fill="${ZUG.wiese2}"><circle cx="420" cy="470" r="5"/><circle cx="560" cy="480" r="5"/><circle cx="700" cy="700" r="5"/><circle cx="60" cy="640" r="5"/><circle cx="980" cy="560" r="4"/></g>`);
  // Hintergrund im Spiel: Himmel und Hügel, oben das Gleis, an dem der Zug entsteht, unten das Gleis mit den
  // abgestellten Waggons. Die Höhen der Gleise stehen auch im Spiel (js/aufgaben/silbenzug.js).
  B.zugNah = () => svg("0 0 1024 768", `
    <rect width="1024" height="768" fill="${F.himmel}"/>
    <g fill="#fff" opacity=".9"><ellipse cx="180" cy="150" rx="70" ry="20"/><ellipse cx="224" cy="136" rx="44" ry="19"/><ellipse cx="850" cy="190" rx="60" ry="17"/></g>
    <path d="M0 330 Q170 250 360 320 T700 300 T1024 330 V768 H0Z" fill="${ZUG.wiese2}"/>
    <path d="M0 372 Q512 344 1024 372 V768 H0Z" fill="${ZUG.wiese}"/>
    ${gleis(0, 1024, 440)}
    <path d="M0 520 Q512 500 1024 520 V768 H0Z" fill="${ZUG.haus2}"/><path d="M0 520 Q512 500 1024 520 V532 Q512 512 0 532Z" fill="#000" opacity=".1"/>
    ${gleis(0, 1024, 668)}`);
  // Schlüssel-Teil Pfeife (für den Bahnhof): eine Dampfpfeife aus Messing mit Dampfwolke
  B.teilPfeife = () => svg("0 0 100 100", `
    <g fill="#c8d6e2"><circle cx="72" cy="22" r="13"/><circle cx="86" cy="32" r="9"/><circle cx="60" cy="14" r="8"/></g>
    <rect x="43" y="64" width="14" height="22" fill="${METALL}"/><rect x="30" y="82" width="40" height="12" rx="5" fill="${F.tinte}"/>
    <rect x="32" y="28" width="36" height="40" rx="8" fill="${F.sonne}"/><path d="M50 28 H60 Q68 28 68 36 V60 Q68 68 60 68 H50Z" fill="#000" opacity=".12"/>
    <path d="M32 30 Q50 12 68 30Z" fill="${F.sonne}"/><circle cx="50" cy="17" r="5" fill="${F.tinte}"/>
    <rect x="38" y="44" width="24" height="7" rx="3.5" fill="${F.tinte}" opacity=".6"/>
    <path d="M38 34 V60" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity=".4"/>`);
  // Fundstück Fahrkarte (Silbenzug): ein gelochtes Kärtchen, schräg; Striche statt Schrift
  B.fahrkarte = () => svg("0 0 100 100", `<g transform="rotate(-12 50 50)">
    <path d="M10 30 H90 V43 A7 7 0 0 0 90 57 V70 H10 V57 A7 7 0 0 0 10 43Z" fill="#f6e3a1"/>
    <path d="M10 60 H90 V70 H10Z" fill="#000" opacity=".1"/>
    <path d="M10 30 H30 V70 H10 V57 A7 7 0 0 0 10 43Z" fill="${F.koralle}"/>
    <path d="M36 32 V68" stroke="${F.tinte}" stroke-width="2.5" stroke-dasharray="4 4" opacity=".4"/>
    <path d="M44 42 H78 M44 52 H68" stroke="${F.tinte}" stroke-width="5" stroke-linecap="round" opacity=".35"/><circle cx="76" cy="58" r="5" fill="${F.tinte}" opacity=".45"/>
    <path d="M14 34 H86" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".4"/></g>`);

  /* ---------- v0.29: Baustelle (zweiter Ort der neuen Insel) und die Zahlenmauer ---------- */
  // Auf der Baustelle liegt keine Schraube als Deko herum: Die Schraube ist das Fundstück der Zahlenmauer.
  const BAU = { gelb: "#f5b921", gelb2: "#d99a12", erde: "#e9d6ae", erde2: "#d3b988", ziegel: "#d9825b", ziegel2: "#bf6a46", beton: "#b9b4ab" };
  B.bauFarben = BAU;
  // Mast eines Turmkrans: zwei Holme mit Zickzack dazwischen, von y0 (unten) bis y1 (oben)
  const kranMast = (x, y0, y1) => {
    let zick = "";
    for (let y = y0; y - 40 >= y1; y -= 40) zick += `M${x - 15} ${y} L${x + 15} ${y - 20} L${x - 15} ${y - 40} `;
    return `<path d="${zick}" stroke="${BAU.gelb2}" stroke-width="4" fill="none" stroke-linejoin="round"/>
      <path d="M${x - 15} ${y0} V${y1} M${x + 15} ${y0} V${y1}" stroke="${BAU.gelb}" stroke-width="8" stroke-linecap="round"/>`;
  };
  // Ausleger: Balken von x1 nach x2 auf Höhe y, dazu die Abspannung zur Mastspitze (xm, ys)
  const kranArm = (x1, x2, y, xm, ys) => `<path d="M${xm} ${ys} L${z1(x1 + (xm - x1) * 0.35)} ${y} M${xm} ${ys} L${z1(x2 + (xm - x2) * 0.35)} ${y}" stroke="${F.tinte}" stroke-width="3" opacity=".7"/>
    <rect x="${Math.min(x1, x2)}" y="${y - 7}" width="${Math.abs(x2 - x1)}" height="14" rx="5" fill="${BAU.gelb}"/><rect x="${Math.min(x1, x2)}" y="${y + 1}" width="${Math.abs(x2 - x1)}" height="6" rx="3" fill="#000" opacity=".13"/>`;
  // Seil mit Haken: von (x, y0) hinunter bis y1
  const kranHaken = (x, y0, y1) => `<path d="M${x} ${y0} V${y1}" stroke="${F.tinte}" stroke-width="3"/><rect x="${x - 9}" y="${y1 - 4}" width="18" height="12" rx="4" fill="${F.tinte}"/>
    <path d="M${x} ${y1 + 8} v8 q0 10 -9 10 q-8 0 -8 -8" stroke="${F.tinte}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  // Ziegelstein: Platz b × h bei (x, y), mit dunklerem unteren Rand und hellem Strich oben
  const ziegel = (x, y, b = 80, h = 44) => `<rect x="${x}" y="${y}" width="${b}" height="${h}" rx="8" fill="${BAU.ziegel}"/>
    <path d="M${x} ${z1(y + h * 0.66)} H${x + b} V${y + h - 8} Q${x + b} ${y + h} ${x + b - 8} ${y + h} H${x + 8} Q${x} ${y + h} ${x} ${y + h - 8}Z" fill="#000" opacity=".14"/>
    <path d="M${x + 12} ${y + 8} H${x + b - 12}" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".3"/>`;
  // Absperrhütchen (Fuß bei x, y)
  const huetchen = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="2" rx="22" ry="4.5" fill="${F.tinte}" opacity=".13"/>
    <rect x="-20" y="-6" width="40" height="8" rx="3" fill="#e8662f"/><path d="M-13 -6 L-4 -46 H4 L13 -6Z" fill="#e8662f"/><path d="M-9.4 -22 H9.4 L7.2 -32 H-7.2Z" fill="${F.papier}"/>
    <path d="M4 -46 L13 -6 H5 L0 -46Z" fill="#000" opacity=".13"/></g>`;
  // Bagger (Platz 260 × 200), schaut nach links: Ketten, gelber Aufbau mit Kabine, Arm mit Schaufel
  const bagger = () => `<ellipse cx="140" cy="193" rx="118" ry="6" fill="${F.tinte}" opacity=".13"/>
    <rect x="52" y="150" width="184" height="40" rx="20" fill="${F.tinte}"/>
    <g fill="#8794a1">${[76, 116, 156, 196].map((x) => `<circle cx="${x}" cy="170" r="11"/>`).join("")}</g><g fill="${F.tinte}">${[76, 116, 156, 196].map((x) => `<circle cx="${x}" cy="170" r="4"/>`).join("")}</g>
    <path d="M110 104 L52 34 L22 104" stroke="${BAU.gelb}" stroke-width="18" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M114 110 L56 40" stroke="#000" stroke-width="5" stroke-linecap="round" opacity=".13"/>
    <circle cx="52" cy="34" r="7" fill="${F.tinte}"/><circle cx="110" cy="104" r="7" fill="${F.tinte}"/>
    <path d="M4 98 H40 L33 134 Q18 140 6 126Z" fill="${F.tinte}"/><path d="M8 134 l4 10 M18 138 l4 10 M28 136 l4 10" stroke="${F.tinte}" stroke-width="5" stroke-linecap="round"/>
    <rect x="92" y="86" width="132" height="68" rx="10" fill="${BAU.gelb}"/><path d="M92 128 H224 V144 Q224 154 214 154 H102 Q92 154 92 144Z" fill="#000" opacity=".13"/>
    <rect x="150" y="44" width="66" height="62" rx="9" fill="${BAU.gelb}"/><rect x="158" y="52" width="50" height="34" rx="5" fill="${F.himmel}"/><path d="M162 56 H180 L166 74Z" fill="#fff" opacity=".5"/>
    <path d="M104 94 H140" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".35"/>`;
  // Baustelle: Kran, Bagger, Sandhaufen, Bauzaun und Hütchen; links kommt das Gleis vom Bahnhof herein und endet hier
  B.baustelle = () => svg("0 0 1024 768", `
    <rect width="1024" height="768" fill="${F.himmel}"/>
    <circle cx="860" cy="92" r="70" fill="#fff" opacity=".35"/><circle cx="860" cy="92" r="44" fill="${F.sonne}"/>
    <g fill="#fff" opacity=".92"><ellipse cx="610" cy="86" rx="76" ry="22"/><ellipse cx="658" cy="70" rx="48" ry="22"/><ellipse cx="330" cy="150" rx="58" ry="17"/></g>
    <path d="M0 330 Q170 250 360 320 T700 300 T1024 330 V768 H0Z" fill="${ZUG.wiese2}"/>
    <path d="M0 372 Q260 346 520 364 T1024 358 V768 H0Z" fill="${BAU.erde2}"/>
    <path d="M0 398 Q260 372 520 390 T1024 384 V768 H0Z" fill="${BAU.erde}"/>
    <!-- Bauzaun hinten -->
    <g fill="${F.holz2}">${[300, 380, 460, 540, 620, 700].map((x) => `<rect x="${x}" y="352" width="8" height="48" rx="3"/>`).join("")}</g>
    <rect x="296" y="358" width="416" height="12" rx="4" fill="${F.papier}"/><g fill="${F.koralle}">${[0, 1, 2, 3, 4, 5, 6].map((i) => `<rect x="${306 + i * 60}" y="358" width="30" height="12"/>`).join("")}</g>
    <rect x="296" y="380" width="416" height="8" rx="4" fill="${F.holz}"/>
    <!-- Turmkran links -->
    <ellipse cx="150" cy="404" rx="56" ry="7" fill="${F.tinte}" opacity=".13"/>
    <rect x="118" y="388" width="64" height="16" rx="5" fill="${BAU.beton}"/>
    ${kranMast(150, 388, 108)}${kranArm(150, 520, 108, 150, 62)}${kranArm(150, 74, 108, 150, 62)}
    <path d="M135 108 L150 58 L165 108Z" fill="${BAU.gelb}"/><rect x="60" y="100" width="34" height="30" rx="5" fill="${BAU.beton}"/>
    <rect x="166" y="116" width="40" height="34" rx="6" fill="${BAU.gelb}"/><rect x="172" y="122" width="28" height="18" rx="4" fill="${F.himmel}"/>
    ${kranHaken(430, 114, 214)}
    <!-- Sandhaufen und Bagger rechts hinten -->
    <ellipse cx="800" cy="402" rx="84" ry="8" fill="${F.tinte}" opacity=".12"/><path d="M724 400 Q746 334 800 330 Q856 336 876 400Z" fill="${F.sand3}"/><path d="M800 330 Q856 336 876 400 H830 Q842 356 800 330Z" fill="#000" opacity=".12"/>
    <g transform="translate(770 214) scale(.98)">${bagger()}</g>
    <!-- das Gleis vom Bahnhof endet hier an einem Prellbock -->
    ${gleis(0, 330, 620)}
    <rect x="328" y="590" width="12" height="42" fill="${F.holz2}"/><rect x="318" y="586" width="32" height="14" rx="4" fill="${F.koralle}"/>
    <!-- Bretterstapel, Hütchen, Steine im Boden -->
    <ellipse cx="170" cy="716" rx="70" ry="7" fill="${F.tinte}" opacity=".13"/>
    <g fill="${F.holz}"><rect x="104" y="694" width="132" height="10" rx="3"/><rect x="110" y="682" width="126" height="10" rx="3"/><rect x="104" y="670" width="124" height="10" rx="3"/></g>
    <g fill="#000" opacity=".12"><rect x="104" y="700" width="132" height="4"/><rect x="110" y="688" width="126" height="4"/><rect x="104" y="676" width="124" height="4"/></g>
    ${huetchen(420, 470)}${huetchen(900, 600, 1.1)}${huetchen(470, 712, 0.9)}
    <g fill="${BAU.erde2}"><circle cx="540" cy="440" r="5"/><circle cx="300" cy="500" r="5"/><circle cx="760" cy="690" r="5"/><circle cx="960" cy="470" r="4"/><circle cx="60" cy="470" r="5"/>
      <ellipse cx="820" cy="520" rx="9" ry="6"/><ellipse cx="850" cy="538" rx="9" ry="6"/></g>`);
  // Einstieg auf der Baustelle: die halb fertige Mauer, oben fehlt ein Stein, darüber hängt der Kranhaken
  B.figurMauer = () => svg("0 0 300 200", `
    <ellipse cx="150" cy="190" rx="140" ry="8" fill="${F.tinte}" opacity=".13"/><rect x="18" y="176" width="264" height="14" rx="5" fill="${BAU.beton}"/>
    ${ziegel(27, 130)}${ziegel(110, 130)}${ziegel(193, 130)}${ziegel(68, 84)}${ziegel(151, 84)}
    <rect x="112" y="40" width="76" height="40" rx="8" fill="none" stroke="${BAU.ziegel2}" stroke-width="4" stroke-dasharray="9 7"/>
    ${kranHaken(150, 0, 12)}`);
  // Hintergrund im Spiel: Himmel und Hügel, rechts der Turmkran mit einem langen Ausleger über die ganze Breite
  // (an ihm fährt im Spiel das Seil), unten die Erde mit einer Holzpalette für die Steine zur Wahl
  B.mauerNah = () => svg("0 0 1024 768", `
    <rect width="1024" height="768" fill="${F.himmel}"/>
    <g fill="#fff" opacity=".9"><ellipse cx="240" cy="190" rx="70" ry="20"/><ellipse cx="284" cy="176" rx="44" ry="19"/><ellipse cx="760" cy="230" rx="60" ry="17"/></g>
    <path d="M0 470 Q170 400 360 456 T700 440 T1024 466 V768 H0Z" fill="${ZUG.wiese2}"/>
    <path d="M0 548 Q512 522 1024 548 V768 H0Z" fill="${BAU.erde2}"/><path d="M0 572 Q512 546 1024 572 V768 H0Z" fill="${BAU.erde}"/>
    <rect x="916" y="544" width="72" height="18" rx="5" fill="${BAU.beton}"/>
    ${kranMast(952, 544, 104)}${kranArm(952, 96, 104, 952, 50)}${kranArm(952, 1016, 104, 952, 50)}
    <path d="M937 104 L952 46 L967 104Z" fill="${BAU.gelb}"/><rect x="984" y="96" width="34" height="30" rx="5" fill="${BAU.beton}"/>
    <rect x="896" y="112" width="40" height="34" rx="6" fill="${BAU.gelb}"/><rect x="902" y="118" width="28" height="18" rx="4" fill="${F.himmel}"/>
    <ellipse cx="512" cy="734" rx="372" ry="9" fill="${F.tinte}" opacity=".12"/>
    <rect x="150" y="702" width="724" height="14" rx="4" fill="${F.holz}"/><rect x="150" y="710" width="724" height="6" rx="3" fill="#000" opacity=".13"/>
    <g fill="${F.holz2}">${[170, 400, 600, 830].map((x) => `<rect x="${x}" y="716" width="26" height="16" rx="3"/>`).join("")}</g>`);
  // Schlüssel-Teil Bauhelm (für die Baustelle): gelber Helm mit Steg und Krempe
  B.teilBauhelm = () => svg("0 0 100 100", `
    <path d="M14 68 Q14 26 50 24 Q86 26 86 68Z" fill="${BAU.gelb}"/><path d="M50 24 Q86 26 86 68 H68 Q72 38 50 24Z" fill="#000" opacity=".12"/>
    <rect x="43" y="18" width="14" height="50" rx="6" fill="${BAU.gelb2}"/><rect x="6" y="64" width="88" height="14" rx="7" fill="${BAU.gelb2}"/>
    <path d="M24 56 Q26 40 38 33" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".45"/>`);
  // Fundstück Schraube (Zahlenmauer): Sechskantkopf und Schaft mit Gewinde, schräg
  B.schraube = () => svg("0 0 100 100", `<g transform="rotate(-35 50 50)">
    <rect x="38" y="32" width="24" height="60" rx="7" fill="${METALL}"/><path d="M50 32 H55 Q62 32 62 39 V85 Q62 92 55 92 H50Z" fill="#000" opacity=".13"/>
    <path d="M38 50 L62 56 M38 62 L62 68 M38 74 L62 80" stroke="${METALL2}" stroke-width="4"/>
    <path d="M26 10 H74 L84 23 L74 36 H26 L16 23Z" fill="#7d8a96"/><path d="M50 10 H74 L84 23 L74 36 H50Z" fill="#000" opacity=".14"/>
    <path d="M30 17 H58" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".4"/></g>`);
})();
