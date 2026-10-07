// The admin panel (admin.html, api/admin.js): the key, the accounts from the database joined with a fake PostHog.
const http = require('node:http'), assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const PH = 'http://127.0.0.1:4196';
Object.assign(process.env, { POSTHOG_HOST: PH, POSTHOG_PROJECT_ID: '642163', ADMIN_TEST_USERS: 'prueba' });
const { createServer } = require('./server.cjs');
const SITE = 'http://127.0.0.1:4195';
const check = (name, ok) => { assert.ok(ok, name); console.log('PASS', name); };
const api = async (path, payload, token) => (await fetch(SITE + '/api/' + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: JSON.stringify(payload) })).json();
const admin = (key, days = 30) => fetch(SITE + '/api/admin?days=' + days, { headers: key ? { 'X-Admin-Key': key } : {} });

// Fake PostHog query API: answers each of the panel's four queries by what it selects.
const queries = [];
const fakePH = http.createServer(async (req, res) => {
  let raw = ''; for await (const c of req) raw += c;
  const send = d => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(d)); };
  if (req.headers.authorization !== 'Bearer phx_test' || req.url !== '/api/projects/642163/query/') { res.statusCode = 401; return send({ detail: 'bad key' }); }
  const q = JSON.parse(raw).query.query; queries.push(q);
  if (q.includes('person_distinct_ids')) return send({ columns: ['distinct_id', 'person_id'], results: [['ana', 'p-ana'], ['beto', 'p-beto']] });
  if (q.includes('GROUP BY person_id')) return send({
    columns: ['person_id', 'first_seen', 'signed_up', 'last_seen', 'days', 'sessions', 'pageviews', 'started', 'completed', 'minutes', 'sections', 'pricing', 'pricing_reasons', 'checkout_clicked', 'checkout_started', 'paid', 'challenges', 'signup_from', 'utm_source', 'utm_content', 'referrer', 'device', 'os', 'city'],
    results: [
      ['p-ana', '2026-10-04T22:00:00.123000Z', '1970-01-01T00:00:00Z', '2026-10-06T10:00:00Z', ['2026-10-04', '2026-10-06'], 3, 5, 6, 5, 9.5, ['teclado-ciego'], 2, ['limit'], 1, 1, 0, 0, 'plan', 'meta', 'velocidad', 'instagram.com', 'Mobile', 'Android', '<b>Tandil</b>'],
      ['p-beto', '2026-10-05T10:00:00Z', '2026-10-05T10:05:00Z', '2026-10-05T10:30:00Z', ['2026-10-05'], 1, 1, 0, 0, 0, [], 0, [], 0, 0, 0, 1, 'account', null, null, '$direct', 'Desktop', 'Windows', null],
    ] });
  if (q.includes('GROUP BY d')) return send({ columns: ['d', 'v', 's', 'r'], results: [['2026-10-04', 20, 5, 1], ['2026-10-05', 30, 8, 2]] });
  return send({ columns: [], results: [[100, 40, 30, 12, 3, 2, 1, 0]] });
});

(async () => {
  const server = createServer(); await new Promise(r => server.listen(4195, '127.0.0.1', r));
  await new Promise(r => fakePH.listen(4196, '127.0.0.1', r));
  const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
  const errors = [];
  try {
    delete process.env.ADMIN_KEY; delete process.env.FEEDBACK_KEY; delete process.env.POSTHOG_PERSONAL_API_KEY;
    check('Without ADMIN_KEY nobody can read the panel', (await admin('algo')).status === 503);
    process.env.FEEDBACK_KEY = 'te-verde';
    check('…FEEDBACK_KEY works while ADMIN_KEY is not set', (await admin('te-verde')).status === 200);
    process.env.ADMIN_KEY = 'llave-del-templo';
    check('With ADMIN_KEY, the feedback key no longer opens it', (await admin('te-verde')).status === 401);
    check('A wrong key is refused', (await admin('otra')).status === 401 && (await admin()).status === 401);

    const ana = await api('auth', { action: 'register', username: 'ana', password: 'secreto1' });
    await api('data', { type: 'finish', entry: { lesson: 'fj', name: 'F y J', stars: 3, ppm: 31, acc: 97, ms: 120000 }, progress: { lessons: { fj: { stars: 3, ppm: 31, acc: 97 } }, tests: [{ method: 'ciegas', ppm: 42, acc: 95, date: Date.now() - 2 * 864e5 }] } }, ana.token);
    await api('auth', { action: 'register', username: 'beto', password: 'secreto1' });
    await api('auth', { action: 'register', username: 'prueba', password: 'secreto1' });
    await api('auth', { action: 'register', username: 'nuevo', password: 'secreto1' });

    let d = await (await admin('llave-del-templo')).json();
    check('Lists every account in the database', d.users.map(u => u.name).join() === 'ana,beto,nuevo,prueba');
    const a = d.users.find(u => u.name === 'ana');
    check('Reads progress, practice and its days', a.practice.lessons === 1 && a.practice.sessions === 1 && a.practice.bestPpm === 42 && a.practice.days.length === 2 && a.practice.minutes === 2);
    check('Marks the accounts of ADMIN_TEST_USERS', d.users.find(u => u.name === 'prueba').test && !a.test);
    check('Without the PostHog personal key, says so and still answers', /POSTHOG_PERSONAL_API_KEY/.test(d.posthog.error) && !queries.length);

    process.env.POSTHOG_PERSONAL_API_KEY = 'phx_test';
    d = await (await admin('llave-del-templo', 7)).json();
    check('Joins PostHog by username', d.posthog.users.ana.utmContent === 'velocidad' && d.posthog.users.ana.checkoutStarted === 1 && d.posthog.users.beto.challenges === 1);
    check('An empty sign-up date is null, not 1970', d.posthog.users.ana.signedUp === null && d.posthog.users.beto.signedUp === Date.parse('2026-10-05T10:05:00Z'));
    check('The period reaches the queries', d.days === 7 && queries.some(q => q.includes('INTERVAL 7 DAY')));
    check('Funnel and daily visits come back', d.posthog.funnel.visitors === 100 && d.posthog.funnel.signedUp === 3 && d.posthog.daily.length === 2);

    const p = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage(); p.on('pageerror', e => errors.push(e.message));
    await p.goto(SITE + '/admin');
    check('/admin asks for the key first', await p.isVisible('#key') && await p.isHidden('#panel'));
    await p.fill('#key', 'mal'); await p.click('#enter');
    await p.waitForFunction(() => document.querySelector('#err').textContent);
    check('A wrong key shows the error', (await p.textContent('#err')).includes('Clave incorrecta'));
    await p.fill('#key', 'llave-del-templo'); await p.click('#enter');
    await p.waitForSelector('#panel:not([hidden])');
    check('Test accounts are hidden by default', (await p.$$('#users tbody tr')).length === 3 && !(await p.textContent('#users')).includes('prueba'));
    await p.uncheck('#hideTest');
    check('…and shown on demand', (await p.$$('#users tbody tr')).length === 4);
    await p.check('#hideTest');
    const row = await p.textContent('#users tr[data-u="ana"]');
    check('A row shows origin, return and funnel step', row.includes('Meta · velocidad') && row.includes('Sí · ') && row.includes('Mercado Pago'));
    check('Accounts without PostHog data still appear', (await p.textContent('#users tr[data-u="nuevo"]')).includes('Se registró'));
    check('Text from PostHog is escaped', !(await p.$('#users b b')) && (await p.textContent('#users tr[data-u="ana"]')).includes('<b>Tandil</b>'));
    await p.click('#users tr[data-u="beto"]');
    check('Clicking a row shows its detail', (await p.textContent('#detail h3')) === 'beto' && (await p.textContent('#detail')).includes('Retos aceptados'));
    check('KPIs and funnel are drawn', (await p.textContent('#kpis')).includes('Cuentas') && (await p.$$('#funnel .frow')).length === 8 && await p.isVisible('#daily svg'));
    await p.fill('#q', 'ana');
    check('Search filters the table', (await p.$$('#users tbody tr')).length === 1);
    await p.reload(); await p.waitForSelector('#panel:not([hidden])');
    check('The key is kept for this tab', await p.isVisible('#logout') && await p.isHidden('#gate'));
    await p.click('#logout');
    check('Salir hides the panel and asks again', await p.isHidden('#panel') && await p.isVisible('#key'));
    check('Practice counts read naturally', !(await p.textContent('#users')).includes('1 lecciones'));

    const m = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage(); m.on('pageerror', e => errors.push(e.message));
    await m.goto(SITE + '/admin'); await m.fill('#key', 'llave-del-templo'); await m.click('#enter'); await m.waitForSelector('#panel:not([hidden])');
    check('On a phone the page does not scroll sideways', await m.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    check('No errors on the page', errors.length === 0);
  } finally {
    await browser.close(); server.close(); fakePH.close();
  }
})().catch(err => { console.error(err); process.exit(1); });
