// The new layout of the home page (/nueva): one page with sections, the "Seguí acá" card, lessons and quizzes with the
// shared engine, the belts, quick challenges, dark mode, the phone and its bridge to the computer. Run: npm test (needs Playwright's Chromium).
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
  const visible = (p, sel) => p.isVisible(sel);
  const events = (p, name) => p.evaluate(n => (window.__ev || []).filter(e => e[0] === n).map(e => e[1]), name);
  // A section is "on screen" when its top is in the upper half of the window
  const onScreen = (p, sec) => p.waitForFunction(s => { const r = document.querySelector(`[data-view-of="${s}"]`).getBoundingClientRect(); return r.top < innerHeight * .5 && r.bottom > 90; }, sec, { timeout: 5000 }).then(() => true, () => false);
  const current = (p, sel = '.nv-links') => p.evaluate(sel => document.querySelector(`${sel} [aria-current]`)?.dataset.go, sel);
  try {
    const p = await open();
    check('/nueva is not indexed', await p.getAttribute('meta[name="robots"]', 'content') === 'noindex, nofollow');
    check('Page IDs are unique', await p.evaluate(() => { const ids = [...document.querySelectorAll('[id]')].map(e => e.id); return new Set(ids).size === ids.length; }));
    check('One page: hero, dojos, the lessons of Teclado, the paths of Mente, challenges and ranking, all while scrolling', await visible(p, '#heroTitle') && await visible(p, '#continue') && await visible(p, '#path .lc') && await visible(p, '#cogPath .lc') && await visible(p, '#nvGameIq') && await visible(p, '#rankList'));
    check('The order is Inicio → Teclado → Mente → Desafíos → Ranking', await p.evaluate(() => ['inicio', 'teclado', 'mente', 'desafios', 'ranking'].map(s => document.querySelector(`[data-view-of="${s}"]`).getBoundingClientRect().top).every((t, i, a) => !i || t > a[i - 1])));
    check('"Seguí acá" points to the first lesson, out of the 26 of the course', (await p.textContent('#tkNextTitle')).includes('Lección 1') && (await p.textContent('#tkCount')) === '26 lecciones cortas' && (await p.$$('#tkKeys kbd')).length === 2);
    check('Before graduating, the belts are one discreet line', await visible(p, '#path .belts-teaser') && !(await visible(p, '#path .group.belt')) && !(await visible(p, '#tkBeltsBox')));
    await p.click('#path .belts-teaser button');
    check('…that shows them on purpose', await visible(p, '#path .group.belt[data-belt="amarillo"]') && (await events(p, 'belts_preview')).some(e => e.shown));
    await p.click('#path .belts-teaser button');
    await p.click('.nv-links [data-go="teclado"]');
    check('The header takes you to a section and says where you are', await onScreen(p, 'teclado') && p.url().endsWith('/nueva#teclado') && await current(p) === 'teclado' && (await events(p, 'nav_section')).some(e => e.section === 'teclado'));
    await p.click('[data-view-of="teclado"] [role="tab"][data-sub="medir"]');
    check('The Medir tab of Teclado shows the speed tests', await visible(p, '#methods') && !(await visible(p, '#path')));
    await p.click('[data-view-of="teclado"] [role="tab"][data-sub="ajustes"]');
    check('The Ajustes tab has the keyboard settings', await visible(p, '#layout') && await visible(p, '#kbMode'));
    await p.click('[data-view-of="teclado"] [role="tab"][data-sub="entrenar"]');
    await p.click('.nv-links [data-go="mente"]');
    check('Mente: tracks and the next session', await onScreen(p, 'mente') && p.url().endsWith('#ninja') && await visible(p, '#cogContinue'));
    await p.click('.nv-links [data-go="ranking"]');
    check('Ranking', await onScreen(p, 'ranking'));

    // A lesson from "Seguí acá", and back to the same section
    await p.click('#tkContinue');
    check('Continuar opens the lesson', await visible(p, '#lesson') && !(await visible(p, '#home')) && (await p.textContent('#lName')).includes('F'));
    await p.evaluate(() => { const key = document.querySelector('#inner .c').textContent; document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })); });
    await p.click('#back');
    check('Leaving the lesson goes back to Teclado', await visible(p, '#home') && await onScreen(p, 'teclado'));
    await p.click('[data-go="inicio"]'); await p.click('#nvHeroSpeed');
    check('On a computer, Medir mi velocidad starts the 1-minute test', await visible(p, '#lesson') && (await p.textContent('#lGroup')).includes('1 minuto') && (await events(p, 'quick_start')).some(e => e.kind === 'speed'));
    await p.click('#back');
    check('…and coming back shows the speed tests', await onScreen(p, 'teclado') && await visible(p, '#methods'));
    await p.click('[data-view-of="teclado"] [role="tab"][data-sub="entrenar"]');
    await p.click('[data-go="inicio"]'); await p.click('#nvHeroIq');
    check('Desafío IQ ninja opens the 5-minute challenge', await visible(p, '#quiz') && await visible(p, '#qGo'));
    await p.click('#qBack');
    check('Leaving it goes back to Mente', await visible(p, '#home') && await onScreen(p, 'mente'));
    check('A computer gets no phone bridge', !(await visible(p, '#nvBridge')) && !(await visible(p, '#nvHeroSave')));

    // Links into a section
    const q = await open('/nueva#ninja');
    check('/nueva#ninja opens on Mente', await onScreen(q, 'mente'));
    const r = await open('/nueva#teclado');
    check('/nueva#teclado opens on Teclado', await onScreen(r, 'teclado'));

    // Optional dark mode, remembered
    check('It starts light', await p.getAttribute('html', 'data-theme') === 'light');
    await p.click('[data-go="inicio"]'); await p.click('#nvTheme');
    check('The moon button switches to dark', await p.getAttribute('html', 'data-theme') === 'dark' && await p.getAttribute('#nvTheme', 'aria-pressed') === 'true');
    await p.reload(); await p.waitForLoadState('networkidle');
    check('…and dark mode survives a reload', await p.getAttribute('html', 'data-theme') === 'dark');

    // Phone: tab bar, compact groups and the bridge to the computer
    const phone = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true };
    const m = await open('/nueva', phone);
    check('On a phone there is a tab bar and the page does not scroll sideways', await visible(m, '.nv-tabbar') && await m.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await m.tap('.nv-tabbar [data-go="mente"]');
    check('The tab bar takes you to a section', await onScreen(m, 'mente') && await current(m, '.nv-tabbar') === 'mente');
    check('The groups are compact: the one in progress open, the others one line', await m.isVisible('#path .group:first-child .lc') && !(await m.isVisible('#path .group:nth-child(2) .lc')) && await m.isVisible('#path .group:nth-child(2) .nv-fold-btn'));
    await m.tap('#path .group:nth-child(2) .nv-fold-btn');
    check('…and open with a tap', await m.isVisible('#path .group:nth-child(2) .lc'));
    check('The phone gets the bridge: why a keyboard, the phone challenge and saving the course', await m.isVisible('#nvBridge') && (await m.textContent('#nvHeroSpeed')).includes('Desafío de celular') && await m.isVisible('#nvHeroSave') && (await events(m, 'mobile_bridge_shown')).length === 1);
    await m.tap('#nvSave');
    check('Saving the course offers WhatsApp, mail and the link, and an account', await m.isVisible('#nvSavePanel') && await m.isVisible('#nvWa') && await m.isVisible('#nvMail') && await m.isVisible('#nvCopy') && await m.isVisible('#nvSaveAccount'));
    const waUrl = new Promise(res => m.context().once('page', pg => res(pg.url())));
    await m.tap('#nvWa');
    check('WhatsApp carries the link to the course for the computer', decodeURIComponent(await waUrl).includes('/nueva?desde=celu#teclado') && (await events(m, 'mobile_bridge_action')).some(e => e.action === 'whatsapp'));
    // The phone typing challenge: its own result, not the course's
    await m.tap('.nv-tabbar [data-go="inicio"]'); await m.tap('#nvHeroSpeed');
    check('The phone challenge opens on its own screen', await m.isVisible('#game') && (await m.textContent('#gameTitle')) === 'Desafío de celular');
    await m.tap('#gameGo');
    await m.evaluate(() => { const text = [...document.querySelectorAll('#gmCeluText span')].map(s => s.textContent).join(''); const inp = document.getElementById('gmCeluIn'); inp.value = text.slice(0, 60); inp.dispatchEvent(new Event('input')); });
    await m.waitForSelector('.gm-result', { timeout: 35000 });
    check('After 30 seconds: words per minute on the phone, kept apart from the course', (await m.textContent('.gm-score')).includes('ppm') && (await m.textContent('.gm-compare')).includes('aparte de la de la compu') && await m.evaluate(() => !JSON.parse(localStorage.getItem('teclado-ciego-v1') || '{}').tests?.length));
    check('…and it offers saving the course for the computer', (await m.textContent('#gameCta')).includes('Guardarme el curso'));
    await m.tap('#gameCta');
    check('which opens the saving options in Teclado', await m.isVisible('#nvSavePanel') && await onScreen(m, 'teclado'));
    await m.tap('#nvHasKb');
    check('"Tengo teclado físico" turns the bridge off', !(await m.isVisible('#nvBridge')) && (await m.textContent('#nvHeroSpeed')).includes('Medir mi velocidad'));
    // On the computer, from the saved link
    const back = await open('/nueva?desde=celu#teclado');
    check('Arriving on the computer from the phone link says hello, and is measured', await back.isVisible('#nvWelcome') && (await events(back, 'continued_from_phone')).length === 1 && back.url().endsWith('/nueva#teclado'));

    // Desafíos rápidos
    const g = await open('/nueva#desafios');
    check('The challenges section lists the four quick challenges', (await g.$$('[data-view-of="desafios"] .nv-game[data-game]')).length === 4);
    // Chimp test: the first round right, then three mistakes
    await g.click('.nv-game[data-game="chimpance"]');
    check('A challenge opens its own screen, without the tab bar', await g.isVisible('#game') && !(await g.isVisible('#home')) && g.url().endsWith('#juego-chimpance'));
    await g.click('#gameGo');
    for (let n = 1; n <= 4; n++) await g.click(`.gm-cell[data-n="${n}"]`);
    await g.waitForFunction(() => document.querySelectorAll('.gm-cell').length === 5);
    check('Getting the round right adds a number', true);
    for (let i = 0; i < 3; i++) { await g.waitForSelector('.gm-cell[data-n="2"]:not(.done)'); await g.click('.gm-cell[data-n="2"]'); await g.waitForTimeout(800); }
    await g.waitForSelector('.gm-result');
    check('Three mistakes end it with the score and the chimp to beat', (await g.textContent('.gm-score')).trim().startsWith('4') && (await g.textContent('.gm-compare')).includes('Ayumu') && (await events(g, 'game_completed')).some(e => e.game === 'chimpance' && e.score === 4));
    await g.click('#gameOut');
    check('Leaving goes back to the challenges, with the best score on the tile', await onScreen(g, 'desafios') && (await g.textContent('.nv-game[data-game="chimpance"]')).includes('Tu mejor: 4'));
    // Number memory: one right, one wrong
    await g.evaluate(() => { Math.random = () => 0; });
    await g.click('.nv-game[data-game="numeros"]'); await g.click('#gameGo');
    check('The number shows first', (await g.textContent('.gm-digits')) === '100');
    await g.waitForSelector('#gmNumIn'); await g.fill('#gmNumIn', '100'); await g.press('#gmNumIn', 'Enter');
    check('Typing it right says so', (await g.textContent('.gm-check')).includes('Bien'));
    await g.click('#gmNumNext'); await g.waitForSelector('#gmNumIn', { timeout: 8000 }); await g.fill('#gmNumIn', '9'); await g.press('#gmNumIn', 'Enter');
    await g.click('#gmNumNext');
    check('A mistake ends it: the score is the longest number remembered', (await g.textContent('.gm-score')).trim().startsWith('3'));
    // Reaction time: too early, then five tries (with the shortest waits)
    await g.click('#gameOut'); await g.click('.nv-game[data-game="reflejos"]'); await g.click('#gameGo');
    await g.click('.gm-react');
    check('Tapping before green does not count', (await g.textContent('.gm-react')).includes('Muy pronto'));
    await g.click('.gm-react');
    for (let i = 0; i < 5; i++) { await g.waitForSelector('.gm-react.go', { timeout: 6000 }); await g.click('.gm-react'); if (i < 4) await g.click('.gm-react'); }
    await g.waitForSelector('.gm-result');
    check('Five tries give the average in milliseconds', /\d+/.test(await g.textContent('.gm-score')) && (await g.textContent('.gm-score')).includes('ms'));
    // Visual memory: clicking the lit squares passes the level
    await g.evaluate(() => { Math.random = (() => { let x = 7; return () => (x = (x * 9301 + 49297) % 233280) / 233280; })(); }); // varied, but repeatable
    await g.click('#gameOut'); await g.click('.nv-game[data-game="visual"]'); await g.click('#gameGo');
    const lit = await g.$$eval('.gm-sq.lit', els => els.map(e => [...e.parentNode.children].indexOf(e)));
    await g.waitForFunction(() => !document.querySelector('.gm-vis.show'));
    for (const i of lit) await g.click(`.gm-sq:nth-child(${i + 1})`);
    await g.waitForFunction(() => document.querySelector('#gameLive').textContent.includes('Nivel 2'));
    check('Visual memory moves to the next level', true);
    await g.click('#gameBack');
    check('The back button leaves the challenge', await g.isVisible('#home'));
    const dl = await open('/nueva#juego-reflejos');
    check('A link to a challenge (for sharing) opens it', await dl.isVisible('#game') && (await dl.textContent('#gameTitle')) === 'Reflejos');

    // Belts: after the 26 lessons of the base course
    const BASE = ['fj','dk','sl','añ','gh','rep1','ei','ru','ty','wo','qp','rep2','nm','vb','c,','x.','z','rep3','may','til','ref','cos','ofi','tec','coc','via'];
    const graduate = async (ctx, extra = {}) => ctx.addInitScript(([ids, extra]) => { localStorage.setItem('teclado-ciego-v1', JSON.stringify({ lessons: Object.fromEntries([...ids.map(id => [id, { stars: 2, ppm: 30, acc: 96 }]), ...Object.entries(extra)]) })); }, [BASE, extra]);
    const bctx = await browser.newContext(); await graduate(bctx);
    const bp = await bctx.newPage(); bp.on('pageerror', e => errors.push(e.message));
    await bp.goto(SITE + '/nueva#teclado'); await bp.waitForLoadState('networkidle');
    check('After the base course, "Seguí acá" goes on with the yellow belt', (await bp.textContent('#tkNextEyebrow')).includes('Cinturón amarillo') && (await bp.textContent('#tkNextTitle')) === 'Lección 1: Comas' && (await bp.textContent('#tkCount')) === '0 de 8');
    check('The belt row marks the base course done and the yellow belt as current', await bp.getAttribute('#tkBelts li:nth-child(1)', 'class') === 'done' && await bp.getAttribute('#tkBelts li:nth-child(2)', 'class') === 'current' && (await bp.$$('#tkBelts li')).length === 6);
    check('Only the current belt shows its lessons (the base course hides)', await bp.isVisible('#path [data-belt="amarillo"]') && !(await bp.isVisible('#path [data-belt="naranja"]')) && !(await bp.isVisible('#path > .group:not(.belt)')));
    await bp.click('#tkBelts li:nth-child(1)');
    check('The white belt shows the base course again', await bp.isVisible('#path > .group:not(.belt)'));
    await bp.click('#tkContinue');
    check('A belt lesson opens with its belt and its own text', (await bp.textContent('#lGroup')).includes('Cinturón amarillo · lección 1 de 8') && (await bp.textContent('#inner')).includes(','));
    await bp.evaluate(() => { const text = [...document.querySelectorAll('#inner .c')].map(s => s.textContent).join(''); for (const key of text) { const up = key !== key.toLowerCase(); document.dispatchEvent(new KeyboardEvent('keydown', { key, shiftKey: up, bubbles: true, cancelable: true })); } });
    await bp.waitForSelector('#result:not([hidden])');
    check('Passing it counts for the belt and offers the next lesson', (await bp.textContent('#result')).includes('Cinturón amarillo: 1 de 8') && (await bp.textContent('#rNext')).includes('Punto y mayúscula'));
    await bp.click('#rHome');
    check('…and "Seguí acá" moves on', (await bp.textContent('#tkNextTitle')) === 'Lección 2: Punto y mayúscula' && (await bp.textContent('#tkCount')) === '1 de 8');
    // Graduation: the last of the 26 lessons
    const gctx = await browser.newContext(); await gctx.addInitScript(ids => { localStorage.setItem('teclado-ciego-v1', JSON.stringify({ lessons: Object.fromEntries(ids.slice(0, -1).map(id => [id, { stars: 2, ppm: 30, acc: 96 }])) })); }, BASE);
    const gp = await gctx.newPage(); gp.on('pageerror', e => errors.push(e.message));
    await gp.goto(SITE + '/nueva#teclado'); await gp.waitForLoadState('networkidle');
    check('One lesson to go: the count is about the course', (await gp.textContent('#tkCount')) === '25 de 26 completadas · te faltan 1');
    await gp.click('#tkContinue');
    await gp.evaluate(() => { const text = [...document.querySelectorAll('#inner .c')].map(s => s.textContent).join(''); for (const key of text) document.dispatchEvent(new KeyboardEvent('keydown', { key, shiftKey: key !== key.toLowerCase(), bubbles: true, cancelable: true })); });
    await gp.waitForSelector('#result:not([hidden])');
    check('Finishing the 26 lessons celebrates the course and proposes the next challenge', (await gp.textContent('#result')).includes('¡Terminaste el curso!') && (await gp.textContent('#result')).includes('medición final') && (await gp.textContent('#rNext')).includes('Comas'));
    await gp.click('#rHome');
    check('Then the belts show up', await gp.isVisible('#tkBeltsBox') && (await gp.textContent('#tkNextEyebrow')).includes('Cinturón amarillo'));

    // The last lesson of a belt wins it
    const wctx = await browser.newContext(); await graduate(wctx, Object.fromEntries(['b1a','b1b','b1c','b1d','b1e','b1f','b1g'].map(id => [id, { stars: 2, ppm: 30, acc: 96 }])));
    const wp = await wctx.newPage(); wp.on('pageerror', e => errors.push(e.message));
    await wp.goto(SITE + '/nueva#teclado'); await wp.waitForLoadState('networkidle'); await wp.click('#tkContinue');
    await wp.evaluate(() => { const text = [...document.querySelectorAll('#inner .c')].map(s => s.textContent).join(''); for (const key of text) document.dispatchEvent(new KeyboardEvent('keydown', { key, shiftKey: key !== key.toLowerCase(), bubbles: true, cancelable: true })); });
    await wp.waitForSelector('#result:not([hidden])');
    check('Passing the last lesson of a belt wins it and points to the next one', (await wp.textContent('#result')).includes('¡Conseguiste el cinturón amarillo!') && (await wp.textContent('#result')).includes('cinturón naranja'));
    await wp.click('#rHome');
    check('The row shows the yellow belt done and the orange one current', await wp.getAttribute('#tkBelts li:nth-child(2)', 'class') === 'done' && await wp.getAttribute('#tkBelts li:nth-child(3)', 'class') === 'current' && await wp.isVisible('#path [data-belt="naranja"]'));
    const hb = await open('/');
    check('The current home lists the five belts after the base course', (await hb.$$('#path .group.belt')).length === 5 && (await hb.$$('#path .group.belt .lc')).length === 40);

    // The current home keeps working as before with the shared engine
    const h = await open('/');
    check('The current home still has no layout of its own and opens as always', await h.evaluate(() => !window.tnLayout && !!window.tnApp) && await visible(h, '#continue') && await visible(h, '#path'));
    check('No uncaught browser errors', errors.length === 0);
  } finally {
    await browser.close(); server.close();
    if (errors.length) console.error(errors);
  }
})().catch(err => { console.error(err); process.exit(1); });
