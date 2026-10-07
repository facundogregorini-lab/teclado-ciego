// Google Ads tag (gtag.js) settings. Like the Meta Pixel, the ids are public (they go in the page anyway), so the
// account's tag and conversion labels are the defaults; GOOGLE_ADS_ID and GOOGLE_ADS_LABELS change them, and
// GOOGLE_ADS_ID=off turns the tag off. Each Meta event has its Google Ads conversion (same moment, same logic):
//   ViewContent → precios (primary: what the campaign optimizes for, like the active Meta ad set) ·
//   CompleteRegistration → registro · Practica → practica · InitiateCheckout → pago · Purchase → compra (secondary)
// GOOGLE_ADS_LABELS: "registro=AbC123,practica=DeF456,…" (the part after the slash in each event snippet's send_to).
const env = name => (process.env[name] || '').trim();
const DEFAULT_ID = ''; // AW-… of the "Growth Labs" account (5235658460), from Google Ads → Conversions → Tag setup
const DEFAULT_LABELS = {};
const EVENTS = ['registro', 'practica', 'precios', 'pago', 'compra'];

function googleSettings() {
  const raw = env('GOOGLE_ADS_ID') || DEFAULT_ID, id = /^AW-\d{6,15}$/.test(raw) ? raw : '';
  const labels = { ...DEFAULT_LABELS };
  for (const pair of env('GOOGLE_ADS_LABELS').split(',')) {
    const [key, label] = pair.split('=').map(s => (s || '').trim());
    if (EVENTS.includes(key) && /^[\w-]{6,40}$/.test(label)) labels[key] = label;
  }
  return id ? { id, labels } : null;
}

module.exports = { googleSettings, EVENTS };
