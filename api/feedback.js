// Ayudanos a mejorar: messages for the monks.
// POST {mood, kind, text, sign, page}: anyone can leave one (6 per hour per connection). With a session and sign: true
// it carries the name the account shows (and the username, only for the monks).
// GET with the header X-Monjes-Key = FEEDBACK_KEY (a Vercel variable): the latest messages, for comentarios.html.
const crypto = require('node:crypto');
const { redis, HttpError, tokenKey, bearer, body, handler } = require('./_lib');

const KINDS = ['idea', 'bug', 'love', 'otro'];
const PAGES = ['home', 'lesson', 'quiz'];
const MAX_TEXT = 1000, KEEP = 2000, PER_HOUR = 6, ADMIN_FAILURES = 10;
const hash = text => crypto.createHash('sha256').update(String(text)).digest();
const ipKey = req => hash(String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || 'local').toString('hex').slice(0, 24);

async function limit(key, max, seconds, message) {
  const n = await redis('INCR', key);
  if (n === 1) await redis('EXPIRE', key, seconds);
  if (n > max) throw new HttpError(429, message);
}

function cleanText(value) {
  const text = String(value ?? '').normalize('NFC').replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '')
    .replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  if ([...text].length < 3) throw new HttpError(400, 'Escribile a los monjes al menos unas palabras.');
  if ([...text].length > MAX_TEXT) throw new HttpError(400, `El pergamino admite hasta ${MAX_TEXT} caracteres.`);
  return text;
}

async function leave(req) {
  const data = body(req);
  if (data.website) return { ok: true }; // the hidden field only bots fill in
  const entry = {
    id: crypto.randomBytes(8).toString('hex'),
    date: Date.now(),
    mood: [1, 2, 3, 4, 5].includes(Number(data.mood)) ? Number(data.mood) : null,
    kind: KINDS.includes(data.kind) ? data.kind : 'otro',
    text: cleanText(data.text),
    page: PAGES.includes(data.page) ? data.page : 'home',
    name: null, user: null,
  };
  await limit('fbrate:' + ipKey(req), PER_HOUR, 3600, 'Los monjes todavía están leyendo tus pergaminos. Probá de nuevo en un rato.');
  const token = bearer(req), user = token && data.sign ? await redis('GET', tokenKey(token)) : null;
  if (user) Object.assign(entry, { user, name: await redis('GET', 'display:' + user) || user });
  await redis('LPUSH', 'feedback', JSON.stringify(entry));
  await redis('LTRIM', 'feedback', 0, KEEP - 1);
  return { ok: true };
}

async function read(req) {
  const key = process.env.FEEDBACK_KEY;
  if (!key) throw new HttpError(503, 'Falta la variable FEEDBACK_KEY en Vercel: agregala (es la clave para leer los comentarios) y hacé Redeploy.');
  const failKey = 'fbadmin:' + ipKey(req);
  if (Number(await redis('GET', failKey)) >= ADMIN_FAILURES) throw new HttpError(429, 'Demasiados intentos. Esperá 15 minutos.');
  if (!crypto.timingSafeEqual(hash(req.headers['x-monjes-key'] || ''), hash(key))) {
    await limit(failKey, Infinity, 15 * 60, '');
    throw new HttpError(401, 'Clave incorrecta.');
  }
  const items = (await redis('LRANGE', 'feedback', 0, KEEP - 1) || []).map(item => JSON.parse(item));
  return { items };
}

module.exports = handler(async req => {
  if (req.method === 'POST') return leave(req);
  if (req.method === 'GET') return read(req);
  throw new HttpError(405, 'Método no permitido.');
});
