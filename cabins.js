// Illustrations in plain SVG: the dream cabins of the hero, the cabin each group of lessons builds
// piece by piece, and the home that a typing speed "deserves". Loaded before the app script.
window.Cabins = (() => {
  let uidN = 0;
  const uid = p => 'cb-' + p + (++uidN); // gradient ids must stay unique when a drawing appears twice
  const svg = (vb, body, cls = '') => `<svg viewBox="${vb}" class="${cls}" aria-hidden="true" focusable="false">${body}</svg>`;
  const vgrad = (id, stops) => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${stops.map((c, i) => `<stop offset="${i / (stops.length - 1)}" stop-color="${c}"/>`).join('')}</linearGradient>`;
  const smoke = (x, y, s = 1) => `<g class="smoke">${[0, 1, 2].map(i => `<circle class="puff p${i}" cx="${x}" cy="${y}" r="${2.4 * s}"/>`).join('')}</g>`;
  const pine = (x, base, h, c1 = '#2c4d38', c2 = '#244231') =>
    `<path d="M${x} ${base - h} L${x + h * .32} ${base - h * .38} L${x - h * .32} ${base - h * .38}Z" fill="${c1}"/><path d="M${x} ${base - h * .72} L${x + h * .4} ${base} L${x - h * .4} ${base}Z" fill="${c2}"/>`;

  /* ---------- Hero: a small cabin far away in each landscape ---------- */
  const hero = {
    beach: svg('0 0 120 100', `
      <circle class="halo" cx="60" cy="44" r="38"/>
      <g fill="#5b3a26"><rect x="4" y="57" width="2" height="16"/><rect x="14" y="57" width="2" height="16"/><rect x="30" y="56" width="3" height="17"/><rect x="47" y="56" width="3" height="17"/><rect x="70" y="56" width="3" height="17"/><rect x="87" y="56" width="3" height="17"/></g>
      <rect x="0" y="56" width="24" height="2.4" fill="#6e4a31"/>
      <rect x="20" y="53" width="80" height="4" rx="1" fill="#7a5236"/>
      <rect x="34" y="34" width="52" height="20" fill="#a0714b" stroke="#6e4a31"/>
      <rect class="win" x="40" y="39" width="10" height="8" rx="1"/><rect class="win" x="70" y="39" width="10" height="8" rx="1"/>
      <rect x="55" y="40" width="10" height="14" fill="#4a2f1f"/><rect class="win" x="57" y="42" width="6" height="12" opacity=".75"/>
      <path d="M24 38 L60 11 L96 38Z" fill="#d6a468"/>
      <path d="M31 33 L60 16 L89 33 M40 36 L60 23 L80 36" fill="none" stroke="#a97a45" stroke-width="1.1"/>
      <path d="M22 38.5 H98" stroke="#9c6d3b" stroke-width="2.2"/>
      <line x1="97" y1="46" x2="97" y2="53" stroke="#5b3a26" stroke-width="1"/><circle class="win" cx="97" cy="45" r="2.2"/>
      <g class="reflect"><rect x="40" y="76" width="10" height="2"/><rect x="70" y="78" width="10" height="2"/><rect x="56" y="80" width="7" height="1.6"/><rect x="30" y="84" width="60" height="1.2" opacity=".5"/><rect x="94" y="75" width="5" height="1.4"/></g>`, 'hero-art'),

    mountains: svg('0 0 120 100', `
      <circle class="halo" cx="60" cy="52" r="36"/>
      <ellipse cx="60" cy="80" rx="46" ry="4" fill="#1f3326" opacity=".45"/>
      ${pine(16, 82, 34)}${pine(104, 83, 30)}${pine(94, 84, 20, '#35573f', '#2a4a35')}
      <rect x="76" y="20" width="7" height="18" fill="#6b5f57"/>${smoke(79.5, 17)}
      <rect x="34" y="50" width="52" height="28" fill="#7d5536"/>
      <path d="M34 57h52M34 64h52M34 71h52" stroke="#5d3d26" stroke-width="1"/>
      <path d="M34 50 L60 24 L86 50Z" fill="#8a603f"/>
      <path d="M25 54 L60 15 L95 54" fill="none" stroke="#3e3845" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"/>
      <path d="M26 50.5 L60 12.5 L94 50.5" fill="none" stroke="#f3f6fb" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>
      <path class="win" d="M53 45 L60 37 L67 45Z"/>
      <rect class="win" x="40" y="58" width="9" height="9"/><rect class="win" x="71" y="58" width="9" height="9"/>
      <rect x="55" y="60" width="10" height="18" fill="#4a2f1f"/>
      <path d="M30 78h60" stroke="#3f2a1c" stroke-width="2"/>`, 'hero-art'),

    forest: svg('0 0 120 100', `
      <circle class="halo" cx="60" cy="54" r="44"/>
      <ellipse cx="60" cy="82" rx="56" ry="6" fill="#1d2b22" opacity=".7"/>
      <rect x="78" y="22" width="8" height="20" fill="#5d5049"/>${smoke(82, 19)}
      <rect x="24" y="46" width="72" height="34" fill="#6a4a33"/>
      <path d="M24 53h72M24 60h72M24 67h72M24 74h72" stroke="#4d3423" stroke-width="1.2"/>
      <g fill="#8a6446" stroke="#4d3423" stroke-width=".6"><circle cx="24" cy="49.5" r="3"/><circle cx="24" cy="56.5" r="3"/><circle cx="24" cy="63.5" r="3"/><circle cx="24" cy="70.5" r="3"/><circle cx="24" cy="77" r="3"/><circle cx="96" cy="49.5" r="3"/><circle cx="96" cy="56.5" r="3"/><circle cx="96" cy="63.5" r="3"/><circle cx="96" cy="70.5" r="3"/><circle cx="96" cy="77" r="3"/></g>
      <path d="M14 50 L60 18 L106 50Z" fill="#4b5d3a"/>
      <path d="M14 50 L60 18 L106 50" fill="none" stroke="#33422a" stroke-width="3" stroke-linejoin="round"/>
      <path d="M30 44q6-3 10 0M70 36q5-3 9 0M48 30q5-3 9 0" stroke="#6f8a4e" stroke-width="2" fill="none" stroke-linecap="round"/>
      <rect class="win" x="32" y="56" width="13" height="11" rx="1"/><rect class="win" x="75" y="56" width="13" height="11" rx="1"/>
      <path d="M38.5 56v11M32 61.5h13M81.5 56v11M75 61.5h13" stroke="#5a3d28" stroke-width="1.2"/>
      <rect x="54" y="58" width="12" height="22" fill="#3f2a1c"/><rect class="win" x="56" y="60" width="8" height="20" opacity=".55"/>
      <circle class="win" cx="50" cy="60" r="1.8"/>
      <g class="flies"><circle cx="10" cy="40" r="1.1"/><circle cx="108" cy="30" r="1.1"/><circle cx="22" cy="24" r=".9"/><circle cx="100" cy="62" r="1"/><circle cx="116" cy="46" r=".9"/></g>`, 'hero-art'),
  };

  /* ---------- A cabin per group of lessons, built one piece at a time ---------- */
  const PARTS = ['los cimientos', 'las paredes', 'el techo', 'la puerta y las ventanas', 'la chimenea', 'el jardín y las luces'];
  const THEMES = [
    { name: 'Cabaña de playa', sky: ['#fde6c8', '#c4e6e7'], ground: '#f0dbb0', wall: '#d9b48a', wallDark: '#b48a5e', roof: '#c9874f', roofDark: '#9d6334',
      bg: `<circle cx="198" cy="52" r="15" fill="#ffd79a"/><rect x="0" y="104" width="240" height="18" fill="#7ecbd0"/><path d="M0 110q12-3 24 0t24 0 24 0 24 0" stroke="#c9f0ef" stroke-width="1.4" fill="none"/>
           <path d="M26 128 q4-30 10-52" stroke="#8a6444" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M36 76 q-18 -6 -26 6 M36 76 q-10 -14 -24 -12 M36 76 q10 -14 24 -10 M36 76 q16 -2 22 12" stroke="#4f8a4c" stroke-width="5" fill="none" stroke-linecap="round"/>` },
    { name: 'Refugio del bosque', sky: ['#e3efe1', '#bcd8c3'], ground: '#80a26e', wall: '#8a5d3b', wallDark: '#654128', roof: '#5b6e3f', roofDark: '#3f4f2b',
      bg: `${pine(20, 128, 70)}${pine(44, 124, 48, '#3a6146', '#2f5139')}${pine(212, 128, 76)}${pine(190, 126, 44, '#3a6146', '#2f5139')}` },
    { name: 'Chalet de montaña', sky: ['#d5e7f6', '#eef4f8'], ground: '#9dbf85', wall: '#7b5536', wallDark: '#5a3b24', roof: '#4a4450', roofDark: '#312c37', snow: true,
      bg: `<path d="M-10 118 L50 44 L92 96 L128 58 L178 112 L208 70 L250 118Z" fill="#9fb2c6"/><path d="M50 44 L40 56 L48 54 L55 60 L62 52Z M128 58 L120 67 L128 65 L134 70 L138 66Z M208 70 L200 80 L208 78 L214 82Z" fill="#f4f7fb"/>${pine(222, 130, 34)}` },
    { name: 'Casita del lago', sky: ['#f4e6f0', '#d3e5f3'], ground: '#a7c28d', wall: '#ece5d6', wallDark: '#c9bfa9', roof: '#3f6f8c', roofDark: '#2b5068',
      bg: `<ellipse cx="206" cy="134" rx="54" ry="16" fill="#8fc1dc"/><path d="M168 132q8-2 16 0M200 140q8-2 16 0" stroke="#d5eef7" stroke-width="1.4" fill="none"/><path d="M22 130v-22M26 130v-26M30 130v-20" stroke="#6f8f4f" stroke-width="2" stroke-linecap="round"/><ellipse cx="26" cy="102" rx="2" ry="5" fill="#7a5a3a"/>` },
    { name: 'Cabaña soñada', sky: ['#ffd8a8', '#f4b3a8', '#c7b6e4'], ground: '#a3c287', wall: '#c98f5e', wallDark: '#9e6a3e', roof: '#b5523b', roofDark: '#8a3a28', porch: true,
      bg: `<circle cx="40" cy="30" r="1.4" fill="#fff"/><circle cx="70" cy="18" r="1" fill="#fff"/><circle cx="200" cy="24" r="1.3" fill="#fff"/><circle cx="222" cy="44" r="1" fill="#fff"/><path d="M-10 126 Q50 96 110 118 T250 112 V160 H-10Z" fill="#8fb277"/>` },
  ];

  // z-order differs from build order: the chimney sits behind the roof, the foundation over the ground line.
  function build(gi, parts, { bonus = false, fresh = [] } = {}) {
    const t = THEMES[gi], sky = uid('sky');
    const st = i => (i < parts ? 'built' : 'plan') + (fresh.includes(i) ? ' fresh' : '');
    const lit = parts >= 6;
    const body = `
      <defs>${vgrad(sky, t.sky)}</defs>
      <rect width="240" height="160" rx="14" fill="url(#${sky})"/>
      ${t.bg}
      <path d="M0 128 H240 V146 a14 14 0 0 1 -14 14 H14 a14 14 0 0 1 -14 -14Z" fill="${t.ground}"/>
      <g class="part ${st(4)}" data-part="4"><rect x="148" y="42" width="13" height="30" fill="#7c6e66"/><rect x="146" y="40" width="17" height="5" fill="#5f534c"/>${parts > 4 ? smoke(154.5, 36, 1.4) : ''}</g>
      <g class="part ${st(1)}" data-part="1"><rect x="70" y="80" width="100" height="40" fill="${t.wall}"/>
        <path d="M70 88h100M70 96h100M70 104h100M70 112h100" stroke="${t.wallDark}" stroke-width="1.4"/>
        ${gi === 3 ? '' : `<g fill="${t.wallDark}"><circle cx="70" cy="84" r="3.4"/><circle cx="70" cy="92" r="3.4"/><circle cx="70" cy="100" r="3.4"/><circle cx="70" cy="108" r="3.4"/><circle cx="70" cy="116" r="3.4"/><circle cx="170" cy="84" r="3.4"/><circle cx="170" cy="92" r="3.4"/><circle cx="170" cy="100" r="3.4"/><circle cx="170" cy="108" r="3.4"/><circle cx="170" cy="116" r="3.4"/></g>`}</g>
      <g class="part ${st(2)}" data-part="2"><path d="M56 84 L120 38 L184 84Z" fill="${t.roof}"/><path d="M56 84 L120 38 L184 84" fill="none" stroke="${t.roofDark}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>
        ${t.snow ? '<path d="M60 80 L120 36 L180 80" fill="none" stroke="#f6f8fc" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" transform="translate(0,-4)"/>' : ''}
        ${gi === 0 ? `<path d="M72 76 L120 42 L168 76 M88 80 L120 56 L152 80" stroke="${t.roofDark}" stroke-width="1.2" fill="none"/>` : ''}
        <circle cx="120" cy="64" r="6" fill="${t.roofDark}"/>${lit ? '<circle class="win" cx="120" cy="64" r="4"/>' : `<circle cx="120" cy="64" r="4" fill="${t.wallDark}"/>`}</g>
      <g class="part ${st(0)}" data-part="0"><rect x="62" y="119" width="116" height="10" rx="2" fill="#a3a09a"/>
        <g fill="#8a8781"><ellipse cx="74" cy="124" rx="5" ry="3"/><ellipse cx="96" cy="125" rx="6" ry="3"/><ellipse cx="122" cy="124" rx="5" ry="3"/><ellipse cx="146" cy="125" rx="6" ry="3"/><ellipse cx="168" cy="124" rx="5" ry="3"/></g></g>
      <g class="part ${st(3)}" data-part="3"><rect x="111" y="94" width="18" height="26" rx="1.5" fill="#5b3a26"/><circle cx="125" cy="108" r="1.4" fill="#e9c46a"/>
        ${[80, 142].map(x => `<rect class="${lit ? 'win' : 'pane'}" x="${x}" y="90" width="18" height="15" rx="1.5"/><path d="M${x + 9} 90v15M${x} 97.5h18" stroke="${t.wallDark}" stroke-width="1.4"/><rect x="${x - 2}" y="105" width="22" height="3" rx="1" fill="${t.wallDark}"/>`).join('')}
        ${t.porch ? `<path d="M96 88 H144" stroke="${t.roofDark}" stroke-width="3"/><path d="M98 88 V120 M142 88 V120" stroke="${t.wallDark}" stroke-width="3"/>` : ''}</g>
      <g class="part ${st(5)}" data-part="5"><path d="M114 129 L108 160 H132 L126 129Z" fill="#d9c7a3"/>
        <path d="M20 140 H62 M178 140 H222 M24 134 V146 M36 134 V146 M48 134 V146 M60 134 V146 M180 134 V146 M192 134 V146 M204 134 V146 M216 134 V146" stroke="#f3ead8" stroke-width="2.4" stroke-linecap="round"/>
        <g><circle cx="88" cy="136" r="3" fill="#e76f7e"/><circle cx="96" cy="140" r="3" fill="#f4b942"/><circle cx="150" cy="138" r="3" fill="#b07de0"/><circle cx="158" cy="135" r="3" fill="#e76f7e"/><circle cx="144" cy="142" r="2.6" fill="#f4b942"/></g>
        <path d="M100 118 V104" stroke="#3a3a3a" stroke-width="1.4"/><circle class="win" cx="100" cy="102" r="3"/></g>
      ${bonus ? `<g class="bonus"><path d="M60 88 L120 44 L180 88" fill="none" stroke="#3a3a3a" stroke-width=".8"/>
        ${[.12, .34, .56, .78].flatMap(t => [[60 + 60 * t, 88 - 44 * t], [180 - 60 * t, 88 - 44 * t]]).map(([x, y], i) => `<circle class="bulb b${i % 3}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.4"/>`).join('')}
        <path d="M120 38 V20" stroke="#5b3a26" stroke-width="1.6"/><path d="M120 20 L134 25 L120 30Z" fill="#f0b340"/><path class="spark" d="M200 60 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2Z" fill="#fff6c9"/></g>` : ''}`;
    return svg('0 0 240 160', body, 'cabin-art');
  }

  /* ---------- The home each typing speed deserves ---------- */
  const ground = c => `<ellipse cx="160" cy="176" rx="150" ry="14" fill="${c}"/>`;
  const HOMES = [
    // Caja de cartón
    `${ground('#c9d6a8')}<path d="M92 176 V124 H176 V176Z" fill="#c99a5f"/><path d="M92 124 L70 108 L150 108 L176 124Z" fill="#b8874e"/><path d="M176 124 L196 104 L196 158 L176 176Z" fill="#a8783f"/>
     <path d="M92 124 L78 140 M176 124 L188 142" stroke="#8d6333" stroke-width="3" stroke-linecap="round"/><rect x="104" y="138" width="44" height="14" fill="none" stroke="#8d6333" stroke-width="1.4"/><text x="126" y="148.5" font-size="9" text-anchor="middle" fill="#8d6333" font-family="monospace" font-weight="700">FRÁGIL</text>
     <path d="M108 176 q10-18 30-4" fill="#7a9fc9"/><text x="222" y="172" font-size="34">🐒</text><text x="46" y="170" font-size="20">🍌</text>`,
    // Choza improvisada
    `${ground('#c3d4a0')}<path d="M86 176 L150 92 M214 176 L150 92 M150 92 L152 84 M120 176 L152 90" stroke="#7a5534" stroke-width="5" stroke-linecap="round"/>
     <path d="M96 170 L150 96 L206 170Z" fill="#4a7fb5" opacity=".9"/><path d="M110 150 L150 96 L186 150" fill="none" stroke="#35628f" stroke-width="2"/><path d="M150 176 L136 142 H164 L150 176Z" fill="#253b52"/>
     <path d="M120 126 l10 8 M170 130 l12 -6" stroke="#e9d9a8" stroke-width="3" stroke-linecap="round"/><g fill="#9a948a"><ellipse cx="238" cy="172" rx="8" ry="4"/><ellipse cx="256" cy="173" rx="7" ry="4"/></g>
     <path d="M240 168 q8-18 16 0" fill="#f08a3c"/><path d="M244 168 q4-10 8 0" fill="#ffd166"/><text x="40" y="172" font-size="26">🐒</text>`,
    // Cabañita
    `${ground('#b8cf95')}<rect x="112" y="116" width="96" height="60" fill="#b07c4f"/><path d="M112 128h96M112 140h96M112 152h96M112 164h96" stroke="#8c5c35" stroke-width="1.5"/>
     <path d="M100 120 L160 80 L220 120Z" fill="#7a5a44"/><rect x="180" y="84" width="8" height="22" fill="#9aa0a6"/>${smoke(184, 80, 1.6)}
     <rect x="126" y="134" width="22" height="18" fill="#ffd98a"/><path d="M137 134v18M126 143h22" stroke="#8c5c35" stroke-width="2"/><rect x="164" y="138" width="22" height="38" fill="#5b3a26"/>${pine(62, 178, 60)}`,
    // Cabaña con chimenea
    `${ground('#b0cb8c')}${pine(44, 178, 74)}${pine(276, 178, 64)}<rect x="196" y="58" width="16" height="44" fill="#8a7d74"/>${smoke(204, 52, 2)}
     <rect x="90" y="104" width="140" height="72" fill="#8a5d3b"/><path d="M90 114h140M90 124h140M90 134h140M90 144h140M90 154h140M90 164h140" stroke="#654128" stroke-width="1.6"/>
     <path d="M74 110 L160 58 L246 110Z" fill="#5b6e3f"/><path d="M74 110 L160 58 L246 110" fill="none" stroke="#3f4f2b" stroke-width="5" stroke-linejoin="round"/>
     <rect class="win" x="104" y="122" width="28" height="22"/><rect class="win" x="188" y="122" width="28" height="22"/><path d="M118 122v22M104 133h28M202 122v22M188 133h28" stroke="#654128" stroke-width="2"/>
     <rect x="148" y="132" width="24" height="44" fill="#4a2f1f"/><path d="M60 170 H86 M234 170 H262 M64 162 V176 M76 162 V176 M240 162 V176 M252 162 V176" stroke="#e9dcc0" stroke-width="3" stroke-linecap="round"/>`,
    // Chalet de montaña
    `<path d="M0 150 L60 70 L110 128 L160 60 L230 140 L270 96 L320 150Z" fill="#b4c4d4"/><path d="M60 70 L48 86 L60 82 L70 90Z M160 60 L148 76 L160 72 L172 80Z M270 96 L260 108 L272 106Z" fill="#f4f7fb"/>${ground('#a9c78a')}
     <rect x="96" y="96" width="128" height="80" fill="#7b5536"/><path d="M96 136h128" stroke="#5a3b24" stroke-width="3"/><path d="M96 106h128M96 116h128M96 126h128M96 146h128M96 156h128M96 166h128" stroke="#5a3b24" stroke-width="1.2"/>
     <path d="M78 102 L160 44 L242 102" fill="#8a603f" stroke="#4a4450" stroke-width="10" stroke-linejoin="round" stroke-linecap="round"/><path d="M80 96 L160 40 L240 96" fill="none" stroke="#f6f8fc" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/>
     <path class="win" d="M146 90 L160 74 L174 90Z"/><rect class="win" x="110" y="108" width="24" height="20"/><rect class="win" x="186" y="108" width="24" height="20"/><rect class="win" x="110" y="146" width="24" height="20"/>
     <rect x="150" y="142" width="22" height="34" fill="#4a2f1f"/><path d="M92 134 H228 M96 128 V134 M110 128 V134 M124 128 V134 M196 128 V134 M210 128 V134 M224 128 V134" stroke="#3f2a1c" stroke-width="2.4"/>${pine(40, 178, 70)}${pine(284, 178, 58)}`,
    // Mansión
    `${ground('#a6c784')}<rect x="232" y="160" width="70" height="14" rx="7" fill="#6fc3e0"/><path d="M240 166q8-3 16 0t16 0 16 0" stroke="#d6f3fb" stroke-width="1.4" fill="none"/>
     <rect x="54" y="92" width="212" height="72" fill="#f4efe6"/><rect x="118" y="70" width="84" height="94" fill="#fbf8f2"/><path d="M110 72 L160 44 L210 72Z" fill="#c9bca6"/><rect x="50" y="86" width="220" height="8" fill="#d9cfbf"/>
     ${[124, 142, 160, 178, 196].map(x => `<rect x="${x - 3}" y="100" width="6" height="64" fill="#e3dccf"/>`).join('')}
     ${[66, 92, 228, 254].map(x => `<rect class="win" x="${x - 8}" y="104" width="16" height="20"/><rect class="win" x="${x - 8}" y="134" width="16" height="20"/>`).join('')}
     <rect x="150" y="128" width="20" height="36" fill="#6b4a33"/><path d="M40 176 q6-40 16-66" stroke="#8a6444" stroke-width="4" fill="none"/><path d="M56 110 q-18 -6 -26 6 M56 110 q-10 -14 -24 -12 M56 110 q10 -14 24 -10 M56 110 q16 -2 22 12" stroke="#4f8a4c" stroke-width="5" fill="none" stroke-linecap="round"/>
     <text x="226" y="150" font-size="16">🚗</text>`,
    // Castillo
    `${ground('#a3c381')}<path d="M40 180 Q160 150 290 180" fill="#7fb6d6"/>
     <rect x="84" y="86" width="152" height="90" fill="#c9c3b8"/><path d="M84 86 v-10 h14 v10 h14 v-10 h14 v10 h14 v-10 h14 v10 h14 v-10 h14 v10 h14 v-10 h14 v10 h14 v-10 h14 v10" fill="#c9c3b8"/>
     ${[[64, 70], [236, 70]].map(([x, y]) => `<rect x="${x}" y="${y}" width="40" height="106" fill="#bdb6aa"/><path d="M${x - 4} ${y} L${x + 20} ${y - 34} L${x + 44} ${y}Z" fill="#6a5acd"/><path d="M${x + 20} ${y - 34} V${y - 56}" stroke="#555" stroke-width="2"/><path d="M${x + 20} ${y - 56} l16 6 -16 6Z" fill="#e63946"/><rect class="win" x="${x + 14}" y="${y + 24}" width="12" height="18" rx="6"/>`).join('')}
     <rect x="144" y="44" width="32" height="44" fill="#bdb6aa"/><path d="M140 44 L160 16 L180 44Z" fill="#6a5acd"/><path d="M160 16 V2" stroke="#555" stroke-width="2"/><path d="M160 2 l14 5 -14 5Z" fill="#f0b340"/>
     <path d="M140 176 V140 a20 20 0 0 1 40 0 V176Z" fill="#5b3a26"/><path d="M146 140h28M146 150h28M146 160h28" stroke="#3f2a1c" stroke-width="1.4"/><rect class="win" x="112" y="110" width="12" height="18" rx="6"/><rect class="win" x="196" y="110" width="12" height="18" rx="6"/>`,
  ];
  const home = i => svg('0 0 320 200', HOMES[i], 'home-art');

  return { hero, PARTS, THEMES, build, home };
})();
