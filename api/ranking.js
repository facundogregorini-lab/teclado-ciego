// GET: public rankings (top 50 of progress and of speed) and, with a session, where the user stands.
const { redis, HttpError, tokenKey, bearer, handler } = require('./_lib');

const TOP = 50;

async function board(key, name) {
  const [flat, total, score] = await Promise.all([
    redis('ZREVRANGE', key, 0, TOP - 1, 'WITHSCORES'),
    redis('ZCARD', key),
    name ? redis('ZSCORE', key, name) : null,
  ]);
  const top = [];
  for (let i = 0; i < (flat || []).length; i += 2) top.push({ name: flat[i], score: Number(flat[i + 1]) });
  // Position = people with a better score + 1, so ties share it
  const me = score == null ? null : { name, score: Number(score), rank: Number(await redis('ZCOUNT', key, '(' + score, '+inf')) + 1 };
  return { top, total: Number(total) || 0, me };
}

module.exports = handler(async req => {
  if (req.method !== 'GET') throw new HttpError(405, 'Método no permitido.');
  const token = bearer(req);
  const name = token ? await redis('GET', tokenKey(token)) : null;
  const [progress, speed] = await Promise.all([board('rank:progress', name), board('rank:speed', name)]);
  return { user: name || null, progress, speed };
});
