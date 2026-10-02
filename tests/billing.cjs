// Freemium + Mercado Pago flow against a fake Mercado Pago API. Run: npm run test:billing
const http = require('node:http'), assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const SITE = 'http://127.0.0.1:4193', MP = 'http://127.0.0.1:4194';
Object.assign(process.env, { MP_ACCESS_TOKEN: 'TEST-token', MP_PRICE: '4900', MP_API_BASE: MP, APP_URL: SITE, TECLADO_PREMIUM_USERS: 'regalo',
  META_PIXEL_ID: '123456789012345', META_CAPI_TOKEN: 'capi-token', META_GRAPH_BASE: MP + '/graph',
  POSTHOG_KEY: 'phc_test', POSTHOG_INGEST_HOST: MP + '/ph' });
const { createServer } = require('./server.cjs');

// Fake Mercado Pago. Checkout: creating a preference is as if the user paid right away (an approved payment
// with the same reference and metadata). Old monthly subscriptions can still be read back.
const subs = new Map(), payments = new Map(), capi = [], ph = [];
const fakeMP = http.createServer(async (req, res) => {
  let raw = ''; for await (const c of req) raw += c;
  const url = new URL(req.url, MP), send = d => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(d)); };
  // Fake Meta Conversions API
  if (req.method === 'POST' && url.pathname === '/graph/123456789012345/events' && url.searchParams.get('access_token') === 'capi-token') { capi.push(...JSON.parse(raw).data); return send({ events_received: 1 }); }
  // Fake PostHog ingestion
  if (req.method === 'POST' && url.pathname === '/ph/i/v0/e/') { const e = JSON.parse(raw); if (e.api_key === 'phc_test') ph.push(e); return send({ status: 1 }); }
  if (req.headers.authorization !== 'Bearer TEST-token') { res.statusCode = 401; return send({ message: 'bad token' }); }
  if (req.method === 'POST' && url.pathname === '/checkout/preferences') {
    const body = JSON.parse(raw), id = 'pay_' + (payments.size + 1);
    assert.equal(body.items[0].unit_price, 4900); assert.equal(body.items[0].quantity, 1);
    assert.ok(!body.auto_recurring && body.notification_url.endsWith('/api/mercadopago'));
    payments.set(id, { id, status: 'approved', transaction_amount: 4900, currency_id: 'ARS', external_reference: body.external_reference, metadata: body.metadata });
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
  // A stand-in for Meta's fbevents.js that writes every pixel call to the console (kept across navigations).
  const PIXEL = "document.cookie='_fbp=fb.1.1700000000000.42;path=/';(window.fbq.queue||[]).forEach(a=>console.log('PX '+JSON.stringify([...a])));window.fbq.callMethod=(...a)=>console.log('PX '+JSON.stringify(a));";
  const open = async () => {
    const ctx = await browser.newContext();
    await ctx.route('https://connect.facebook.net/**', r => r.fulfill({ contentType: 'text/javascript', body: PIXEL }));
    // Analytics events (analytics.js keeps them in window.tnEvents on local copies), also kept across navigations.
    await ctx.addInitScript(() => { window.tnEvents = { push: e => console.log('TN ' + JSON.stringify(e)) }; });
    const p = await ctx.newPage(); p.px = []; p.tn = [];
    p.on('pageerror', e => errors.push(e.message));
    p.on('console', m => { const t = m.text(); if (t.startsWith('PX ')) p.px.push(JSON.parse(t.slice(3))); if (t.startsWith('TN ')) p.tn.push(JSON.parse(t.slice(3))); });
    await p.goto(SITE); await p.waitForSelector('#planNote:not([hidden])'); return p;
  };
  const fired = (p, name) => p.px.filter(a => a[1] === name);
  const events = (p, name) => p.tn.filter(e => e[0] === name).map(e => e[1]);
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
    await guest.waitForFunction(() => window.fbq);
    check('The Meta Pixel starts with the id from the server, without automatic events, and counts the visit', guest.px.some(a => a[0] === 'set' && a[1] === 'autoConfig' && a[2] === false) && guest.px.some(a => a[0] === 'init' && a[1] === '123456789012345') && fired(guest, 'PageView').length === 1);
    check('Guests see how many free practices are left', (await guest.textContent('#planNote')).includes('quedan 3 prácticas de 3'));
    await guest.click('#continue'); await guest.keyboard.press('Escape');
    check('Opening a lesson without typing does not use a practice', (await guest.textContent('#planNote')).includes('quedan 3'));
    for (let i = 0; i < 3; i++) check(`Free practice ${i + 1} of 3`, await practice(guest));
    check('Each practice is a pixel event with its section', fired(guest, 'Practica').length === 3 && fired(guest, 'Practica')[0][2].seccion === 'teclado-ciego');
    check('Each practice is a practice_started event with its lesson and the free practices left', events(guest, 'practice_started').length === 3
      && events(guest, 'practice_started')[0].section === 'teclado-ciego' && events(guest, 'practice_started')[0].kind === 'leccion' && events(guest, 'practice_started')[0].lesson && events(guest, 'practice_started').map(e => e.free_left).join() === '2,1,0');
    check('The fourth practice shows the plan', !(await practice(guest)) && await guest.isVisible('#planDlg') && (await guest.textContent('#planReason')).includes('3 prácticas'));
    check('The plan is a one-time contribution to the temple', (await guest.textContent('#planPrice')) === '$ 4.900 · pago único' && (await guest.textContent('#planDlg')).includes('Los monjes ninja te lo agradecerán') && (await guest.textContent('#planDlg')).includes('sin suscripción'));
    check('Guests are asked to sign in to pay', (await guest.textContent('#planSubmit')).includes('Crear cuenta'));
    check('Hitting the limit is a pricing_viewed event with its reason', events(guest, 'pricing_viewed').some(e => e.reason === 'limit' && e.payments_on && !e.logged_in));
    await guest.click('#planClose'); await guest.reload(); await guest.waitForSelector('#planNote:not([hidden])');
    check('Reloading does not reset the daily limit', (await guest.textContent('#planNote')).includes('ya usaste'));
    check('Without free practices left, the daily plan offers unlimited access instead of a rest', await guest.isVisible('#dojoUnlock') && (await guest.textContent('#dojoCount')).includes('acceso ilimitado') && !(await guest.textContent('#dojo')).includes('descanso'));
    await guest.click('#dojoUnlock');
    check('The plan button opens the contribution', await guest.isVisible('#planDlg') && (await guest.textContent('#planReason')).includes('3 prácticas'));
    await guest.click('#planClose');
    await guest.click('#cogCta'); await guest.click('#cogContinue');
    check('The interview training uses the same daily limit', await guest.isVisible('#planDlg') && await guest.isHidden('#quiz'));
    await guest.click('#planClose');

    // Account: the limit is counted on the server
    const ana = await open(); await register(ana, 'ana');
    check('Creating an account is a CompleteRegistration', fired(ana, 'CompleteRegistration').length === 1);
    check('Creating an account is a signed_up event, identified by the username only', events(ana, 'signed_up').length === 1 && events(ana, '$identify').some(e => e.id === 'ana'));
    for (let i = 0; i < 3; i++) await practice(ana);
    await ana.waitForTimeout(300);
    const ana2 = await open();
    await ana2.click('#acctBtn'); await ana2.fill('#user', 'ana'); await ana2.fill('#pass', 'secreto1'); await ana2.click('#authSubmit');
    await ana2.waitForFunction(() => document.querySelector('#planNote').textContent.includes('ya usaste'));
    check('The daily limit follows the account to another browser', !(await practice(ana2)) && await ana2.isVisible('#planDlg'));
    check('Paying needs no extra data', (await ana2.textContent('#planSubmit')) === 'Hacer mi aporte con Mercado Pago');
    await Promise.all([ana2.waitForURL(/aporte=ok/), ana2.click('#planSubmit')]);
    await ana2.waitForFunction(() => document.querySelector('#toast').textContent.includes('Gracias'));
    for (let i = 0; i < 50 && !fired(ana2, 'Purchase').length; i++) await ana2.waitForTimeout(100); // the pixel script loads after the page
    const checkout = fired(ana2, 'InitiateCheckout')[0], buy = fired(ana2, 'Purchase');
    check('Going to pay is an InitiateCheckout with the price', checkout && checkout[2].value === 4900 && checkout[2].currency === 'ARS');
    check('Going to pay is checkout_clicked and checkout_started', events(ana2, 'checkout_clicked').some(e => e.logged_in && e.price === 4900) && events(ana2, 'checkout_started').length === 1);
    check('The server reports the payment to PostHog once, for the account', ph.filter(e => e.event === 'payment_succeeded').length === 1 && ph[0].distinct_id === 'ana' && ph[0].properties.value === 4900 && ph[0].properties.source === 'server');
    check('No analytics event carries a password', ![...ana.tn, ...ana2.tn, ...ph].some(e => JSON.stringify(e).includes('secreto1')));
    check('Coming back paid is one Purchase, with the payment as event id', buy.length === 1 && buy[0][2].value === 4900 && buy[0][3].eventID === 'pay_pay_1');
    check('The server reports the same Purchase once to the Conversions API', capi.length === 1 && capi[0].event_name === 'Purchase' && capi[0].event_id === 'pay_pay_1' && capi[0].custom_data.value === 4900
      && capi[0].user_data.fbp === 'fb.1.1700000000000.42' && /^[0-9a-f]{64}$/.test(capi[0].user_data.external_id[0]) && capi[0].user_data.client_user_agent);
    check('Coming back from Mercado Pago unlocks everything, with thanks from the monks', await ana2.isHidden('#planNote') && !ana2.url().includes('aporte') && (await ana2.textContent('#toast')).includes('monjes ninja') && (await ana2.textContent('#upgradeLabel')).includes('Ninja'));
    await ana2.reload(); await ana2.waitForSelector('#acctBtn .nm'); await ana2.waitForTimeout(1000);
    check('Reloading does not count the purchase again', fired(ana2, 'Purchase').length === 1);
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
    await hook({ type: 'payment', data: { id: 'pay_90' } });
    check('A purchase that only arrives by webhook is reported from the server, once', capi.length === 2 && capi[1].event_id === 'pay_pay_90');
    check('It also reaches PostHog once', ph.filter(e => e.event === 'payment_succeeded').map(e => e.distinct_id).join() === 'ana,bobo');
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
