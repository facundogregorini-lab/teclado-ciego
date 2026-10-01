// The 5-minute Ninja mental challenge, run by the server so that nobody can make up a score:
// the questions are generated here, the page never sees an answer before choosing, the clock is the server's
// and the score is computed here. Runs that look automated are kept but don't count for the ranking.
// POST { type: 'start' } → { id, ms, q } · POST { type: 'answer', id, pick, sig } → { right, answer, pts, points, ok, n, level, q }
// POST { type: 'finish', id } → { score, iq, …, flagged, reasons } · GET ?reto=<id> → { name, score, iq } (challenge links)
const crypto = require('node:crypto');
const { redis, HttpError, tokenKey, bearer, body, handler } = require('./_lib');
const { updateRanks, ninjaOf } = require('./_ranks');
// The same generators the page uses for practice (they define globalThis.Figures, Numeric and English).
require('../figures.js'); require('../numeric.js'); require('../english.js');

const NINJA_MS = 5 * 60000, GRACE_MS = 4000; // a little extra for the answer that was on its way when time ran out
const KINDS = ['serie', 'tabla', 'lectura', 'matriz', 'porcentaje', 'conectores', 'distinta', 'grafico', 'orden'];
const GEN = { serie: 'Figures', matriz: 'Figures', distinta: 'Figures', tabla: 'Numeric', grafico: 'Numeric', porcentaje: 'Numeric', lectura: 'English', conectores: 'English', orden: 'English' };
const RUN_TTL = 1800, RESULT_TTL = 180 * 86400;
const ID = /^[A-Za-z0-9_-]{22}$/;
const iqFor = score => Math.max(70, Math.min(160, Math.round(85 + 22 * Math.log(1 + (Number(score) || 0) / 4))));

// Next question of the run: the three tracks in turn, at the run's current level. The answer stays here.
function nextQ(run) {
  const kind = KINDS[run.asked % KINDS.length], used = new Set(run.used);
  const q = globalThis[GEN[kind]].make[kind](run.level, used);
  run.asked++; run.used = [...used];
  run.cur = { kind, d: run.level, answer: q.answer, size: q.options.length, at: Date.now() };
  const { answer, explain, tip, after, id, ...shown } = q;
  return { ...shown, d: run.level };
}

const loadRun = async id => {
  const saved = ID.test(String(id)) && await redis('GET', 'nrun:' + id);
  if (!saved) throw new HttpError(404, 'Esta partida ya no existe. Empezá otra.');
  return JSON.parse(saved);
};
const saveRun = run => redis('SET', 'nrun:' + run.id, JSON.stringify(run), 'EX', RUN_TTL);

// How the page says each answer was given: keyboard or pointer, whether the browser saw a real person doing it,
// how many times the pointer moved since the question appeared and how far it jumped to click.
function cleanSig(s) {
  s = s && typeof s === 'object' ? s : {};
  return {
    input: ['mouse', 'pen', 'touch', 'key'].includes(s.input) ? s.input : 'other',
    trusted: s.trusted !== false, focus: s.focus !== false,
    moves: Math.min(1000, Math.max(0, Math.round(Number(s.moves) || 0))),
    jump: Math.min(10000, Math.max(0, Math.round(Number(s.jump) || 0))),
  };
}

// Signs of a run played by a program or an AI agent instead of a person. One strong sign is enough;
// the weak ones (a gifted person can show one) need to come together.
function suspicious(log, acc, maxLevel) {
  const strong = [], weak = [], n = log.length;
  if (log.some(a => !a.trusted)) strong.push('Hubo respuestas elegidas por un programa, no con el mouse ni el teclado.');
  const pointer = log.filter(a => a.input === 'mouse' || a.input === 'pen');
  const jumps = pointer.filter(a => a.moves < 3 && a.jump > 40).length;
  if (jumps >= 3 && jumps >= pointer.length / 2) strong.push('El puntero saltaba directo a la respuesta sin recorrer la pantalla.');
  const blind = pointer.filter(a => !a.focus).length;
  if (blind >= 3 && blind >= pointer.length / 2) strong.push('Los clics llegaban sin que la página estuviera activa, como si otro programa los hiciera.');
  if (n >= 8) {
    const mean = log.reduce((s, a) => s + a.ms, 0) / n, sd = Math.sqrt(log.reduce((s, a) => s + (a.ms - mean) ** 2, 0) / n);
    if (sd / mean < 0.25) weak.push('Respondiste a un ritmo demasiado parejo para preguntas tan distintas.');
  }
  if (n >= 12 && acc >= 0.95 && maxLevel >= 5) weak.push('Precisión casi perfecta en la dificultad máxima.');
  if (log.filter(a => (a.k === 'lectura' || a.k === 'orden') && a.right && a.ms < 2500).length >= 2) weak.push('Resolviste textos en inglés más rápido de lo que se tarda en leerlos.');
  const reasons = strong.length ? strong : weak;
  return { flagged: strong.length > 0 || weak.length >= 2, reasons: strong.length || weak.length >= 2 ? reasons : [] };
}

function result(run) {
  const n = run.log.length, ok = run.log.filter(a => a.right).length, acc = n ? ok / n : 0;
  const score = Math.round(run.points * acc), maxLevel = Math.max(1, ...run.log.map(a => a.d));
  return { id: run.id, score, iq: iqFor(score), ok, n, points: run.points, acc: Math.round(100 * acc), maxLevel, date: Date.now(), ...suspicious(run.log, acc, maxLevel) };
}

// Keeps the run in the account (best clean run and the last 50) and updates the rankings.
async function saveToAccount(name, r) {
  const ninja = await ninjaOf(name);
  const run = { id: r.id, score: r.score, iq: r.iq, ok: r.ok, n: r.n, date: r.date, ...(r.flagged ? { flagged: true } : {}) };
  const best = !r.flagged && r.n && (!ninja.best || r.score > ninja.best.score) ? run : ninja.best;
  const saved = { best, runs: [...ninja.runs, run].slice(-50) };
  await redis('SET', 'ninja:' + name, JSON.stringify(saved));
  const progress = JSON.parse(await redis('GET', 'progress:' + name) || '{}');
  await updateRanks(name, { ...progress, ninja: saved });
  return saved;
}

module.exports = handler(async req => {
  if (req.method === 'GET') {
    const id = new URL(req.url, 'http://x').searchParams.get('reto');
    const saved = ID.test(String(id)) && await redis('GET', 'nres:' + id);
    if (!saved) throw new HttpError(404, 'No encontramos ese desafío.');
    return JSON.parse(saved);
  }
  if (req.method !== 'POST') throw new HttpError(405, 'Método no permitido.');
  const data = body(req);

  if (data.type === 'start') {
    const token = bearer(req), user = token ? await redis('GET', tokenKey(token)) : null;
    const run = { id: crypto.randomBytes(16).toString('base64url'), user: user || null, t0: Date.now(), level: 1, asked: 0, used: [], log: [], points: 0, done: null };
    const q = nextQ(run);
    run.t0 = run.cur.at;
    await saveRun(run);
    return { id: run.id, ms: NINJA_MS, q };
  }

  const run = await loadRun(data.id);
  if (data.type === 'answer') {
    if (run.done) return { over: true };
    const now = Date.now();
    if (now > run.t0 + NINJA_MS + GRACE_MS) return { over: true };
    const pick = Number(data.pick), q = run.cur;
    if (!Number.isInteger(pick) || pick < 0 || pick >= q.size) throw new HttpError(400, 'Respuesta inválida.');
    const right = pick === q.answer;
    run.log.push({ k: q.kind, d: q.d, right, ms: now - q.at, ...cleanSig(data.sig) });
    if (right) run.points += q.d;
    const ok = run.log.filter(a => a.right).length;
    run.level = Math.min(5, 1 + Math.floor(ok / 3));
    const next = nextQ(run);
    await saveRun(run);
    return { right, answer: q.answer, pts: q.d, points: run.points, ok, n: run.log.length, level: run.level, left: run.t0 + NINJA_MS - now, q: next };
  }

  if (data.type === 'finish') {
    if (run.done) return run.done; // finishing twice gives the same result
    const r = result(run);
    run.done = r;
    await saveRun(run);
    if (!r.flagged && r.n) await redis('SET', 'nres:' + run.id, JSON.stringify({ name: run.user, score: r.score, iq: r.iq }), 'EX', RESULT_TTL);
    return run.user ? { ...r, ninja: await saveToAccount(run.user, r) } : r;
  }

  throw new HttpError(400, 'Tipo de pedido desconocido.');
});

module.exports.suspicious = suspicious;
