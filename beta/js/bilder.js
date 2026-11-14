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

  /* ---------- Figuren (Innenteile, damit sie sich in Szenen einsetzen lassen) ---------- */
  const teil = {
    rover: () => `
      <rect x="36" y="4" width="48" height="36" rx="8" fill="${F.papier}"/>
      <rect x="42" y="9" width="36" height="23" rx="4" fill="${F.tinte}"/>
      <text class="rover-anzeige" x="60" y="27" text-anchor="middle" font-family="Grundschrift, sans-serif" font-size="16" fill="#9ff3ff"></text>
      <rect x="12" y="36" width="96" height="40" rx="14" fill="${F.rover}"/>
      <path d="M12 60 H108 V62 Q108 76 94 76 H26 Q12 76 12 62Z" fill="${F.rover2}"/>
      <circle cx="42" cy="54" r="12" fill="${F.papier}"/><circle cx="78" cy="54" r="12" fill="${F.papier}"/>
      <circle cx="42" cy="55" r="5.5" fill="${F.tinte}"/><circle cx="78" cy="55" r="5.5" fill="${F.tinte}"/>
      <path d="M52 69 Q60 75 68 69" stroke="${F.papier}" stroke-width="3" fill="none" stroke-linecap="round"/>
      <circle cx="30" cy="84" r="17" fill="${F.tinte}"/><circle cx="30" cy="84" r="7" fill="${F.sonne}"/>
      <circle cx="90" cy="84" r="17" fill="${F.tinte}"/><circle cx="90" cy="84" r="7" fill="${F.sonne}"/>`,

    krebs: (farbe = F.koralle) => `
      <g stroke="${farbe}" stroke-width="7" stroke-linecap="round" fill="none">
        <path d="M36 74 L14 84 M38 82 L20 98 M104 74 L126 84 M102 82 L120 98"/>
        <path d="M40 62 Q22 58 21 44 M100 62 Q118 58 119 44"/>
        <path d="M58 50 L54 30 M82 50 L86 30"/>
      </g>
      <path d="M20 32 L9.4 21.4 A15 15 0 1 0 30.6 21.4 Z" fill="${farbe}"/>
      <path d="M120 32 L109.4 21.4 A15 15 0 1 0 130.6 21.4 Z" fill="${farbe}"/>
      <ellipse cx="70" cy="70" rx="42" ry="27" fill="${farbe}"/>
      <ellipse cx="70" cy="60" rx="30" ry="11" fill="#fff" opacity=".2"/>
      <circle cx="54" cy="26" r="9" fill="${F.papier}"/><circle cx="86" cy="26" r="9" fill="${F.papier}"/>
      <circle cx="55" cy="27" r="4.5" fill="${F.tinte}"/><circle cx="85" cy="27" r="4.5" fill="${F.tinte}"/>
      <path d="M58 77 Q70 87 82 77" stroke="${F.tinte}" stroke-width="4" fill="none" stroke-linecap="round"/>`,

    // Farbe kommt über CSS „color“ (damit gezählte Fische umgefärbt werden können)
    fisch: () => `
      <path d="M68 32 L100 8 Q93 32 100 56 Z" fill="currentColor"/>
      <path d="M68 32 L100 8 Q93 32 100 56 Z" fill="#000" opacity=".16"/>
      <path d="M36 14 Q50 -2 64 16 Z" fill="currentColor"/>
      <path d="M36 14 Q50 -2 64 16 Z" fill="#000" opacity=".16"/>
      <ellipse cx="44" cy="33" rx="36" ry="22" fill="currentColor"/>
      <path d="M46 38 Q60 42 54 54 Q42 52 46 38Z" fill="#000" opacity=".16"/>
      <circle cx="24" cy="27" r="7.5" fill="${F.papier}"/><circle cx="23" cy="28" r="3.6" fill="${F.tinte}"/>
      <path d="M10 39 Q16 43 22 39" stroke="${F.tinte}" stroke-width="3" fill="none" stroke-linecap="round"/>`,

    muschel: () => `
      <path d="M50 90 C18 82 4 52 11 33 C19 13 37 6 50 6 C63 6 81 13 89 33 C96 52 82 82 50 90Z" fill="#f7b9a3"/>
      <g stroke="#e48d76" stroke-width="3.5" stroke-linecap="round"><path d="M50 86 L22 30 M50 86 L36 14 M50 86 L50 10 M50 86 L64 14 M50 86 L78 30"/></g>
      <path d="M36 84 Q50 99 64 84 Z" fill="#e48d76"/>`,

    seestern: () => {
      const pts = [];
      for (let i = 0; i < 10; i++) {
        const r = i % 2 ? 19 : 42, w = -Math.PI / 2 + i * Math.PI / 5;
        pts.push(`${(50 + r * Math.cos(w)).toFixed(1)},${(52 + r * Math.sin(w)).toFixed(1)}`);
      }
      return `<polygon points="${pts.join(" ")}" fill="#f59a3c" stroke="#f59a3c" stroke-width="10" stroke-linejoin="round"/>
        <g fill="#fbd08a"><circle cx="50" cy="52" r="5"/><circle cx="50" cy="30" r="3.5"/><circle cx="71" cy="45" r="3.5"/><circle cx="63" cy="70" r="3.5"/><circle cx="37" cy="70" r="3.5"/><circle cx="29" cy="45" r="3.5"/></g>`;
    },

    perle: () => `
      <path d="M8 52 Q50 20 92 52 Q50 44 8 52Z" fill="#9486d6"/>
      <path d="M8 54 Q50 108 92 54 Q50 72 8 54Z" fill="#7d6fc1"/>
      <circle cx="50" cy="52" r="21" fill="#fbf3ff"/><circle cx="43" cy="45" r="6.5" fill="#fff"/>`,

    truhe: () => `
      <path d="M10 46 Q10 14 50 14 Q90 14 90 46 Z" fill="#b07a4c"/>
      <rect x="10" y="44" width="80" height="42" rx="6" fill="${F.holz}"/>
      <path d="M27 18 V86 M73 18 V86" stroke="${F.holz2}" stroke-width="6"/>
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
    <g stroke="${F.papier}" stroke-width="11" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <path d="M52 112 V62 L78 96 L104 62 V112"/>
      <path d="M134 112 L158 58 L182 112 M144 94 H172"/>
    </g>
    <circle cx="182" cy="112" r="11" fill="${F.koralle}"/>`);

  B.figurSchwarm = () => svg("0 0 260 170", `
    <g style="color:#f9c23c" transform="translate(120 8) scale(1.05)">${teil.fisch()}</g>
    <g style="color:#f0715b" transform="translate(10 52) scale(1.25)">${teil.fisch()}</g>
    <g style="color:#fff8ea" transform="translate(150 96) scale(.95)">${teil.fisch()}</g>`);

  /* ---------- Zeichen und Knöpfe ---------- */
  // Aufgabensymbole: Muschel = Hören, Sandspur = Schreiben, Kiesel = Zählen
  B.symbol = (name) => ({
    ohr: svg("0 0 100 100", teil.muschel()),
    spur: svg("0 0 100 100", `<path d="M18 70 C28 30 44 30 50 52 C56 74 72 72 82 34" stroke="${F.meer}" stroke-width="12" fill="none" stroke-linecap="round"/><circle cx="18" cy="70" r="10" fill="${F.koralle}"/>`),
    kiesel: svg("0 0 100 100", `<ellipse cx="32" cy="66" rx="22" ry="17" fill="#8fa3ad"/><ellipse cx="68" cy="68" rx="20" ry="15" fill="#6f8792"/><ellipse cx="52" cy="38" rx="20" ry="16" fill="#aab9c0"/>`),
    bogen: svg("0 0 100 100", `<path d="M10 40 Q30 72 50 40 M50 40 Q70 72 90 40" stroke="${F.koralle}" stroke-width="10" fill="none" stroke-linecap="round"/>`),
    plus: svg("0 0 100 100", `<path d="M50 18 V82 M18 50 H82" stroke="${F.tinte}" stroke-width="15" stroke-linecap="round"/>`),
    zahlen: svg("0 0 100 100", `<text x="50" y="67" text-anchor="middle" font-family="-apple-system, 'Segoe UI', sans-serif" font-size="46" font-weight="700" fill="${F.tinte}">123</text>`),
  }[name] || "");

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
  B.strand = () => svg("0 0 1024 768", `
    <rect width="1024" height="768" fill="${F.himmel}"/>
    <circle cx="850" cy="112" r="96" fill="#fff" opacity=".35"/><circle cx="850" cy="112" r="64" fill="${F.sonne}"/>
    <g fill="#fff" opacity=".92">
      <ellipse cx="230" cy="100" rx="84" ry="27"/><ellipse cx="282" cy="80" rx="54" ry="27"/>
      <ellipse cx="560" cy="170" rx="66" ry="20"/><ellipse cx="600" cy="154" rx="42" ry="20"/>
    </g>
    <rect y="262" width="1024" height="220" fill="${F.meer}"/>
    <g fill="${F.tief}" opacity=".6">
      <path d="M610 262 Q680 206 772 232 Q850 210 930 262 Z"/>
      <path d="M755 238 V192 Q755 166 768 150 Q781 166 781 192 V238 Z"/>
      <path d="M755 212 L738 240 H755Z M781 212 L798 240 H781Z"/>
    </g>
    <circle cx="768" cy="190" r="6" fill="${F.meer2}" opacity=".7"/>
    <path d="${welle(308, 14)} V350 H0Z" fill="${F.meer2}" opacity=".5"/>
    <path d="${welle(368, 16)} V420 H0Z" fill="${F.meer2}" opacity=".8"/>
    <path d="M0 436 Q180 396 400 422 T800 414 T1024 428 V768 H0Z" fill="${F.sand2}"/>
    <path d="M0 462 Q200 428 420 452 T820 444 T1024 456 V768 H0Z" fill="${F.sand}"/>
    <g fill="${F.sand2}">
      <circle cx="520" cy="560" r="5"/><circle cx="560" cy="604" r="4"/><circle cx="468" cy="630" r="5"/><circle cx="904" cy="640" r="5"/>
      <circle cx="78" cy="610" r="5"/><circle cx="610" cy="500" r="4"/><circle cx="420" cy="508" r="4"/>
    </g>
    <path d="M98 500 Q82 400 122 306 L144 312 Q114 400 130 500Z" fill="${F.holz}"/>
    <ellipse cx="114" cy="502" rx="44" ry="13" fill="${F.sand2}"/>
    <g fill="${F.blatt}">
      <path d="M132 308 Q60 252 6 296 Q70 284 132 308Z"/><path d="M132 308 Q92 222 28 218 Q92 248 132 308Z"/>
      <path d="M132 308 Q154 222 228 210 Q174 250 132 308Z"/><path d="M132 308 Q214 256 268 302 Q198 286 132 308Z"/>
    </g>
    <path d="M132 308 Q118 236 152 190 Q154 254 132 308Z" fill="${F.blatt2}"/>
    <path d="M866 520 Q884 478 934 488 Q986 498 990 540 Q934 558 866 542Z" fill="${F.stein}"/>
    <path d="M916 532 Q928 506 958 512 Q984 520 986 544 Q950 552 916 546Z" fill="#a39378"/>
    <path d="M0 694 Q130 664 260 688 T520 680 T780 692 T1024 674 V768 H0Z" fill="${F.meer2}"/>
    <path d="M0 724 Q140 704 280 722 T560 716 T840 726 T1024 710 V768 H0Z" fill="${F.meer}"/>`);

  B.riff = () => svg("0 0 1024 768", `
    <rect width="1024" height="768" fill="${F.riff}"/>
    <path d="M0 0 H1024 V70 Q960 94 896 70 T768 70 T640 70 T512 70 T384 70 T256 70 T128 70 T0 70Z" fill="${F.meer2}"/>
    <g fill="#fff" opacity=".07"><path d="M190 70 L60 768 H270Z"/><path d="M520 70 L470 768 H700Z"/><path d="M830 70 L860 768 H1010Z"/></g>
    <path d="M0 566 Q120 504 260 544 T520 524 T800 552 T1024 504 V768 H0Z" fill="${F.tief}"/>
    <g fill="${F.tief2}" opacity=".85">
      <path d="M694 536 Q712 480 760 470 L944 446 Q986 478 972 540 Z"/>
      <path d="M822 464 L828 322 L840 322 L844 460Z"/><path d="M840 334 L908 368 L840 392Z"/>
    </g>
    <path d="M0 664 Q160 630 320 656 T640 650 T1024 642 V768 H0Z" fill="${F.sand2}"/>
    <path d="M0 712 Q200 690 400 706 T800 702 T1024 696 V768 H0Z" fill="${F.sand}"/>
    <g stroke="${F.koralle}" stroke-width="18" stroke-linecap="round" fill="none"><path d="M112 676 V596 M112 634 L80 592 M112 648 L150 600"/></g>
    <g stroke="${F.lila}" stroke-width="16" stroke-linecap="round" fill="none"><path d="M930 668 V610 M930 640 L902 606 M930 648 L962 612"/></g>
    <g class="tang" stroke="${F.blatt}" stroke-width="14" stroke-linecap="round" fill="none">
      <path d="M236 684 Q216 624 238 564 Q258 514 236 464"/><path d="M272 688 Q286 634 268 594 Q254 554 274 520"/>
    </g>
    <g class="tang" stroke="${F.blatt2}" stroke-width="14" stroke-linecap="round" fill="none">
      <path d="M760 690 Q778 640 760 596 Q744 560 762 524"/><path d="M800 694 Q786 650 802 612"/>
    </g>
    <path d="M520 700 Q540 664 584 672 Q624 680 628 712 Q574 724 520 716Z" fill="#8fa3ad"/>
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

  // stehende Rakete, 100 breit und 200 hoch
  teil.rakete = () => `
    <path d="M22 150 L2 196 H22Z M78 150 L98 196 H78Z" fill="${F.koralle}"/>
    <path d="M22 186 V84 Q22 36 50 4 Q78 36 78 84 V186Z" fill="${F.papier}"/>
    <path d="M30 60 Q36 30 50 4 Q64 30 70 60Z" fill="${F.koralle}"/>
    <circle cx="50" cy="92" r="15" fill="${F.tinte}"/><circle cx="50" cy="92" r="10" fill="${F.meer2}"/>
    <rect x="22" y="136" width="56" height="12" fill="${F.koralle}"/>
    <rect x="34" y="186" width="32" height="10" fill="${F.tinte}"/>`;
  // Stern in der Farbe aus CSS „color“
  teil.stern = () => `<polygon points="${zacken(50, 53, 40, 18)}" fill="currentColor" stroke="currentColor" stroke-width="9" stroke-linejoin="round"/>`;

  B.sternchen = () => svg("0 0 100 100", teil.stern());
  // Fundstücke der Raketenstation
  B.stern = () => svg("0 0 100 100", `<g style="color:${F.sonne}">${teil.stern()}</g><circle cx="40" cy="50" r="4" fill="${F.tinte}"/><circle cx="60" cy="50" r="4" fill="${F.tinte}"/><path d="M41 62 Q50 70 59 62" stroke="${F.tinte}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`);
  B.planet = () => svg("0 0 100 100", `
    <circle cx="50" cy="50" r="30" fill="#7fc8a9"/><path d="M26 40 Q50 28 74 40 Q50 46 26 40Z" fill="#5fae8d"/><path d="M24 58 Q50 70 76 58 Q50 62 24 58Z" fill="#5fae8d"/>
    <ellipse cx="50" cy="52" rx="46" ry="11" fill="none" stroke="#f59a3c" stroke-width="7" transform="rotate(-16 50 52)"/>`);
  B.rakete = () => svg("-50 0 200 200", teil.rakete());

  B.station = () => svg("0 0 1024 768", `
    <rect width="1024" height="768" fill="${N.nacht}"/>
    ${sterne([[60, 60, 3], [140, 230, 2], [262, 84, 2.5], [330, 190, 2], [420, 50, 3], [690, 96, 2], [752, 190, 3], [800, 56, 2], [900, 140, 2.5], [980, 240, 2], [90, 300, 2], [960, 60, 3], [300, 290, 2], [730, 300, 2]])}
    <circle cx="172" cy="132" r="60" fill="#fff3c9"/><circle cx="150" cy="116" r="13" fill="#ecdca6"/><circle cx="190" cy="154" r="9" fill="#ecdca6"/><circle cx="196" cy="106" r="6" fill="#ecdca6"/>
    <path d="M0 372 Q170 318 340 356 T680 340 T1024 352 V768 H0Z" fill="${N.nacht2}"/>
    <path d="M70 456 V392 Q70 330 160 330 Q250 330 250 392 V456Z" fill="${N.bau}"/>
    <rect x="96" y="382" width="34" height="26" rx="5" fill="${F.sonne}"/><rect x="143" y="382" width="34" height="26" rx="5" fill="${F.sonne}"/><rect x="190" y="382" width="34" height="26" rx="5" fill="${F.sonne}"/>
    <rect x="156" y="298" width="8" height="36" fill="${N.stahl}"/><circle cx="160" cy="294" r="8" fill="${F.koralle}"/>
    <rect x="876" y="340" width="12" height="116" fill="${N.stahl}"/>
    <g transform="rotate(-32 882 332)"><path d="M822 332 Q882 392 942 332Z" fill="${N.bau}"/><rect x="879" y="296" width="6" height="40" fill="${N.stahl}"/><circle cx="882" cy="294" r="7" fill="${F.koralle}"/></g>
    <path d="M0 448 Q200 424 420 442 T820 434 T1024 446 V768 H0Z" fill="${N.boden}"/>
    <path d="M0 492 Q220 470 440 486 T840 478 T1024 488 V768 H0Z" fill="${N.boden2}"/>
    <ellipse cx="560" cy="462" rx="160" ry="22" fill="${N.platz}"/>
    <rect x="444" y="150" width="22" height="312" fill="${N.stahl}"/>
    <path d="M444 190 L466 230 M466 190 L444 230 M444 270 L466 310 M466 270 L444 310 M444 350 L466 390 M466 350 L444 390" stroke="${N.platz}" stroke-width="4"/>
    <rect x="466" y="250" width="48" height="10" fill="${N.stahl}"/>
    <g transform="translate(470 100) scale(1.8)">${teil.rakete()}</g>
    <g fill="${N.boden}"><ellipse cx="170" cy="700" rx="48" ry="10"/><ellipse cx="700" cy="712" rx="60" ry="11"/><ellipse cx="936" cy="668" rx="34" ry="8"/></g>`);

  B.stationNah = () => svg("0 0 1024 768", `
    <rect width="1024" height="768" fill="${N.nacht}"/>
    ${sterne([[40, 130, 3], [120, 330, 2], [960, 150, 2.5], [1000, 360, 2], [230, 108, 2], [770, 100, 2], [60, 520, 2], [984, 540, 3], [520, 96, 2]])}
    <path d="M0 716 Q200 694 400 710 T800 706 T1024 700 V768 H0Z" fill="${N.boden}"/>
    <path d="M0 742 Q220 726 440 738 T840 734 T1024 740 V768 H0Z" fill="${N.boden2}"/>`);

  B.figurSilben = () => svg("0 0 200 176", `
    <g transform="translate(62 0) scale(.76)">${teil.rakete()}</g>
    <path d="M26 158 Q50 176 74 158 M76 158 Q100 176 124 158 M126 158 Q150 176 174 158" stroke="${F.sonne}" stroke-width="7" fill="none" stroke-linecap="round"/>`);

  B.figurPlus = () => svg("0 0 200 160", `
    <g style="color:${F.sonne}" transform="translate(28 0) scale(.62)">${teil.stern()}</g>
    <g style="color:${F.koralle}" transform="translate(110 4) scale(.62)">${teil.stern()}</g>
    <g style="color:${F.sonne}" transform="translate(70 26) scale(.62)">${teil.stern()}</g>
    <rect x="30" y="72" width="140" height="82" rx="10" fill="${F.holz}"/>
    <path d="M30 100 H170 M30 128 H170" stroke="${F.holz2}" stroke-width="5"/>
    <path d="M100 92 V136 M78 114 H122" stroke="${F.papier}" stroke-width="11" stroke-linecap="round"/>`);

  B.figurReihe = () => svg("0 0 210 160", `
    <rect x="40" y="96" width="12" height="60" fill="${N.stahl}"/><rect x="158" y="96" width="12" height="60" fill="${N.stahl}"/>
    <rect x="8" y="12" width="194" height="100" rx="18" fill="${F.papier}"/>
    <text x="105" y="84" text-anchor="middle" font-family="Grundschrift, sans-serif" font-size="56" fill="${F.tinte}">3 2 1</text>`);

  // Entdeckungen
  B.kokosnuss = () => svg("0 0 100 100", `<circle cx="50" cy="52" r="40" fill="${F.holz}"/><path d="M18 40 Q50 22 82 40 Q50 34 18 40Z" fill="${F.holz2}"/><circle cx="40" cy="50" r="5" fill="${F.holz2}"/><circle cx="60" cy="50" r="5" fill="${F.holz2}"/><circle cx="50" cy="64" r="5" fill="${F.holz2}"/>`);
  B.funk = () => svg("0 0 100 100", `<g stroke="${F.sonne}" stroke-width="8" fill="none" stroke-linecap="round"><path d="M34 62 Q50 46 66 62"/><path d="M22 48 Q50 20 78 48"/><path d="M10 34 Q50 -6 90 34"/></g><circle cx="50" cy="78" r="9" fill="${F.sonne}"/>`);

  B.zahnrad = () => svg("0 0 100 100", `
    <circle cx="50" cy="50" r="31" fill="none" stroke="${F.tinte}" stroke-width="18" stroke-dasharray="12.2 12.15"/>
    <circle cx="50" cy="50" r="27" fill="${F.tinte}"/><circle cx="50" cy="50" r="11" fill="${F.papier}"/>`);
})();
