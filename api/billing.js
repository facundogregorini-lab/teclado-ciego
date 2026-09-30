// GET: plan info (public part + the user's plan when logged in)
// POST { action: 'play' }: counts one of today's free practices · { action: 'subscribe', email } · { action: 'sync' }
const { redis, HttpError, requireUser, bearer, body, handler } = require('./_lib');
const { FREE_PER_DAY, settings, playsKey, mp, storeSubscription, status } = require('./_billing');

async function userInfo(name, options) {
  const { premium, sub, gift } = await status(name, options);
  const plays = Number(await redis('GET', playsKey(name))) || 0;
  return { premium, plays, gift: Boolean(gift), subscription: sub && { status: sub.status, paidUntil: sub.paidUntil } };
}

module.exports = handler(async req => {
  const s = settings();
  const base = { enabled: s.enabled, price: s.label, freePerDay: FREE_PER_DAY };

  if (req.method === 'GET') {
    if (!bearer(req)) return base;
    return { ...base, ...await userInfo(await requireUser(req)) };
  }
  if (req.method !== 'POST') throw new HttpError(405, 'Método no permitido.');
  const name = await requireUser(req);
  const data = body(req);

  if (data.action === 'play') {
    if (!s.enabled || (await status(name)).premium) return { ok: true };
    const count = await redis('INCR', playsKey(name));
    if (count === 1) await redis('EXPIRE', playsKey(name), 2 * 86400);
    if (count > FREE_PER_DAY) throw new HttpError(402, `Ya usaste tus ${FREE_PER_DAY} prácticas gratis de hoy.`);
    return { ok: true, plays: count };
  }

  if (data.action === 'sync') return { ...base, ...await userInfo(name, { forceRefresh: true }) };

  if (data.action === 'subscribe') {
    if (!s.enabled) throw new HttpError(503, 'Los pagos todavía no están configurados.');
    const email = String(data.email || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'Escribí el email de tu cuenta de Mercado Pago.');
    const origin = process.env.APP_URL || 'https://' + req.headers.host;
    const pre = await mp('/preapproval', {
      method: 'POST',
      body: JSON.stringify({
        reason: 'Teclado Ciego Ilimitado',
        external_reference: name,
        payer_email: email,
        back_url: origin + '/?suscripcion=ok',
        status: 'pending',
        auto_recurring: { frequency: 1, frequency_type: 'months', transaction_amount: s.price, currency_id: s.currency },
      }),
    });
    await storeSubscription(pre);
    if (!pre.init_point) throw new HttpError(502, 'Mercado Pago no devolvió el enlace de pago.');
    return { url: pre.init_point };
  }

  throw new HttpError(400, 'Acción desconocida.');
});
