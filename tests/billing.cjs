// Freemium + Mercado Pago flow against a fake Mercado Pago API. Run: npm run test:billing
const http = require('node:http'), assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const SITE = 'http://127.0.0.1:4193', MP = 'http://127.0.0.1:4194';
Object.assign(process.env, { MP_ACCESS_TOKEN: 'TEST-token', MP_PRICE: '5000', MP_API_BASE: MP, APP_URL: SITE, TECLADO_PREMIUM_USERS: 'regalo' });
const { createServer } = require('./server.cjs');

// Fake Mercado Pago: subscriptions become "authorized" the first time they are read back (as if the user paid).
const subs = new Map();
const fakeMP = http.createServer(async (req, res) => {
  let raw = ''; for await (const c of req) raw += c;
  const url = new URL(req.url, MP), send = d => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(d)); };
  if (req.headers.authorization !== 'Bearer TEST-token') { res.statusCode = 401; return send({ message: 'bad token' }); }
  if (req.method === 'POST' && url.pathname === '/preapproval') {
    const body = JSON.parse(raw), id = 'pre_' + (subs.size + 1);
    assert.equal(body.auto_recurring.transaction_amount, 5000);
    subs.set(id, { id, status: 'pending', external_reference: body.external_reference, init_point: body.back_url });
    return send(subs.get(id));
  }
  const m = /^\/preapproval\/(pre_\d+)$/.exec(url.pathname);
  if (m && subs.has(m[1])) {
    const s = subs.get(m[1]);
    if (s.status === 'pending') Object.assign(s, { status: 'authorized', next_payment_date: new Date(Date.now() + 30 * 864e5).toISOString() });
    return send(s);
  }
  if (url.pathname === '/preapproval/search') return send({ results: [...subs.values()].filter(s => s.external_reference === url.searchParams.get('external_reference')) });
  res.statusCode = 404; send({ message: 'not found' });
});

const check = (name, ok) => { assert.ok(ok, name); console.log('PASS', name); };
(async () => {
  const site = createServer();
  await Promise.all([new Promise(r => site.listen(4193, '127.0.0.1', r)), new Promise(r => fakeMP.listen(4194, '127.0.0.1', r))]);
  const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
  const errors = [];
  const open = async () => { const p = await (await browser.newContext()).newPage(); p.on('pageerror', e => errors.push(e.message)); await p.goto(SITE); await p.waitForSelector('#planNote:not([hidden])'); return p; };
  // One practice: start the next lesson and type its first key.
  const practice = async p => {
    await p.click('#continue');
    if (await p.isHidden('#lesson')) return false;
    await p.evaluate(() => { const key = document.querySelector('#inner .c').textContent; document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })); });
    await p.waitForTimeout(200); await p.keyboard.press('Escape'); return true;
  };
  const register = async (p, name) => {
    await p.click('#acctBtn'); await p.click('#authMode [data-v="register"]');
    await p.fill('#user', name); await p.fill('#pass', 'secreto1'); await p.click('#authSubmit'); await p.waitForSelector('#acctBtn .nm');
    await p.waitForTimeout(300);
  };
  try {
    // Guest: three free practices a day, counted in this browser
    const guest = await open();
    check('Guests see how many free practices are left', (await guest.textContent('#planNote')).includes('quedan 3 prácticas de 3'));
    await guest.click('#continue'); await guest.keyboard.press('Escape');
    check('Opening a lesson without typing does not use a practice', (await guest.textContent('#planNote')).includes('quedan 3'));
    for (let i = 0; i < 3; i++) check(`Free practice ${i + 1} of 3`, await practice(guest));
    check('The fourth practice shows the plan', !(await practice(guest)) && await guest.isVisible('#planDlg') && (await guest.textContent('#planReason')).includes('3 prácticas'));
    check('Guests are asked to sign in to subscribe', (await guest.textContent('#planSubmit')).includes('Crear cuenta') && await guest.isHidden('#planEmailLabel'));
    await guest.click('#planClose'); await guest.reload(); await guest.waitForSelector('#planNote:not([hidden])');
    check('Reloading does not reset the daily limit', (await guest.textContent('#planNote')).includes('ya usaste'));

    // Account: the limit is counted on the server
    const ana = await open(); await register(ana, 'ana');
    for (let i = 0; i < 3; i++) await practice(ana);
    await ana.waitForTimeout(300);
    const ana2 = await open();
    await ana2.click('#acctBtn'); await ana2.fill('#user', 'ana'); await ana2.fill('#pass', 'secreto1'); await ana2.click('#authSubmit');
    await ana2.waitForFunction(() => document.querySelector('#planNote').textContent.includes('ya usaste'));
    check('The daily limit follows the account to another browser', !(await practice(ana2)) && await ana2.isVisible('#planDlg'));
    await ana2.click('#planSubmit'); await ana2.waitForFunction(() => document.querySelector('#planErr').textContent);
    check('Subscribing needs the Mercado Pago email', (await ana2.textContent('#planErr')).includes('email'));
    await ana2.fill('#planEmail', 'ana@example.com');
    await Promise.all([ana2.waitForURL(/suscripcion=ok/), ana2.click('#planSubmit')]);
    await ana2.waitForFunction(() => document.querySelector('#toast').textContent.includes('Gracias'));
    check('Coming back from Mercado Pago activates the plan', await ana2.isHidden('#planNote') && !ana2.url().includes('suscripcion'));
    check('Subscribers practice without limit', await practice(ana2) && await practice(ana2));
    await ana2.click('#acctBtn'); await ana2.waitForFunction(() => document.querySelector('#planStatus').textContent.includes('activo'));
    check('The account shows the active plan', await ana2.isHidden('#upgrade'));
    await ana2.click('#acctClose');

    // Server side
    const bob = await open(); await register(bob, 'bobo');
    const token = await bob.evaluate(() => localStorage.getItem('teclado-ciego-token'));
    const play = () => fetch(SITE + '/api/billing', { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'play' }) });
    const codes = []; for (let i = 0; i < 4; i++) codes.push((await play()).status);
    check('The server allows three practices and blocks the fourth', codes.join() === '200,200,200,402');
    subs.get('pre_1').status = 'cancelled';
    const hook = await fetch(SITE + '/api/mercadopago', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'subscription_preapproval', data: { id: 'pre_1' } }) });
    const anaToken = await ana2.evaluate(() => localStorage.getItem('teclado-ciego-token'));
    const plan = await (await fetch(SITE + '/api/billing', { headers: { Authorization: 'Bearer ' + anaToken } })).json();
    check('A cancelled plan lasts until the paid period ends', hook.status === 200 && plan.premium && plan.subscription.status === 'cancelled');
    const gift = await open(); await register(gift, 'regalo');
    await gift.waitForFunction(() => document.querySelector('#planNote').hidden);
    check('Courtesy users are unlimited', true);
    check('No uncaught browser errors', errors.length === 0);
  } finally {
    await browser.close(); site.close(); fakeMP.close();
    if (errors.length) console.error(errors);
  }
})().catch(err => { console.error(err); process.exit(1); });
