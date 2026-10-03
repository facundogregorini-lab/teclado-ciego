// Rivales del dojo: ten practice bots that sit in every ranking so there is always someone to beat.
// They are never passed off as people: the API marks them with rival: true, their id can't be a username (it has ":"),
// they don't count in "total" and the page shows them with a 🤖 "rival del dojo" tag.
// Each one is a step of the same ladder in every board, from a first-day apprentice to a master.
// Columns: lessons passed and their stars, Ninja mental sessions passed and their stars, best speed (ppm), best 5-minute challenge score.
const LADDER = [
  ['kenta', 'Kenta', 2, 3, 1, 1, 14, 3],
  ['hana', 'Hana', 4, 7, 3, 4, 20, 5],
  ['taro', 'Taro', 6, 11, 5, 8, 27, 8],
  ['yuki', 'Yuki', 9, 17, 8, 14, 33, 11],
  ['ren', 'Ren', 12, 24, 12, 22, 40, 15],
  ['sora', 'Sora', 15, 32, 16, 31, 48, 20],
  ['aiko', 'Aiko', 18, 40, 21, 42, 56, 26],
  ['daichi', 'Daichi', 21, 50, 27, 56, 65, 33],
  ['mei', 'Sensei Mei', 24, 62, 34, 78, 76, 42],
  ['hattori', 'Maestro Hattori', 26, 74, 42, 112, 92, 55],
];

// Same formulas as scores() in api/_ranks.js.
const RIVALS = LADDER.map(([id, name, done, stars, cogDone, cogStars, speed, ninja]) => ({
  id: 'rival:' + id, name,
  scores: { progress: done * 100 + stars, speed, ninja, cog: cogDone * 1000 + cogStars, general: stars + cogStars + speed + ninja },
}));

module.exports = { RIVALS };
