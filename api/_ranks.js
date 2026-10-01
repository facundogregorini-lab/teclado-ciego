// Rankings of every account, kept in two Redis sorted sets.
// rank:progress → approved lessons × 100 + stars · rank:speed → best speed measurement (words per minute)
// rank:ninja → best score of the Ninja mental challenge · rank:cog → Ninja mental sessions passed × 1000 + stars
// rank:general → all stars (lessons + Ninja mental) + best speed + best challenge score.
const { redis } = require('./_lib');

// Same ids as LESSONS in index.html: only real lessons count for the ranking.
const LESSON_IDS = ['fj', 'dk', 'sl', 'añ', 'gh', 'rep1', 'ei', 'ru', 'ty', 'wo', 'qp', 'rep2', 'nm', 'vb', 'c,', 'x.', 'z', 'rep3', 'may', 'til', 'ref', 'cos', 'ofi', 'tec', 'coc', 'via'];
const MAX_PPM = 250; // faster than any sustained human record: ignored
const COG_ID = /^(serie|matriz|distinta|tabla|grafico|porcentaje|lectura|conectores|orden)[1-5]$/;
const MAX_NINJA = 300; // about 60 right answers at the top difficulty in 5 minutes: beyond that, ignored

function scores(progress) {
  const lessons = LESSON_IDS.map(id => progress.lessons?.[id]).filter(Boolean);
  const done = lessons.filter(r => r.stars >= 1).length, stars = lessons.reduce((s, r) => s + r.stars, 0);
  const speeds = [progress.test?.ppm, ...(progress.tests || []).map(t => t.ppm)].filter(v => v > 0 && v <= MAX_PPM);
  const best = Number(progress.ninja?.best?.score) || 0, ninja = best <= MAX_NINJA ? best : 0, speed = speeds.length ? Math.max(...speeds) : 0;
  const cog = Object.entries(progress.cog || {}).filter(([id]) => COG_ID.test(id)).map(([, r]) => Number(r?.stars) || 0);
  const cogDone = cog.filter(s => s >= 1).length, cogStars = cog.reduce((a, s) => a + Math.min(3, s), 0);
  return { progress: done * 100 + stars, speed, ninja, cog: cogDone * 1000 + cogStars, general: stars + cogStars + speed + ninja };
}

async function updateRanks(name, progress) {
  const s = scores(progress);
  await Promise.all(['progress', 'speed', 'ninja', 'cog', 'general'].map(board => s[board] > 0
    ? redis('ZADD', 'rank:' + board, s[board], name)
    : redis('ZREM', 'rank:' + board, name)));
}

module.exports = { LESSON_IDS, scores, updateRanks };
