// Illustrations in plain SVG: the cabin each group of lessons builds piece by piece, and the typist
// that matches each speed (from a chimpanzee to an alien). Loaded before the app script.
window.Cabins = (() => {
  let uidN = 0;
  const uid = p => 'cb-' + p + (++uidN); // gradient ids must stay unique when a drawing appears twice
  const svg = (vb, body, cls = '') => `<svg viewBox="${vb}" class="${cls}" aria-hidden="true" focusable="false">${body}</svg>`;
  const vgrad = (id, stops) => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${stops.map((c, i) => `<stop offset="${i / (stops.length - 1)}" stop-color="${c}"/>`).join('')}</linearGradient>`;
  const smoke = (x, y, s = 1) => `<g class="smoke">${[0, 1, 2].map(i => `<circle class="puff p${i}" cx="${x}" cy="${y}" r="${2.4 * s}"/>`).join('')}</g>`;
  const pine = (x, base, h, c1 = '#2c4d38', c2 = '#244231') =>
    `<path d="M${x} ${base - h} L${x + h * .32} ${base - h * .38} L${x - h * .32} ${base - h * .38}Z" fill="${c1}"/><path d="M${x} ${base - h * .72} L${x + h * .4} ${base} L${x - h * .4} ${base}Z" fill="${c2}"/>`;

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

  /* ---------- Who types like you: seven typists, from a chimpanzee to an alien ---------- */
  // Side view: the typist sits at the left and reaches the keyboard on the right. Arms tap in turns (speed via --tap).
  const DESK = '<rect x="160" y="132" width="140" height="7" rx="2" fill="#a47148"/><rect x="170" y="139" width="6" height="37" fill="#8a5c38"/><rect x="284" y="139" width="6" height="37" fill="#8a5c38"/>';
  const LAPTOP = (glow = '#bfeaff') => `<path d="M184 132 H262 L258 127 H190Z" fill="#9aa3ad"/><path d="M236 127 H262 L286 78 L262 74Z" fill="#2b3440"/><path d="M240 124 H259 L281 80 L264 77Z" fill="${glow}"/><path d="M247 116 l20 -2 M250 108 l20 -2 M253 100 l18 -2" stroke="#6aa6c8" stroke-width="1.6"/>`;
  const CHAIR = c => `<rect x="70" y="152" width="62" height="7" rx="3" fill="${c}"/><rect x="97" y="159" width="7" height="17" fill="${c}"/><rect x="82" y="174" width="38" height="4" rx="2" fill="${c}"/>`;
  const arm = (cls, from, ctrl, hand, sleeve, skin) => `<g class="tap ${cls}"><path d="M${from} Q${ctrl} ${hand}" fill="none" stroke="${sleeve}" stroke-width="10" stroke-linecap="round"/><circle cx="${hand.split(' ')[0]}" cy="${hand.split(' ')[1]}" r="5.5" fill="${skin}"/></g>`;
  const fly = (words, color = '#6b7c73') => words.map((w, i) => `<text class="fly f${i}" x="${258 + i * 14}" y="${70 - i * 6}" fill="${color}">${w}</text>`).join('');
  function typist({ tap, skin, sleeve, torso, pants, head, chair = CHAIR('#8a6444'), desk = DESK, device = LAPTOP(), back = '', front = '', words = [], extraArms = '' }) {
    return svg('0 0 320 200', `
      ${back}<ellipse cx="170" cy="178" rx="150" ry="8" fill="#0000000f"/>
      ${desk}${device}${chair}
      ${arm('tb', '112 106', '150 134', '224 128', sleeve, skin)}
      <rect x="84" y="138" width="72" height="14" rx="7" fill="${pants}"/><rect x="143" y="144" width="13" height="32" rx="6" fill="${pants}"/><ellipse cx="153" cy="177" rx="10" ry="4.5" fill="#333"/>
      <path d="M84 98 Q104 88 126 98 L132 150 H80Z" fill="${torso}"/>
      ${head}${extraArms}
      ${arm('ta', '120 104', '154 124', '200 126', sleeve, skin)}
      ${front}${fly(words)}`, 'typist-art').replace('<svg ', `<svg style="--tap:${tap}s" `);
  }
  const eyes = (y = 62, c = '#222') => `<circle cx="102" cy="${y}" r="2.4" fill="${c}"/><circle cx="114" cy="${y}" r="2.4" fill="${c}"/>`;
  const TYPISTS = [
    // Chimpancé
    () => typist({ tap: .7, skin: '#d9b38c', sleeve: '#5b3a26', torso: '#5b3a26', pants: '#5b3a26', words: ['ñ?', 'ooh', '!!'],
      head: `<circle cx="80" cy="64" r="8" fill="#5b3a26"/><circle cx="80" cy="64" r="4" fill="#d9b38c"/><circle cx="104" cy="64" r="24" fill="#5b3a26"/><ellipse cx="108" cy="68" rx="16" ry="15" fill="#d9b38c"/>
        <path d="M94 57 q8-5 26 0" stroke="#3f2819" stroke-width="3" fill="none" stroke-linecap="round"/>${eyes(62)}<ellipse cx="112" cy="77" rx="12" ry="7.5" fill="#e8c9a2"/><circle cx="109" cy="74" r="1.2" fill="#6b4a33"/><circle cx="115" cy="74" r="1.2" fill="#6b4a33"/><path d="M104 80 q8 5 16 0" stroke="#6b4a33" stroke-width="1.6" fill="none"/>`,
      front: `<path d="M168 130 q10 -14 26 -8 q-14 0 -22 10Z" fill="#f4d03f" stroke="#c9a227"/>` }),
    // Bebé
    () => typist({ tap: .5, skin: '#f6cfae', sleeve: '#9fd3f0', torso: '#9fd3f0', pants: '#9fd3f0', chair: '<rect x="66" y="152" width="68" height="7" rx="3" fill="#f4a7b9"/><path d="M76 159 L66 176 M124 159 L134 176" stroke="#f4a7b9" stroke-width="5" stroke-linecap="round"/>',
      device: '<rect x="182" y="118" width="80" height="14" rx="5" fill="#ff9f43"/>' + ['#e63946', '#f4d03f', '#2a9d8f', '#457b9d', '#9b5de5'].map((c, i) => `<circle cx="${192 + i * 15}" cy="125" r="4" fill="${c}"/>`).join(''), words: ['gu', 'gu', 'ta!'],
      head: `<circle cx="104" cy="62" r="27" fill="#f6cfae"/><path d="M100 36 q6 -8 10 2 q-6 -2 -6 4" stroke="#8a6444" stroke-width="2.5" fill="none" stroke-linecap="round"/>${eyes(60)}<circle cx="94" cy="70" r="4" fill="#f4a7b9" opacity=".7"/><circle cx="121" cy="70" r="4" fill="#f4a7b9" opacity=".7"/>
        <circle cx="112" cy="76" r="5" fill="#ff8fab"/><circle cx="112" cy="76" r="2" fill="#fff"/><path d="M88 96 q16 12 34 0 v10 q-17 8 -34 0Z" fill="#fff"/>`,
      front: '<rect x="270" y="112" width="10" height="20" rx="4" fill="#fff" stroke="#bbb"/><rect x="271" y="106" width="8" height="7" rx="3" fill="#f4a7b9"/>' }),
    // Niño
    () => typist({ tap: .35, skin: '#f1c27d', sleeve: '#f4c542', torso: '#f4c542', pants: '#3d6fb6', words: ['ja', 'ja', 'xd'], device: LAPTOP() + '<circle cx="255" cy="92" r="0"/><path d="M270 96 l2 4 4 1 -3 3 1 4 -4 -2 -4 2 1 -4 -3 -3 4 -1Z" fill="#f4d03f" transform="translate(-6,-8)"/>',
      head: `<circle cx="104" cy="64" r="22" fill="#f1c27d"/><path d="M82 60 a22 22 0 0 1 44 0Z" fill="#e63946"/><path d="M82 60 h-14 q2 -6 14 -6Z" fill="#c1121f"/>${eyes(66)}<path d="M100 76 q6 5 12 0" stroke="#7a4b2a" stroke-width="2" fill="none" stroke-linecap="round"/>
        <circle cx="96" cy="72" r="1" fill="#c68642"/><circle cx="99" cy="74" r="1" fill="#c68642"/><circle cx="117" cy="72" r="1" fill="#c68642"/><path d="M84 116 H130" stroke="#e76f51" stroke-width="4"/>`,
      front: '<rect x="166" y="114" width="12" height="18" rx="2" fill="#2a9d8f"/><path d="M175 114 l4 -8" stroke="#e63946" stroke-width="2"/>' }),
    // Indigente
    () => typist({ tap: .3, skin: '#e0b08a', sleeve: '#6b7b4b', torso: '#6b7b4b', pants: '#4a4a4a', words: ['$', '$', '¢'],
      chair: '<rect x="68" y="150" width="64" height="26" fill="#b0834f"/><path d="M68 158 H132 M68 167 H132" stroke="#8d6333" stroke-width="2"/>',
      desk: '<rect x="170" y="132" width="112" height="44" fill="#c99a5f"/><path d="M170 132 L160 124 H272 L282 132" fill="#b8874e"/><text x="226" y="160" font-size="10" text-anchor="middle" fill="#8d6333" font-family="monospace" font-weight="700">FRÁGIL</text>',
      device: '<rect x="204" y="86" width="34" height="28" fill="#fff" stroke="#ccc"/><path d="M209 94 h24 M209 100 h20 M209 106 h22" stroke="#999" stroke-width="1.2"/><rect x="190" y="110" width="66" height="22" rx="6" fill="#3d3d3d"/><rect x="196" y="106" width="54" height="7" rx="3.5" fill="#222"/><g fill="#ddd"><circle cx="202" cy="122" r="2.4"/><circle cx="212" cy="122" r="2.4"/><circle cx="222" cy="122" r="2.4"/><circle cx="232" cy="122" r="2.4"/><circle cx="242" cy="122" r="2.4"/></g>',
      head: `<circle cx="104" cy="64" r="22" fill="#e0b08a"/><path d="M82 62 a22 24 0 0 1 44 0 v-4 h-44Z" fill="#6c757d"/><rect x="80" y="54" width="48" height="8" rx="4" fill="#5a6169"/>${eyes(66)}<path d="M96 62 h10 M110 62 h8" stroke="#7a5a44" stroke-width="1.4"/>
        <path d="M84 70 q2 22 20 24 q18 -2 22 -24 q-8 8 -22 8 q-12 0 -20 -8Z" fill="#8d7b6a"/><circle cx="108" cy="72" r="3" fill="#d98c6f"/><rect x="92" y="112" width="12" height="10" fill="#a0784a" stroke="#5a4a2a" stroke-dasharray="2 2"/>`,
      back: '<g transform="rotate(-8 44 140)"><rect x="16" y="120" width="56" height="40" fill="#d8b27a"/><text x="44" y="134" font-size="8" text-anchor="middle" fill="#5a4a2a" font-family="monospace" font-weight="700">TIPEO</text><text x="44" y="144" font-size="8" text-anchor="middle" fill="#5a4a2a" font-family="monospace" font-weight="700">POR</text><text x="44" y="154" font-size="8" text-anchor="middle" fill="#5a4a2a" font-family="monospace" font-weight="700">MONEDAS</text></g>',
      front: '<rect x="290" y="160" width="14" height="16" rx="2" fill="#aab"/><circle cx="297" cy="160" r="3.5" fill="#f0b340"/>' }),
    // Intelectual
    () => typist({ tap: .22, skin: '#eac19b', sleeve: '#222', torso: '#222', pants: '#5a4a3a', words: ['ergo', '∴'],
      head: `<circle cx="104" cy="64" r="22" fill="#eac19b"/><path d="M82 60 q4 -22 26 -20 q16 2 18 18 q-12 -8 -44 2Z" fill="#3b2a1e"/><circle cx="101" cy="64" r="6" fill="none" stroke="#222" stroke-width="2"/><circle cx="116" cy="64" r="6" fill="none" stroke="#222" stroke-width="2"/><path d="M107 64 h3" stroke="#222" stroke-width="2"/>
        <circle cx="101" cy="64" r="1.8" fill="#222"/><circle cx="116" cy="64" r="1.8" fill="#222"/><path d="M104 80 q6 10 12 0Z" fill="#3b2a1e"/><path d="M86 96 q18 -6 38 0 v6 q-20 -6 -38 0Z" fill="#111"/>`,
      front: '<rect x="162" y="118" width="20" height="5" fill="#e76f51"/><rect x="164" y="113" width="17" height="5" fill="#2a9d8f"/><rect x="161" y="123" width="22" height="9" fill="#264653"/><rect x="268" y="118" width="12" height="14" rx="2" fill="#fff" stroke="#999"/><path d="M280 122 q5 0 5 4 q0 4 -5 4" stroke="#999" fill="none"/><path class="steam" d="M272 114 q-3 -5 0 -9 M277 114 q-3 -5 0 -9" stroke="#bbb" fill="none"/>' }),
    // Premio Nobel
    () => typist({ tap: .16, skin: '#efc9a6', sleeve: '#2f3b52', torso: '#2f3b52', pants: '#2f3b52', words: ['E=mc²', '∫'], chair: '<rect x="64" y="96" width="14" height="62" rx="6" fill="#7a2e2e"/><rect x="66" y="150" width="68" height="10" rx="4" fill="#7a2e2e"/><rect x="96" y="160" width="7" height="16" fill="#4a1c1c"/>',
      head: `<g fill="#f2f2f2"><circle cx="84" cy="54" r="9"/><circle cx="92" cy="42" r="9"/><circle cx="106" cy="38" r="9"/><circle cx="120" cy="44" r="9"/><circle cx="80" cy="68" r="7"/></g><circle cx="104" cy="64" r="22" fill="#efc9a6"/><circle cx="101" cy="63" r="6" fill="none" stroke="#b08d57" stroke-width="1.6"/><circle cx="116" cy="63" r="6" fill="none" stroke="#b08d57" stroke-width="1.6"/>
        <circle cx="101" cy="63" r="1.8" fill="#222"/><circle cx="116" cy="63" r="1.8" fill="#222"/><path d="M100 76 q9 -5 18 0 q-9 3 -18 0Z" fill="#f2f2f2"/><path d="M96 98 L104 116 L112 98Z" fill="#fff"/><path d="M98 100 l6 3 6 -3 v6 l-6 -3 -6 3Z" fill="#c1121f"/>
        <path d="M100 116 L96 126 M108 116 L112 126" stroke="#2a6f97" stroke-width="3"/><circle cx="104" cy="130" r="7" fill="#f0b340" stroke="#c98a10" stroke-width="1.5"/>`,
      front: '<path d="M170 132 h16 l-3 -6 h-10Z" fill="#c98a10"/><path d="M172 126 q-6 -12 6 -16 q12 4 6 16Z" fill="#f0b340"/>',
      back: '<path d="M30 40 q-10 20 4 36 M42 34 q-14 24 2 44" stroke="#8fb277" stroke-width="3" fill="none"/>' }),
    // Alien
    () => typist({ tap: .09, skin: '#7bd88f', sleeve: '#5a4fcf', torso: '#5a4fcf', pants: '#5a4fcf', words: ['⍟', '⌬', '∆'],
      desk: '<ellipse cx="226" cy="140" rx="54" ry="6" fill="#7df9ff" opacity=".35"/>',
      device: '<path d="M180 132 H270 L262 124 H188Z" fill="#7df9ff" opacity=".55"/><rect x="238" y="74" width="54" height="36" rx="4" fill="#7df9ff" opacity=".35" stroke="#7df9ff"/><path d="M246 84 h36 M246 92 h28 M246 100 h32" stroke="#e0ffff" stroke-width="1.6"/>',
      chair: '<ellipse cx="102" cy="156" rx="34" ry="7" fill="#9aa3ad"/><path d="M84 162 L102 176 L120 162" fill="#7df9ff" opacity=".4"/>',
      extraArms: arm('tb', '114 116', '150 140', '246 130', '#5a4fcf', '#7bd88f') + arm('ta', '118 114', '150 132', '186 130', '#5a4fcf', '#7bd88f'),
      head: `<path d="M96 40 L88 22 M112 40 L120 22" stroke="#7bd88f" stroke-width="2.5"/><circle cx="88" cy="20" r="3.5" fill="#f72585"/><circle cx="120" cy="20" r="3.5" fill="#f72585"/><ellipse cx="104" cy="60" rx="26" ry="28" fill="#7bd88f"/>
        <ellipse cx="96" cy="62" rx="6" ry="9" fill="#111" transform="rotate(-20 96 62)"/><ellipse cx="114" cy="62" rx="6" ry="9" fill="#111" transform="rotate(20 114 62)"/><path d="M100 78 q4 3 8 0" stroke="#2d6a4f" stroke-width="1.6" fill="none"/>`,
      back: '<ellipse cx="46" cy="36" rx="30" ry="9" fill="#9aa3ad"/><ellipse cx="46" cy="30" rx="13" ry="9" fill="#7df9ff" opacity=".7"/><path d="M34 44 L18 110 H74 L58 44Z" fill="#7df9ff" opacity=".15"/><circle cx="150" cy="24" r="1.4" fill="#adb5bd"/><circle cx="200" cy="40" r="1" fill="#adb5bd"/>' }),
  ];
  const typistArt = i => TYPISTS[i]();
  return { PARTS, THEMES, build, typist: typistArt };
})();
