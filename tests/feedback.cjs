// Browser checks for "Ayudanos a mejorar" (monk.js, api/feedback.js) and the monks' inbox (comentarios.html).
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { createServer } = require('./server.cjs');
const SITE = 'http://127.0.0.1:4194';
const check = (name, ok) => { assert.ok(ok, name); console.log('PASS', name); };
const post = (payload, headers = {}) => fetch(SITE + '/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(payload) });
const inbox = key => fetch(SITE + '/api/feedback', { headers: key ? { 'X-Monjes-Key': key } : {} });

(async () => {
  const server = createServer(); await new Promise(r => server.listen(4194, '127.0.0.1', r));
  const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
  const errors = [];
  try {
    delete process.env.FEEDBACK_KEY;
    check('Without FEEDBACK_KEY nobody can read the messages', (await inbox('algo')).status === 503);
    process.env.FEEDBACK_KEY = 'te-verde';

    const p = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage(); p.on('pageerror', e => errors.push(e.message));
    await p.goto(SITE); await p.waitForLoadState('networkidle');
    check('The monk peeks from the right edge, half hidden', await p.isVisible('#monkPeek') && await p.evaluate(() => {
      const r = document.querySelector('#monkPeek').getBoundingClientRect();
      return r.right > innerWidth && r.left < innerWidth && r.width <= 80;
    }));
    check('The monk is a labelled button that opens a dialog', (await p.getAttribute('#monkPeek', 'aria-label')).includes('Ayudanos a mejorar') && await p.getAttribute('#monkPeek', 'aria-haspopup') === 'dialog');
    await p.click('#continue');
    check('The monk leaves during a lesson', await p.isHidden('#monkPeek'));
    await p.click('#back');
    check('…and comes back home', await p.isVisible('#monkPeek'));

    await p.click('#monkPeek');
    check('Clicking the monk opens the dialog', await p.isVisible('#monkDlg') && (await p.textContent('#monkSay')).includes('saltamontes'));
    const faceBefore = await p.innerHTML('#monkBig');
    await p.click('.monk-moods label:has(input[value="5"])');
    check('Choosing a mood changes the monk and what he says', (await p.innerHTML('#monkBig')) !== faceBefore && (await p.textContent('#monkSay')).includes('gong'));
    await p.click('.monk-kinds label:has(input[value="idea"])');
    check('Choosing a kind changes the hint', (await p.getAttribute('#monkText', 'placeholder')).includes('buenísimo'));
    await p.click('#monkSend');
    check('An empty message is not sent', (await p.textContent('#monkErr')).includes('unas palabras') && await p.isVisible('#monkForm'));
    await p.fill('#monkText', 'Me encantaría un modo oscuro para practicar de noche');
    check('The counter follows the text', (await p.textContent('#monkCount')) === '52/1000');
    check('Guests can\'t sign', await p.isHidden('#monkSignRow'));
    await p.click('#monkSend');
    await p.waitForSelector('#monkDone:not([hidden])');
    check('Sending shows the thanks of the monks', (await p.textContent('#monkDone')).includes('Pergamino recibido') && await p.isHidden('#monkForm'));
    check('Sending is a feedback_sent event without the text', await p.evaluate(() => window.tnEvents.some(([e, x]) => e === 'feedback_sent' && x.mood === 5 && x.kind === 'idea' && !('text' in x))));
    await p.click('#monkBack');
    check('Closing goes back to the app', await p.isHidden('#monkDlg'));
    await p.click('#monkPeek');
    check('The next time the form starts clean', (await p.inputValue('#monkText')) === '' && await p.isVisible('#monkForm'));
    await p.keyboard.press('Escape');

    await p.click('#monkPeek'); await p.click('#monkTuck'); await p.keyboard.press('Escape');
    check('The monk can be tucked away', await p.isHidden('#monkPeek'));
    await p.reload(); await p.waitForLoadState('networkidle');
    check('…and stays tucked after a reload', await p.isHidden('#monkPeek'));
    await p.click('.legal [data-monk-open]');
    check('The link at the bottom still opens the dialog', await p.isVisible('#monkDlg'));
    await p.click('#monkTuck'); await p.keyboard.press('Escape');
    check('…and from there the monk comes back', await p.isVisible('#monkPeek'));

    // Signed with the name the account shows
    const reg = await (await fetch(SITE + '/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'register', username: 'luz', password: 'secreto1' }) })).json();
    await fetch(SITE + '/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + reg.token }, body: JSON.stringify({ action: 'display', display: 'Lu Ninja' }) });
    await p.evaluate(t => localStorage.setItem('teclado-ciego-token', t), reg.token);
    await p.reload(); await p.waitForSelector('#acctBtn .nm');
    await p.keyboard.press('Tab'); await p.focus('#monkPeek'); await p.keyboard.press('Enter');
    await p.waitForSelector('#monkSignRow:not([hidden])');
    check('With a session the message can be signed with the shown name', (await p.textContent('#monkSignName')) === 'Lu Ninja');
    await p.click('.monk-moods label:has(input[value="2"])');
    await p.fill('#monkText', 'El desafío de 5 minutos se me cortó en el celular');
    await p.keyboard.press('Control+Enter');
    await p.waitForSelector('#monkDone:not([hidden])');
    check('Ctrl+Enter sends the message', true);
    await p.keyboard.press('Escape');

    // The API
    check('Very short messages are rejected', (await post({ text: 'a' })).status === 400);
    check('Very long messages are rejected', (await post({ text: 'a'.repeat(1001) })).status === 400);
    check('Bots that fill the hidden field get an ok but nothing is saved', (await post({ text: 'compre ya', website: 'spam.example' })).ok);
    const statuses = [];
    for (let i = 0; i < 6; i++) statuses.push((await post({ text: 'Mensaje número ' + i, mood: 9, kind: 'raro', page: 'x' })).status);
    check('At most 6 messages per hour from the same connection', statuses.filter(s => s === 200).length === 4 && statuses.at(-1) === 429);
    check('The wrong key can\'t read', (await inbox('cafe')).status === 401);
    const { items } = await (await inbox('te-verde')).json();
    check('The monks read every message, newest first', items.length === 6 && items[5].text.includes('modo oscuro') && !items.some(i => i.text === 'compre ya'));
    check('Odd values are cleaned', items[0].mood === null && items[0].kind === 'otro' && items[0].page === 'home');
    const signed = items.find(i => i.text.includes('celular'));
    check('A signed message carries the shown name and the username', signed.name === 'Lu Ninja' && signed.user === 'luz' && signed.mood === 2);
    check('An unsigned message is anonymous', items[5].name === null && items[5].user === null);

    // The monks' inbox
    const a = await (await browser.newContext()).newPage(); a.on('pageerror', e => errors.push(e.message));
    await a.goto(SITE + '/comentarios.html');
    check('The inbox is not indexed', (await a.getAttribute('meta[name="robots"]', 'content')).includes('noindex'));
    await a.fill('#key', 'cafe'); await a.click('#enter');
    await a.waitForFunction(() => document.querySelector('#err').textContent);
    check('The inbox asks for the right key', (await a.textContent('#err')).includes('incorrecta') && await a.isHidden('#inbox'));
    await a.fill('#key', 'te-verde'); await a.click('#enter');
    await a.waitForSelector('#inbox:not([hidden])');
    check('The inbox lists every message with a summary', (await a.locator('#list .item').count()) === 6 && (await a.textContent('#summary')).includes('6pergaminos en total'));
    check('Messages show who, mood and kind', (await a.textContent('#list')).includes('Lu Ninja (@luz)') && (await a.textContent('#list')).includes('Anónimo') && (await a.textContent('#list')).includes('💡 Idea'));
    await a.selectOption('#fKind', 'idea');
    check('Messages can be filtered by kind', (await a.locator('#list .item').count()) === 1);
    await a.selectOption('#fKind', ''); await a.fill('#q', 'celular');
    check('…and searched', (await a.locator('#list .item').count()) === 1);
    await a.reload(); await a.waitForSelector('#inbox:not([hidden])');
    check('The key lasts while the tab is open', (await a.locator('#list .item').count()) === 6);
    await a.click('#logout');
    check('Leaving hides the messages', await a.isHidden('#inbox'));

    // Phones: smaller, still at the edge, out of the way while typing
    const m = await (await browser.newContext({ viewport: { width: 390, height: 780 }, hasTouch: true, isMobile: true })).newPage(); m.on('pageerror', e => errors.push(e.message));
    await m.goto(SITE); await m.waitForLoadState('networkidle');
    check('On phones the monk is smaller and still at the edge', await m.evaluate(() => {
      const r = document.querySelector('#monkPeek').getBoundingClientRect();
      return r.width <= 60 && r.right > innerWidth && document.documentElement.scrollWidth <= innerWidth;
    }));
    await m.tap('#monkPeek');
    check('The dialog fits the phone', await m.evaluate(() => document.querySelector('#monkDlg').getBoundingClientRect().width <= innerWidth - 16));

    check('No uncaught browser errors', errors.length === 0);
  } finally {
    await browser.close(); server.close();
    if (errors.length) console.error(errors);
  }
})().catch(err => { console.error(err); process.exit(1); });
