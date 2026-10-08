// The new layout of the home page (/nueva): tabs, the "Seguí acá" card, lessons and quizzes with the shared engine,
// dark mode and the phone. Run: npm test (needs Playwright's Chromium).
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { createServer } = require('./server.cjs');
const SITE = 'http://127.0.0.1:4197';
const check = (name, ok) => { assert.ok(ok, name); console.log('PASS', name); };

(async () => {
  const server = createServer(); await new Promise(r => server.listen(4197, '127.0.0.1', r));
  const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
  const errors = [];
  const open = async (path = '/nueva', opts = {}) => {
    const ctx = await browser.newContext(opts);
    await ctx.addInitScript(() => { window.tnEvents = { push: e => (window.__ev = window.__ev || []).push(e) }; });
    const p = await ctx.newPage(); p.on('pageerror', e => errors.push(e.message));
    await p.goto(SITE + path); await p.waitForLoadState('networkidle'); return p;
  };
  const tab = p => p.evaluate(() => document.body.dataset.tab);
  const visible = (p, sel) => p.isVisible(sel);
  const events = (p, name) => p.evaluate(n => (window.__ev || []).filter(e => e[0] === n).map(e => e[1]), name);
  try {
    const p = await open();
    check('/nueva is not indexed', await p.getAttribute('meta[name="robots"]', 'content') === 'noindex, nofollow');
    check('Page IDs are unique', await p.evaluate(() => { const ids = [...document.querySelectorAll('[id]')].map(e => e.id); return new Set(ids).size === ids.length; }));
    check('It opens on Inicio: hero, the two dojos and the quick challenges', await tab(p) === 'inicio' && await visible(p, '#heroTitle') && await visible(p, '#continue') && await visible(p, '#scNinja') && await visible(p, '#nvGameIq') && !(await visible(p, '#path')));
    await p.click('.nv-links [data-go="teclado"]');
    check('Teclado shows its dojo and changes the address', await tab(p) === 'teclado' && await visible(p, '#tkContinue') && await visible(p, '#path') && !(await visible(p, '#heroTitle')) && p.url().endsWith('/nueva#teclado'));
    check('"Seguí acá" points to the first lesson', (await p.textContent('#tkNextTitle')).includes('Lección 1') && (await p.textContent('#tkCount')) === '0 de 26' && (await p.$$('#tkKeys kbd')).length === 2);
    await p.click('[data-view-of="teclado"] [role="tab"][data-sub="medir"]');
    check('The Medir tab shows the speed tests', await visible(p, '#methods') && !(await visible(p, '#path')));
    await p.click('[data-view-of="teclado"] [role="tab"][data-sub="ajustes"]');
    check('The Ajustes tab has the keyboard settings', await visible(p, '#layout') && await visible(p, '#kbMode'));
    await p.click('.nv-links [data-go="mente"]');
    check('Mente shows the tracks and the next session', await tab(p) === 'mente' && await visible(p, '#cogTracks') && await visible(p, '#cogContinue') && p.url().endsWith('#ninja'));
    await p.click('.nv-links [data-go="ranking"]');
    check('Ranking shows the ranking', await tab(p) === 'ranking' && await visible(p, '#rankList'));
    check('Moving between tabs is measured', (await events(p, 'nav_tab')).some(e => e.tab === 'mente'));

    // A lesson from "Seguí acá", and back to the same dojo
    await p.click('.nv-links [data-go="teclado"]'); await p.click('#tkContinue');
    check('Continuar opens the lesson', await visible(p, '#lesson') && !(await visible(p, '#home')) && (await p.textContent('#lName')).includes('F'));
    await p.evaluate(() => { const key = document.querySelector('#inner .c').textContent; document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })); });
    await p.click('#back');
    check('Leaving the lesson goes back to the keyboard dojo', await visible(p, '#home') && await tab(p) === 'teclado' && await visible(p, '#tkContinue'));
    // The speed test from the hero, and back
    await p.click('[data-go="inicio"]'); await p.click('#nvHeroSpeed');
    check('Medir mi velocidad starts the 1-minute test', await visible(p, '#lesson') && (await p.textContent('#lGroup')).includes('1 minuto') && (await events(p, 'quick_start')).some(e => e.kind === 'speed'));
    await p.click('#back');
    check('…and coming back shows the speed tests', await tab(p) === 'teclado' && await visible(p, '#methods'));
    // The IQ challenge from the hero, and back to Mente
    await p.click('[data-go="inicio"]'); await p.click('#nvHeroIq');
    check('Desafío IQ ninja opens the 5-minute challenge', await visible(p, '#quiz') && await visible(p, '#qGo'));
    await p.click('#qBack');
    check('Leaving it goes to the mental dojo', await visible(p, '#home') && await tab(p) === 'mente');

    // Links into a section
    const q = await open('/nueva#ninja');
    check('/nueva#ninja opens Mente', await tab(q) === 'mente' && await visible(q, '#cogTracks'));
    const r = await open('/nueva#teclado');
    check('/nueva#teclado opens Teclado', await tab(r) === 'teclado');

    // Optional dark mode, remembered
    check('It starts light', await p.getAttribute('html', 'data-theme') === 'light');
    await p.click('[data-go="inicio"]'); await p.click('#nvTheme');
    check('The moon button switches to dark', await p.getAttribute('html', 'data-theme') === 'dark' && await p.getAttribute('#nvTheme', 'aria-pressed') === 'true');
    await p.reload(); await p.waitForLoadState('networkidle');
    check('…and dark mode survives a reload', await p.getAttribute('html', 'data-theme') === 'dark');

    // Phone: the tab bar at the bottom, no sideways scroll
    const m = await open('/nueva', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    check('On a phone there is a tab bar and the page does not scroll sideways', await visible(m, '.nv-tabbar') && await m.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await m.tap('.nv-tabbar [data-go="mente"]');
    check('The tab bar changes the section', await tab(m) === 'mente' && await m.getAttribute('.nv-tabbar [data-go="mente"]', 'aria-current') !== null);

    // The current home keeps working as before with the shared engine
    const h = await open('/');
    check('The current home still has no layout of its own and opens as always', await h.evaluate(() => !window.tnLayout && !!window.tnApp) && await visible(h, '#continue') && await visible(h, '#path'));
    check('No uncaught browser errors', errors.length === 0);
  } finally {
    await browser.close(); server.close();
    if (errors.length) console.error(errors);
  }
})().catch(err => { console.error(err); process.exit(1); });
