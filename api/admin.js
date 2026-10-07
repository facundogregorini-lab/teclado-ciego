// The registered accounts, for admin.html (/admin): every account in Redis with its progress, practice days, plan and
// sign-up context, joined with what PostHog saw of the same person (funnel steps, visits, origin, device).
// GET with the header X-Admin-Key = ADMIN_KEY (or FEEDBACK_KEY while ADMIN_KEY is not set). ?days=N for the funnel
// and the daily chart (30 by default). Accounts in ADMIN_TEST_USERS (comma separated) come marked as tests.
const crypto = require('node:crypto');
const { redis, HttpError, handler } = require('./_lib');
const { scores } = require('./_ranks');
const posthog = require('./_posthog');

const FAILURES = 10, LOCK_SECONDS = 15 * 60, CHUNK = 200, PARALLEL = 20, MAX_HISTORY = 100;
const env = name => (process.env[name] || '').trim();
const hash = text => crypto.createHash('sha256').update(String(text)).digest();
const ipKey = req => hash(String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || 'local').toString('hex').slice(0, 24);
const parse = text => { try { return text ? JSON.parse(text) : null; } catch { return null; } };
// Calendar day in Argentina (UTC-3, no daylight saving), like the free plan's daily count.
const dayOf = ms => new Date(ms - 3 * 3600e3).toISOString().slice(0, 10);
const list = value => value.toLowerCase().split(',').map(s => s.trim()).filter(Boolean);

async function authorize(req) {
  const key = env('ADMIN_KEY') || env('FEEDBACK_KEY');
  if (!key) throw new HttpError(503, 'Falta la variable ADMIN_KEY en Vercel: agregala (es la clave de este panel) y hacé Redeploy.');
  const failKey = 'admfail:' + ipKey(req);
  if (Number(await redis('GET', failKey)) >= FAILURES) throw new HttpError(429, 'Demasiados intentos. Esperá 15 minutos.');
  if (!crypto.timingSafeEqual(hash(req.headers['x-admin-key'] || ''), hash(key))) {
    if (await redis('INCR', failKey) === 1) await redis('EXPIRE', failKey, LOCK_SECONDS);
    throw new HttpError(401, 'Clave incorrecta.');
  }
}

// Every username, from the user:<name> keys.
async function usernames() {
  const names = new Set();
  let cursor = '0';
  do {
    const [next, keys] = await redis('SCAN', cursor, 'MATCH', 'user:*', 'COUNT', 1000);
    for (const key of keys || []) names.add(String(key).slice(5));
    cursor = String(next);
  } while (cursor !== '0');
  return [...names].sort();
}

async function mget(keys) {
  const out = [];
  for (let i = 0; i < keys.length; i += CHUNK) out.push(...(await redis('MGET', ...keys.slice(i, i + CHUNK)) || []));
  return out;
}

async function inBatches(items, fn) {
  const out = [];
  for (let i = 0; i < items.length; i += PARALLEL) out.push(...await Promise.all(items.slice(i, i + PARALLEL).map(fn)));
  return out;
}

// UTM and referrer of the last page the account came from (api/_meta.js keeps it 90 days).
function origin(ctx) {
  if (!ctx?.url) return null;
  try {
    const u = new URL(ctx.url);
    return { utm_source: u.searchParams.get('utm_source'), utm_content: u.searchParams.get('utm_content'), utm_campaign: u.searchParams.get('utm_campaign'), host: u.hostname };
  } catch { return null; }
}

async function accounts() {
  const names = await usernames();
  const today = dayOf(Date.now());
  const fields = ['user', 'display', 'progress', 'ninja', 'paid', 'sub', 'meta'];
  const [stored, plays] = await Promise.all([
    Promise.all(fields.map(f => mget(names.map(n => f + ':' + n)))),
    mget(names.map(n => 'plays:' + n + ':' + today)),
  ]);
  const histories = await inBatches(names, n => redis('LRANGE', 'history:' + n, 0, MAX_HISTORY - 1).then(h => (h || []).map(parse).filter(Boolean)));
  const tests = new Set(list(env('ADMIN_TEST_USERS'))), gifts = new Set(list(env('TECLADO_PREMIUM_USERS')));

  return names.map((name, i) => {
    const [user, display, progress, ninja, paid, sub, meta] = fields.map((_, f) => f < 2 ? stored[f][i] : parse(stored[f][i]));
    const created = parse(user)?.created || null;
    const p = progress ? { ...progress, ninja: ninja || progress.ninja } : null;
    const history = histories[i];
    // Days with saved practice: lessons, speed measurements, mock tests and 5-minute challenges.
    const dates = [...history.map(h => h.date), ...(p?.tests || []).map(t => t.date), ...(p?.sims || []).map(t => t.date), ...(ninja?.runs || []).map(r => r.date)].filter(d => d > 0);
    const s = p ? scores(p) : null;
    const cog = Object.values(p?.cog || {});
    return {
      name, display: display && display !== name ? display : null, created,
      test: tests.has(name), gift: gifts.has(name),
      paid: paid ? { amount: paid.amount, currency: paid.currency, date: paid.date } : null,
      sub: sub ? { status: sub.status, paidUntil: sub.paidUntil } : null,
      playsToday: Number(plays[i]) || 0,
      practice: {
        sessions: history.length, lessons: Object.values(p?.lessons || {}).filter(r => r.stars >= 1).length,
        speedTests: (p?.tests || []).length, bestPpm: s?.speed || null,
        cogDone: cog.filter(r => r.stars >= 1).length, sims: (p?.sims || []).length,
        ninjaRuns: (ninja?.runs || []).length, bestIq: ninja?.best?.iq || null,
        minutes: Math.round(history.reduce((sum, h) => sum + (h.ms || 0), 0) / 6000) / 10,
        last: dates.length ? Math.max(...dates) : null,
        days: [...new Set(dates.map(dayOf))].sort(),
      },
      origin: origin(meta),
    };
  });
}

// PostHog: one row per identified person (the account's username is its distinct id), the funnel and visits per day.
const PERSON = `SELECT person_id, min(timestamp) AS first_seen, minIf(timestamp, event = 'signed_up') AS signed_up,
    maxIf(timestamp, event NOT IN ('$web_vitals', '$pageleave', '$set')) AS last_seen,
    groupUniqArray(toString(toDate(toTimeZone(timestamp, 'America/Argentina/Buenos_Aires')))) AS days,
    uniqExact(\`$session_id\`) AS sessions, countIf(event = '$pageview') AS pageviews,
    countIf(event = 'practice_started') AS started, countIf(event = 'practice_completed') AS completed,
    round(sumIf(toFloat(properties.duration_ms), event = 'practice_completed') / 60000, 1) AS minutes,
    groupUniqArrayIf(toString(properties.section), event = 'practice_completed') AS sections,
    countIf(event = 'pricing_viewed') AS pricing, groupUniqArrayIf(toString(properties.reason), event = 'pricing_viewed') AS pricing_reasons,
    countIf(event = 'checkout_clicked') AS checkout_clicked, countIf(event = 'checkout_started') AS checkout_started,
    countIf(event = 'payment_succeeded') AS paid, countIf(event = 'challenge_accepted') AS challenges,
    anyIf(toString(properties.source), event = 'signed_up') AS signup_from,
    argMinIf(toString(properties.utm_source), timestamp, properties.utm_source IS NOT NULL) AS utm_source,
    argMinIf(toString(properties.utm_content), timestamp, properties.utm_content IS NOT NULL) AS utm_content,
    argMinIf(toString(properties.$referring_domain), timestamp, event = '$pageview') AS referrer,
    argMinIf(toString(properties.$device_type), timestamp, event = '$pageview') AS device,
    argMinIf(toString(properties.$os), timestamp, event = '$pageview') AS os,
    argMinIf(toString(properties.$geoip_city_name), timestamp, event = '$pageview') AS city
  FROM events WHERE person_id IN (SELECT id FROM persons WHERE is_identified) GROUP BY person_id LIMIT 10000`;
const IDS = `SELECT distinct_id, toString(person_id) FROM person_distinct_ids
  WHERE person_id IN (SELECT id FROM persons WHERE is_identified) AND NOT match(distinct_id, '^[0-9a-f]{8}-') LIMIT 50000`;
const FUNNEL = days => `SELECT uniqIf(person_id, event = '$pageview'), uniqIf(person_id, event = 'practice_started'),
    uniqIf(person_id, event = 'practice_completed'), uniqIf(person_id, event = 'pricing_viewed'), uniqIf(person_id, event = 'signed_up'),
    uniqIf(person_id, event = 'checkout_clicked'), uniqIf(person_id, event = 'checkout_started'), uniqIf(person_id, event = 'payment_succeeded')
  FROM events WHERE timestamp > now() - INTERVAL ${days} DAY`;
const DAILY = days => `SELECT toString(toDate(toTimeZone(timestamp, 'America/Argentina/Buenos_Aires'))) AS d,
    uniqIf(person_id, event = '$pageview'), uniqIf(person_id, event = 'practice_started'), uniqIf(person_id, event = 'signed_up')
  FROM events WHERE timestamp > now() - INTERVAL ${days} DAY GROUP BY d ORDER BY d`;

const time = v => { const t = Date.parse(v && !/Z|[+-]\d\d:?\d\d$/.test(v) ? v + 'Z' : v); return t > Date.UTC(2001, 0) ? t : null; };
const text = v => v == null || v === '' || v === 'null' ? null : String(v);

async function analytics(days) {
  const s = posthog.posthogSettings();
  if (!s.personalKey || !s.projectId) return { error: 'Faltan POSTHOG_PERSONAL_API_KEY y POSTHOG_PROJECT_ID en Vercel: sin ellas el panel muestra solo lo que hay en la base.' };
  try {
    const [people, ids, funnel, daily] = await Promise.all([PERSON, IDS, FUNNEL(days), DAILY(days)].map(q => posthog.query(q)));
    const col = people.columns, byPerson = new Map(people.results.map(r => [String(r[0]), Object.fromEntries(col.map((c, i) => [c, r[i]]))]));
    const users = {};
    for (const [id, person] of ids.results) {
      const r = byPerson.get(String(person));
      if (!r) continue;
      users[id] = {
        firstSeen: time(r.first_seen), signedUp: time(r.signed_up), lastSeen: time(r.last_seen), days: (r.days || []).sort(),
        sessions: r.sessions, pageviews: r.pageviews, started: r.started, completed: r.completed, minutes: r.minutes || 0,
        sections: (r.sections || []).filter(text), pricing: r.pricing, pricingReasons: (r.pricing_reasons || []).filter(text),
        checkoutClicked: r.checkout_clicked, checkoutStarted: r.checkout_started, paid: r.paid, challenges: r.challenges,
        signupFrom: text(r.signup_from), utmSource: text(r.utm_source), utmContent: text(r.utm_content),
        referrer: text(r.referrer), device: text(r.device), os: text(r.os), city: text(r.city),
      };
    }
    const f = funnel.results[0] || [];
    const steps = ['visitors', 'started', 'completed', 'pricing', 'signedUp', 'checkoutClicked', 'checkoutStarted', 'paid'];
    return {
      users,
      funnel: Object.fromEntries(steps.map((k, i) => [k, Number(f[i]) || 0])),
      daily: daily.results.map(([d, visitors, started, signedUp]) => ({ d, visitors, started, signedUp })),
    };
  } catch (error) {
    console.error('Admin PostHog', error.message);
    return { error: 'PostHog no respondió: ' + error.message };
  }
}

module.exports = handler(async req => {
  if (req.method !== 'GET') throw new HttpError(405, 'Método no permitido.');
  await authorize(req);
  const days = Math.min(365, Math.max(1, Math.round(Number(new URL(req.url, 'http://x').searchParams.get('days')) || 30)));
  const [users, ph] = await Promise.all([accounts(), analytics(days)]);
  return { generated: Date.now(), days, users, posthog: ph };
});
