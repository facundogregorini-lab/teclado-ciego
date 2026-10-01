// GET: public rankings (top 50): general, lesson progress, speed, Ninja mental progress and the Ninja mental challenge and, with a session, where the user stands.
const { redis, HttpError, tokenKey, bearer, handler } = require('./_lib');
const { updateRanks, ninjaOf } = require('./_ranks');

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

// Once: the challenge scores the browsers reported before api/ninja.js existed leave the rankings,
// and everyone's general score is recomputed with the server-graded runs only.
async function dropReportedNinja() {
  if (await redis('SET', 'migrated:ninja-graded', '1', 'NX') !== 'OK') return;
  const names = await redis('ZREVRANGE', 'rank:general', 0, -1) || [];
  await redis('DEL', 'rank:ninja');
  for (const name of names) {
    const progress = await redis('GET', 'progress:' + name);
    if (progress) await updateRanks(name, { ...JSON.parse(progress), ninja: await ninjaOf(name) });
  }
}

module.exports = handler(async req => {
  if (req.method !== 'GET') throw new HttpError(405, 'Método no permitido.');
  await dropReportedNinja();
  const token = bearer(req);
  const name = token ? await redis('GET', tokenKey(token)) : null;
  const boards = ['general', 'progress', 'speed', 'cog', 'ninja'];
  const all = await Promise.all(boards.map(b => board('rank:' + b, name)));
  return { user: name || null, ...Object.fromEntries(boards.map((b, i) => [b, all[i]])) };
});
