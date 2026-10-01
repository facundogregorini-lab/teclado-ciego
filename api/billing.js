// GET: plan info (public part + the user's plan when logged in)
// POST { action: 'play' }: counts one of today's free practices · { action: 'buy' }: Mercado Pago checkout for the
// one-time payment · { action: 'sync' }: asks Mercado Pago again (coming back from paying)
const { redis, HttpError, requireUser, bearer, body, handler } = require('./_lib');
const { FREE_PER_DAY, settings, playsKey, mp, status } = require('./_billing');

async function userInfo(name, options) {
  const { premium, paid, sub, gift } = await status(name, options);
  const plays = Number(await redis('GET', playsKey(name))) || 0;
  return { premium, plays, gift: Boolean(gift), lifetime: Boolean(paid), subscription: sub && { status: sub.status, paidUntil: sub.paidUntil } };
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

  if (data.action === 'buy') {
    if (!s.enabled) throw new HttpError(503, 'Los pagos todavía no están configurados.');
    if ((await status(name)).premium) throw new HttpError(409, 'Ya tenés acceso ilimitado. ¡Gracias por tu aporte!');
    const origin = process.env.APP_URL || 'https://' + req.headers.host;
    const pref = await mp('/checkout/preferences', {
      method: 'POST',
      body: JSON.stringify({
        items: [{ id: 'templo-ilimitado', title: 'Templo Ninja · acceso ilimitado', description: 'Aporte al templo: pago único, sin suscripción', quantity: 1, unit_price: s.price, currency_id: s.currency }],
        external_reference: name,
        metadata: { templo: 'ilimitado' }, // tells this payment apart from the monthly charges of an old subscription
        back_urls: { success: origin + '/?aporte=ok', pending: origin + '/?aporte=ok', failure: origin + '/?aporte=error' },
        auto_return: 'approved',
        notification_url: origin + '/api/mercadopago',
        statement_descriptor: 'TEMPLO NINJA',
      }),
    });
    // With test credentials (TEST-…) the checkout has to be the sandbox one, or Mercado Pago rejects the test users.
    const isTest = (process.env.MP_ACCESS_TOKEN || '').startsWith('TEST-');
    const url = (isTest && pref.sandbox_init_point) || pref.init_point;
    if (!url) throw new HttpError(502, 'Mercado Pago no devolvió el enlace de pago.');
    return { url };
  }

  throw new HttpError(400, 'Acción desconocida.');
});
