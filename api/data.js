// Progress and practice history for the logged-in user.
// GET: { progress, history } · POST { type: 'progress', progress } · POST { type: 'finish', entry, progress }
const { redis, HttpError, requireUser, body, handler } = require('./_lib');

const MAX_HISTORY = 100;
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
    layout: p.layout === 'es' ? 'es' : 'la',
    kb: ['always', 'error', 'hidden'].includes(p.kb) ? p.kb : 'always',
  };
}

function cleanEntry(e) {
  if (!e || typeof e !== 'object') throw new HttpError(400, 'Sesión inválida.');
  return {
    lesson: String(e.lesson || '').slice(0, 6),
    name: String(e.name || '').slice(0, 60),
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
    return { progress: progress ? JSON.parse(progress) : null, history: (history || []).map(h => JSON.parse(h)) };
  }
  if (req.method !== 'POST') throw new HttpError(405, 'Método no permitido.');
  const data = body(req);

  if (data.type === 'progress') {
    await redis('SET', 'progress:' + name, JSON.stringify(cleanProgress(data.progress)));
    return { ok: true };
  }

  if (data.type === 'finish') {
    const entry = cleanEntry(data.entry);
    await redis('SET', 'progress:' + name, JSON.stringify(cleanProgress(data.progress)));
    await redis('LPUSH', 'history:' + name, JSON.stringify(entry));
    await redis('LTRIM', 'history:' + name, 0, MAX_HISTORY - 1);
    return { entry };
  }

  throw new HttpError(400, 'Tipo de dato desconocido.');
});
