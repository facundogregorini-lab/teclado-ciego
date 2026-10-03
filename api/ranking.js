// GET: public rankings (top 50): general, lesson progress, speed, Ninja mental progress and the Ninja mental challenge and, with a session, where the user stands.
// Each row brings the account id (name) and the name it chose to show (display, see api/auth.js). The rivales del dojo
// (api/_rivals.js) come mixed in, marked with rival: true; "total" counts only people.
const { redis, HttpError, tokenKey, bearer, handler } = require('./_lib');
const { updateRanks, ninjaOf } = require('./_ranks');
const { RIVALS } = require('./_rivals');

const TOP = 50;

async function board(view, name) {
  const key = 'rank:' + view;
  const [flat, total, score] = await Promise.all([
    redis('ZREVRANGE', key, 0, TOP - 1, 'WITHSCORES'),
    redis('ZCARD', key),
    name ? redis('ZSCORE', key, name) : null,
  ]);
  const top = [];
  for (let i = 0; i < (flat || []).length; i += 2) top.push({ name: flat[i], score: Number(flat[i + 1]) });
  const rivals = RIVALS.map(r => ({ name: r.id, display: r.name, rival: true, score: r.scores[view] }));
  // People go before a rival with the same score
  const rows = [...top, ...rivals].sort((a, b) => b.score - a.score || (a.rival ? 1 : 0) - (b.rival ? 1 : 0)).slice(0, TOP);
  // Position = people and rivals with a better score + 1, so ties share it
  const me = score == null ? null : {
    name, score: Number(score),
    rank: Number(await redis('ZCOUNT', key, '(' + score, '+inf')) + rivals.filter(r => r.score > Number(score)).length + 1,
  };
  return { top: rows, total: Number(total) || 0, rivals: rivals.length, me };
}

// The names people chose to show, for every account in these boards.
async function withDisplayNames(boards) {
  const people = [...new Set(boards.flatMap(b => [...b.top.filter(r => !r.rival), ...(b.me ? [b.me] : [])].map(r => r.name)))];
  if (!people.length) return;
  const shown = Object.fromEntries((await redis('MGET', ...people.map(n => 'display:' + n)) || []).map((d, i) => [people[i], d]));
  for (const b of boards) for (const r of [...b.top, ...(b.me ? [b.me] : [])]) if (!r.rival) r.display = shown[r.name] || r.name;
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
  const all = await Promise.all(boards.map(b => board(b, name)));
  await withDisplayNames(all);
  return { user: name || null, ...Object.fromEntries(boards.map((b, i) => [b, all[i]])) };
});
