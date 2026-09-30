// Abstract-figure puzzles like the ones in job-interview aptitude tests (inductive / abstract reasoning).
// Three kinds: "serie" (which figure comes next), "matriz" (complete the 3×3 grid) and "distinta" (odd one out).
// Difficulty 1–5 sets how many rules change at once and how subtle they are. Everything is generated at random
// and drawn in SVG; each puzzle has exactly one right answer and an explanation of its rule.
window.Figures = (() => {
  const rnd = n => Math.floor(Math.random() * n);
  const pick = a => a[rnd(a.length)];
  const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const mod = (a, n) => ((a % n) + n) % n;

  /* ---------- A tile: copies of one shape (shape, fill, count, rotation) and an optional dot on the border ---------- */
  const SYMMETRIC = ['circle', 'square', 'triangle', 'star', 'hexagon', 'diamond'];
  const TURNING = ['arrow', 'pacman']; // shapes whose rotation is visible over the full 360°
  const SIDES = { triangle: 3, square: 4, pentagon: 5, hexagon: 6 };
  const FILLS = ['white', 'black', 'grey', 'stripes'];
  const SHAPE_NAME = { circle: 'círculo', square: 'cuadrado', triangle: 'triángulo', star: 'estrella', hexagon: 'hexágono', diamond: 'rombo', pentagon: 'pentágono', arrow: 'flecha', pacman: 'comecocos' };
  const FILL_NAME = { white: 'blanco', black: 'negro', grey: 'gris', stripes: 'rayado' };
  const DOTS = [[14, 14], [50, 11], [86, 14], [89, 50], [86, 86], [50, 89], [14, 86], [11, 50]]; // clockwise from top-left
  const LAYOUT = {
    1: [[50, 50]], 2: [[35, 50], [65, 50]], 3: [[50, 33], [34, 64], [66, 64]], 4: [[35, 35], [65, 35], [35, 65], [65, 65]],
    5: [[35, 35], [65, 35], [50, 50], [35, 65], [65, 65]], 6: [[33, 36], [50, 36], [67, 36], [33, 64], [50, 64], [67, 64]],
  };
  const SIZE = { 1: 21, 2: 13, 3: 12, 4: 11, 5: 10, 6: 8.5 };
  const key = t => [t.shape, t.fill, t.count, t.rot, t.pos].join('|');
  const tile = (o = {}) => ({ shape: 'circle', fill: 'white', count: 1, rot: 0, pos: -1, ...o });

  const poly = (n, r, start = -90) => Array.from({ length: n }, (_, i) => { const a = (start + i * 360 / n) * Math.PI / 180; return `${(r * Math.cos(a)).toFixed(1)},${(r * Math.sin(a)).toFixed(1)}`; }).join(' ');
  function shapePath(shape, r) {
    switch (shape) {
      case 'circle': return `<circle r="${r}"/>`;
      case 'square': return `<rect x="${-r * .85}" y="${-r * .85}" width="${r * 1.7}" height="${r * 1.7}"/>`;
      case 'diamond': return `<polygon points="${poly(4, r)}"/>`;
      case 'triangle': return `<polygon points="${poly(3, r * 1.1, -90)}" transform="translate(0,${r * .18})"/>`;
      case 'pentagon': return `<polygon points="${poly(5, r)}"/>`;
      case 'hexagon': return `<polygon points="${poly(6, r, 0)}"/>`;
      case 'star': return `<polygon points="${Array.from({ length: 10 }, (_, i) => { const a = (-90 + i * 36) * Math.PI / 180, rr = i % 2 ? r * .45 : r; return `${(rr * Math.cos(a)).toFixed(1)},${(rr * Math.sin(a)).toFixed(1)}`; }).join(' ')}"/>`;
      case 'arrow': return `<polygon points="0,${-r} ${r * .8},${-r * .1} ${r * .3},${-r * .1} ${r * .3},${r} ${-r * .3},${r} ${-r * .3},${-r * .1} ${-r * .8},${-r * .1}"/>`;
      case 'pacman': { const a = 35 * Math.PI / 180, x = (r * Math.sin(a)).toFixed(1), y = (-r * Math.cos(a)).toFixed(1); return `<path d="M0 0 L${-x} ${y} A${r} ${r} 0 1 0 ${x} ${y}Z"/>`; }
    }
    return '';
  }
  let uid = 0;
  function draw(t, cls = 'fig') {
    const id = 'hatch' + (++uid);
    const fill = { white: 'var(--card,#fff)', black: 'currentColor', grey: '#9aa5b1', stripes: `url(#${id})` }[t.fill];
    const r = SIZE[t.count];
    const items = LAYOUT[t.count].map(([x, y]) => `<g transform="translate(${x} ${y}) rotate(${t.rot})" fill="${fill}" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round">${shapePath(t.shape, r)}</g>`).join('');
    const dot = t.pos >= 0 ? `<circle cx="${DOTS[t.pos][0]}" cy="${DOTS[t.pos][1]}" r="5" fill="currentColor"/>` : '';
    const defs = t.fill === 'stripes' ? `<defs><pattern id="${id}" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="var(--card,#fff)"/><rect width="2.2" height="5" fill="currentColor"/></pattern></defs>` : '';
    return `<svg viewBox="0 0 100 100" class="${cls}" aria-hidden="true" focusable="false">${defs}<rect x="2" y="2" width="96" height="96" rx="10" fill="var(--card,#fff)" stroke="var(--line,#ccc)" stroke-width="2"/>${items}${dot}</svg>`;
  }

  /* ---------- Rules that change one attribute step by step ---------- */
  const ROT_TXT = { 45: 'gira 45° en sentido horario', 90: 'gira 90° en sentido horario', '-90': 'gira 90° en sentido antihorario', 135: 'gira 135° en sentido horario', 180: 'da media vuelta' };
  const POS_TXT = { 1: 'avanza un lugar en sentido horario', 2: 'avanza dos lugares en sentido horario', 3: 'avanza tres lugares en sentido horario', '-1': 'retrocede un lugar (sentido antihorario)' };
  function makeRule(attr, d, base) {
    switch (attr) {
      case 'rot': { const step = d <= 2 ? pick([90, -90]) : pick([45, 90, -90, 135]); return { attr, at: i => mod(base.rot + step * i, 360), txt: `${base.shape === 'pacman' ? 'el' : 'la'} ${SHAPE_NAME[base.shape]} ${ROT_TXT[step]}` }; }
      case 'pos': { const step = d <= 2 ? pick([1, 2]) : pick([1, 2, 3, -1]); return { attr, at: i => mod(base.pos + step * i, 8), txt: `el punto ${POS_TXT[step]}` }; }
      case 'count': { const up = Math.random() < .5; return { attr, at: i => up ? 1 + i : 6 - i, txt: up ? 'se suma una figura en cada paso' : 'se quita una figura en cada paso' }; }
      case 'fill': {
        const cycle = d <= 2 ? shuffle(['white', 'black']) : shuffle(FILLS).slice(0, 3);
        return { attr, at: i => cycle[i % cycle.length], txt: `el relleno se repite: ${cycle.map(f => FILL_NAME[f]).join(', ')}` };
      }
      case 'shape': { const cycle = shuffle(SYMMETRIC).slice(0, 3); return { attr, at: i => cycle[i % 3], txt: `la forma se repite: ${cycle.map(s => SHAPE_NAME[s]).join(', ')}` }; }
    }
  }
  // Alternative values for an attribute, used for the wrong options.
  function others(attr, value, t) {
    switch (attr) {
      case 'rot': return [45, 90, 135, 180, 225, 270, 315, 0].map(v => mod(value + v, 360));
      case 'pos': return [1, 2, 4, 6, 7].map(v => mod(value + v, 8));
      case 'count': return [value - 1, value + 1, value - 2, value + 2].filter(v => v >= 1 && v <= 6);
      case 'fill': return FILLS.filter(f => f !== value);
      case 'shape': return (TURNING.includes(t.shape) ? TURNING : SYMMETRIC).filter(s => s !== value);
    }
    return [];
  }
  function distractors(correct, attrs, n) {
    const seen = new Set([key(correct)]), out = [];
    const tries = shuffle(attrs.flatMap(a => others(a, correct[a], correct).map(v => ({ [a]: v }))));
    // First change a single attribute that the rule controls, then two at once, then anything else.
    for (const ch of tries) { const t = { ...correct, ...ch }; if (!seen.has(key(t))) { seen.add(key(t)); out.push(t); } if (out.length >= n) return out; }
    for (let k = 0; out.length < n && k < 200; k++) {
      const a = pick(['fill', 'count', 'pos', 'rot'].filter(x => x !== 'pos' || correct.pos >= 0).filter(x => x !== 'rot' || TURNING.includes(correct.shape)));
      const t = { ...correct, [a]: pick(others(a, correct[a], correct)) };
      if (!seen.has(key(t))) { seen.add(key(t)); out.push(t); }
    }
    return out;
  }
  function choices(correct, attrs, n) {
    const opts = shuffle([correct, ...distractors(correct, attrs, n - 1)]);
    return { options: opts, answer: opts.indexOf(correct) };
  }
  const sentence = rules => { const t = rules.map(r => r.txt); const s = t.length > 1 ? t.slice(0, -1).join(', ') + ' y ' + t[t.length - 1] : t[0]; return s[0].toUpperCase() + s.slice(1) + '.'; };

  /* ---------- Series: which figure comes next ---------- */
  const RULES_BY_D = { 1: 1, 2: 1, 3: 2, 4: 2, 5: 3 };
  function serie(d) {
    const n = RULES_BY_D[d];
    let attrs = shuffle(['rot', 'pos', 'count', 'fill', 'shape']).slice(0, n);
    if (attrs.includes('rot') && attrs.includes('shape')) attrs = attrs.map(a => a === 'shape' ? 'fill' : a);
    if (attrs.includes('rot') && attrs.includes('count')) attrs = attrs.map(a => a === 'count' ? 'pos' : a);
    attrs = [...new Set(attrs)];
    const base = tile({ shape: attrs.includes('rot') ? pick(TURNING) : pick(SYMMETRIC), fill: pick(FILLS), count: attrs.includes('rot') ? 1 : 1 + rnd(3), rot: attrs.includes('rot') ? pick([0, 90, 180, 270]) : 0, pos: attrs.includes('pos') || d >= 4 ? rnd(8) : -1 });
    const rules = attrs.map(a => makeRule(a, d, base));
    const at = i => { const t = { ...base }; for (const r of rules) t[r.attr] = r.at(i); return t; };
    const seq = [0, 1, 2, 3, 4].map(at);
    return { kind: 'serie', prompt: '¿Qué figura sigue en la serie?', seq, ...choices(at(5), attrs, d <= 2 ? 4 : 5), explain: sentence(rules) };
  }

  /* ---------- Matrices: complete the 3×3 grid ---------- */
  function matriz(d) {
    const nAttrs = { 1: 1, 2: 2, 3: 2, 4: 3, 5: 3 }[d], latinCount = { 1: 0, 2: 0, 3: 1, 4: 1, 5: 2 }[d];
    let attrs = shuffle(['shape', 'fill', 'count', 'pos', 'rot']).slice(0, nAttrs);
    if (attrs.includes('rot') && attrs.includes('shape')) attrs = attrs.filter(a => a !== 'shape');
    if (attrs.includes('rot') && attrs.includes('count')) attrs = attrs.filter(a => a !== 'count');
    if (!attrs.length) attrs = ['fill'];
    const base = tile({ shape: attrs.includes('rot') ? pick(TURNING) : pick(SYMMETRIC), fill: pick(FILLS), count: 1 + rnd(2), pos: attrs.includes('pos') ? 0 : -1 });
    const modes = shuffle(attrs.map((a, i) => i < latinCount ? 'latin' : null)).map((m, i) => m || (i % 2 ? 'col' : 'row'));
    const rules = attrs.map((attr, i) => {
      const mode = modes[i];
      const vals = attr === 'shape' ? shuffle(SYMMETRIC).slice(0, 3) : attr === 'fill' ? shuffle(FILLS).slice(0, 3)
        : attr === 'count' ? (b => [b, b + 1, b + 2])(1 + rnd(3)) : attr === 'rot' ? (b => [b, b + 90, b + 180].map(v => v % 360))(pick([0, 90, 180, 270]))
        : shuffle([0, 1, 2, 3, 4, 5, 6, 7]).slice(0, 3);
      const idx = (r, c) => mode === 'row' ? r : mode === 'col' ? c : (r + c) % 3;
      const what = { shape: 'la forma', fill: 'el relleno', count: 'la cantidad de figuras', rot: 'la orientación', pos: 'la posición del punto' }[attr];
      const txt = mode === 'latin' ? `${what} aparece una vez en cada fila y en cada columna` : `${what} cambia de ${mode === 'row' ? 'fila' : 'columna'} en ${mode === 'row' ? 'fila' : 'columna'} y se mantiene ${mode === 'row' ? 'en la fila' : 'en la columna'}`;
      return { attr, at: (r, c) => vals[idx(r, c)], txt };
    });
    const at = (r, c) => { const t = { ...base }; for (const ru of rules) t[ru.attr] = ru.at(r, c); return t; };
    const grid = [0, 1, 2].flatMap(r => [0, 1, 2].map(c => at(r, c))).slice(0, 8);
    return { kind: 'matriz', prompt: '¿Qué figura completa la matriz?', grid, ...choices(at(2, 2), attrs, d <= 2 ? 4 : 5), explain: sentence(rules) };
  }

  /* ---------- Odd one out ---------- */
  // Attributes outside the rule must not look like a rule themselves: no attribute where four tiles match and one differs.
  const noFalseRule = (tiles, attrs) => attrs.every(a => { const c = {}; tiles.forEach(t => { const v = a === 'parity' ? t.count % 2 : t[a]; c[v] = (c[v] || 0) + 1; }); return !Object.values(c).includes(4); });
  const ANGLE_OF_DOT = p => mod(p * 45 - 45, 360); // arrow rotation that points from the center to dot p
  function distinta(d) {
    for (let tries = 0; tries < 500; tries++) {
      const odd = rnd(5);
      let tiles, free, explain;
      const variant = d === 1 ? 'shape' : d === 2 ? 'fill' : d === 3 ? 'parity' : d === 4 ? pick(['sides', 'parity']) : pick(['points', 'sides']);
      if (variant === 'shape') {
        const s = pick(SYMMETRIC), other = pick(SYMMETRIC.filter(x => x !== s));
        tiles = [0, 1, 2, 3, 4].map(i => tile({ shape: i === odd ? other : s, fill: pick(FILLS), count: 1 + rnd(4) }));
        free = ['fill', 'count']; explain = `Todas son ${SHAPE_NAME[s]}s menos una.`;
      } else if (variant === 'fill') {
        const f = pick(FILLS), other = pick(FILLS.filter(x => x !== f));
        tiles = [0, 1, 2, 3, 4].map(i => tile({ shape: pick(SYMMETRIC), fill: i === odd ? other : f, count: 1 + rnd(4) }));
        free = ['shape', 'count']; explain = `Todas tienen relleno ${FILL_NAME[f]} menos una.`;
      } else if (variant === 'parity') {
        const even = Math.random() < .5, good = even ? [2, 4, 6] : [1, 3, 5], bad = even ? [1, 3, 5] : [2, 4, 6];
        tiles = [0, 1, 2, 3, 4].map(i => tile({ shape: pick(SYMMETRIC), fill: pick(FILLS), count: pick(i === odd ? bad : good), pos: d >= 4 ? rnd(8) : -1 }));
        free = ['shape', 'fill', 'pos']; explain = `Todas tienen una cantidad ${even ? 'par' : 'impar'} de figuras menos una.`;
      } else if (variant === 'sides') {
        const shapes = Object.keys(SIDES);
        tiles = [0, 1, 2, 3, 4].map(i => { const s = pick(shapes), n = SIDES[s]; return tile({ shape: s, fill: pick(FILLS), count: i === odd ? pick([n - 1, n + 1].filter(v => v >= 1 && v <= 6)) : n }); });
        free = ['shape', 'fill']; explain = 'En todas la cantidad de figuras es igual a la cantidad de lados de cada figura, menos en una.';
      } else {
        tiles = [0, 1, 2, 3, 4].map(i => { const p = rnd(8); return tile({ shape: 'arrow', fill: pick(FILLS), count: 1, pos: p, rot: mod(ANGLE_OF_DOT(p) + (i === odd ? pick([90, 180, 270]) : 0), 360) }); });
        free = ['fill', 'rot', 'pos']; explain = 'Todas las flechas apuntan al punto menos una.';
      }
      if (variant !== 'parity') free.push('parity'); // an even/odd count must not single out another figure
      if (new Set(tiles.map(key)).size < 5 || !noFalseRule(tiles, free)) continue;
      return { kind: 'distinta', prompt: '¿Cuál figura es distinta a las demás?', options: tiles, answer: odd, explain };
    }
    return distinta(Math.max(1, d - 1));
  }

  const make = { serie, matriz, distinta };
  return { make, draw, KINDS: Object.keys(make) };
})();
