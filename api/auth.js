// GET: who am I · POST {action: 'register' | 'login' | 'logout'} · POST {action: 'display', display} changes the name shown
// The username stays the account id (for logging in and in every key); the shown name lives in display:<user>
// and each one is claimed in alias:<key>, so two accounts can't show the same name nor someone else's username.
const { redis, HttpError, createSession, tokenKey, bearer, requireUser, hashPassword, checkPassword, body, handler } = require('./_lib');
const { RIVALS } = require('./_rivals');

const MAX_FAILURES = 10, LOCK_SECONDS = 15 * 60;

function credentials(data) {
  const name = String(data.username || '').trim().toLowerCase();
  const password = String(data.password || '');
  if (!/^[a-z0-9_.-]{3,20}$/.test(name)) throw new HttpError(400, 'El usuario debe tener entre 3 y 20 letras, números, puntos o guiones.');
  if (password.length < 6 || password.length > 100) throw new HttpError(400, 'La contraseña debe tener al menos 6 caracteres.');
  return { name, password };
}

// "Ana Pérez", "ana perez" and "ana.perez" are the same name: no accents, case, spaces or punctuation.
const aliasKey = text => 'alias:' + text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
const RIVAL_KEYS = new Set(RIVALS.map(r => aliasKey(r.name)));

function cleanDisplay(value) {
  const text = String(value ?? '').normalize('NFC').replace(/\s+/g, ' ').trim();
  if (!text) return '';
  if ([...text].length < 3 || [...text].length > 24 || !/^[\p{L}\p{N} ._'-]+$/u.test(text) || aliasKey(text) === 'alias:')
    throw new HttpError(400, 'El nombre debe tener entre 3 y 24 letras, números, espacios, puntos o guiones.');
  return text;
}

const user = async name => ({ name, display: await redis('GET', 'display:' + name) || name });

async function setDisplay(name, value) {
  const display = cleanDisplay(value), old = await redis('GET', 'display:' + name);
  if (display && display !== name) {
    const key = aliasKey(display);
    if (RIVAL_KEYS.has(key)) throw new HttpError(409, 'Ese nombre es de un rival del dojo. Elegí otro.');
    const owner = await redis('GET', key), lower = display.toLowerCase();
    if ((owner && owner !== name) || (!owner && lower !== name && await redis('GET', 'user:' + lower)))
      throw new HttpError(409, 'Ese nombre ya lo usa otra persona. Elegí otro.');
    if (!owner && await redis('SET', key, name, 'NX') !== 'OK') throw new HttpError(409, 'Ese nombre ya lo usa otra persona. Elegí otro.');
    await redis('SET', 'display:' + name, display);
  } else await redis('DEL', 'display:' + name); // empty or the username itself: back to showing the username
  if (old && aliasKey(old) !== aliasKey(display || name)) await redis('DEL', aliasKey(old));
  return { name, display: display || name };
}

module.exports = handler(async req => {
  if (req.method === 'GET') return { user: await user(await requireUser(req)) };
  if (req.method !== 'POST') throw new HttpError(405, 'Método no permitido.');
  const data = body(req);

  if (data.action === 'logout') {
    const token = bearer(req);
    if (token) await redis('DEL', tokenKey(token));
    return { ok: true };
  }

  if (data.action === 'display') return { user: await setDisplay(await requireUser(req), data.display) };

  const { name, password } = credentials(data);

  if (data.action === 'register') {
    const taken = await redis('GET', aliasKey(name));
    if (taken && taken !== name) throw new HttpError(409, 'Ese usuario ya existe. Elegí otro o entrá con tu contraseña.');
    const created = await redis('SET', 'user:' + name, JSON.stringify({ ...hashPassword(password), created: Date.now() }), 'NX');
    if (!created) throw new HttpError(409, 'Ese usuario ya existe. Elegí otro o entrá con tu contraseña.');
    return { token: await createSession(name), user: { name, display: name } };
  }

  if (data.action === 'login') {
    const failKey = 'fail:' + name;
    if (Number(await redis('GET', failKey)) >= MAX_FAILURES) throw new HttpError(429, 'Demasiados intentos. Esperá 15 minutos y probá de nuevo.');
    const stored = await redis('GET', 'user:' + name);
    if (!stored || !checkPassword(password, JSON.parse(stored))) {
      if (await redis('INCR', failKey) === 1) await redis('EXPIRE', failKey, LOCK_SECONDS);
      throw new HttpError(401, 'Usuario o contraseña incorrectos.');
    }
    await redis('DEL', failKey);
    return { token: await createSession(name), user: await user(name) };
  }

  throw new HttpError(400, 'Acción desconocida.');
});
