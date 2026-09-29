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
// Long texts with accents and capitals: send the key events straight to the page.
function typeText(page) {
  return page.evaluate(() => {
    const text = [...document.querySelectorAll('#inner .c')].map(s => s.textContent).join('');
    for (const key of text) document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
  });
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
    await a.click('#rHome');

    // Speed measurements by typing method
    await a.click('.mc:nth-child(3) .btn');
    check('Measurements hide the on-screen keyboard', await a.isHidden('#guide') && (await a.textContent('#lName')) === 'A ciegas');
    await typeText(a); await a.waitForSelector('#result:not([hidden])');
    check('The result names the method', (await a.textContent('#result h3')).includes('a ciegas'));
    await a.waitForTimeout(300); await a.click('#rHome');
    await a.click('.mc:nth-child(1) .btn'); await typeText(a); await a.waitForSelector('#result:not([hidden])');
    await a.waitForTimeout(300); await a.click('#rHome');
    check('The chart plots each measurement', (await a.locator('#chartSvg circle.dot').count()) === 2);
    check('Blind and looking speeds are compared', (await a.textContent('#insight')).includes('mirando el teclado'));
    await a.click('#acctBtn');
    await a.waitForFunction(() => document.querySelectorAll('#hist tbody tr').length === 3);
    check('Lessons and measurements appear in the history', (await a.textContent('#hist tbody')).includes('Lección 1') && (await a.textContent('#hist tbody')).includes('Medición a ciegas'));
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
    await b.click('#evoView [data-v="table"]');
    check('Measurements follow the account too', (await b.locator('#evoTable tbody tr').count()) === 2);
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
