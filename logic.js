// Logical reasoning puzzles like the "lógica" part of the aptitude tests that companies use to screen candidates.
// Three kinds: "sucesion" (which number comes next), "deduccion" (put people in order from clues; deductive reasoning)
// and "silogismo" (two premises: is the statement true, false, or can't you tell?). Difficulty 1–5.
// Everything is generated at random and checked by brute force, so each puzzle has exactly one right answer:
// the order puzzles try every possible order, and the syllogisms every possible Venn diagram.
globalThis.Logic = (() => {
  const rnd = n => Math.floor(Math.random() * n);
  const pick = a => a[rnd(a.length)];
  const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const num = v => v.toLocaleString('es-AR');

  /* ---------- Number series ---------- */
  // Each rule: terms (6 or more, the last one is the answer), the explanation, and wrong answers from typical mistakes.
  const RULES = {
    1: [
      () => { const a = 2 + rnd(20), k = 2 + rnd(8); return { t: Array.from({ length: 6 }, (_, i) => a + k * i), why: `Se suma ${k} cada vez.`, bad: t => [t.at(-2) + k + 1, t.at(-2) + k - 1, t.at(-2) + 2 * k] }; },
      () => { const a = 60 + rnd(40), k = 2 + rnd(7); return { t: Array.from({ length: 6 }, (_, i) => a - k * i), why: `Se resta ${k} cada vez.`, bad: t => [t.at(-2) - k + 1, t.at(-2) + k, t.at(-2) - 2 * k] }; },
      () => { const a = 1 + rnd(5); return { t: Array.from({ length: 6 }, (_, i) => a * 2 ** i), why: 'Cada número es el doble del anterior.', bad: t => [t.at(-2) + t.at(-3), t.at(-2) * 2 + 2, t.at(-2) * 3] }; },
    ],
    2: [
      () => { const a = 1 + rnd(3), r = 3; return { t: Array.from({ length: 6 }, (_, i) => a * r ** i), why: 'Cada número es el triple del anterior.', bad: t => [t.at(-2) * 2, t.at(-2) + t.at(-3) * 2, t.at(-2) * 3 + 3] }; },
      () => { const s = 1 + rnd(4); return { t: Array.from({ length: 6 }, (_, i) => (s + i) ** 2), why: `Son los cuadrados de ${s}, ${s + 1}, ${s + 2}…: ${s}², ${s + 1}², ${s + 2}²…`, bad: t => [t.at(-2) + (t.at(-2) - t.at(-3)), t.at(-2) * 2, (s + 5) * (s + 4)] }; },
      () => { const a = 3 + rnd(10), k = 2 + rnd(3); return { t: Array.from({ length: 6 }, (_, i) => a + k * i * (i + 1) / 2), why: `Las diferencias crecen de a ${k}: +${k}, +${2 * k}, +${3 * k}…`, bad: t => [t.at(-2) + (t.at(-2) - t.at(-3)), t.at(-2) + 6 * k, t.at(-2) + 4 * k] }; },
    ],
    3: [
      () => { const a = 2 + rnd(6), x = 2 + rnd(5), y = 2 + rnd(5); const t = [a]; for (let i = 1; i < 7; i++) t.push(i % 2 ? t[i - 1] + x : t[i - 1] - y); return { t, why: `Se alterna: +${x}, −${y}, +${x}, −${y}…`, bad: t => [t.at(-2) + x, t.at(-2) - y - 1, t.at(-2) + x - y] }; },
      () => { const a = 1 + rnd(4), b = 20 + rnd(20), k = 2 + rnd(4), m = 2 + rnd(3); const t = []; for (let i = 0; i < 7; i++) t.push(i % 2 ? b - m * ((i - 1) / 2) : a + k * (i / 2)); return { t, why: `Son dos series intercaladas: en las posiciones impares se suma ${k} (${t[0]}, ${t[2]}, ${t[4]}…) y en las pares se resta ${m} (${t[1]}, ${t[3]}, ${t[5]}…).`, bad: t => [t.at(-2) + k, t.at(-3) - m, t.at(-2) - m] }; },
      () => { const a = 1 + rnd(4); const t = [a]; for (let i = 1; i < 6; i++) t.push(t[i - 1] * 2 + 1); return { t, why: 'Cada número es el doble del anterior más 1 (×2 + 1).', bad: t => [t.at(-2) * 2, t.at(-2) * 2 + 2, t.at(-2) + t.at(-3)] }; },
    ],
    4: [
      () => { const a = 1 + rnd(3), b = 1 + rnd(4); const t = [a, b]; for (let i = 2; i < 7; i++) t.push(t[i - 1] + t[i - 2]); return { t, why: 'Cada número es la suma de los dos anteriores.', bad: t => [t.at(-2) * 2, t.at(-2) + t.at(-3) + 1, t.at(-2) + (t.at(-2) - t.at(-3)) * 2] }; },
      () => { const a = 2 + rnd(5), k = 2 + rnd(2); const t = [a]; let d = 1; for (let i = 1; i < 6; i++) { t.push(t[i - 1] + d); d *= k; } return { t, why: `Las diferencias se multiplican por ${k}: +1, +${k}, +${k * k}, +${k ** 3}…`, bad: t => [t.at(-2) + k ** 3 * 2, t.at(-2) + k ** 4 + 1, t.at(-2) * k] }; },
      () => { const s = 1 + rnd(3); return { t: Array.from({ length: 6 }, (_, i) => (s + i) ** 2 + 1), why: `Son los cuadrados más 1: ${s}² + 1, ${s + 1}² + 1, ${s + 2}² + 1…`, bad: t => [(s + 5) ** 2, (s + 5) ** 2 + 2, t.at(-2) + 2 * (s + 4)] }; },
    ],
    5: [
      () => { const a = 2 + rnd(4), k = 2 + rnd(3); const t = [a]; for (let i = 1; i < 7; i++) t.push(i % 2 ? t[i - 1] * 2 : t[i - 1] + k); return { t, why: `Se alterna: ×2, +${k}, ×2, +${k}…`, bad: t => [t.at(-2) * 2, t.at(-2) + k + 1, t.at(-2) + k * 2] }; },
      () => { const s = 1 + rnd(2); return { t: Array.from({ length: 6 }, (_, i) => (s + i) ** 3), why: `Son los cubos de ${s}, ${s + 1}, ${s + 2}…: ${s}³, ${s + 1}³, ${s + 2}³…`, bad: t => [(s + 5) ** 2 * (s + 4), t.at(-2) + (t.at(-2) - t.at(-3)), (s + 5) ** 3 + 1] }; },
      () => { const a = 2 + rnd(5), k = 1 + rnd(3); const t = [a]; for (let i = 1; i < 6; i++) t.push(t[i - 1] * (i + 1) - k); return { t, why: `Se multiplica por 2, 3, 4, 5… y se resta ${k} cada vez.`, bad: t => [t.at(-2) * 6, t.at(-2) * 5 - k, t.at(-2) * 6 + k] }; },
      () => { const P = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37], s = rnd(5); return { t: P.slice(s, s + 6), why: 'Son los números primos seguidos (solo se dividen por 1 y por sí mismos).', bad: t => [t.at(-2) + 2, t.at(-2) + 4 === t.at(-1) ? t.at(-2) + 6 : t.at(-2) + 4, t.at(-2) + (t.at(-2) - t.at(-3))] }; },
    ],
  };
  const SERIES_TIP = 'Mirá primero las diferencias entre números seguidos. Si no hay patrón, probá multiplicar, mirar las posiciones pares e impares por separado o las diferencias de las diferencias.';
  function sucesion(d) {
    for (;;) {
      const { t, why, bad } = pick(RULES[d])(), shown = t.slice(0, -1), ans = t.at(-1);
      const wrong = [...new Set(bad(t).filter(v => Number.isInteger(v) && v !== ans && v >= 0))];
      if (wrong.length < 3 || shown.some(v => !Number.isInteger(v))) continue;
      const options = shuffle([ans, ...wrong.slice(0, 3)]);
      return { kind: 'sucesion', prompt: '¿Qué número sigue?', stimulus: `<div class="q-series">${shown.map(num).join('<span>,</span> ')}<span>,</span> <b>?</b></div>`, options: options.map(num), answer: options.indexOf(ans),
        explain: `${why} El que sigue es ${num(ans)}.`, tip: SERIES_TIP };
    }
  }

  /* ---------- Order puzzles (deductive reasoning) ---------- */
  const NAMES = ['Ana', 'Bruno', 'Carla', 'Diego', 'Eva', 'Facu', 'Gise', 'Hernán', 'Inés', 'Juli', 'Lara', 'Mati'];
  const THEMES = [
    { intro: 'Cinco compañeros llegaron a la oficina a distintas horas.', before: (a, b) => `${a} llegó antes que ${b}.`, after: (a, b) => `${a} llegó después que ${b}.`,
      pos: (p, n) => ['primero', 'segundo', 'tercero', 'cuarto', 'quinto'][p], ask: p => `¿Quién llegó ${p}?`, rel: (a, b) => `${a} llegó antes que ${b}`, first: 'llegó primero', last: 'llegó último' },
    { intro: 'En un concurso, nadie empató en puntaje.', before: (a, b) => `${a} sacó más puntos que ${b}.`, after: (a, b) => `${a} sacó menos puntos que ${b}.`,
      pos: (p, n) => `en ${['primer', 'segundo', 'tercer', 'cuarto', 'quinto'][p]} lugar`, ask: p => `¿Quién quedó ${p}?`, rel: (a, b) => `${a} sacó más puntos que ${b}`, first: 'ganó', last: 'quedó último' },
    { intro: 'Varios amigos comparan sus edades; no hay dos de la misma edad.', before: (a, b) => `${a} es mayor que ${b}.`, after: (a, b) => `${a} es menor que ${b}.`,
      pos: (p, n) => p === 0 ? 'el mayor' : p === n - 1 ? 'el menor' : p === 1 ? 'el segundo mayor' : p === n - 2 ? 'el segundo menor' : 'el del medio', ask: p => `¿Quién es ${p}?`, rel: (a, b) => `${a} es mayor que ${b}`, first: 'es el mayor', last: 'es el menor' },
  ];
  function perms(a) { if (a.length < 2) return [a]; return a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map(p => [x, ...p])); }
  const says = (fact, order) => order.indexOf(fact[0]) < order.indexOf(fact[1]); // fact = [a, b]: a goes before b
  const ORDER_TIP = 'Dibujá una línea y ubicá a cada persona a medida que leés las pistas. Si una pista dice "después", dala vuelta para que todas digan "antes": así ves la cadena completa.';
  function deduccion(d) {
    const n = d <= 2 ? 4 : 5, th = pick(THEMES), people = shuffle(NAMES).slice(0, n), truth = shuffle(people);
    const pairs = []; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) pairs.push([truth[i], truth[j]]);
    const all = perms(people);
    // Levels 1–3: the whole order is fixed. Its minimal set of clues is the n − 1 neighbours (they can't be deduced
    // from other clues); levels 2–3 add 1–2 redundant clues as noise. Levels 4–5: fewer clues, and the question is
    // what is certain, so some people stay unordered.
    for (;;) {
      let facts, fit;
      if (d <= 3) {
        const chain = truth.slice(1).map((b, i) => [truth[i], b]), far = shuffle(pairs.filter(f => !chain.some(c => c.join() === f.join())));
        facts = [...chain, ...far.slice(0, d - 1)]; fit = [truth];
      } else {
        facts = []; fit = all;
        for (const f of shuffle(pairs)) {
          if (fit.every(o => says(f, o))) continue; // already known: a wasted clue
          facts.push(f); fit = fit.filter(o => says(f, o));
          if (fit.length <= 4) break;
        }
        facts = facts.filter((f, i) => !all.filter(o => facts.every((g, j) => j === i || says(g, o))).every(o => says(f, o))); // drop clues the others imply
        if (fit.length < 2 || facts.length < n - 2) continue;
      }
      const text = facts.map(([a, b]) => Math.random() < (d === 1 ? .2 : .5) ? th.after(b, a) : th.before(a, b));
      const stimulus = `<div class="q-text"><p>${th.intro.replace('Cinco', n === 4 ? 'Cuatro' : 'Cinco')}</p><ul class="q-clues">${shuffle(text).map(t => `<li>${t}</li>`).join('')}</ul></div>`;
      if (d <= 3) {
        const p = d === 1 ? pick([0, n - 1]) : rnd(n), ans = truth[p];
        const options = shuffle([ans, ...shuffle(people.filter(x => x !== ans)).slice(0, 3)]);
        return { kind: 'deduccion', prompt: th.ask(th.pos(p, n)), stimulus, options, answer: options.indexOf(ans),
          explain: `Con todas las pistas, el orden es ${truth.join(' → ')}. ${ans} ${p === 0 ? th.first : p === n - 1 ? th.last : `está en el lugar ${p + 1}`}.`, tip: ORDER_TIP };
      }
      // What is certain: a relation true in every order that fits, not given as a clue; the other options are not certain.
      const given = new Set(facts.map(f => f.join()));
      const both = pairs.flatMap(([a, b]) => [[a, b], [b, a]]);
      const sure = both.filter(f => !given.has(f.join()) && fit.every(o => says(f, o)));
      const unsure = both.filter(f => fit.some(o => says(f, o)) && fit.some(o => !says(f, o)));
      if (!sure.length || unsure.length < 3) continue;
      const right = pick(sure), wrongs = shuffle(unsure).slice(0, 3);
      const options = shuffle([right, ...wrongs]).map(([a, b]) => cap(th.rel(a, b)) + '.'), ans = options.indexOf(cap(th.rel(...right)) + '.');
      return { kind: 'deduccion', prompt: '¿Cuál de estas afirmaciones es seguro que es verdadera?', stimulus, options, answer: ans,
        explain: `${cap(th.rel(...right))}: sale de encadenar las pistas. Las demás pueden ser verdaderas o no según cómo se ubiquen los que no tienen pista entre sí (hay ${fit.length} órdenes posibles).`, tip: ORDER_TIP };
    }
  }
  const cap = s => s[0].toUpperCase() + s.slice(1);

  /* ---------- Syllogisms: true, false or can't say ---------- */
  // Made-up words, as in real tests: what you know about the world can't help or mislead you.
  const WORDS = ['zorks', 'blips', 'trums', 'flins', 'grobs', 'plins', 'drates', 'mulfos', 'quines', 'sneps'];
  const sg = w => w.replace(/es$/, 'e').replace(/s$/, '');
  const PHRASE = {
    all: (x, y) => `Todos los ${x} son ${y}.`, no: (x, y) => `Ningún ${sg(x)} es ${sg(y)}.`,
    some: (x, y) => `Algunos ${x} son ${y}.`, somenot: (x, y) => `Algunos ${x} no son ${y}.`,
  };
  // A Venn diagram of three sets: 7 regions (a, b, c membership), each empty or not. 128 diagrams in all.
  const REGIONS = [1, 2, 3, 4, 5, 6, 7].map(r => [!!(r & 1), !!(r & 2), !!(r & 4)]);
  const MODELS = Array.from({ length: 128 }, (_, m) => REGIONS.filter((_, i) => m >> i & 1))
    .filter(full => [0, 1, 2].every(s => full.some(r => r[s]))); // every word names something
  const holds = ([type, x, y], full) => {
    const both = full.some(r => r[x] && r[y]), only = full.some(r => r[x] && !r[y]);
    return type === 'all' ? !only : type === 'no' ? !both : type === 'some' ? both : only;
  };
  const SYL_FORMS = { 1: [['all', 'all']], 2: [['all', 'no'], ['no', 'all'], ['all', 'all']], 3: [['all', 'some'], ['some', 'all'], ['no', 'some']], 4: [['somenot', 'all'], ['all', 'somenot'], ['some', 'no']], 5: [['some', 'some'], ['somenot', 'all'], ['no', 'all'], ['all', 'no'], ['some', 'all'], ['all', 'somenot']] };
  const SYL_OPTIONS = ['Verdadero', 'Falso', 'No se puede saber'];
  const SYL_TIP = 'Dibujá círculos para cada palabra. "Verdadero" solo si no hay ninguna forma de cumplir las premisas en la que la afirmación falle; si podés dibujar un caso que sí y otro que no, es "No se puede saber".';
  function silogismo(d) {
    const target = rnd(3); // keep the three answers about equally frequent
    for (let tries = 0; ; tries++) {
      const [f1, f2] = pick(SYL_FORMS[d]), [A, B, C] = shuffle(WORDS).slice(0, 3);
      const flip = () => d >= 3 && Math.random() < .5, p1 = flip() ? [f1, 1, 0] : [f1, 0, 1], p2 = flip() ? [f2, 2, 1] : [f2, 1, 2];
      const prem = [p1, p2], W = [A, B, C], fit = MODELS.filter(m => prem.every(p => holds(p, m)));
      if (!fit.length) continue;
      const type = pick(['all', 'no', 'some', 'somenot']), [x, y] = pick([[0, 2], [2, 0]]), st = [type, x, y];
      const yes = fit.filter(m => holds(st, m)).length, ans = yes === fit.length ? 0 : yes === 0 ? 1 : 2;
      if (ans !== target && tries < 60) continue;
      const statement = PHRASE[type](W[x], W[y]);
      const stimulus = `<div class="q-text"><ul class="q-clues">${prem.map(([t, a, b]) => `<li>${PHRASE[t](W[a], W[b])}</li>`).join('')}</ul><p class="q-claim">Afirmación: <b>${statement}</b></p></div>`;
      const explain = ans === 0 ? `Verdadero: en cualquier forma de cumplir las dos premisas, la afirmación "${statement}" se cumple.`
        : ans === 1 ? `Falso: si las dos premisas son ciertas, la afirmación "${statement}" no puede cumplirse.`
        : `No se puede saber: hay formas de cumplir las dos premisas en las que la afirmación se cumple y otras en las que no.`;
      return { kind: 'silogismo', prompt: 'Si las premisas son ciertas (y existe al menos uno de cada cosa), la afirmación es…', stimulus, options: SYL_OPTIONS, answer: ans, explain, tip: SYL_TIP };
    }
  }

  const GUIDE = {
    sucesion: [SERIES_TIP, 'Anotá las diferencias debajo de la serie: muchas veces el patrón está ahí y no en los números.', 'Si los números crecen muy rápido, es una multiplicación (o potencias: 1, 4, 9, 16…).', 'Antes de elegir, verificá la regla con todos los números, no solo con los últimos.'],
    deduccion: [ORDER_TIP, 'Empezá por los extremos: quién no tiene a nadie antes o después.', 'Cuando preguntan qué es seguro, desconfiá de lo que solo "podría" ser: tiene que valer para todos los órdenes posibles.', 'Las afirmaciones que repiten una pista son trampas fáciles: buscá la que sale de encadenar dos pistas.'],
    silogismo: [SYL_TIP, '"Algunos" significa "al menos uno": no dice nada de los demás.', '"Todos los A son B" no significa que todos los B sean A.', 'No uses lo que sabés del mundo: respondé solo con las premisas.'],
  };
  const make = Object.fromEntries(Object.entries({ sucesion, deduccion, silogismo }).map(([k, fn]) => [k, d => ({ ...fn(d), d, text: true })]));
  return { make, KINDS: Object.keys(make), GUIDE, holds, MODELS };
})();
