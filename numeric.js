// Numerical reasoning puzzles like the ones in job-interview aptitude tests: read a table or a chart and calculate.
// Three kinds: "tabla" (questions on a table), "grafico" (questions on a bar chart) and "porcentaje" (percentage problems).
// Difficulty 1–5 goes from reading and subtracting to projections and percentage points. Every puzzle brings a tip
// (the technique for that kind of question), the worked solution, and wrong options built from typical mistakes.
globalThis.Numeric = (() => {
  const rnd = n => Math.floor(Math.random() * n);
  const pick = a => a[rnd(a.length)];
  const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const num = (v, dec = 0) => v.toLocaleString('es-AR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  const r1 = v => Math.round(v * 10) / 10;

  /* ---------- Data: a small table of sales ---------- */
  const SETS = [
    { what: 'Ventas por región', unit: 'miles de US$', rows: ['Norte', 'Sur', 'Este', 'Oeste'], one: 'región' },
    { what: 'Ventas por producto', unit: 'miles de US$', rows: ['Café', 'Té', 'Jugos', 'Agua'], one: 'producto' },
    { what: 'Facturación por sucursal', unit: 'miles de US$', rows: ['Córdoba', 'Rosario', 'Mendoza', 'Salta'], one: 'sucursal' },
    { what: 'Ventas por canal', unit: 'miles de US$', rows: ['Tienda', 'Web', 'App', 'Mayoristas'], one: 'canal' },
  ];
  const PERIODS = [['2022', '2023', '2024'], ['1.º trim.', '2.º trim.', '3.º trim.']];
  function dataset() {
    const s = pick(SETS), cols = pick(PERIODS);
    // Distinct values, multiples of 5, so that "the most" and "the least" are never tied.
    for (;;) {
      const v = s.rows.map(() => { const base = 60 + rnd(50) * 5; return cols.map((_, j) => j ? 0 : base); });
      v.forEach(row => { for (let j = 1; j < cols.length; j++) row[j] = Math.max(20, Math.round(row[j - 1] * (0.75 + Math.random() * 0.6) / 5) * 5); });
      const flat = v.flat();
      if (new Set(flat).size === flat.length) return { ...s, cols, v };
    }
  }
  const total = (D, j) => D.v.reduce((a, row) => a + row[j], 0);
  function tableHtml(D, cols = D.cols.map((_, j) => j)) {
    return `<div class="q-data"><p class="q-cap">${D.what} <span>(en ${D.unit})</span></p><table class="q-table"><thead><tr><th>${cap(D.one)}</th>${cols.map(j => `<th>${D.cols[j]}</th>`).join('')}</tr></thead><tbody>${D.rows.map((r, i) => `<tr><th>${r}</th>${cols.map(j => `<td>${num(D.v[i][j])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  // Grouped bar chart for two periods, with the value on top of each bar (as in real tests).
  function chartHtml(D, a, b) {
    const W = 520, H = 230, max = Math.max(...D.v.map(r => Math.max(r[a], r[b]))), Y = v => H - 34 - v / max * (H - 70);
    const gw = (W - 40) / D.rows.length, bw = gw * 0.3;
    const bars = D.rows.map((name, i) => {
      const x = 30 + i * gw + gw * 0.18;
      return [a, b].map((j, k) => `<rect x="${x + k * (bw + 4)}" y="${Y(D.v[i][j])}" width="${bw}" height="${H - 34 - Y(D.v[i][j])}" class="bar b${k}"/><text x="${x + k * (bw + 4) + bw / 2}" y="${Y(D.v[i][j]) - 5}" class="bv">${num(D.v[i][j])}</text>`).join('')
        + `<text x="${x + bw + 2}" y="${H - 14}" class="bl">${name}</text>`;
    }).join('');
    return `<div class="q-data"><p class="q-cap">${D.what} <span>(en ${D.unit})</span></p><svg viewBox="0 0 ${W} ${H}" class="q-chart" role="img" aria-label="${D.what}"><line x1="20" x2="${W - 10}" y1="${H - 34}" y2="${H - 34}" class="axis"/>${bars}</svg><p class="q-legend"><i class="b0"></i>${D.cols[a]} <i class="b1"></i>${D.cols[b]}</p></div>`;
  }
  const cap = s => s[0].toUpperCase() + s.slice(1);

  /* ---------- Options: the right value plus typical mistakes ---------- */
  function numberOptions(correct, mistakes, fmt, n = 5) {
    const out = [fmt(correct)], seen = new Set(out);
    const far = v => Math.abs(v - correct) > 0.03 * Math.abs(correct); // never two options that round alike
    const add = v => { const f = fmt(v); if (Number.isFinite(v) && v >= 0 && far(v) && !seen.has(f) && out.length < n) { seen.add(f); out.push(f); } };
    mistakes.forEach(add);
    for (const k of [1.1, 0.9, 1.2, 0.8, 1.35, 0.7, 1.5, 0.6, 1.75, 0.5, 2, 0.4]) add(correct * k);
    const options = shuffle(out);
    return { options, answer: options.indexOf(fmt(correct)) };
  }
  function nameOptions(rows, correct) { const options = shuffle(rows); return { options, answer: options.indexOf(correct) }; }
  const money = v => `${num(v)} mil US$`;
  const pctf = v => `${num(r1(v), 1)}%`;
  const ppf = v => `${num(r1(v), 1)} p. p.`;

  /* ---------- Question templates on a dataset (D) and two periods (a < b) ---------- */
  const T = {
    diff(D, a, b) {
      const j = pick([a, b]), [i1, i2] = shuffle([0, 1, 2, 3]).slice(0, 2), hi = D.v[i1][j] > D.v[i2][j] ? i1 : i2, lo = hi === i1 ? i2 : i1;
      const ans = D.v[hi][j] - D.v[lo][j], other = j === a ? b : a;
      return { prompt: `¿Cuánto más vendió ${D.rows[hi]} que ${D.rows[lo]} en ${D.cols[j]}?`, ...numberOptions(ans, [D.v[hi][j] + D.v[lo][j], Math.abs(D.v[hi][other] - D.v[lo][other]), D.v[hi][j]], money),
        explain: `${num(D.v[hi][j])} − ${num(D.v[lo][j])} = ${num(ans)} mil US$.`,
        tip: 'Leé primero la pregunta y marcá en la tabla solo la fila y la columna que pide. La mitad de los errores es tomar el dato del período equivocado.' };
    },
    sum(D, a, b) {
      const i = rnd(4), ans = D.v[i][a] + D.v[i][b];
      return { prompt: `¿Cuánto vendió ${D.rows[i]} en total entre ${D.cols[a]} y ${D.cols[b]}?`, ...numberOptions(ans, [D.v[i][b] - D.v[i][a], D.v[i][a] + D.v[(i + 1) % 4][b], D.v[i][b] * 2], money),
        explain: `${num(D.v[i][a])} + ${num(D.v[i][b])} = ${num(ans)} mil US$.`,
        tip: 'Antes de calcular, estimá: redondeá los números y sumalos de cabeza. Si una opción está muy lejos de tu estimación, descartala.' };
    },
    max(D, a, b) {
      const j = pick([a, b]), i = D.v.map(r => r[j]).indexOf(Math.max(...D.v.map(r => r[j])));
      return { prompt: `¿Qué ${D.one} tuvo la mayor venta en ${D.cols[j]}?`, ...nameOptions(D.rows, D.rows[i]),
        explain: `En ${D.cols[j]}, ${D.rows[i]} tuvo ${num(D.v[i][j])} mil US$, el valor más alto de esa columna.`,
        tip: 'Recorré una sola columna de arriba abajo. No te dejes llevar por la fila que "en general" vende más: la pregunta es sobre un período.' };
    },
    pct(D, a, b) {
      const i = rnd(4), x = D.v[i][a], y = D.v[i][b], ans = (y - x) / x * 100;
      return { prompt: `¿En qué porcentaje cambiaron las ventas de ${D.rows[i]} entre ${D.cols[a]} y ${D.cols[b]}?${ans < 0 ? ' (negativo = bajaron)' : ''}`, ...numberOptions(Math.abs(ans), [Math.abs((y - x) / y * 100), y / x * 100, Math.abs(y - x)], v => (ans < 0 ? '−' : '+') + pctf(v)),
        explain: `(${num(y)} − ${num(x)}) ÷ ${num(x)} × 100 = ${ans < 0 ? '−' : '+'}${pctf(Math.abs(ans))}.`,
        tip: 'Variación porcentual = (nuevo − viejo) ÷ viejo × 100. El error más común es dividir por el valor nuevo: siempre se divide por el punto de partida.' };
    },
    avg(D, a, b) {
      const i = rnd(4), vals = D.cols.map((_, j) => D.v[i][j]), ans = vals.reduce((s, v) => s + v, 0) / vals.length;
      return { prompt: `¿Cuál fue la venta promedio de ${D.rows[i]} en los ${vals.length} períodos?`, ...numberOptions(ans, [vals.reduce((s, v) => s + v, 0), (vals[0] + vals[vals.length - 1]) / 2, ans * vals.length / (vals.length - 1)], v => `${num(r1(v), 1)} mil US$`),
        explain: `(${vals.map(v => num(v)).join(' + ')}) ÷ ${vals.length} = ${num(r1(ans), 1)} mil US$.`,
        tip: 'Promedio = suma ÷ cantidad de datos. Contá bien cuántos períodos hay: dividir por un número de menos es una trampa frecuente.' };
    },
    share(D, a, b) {
      const j = pick([a, b]), i = rnd(4), tot = D.v.reduce((s, r) => s + r[j], 0), ans = D.v[i][j] / tot * 100;
      const other = j === a ? b : a, totO = D.v.reduce((s, r) => s + r[other], 0);
      return { prompt: `¿Qué porcentaje del total de ${D.cols[j]} representa ${D.rows[i]}?`, ...numberOptions(ans, [D.v[i][j] / (tot - D.v[i][j]) * 100, D.v[i][j] / totO * 100, 25], pctf),
        explain: `Total de ${D.cols[j]}: ${num(tot)}. ${num(D.v[i][j])} ÷ ${num(tot)} × 100 = ${pctf(ans)}.`,
        tip: 'Porcentaje del total = parte ÷ total × 100. Calculá primero el total de la columna (y anotalo), así no lo sumás dos veces.' };
    },
    growth(D, a, b) {
      const g = D.v.map(r => (r[b] - r[a]) / r[a]), i = g.indexOf(Math.max(...g));
      const abs = D.v.map(r => r[b] - r[a]), iAbs = abs.indexOf(Math.max(...abs));
      return { prompt: `¿Qué ${D.one} tuvo el mayor crecimiento porcentual entre ${D.cols[a]} y ${D.cols[b]}?`, ...nameOptions(D.rows, D.rows[i]),
        explain: `${D.rows.map((r, k) => `${r}: ${g[k] >= 0 ? '+' : '−'}${pctf(Math.abs(g[k] * 100))}`).join(' · ')}. ${i === iAbs ? '' : `Ojo: ${D.rows[iAbs]} creció más en valor absoluto, pero no en porcentaje.`}`,
        tip: 'Crecimiento absoluto no es lo mismo que porcentual: una fila chica que sube poco en valor puede crecer más en porcentaje. Calculá el cociente nuevo ÷ viejo de cada fila y compará.' };
    },
    ratio(D, a, b) {
      const j = pick([a, b]), [i1, i2] = shuffle([0, 1, 2, 3]).slice(0, 2), ans = D.v[i1][j] / D.v[i2][j];
      return { prompt: `En ${D.cols[j]}, ¿cuál es la razón entre las ventas de ${D.rows[i1]} y las de ${D.rows[i2]} (${D.rows[i1]} ÷ ${D.rows[i2]})?`, ...numberOptions(ans, [D.v[i2][j] / D.v[i1][j], ans * 1.25, ans * 0.8], v => num(Math.round(v * 100) / 100, 2)),
        explain: `${num(D.v[i1][j])} ÷ ${num(D.v[i2][j])} = ${num(Math.round(ans * 100) / 100, 2)}.`,
        tip: 'En una razón "A ÷ B", el primero que se nombra va arriba. Si el resultado es mayor que 1, A es más grande que B: usalo para controlar.' };
    },
    convert(D, a, b) {
      const j = pick([a, b]), i = rnd(4), rate = pick([850, 950, 1050, 1200, 1350]), ans = D.v[i][j] * rate / 1000;
      return { prompt: `Si 1 US$ = ${num(rate)} pesos, ¿cuánto vendió ${D.rows[i]} en ${D.cols[j]}, en millones de pesos?`, ...numberOptions(ans, [ans * 1000, ans / 1000, D.v[i][j] / rate * 1000, ans * 10], v => `${num(r1(v), 1)} millones`),
        explain: `${num(D.v[i][j])} mil US$ × ${num(rate)} = ${num(D.v[i][j] * rate * 1000)} pesos = ${num(r1(ans), 1)} millones de pesos.`,
        tip: 'Antes de multiplicar, escribí las unidades: "miles de US$ × pesos por US$ = miles de pesos". Después pasá a millones dividiendo por 1.000. Las opciones-trampa suelen estar corridas por 1.000.' };
    },
    totalpct(D, a, b) {
      const x = total(D, a), y = total(D, b), ans = (y - x) / x * 100;
      if (Math.abs(ans) < 1) return T.pct(D, a, b); // totals almost equal: no sensible options
      return { prompt: `¿En qué porcentaje cambió el total de ventas entre ${D.cols[a]} y ${D.cols[b]}?${ans < 0 ? ' (negativo = bajó)' : ''}`, ...numberOptions(Math.abs(ans), [Math.abs((y - x) / y * 100), Math.abs(y - x) / 10, y / x * 100], v => (ans < 0 ? '−' : '+') + pctf(v)),
        explain: `Totales: ${num(x)} y ${num(y)}. (${num(y)} − ${num(x)}) ÷ ${num(x)} × 100 = ${ans < 0 ? '−' : '+'}${pctf(Math.abs(ans))}.`,
        tip: 'Para el cambio del total, sumá cada columna primero y recién después calculá el porcentaje. Promediar los porcentajes de cada fila da un resultado distinto (y equivocado).' };
    },
    need(D, a, b) {
      const j = pick([a, b]); let [i1, i2] = shuffle([0, 1, 2, 3]).slice(0, 2);
      if (D.v[i1][j] < D.v[i2][j]) [i1, i2] = [i2, i1];
      const ans = (D.v[i1][j] - D.v[i2][j]) / D.v[i2][j] * 100;
      return { prompt: `¿En qué porcentaje tendrían que subir las ventas de ${D.rows[i2]} en ${D.cols[j]} para igualar a ${D.rows[i1]}?`, ...numberOptions(ans, [(D.v[i1][j] - D.v[i2][j]) / D.v[i1][j] * 100, D.v[i1][j] - D.v[i2][j], D.v[i1][j] / D.v[i2][j] * 100], pctf),
        explain: `Faltan ${num(D.v[i1][j] - D.v[i2][j])}. ${num(D.v[i1][j] - D.v[i2][j])} ÷ ${num(D.v[i2][j])} × 100 = ${pctf(ans)} (se divide por ${D.rows[i2]}, que es el que tiene que crecer).`,
        tip: '"¿Cuánto tiene que crecer X para alcanzar a Y?": la base es X, el que crece. Si dividís por Y, te da un porcentaje más chico y equivocado.' };
    },
    project(D, a, b) {
      const i = rnd(4), x = D.v[i][a], y = D.v[i][b], g = y / x, ans = y * g;
      return { prompt: `Si las ventas de ${D.rows[i]} vuelven a cambiar en el mismo porcentaje que entre ${D.cols[a]} y ${D.cols[b]}, ¿cuánto venderá en el período siguiente?`, ...numberOptions(ans, [y + (y - x), y * (1 + (y - x) / y), x * g], v => `${num(r1(v), 1)} mil US$`),
        explain: `Cambio: ${num(y)} ÷ ${num(x)} = ${num(Math.round(g * 1000) / 1000, 3)}. Siguiente: ${num(y)} × ${num(Math.round(g * 1000) / 1000, 3)} = ${num(r1(ans), 1)} mil US$.`,
        tip: '"Mismo porcentaje" no es "misma cantidad": multiplicá el último valor por el factor de cambio (nuevo ÷ viejo), no le sumes la diferencia.' };
    },
    points(D, a, b) {
      const i = rnd(4), s1 = D.v[i][a] / total(D, a) * 100, s2 = D.v[i][b] / total(D, b) * 100, ans = s2 - s1;
      if (Math.abs(ans) < 0.6) return T.share(D, a, b);
      return { prompt: `¿Cuántos puntos porcentuales cambió la participación de ${D.rows[i]} en el total entre ${D.cols[a]} y ${D.cols[b]}?${ans < 0 ? ' (negativo = bajó)' : ''}`, ...numberOptions(Math.abs(ans), [Math.abs((s2 - s1) / s1 * 100), Math.abs((D.v[i][b] - D.v[i][a]) / D.v[i][a] * 100), s2], v => (ans < 0 ? '−' : '+') + ppf(v)),
        explain: `Participación en ${D.cols[a]}: ${pctf(s1)}; en ${D.cols[b]}: ${pctf(s2)}. Diferencia: ${ans < 0 ? '−' : '+'}${ppf(Math.abs(ans))}`,
        tip: 'Puntos porcentuales = resta de dos porcentajes (de 20% a 25% son 5 p. p.). Variación porcentual = cuánto cambió en relación al inicio (de 20% a 25% es +25%). Los tests mezclan los dos a propósito.' };
    },
  };
  const POOLS = { 1: ['diff', 'sum', 'max'], 2: ['pct', 'avg', 'diff', 'max'], 3: ['share', 'growth', 'ratio', 'pct'], 4: ['convert', 'totalpct', 'share', 'growth'], 5: ['need', 'project', 'points', 'convert', 'totalpct'] };
  const CHART_POOLS = { 1: ['diff', 'max', 'sum'], 2: ['pct', 'diff', 'max'], 3: ['share', 'growth', 'pct'], 4: ['totalpct', 'growth', 'convert'], 5: ['need', 'project', 'points'] };

  function tabla(d) {
    const D = dataset(), [a, b] = d <= 2 ? [0, 1] : pick([[0, 2], [1, 2], [0, 1]]);
    const q = T[pick(POOLS[d])](D, a, b);
    return { kind: 'tabla', ...q, stimulus: tableHtml(D), ...fix(q, d) };
  }
  function grafico(d) {
    const D = dataset(), a = 0, b = d <= 2 ? 1 : 2;
    const q = T[pick(CHART_POOLS[d])](D, a, b);
    return { kind: 'grafico', ...q, stimulus: chartHtml(D, a, b), ...fix(q, d), tip: q.tip + ' En un gráfico, leé los valores escritos sobre las barras: no estimes por la altura si tenés el número.' };
  }
  // Keep the right answer when trimming the option list.
  function fix(q, d) {
    const n = d <= 2 ? 4 : 5;
    if (q.options.length <= n) return { options: q.options, answer: q.answer };
    const right = q.options[q.answer], others = q.options.filter((_, i) => i !== q.answer).slice(0, n - 1);
    const options = shuffle([right, ...others]);
    return { options, answer: options.indexOf(right) };
  }

  /* ---------- Percentage problems ---------- */
  const price = () => (5 + rnd(60)) * 500;
  const ars = v => `$ ${num(Math.round(v))}`;
  const P = {
    discount() {
      const p = price(), d = pick([10, 15, 20, 25, 30]), ans = p * (1 - d / 100);
      return { prompt: `Un monitor cuesta ${ars(p)}. Tiene ${d}% de descuento. ¿Cuánto se paga?`, ...numberOptions(ans, [p * d / 100, p - d, p * (1 + d / 100)], ars),
        explain: `${ars(p)} × (1 − ${d / 100}) = ${ars(ans)}.`, tip: 'Con un descuento del d%, pagás el (100 − d)%: multiplicá directo por 0,80, 0,75, etc. Es más rápido que calcular el descuento y restarlo.' };
    },
    partOf() {
      const p = price(), d = pick([5, 12, 15, 35, 40, 60]), ans = p * d / 100;
      return { prompt: `¿Cuánto es el ${d}% de ${ars(p)}?`, ...numberOptions(ans, [p / d, p * d / 10, p - ans], ars),
        explain: `${ars(p)} × ${d} ÷ 100 = ${ars(ans)}.`, tip: 'Para sacar porcentajes de cabeza: el 10% es correr la coma un lugar; el 5% es la mitad del 10%; el 15% es 10% + 5%.' };
    },
    vatOn() {
      const p = price(), ans = p * 1.21;
      return { prompt: `Un servicio cuesta ${ars(p)} sin IVA. Con IVA del 21%, ¿cuánto cuesta?`, ...numberOptions(ans, [p * 0.21, p / 0.79, p + 21], ars),
        explain: `${ars(p)} × 1,21 = ${ars(ans)}.`, tip: 'Sumar un impuesto del 21% es multiplicar por 1,21. Multiplicar por 0,21 te da solo el impuesto, no el total.' };
    },
    vatOff() {
      const base = price(), withTax = base * 1.21;
      return { prompt: `Una factura dice ${ars(withTax)} con IVA incluido (21%). ¿Cuál es el precio sin IVA?`, ...numberOptions(base, [withTax * 0.79, withTax - 21, withTax / 1.12], ars),
        explain: `${ars(withTax)} ÷ 1,21 = ${ars(base)}. Restar el 21% del total (× 0,79) da ${ars(withTax * 0.79)}, que es incorrecto.`, tip: 'Para sacar un impuesto ya incluido se divide (÷ 1,21), no se resta el 21%: ese 21% se calculó sobre un número más chico.' };
    },
    upDown() {
      const p = price(), d = pick([10, 20, 25, 50]), ans = p * (1 + d / 100) * (1 - d / 100);
      return { prompt: `Un precio de ${ars(p)} sube ${d}% y después baja ${d}%. ¿Cuál es el precio final?`, ...numberOptions(ans, [p, p * (1 + d / 100), p * (1 - d / 100)], ars),
        explain: `${ars(p)} × ${num(1 + d / 100, 2)} × ${num(1 - d / 100, 2)} = ${ars(ans)}. Subir y bajar el mismo porcentaje no te devuelve al inicio: la baja se aplica sobre un número más grande.`, tip: 'Cambios porcentuales seguidos se multiplican: ×1,20 y después ×0,80 = ×0,96. Nunca se suman ni se cancelan.' };
    },
    pointsVsPct() {
      const a = pick([4, 5, 8, 10, 12, 20]), b = a + pick([1, 2, 3, 4, 5]), ans = (b - a) / a * 100;
      return { prompt: `La desocupación pasó del ${a}% al ${b}%. ¿En qué porcentaje aumentó?`, ...numberOptions(ans, [b - a, (b - a) / b * 100, b], pctf),
        explain: `Subió ${b - a} puntos porcentuales, pero en porcentaje subió (${b} − ${a}) ÷ ${a} × 100 = ${pctf(ans)}.`, tip: 'Cuando la variable ya es un porcentaje, distinguí puntos porcentuales (la resta) de variación porcentual (la resta dividida por el valor inicial).' };
    },
    margin() {
      const cost = price(), m = pick([20, 25, 40, 50]), sale = cost * (1 + m / 100), ans = (sale - cost) / sale * 100;
      return { prompt: `Un producto cuesta ${ars(cost)} y se vende a ${ars(sale)}. ¿Qué porcentaje del precio de venta es ganancia?`, ...numberOptions(ans, [m, (sale - cost) / 1000, 100 - m], pctf),
        explain: `Ganancia: ${ars(sale - cost)}. ${ars(sale - cost)} ÷ ${ars(sale)} × 100 = ${pctf(ans)}. Sobre el costo sería ${m}% (eso es el recargo, no el margen).`, tip: 'Margen = ganancia ÷ precio de venta. Recargo (markup) = ganancia ÷ costo. Leé bien sobre qué base pregunta.' };
    },
    reverse() {
      const before = price(), d = pick([10, 15, 20, 25, 40]), after = before * (1 + d / 100);
      return { prompt: `Después de un aumento del ${d}%, un abono cuesta ${ars(after)}. ¿Cuánto costaba antes?`, ...numberOptions(before, [after * (1 - d / 100), after - d, after / (1 - d / 100)], ars),
        explain: `${ars(after)} ÷ ${num(1 + d / 100, 2)} = ${ars(before)}. Restarle el ${d}% al precio nuevo da ${ars(after * (1 - d / 100))}, que no es lo mismo.`, tip: 'Para volver al valor anterior a un aumento, dividí por el factor (÷ 1,20), no restes el porcentaje: el aumento se calculó sobre el número viejo.' };
    },
    chain() {
      const [x, y] = pick([[10, 20], [20, 20], [10, 30], [30, 20], [25, 20]]), ans = (1 - (1 - x / 100) * (1 - y / 100)) * 100;
      return { prompt: `Un comercio aplica un descuento del ${x}% y, sobre ese precio, otro del ${y}%. ¿A qué descuento único equivale?`, ...numberOptions(ans, [x + y, x * y / 10, (x + y) / 2], pctf),
        explain: `Pagás el ${100 - x}% del ${100 - y}%: ${num(1 - x / 100, 2)} × ${num(1 - y / 100, 2)} = ${num((1 - x / 100) * (1 - y / 100), 2)}. Descuento total: ${pctf(ans)}, menos que ${x + y}%.`, tip: 'Dos descuentos seguidos nunca se suman: multiplicá lo que pagás en cada uno (0,90 × 0,80 = 0,72 → 28% de descuento).' };
    },
  };
  const P_POOLS = { 1: ['discount', 'partOf'], 2: ['vatOn', 'partOf', 'discount'], 3: ['upDown', 'vatOff', 'vatOn'], 4: ['pointsVsPct', 'margin', 'vatOff', 'upDown'], 5: ['reverse', 'chain', 'margin', 'pointsVsPct'] };
  function porcentaje(d) {
    const q = P[pick(P_POOLS[d])]();
    return { kind: 'porcentaje', ...q, stimulus: '', ...fix(q, d) };
  }

  const make = Object.fromEntries(Object.entries({ tabla, grafico, porcentaje }).map(([k, fn]) => [k, d => ({ ...fn(d), d, text: true })]));
  return { make, KINDS: Object.keys(make) };
})();
