/* planeten.js – Reiseziele, die aus einer Bauzahl entstehen
 *
 * Jeder Planet wird aus einer einzigen Zahl („Bauzahl“) gebaut: Farben, Himmel, Monde, Pflanzen und Bewohner.
 * Dieselbe Zahl ergibt immer denselben Planeten. Im Spielstand steht deshalb pro Reise nur { z: Bauzahl, name }.
 *
 * Dasselbe gilt für die kleinen Inseln der Fähre (art = "insel"): Taghimmel, Meer, Sand oder Wiese, Palmen.
 *
 *   App.planeten.ort(z, name, art)   der Planet oder die Insel als Ort für js/welt.js (befahrbar, mit Bewohner
 *                                    und Rückweg: Landerakete bzw. Fähre)
 *   App.planeten.kleinBild(z, art)   kleines Bild für Album und Anflug
 *   App.planeten.name(z, vergeben)   kurzer Name aus den aktiven Buchstaben, den das Kind selbst lesen kann
 *
 * NEUE BAUSTEINE? Farben in HIMMEL, BODEN und BUNT ergänzen, eine weitere „deko“-Art in ortBild zeichnen
 * oder Sätze in SAETZE anhängen. Achtung: Die Reihenfolge der Zufallszahlen in daten() bestimmt das Aussehen;
 * wer dort etwas einfügt, verändert alle schon besuchten Planeten. Neues deshalb am Ende von daten() anhängen.
 */
"use strict";

(() => {
  const F = App.farben, B = App.bilder;
  const svg = (vb, inhalt) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" aria-hidden="true">${inhalt}</svg>`;

  // Zufall, der aus derselben Zahl immer dieselbe Folge macht (Werte von 0 bis unter 1)
  const zufall = (saat) => {
    let a = saat >>> 0;
    return () => {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  const HIMMEL = [["#141a3a", "#2a2f66"], ["#1d1438", "#4a3b7a"], ["#0a2a3a", "#15566e"], ["#2a1638", "#6a3460"], ["#101c36", "#2c4474"]];
  // Boden: [hell, dunkel, Farbe der Fahrspuren]
  const BODEN = [
    ["#e8a66a", "#c9824a", "rgba(120, 70, 30, .6)"], ["#9ad1b0", "#6fb08c", "rgba(40, 100, 70, .55)"],
    ["#c6b4e8", "#9f88d0", "rgba(80, 58, 140, .55)"], ["#f2d06b", "#d9ad3c", "rgba(140, 100, 20, .6)"],
    ["#f0a6b8", "#d77f96", "rgba(140, 60, 80, .55)"], ["#b9c2d6", "#8f9bb8", "rgba(70, 80, 110, .55)"],
    ["#8fd3e8", "#5fb3cd", "rgba(30, 100, 130, .55)"], ["#e08f7e", "#c06b5a", "rgba(120, 50, 40, .6)"],
  ];
  const BUNT = ["#f9c23c", "#f0715b", "#7fc8a9", "#b565c9", "#58b9c9", "#f59a3c", "#fff8ea"];
  // Kleine Inseln (Ziele der Fähre): Taghimmel und Sand oder Wiese statt Nachthimmel und Planetenboden
  const HIMMEL_INSEL = [["#bfe6ee", "#d9f1f5"], ["#fbd9ae", "#fde8c9"], ["#c9e4f7", "#e4f2fb"], ["#f7cfd8", "#fbe3e8"]];
  const BODEN_INSEL = [
    ["#f2d9a0", "#e2c483", "rgba(170, 128, 70, .7)"], ["#bfe3a3", "#93c878", "rgba(60, 120, 50, .5)"],
    ["#f6e3b4", "#e8cd8c", "rgba(170, 128, 70, .7)"], ["#e8c9a0", "#d3a877", "rgba(140, 96, 50, .65)"],
  ];
  const SAETZE = ["Hallo, kleiner Roboter!", "Oh, Besuch! Wie schön!", "Blubb blubb! Willkommen!", "Juhu! Fahr mit mir um die Wette!", "Psst! Ich habe mich versteckt."];
  // Namen, die zufällig entstehen könnten und die niemand lesen soll
  const NICHT = ["popo", "pipi", "kaka", "pupu", "mumu", "lulu", "hure", "nazi", "homo", "puta", "titi", "tote", "tode"];

  // Höhe des Horizonts an der Stelle x (der Boden ist leicht gewölbt)
  const horizont = (x) => { const t = x / 1024; return 392 - 148 * t * (1 - t); };

  // art: "planet" (Vorgabe) oder "insel". Beide ziehen dieselbe Folge von Zufallszahlen, nur aus anderen Farben.
  function daten(z, art) {
    const insel = art === "insel";
    const r = zufall(z), w = (l) => l[Math.floor(r() * l.length)], zw = (a, b) => a + r() * (b - a);
    const d = { insel, himmel: w(insel ? HIMMEL_INSEL : HIMMEL), boden: w(insel ? BODEN_INSEL : BODEN), ring: r() < 0.45, ringFarbe: w(BUNT), mond: r() < 0.5, mondFarbe: w(BUNT) };
    d.sterne = Array.from({ length: 46 }, () => [zw(0, 1024), zw(0, 350), zw(1.5, 4)]);
    d.koerper = Array.from({ length: Math.floor(zw(0, 3)) }, () => ({ x: zw(420, 960), y: zw(70, 210), r: zw(28, 68), farbe: w(BUNT), ring: r() < 0.35 }));
    d.huegel = Array.from({ length: 3 }, () => [zw(0, 1024), zw(160, 320), zw(40, 90)]);
    d.krater = Array.from({ length: 5 + Math.floor(zw(0, 4)) }, () => [zw(60, 964), zw(450, 730), zw(26, 60)]);
    d.deko = Math.floor(zw(0, 4));
    d.dekoFarbe = w(BUNT);
    d.dinge = Array.from({ length: 4 + Math.floor(zw(0, 3)) }, () => { const x = zw(350, 990); return [x, horizont(x) + zw(4, 16), zw(26, 48)]; });
    d.bewohner = { farbe: w(BUNT.slice(0, 6)), form: Math.floor(zw(0, 3)), augen: 1 + Math.floor(zw(0, 3)), antennen: Math.floor(zw(0, 3)),
                   x: zw(520, 880), y: zw(480, 670), satz: Math.floor(zw(0, SAETZE.length + 1)) };
    return d;
  }

  /* ---------- Bilder ---------- */
  // Etwas Tiefe (wie in bilder.js): eine dunklere rechte Seite, als läge ein zweites Blatt darunter
  const DUNKEL = `fill="#000" opacity=".14"`;
  // dunkle Sichel an der rechten Seite einer stehenden Ellipse
  const seite = (cx, cy, rx, ry) => `<path d="M${cx} ${cy - ry} A${rx} ${ry} 0 0 1 ${cx} ${cy + ry} A${rx * 0.4} ${ry} 0 0 0 ${cx} ${cy - ry}Z" ${DUNKEL}/>`;
  const ding = (art, x, y, s, farbe) => [
    // Kristalle
    () => `<path d="M${x - s * 0.5} ${y} L${x - s * 0.15} ${y - s * 1.6} L${x + s * 0.2} ${y}Z" fill="${farbe}"/><path d="M${x - s * 0.15} ${y - s * 1.6} L${x + s * 0.2} ${y} H${x - s * 0.06}Z" ${DUNKEL}/>
      <path d="M${x - s * 0.05} ${y} L${x + s * 0.35} ${y - s * 1.1} L${x + s * 0.6} ${y}Z" fill="${farbe}" opacity=".7"/><path d="M${x + s * 0.35} ${y - s * 1.1} L${x + s * 0.6} ${y} H${x + s * 0.4}Z" ${DUNKEL}/>`,
    // Pilze
    () => `<rect x="${x - s * 0.16}" y="${y - s}" width="${s * 0.32}" height="${s}" rx="${s * 0.12}" fill="${F.papier}"/><rect x="${x + s * 0.03}" y="${y - s * 0.85}" width="${s * 0.13}" height="${s * 0.73}" ${DUNKEL}/>
      <path d="M${x - s * 0.7} ${y - s * 0.85} Q${x} ${y - s * 2} ${x + s * 0.7} ${y - s * 0.85}Z" fill="${farbe}"/><path d="M${x} ${y - s * 1.425} Q${x + s * 0.35} ${y - s * 1.425} ${x + s * 0.7} ${y - s * 0.85} H${x + s * 0.36} Q${x + s * 0.34} ${y - s * 1.24} ${x} ${y - s * 1.425}Z" ${DUNKEL}/>
      <circle cx="${x - s * 0.2}" cy="${y - s * 1.2}" r="${s * 0.12}" fill="${F.papier}"/><circle cx="${x + s * 0.25}" cy="${y - s * 1.05}" r="${s * 0.09}" fill="${F.papier}"/>`,
    // Stachelpflanzen
    () => `<ellipse cx="${x}" cy="${y - s * 0.9}" rx="${s * 0.3}" ry="${s * 0.95}" fill="${farbe}"/>${seite(x, y - s * 0.9, s * 0.3, s * 0.95)}
      <ellipse cx="${x - s * 0.5}" cy="${y - s * 0.7}" rx="${s * 0.2}" ry="${s * 0.5}" fill="${farbe}" opacity=".8"/>${seite(x - s * 0.5, y - s * 0.7, s * 0.2, s * 0.5)}
      <ellipse cx="${x + s * 0.5}" cy="${y - s * 0.5}" rx="${s * 0.18}" ry="${s * 0.4}" fill="${farbe}" opacity=".8"/>${seite(x + s * 0.5, y - s * 0.5, s * 0.18, s * 0.4)}`,
    // Felsen (die dunklere Seite ist schon gezeichnet, dazu ein heller Rand oben links)
    () => `<path d="M${x - s * 0.8} ${y} Q${x - s * 0.7} ${y - s} ${x} ${y - s * 0.85} Q${x + s * 0.8} ${y - s * 0.7} ${x + s * 0.7} ${y}Z" fill="#7d8597"/><path d="M${x - s * 0.1} ${y} Q${x} ${y - s * 0.5} ${x + s * 0.5} ${y - s * 0.45} Q${x + s * 0.75} ${y - s * 0.3} ${x + s * 0.7} ${y}Z" fill="#6a7285"/>
      <path d="M${x - s * 0.62} ${y - s * 0.4} Q${x - s * 0.55} ${y - s * 0.74} ${x - s * 0.12} ${y - s * 0.74}" stroke="#fff" stroke-width="${s * 0.07}" fill="none" stroke-linecap="round" opacity=".25"/>`,
  ][art]();

  // Dinge auf einer Insel: Palmen, Felsen, Büsche mit Blüten
  // dunkle Sichel unten in einem Kreis (für die Büsche)
  const unten = (cx, cy, r) => {
    const dy = r * 0.35, a = Math.sqrt(r * r - dy * dy);
    return `<path d="M${(cx - a).toFixed(1)} ${(cy + dy).toFixed(1)} A${r} ${r} 0 0 0 ${(cx + a).toFixed(1)} ${(cy + dy).toFixed(1)} A${r} ${(r * 0.6).toFixed(1)} 0 0 1 ${(cx - a).toFixed(1)} ${(cy + dy).toFixed(1)}Z" ${DUNKEL}/>`;
  };
  const inselDing = (art, x, y, s, farbe) => {
    if (art === 1) return ding(3, x, y, s, farbe);
    if (art === 2) return `<circle cx="${x - s * 0.4}" cy="${y - s * 0.35}" r="${s * 0.45}" fill="${F.blatt2}"/><circle cx="${x + s * 0.3}" cy="${y - s * 0.4}" r="${s * 0.5}" fill="${F.blatt}"/><circle cx="${x}" cy="${y - s * 0.7}" r="${s * 0.4}" fill="${F.blatt}"/>
      ${unten(x - s * 0.4, y - s * 0.35, s * 0.45)}${unten(x + s * 0.3, y - s * 0.4, s * 0.5)}
      <circle cx="${x - s * 0.3}" cy="${y - s * 0.5}" r="${s * 0.11}" fill="${farbe}"/><circle cx="${x + s * 0.35}" cy="${y - s * 0.6}" r="${s * 0.11}" fill="${farbe}"/><circle cx="${x + s * 0.05}" cy="${y - s * 0.9}" r="${s * 0.11}" fill="${farbe}"/>`;
    const tx = x - s * 0.1, ty = y - s * 2.3;   // Palme: Krone bei (tx, ty)
    // Stamm: rechts ein dunkler Streifen. Blätter: dunkle Unterseite (bei den Blättern nach links ist das die
    // andere Kante, weil sie auf dem Kopf stehen)
    return `<path d="M${x} ${y} Q${x + s * 0.35} ${y - s * 1.2} ${tx} ${ty}" stroke="${F.holz}" stroke-width="${s * 0.24}" fill="none" stroke-linecap="round"/>
      <path d="M${x} ${y} Q${x + s * 0.35} ${y - s * 1.2} ${tx} ${ty}" transform="translate(${s * 0.06} 0)" stroke="#000" stroke-width="${s * 0.09}" fill="none" stroke-linecap="round" opacity=".14"/>
      <g transform="translate(${tx} ${ty})">${[-160, -115, -65, -20, 18].map((a) => `<path d="M0 0 Q${s * 0.7} ${-s * 0.6} ${s * 1.35} ${s * 0.1} Q${s * 0.6} ${-s * 0.1} 0 0Z" transform="rotate(${a})" fill="${a % 2 ? F.blatt : F.blatt2}"/><path d="${
        a < -90 ? `M0 0 Q${s * 0.7} ${-s * 0.6} ${s * 1.35} ${s * 0.1} Q${s * 0.7} ${-s * 0.46} 0 0Z` : `M0 0 Q${s * 0.6} ${-s * 0.1} ${s * 1.35} ${s * 0.1} Q${s * 0.62} ${-s * 0.25} 0 0Z`}" transform="rotate(${a})" ${DUNKEL}/>`).join("")}</g>`;
  };

  function inselBild(d, name) {
    const [oben, unten] = d.himmel, [hell, dunkel] = d.boden;
    const sonne = d.koerper[0] || { x: 760, y: 120, r: 50 };
    return svg("0 0 1024 768", `
      <rect width="1024" height="768" fill="${oben}"/><rect y="170" width="1024" height="140" fill="${unten}"/>
      <circle cx="${sonne.x.toFixed(0)}" cy="${sonne.y.toFixed(0)}" r="${Math.max(40, sonne.r).toFixed(0)}" fill="${F.sonne}"/>
      <g fill="#fff" opacity=".9">${d.sterne.slice(0, 4).map(([x, y]) => `<ellipse cx="${x.toFixed(0)}" cy="${(40 + y * 0.5).toFixed(0)}" rx="62" ry="18"/><ellipse cx="${(x + 40).toFixed(0)}" cy="${(28 + y * 0.5).toFixed(0)}" rx="38" ry="16"/>`).join("")}</g>
      <rect y="300" width="1024" height="140" fill="${F.meer}"/>
      ${d.huegel.map(([x, b, h]) => `<path d="M${(x - b).toFixed(0)} 304 Q${x.toFixed(0)} ${(304 - h * 1.2).toFixed(0)} ${(x + b).toFixed(0)} 304Z" fill="${F.tief}" opacity=".4"/>`).join("")}
      <path d="M0 336 q64 -10 128 0 t128 0 t128 0 t128 0 t128 0 t128 0 t128 0 t128 0 V440 H0Z" fill="${F.meer2}" opacity=".6"/>
      <path d="M0 392 Q512 318 1024 392 V768 H0Z" fill="${hell}"/>
      ${d.krater.map(([x, y, rx]) => `<ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="${rx.toFixed(0)}" ry="${(rx * 0.3).toFixed(0)}" fill="${dunkel}" opacity=".45"/>`).join("")}
      ${d.dinge.filter(([x]) => x < 700).map(([x, y, s]) => inselDing(d.deko % 3, +x.toFixed(0), +y.toFixed(0), +s.toFixed(0), d.dekoFarbe)).join("")}
      <rect x="245" y="352" width="10" height="${(horizont(250) + 12 - 352).toFixed(0)}" fill="${F.holz2}"/>
      <rect x="172" y="298" width="156" height="60" rx="12" fill="${F.papier}"/>
      <text x="250" y="342" text-anchor="middle" font-family="Grundschrift, sans-serif" font-size="40" fill="${F.tinte}">${name}</text>`);
  }

  function ortBild(z, name, art) {
    const d = daten(z, art), [oben, unten] = d.himmel, [hell, dunkel] = d.boden;
    if (d.insel) return inselBild(d, name);
    return svg("0 0 1024 768", `
      <rect width="1024" height="768" fill="${oben}"/><rect y="230" width="1024" height="200" fill="${unten}"/>
      <g class="sterne" fill="#fff">${d.sterne.map(([x, y, r]) => `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${r.toFixed(1)}"/>`).join("")}</g>
      ${d.koerper.map((k) => `<circle cx="${k.x.toFixed(0)}" cy="${k.y.toFixed(0)}" r="${k.r.toFixed(0)}" fill="${k.farbe}"/><circle cx="${(k.x - k.r * 0.3).toFixed(0)}" cy="${(k.y - k.r * 0.3).toFixed(0)}" r="${(k.r * 0.22).toFixed(0)}" fill="#fff" opacity=".25"/>${
        k.ring ? `<ellipse cx="${k.x.toFixed(0)}" cy="${k.y.toFixed(0)}" rx="${(k.r * 1.6).toFixed(0)}" ry="${(k.r * 0.4).toFixed(0)}" fill="none" stroke="${F.papier}" stroke-width="7" opacity=".8" transform="rotate(-14 ${k.x.toFixed(0)} ${k.y.toFixed(0)})"/>` : ""}`).join("")}
      ${d.huegel.map(([x, b, h]) => `<path d="M${(x - b).toFixed(0)} 400 Q${x.toFixed(0)} ${(400 - h * 2).toFixed(0)} ${(x + b).toFixed(0)} 400Z" fill="${dunkel}"/>`).join("")}
      <path d="M0 392 Q512 318 1024 392 V768 H0Z" fill="${hell}"/>
      ${d.krater.map(([x, y, rx]) => `<ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="${rx.toFixed(0)}" ry="${(rx * 0.36).toFixed(0)}" fill="${dunkel}" opacity=".55"/>`).join("")}
      ${d.dinge.map(([x, y, s]) => ding(d.deko, +x.toFixed(0), +y.toFixed(0), +s.toFixed(0), d.dekoFarbe)).join("")}
      <rect x="245" y="352" width="10" height="${(horizont(250) + 12 - 352).toFixed(0)}" fill="${F.holz2}"/>
      <rect x="172" y="298" width="156" height="60" rx="12" fill="${F.papier}"/>
      <text x="250" y="342" text-anchor="middle" font-family="Grundschrift, sans-serif" font-size="40" fill="${F.tinte}">${name}</text>`);
  }

  function kleinBild(z, art) {
    const d = daten(z, art), [hell, dunkel] = d.boden;
    if (d.insel) return svg("0 0 100 100", `
      <circle cx="50" cy="52" r="36" fill="${F.meer}"/><path d="M16 60 q9 -6 18 0 t18 0 t18 0 t18 0" stroke="${F.meer2}" stroke-width="4" fill="none"/>
      <ellipse cx="50" cy="64" rx="26" ry="11" fill="${hell}"/><ellipse cx="44" cy="66" rx="10" ry="4" fill="${dunkel}" opacity=".6"/>
      <path d="M54 62 Q58 46 52 34" stroke="${F.holz}" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M52 34 q-16 -8 -22 4 q12 -4 22 -4 q4 -14 18 -10 q-10 2 -18 10 q14 -4 22 6 q-10 -4 -22 -6Z" fill="${F.blatt}"/>`);
    return svg("0 0 100 100", `
      ${d.mond ? `<circle cx="84" cy="20" r="8" fill="${d.mondFarbe}"/>` : ""}
      <circle cx="50" cy="52" r="32" fill="${hell}"/>
      <path d="M22 42 Q50 32 78 42 Q50 50 22 42Z" fill="${dunkel}"/><path d="M24 62 Q50 74 76 62 Q50 68 24 62Z" fill="${dunkel}"/>
      <circle cx="40" cy="54" r="5" fill="${dunkel}" opacity=".6"/><circle cx="62" cy="48" r="3.5" fill="${dunkel}" opacity=".6"/>
      ${d.ring ? `<ellipse cx="50" cy="52" rx="46" ry="11" fill="none" stroke="${d.ringFarbe}" stroke-width="6" transform="rotate(-16 50 52)"/>` : ""}`);
  }

  function bewohnerBild(z) {
    const b = daten(z).bewohner;
    const koerper = [
      `<ellipse cx="60" cy="66" rx="38" ry="36" fill="${b.farbe}"/>`,
      `<rect x="24" y="30" width="72" height="74" rx="30" fill="${b.farbe}"/>`,
      `<path d="M60 22 Q104 60 92 92 Q60 116 28 92 Q16 60 60 22Z" fill="${b.farbe}"/>`,
    ][b.form];
    // Etwas Tiefe, passend zur Körperform: dunklerer Bauch und ein Glanzbogen oben links
    const bauch = [
      `M23.5 76 A38 36 0 0 0 96.5 76 A38 24 0 0 1 23.5 76Z`,
      `M25.7 84 A30 30 0 0 0 54 104 H66 A30 30 0 0 0 94.3 84 Q60 102 25.7 84Z`,
      `M92 92 Q60 116 28 92 Q60 100 92 92Z`,
    ][b.form];
    const glanz = [`M29.7 55.5 A32.3 30.6 0 0 1 49 37.3`, `M30.5 51.5 A25 25 0 0 1 45.5 36.5`, `M36 56 Q38 47 46 40`][b.form];
    const augen = [[[60, 58, 15]], [[45, 58, 12], [75, 58, 12]], [[38, 62, 10], [60, 52, 10], [82, 62, 10]]][b.augen - 1];
    const antennen = [[48, 34, 40, 12], [72, 34, 80, 12]].slice(0, b.antennen);
    return svg("0 0 120 120", `
      <ellipse cx="60" cy="111" rx="42" ry="5.5" fill="${F.tinte}" opacity=".15"/>
      ${antennen.map(([x1, y1, x2, y2]) => `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${b.farbe}" stroke-width="5" stroke-linecap="round"/><circle cx="${x2}" cy="${y2}" r="6" fill="${F.sonne}"/>`).join("")}
      <ellipse cx="44" cy="106" rx="13" ry="7" fill="${F.tinte}" opacity=".35"/><ellipse cx="76" cy="106" rx="13" ry="7" fill="${F.tinte}" opacity=".35"/>
      ${koerper}
      <path d="${bauch}" fill="#000" opacity=".13"/><path d="${glanz}" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".3"/>
      ${augen.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${F.papier}"/><circle cx="${x + 1}" cy="${y + 1}" r="${(r * 0.45).toFixed(1)}" fill="${F.tinte}"/><circle cx="${(x + 1 + r * 0.16).toFixed(1)}" cy="${(y + 1 - r * 0.18).toFixed(1)}" r="${(r * 0.15).toFixed(1)}" fill="#fff"/>`).join("")}
      <path d="M48 84 Q60 94 72 84" stroke="${F.tinte}" stroke-width="4" fill="none" stroke-linecap="round"/>`);
  }

  // Sterne für den Anflug (doppelt so hoch wie die Bühne, sie ziehen nach unten vorbei)
  const sterneBild = () => svg("0 0 1024 1536", `<rect width="1024" height="1536" fill="#141a3a"/>${
    Array.from({ length: 130 }, () => `<circle cx="${(Math.random() * 1024).toFixed(0)}" cy="${(Math.random() * 1536).toFixed(0)}" r="${(1.5 + Math.random() * 3).toFixed(1)}" fill="#fff"/>`).join("")}`);

  /* ---------- Name: zwei offene Silben aus den aktiven Buchstaben, z. B. „Malu“ ---------- */
  function name(z, vergeben = []) {
    const aktiv = App.buchstabenAktiv().filter((b) => b.length === 1);
    let v = aktiv.filter((b) => "AEIOU".includes(b)), k = aktiv.filter((b) => !"AEIOUCQXY".includes(b));
    if (!v.length) v = ["A", "O"];
    if (!k.length) k = ["M", "L"];
    const r = zufall(z ^ 0x51ed270b), w = (l) => l[Math.floor(r() * l.length)];
    let n = "";
    for (let versuch = 0; versuch < 30; versuch++) {
      n = w(k) + w(v).toLowerCase() + w(k).toLowerCase() + w(v).toLowerCase();
      if (!NICHT.includes(n.toLowerCase()) && !vergeben.includes(n)) break;
    }
    return n;
  }

  const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

  // Der Planet oder die Insel als Ort für js/welt.js
  function ort(z, n, art) {
    const d = daten(z, art), b = d.bewohner;
    // Insel: Die Fähre liegt rechts im Meer, der Bewohner wohnt deshalb weiter links
    if (d.insel) return {
      name: `Insel ${n}`, male: () => ortBild(z, n, art), ansage: `Angekommen! Diese Insel heißt ${n}.`,
      licht: rgb(d.boden[0]), rover: { x: 760, y: 560 }, boden: 412, spur: d.boden[2],
      tore: [{ id: "faehre", x: 850, y: 352, r: 100, figur: "figurFaehre", breite: 210, faehre: true }],
      treffen: [{ x: b.x - 360, y: b.y, r: 86, breite: 116, bild: bewohnerBild(z), sag: b.satz < SAETZE.length ? SAETZE[b.satz] : `Willkommen auf ${n}!` }],
    };
    return {
      name: `Planet ${n}`, male: () => ortBild(z, n), ansage: `Gelandet! Dieser Planet heißt ${n}.`,
      licht: rgb(d.boden[0]), rover: { x: 310, y: 560 }, boden: 412, spur: d.boden[2],
      tore: [{ id: "rueckflug", x: 150, y: 560, r: 56, figur: "figurLandung", breite: 96, ziel: "weltraum" }],
      treffen: [{ x: b.x, y: b.y, r: 86, breite: 116, bild: bewohnerBild(z), sag: b.satz < SAETZE.length ? SAETZE[b.satz] : `Willkommen auf ${n}!` }],
    };
  }

  App.planeten = { ort, kleinBild, name, sterneBild };

  /* ---------- Bilder für Treibstoff und Abflug ---------- */
  B.teilTreibstoff = () => svg("0 0 100 100", `
    <rect x="30" y="6" width="26" height="16" rx="5" fill="${F.tinte}"/>
    <path d="M22 20 H62 L80 38 V84 Q80 94 70 94 H30 Q20 94 20 84 V22Z" fill="${F.koralle}"/>
    <path d="M62 20 L80 38 H62Z" fill="#c9543f"/>
    <path d="M20 78 H80 V84 Q80 94 70 94 H30 Q20 94 20 84Z" fill="#000" opacity=".13"/>
    <path d="M27.5 30 V64" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity=".35"/>
    <path d="M50 44 Q64 62 64 70 A14 14 0 0 1 36 70 Q36 62 50 44Z" fill="${F.sonne}"/>`);
  // Abflug: nur ein Fragezeichen. Es sitzt auf dem großen Planeten im Weltraum-Bild (der Planet selbst ist das Ziel).
  B.figurPlanetenflug = () => svg("0 0 100 100", `
    <circle cx="50" cy="50" r="42" fill="${F.sonne}"/>
    <text x="50" y="70" text-anchor="middle" font-family="-apple-system, 'Segoe UI', sans-serif" font-size="60" font-weight="800" fill="${F.tinte}">?</text>`);
})();
