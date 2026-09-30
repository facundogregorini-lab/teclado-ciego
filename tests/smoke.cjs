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
    check('Page IDs are unique', await a.evaluate(() => {
      const ids = [...document.querySelectorAll('[id]')].map(el => el.id);
      return new Set(ids).size === ids.length;
    }));
    await a.click('.scene-picker [data-scene="mountains"]');
    await a.reload();
    check('Landscape choice survives a reload', await a.getAttribute('html', 'data-scene') === 'mountains'
      && await a.getAttribute('.scene-picker [data-scene="mountains"]', 'aria-pressed') === 'true');
    for (const scene of ['beach', 'mountains', 'forest']) {
      const asset = await a.request.get(SITE + '/assets/' + scene + '.jpg');
      check('Landscape asset loads: ' + scene, asset.ok() && asset.headers()['content-type'] === 'image/jpeg');
    }
    check('The hero has the three landscapes and no drawings on them', await a.locator('.hero-slides .slide').count() === 3 && await a.locator('.hero-slides svg').count() === 0);
    const firstScene = await a.getAttribute('html', 'data-hero-scene');
    await a.waitForFunction(s => document.documentElement.dataset.heroScene !== s, firstScene, { timeout: 10000 });
    check('The hero changes landscape by itself', await a.locator('.hero-slides .slide.on').count() === 1);
    check('No cabin is built before any lesson', await a.getAttribute('.cabin-card >> nth=0', 'data-parts') === '0');
    await a.click('#continue');
    await a.locator('.scene-picker [data-scene="forest"]').press('Space');
    check('Changing the landscape by keyboard does not type into the exercise',
      await a.getAttribute('html', 'data-scene') === 'forest' && await a.locator('#inner .c.ok, #inner .c.bad').count() === 0);
    await a.click('.main-nav a[href="#learning"]');
    check('Lesson navigation returns home', await a.isVisible('#home') && await a.isHidden('#lesson'));
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
    check('Passing a lesson adds a piece to the cabin', (await a.textContent('.result-cabin b')).startsWith('¡Sumaste'));
    await a.waitForTimeout(300);
    await a.click('#rHome');
    check('The group cabin shows the new piece', await a.getAttribute('.cabin-card >> nth=0', 'data-parts') === '1');

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
    check('The result shows who types like you', await a.isVisible('.house-result .typist-art') && (await a.textContent('.house-copy')).includes('mediana'));
    check('Measurements are not limited without payments configured', await a.isHidden('#planNote'));
    await a.waitForFunction(() => document.querySelector('#rankLine')?.textContent);
    check('Impossible speeds stay out of the ranking', (await a.textContent('#rankLine')).includes('no entra al ranking'));
    await a.waitForTimeout(300); await a.click('#rHome');
    await a.click('.mc:nth-child(1) .btn'); await typeText(a); await a.waitForSelector('#result:not([hidden])');
    await a.waitForTimeout(300); await a.click('#rHome');
    check('The chart plots each measurement', (await a.locator('#chartSvg circle.dot').count()) === 2);
    check('Blind and looking speeds are compared', (await a.textContent('#insight')).includes('mirando el teclado'));
    check('The progress ranking lists the user', (await a.textContent('#rankList li.me')).includes('ana'));
    await a.click('#rankView [data-v="speed"]');
    check('Nobody is in the speed ranking with impossible speeds', (await a.locator('#rankList li').count()) === 0);
    // A real speed: a slow measurement that ends by time
    await a.click('.mc:nth-child(2) .btn');
    await a.evaluate(() => { const t = [...document.querySelectorAll('#inner .c')].map(s => s.textContent).join('').slice(0, 40); for (const key of t) document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })); });
    await a.evaluate(() => { const now = performance.now.bind(performance); performance.now = () => now() + 61000; });
    await a.waitForFunction(() => document.querySelector('#rankLine')?.textContent.includes('#1'));
    check('The result gives the place in the speed ranking', (await a.textContent('.house-copy h4')).length > 0);
    await a.evaluate(() => { delete performance.now; });
    await a.click('#rHome'); await a.click('#rankView [data-v="speed"]');
    check('The speed ranking lists the user', (await a.textContent('#rankList li.me')).includes('ppm'));
    await a.click('#rankView [data-v="progress"]');
    await a.click('#acctBtn');
    await a.waitForFunction(() => document.querySelectorAll('#hist tbody tr').length === 4);
    check('Lessons and measurements appear in the history', (await a.textContent('#hist tbody')).includes('Lección 1') && (await a.textContent('#hist tbody')).includes('Medición a ciegas'));
    await a.click('#acctClose');

    // Challenge a friend: the link carries the score
    await a.click('#inviteBtn');
    const wa = await a.getAttribute('#chWhatsapp', 'href');
    check('The WhatsApp invitation carries a challenge link', wa.startsWith('https://wa.me/?text=') && decodeURIComponent(wa).includes('de=ana') && decodeURIComponent(wa).includes('ppm='));
    check('The email invitation is ready too', (await a.getAttribute('#chMail', 'href')).startsWith('mailto:?subject='));
    await a.fill('#chEmail', 'amigo@example.com');
    check('The friend email goes into the email', (await a.getAttribute('#chMail', 'href')).startsWith('mailto:amigo@example.com?'));
    const link = decodeURIComponent(wa).match(/http:\/\/127\S+/)[0];
    await a.click('#chClose');
    const f = await (await browser.newContext()).newPage(); f.on('pageerror', e => errors.push(e.message));
    await f.goto(link.replace(/ppm=\d+/, 'ppm=3'));
    check('A friend opening the link sees the challenge', (await f.textContent('#challengeTitle')).includes('ana te desafía: 3 palabras'));
    check('The challenge link is cleaned from the address bar', !f.url().includes('de='));
    await f.click('#challengeAccept');
    await f.evaluate(() => { const t = [...document.querySelectorAll('#inner .c')].map(s => s.textContent).join('').slice(0, 40); for (const key of t) document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })); });
    await f.evaluate(() => { const now = performance.now.bind(performance); performance.now = () => now() + 61000; });
    await f.waitForSelector('.challenge-result');
    check('The friend learns who won', (await f.textContent('.challenge-result')).includes('ganaste a ana'));
    await f.click('#rChallenge');
    check('The friend can send the rematch', decodeURIComponent(await f.getAttribute('#chWhatsapp', 'href')).includes('¿Me ganás?'));

    // Second computer: log in and find the progress
    const b = await (await browser.newContext()).newPage(); b.on('pageerror', e => errors.push(e.message));
    await b.goto(SITE);
    await b.click('#acctBtn'); await b.fill('#user', 'ana'); await b.fill('#pass', 'otra-clave'); await b.click('#authSubmit');
    await b.waitForFunction(() => document.querySelector('#authErr').textContent);
    check('Wrong passwords are rejected', (await b.textContent('#authErr')).includes('incorrectos'));
    await b.waitForFunction(() => document.querySelectorAll('#rankList li').length === 1);
    check('Guests see the ranking of everyone', (await b.textContent('#rankList')).includes('ana') && (await b.textContent('#rankNote')).includes('Entrá'));
    await b.fill('#pass', 'secreto1'); await b.click('#authSubmit');
    await b.waitForFunction(() => document.querySelector('#hStars').textContent !== '0/78');
    check('Progress follows the account to another browser', (await b.textContent('.lc')).includes('Mejor:'));
    await b.click('#evoView [data-v="table"]');
    check('Measurements follow the account too', (await b.locator('#evoTable tbody tr').count()) === 3);
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
