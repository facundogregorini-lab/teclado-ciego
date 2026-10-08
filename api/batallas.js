// Batallas: one-game challenges by link, played when each one can (asynchronous).
// POST { action: 'create', game, score, name? }  → { battle }: someone plays, then challenges a friend with that score
// POST { action: 'respond', id, score, name? }   → { battle, result }: the friend's score against it ('won', 'lost', 'tie')
// GET ?ids=a,b,c                                  → { battles }: the battles this browser knows (sent or answered)
// GET (with a session)                            → { battles }: the account's battles, on any device
// No account needed: a guest plays under a nickname. With a session, the battle is also kept in the account's list.
// Scores come from the browser (the games run there), so they are kept within what a person can do.
const crypto = require('node:crypto');
const { redis, HttpError, bearer, requireUser, body, handler } = require('./_lib');

const GAMES = {
  chimpance: { min: 0, max: 40 }, numeros: { min: 0, max: 40 }, visual: { min: 0, max: 60 },
  reflejos: { min: 100, max: 3000, lower: true }, celu: { min: 0, max: 160 },
};
const DAYS = 60, MAX_RESPONSES = 30, MAX_LIST = 50, CREATE_PER_DAY = 60;
const key = id => 'battle:' + id;
const listKey = user => 'battles:' + user;
const cleanName = n => String(n || '').replace(/[<>&"]/g, '').trim().slice(0, 20) || 'Un ninja';
const ipKey = req => crypto.createHash('sha256').update(String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || 'local').digest('hex').slice(0, 20);

async function userOf(req) {
  if (!bearer(req)) return null;
  try { return await requireUser(req); } catch { return null; }
}
function score(game, value) {
  const g = GAMES[game], n = Math.round(Number(value));
  if (!g || !Number.isFinite(n) || n < g.min || n > g.max) throw new HttpError(400, 'Ese resultado no es válido.');
  return n;
}
const outcome = (game, mine, theirs) => mine === theirs ? 'tie' : (GAMES[game].lower ? mine < theirs : mine > theirs) ? 'won' : 'lost';
// What anyone with the link may see: no account names, only the names people chose to show
// (and, for the account asking, whether the battle is its own or one it answered, with its score)
const view = (b, user = null) => b && { id: b.id, game: b.game, score: b.score, from: b.from, created: b.created,
  responses: b.responses.map(r => ({ name: r.name, score: r.score, date: r.date, result: outcome(b.game, r.score, b.score) })),
  ...(user && b.user === user ? { role: 'sent' } : user && b.responses.some(r => r.user === user) ? { role: 'got', myScore: b.responses.find(r => r.user === user).score } : {}) };
const load = async id => { const raw = /^[a-z0-9]{8}$/.test(id || '') ? await redis('GET', key(id)) : null; return raw ? JSON.parse(raw) : null; };
async function remember(user, id) {
  if (!user) return;
  await redis('LPUSH', listKey(user), id);
  await redis('LTRIM', listKey(user), 0, MAX_LIST - 1);
}

module.exports = handler(async req => {
  const user = await userOf(req);
  if (req.method === 'GET') {
    const url = new URL(req.url, 'http://x');
    const asked = (url.searchParams.get('ids') || '').split(',').filter(Boolean).slice(0, MAX_LIST);
    const ids = [...new Set([...asked, ...(user ? await redis('LRANGE', listKey(user), 0, MAX_LIST - 1) || [] : [])])];
    const battles = (await Promise.all(ids.map(load))).filter(Boolean).map(b => view(b, user));
    return { battles };
  }
  if (req.method !== 'POST') throw new HttpError(405, 'Método no permitido.');
  const data = body(req);

  if (data.action === 'create') {
    const game = String(data.game || '');
    const value = score(game, data.score);
    const limit = 'battlecreate:' + ipKey(req) + ':' + new Date().toISOString().slice(0, 10);
    if (await redis('INCR', limit) === 1) await redis('EXPIRE', limit, 86400);
    if (Number(await redis('GET', limit)) > CREATE_PER_DAY) throw new HttpError(429, 'Muchas batallas por hoy. Probá mañana.');
    const id = crypto.randomBytes(6).readUIntBE(0, 6).toString(36).padStart(8, '0').slice(-8);
    const battle = { id, game, score: value, from: user ? cleanName(data.name || user) : cleanName(data.name), user: user || null, created: Date.now(), responses: [] };
    await redis('SET', key(id), JSON.stringify(battle), 'EX', DAYS * 86400);
    await remember(user, id);
    return { battle: view(battle, user) };
  }

  if (data.action === 'respond') {
    const battle = await load(String(data.id || ''));
    if (!battle) throw new HttpError(404, 'Esta batalla ya no existe.');
    const value = score(battle.game, data.score);
    if (battle.responses.length >= MAX_RESPONSES) throw new HttpError(409, 'Esta batalla ya tiene muchas respuestas.');
    battle.responses.push({ name: user ? cleanName(data.name || user) : cleanName(data.name), user: user || null, score: value, date: Date.now() });
    await redis('SET', key(battle.id), JSON.stringify(battle), 'EX', DAYS * 86400);
    await remember(user, battle.id);
    return { battle: view(battle, user), result: outcome(battle.game, value, battle.score) };
  }

  throw new HttpError(400, 'Acción desconocida.');
});
module.exports.GAMES = GAMES;
