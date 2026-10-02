// Progress and practice history for the logged-in user.
// GET: { progress, history } · POST { type: 'progress', progress } · POST { type: 'finish', entry, progress }
// Every save also updates the user's place in the rankings (api/_ranks.js).
const { redis, HttpError, requireUser, body, handler } = require('./_lib');
const { updateRanks, ninjaOf } = require('./_ranks');

const MAX_HISTORY = 100, MAX_TESTS = 300;
const METHODS = ['mirando', 'hibrido', 'ciegas'];
const num = (v, max) => Math.min(max, Math.max(0, Math.round(Number(v) || 0)));
const record = r => ({ stars: num(r?.stars, 3), ppm: num(r?.ppm, 400), acc: num(r?.acc, 100) });

function cleanProgress(p) {
  if (!p || typeof p !== 'object') throw new HttpError(400, 'Progreso inválido.');
  const lessons = {};
  for (const [id, r] of Object.entries(p.lessons || {}).slice(0, 60)) {
    if (/^[a-zñ0-9,.]{1,6}$/.test(id)) lessons[id] = record(r);
  }
  return {
    lessons,
    test: p.test ? { ppm: num(p.test.ppm, 400), acc: num(p.test.acc, 100) } : null,
    // Speed measurements by typing method, oldest first
    tests: (Array.isArray(p.tests) ? p.tests : [])
      .filter(t => t && METHODS.includes(t.method) && Number(t.date) > 0)
      .slice(-MAX_TESTS)
      .map(t => ({ method: t.method, ppm: num(t.ppm, 400), acc: num(t.acc, 100), date: Math.round(Number(t.date)), ...(/^[a-zA-Z0-9-]{1,48}$/.test(t.seed || '') ? { seed: t.seed, accents: t.accents === 'loose' ? 'loose' : 'strict' } : {}) })),
    layout: p.layout === 'es' ? 'es' : 'la',
    kb: ['always', 'error', 'hidden'].includes(p.kb) ? p.kb : 'always',
    tildes: p.tildes === 'loose' ? 'loose' : 'strict',
    // Ninja mental: best result per session (serie1…orden5, three tracks) and the mock tests of each track
    cog: Object.fromEntries(Object.entries(p.cog && typeof p.cog === 'object' ? p.cog : {})
      .filter(([id]) => /^(serie|matriz|distinta|tabla|grafico|porcentaje|lectura|conectores|orden)[1-5]$/.test(id))
      .map(([id, r]) => [id, { stars: num(r?.stars, 3), pct: num(r?.pct, 100), ms: num(r?.ms, 3_600_000) }])),
    sims: (Array.isArray(p.sims) ? p.sims : []).filter(t => t && Number(t.date) > 0).slice(-100)
      .map(t => ({ pct: num(t.pct, 100), ms: num(t.ms, 3_600_000), date: Math.round(Number(t.date)), track: ['fig', 'num', 'eng'].includes(t.track) ? t.track : 'fig' })),
    // The 5-minute challenge is not taken from here: api/ninja.js grades it and keeps it (see withNinja).
  };
}

// The saved progress always carries the challenge runs graded by the server, whatever the browser sent.
const withNinja = async (name, progress) => ({ ...progress, ninja: await ninjaOf(name) });

function cleanEntry(e) {
  if (!e || typeof e !== 'object') throw new HttpError(400, 'Sesión inválida.');
  return {
    lesson: String(e.lesson || '').slice(0, 6),
    name: String(e.name || '').slice(0, 60),
    ...(METHODS.includes(e.method) ? { method: e.method } : {}),
    ...record(e),
    ms: num(e.ms, 3_600_000),
    date: Date.now(),
  };
}

module.exports = handler(async req => {
  const name = await requireUser(req);

  if (req.method === 'GET') {
    const [progress, history] = await Promise.all([
      redis('GET', 'progress:' + name),
      redis('LRANGE', 'history:' + name, 0, MAX_HISTORY - 1),
    ]);
    const saved = progress ? await withNinja(name, JSON.parse(progress)) : null;
    if (saved) await updateRanks(name, saved); // accounts from before the rankings join them here
    return { progress: saved, history: (history || []).map(h => JSON.parse(h)) };
  }
  if (req.method !== 'POST') throw new HttpError(405, 'Método no permitido.');
  const data = body(req);

  if (data.type === 'progress') {
    const progress = await withNinja(name, cleanProgress(data.progress));
    await redis('SET', 'progress:' + name, JSON.stringify(progress));
    await updateRanks(name, progress);
    return { ok: true };
  }

  if (data.type === 'finish') {
    const entry = cleanEntry(data.entry), progress = await withNinja(name, cleanProgress(data.progress));
    await redis('SET', 'progress:' + name, JSON.stringify(progress));
    await updateRanks(name, progress);
    await redis('LPUSH', 'history:' + name, JSON.stringify(entry));
    await redis('LTRIM', 'history:' + name, 0, MAX_HISTORY - 1);
    return { entry };
  }

  throw new HttpError(400, 'Tipo de dato desconocido.');
});
