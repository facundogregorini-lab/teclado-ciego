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
    const levels = await a.$$eval('.evo-card b', els => els.map(e => e.textContent));
    check('Each group is its own level, with the final one at the end', levels.join() === 'Nivel chimpancé,Nivel bebé,Nivel niño,Nivel indigente,Nivel intelectual,Nivel premio Nobel');
    check('Each level shows its own typist', new Set(await a.$$eval('.evo-card svg', els => els.map(e => e.innerHTML))).size === 6);
    check('Levels not started look locked', await a.locator('.evo-art.locked').count() === 6);
    await a.click('#continue');
    await a.locator('.scene-picker [data-scene="forest"]').press('Space');
    check('Changing the landscape by keyboard does not type into the exercise',
      await a.getAttribute('html', 'data-scene') === 'forest' && await a.locator('#inner .c.ok, #inner .c.bad').count() === 0);
    await a.click('.main-nav a[href="#learning"]');
    check('Lesson navigation returns home', await a.isVisible('#home') && await a.isHidden('#lesson'));
    check('Guests see the login button', (await a.textContent('#acctBtn')).trim() === 'Entrar');
    check('The header shows Ninja mental right after the brand', await a.evaluate(() => document.getElementById('homeBtn').nextElementSibling.id === 'cogCta') && (await a.textContent('#cogCta')).includes('Ninja mental'));
    check('The upgrade CTA sits left of the login, also for guests', await a.isVisible('#upgradeCta') && await a.evaluate(() => document.getElementById('upgradeCta').nextElementSibling.id === 'acctBtn'));
    await a.click('#upgradeCta');
    check('Without payments the upgrade CTA explains the plan is coming', await a.isVisible('#planDlg') && (await a.textContent('#planReason')).includes('en camino') && await a.isHidden('#planSubmit'));
    await a.click('#planClose');
    await a.click('#acctBtn'); await a.click('#authMode [data-v="register"]');
    await a.fill('#user', 'ab'); await a.fill('#pass', 'secreto1'); await a.click('#authSubmit');
    await a.waitForFunction(() => document.querySelector('#authErr').textContent);
    check('Short usernames are rejected', (await a.textContent('#authErr')).includes('entre 3 y 20'));
    await a.fill('#user', 'Ana'); await a.click('#authSubmit');
    await a.waitForSelector('#acctBtn .nm');
    check('Registering signs in', (await a.textContent('#acctBtn .nm')) === 'ana');
    await a.click('#continue'); await typeLesson(a);
    await a.waitForSelector('#result:not([hidden])');
    check('The lesson result shows the level progress', (await a.textContent('.result-evo')).includes('1 de 6 lecciones'));
    await a.waitForTimeout(300);
    await a.click('#rHome');
    check('The started level is no longer locked', await a.getAttribute('.evo-card >> nth=0', 'data-done') === '1' && await a.locator('.evo-art.locked').count() === 5);

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
    // Safari on a Mac: the composition ends with the mark alone, the accented vowel comes after
    await input(' ', false);
    await input('´', true);
    await a.evaluate(() => document.getElementById('cap').dispatchEvent(new CompositionEvent('compositionend', { data: '´' })));
    check('Safari: a lonely accent mark waits for its vowel', (await a.locator('#inner .c.bad').count()) === 0 && (await a.inputValue('#cap')) === '´');
    await input('í', false);
    check('Safari: the accented vowel arrives after and counts', (await a.locator('#inner .c.ok').count()) === 5 && (await a.inputValue('#cap')) === '');
    // Mark and vowel as two separate characters
    await input(' ´o', false);
    check('A mark followed by its vowel becomes the accented vowel', (await a.locator('#inner .c.ok').count()) === 7 && (await a.locator('#inner .c.bad').count()) === 0);
    // Dead key while the typing field is not focused (after clicking elsewhere)
    await a.evaluate(() => document.getElementById('cap').blur());
    const key = (k, extra = {}) => a.evaluate(([k, x]) => document.body.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...x })), [k, extra]);
    await key(' '); await key('Dead', { code: 'BracketLeft' }); await key('u');
    check('A dead key outside the field still puts the accent', (await a.locator('#inner .c.ok').count()) === 9 && (await a.locator('#inner .c.bad').count()) === 0);
    // Mac press-and-hold menu: the plain vowel first, then the accented one replaces it
    const typeToAccent = () => a.evaluate(() => {
      const spans = [...document.querySelectorAll('#inner .c')];
      for (let i = spans.findIndex(s => s.classList.contains('cur')); i < spans.length && !'áéíóú'.includes(spans[i].textContent); i++)
        document.dispatchEvent(new KeyboardEvent('keydown', { key: spans[i].textContent, bubbles: true, cancelable: true }));
      return document.querySelector('#inner .c.cur').textContent;
    });
    let target = await typeToAccent();
    await key(target.normalize('NFD')[0]);
    check('A plain vowel for an accented one waits instead of failing', (await a.locator('#inner .c.hold').count()) === 1 && (await a.locator('#inner .c.bad').count()) === 0 && await a.isVisible('#accentHelp'));
    await key(target);
    check('The accent right after is accepted without an error', (await a.locator('#inner .c.hold, #inner .c.bad, #inner .c.fix').count()) === 0 && (await a.textContent('#sAcc')) === '100%');
    // Keyboards that cannot type accents: accents become optional
    target = await typeToAccent();
    await key(target.normalize('NFD')[0]);
    await a.click('#accentLoose');
    check('"Aceptar vocales sin tilde" accepts the waiting vowel', (await a.locator('#inner .c.hold, #inner .c.bad').count()) === 0 && await a.getAttribute('#accMode [data-v="loose"]', 'aria-pressed') === 'true');
    target = await typeToAccent();
    await key(target.normalize('NFD')[0]);
    check('With optional accents a plain vowel counts', (await a.locator('#inner .c.hold, #inner .c.bad').count()) === 0);
    await a.click('#accMode [data-v="strict"]');
    await a.evaluate(() => document.getElementById('cap').blur());
    await a.waitForSelector('#veil', { state: 'visible', timeout: 2000 }).catch(() => {});
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

    // Interview training: abstract figures, same design as the lessons
    await a.click('#cogCta');
    check('The header CTA opens Ninja mental', await a.isVisible('#cog') && await a.isHidden('#home') && a.url().endsWith('#ninja'));
    const cogLevels = await a.$$eval('#cogPath .evo-card b', els => els.map(e => e.textContent));
    check('Each training level has its own typist', cogLevels.join() === 'Nivel chimpancé,Nivel bebé,Nivel niño,Nivel indigente,Nivel intelectual,Nivel premio Nobel');
    check('There are 15 sessions and the mock test', await a.locator('#cogPath .lc').count() === 16);
    await a.click('#cogContinue');
    check('A session starts with a series of figures', await a.isVisible('#quiz') && (await a.textContent('#qPrompt')).includes('sigue') && await a.locator('#qFig .fig').count() === 5 && await a.locator('#qOpts .opt').count() === 4);
    for (let i = 0; i < 6; i++) {
      await a.keyboard.press(String(1 + (i % 4)));
      if (!i) check('Each answer explains the rule', await a.isVisible('#qFeedback') && /^(✓|✗)/.test(await a.textContent('#qExplain')) && await a.locator('#qOpts .opt.right').count() === 1);
      await a.keyboard.press('Enter');
    }
    await a.waitForSelector('#qResult:not([hidden])');
    check('The session result shows stars and the level typist', await a.locator('#qResult .bigstars').count() === 1 && await a.locator('#qResult .result-evo .typist-art').count() === 1);
    await a.click('#qrHome');
    check('The session is saved in the path', (await a.textContent('#cogPath .lc >> nth=0')).includes('Mejor:'));
    await a.click('#cogPath .group:nth-child(2) .lc >> nth=1');
    check('Matrices show a 3×3 grid with a blank', await a.locator('#qFig .q-grid .fig').count() === 8 && await a.locator('#qFig .q-blank').count() === 1);
    await a.keyboard.press('Escape');
    await a.click('#cogPath .group:nth-child(2) .lc >> nth=2');
    check('The odd one out shows five figures to choose from', await a.isHidden('#qFig') && await a.locator('#qOpts .opt').count() === 5);
    await a.keyboard.press('Escape');
    await a.click('#simBtn');
    check('The mock test has 11 questions in 11 minutes', (await a.textContent('#qNum')) === '1/11' && (await a.textContent('#qTime')).startsWith('11:') || (await a.textContent('#qTime')).startsWith('10:5'));
    for (let i = 0; i < 11; i++) await a.keyboard.press('b');
    await a.waitForSelector('#qResult:not([hidden])');
    check('The mock test says who you solve like', (await a.textContent('#qResult .house-copy h4')).length > 0 && await a.isVisible('#qResult .typist-art'));
    await a.click('#qrHome');
    check('The best mock test is shown', (await a.textContent('#cBest')).endsWith('%'));
    // 3-minute run: series one after another, harder with every 3 right answers, then score and IQ
    // Remember each generated series to answer it right (the page has no way to show the answer before choosing)
    await a.evaluate(() => { const make = Figures.make.serie; Figures.make.serie = d => (window.lastQ = make(d)); });
    await a.click('#maxBtn');
    check('The 3-minute run starts with a series', (await a.textContent('#qTime')).startsWith('3:') || (await a.textContent('#qTime')).startsWith('2:5'));
    for (let i = 0; i < 5; i++) { await a.keyboard.press(String(1 + await a.evaluate(i => i === 4 ? (lastQ.answer + 1) % lastQ.options.length : lastQ.answer, i))); await a.waitForTimeout(700); }
    check('The run counts answers and points as it goes', (await a.textContent('#qNum')) === '5' && (await a.textContent('#qOk')) !== '0' && (await a.textContent('#qNumLbl')) === 'respondidas');
    check('Every 3 right answers the difficulty goes up', (await a.textContent('#qGroup')).includes('dificultad 2 de 5'));
    await a.evaluate(() => { const now = performance.now.bind(performance); performance.now = () => now() + 181000; });
    await a.waitForSelector('#qResult:not([hidden]) .iq');
    check('The run ends with a score and a playful IQ', /^IQ \d+$/.test(await a.textContent('#qResult .iq')) && (await a.textContent('#qResult .nums')).includes('efectividad') && (await a.textContent('#qResult')).includes('no un test de IQ real'));
    await a.waitForFunction(() => document.querySelector('#ninjaRankLine')?.textContent.includes('#1'));
    check('The run gives the place in the ninja ranking', true);
    await a.evaluate(() => { delete performance.now; });
    await a.click('#qrChallenge');
    const nwa = decodeURIComponent(await a.getAttribute('#chWhatsapp', 'href'));
    check('A run can be sent as a challenge', nwa.includes('Ninja mental') && /ninja=\d+/.test(nwa) && nwa.includes('#ninja'));
    await a.click('#chClose'); await a.click('#qrHome');
    check('The ninja ranking in the section lists the user', (await a.textContent('#ninjaRank li.me')).includes('ana') && (await a.textContent('#maxBest')).includes('IQ'));
    await a.click('.main-nav a[href="#learning"]');
    check('Lessons are one click away', await a.isVisible('#home') && !a.url().includes('#ninja'));
    await a.click('#rankView [data-v="ninja"]');
    check('The main ranking has a Ninja tab', (await a.textContent('#rankList li.me')).includes('IQ'));
    await a.click('#rankView [data-v="progress"]');

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
    // A friend opens a Ninja mental challenge
    const nf = await (await browser.newContext()).newPage(); nf.on('pageerror', e => errors.push(e.message));
    await nf.goto(SITE + '/?de=ana&ninja=12#ninja');
    check('A ninja challenge opens Ninja mental with the banner', await nf.isVisible('#cog') && (await nf.textContent('#challengeTitle')).includes('ana te desafía en Ninja mental'));
    await nf.click('#challengeAccept');
    check('Accepting starts the 3-minute run', (await nf.textContent('#qName')) === 'Desafío de 3 minutos');
    await nf.evaluate(() => { const now = performance.now.bind(performance); performance.now = () => now() + 181000; });
    await nf.waitForSelector('#qResult:not([hidden]) .challenge-result');
    check('The friend learns who won the ninja challenge', (await nf.textContent('.challenge-result')).includes('ana'));
    await b.fill('#pass', 'secreto1'); await b.click('#authSubmit');
    await b.waitForFunction(() => document.querySelector('#hStars').textContent !== '0/78');
    check('Progress follows the account to another browser', (await b.textContent('.lc')).includes('Mejor:'));
    await b.goto(SITE + '/#ninja'); await b.waitForSelector('#acctBtn .nm');
    await b.waitForFunction(() => document.querySelector('#cogPath .lc')?.textContent.includes('Mejor:'));
    check('The interview training follows the account too', (await b.textContent('#cBest')).endsWith('%'));
    await b.click('#homeBtn');
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
