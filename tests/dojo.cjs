const assert = require('node:assert/strict');
const { day, streak, seededText, drill, feedback } = require('../dojo.js');
assert.equal(day(new Date('2026-10-02T02:59:00Z')), '2026-10-01');
assert.equal(day(new Date('2026-10-02T03:00:00Z')), '2026-10-02');
assert.equal(streak(['2026-09-30', '2026-10-01'], new Date('2026-10-02T14:00Z')), 2);
assert.equal(streak(['2026-09-30'], new Date('2026-10-02T14:00Z')), 0);
assert.equal(streak(['2026-09-30', '2026-10-01', '2026-10-02'], new Date('2026-10-02T14:00Z')), 3);
const corpus = ['uno', 'dos', 'tres', 'cuatro', 'cinco'];
assert.equal(seededText('daily-2026-10-02', corpus), seededText('daily-2026-10-02', corpus));
assert.deepEqual(corpus, ['uno', 'dos', 'tres', 'cuatro', 'cinco']);
assert.ok(drill(['f'], ['faja', 'sala']).includes('faja'));
assert.ok(!drill(['f'], ['faja', 'sala']).includes('sala'));
assert.equal(drill(['<', '>'], []), '');
assert.ok(!feedback(30, 0, false).includes('GPS'));
require('../figures.js');
assert.match(Figures.describe({shape:'arrow',fill:'black',count:2,rot:45,pos:1}), /flecha.*45.*arriba/);
console.log('PASS learning helpers: dates, streaks, deterministic challenge, drills, humor and figure descriptions');

const { chromium } = require('playwright');
const { createServer } = require('./server.cjs');
(async () => {
 const server = createServer(); await new Promise(r => server.listen(4193, '127.0.0.1', r));
 const browser = await chromium.launch(process.env.CHROME_PATH ? {executablePath:process.env.CHROME_PATH}:{});
 const errors=[];
 try {
  const p = await browser.newPage(); p.on('pageerror', e=>errors.push(e.message));
  await p.goto('http://127.0.0.1:4193');
  for (const level of ['beginner','intermediate','advanced']) {
   await p.selectOption('#dojoLevel',level);
   for (const track of ['typing','fig','num','eng']) {
    await p.selectOption('#dojoTrack',track); await p.click('#dojoStart');
    assert.ok(await p.isVisible(track==='typing'?'#typing':'#qPlay'));
    if(track!=='typing') { assert.equal(await p.textContent('#qTime'),'∞'); assert.ok((await p.getAttribute('#qOpts button','aria-label')).length>8); }
    await p.keyboard.press('Escape');
   }
  }
  console.log('PASS all four tracks start at all three levels');
  await p.selectOption('#dojoTrack','num'); await p.selectOption('#dojoLevel','beginner');
  await p.uncheck('#dojoGuided'); await p.click('#dojoStart');
  await p.keyboard.press('1'); const before=await p.textContent('#qTime');
  await p.waitForTimeout(1200); assert.equal(await p.textContent('#qTime'),before);
  await p.click('#qNext'); assert.equal(await p.textContent('#qTime'),before);
  console.log('PASS timed practice pauses while reading feedback');
  await p.keyboard.press('Escape'); await p.check('#dojoGuided'); await p.uncheck('#dojoHumor');
  await p.click('#dojoStart');
  for(let i=0;i<6;i++){await p.keyboard.press('1');await p.click('#qNext');}
  assert.ok(await p.isVisible('#qResult .coach'));
  assert.ok(!(await p.textContent('#qResult .coach')).includes('GPS'));
  await p.click('#qrHome'); await p.reload();
  assert.equal(await p.inputValue('#dojoTrack'),'num'); assert.equal(await p.isChecked('#dojoHumor'),false);
  console.log('PASS results explain next step and preferences survive reload');
  const link='http://127.0.0.1:4193/?de=amiga&ppm=30&metodo=ciegas&texto=v1-demo&precision=96&tildes=strict';
  const texts=[];
  for (let i=0;i<2;i++) { const a=await browser.newPage();await a.goto(link);await a.click('#challengeAccept');texts.push(await a.textContent('#inner'));await a.close(); }
  assert.equal(texts[0],texts[1]);
  console.log('PASS two friends get identical challenge text');
  await p.selectOption('#dojoTrack','typing'); await p.selectOption('#dojoLevel','beginner');
  await p.click('#dojoStart'); await p.keyboard.press('z');
  await p.waitForTimeout(1100);
  const text=await p.textContent('#inner'); await p.keyboard.type(text);
  await p.click('#rDrill'); assert.ok((await p.textContent('#lName')).includes('Rescate'));
  const starsBefore=await p.evaluate(()=>JSON.parse(localStorage.getItem('teclado-ciego-v1')).lessons);
  await p.keyboard.type(await p.textContent('#inner'));
  const starsAfter=await p.evaluate(()=>JSON.parse(localStorage.getItem('teclado-ciego-v1')).lessons);
  assert.deepEqual(starsBefore,starsAfter);
  assert.equal(await p.locator('#rNext').count(),0);
  console.log('PASS targeted drill does not award unrelated lesson progress');
  for(const width of [320,390,768,1440]) {
   const m=await browser.newPage({viewport:{width,height:900},isMobile:width<500,hasTouch:width<500});
   m.on('pageerror',e=>errors.push(e.message));await m.goto('http://127.0.0.1:4193');
   assert.ok(await m.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Overflow at ${width}`);
   if(width<500) assert.equal(await m.getAttribute('#preferencePanel','open'),null);
   await m.selectOption('#dojoTrack','fig');await m.click('#dojoStart');
   assert.ok(await m.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Quiz overflow at ${width}`);
   await m.keyboard.press('1');assert.ok(await m.isVisible('#qFeedback'));await m.close();
  }
  console.log('PASS desktop/mobile layout and exercise interaction at 320, 390, 768 and 1440 pixels');
  assert.deepEqual(errors,[]);console.log('PASS no browser runtime errors');
 } finally {await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
