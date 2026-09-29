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

    // On-screen keyboards (Android reports keys as "Unidentified"): text arrives only as input
    await a.click('.lc >> nth=19');
    const input = async (value, composing) => a.evaluate(([v, c]) => {
      const cap = document.getElementById('cap'); cap.value = v;
      cap.dispatchEvent(new InputEvent('input', { data: v, isComposing: c, bubbles: true }));
    }, [value, composing]);
    await input('á', false);
    check('Typing into the field without key events works', (await a.locator('#inner .c.ok').count()) === 1);
    // Dead key on a Mac: "´" then "é" as one composition
    await input(' ', false);
    await input('´', true);
    check('A pending accent mark is not counted as an error', (await a.locator('#inner .c.bad').count()) === 0);
    await input('é', true);
    await a.evaluate(() => document.getElementById('cap').dispatchEvent(new CompositionEvent('compositionend', { data: 'é' })));
    check('The composed accent is accepted once', (await a.locator('#inner .c.ok').count()) === 3 && (await a.inputValue('#cap')) === '');
    // Safari may not flag the dead key as a composition, or send "´" and the vowel apart
    const lessonText = () => a.evaluate(() => [...document.querySelectorAll('#inner .c')].map(s => s.textContent).join(''));
    const done = () => a.locator('#inner .c.ok, #inner .c.fix').count();
    const bad = () => a.locator('#inner .c.bad').count();
    const typeUpToAccent = async () => {
      const t = await lessonText(); let at = await done();
      while (!'áéíóú'.includes(t[at])) await input(t[at++], false);
      return t[at];
    };
    let want = await typeUpToAccent(), n = await done(), errs = await bad();
    await input('´', false);
    check('An accent mark without the composition flag waits for the vowel', (await bad()) === errs && (await a.inputValue('#cap')) === '´');
    await input('´' + want.normalize('NFD')[0], false);
    check('Accent mark and vowel sent apart become one letter', (await done()) === n + 1 && (await bad()) === errs && (await a.inputValue('#cap')) === '');
    want = await typeUpToAccent(); n = await done();
    await input(want.normalize('NFD'), false);
    check('Decomposed accents (vowel + combining mark) are accepted', (await done()) === n + 1 && (await bad()) === errs);
    await a.evaluate(() => document.getElementById('cap').blur());
    check('Losing focus shows how to continue', await a.isVisible('#veil'));
    await a.click('#veil');
    check('Tapping the text takes the keyboard back', await a.evaluate(() => document.activeElement.id === 'cap'));
    await a.keyboard.press('Escape');

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
