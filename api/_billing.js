// Freemium rules and Mercado Pago payments.
// Free plan: FREE_PER_DAY practice sessions per day. Unlimited access: a one-time payment ("aporte al templo",
// Checkout Pro) that never expires. Monthly subscriptions (preapproval API) from before still count until they end.
const { redis, HttpError } = require('./_lib');

const DAY_MS = 86400e3, GRACE_MS = 3 * DAY_MS, FREE_PER_DAY = 3;
const env = name => (process.env[name] || '').trim();

function settings() {
  const token = env('MP_ACCESS_TOKEN'), price = Number(env('MP_PRICE'));
  return {
    enabled: Boolean(token && price > 0),
    token, price,
    currency: env('MP_CURRENCY') || 'ARS',
    label: env('PRICE_LABEL') || (price > 0 ? '$ ' + price.toLocaleString('es-AR') + ' · pago único' : ''),
    api: env('MP_API_BASE') || 'https://api.mercadopago.com',
    freeUsers: env('TECLADO_PREMIUM_USERS').toLowerCase().split(',').map(s => s.trim()).filter(Boolean),
  };
}

// Calendar day in Argentina (UTC-3, no daylight saving).
const today = () => new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);
const playsKey = name => 'plays:' + name + ':' + today();

async function mp(path, options = {}) {
  const s = settings();
  const response = await fetch(s.api + path, {
    ...options,
    headers: { Authorization: 'Bearer ' + s.token, 'Content-Type': 'application/json', ...options.headers },
  }).catch(error => {
    console.error('Mercado Pago unreachable', error.message);
    throw new HttpError(502, 'No pudimos conectarnos con Mercado Pago. Probá de nuevo en un rato.');
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error('Mercado Pago', response.status, JSON.stringify(json));
    throw new HttpError(502, 'Mercado Pago no respondió bien: ' + (json.message || response.status));
  }
  return json;
}

const readSub = async name => JSON.parse(await redis('GET', 'sub:' + name) || 'null');
const readPaid = async name => JSON.parse(await redis('GET', 'paid:' + name) || 'null');

// Stores an approved one-time payment: from then on, the account is unlimited for good.
async function storePayment(payment) {
  const name = String(payment.external_reference || '');
  if (payment.status !== 'approved' || payment.metadata?.templo !== 'ilimitado' || !/^[a-z0-9_.-]{3,20}$/.test(name)) return null;
  const paid = { id: payment.id, amount: Number(payment.transaction_amount) || 0, date: Date.parse(payment.date_approved || '') || Date.now() };
  await redis('SET', 'paid:' + name, JSON.stringify(paid));
  return paid;
}

// Looks for an approved payment of this account (coming back from Mercado Pago, or a webhook that never arrived).
async function findPayment(name) {
  if (!settings().enabled) return null;
  try {
    const found = await mp('/v1/payments/search?external_reference=' + encodeURIComponent(name) + '&status=approved&sort=date_created&criteria=desc');
    const approved = (found.results || []).find(p => p.status === 'approved' && p.metadata?.templo === 'ilimitado');
    return approved ? await storePayment(approved) : null;
  } catch (error) {
    console.error('Could not look for payments', error.message);
    return null;
  }
}

// Stores what Mercado Pago says about a subscription. Access lasts until the next charge (+3 days of grace).
async function storeSubscription(pre) {
  const name = String(pre.external_reference || '');
  if (!/^[a-z0-9_.-]{3,20}$/.test(name)) return null;
  const old = await readSub(name);
  let paidUntil = old?.id === pre.id ? old.paidUntil || 0 : 0;
  if (pre.status === 'authorized') {
    const next = Date.parse(pre.next_payment_date || '') || Date.now() + 31 * DAY_MS;
    paidUntil = Math.max(paidUntil, next + GRACE_MS);
  }
  // An older authorized subscription keeps priority over a new pending attempt.
  if (old && old.id !== pre.id && old.paidUntil > Date.now() && pre.status !== 'authorized') return old;
  const sub = { id: pre.id, status: pre.status, paidUntil, updated: Date.now() };
  await redis('SET', 'sub:' + name, JSON.stringify(sub));
  return sub;
}

async function refresh(name, sub) {
  if (!settings().enabled) return sub;
  try {
    if (sub?.id) return await storeSubscription(await mp('/preapproval/' + encodeURIComponent(sub.id)));
    const found = await mp('/preapproval/search?external_reference=' + encodeURIComponent(name) + '&sort=date_created:desc');
    const best = (found.results || []).find(p => p.status === 'authorized') || found.results?.[0];
    return best ? await storeSubscription(best) : sub;
  } catch (error) {
    console.error('Could not refresh subscription', error.message);
    return sub;
  }
}

// { premium, paid, sub }. Refreshes from Mercado Pago when asked, or when a stored subscription is pending or about to lapse.
async function status(name, { forceRefresh = false } = {}) {
  const s = settings();
  if (s.freeUsers.includes(name)) return { premium: true, sub: null, gift: true };
  const paid = await readPaid(name) || (forceRefresh ? await findPayment(name) : null);
  if (paid) return { premium: true, paid, sub: null };
  let sub = await readSub(name);
  const stale = sub && Date.now() - sub.updated > 10 * 60e3;
  const unsure = sub && (sub.status === 'pending' || (sub.status === 'authorized' && sub.paidUntil < Date.now() + DAY_MS));
  if (forceRefresh || (stale && unsure)) sub = await refresh(name, sub);
  return { premium: Boolean(sub && sub.paidUntil > Date.now()), sub };
}

async function isPremium(name) {
  return !settings().enabled || (await status(name)).premium;
}

module.exports = { FREE_PER_DAY, settings, today, playsKey, mp, storeSubscription, storePayment, status, isPremium };
