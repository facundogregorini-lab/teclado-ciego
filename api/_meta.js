// Meta Pixel settings and the Conversions API. The pixel id is public (it goes in the page anyway), so the
// "Templo Ninja Web" pixel is the default; META_PIXEL_ID changes it, and META_PIXEL_ID=off turns it off.
// The purchase is also sent from the server (with the same event id as the browser, so Meta counts it once),
// because ad blockers and Safari often stop the pixel right when it matters.
const crypto = require('node:crypto');
const env = name => (process.env[name] || '').trim();
const DEFAULT_PIXEL = '2167285730522630';

function metaSettings() {
  const id = env('META_PIXEL_ID') || DEFAULT_PIXEL, pixel = /^\d{6,20}$/.test(id) ? id : '';
  return { pixel, token: pixel && env('META_CAPI_TOKEN'), graph: env('META_GRAPH_BASE') || 'https://graph.facebook.com/' + (env('META_GRAPH_VERSION') || 'v23.0') };
}

const sha256 = s => crypto.createHash('sha256').update(String(s).trim().toLowerCase()).digest('hex');
const purchaseId = paymentId => 'pay_' + paymentId; // the same id the page uses for its Purchase event

// Sends the Purchase of a one-time payment. Never throws: a failed report must not break the payment.
async function reportPurchase(name, payment) {
  const s = metaSettings();
  if (!s.token) return false;
  const meta = payment.metadata || {};
  const event = {
    event_name: 'Purchase',
    event_time: Math.floor((Date.parse(payment.date_approved || '') || Date.now()) / 1000),
    event_id: purchaseId(payment.id),
    action_source: 'website',
    event_source_url: (env('APP_URL') || 'https://teclado-ciego.vercel.app') + '/',
    user_data: {
      external_id: [sha256(name)],
      ...(meta.fbp ? { fbp: String(meta.fbp) } : {}),
      ...(meta.fbc ? { fbc: String(meta.fbc) } : {}),
      ...(meta.ua ? { client_user_agent: String(meta.ua) } : {}),
    },
    custom_data: { currency: payment.currency_id || 'ARS', value: Number(payment.transaction_amount) || 0, content_name: 'Templo Ninja · acceso ilimitado' },
  };
  try {
    const response = await fetch(`${s.graph}/${s.pixel}/events?access_token=${encodeURIComponent(s.token)}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: [event] }),
    });
    if (!response.ok) console.error('Meta Conversions API', response.status, await response.text().catch(() => ''));
    return response.ok;
  } catch (error) {
    console.error('Meta Conversions API unreachable', error.message);
    return false;
  }
}

module.exports = { metaSettings, reportPurchase, purchaseId, sha256 };
