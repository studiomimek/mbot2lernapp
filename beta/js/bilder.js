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
    rad: svg("0 0 100 100", `<circle cx="50" cy="50" r="34" fill="none" stroke="${F.tinte}" stroke-width="9"/><circle cx="50" cy="50" r="14" fill="${F.koralle}"/>`),
    buch: svg("0 0 100 100", `<path d="M50 30 Q32 18 12 24 V76 Q32 70 50 82 Q68 70 88 76 V24 Q68 18 50 30Z" fill="${F.meer2}"/><path d="M50 30 V82" stroke="${F.tinte}" stroke-width="5"/>`),
    waage: svg("0 0 100 100", `<path d="M40 26 L14 50 L40 74 M60 26 L86 50 L60 74" stroke="${F.tinte}" stroke-width="11" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`),
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
    <path d="M300 226 h64 l-12 16 h-40z" fill="${F.papier}"/><path d="M332 222 V176 L366 222Z" fill="${F.koralle}"/><path d="M328 222 V184 L304 222Z" fill="${F.papier}"/>
    <path d="${welle(232, 10)} V262 H0Z" fill="${F.meer2}" opacity=".5"/>
    <path d="${welle(276, 12)} V320 H0Z" fill="${F.meer2}" opacity=".85"/>
    <path d="M0 318 Q180 286 400 306 T800 298 T1024 310 V768 H0Z" fill="${F.sand2}"/>
    <path d="M0 344 Q200 314 420 334 T820 326 T1024 338 V768 H0Z" fill="${F.sand}"/>
    <g transform="translate(0 -112)">
      <path d="M98 500 Q82 400 122 306 L144 312 Q114 400 130 500Z" fill="${F.holz}"/><ellipse cx="114" cy="502" rx="44" ry="13" fill="${F.sand2}"/>
      <g fill="${F.blatt}"><path d="M132 308 Q60 252 6 296 Q70 284 132 308Z"/><path d="M132 308 Q92 222 28 218 Q92 248 132 308Z"/><path d="M132 308 Q154 222 228 210 Q174 250 132 308Z"/><path d="M132 308 Q214 256 268 302 Q198 286 132 308Z"/></g>
      <path d="M132 308 Q118 236 152 190 Q154 254 132 308Z" fill="${F.blatt2}"/>
      <circle cx="126" cy="312" r="10" fill="${F.holz2}"/><circle cx="142" cy="318" r="9" fill="${F.holz2}"/>
    </g>
    <g transform="translate(0 -120)"><path d="M866 520 Q884 478 934 488 Q986 498 990 540 Q934 558 866 542Z" fill="${F.stein}"/><path d="M916 532 Q928 506 958 512 Q984 520 986 544 Q950 552 916 546Z" fill="#a39378"/></g>
    <!-- Sandburg -->
    <g><rect x="522" y="352" width="76" height="40" fill="${F.sand3}"/><rect x="514" y="330" width="24" height="62" fill="${F.sand2}"/><rect x="582" y="330" width="24" height="62" fill="${F.sand2}"/><rect x="548" y="318" width="24" height="74" fill="${F.sand2}"/>
      <path d="M514 330 h6 v-7 h6 v7 h6 v-7 h6 v7 M582 330 h6 v-7 h6 v7 h6 v-7 h6 v7 M548 318 h6 v-7 h6 v7 h6 v-7 h6 v7" stroke="${F.sand2}" stroke-width="6" fill="none"/>
      <path d="M552 392 v-22 q8 -8 16 0 v22z" fill="${F.holz2}"/><path d="M560 318 V288" stroke="${F.holz2}" stroke-width="4"/><path d="M560 288 L584 296 L560 304Z" fill="${F.koralle}"/></g>
    <!-- Kleinkram im Sand -->
    <g transform="translate(900 610) scale(.5)">${teil.seestern()}</g>
    <g transform="translate(620 650) scale(.34)">${teil.muschel()}</g><g transform="translate(60 600) scale(.3) rotate(-20)">${teil.muschel()}</g>
    <circle cx="238" cy="430" r="26" fill="${F.papier}"/><path d="M238 404 A26 26 0 0 1 264 430 L238 430Z" fill="${F.koralle}"/><path d="M238 456 A26 26 0 0 1 212 430 L238 430Z" fill="${F.meer}"/>
    <g fill="${F.sand2}"><ellipse cx="660" cy="470" rx="9" ry="6"/><ellipse cx="690" cy="488" rx="9" ry="6"/><ellipse cx="664" cy="508" rx="9" ry="6"/><ellipse cx="694" cy="526" rx="9" ry="6"/>
      <circle cx="420" cy="430" r="5"/><circle cx="820" cy="560" r="5"/><circle cx="330" cy="660" r="4"/><circle cx="500" cy="600" r="5"/><circle cx="960" cy="470" r="4"/><circle cx="130" cy="520" r="5"/></g>
    <path d="M0 704 Q130 676 260 698 T520 690 T780 702 T1024 686 V768 H0Z" fill="${F.meer2}"/>
    <path d="M0 732 Q140 714 280 730 T560 724 T840 734 T1024 720 V768 H0Z" fill="${F.meer}"/>`);

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

  // Raketenstation: Gebäude und Rakete stehen weit hinten, davor viel Platz zum Fahren
  B.station = () => svg("0 0 1024 768", `
    <rect width="1024" height="768" fill="${N.nacht}"/>
    ${sterne([[60, 50, 3], [250, 40, 2], [330, 130, 2], [400, 60, 3], [690, 70, 2], [752, 150, 3], [800, 40, 2], [900, 110, 2.5], [980, 190, 2], [36, 190, 2], [960, 40, 3], [300, 200, 2], [620, 170, 2]])}
    <circle cx="320" cy="92" r="52" fill="#fff3c9"/><circle cx="302" cy="78" r="11" fill="#ecdca6"/><circle cx="336" cy="110" r="8" fill="#ecdca6"/><circle cx="342" cy="70" r="5" fill="#ecdca6"/>
    <path d="M0 252 Q170 206 340 236 T680 222 T1024 232 V768 H0Z" fill="${N.nacht2}"/>
    <path d="M0 300 Q200 280 420 294 T820 288 T1024 298 V768 H0Z" fill="${N.boden}"/>
    <path d="M0 338 Q220 320 440 332 T840 326 T1024 334 V768 H0Z" fill="${N.boden2}"/>
    <g transform="translate(0 -140)">
      <path d="M70 456 V392 Q70 330 160 330 Q250 330 250 392 V456Z" fill="${N.bau}"/>
      <rect x="96" y="382" width="34" height="26" rx="5" fill="${F.sonne}"/><rect x="143" y="382" width="34" height="26" rx="5" fill="${F.sonne}"/><rect x="190" y="382" width="34" height="26" rx="5" fill="${F.sonne}"/>
      <rect x="142" y="420" width="36" height="36" rx="4" fill="${N.platz}"/>
      <rect x="156" y="298" width="8" height="36" fill="${N.stahl}"/><circle cx="160" cy="294" r="8" fill="${F.koralle}"/>
      <rect x="876" y="340" width="12" height="116" fill="${N.stahl}"/>
      <g transform="rotate(-32 882 332)"><path d="M822 332 Q882 392 942 332Z" fill="${N.bau}"/><rect x="879" y="296" width="6" height="40" fill="${N.stahl}"/><circle cx="882" cy="294" r="7" fill="${F.koralle}"/></g>
    </g>
    <ellipse cx="560" cy="330" rx="136" ry="18" fill="${N.platz}"/>
    <rect x="470" y="86" width="18" height="244" fill="${N.stahl}"/>
    <path d="M470 116 L488 150 M488 116 L470 150 M470 186 L488 220 M488 186 L470 220 M470 256 L488 290 M488 256 L470 290" stroke="${N.platz}" stroke-width="3.5"/>
    <rect x="488" y="160" width="26" height="8" fill="${N.stahl}"/>
    <g transform="translate(490 44) scale(1.4)">${teil.rakete()}</g>
    <!-- Lampen, Kisten, Markierungen -->
    <g><rect x="326" y="270" width="8" height="64" fill="${N.stahl}"/><circle cx="330" cy="266" r="12" fill="${F.sonne}"/><circle cx="330" cy="266" r="24" fill="${F.sonne}" opacity=".2"/>
      <rect x="766" y="270" width="8" height="64" fill="${N.stahl}"/><circle cx="770" cy="266" r="12" fill="${F.sonne}"/><circle cx="770" cy="266" r="24" fill="${F.sonne}" opacity=".2"/></g>
    <g><rect x="268" y="296" width="36" height="30" rx="4" fill="${F.holz}"/><rect x="290" y="270" width="30" height="28" rx="4" fill="${F.holz2}"/></g>
    <path d="M560 356 V748" stroke="${N.boden}" stroke-width="10" stroke-dasharray="34 30"/>
    <path d="M60 470 H330 M700 470 H980" stroke="${N.boden}" stroke-width="6" stroke-dasharray="24 22"/>
    <g fill="${N.boden}"><ellipse cx="170" cy="700" rx="48" ry="10"/><ellipse cx="700" cy="716" rx="60" ry="11"/><ellipse cx="936" cy="640" rx="34" ry="8"/><ellipse cx="300" cy="420" rx="30" ry="7"/><ellipse cx="880" cy="520" rx="40" ry="9"/></g>
    <g fill="${F.koralle}"><path d="M630 372 l12 26 h-24z"/><path d="M486 372 l12 26 h-24z"/></g>`);

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
  /* ---------- Piratenwelt ---------- */
  const P = { abend: "#fbd9ae", abendsonne: "#f59a3c", see: "#2a90aa", tiefsee: "#14607a", tiefsee2: "#0f4f66", planke: "#6b4a30" };

  teil.muenze = () => `<circle cx="50" cy="50" r="40" fill="#e8a81c"/><circle cx="50" cy="50" r="31" fill="${F.sonne}"/><path d="M50 30 V70 M38 40 H62 M38 60 H62" stroke="#e8a81c" stroke-width="6" stroke-linecap="round"/>`;
  B.muenze = () => svg("0 0 100 100", teil.muenze());
  B.feder = () => svg("0 0 100 100", `<path d="M22 84 Q20 40 60 12 Q88 30 70 60 Q56 80 22 84Z" fill="${F.koralle}"/><path d="M34 70 Q40 44 60 12 Q64 44 34 70Z" fill="${F.sonne}"/><path d="M14 92 Q30 62 58 22" stroke="${F.tinte}" stroke-width="4" fill="none" stroke-linecap="round"/>`);
  B.flasche = () => svg("0 0 100 100", `<g transform="rotate(-28 50 50)"><rect x="40" y="6" width="20" height="24" rx="4" fill="#9fd9c2"/><rect x="43" y="2" width="14" height="9" rx="3" fill="${F.holz}"/><path d="M40 28 Q24 36 24 52 V86 Q24 94 34 94 H66 Q76 94 76 86 V52 Q76 36 60 28Z" fill="#b9e8d6"/><rect x="38" y="46" width="24" height="36" rx="5" fill="${F.papier}"/><path d="M38 58 H62 M38 70 H62" stroke="${F.koralle}" stroke-width="4"/></g>`);

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
      <path d="M660 200 Q706 188 754 200 M656 244 Q706 230 758 244" stroke="${F.sand2}" stroke-width="4" fill="none"/>
      <path d="M713 96 L776 112 L713 132Z" fill="${F.tinte}"/><circle cx="734" cy="112" r="7" fill="${F.papier}"/>
      <path d="M592 330 Q612 432 700 442 H904 Q966 430 986 320 Z" fill="${F.holz2}"/><path d="M592 330 H986 L980 356 H598Z" fill="${F.holz}"/>
      <g fill="${F.sonne}"><circle cx="676" cy="392" r="11"/><circle cx="756" cy="398" r="11"/><circle cx="836" cy="398" r="11"/><circle cx="912" cy="388" r="11"/></g>
    </g>
    <path d="${welle(280, 12)} V326 H0Z" fill="${F.meer2}" opacity=".85"/>
    <path d="M0 316 Q170 284 390 304 T770 316 T1024 334 V768 H0Z" fill="${F.sand2}"/>
    <path d="M0 344 Q200 314 420 332 T800 344 T1024 360 V768 H0Z" fill="${F.sand}"/>
    <path d="M690 318 L760 280 L772 290 L706 330Z" fill="${F.holz}"/>
    <g transform="translate(0 -150)">
      <path d="M70 540 Q58 450 92 366 L112 372 Q86 452 100 540Z" fill="${F.holz}"/>
      <g fill="${F.blatt}"><path d="M102 368 Q40 320 0 356 Q50 346 102 368Z"/><path d="M102 368 Q70 296 14 292 Q68 318 102 368Z"/><path d="M102 368 Q122 296 186 286 Q140 320 102 368Z"/><path d="M102 368 Q170 324 216 362 Q158 350 102 368Z"/></g>
    </g>
    <g transform="translate(900 250) scale(.6)"><path d="M70 540 Q58 450 92 366 L112 372 Q86 452 100 540Z" fill="${F.holz}"/><g fill="${F.blatt2}"><path d="M102 368 Q40 320 0 356 Q50 346 102 368Z"/><path d="M102 368 Q70 296 14 292 Q68 318 102 368Z"/><path d="M102 368 Q122 296 186 286 Q140 320 102 368Z"/><path d="M102 368 Q170 324 216 362 Q158 350 102 368Z"/></g></g>
    <!-- Piratenflagge, Fass, Schatzkiste, Schatzkreuz -->
    <rect x="486" y="300" width="8" height="96" fill="${F.holz2}"/><path d="M494 302 L560 318 L494 340Z" fill="${F.tinte}"/><circle cx="514" cy="320" r="7" fill="${F.papier}"/>
    <g><rect x="118" y="596" width="64" height="76" rx="12" fill="${F.holz}"/><path d="M118 618 H182 M118 650 H182" stroke="${F.holz2}" stroke-width="6"/></g>
    <g transform="translate(866 394) scale(.74)">${teil.truhe()}</g>
    <path d="M736 656 l44 44 m0 -44 l-44 44" stroke="${F.koralle}" stroke-width="12" stroke-linecap="round"/>
    <path d="M560 470 q30 -24 60 0 t60 0 t60 30" stroke="${F.sand2}" stroke-width="5" fill="none" stroke-dasharray="4 14" stroke-linecap="round"/>
    <g transform="translate(300 690) scale(.3)">${teil.muschel()}</g><g transform="translate(960 600) scale(.4)">${teil.seestern()}</g>
    <g fill="${F.sand2}"><circle cx="420" cy="430" r="5"/><circle cx="560" cy="700" r="5"/><circle cx="900" cy="560" r="4"/><circle cx="250" cy="480" r="5"/><circle cx="660" cy="410" r="4"/></g>
    <path d="M0 734 Q140 714 280 732 T560 726 T840 736 T1024 720 V768 H0Z" fill="${P.see}"/>`);

  B.wrack = () => svg("0 0 1024 768", `
    <rect width="1024" height="768" fill="${P.tiefsee}"/>
    <path d="M0 0 H1024 V60 Q960 82 896 60 T768 60 T640 60 T512 60 T384 60 T256 60 T128 60 T0 60Z" fill="${F.riff}"/>
    <g fill="#fff" opacity=".05"><path d="M260 60 L160 768 H360Z"/><path d="M640 60 L620 768 H820Z"/></g>
    <path d="M0 520 Q140 470 300 500 T620 480 T1024 470 V768 H0Z" fill="${P.tiefsee2}"/>
    <path d="M548 372 L590 132 L612 136 L586 370Z" fill="${F.holz2}"/>
    <path d="M604 150 L716 196 Q680 232 700 280 L596 250Z" fill="${F.papier}" opacity=".75"/>
    <path d="M318 610 Q324 430 470 386 L912 326 Q992 404 968 566 Q700 650 318 610Z" fill="${P.planke}"/>
    <path d="M352 520 Q620 480 972 440 M336 566 Q640 540 968 506" stroke="${F.holz2}" stroke-width="6" fill="none"/>
    <ellipse cx="640" cy="520" rx="52" ry="66" fill="${P.tiefsee2}"/>
    <g fill="${F.sonne}" opacity=".8"><circle cx="470" cy="470" r="13"/><circle cx="800" cy="430" r="13"/><circle cx="890" cy="418" r="13"/></g>
    <path d="M0 664 Q160 632 320 656 T640 650 T1024 644 V768 H0Z" fill="${F.sand2}"/>
    <path d="M0 714 Q200 692 400 708 T800 704 T1024 698 V768 H0Z" fill="${F.sand}"/>
    <g stroke="#9aa7ad" stroke-width="14" fill="none" stroke-linecap="round"><path d="M150 500 V640 M104 594 Q110 650 150 650 Q190 650 196 594 M120 536 H180"/><circle cx="150" cy="484" r="15"/></g>
    <g class="tang" stroke="${F.blatt}" stroke-width="14" stroke-linecap="round" fill="none"><path d="M250 690 Q232 640 252 590 Q268 550 250 512"/></g>
    <g class="tang" stroke="${F.blatt2}" stroke-width="14" stroke-linecap="round" fill="none"><path d="M986 690 Q1000 640 984 600"/></g>
    <g stroke="${F.lila}" stroke-width="16" stroke-linecap="round" fill="none"><path d="M60 690 V636 M60 664 L36 632 M60 670 L88 638"/></g>
    <g class="blasen" fill="#fff" opacity=".45"><circle cx="640" cy="440" r="8"/><circle cx="656" cy="398" r="5"/><circle cx="330" cy="330" r="6"/><circle cx="880" cy="270" r="5"/></g>`);

  B.wrackNah = () => svg("0 0 1024 768", `
    <rect width="1024" height="768" fill="${P.tiefsee}"/>
    <path d="M0 0 H1024 V44 Q960 66 896 44 T768 44 T640 44 T512 44 T384 44 T256 44 T128 44 T0 44Z" fill="${F.riff}"/>
    <path d="M0 716 Q200 694 400 710 T800 706 T1024 700 V768 H0Z" fill="${F.sand2}"/>
    <g class="tang" stroke="${F.blatt2}" stroke-width="14" stroke-linecap="round" fill="none"><path d="M984 720 Q1000 664 982 610 Q968 570 984 530"/></g>
    <g fill="#fff" opacity=".4" class="blasen"><circle cx="60" cy="430" r="7"/><circle cx="74" cy="390" r="4"/><circle cx="970" cy="330" r="6"/></g>`);

  B.figurSteuerrad = () => svg("0 0 200 190", `
    <rect x="92" y="110" width="16" height="78" fill="${F.holz2}"/>
    <g stroke="${F.holz}" stroke-width="13" stroke-linecap="round"><path d="M100 14 V166 M24 90 H176 M46 36 L154 144 M154 36 L46 144"/></g>
    <circle cx="100" cy="90" r="56" fill="none" stroke="${F.holz2}" stroke-width="16"/>
    <circle cx="100" cy="90" r="18" fill="${F.sonne}"/>`);

  B.figurPapagei = () => svg("0 0 200 190", `
    <rect x="30" y="150" width="140" height="12" rx="6" fill="${F.holz}"/><rect x="94" y="158" width="12" height="32" fill="${F.holz2}"/>
    <path d="M118 148 Q150 176 142 188 Q118 176 108 150Z" fill="${F.meer}"/>
    <ellipse cx="100" cy="100" rx="42" ry="56" fill="${F.koralle}"/>
    <path d="M104 84 Q150 96 132 150 Q104 136 104 84Z" fill="${F.blatt}"/>
    <circle cx="86" cy="52" r="34" fill="${F.koralle}"/>
    <path d="M58 52 Q30 56 44 86 Q62 78 66 60Z" fill="${F.sonne}"/>
    <circle cx="84" cy="46" r="10" fill="${F.papier}"/><circle cx="82" cy="47" r="5" fill="${F.tinte}"/>
    <path d="M86 150 v8 M108 150 v8" stroke="${F.tinte}" stroke-width="5" stroke-linecap="round"/>`);

  B.figurFlasche = () => svg("0 0 200 170", `
    <ellipse cx="100" cy="140" rx="92" ry="22" fill="#fff" opacity=".12"/>
    <g transform="translate(40 14) scale(1.3)">${B.flasche().replace(/<\/?svg[^>]*>/g, "")}</g>`);

  B.figurMuenzen = () => svg("0 0 210 170", `
    <g transform="translate(6 78) scale(.8)">${teil.muenze()}</g><g transform="translate(64 86) scale(.8)">${teil.muenze()}</g><g transform="translate(122 78) scale(.8)">${teil.muenze()}</g>
    <g transform="translate(36 38) scale(.8)">${teil.muenze()}</g><g transform="translate(94 40) scale(.8)">${teil.muenze()}</g>
    <g transform="translate(66 0) scale(.8)">${teil.muenze()}</g>`);
  /* ---------- In der Rakete und im Weltraum ---------- */
  const W = { wand: "#39426b", pult: "#5a6390", pult2: "#7480b3", all: "#141a3a" };
  const fenster = (cx, cy, r, sternchen) => `<circle cx="${cx}" cy="${cy}" r="${r + 16}" fill="${N.stahl}"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="${W.all}"/>${sterne(sternchen)}`;

  B.cockpit = () => svg("0 0 1024 768", `
    <rect width="1024" height="768" fill="${W.wand}"/>
    ${fenster(200, 190, 70, [[170, 170, 3], [222, 214, 2], [210, 150, 2]])}
    ${fenster(512, 180, 78, [[480, 150, 3], [540, 206, 2.5], [520, 140, 2], [470, 214, 2]])}
    ${fenster(824, 190, 70, [[800, 160, 2.5], [850, 210, 3], [846, 160, 2]])}
    <path d="M120 332 H904 L964 480 H60Z" fill="${W.pult}"/><path d="M120 332 H904 L912 352 H112Z" fill="${W.pult2}"/>
    <circle cx="230" cy="412" r="17" fill="${F.koralle}"/><circle cx="286" cy="412" r="17" fill="${F.sonne}"/><circle cx="342" cy="412" r="17" fill="${F.blatt}"/>
    <rect x="420" y="378" width="184" height="74" rx="12" fill="${W.all}"/><path d="M436 426 l30 -22 l26 14 l34 -30 l28 22 l34 -12" stroke="#7df0a8" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="650" y="382" width="110" height="64" rx="10" fill="${F.meer2}"/><circle cx="705" cy="414" r="18" fill="${F.papier}"/>
    <rect x="806" y="372" width="12" height="60" rx="6" fill="${N.stahl}"/><circle cx="812" cy="368" r="15" fill="${F.koralle}"/>
    <rect y="480" width="1024" height="288" fill="${N.boden}"/><rect y="536" width="1024" height="232" fill="${N.boden2}"/>
    <path d="M0 610 H1024 M0 690 H1024" stroke="${N.boden}" stroke-width="4"/>`);

  B.weltraum = () => svg("0 0 1024 768", `
    <rect width="1024" height="768" fill="${W.all}"/>
    <ellipse cx="700" cy="230" rx="270" ry="120" fill="${F.lila}" opacity=".13"/><ellipse cx="270" cy="540" rx="230" ry="110" fill="${F.meer}" opacity=".13"/>
    ${sterne([[60, 80, 3], [130, 420, 2], [240, 60, 2], [300, 420, 2.5], [380, 130, 2], [420, 620, 3], [470, 260, 2], [520, 470, 2], [560, 700, 2.5], [680, 60, 2], [720, 420, 3], [770, 250, 2], [830, 110, 2.5], [900, 330, 2], [960, 190, 3], [990, 470, 2], [60, 640, 2.5], [200, 720, 2], [650, 560, 2], [330, 250, 2]])}
    <circle cx="170" cy="176" r="66" fill="${F.meer}"/><path d="M130 146 Q160 126 186 150 Q170 176 140 172Z M176 196 Q206 182 222 204 Q202 230 178 220Z" fill="${F.blatt}"/>
    <circle cx="610" cy="130" r="38" fill="${N.bau}"/><circle cx="598" cy="120" r="8" fill="${N.stahl}"/><circle cx="624" cy="142" r="6" fill="${N.stahl}"/>
    <circle cx="884" cy="660" r="150" fill="#f59a3c"/><path d="M742 620 Q884 590 1024 630 V664 Q884 624 738 652Z" fill="#e2803a"/><path d="M748 700 Q884 676 1024 712 V740 Q884 706 760 730Z" fill="#fbb866"/>
    <ellipse cx="884" cy="660" rx="236" ry="44" fill="none" stroke="#fbd08a" stroke-width="16" transform="rotate(-14 884 660)"/>
    <path d="M356 318 L262 258 L282 292 L250 300Z" fill="${F.papier}" opacity=".45"/><circle cx="356" cy="318" r="12" fill="${F.papier}"/>`);

  B.komet = () => svg("0 0 100 100", `<path d="M6 94 L52 28 L72 60Z" fill="${F.sonne}" opacity=".55"/><g style="color:${F.papier}" transform="translate(36 2) scale(.62)">${teil.stern()}</g>`);

  B.figurTuer = () => svg("0 0 120 132", `
    <path d="M36 62 H84 L110 128 H10Z" fill="${N.stahl}"/><path d="M30 84 H90 M22 106 H98" stroke="${N.platz}" stroke-width="5"/>
    <path d="M32 64 V32 Q32 4 60 4 Q88 4 88 32 V64Z" fill="${F.tinte}"/><circle cx="60" cy="32" r="11" fill="${F.sonne}"/>`);

  B.figurStartknopf = () => svg("0 0 180 150", `
    <rect x="16" y="84" width="148" height="60" rx="14" fill="${W.pult}"/><rect x="16" y="84" width="148" height="16" rx="8" fill="${W.pult2}"/>
    <path d="M40 90 Q40 18 90 18 Q140 18 140 90Z" fill="${F.koralle}"/><ellipse cx="74" cy="46" rx="20" ry="11" fill="#fff" opacity=".3" transform="rotate(-24 74 46)"/>`);

  B.figurSatellit = () => svg("0 0 240 150", `
    <rect x="76" y="68" width="88" height="12" fill="${N.stahl}"/>
    <g fill="${F.meer2}"><rect x="4" y="46" width="76" height="56" rx="6"/><rect x="160" y="46" width="76" height="56" rx="6"/></g>
    <path d="M30 46 V102 M56 46 V102 M4 74 H80 M186 46 V102 M212 46 V102 M160 74 H236" stroke="${F.tief}" stroke-width="3"/>
    <rect x="86" y="34" width="68" height="84" rx="14" fill="${F.papier}"/>
    <circle cx="108" cy="68" r="9" fill="${F.tinte}"/><circle cx="132" cy="68" r="9" fill="${F.tinte}"/><path d="M106 92 Q120 102 134 92" stroke="${F.tinte}" stroke-width="4" fill="none" stroke-linecap="round"/>
    <rect x="117" y="10" width="6" height="26" fill="${N.stahl}"/><circle cx="120" cy="10" r="8" fill="${F.koralle}"/>`);

  B.figurLandung = () => svg("-30 0 160 204", `<ellipse cx="50" cy="196" rx="74" ry="8" fill="#fff" opacity=".15"/>${teil.rakete()}`);
  /* ---------- Zusätzliche Details für Riff, Wrack, Weltraum und Rakete ---------- */
  const kleinerFisch = (x, y, s, farbe, gespiegelt) => `<g style="color:${farbe}" transform="translate(${x} ${y}) scale(${gespiegelt ? -s : s} ${s})" opacity=".9">${teil.fisch()}</g>`;
  const DETAIL = {
    riff: `${kleinerFisch(700, 180, 0.45, "#f9c23c")}${kleinerFisch(760, 210, 0.38, "#f9c23c")}${kleinerFisch(120, 240, 0.5, "#f48fb1", true)}${kleinerFisch(880, 380, 0.42, "#b9e36b")}
      <g transform="translate(330 690) scale(.42)">${teil.seestern()}</g><g transform="translate(700 700) scale(.3)">${teil.muschel()}</g><g transform="translate(440 706) scale(.26) rotate(20)">${teil.muschel()}</g>
      <g stroke="${F.koralle}" stroke-width="12" stroke-linecap="round" fill="none"><path d="M420 690 V650 M420 672 L402 648 M420 676 L440 652"/></g>
      <g stroke="#f59a3c" stroke-width="12" stroke-linecap="round" fill="none"><path d="M664 694 V660 M664 678 L648 658 M664 680 L682 660"/></g>
      <g fill="#fff" opacity=".45"><circle cx="500" cy="200" r="6"/><circle cx="512" cy="170" r="4"/><circle cx="880" cy="250" r="5"/><circle cx="210" cy="150" r="5"/></g>`,
    wrack: `${kleinerFisch(260, 200, 0.45, "#f9c23c")}${kleinerFisch(320, 180, 0.36, "#f9c23c")}${kleinerFisch(940, 250, 0.5, "#f0715b", true)}
      <g fill="none" stroke="#9aa7ad" stroke-width="7"><circle cx="196" cy="660" r="11"/><circle cx="214" cy="674" r="11"/><circle cx="234" cy="684" r="11"/></g>
      <g transform="translate(520 660) scale(.3)">${teil.muenze()}</g><g transform="translate(552 676) scale(.26)">${teil.muenze()}</g><g transform="translate(950 690) scale(.26)">${teil.muenze()}</g>
      <g transform="translate(420 690) scale(.36)">${teil.seestern()}</g>
      <path d="M388 470 l30 -8 M410 540 l34 -6 M760 380 l40 -8 M700 560 l36 -6" stroke="${F.holz2}" stroke-width="6" stroke-linecap="round"/>`,
    weltraum: `<circle cx="470" cy="470" r="26" fill="${F.koralle}"/><path d="M448 462 Q470 452 492 462 Q470 468 448 462Z" fill="#c9503e"/>
      <circle cx="930" cy="120" r="18" fill="#7fc8a9"/><ellipse cx="930" cy="122" rx="30" ry="7" fill="none" stroke="#f59a3c" stroke-width="4" transform="rotate(-18 930 122)"/>
      <path d="M700 520 l-60 -22 l14 18z" fill="${F.papier}" opacity=".4"/><circle cx="702" cy="521" r="6" fill="${F.papier}"/>
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
    <path d="M20 60 H160 L176 132 H4Z" fill="${W.pult}"/><path d="M20 60 H160 L164 76 H16Z" fill="${W.pult2}"/>
    <circle cx="52" cy="102" r="13" fill="${F.koralle}"/><circle cx="90" cy="102" r="13" fill="${F.sonne}"/><circle cx="128" cy="102" r="13" fill="${F.blatt}"/>
    <rect x="52" y="8" width="76" height="50" rx="8" fill="${W.all}"/><path d="M62 40 l14 -12 l12 8 l16 -16 l14 10" stroke="#7df0a8" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`);
  B.karte = () => svg("0 0 100 100", `
    <path d="M10 24 L36 14 L64 24 L90 14 V76 L64 86 L36 76 L10 86Z" fill="${F.papier}" stroke="${F.tinte}" stroke-width="6" stroke-linejoin="round"/>
    <path d="M36 14 V76 M64 24 V86" stroke="${F.tinte}" stroke-width="4"/><path d="M22 60 q10 -14 20 -4 t22 -8" stroke="${F.koralle}" stroke-width="5" fill="none" stroke-dasharray="3 8" stroke-linecap="round"/>
    <path d="M70 38 l10 10 m0 -10 l-10 10" stroke="${F.koralle}" stroke-width="5" stroke-linecap="round"/>`);
})();
