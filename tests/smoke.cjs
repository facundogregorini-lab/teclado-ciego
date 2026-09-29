// Browser checks for accounts and saved sessions. Run: npm test (needs Playwright's Chromium).
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { createServer } = require('./server.cjs');
const SITE = 'http://127.0.0.1:4191';
const check = (name, ok) => { assert.ok(ok, name); console.log('PASS', name); };

async function typeLesson(page) {
  const text = await page.evaluate(() => [...document.querySelectorAll('#inner .c')].map(s => s.textContent).join(''));
  for (const ch of text) await page.keyboard.press(ch === ' ' ? 'Space' : ch);
}

(async () => {
  const server = createServer(); await new Promise(r => server.listen(4191, '127.0.0.1', r));
  const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
  const errors = [];
  try {
    // First computer: create an account and practice
    const a = await browser.newPage(); a.on('pageerror', e => errors.push(e.message));
    await a.goto(SITE);
    check('Guests see the login button', (await a.textContent('#acctBtn')).trim() === 'Entrar');
    await a.click('#acctBtn'); await a.click('#authMode [data-v="register"]');
    await a.fill('#user', 'ab'); await a.fill('#pass', 'secreto1'); await a.click('#authSubmit');
    await a.waitForFunction(() => document.querySelector('#authErr').textContent);
    check('Short usernames are rejected', (await a.textContent('#authErr')).includes('entre 3 y 20'));
    await a.fill('#user', 'Ana'); await a.click('#authSubmit');
    await a.waitForSelector('#acctBtn .nm');
    check('Registering signs in', (await a.textContent('#acctBtn .nm')) === 'ana');
    await a.click('#continue'); await typeLesson(a);
    await a.waitForSelector('#result:not([hidden])');
    await a.waitForTimeout(300);
    await a.click('#rHome'); await a.click('#acctBtn');
    await a.waitForFunction(() => document.querySelectorAll('#hist tbody tr').length === 1);
    check('The finished lesson appears in the history', (await a.textContent('#hist tbody tr')).includes('Lección 1'));
    await a.click('#acctClose');

    // Second computer: log in and find the progress
    const b = await (await browser.newContext()).newPage(); b.on('pageerror', e => errors.push(e.message));
    await b.goto(SITE);
    await b.click('#acctBtn'); await b.fill('#user', 'ana'); await b.fill('#pass', 'otra-clave'); await b.click('#authSubmit');
    await b.waitForFunction(() => document.querySelector('#authErr').textContent);
    check('Wrong passwords are rejected', (await b.textContent('#authErr')).includes('incorrectos'));
    await b.fill('#pass', 'secreto1'); await b.click('#authSubmit');
    await b.waitForFunction(() => document.querySelector('#hStars').textContent !== '0/78');
    check('Progress follows the account to another browser', (await b.textContent('.lc')).includes('Mejor:'));
    await b.reload(); await b.waitForSelector('#acctBtn .nm');
    check('The session survives a reload', (await b.textContent('#acctBtn .nm')) === 'ana');
    await b.click('#acctBtn'); await b.click('#logout');
    await b.waitForFunction(() => document.querySelector('#acctBtn').textContent.trim() === 'Entrar');
    check('Logging out clears this browser', (await b.textContent('#hStars')) === '0/78');

    check('No uncaught browser errors', errors.length === 0);
  } finally {
    await browser.close(); server.close();
    if (errors.length) console.error(errors);
  }
})().catch(err => { console.error(err); process.exit(1); });
