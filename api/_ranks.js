// Rankings of every account, kept in two Redis sorted sets.
// rank:progress → approved lessons × 100 + stars · rank:speed → best speed measurement (words per minute)
// rank:ninja → best score of the Ninja mental 3-minute run.
const { redis } = require('./_lib');

// Same ids as LESSONS in index.html: only real lessons count for the ranking.
const LESSON_IDS = ['fj', 'dk', 'sl', 'añ', 'gh', 'rep1', 'ei', 'ru', 'ty', 'wo', 'qp', 'rep2', 'nm', 'vb', 'c,', 'x.', 'z', 'rep3', 'may', 'til', 'ref', 'cos', 'ofi', 'tec', 'coc', 'via'];
const MAX_PPM = 250; // faster than any sustained human record: ignored
const MAX_NINJA = 300; // about 60 right answers at the top difficulty in 3 minutes: beyond that, ignored

function scores(progress) {
  const lessons = LESSON_IDS.map(id => progress.lessons?.[id]).filter(Boolean);
  const done = lessons.filter(r => r.stars >= 1).length, stars = lessons.reduce((s, r) => s + r.stars, 0);
  const speeds = [progress.test?.ppm, ...(progress.tests || []).map(t => t.ppm)].filter(v => v > 0 && v <= MAX_PPM);
  const ninja = Number(progress.ninja?.best?.score) || 0;
  return { progress: done * 100 + stars, speed: speeds.length ? Math.max(...speeds) : 0, ninja: ninja <= MAX_NINJA ? ninja : 0 };
}

async function updateRanks(name, progress) {
  const s = scores(progress);
  await Promise.all(['progress', 'speed', 'ninja'].map(board => s[board] > 0
    ? redis('ZADD', 'rank:' + board, s[board], name)
    : redis('ZREM', 'rank:' + board, name)));
}

module.exports = { LESSON_IDS, scores, updateRanks };
