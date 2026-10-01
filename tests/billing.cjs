// Freemium + Mercado Pago flow against a fake Mercado Pago API. Run: npm run test:billing
const http = require('node:http'), assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const SITE = 'http://127.0.0.1:4193', MP = 'http://127.0.0.1:4194';
Object.assign(process.env, { MP_ACCESS_TOKEN: 'TEST-token', MP_PRICE: '4900', MP_API_BASE: MP, APP_URL: SITE, TECLADO_PREMIUM_USERS: 'regalo' });
const { createServer } = require('./server.cjs');

// Fake Mercado Pago. Checkout: creating a preference is as if the user paid right away (an approved payment
// with the same reference and metadata). Old monthly subscriptions can still be read back.
const subs = new Map(), payments = new Map();
const fakeMP = http.createServer(async (req, res) => {
  let raw = ''; for await (const c of req) raw += c;
  const url = new URL(req.url, MP), send = d => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(d)); };
  if (req.headers.authorization !== 'Bearer TEST-token') { res.statusCode = 401; return send({ message: 'bad token' }); }
  if (req.method === 'POST' && url.pathname === '/checkout/preferences') {
    const body = JSON.parse(raw), id = 'pay_' + (payments.size + 1);
    assert.equal(body.items[0].unit_price, 4900); assert.equal(body.items[0].quantity, 1);
    assert.ok(!body.auto_recurring && body.notification_url.endsWith('/api/mercadopago'));
    payments.set(id, { id, status: 'approved', transaction_amount: 4900, external_reference: body.external_reference, metadata: body.metadata });
    // The token is a test one (TEST-…): the app must send the user to the sandbox checkout, not the real one.
    return send({ id: 'pref_' + id, init_point: MP + '/checkout-real', sandbox_init_point: body.back_urls.success + '&sandbox=1' });
  }
  const pay = /^\/v1\/payments\/(pay_\d+)$/.exec(url.pathname);
  if (pay && payments.has(pay[1])) return send(payments.get(pay[1]));
  if (url.pathname === '/v1/payments/search') return send({ results: [...payments.values()].filter(p => p.external_reference === url.searchParams.get('external_reference') && p.status === url.searchParams.get('status')) });
  const m = /^\/preapproval\/(pre_\d+)$/.exec(url.pathname);
  if (m && subs.has(m[1])) return send(subs.get(m[1]));
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
    check('The plan is a one-time contribution to the temple', (await guest.textContent('#planPrice')) === '$ 4.900 · pago único' && (await guest.textContent('#planDlg')).includes('Los monjes ninja te lo agradecerán') && (await guest.textContent('#planDlg')).includes('sin suscripción'));
    check('Guests are asked to sign in to pay', (await guest.textContent('#planSubmit')).includes('Crear cuenta'));
    await guest.click('#planClose'); await guest.reload(); await guest.waitForSelector('#planNote:not([hidden])');
    check('Reloading does not reset the daily limit', (await guest.textContent('#planNote')).includes('ya usaste'));
    await guest.click('#cogCta'); await guest.click('#cogContinue');
    check('The interview training uses the same daily limit', await guest.isVisible('#planDlg') && await guest.isHidden('#quiz'));
    await guest.click('#planClose');

    // Account: the limit is counted on the server
    const ana = await open(); await register(ana, 'ana');
    for (let i = 0; i < 3; i++) await practice(ana);
    await ana.waitForTimeout(300);
    const ana2 = await open();
    await ana2.click('#acctBtn'); await ana2.fill('#user', 'ana'); await ana2.fill('#pass', 'secreto1'); await ana2.click('#authSubmit');
    await ana2.waitForFunction(() => document.querySelector('#planNote').textContent.includes('ya usaste'));
    check('The daily limit follows the account to another browser', !(await practice(ana2)) && await ana2.isVisible('#planDlg'));
    check('Paying needs no extra data', (await ana2.textContent('#planSubmit')) === 'Hacer mi aporte con Mercado Pago');
    await Promise.all([ana2.waitForURL(/aporte=ok/), ana2.click('#planSubmit')]);
    await ana2.waitForFunction(() => document.querySelector('#toast').textContent.includes('Gracias'));
    check('Coming back from Mercado Pago unlocks everything, with thanks from the monks', await ana2.isHidden('#planNote') && !ana2.url().includes('aporte') && (await ana2.textContent('#toast')).includes('monjes ninja') && (await ana2.textContent('#upgradeLabel')).includes('Ninja'));
    check('Unlimited accounts practice without limit', await practice(ana2) && await practice(ana2));
    await ana2.click('#acctBtn'); await ana2.waitForFunction(() => document.querySelector('#planStatus').textContent.includes('para siempre'));
    check('The account shows access forever', await ana2.isHidden('#upgrade'));
    await ana2.click('#acctClose');

    // Server side
    const bob = await open(); await register(bob, 'bobo');
    const token = await bob.evaluate(() => localStorage.getItem('teclado-ciego-token'));
    const play = () => fetch(SITE + '/api/billing', { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'play' }) });
    const codes = []; for (let i = 0; i < 4; i++) codes.push((await play()).status);
    check('The server allows three practices and blocks the fourth', codes.join() === '200,200,200,402');
    const planOf = async t => (await fetch(SITE + '/api/billing', { headers: { Authorization: 'Bearer ' + t } })).json();
    const hook = body => fetch(SITE + '/api/mercadopago', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    // A payment that only arrives by webhook (the user closed Mercado Pago before coming back)
    payments.set('pay_90', { id: 'pay_90', status: 'pending', transaction_amount: 4900, external_reference: 'bobo', metadata: { templo: 'ilimitado' } });
    await hook({ type: 'payment', data: { id: 'pay_90' } });
    check('A pending payment does not unlock', !(await planOf(token)).premium);
    payments.get('pay_90').status = 'approved';
    check('The webhook of an approved payment unlocks for good', (await hook({ type: 'payment', data: { id: 'pay_90' } })).status === 200 && (await planOf(token)).premium && (await planOf(token)).lifetime);
    // A charge of an old monthly subscription is not the one-time payment
    payments.set('pay_91', { id: 'pay_91', status: 'approved', transaction_amount: 5000, external_reference: 'carla' });
    await hook({ type: 'payment', data: { id: 'pay_91' } });
    const carla = await open(); await register(carla, 'carla');
    const carlaToken = await carla.evaluate(() => localStorage.getItem('teclado-ciego-token'));
    check('Other payments with the same reference do not unlock', !(await planOf(carlaToken)).premium);
    // Monthly subscriptions from before keep working until they end
    subs.set('pre_1', { id: 'pre_1', status: 'cancelled', external_reference: 'carla', next_payment_date: new Date(Date.now() + 10 * 864e5).toISOString() });
    await (await fetch(SITE + '/api/billing', { method: 'POST', headers: { Authorization: 'Bearer ' + carlaToken, 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'sync' }) })).json();
    subs.get('pre_1').status = 'authorized';
    await hook({ type: 'subscription_preapproval', data: { id: 'pre_1' } });
    subs.get('pre_1').status = 'cancelled';
    await hook({ type: 'subscription_preapproval', data: { id: 'pre_1' } });
    const old = await planOf(carlaToken);
    check('An old monthly subscription lasts until its paid period ends', old.premium && !old.lifetime && old.subscription.status === 'cancelled');
    const gift = await open(); await register(gift, 'regalo');
    await gift.waitForFunction(() => document.querySelector('#planNote').hidden);
    check('Courtesy users are unlimited', true);
    check('No uncaught browser errors', errors.length === 0);
  } finally {
    await browser.close(); site.close(); fakeMP.close();
    if (errors.length) console.error(errors);
  }
})().catch(err => { console.error(err); process.exit(1); });
