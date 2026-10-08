// /nueva: the new layout of the home page (a candidate for an A/B test against index.html). Same engine (app.js).
// One page that scrolls: Inicio → Teclado (with its lessons) → Mente (with its paths) → Desafíos → Mi dojo → Ranking; the
// header and the phone's tab bar take you to each section. It also adds the "Seguí acá" card, compact groups on
// the phone, the bridge from the phone to the computer and the optional dark mode. Loaded before app.js, so that
// app.js finds window.tnLayout and tells it where it goes; the buttons are wired once the page is ready.
(() => {
  const $id = id => document.getElementById(id);
  const SECTIONS = ['inicio', 'teclado', 'mente', 'desafios', 'dojo', 'ranking'];
  const HASH = { inicio: '', teclado: '#teclado', mente: '#ninja', desafios: '#desafios', dojo: '#dojo', ranking: '#ranking' };
  const gameOf = hash => (/^#juego-(\w+)$/.exec(hash) || [])[1];
  const secOf = hash => hash === '#teclado' ? 'teclado' : /^#(ninja|entrevistas)$/.test(hash) ? 'mente' : hash === '#desafios' ? 'desafios' : hash === '#dojo' ? 'dojo' : hash === '#ranking' ? 'ranking' : 'inicio';
  const capture = (e, p) => window.tn?.capture?.(e, p);
  const anchor = sec => document.querySelector(`[data-view-of="${sec}"]`);
  // A phone or tablet without a physical keyboard ("Tengo teclado físico" turns this off, remembered).
  const store = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch {} return null; };
  const touchOnly = () => matchMedia('(hover: none) and (pointer: coarse)').matches && store('tn-has-keyboard') !== '1';

  function setSub(sec, sub) {
    const view = anchor(sec);
    if (!view || !view.querySelector(`[data-sub-of="${sub}"]`)) return;
    view.querySelectorAll('[data-sub-of]').forEach(s => { s.hidden = s.dataset.subOf !== sub; });
    view.querySelectorAll('[role="tab"][data-sub]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.sub === sub)));
    if (sec === 'teclado' && sub === 'medir' && window.tnApp?.chartShown()) tnApp.drawChart(); // the chart sizes itself to a visible box
    if (sec === 'dojo' && sub === 'batallas') renderBattles(true);
  }
  let holdMark = 0; // while the page scrolls to a section by itself, the sections it passes don't light up
  function markCurrent(sec) { document.querySelectorAll('[data-go]').forEach(a => a.toggleAttribute('aria-current', a.dataset.go === sec)); }
  // Go to a section: scroll there (instantly when coming back from a lesson), say where we are in the address.
  function goTo(sec, { sub, scroll = true, smooth = true } = {}) {
    if (!SECTIONS.includes(sec)) sec = 'inicio';
    if (sub) setSub(sec, sub);
    markCurrent(sec); if (scroll) holdMark = performance.now() + 1200;
    const want = location.pathname + location.search + HASH[sec];
    if (location.pathname + location.search + location.hash !== want) history.replaceState(null, '', want);
    if (scroll) sec === 'inicio' ? scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' }) : anchor(sec).scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
  }

  // Desafíos rápidos (desafios.js): their tiles, and their own screen next to the lesson and quiz ones.
  const TILE_ART = {
    reflejos: '<span class="nv-react-dot">¡Ya!</span>',
    numeros: '<span class="nv-vis-txt mono">4 8 1 9</span>',
    chimpance: '<svg viewBox="0 0 120 70" width="104" aria-hidden="true"><g font-family="JetBrains Mono" font-weight="700" font-size="14" text-anchor="middle">' + [[18, 18, 1], [62, 14, 2], [98, 30, 3], [34, 52, 4], [80, 54, 5]].map(([x, y, n]) => `<rect x="${x - 11}" y="${y - 11}" width="22" height="22" rx="5" fill="var(--card)" stroke="var(--line)"/><text x="${x}" y="${y + 5}" fill="var(--ink)">${n}</text>`).join('') + '</g></svg>',
    visual: '<svg viewBox="0 0 70 70" width="64" aria-hidden="true">' + Array.from({ length: 16 }, (_, i) => `<rect x="${(i % 4) * 17 + 1}" y="${Math.floor(i / 4) * 17 + 1}" width="15" height="15" rx="3" fill="${[1, 6, 11, 12].includes(i) ? 'var(--accent)' : 'var(--card)'}" stroke="var(--line)"/>`).join('') + '</svg>',
    celu: '<span class="nv-vis-txt">📱 <small>30 s</small></span>',
  };
  const TILE_SUB = { reflejos: 'Tiempo de reacción · 30 s', numeros: 'Como en los psicotécnicos · 1 min', chimpance: '¿Le ganás a un chimpancé? · 1 min', visual: 'Recordá el patrón · 1 min', celu: 'Escribir en el celu · 30 s' };
  function renderTiles() {
    const best = Desafios.bests(), ids = [...(touchOnly() ? ['celu'] : []), 'chimpance', 'numeros', 'visual', 'reflejos'];
    document.querySelectorAll('[data-games]').forEach(slot => {
      slot.parentElement.querySelectorAll('.nv-game[data-game]').forEach(t => t.remove());
      slot.before(...ids.map(id => {
        const g = Desafios.GAMES[id], b = document.createElement('button');
        b.className = 'nv-game'; b.dataset.game = id;
        b.innerHTML = `<span class="nv-vis">${TILE_ART[id]}</span><b>${g.name}</b><span>${best[id] != null ? `Tu mejor: ${best[id]} ${g.unit}` : TILE_SUB[id]}</span>`;
        b.onclick = () => openGame(id);
        return b;
      }));
    });
  }
  let gameFrom = 'desafios', gameSub;
  function openGame(id, opts = {}) {
    if (!Desafios.GAMES[id]) return;
    if (tnApp.mode() !== 'home') tnApp.goHome();
    gameFrom = opts.battle || opts.from === 'dojo' ? 'dojo' : id === 'celu' ? 'teclado' : 'desafios';
    gameSub = opts.battle ? 'batallas' : opts.from === 'dojo' ? 'marcas' : undefined;
    $id('home').hidden = true; $id('game').hidden = false; document.body.dataset.view = 'game';
    history.replaceState(null, '', location.pathname + location.search + '#juego-' + id);
    scrollTo({ top: 0 });
    Desafios.open(id, closeGame, opts);
  }
  function closeGame() {
    $id('game').hidden = true;
    tnApp.goHome(); renderTiles(); renderDojo(); renderBattles(true);
    goTo(gameFrom, { sub: gameSub, smooth: false });
  }

  // "Seguí acá": the next lesson (of the course, then of the current belt), how far it goes and its keys. Until
  // the 26 lessons are done, progress always refers to the course; the belts are one line until graduation.
  function renderNext() {
    if (!window.tnApp) return;
    const { LESSONS, GROUPS, BELTS, state: S } = tnApp, nl = tnApp.nextLesson();
    const passed = l => S.lessons[l.id]?.stars >= 1;
    const baseDone = LESSONS.filter(passed).length, baseAll = baseDone === LESSONS.length;
    const inBelt = nl.belt != null, B = inBelt ? BELTS[nl.belt] : null, bs = inBelt ? tnApp.beltState(nl.belt) : null;
    const allDone = baseAll && BELTS.every((_, bi) => tnApp.beltState(bi).complete);
    $id('tkNextEyebrow').textContent = allDone ? 'Cinturón negro completo 🥋' : inBelt ? `Seguí acá · ${B.name}` : `Seguí acá · ${GROUPS[nl.g].name}`;
    $id('tkNextTitle').textContent = allDone ? 'Repasá o medí tu velocidad' : `Lección ${nl.n}: ${nl.name}`;
    $id('tkNextDesc').textContent = allDone ? 'Terminaste el curso y los cinco cinturones. Volvé a cualquier lección para sumar estrellas.' : inBelt ? `${B.theme}. Meta: ${nl.goal} palabras por minuto.` : GROUPS[nl.g].desc;
    const done = inBelt ? bs.done : baseDone, total = inBelt ? bs.total : LESSONS.length;
    $id('tkBar').style.width = Math.round(done / total * 100) + '%';
    $id('tkCount').textContent = inBelt ? `${done} de ${total}` : baseAll ? `${total} de ${total} · curso completo` : done ? `${done} de ${total} completadas · te faltan ${total - done}` : `${total} lecciones cortas`;
    $id('tkContinue').textContent = allDone ? 'Repasar →' : done || baseAll ? 'Continuar →' : 'Empezar →';
    $id('tkKeys').innerHTML = inBelt ? `<span class="belt-badge nv-belt-big" style="--bc:${B.color}"></span>` : nl.type === 'keys' ? [...nl.keys].map(k => `<kbd style="--fc:${tnApp.fcol(tnApp.key(k)?.f || 'th')}">${k.toUpperCase()}</kbd>`).join('') : '';
    const cb = baseAll ? tnApp.currentBelt() : -1;
    $id('tkBelts').innerHTML = [`<li class="${baseAll ? 'done' : 'current'}" style="--bc:#F3F1EA"><b>Blanco</b><span>Curso base · ${baseDone}/${LESSONS.length}</span></li>`,
      ...BELTS.map((b, bi) => { const st = tnApp.beltState(bi); return `<li class="${st.complete ? 'done' : bi === cb ? 'current' : 'ahead'}" style="--bc:${b.color}"><b>${b.name.replace('Cinturón ', '').replace(/^./, c => c.toUpperCase())}</b><span>${b.theme}</span></li>`; })].join('');
    $id('tkBeltsBox').hidden = !baseAll; // the row of belts shows up with the graduation
    document.body.classList.toggle('nv-base-done', baseAll);
    const white = $id('tkBelts').firstElementChild; // finished, the course hides; its belt shows it again
    if (baseAll) { white.tabIndex = 0; white.setAttribute('role', 'button'); white.title = 'Ver las lecciones del curso'; white.onclick = white.onkeydown = e => { if (e.type === 'keydown' && e.key !== 'Enter') return; document.body.classList.toggle('nv-show-base'); }; }
    fold(); renderDojo();
  }

  // Mi dojo: who you are and your next goal; the training in its current block (not the whole mountain of
  // lessons), your marks with their evolution, and the battles (a score to beat, sent by link: desafios.js).
  const esc = t => String(t ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const nickName = () => { try { return JSON.parse(localStorage.getItem('tn-nick')); } catch { return null; } };
  function renderDojo() {
    if (!window.tnApp || !$id('midojo')) return;
    const { LESSONS, GROUPS, BELTS, state: S } = tnApp, nl = tnApp.nextLesson();
    const passed = l => S.lessons[l.id]?.stars >= 1, baseDone = LESSONS.filter(passed).length, baseAll = baseDone === LESSONS.length;
    const inBelt = nl.belt != null, B = inBelt ? BELTS[nl.belt] : null;
    const allDone = baseAll && BELTS.every((_, bi) => tnApp.beltState(bi).complete);
    const name = tnApp.userName() || nickName();
    $id('mdName').textContent = name || 'Ninja invitado';
    $id('mdAv').textContent = name ? [...name][0].toUpperCase() : '🥷';
    const ppm = tnApp.bestPpm(), next = ppm ? tnApp.nextTier(ppm) : null;
    const belt = baseAll ? (inBelt ? B.name : 'Cinturón negro') : 'Cinturón blanco';
    $id('mdLevel').textContent = `${belt} · ${ppm ? `escribís como ${tnApp.tierName(ppm)} (${ppm} ppm)` : 'todavía sin medir tu velocidad'}`;
    // The block in progress: the group of lessons of the course, or the belt after it
    const block = inBelt ? { name: B.name, ...tnApp.beltState(nl.belt) } : (() => { const ls = LESSONS.filter(l => l.g === nl.g); return { name: GROUPS[nl.g].name, done: ls.filter(passed).length, total: ls.length }; })();
    const left = block.total - block.done;
    $id('mdGoal').textContent = allDone ? (ppm && next ? `Llegar a ${next.min} ppm` : 'Superar tu mejor marca') : !ppm ? 'Medir tu velocidad (1 min)' : `Terminar «${block.name}»: ${left === 1 ? 'te falta 1 lección' : `te faltan ${left} lecciones`}`;
    $id('mdBlock').textContent = allDone ? 'Curso y cinturones completos' : `Bloque actual · ${block.name}`;
    $id('mdNextTitle').textContent = allDone ? 'Repasá o medí tu velocidad' : `Lección ${nl.n}: ${nl.name}`;
    $id('mdBar').style.width = Math.round(block.done / block.total * 100) + '%';
    $id('mdCount').textContent = `${block.done} de ${block.total} del bloque` + (inBelt || baseAll ? '' : ` · ${baseDone} de ${LESSONS.length} del curso`);
    renderMarks();
    renderBattles();
  }
  const bars = (vals, lower) => {
    if (vals.length < 2) return '';
    const v = vals.slice(-10), hi = Math.max(...v), lo = Math.min(...v);
    return `<span class="nv-spark" aria-hidden="true">${v.map(x => `<i style="height:${hi === lo ? 60 : Math.round(20 + 80 * (lower ? hi - x : x - lo) / (hi - lo))}%"></i>`).join('')}</span>`;
  };
  const evolution = (vals, unit, lower) => vals.length < 2 ? (vals.length ? 'Una sola vez: jugá de nuevo para ver tu evolución.' : '')
    : `${vals.length} intentos · el primero: ${vals[0]} ${unit}` + ((lower ? vals.at(-1) < vals[0] : vals.at(-1) > vals[0]) ? ` · el último: ${vals.at(-1)} ${unit}` : '');
  function renderMarks() {
    const ppm = tnApp.bestPpm(), iq = tnApp.bestIq(), best = Desafios.bests(), hist = Desafios.history();
    const speeds = tnApp.speedTests().map(t => t.ppm), iqs = tnApp.iqRuns().map(r => r.iq).filter(Boolean);
    const card = (key, title, value, unit, vals, lower, dare) => `<article class="nv-rec" data-mark="${key}"><div class="nv-rec-top"><b>${title}</b>${bars(vals, lower)}</div>
      <div class="nv-rec-val">${value != null ? `${value}<small> ${unit}</small>` : '<span>Sin marca todavía</span>'}</div><p>${value != null ? evolution(vals, unit, lower) : ''}</p>
      <div class="actions"><button class="btn${value != null ? '' : ' primary'}" data-beat="${key}">${value != null ? 'Superarme' : 'Jugar'}</button>${dare && value != null ? `<button class="btn primary" data-dare="${key}">⚔️ Desafiar a un amigo</button>` : ''}</div><div class="nv-rec-box"></div></article>`;
    const games = ['chimpance', 'numeros', 'visual', 'reflejos', ...(best.celu != null ? ['celu'] : [])];
    $id('mdMarks').innerHTML = card('speed', 'Velocidad en la compu', ppm, 'ppm', speeds, false, false) + card('iq', 'IQ ninja', iq, '', iqs, false, false)
      + games.map(id => { const g = Desafios.GAMES[id]; return card(id, g.name, best[id], g.unit, hist[id] || [], g.lower, true); }).join('');
    $id('mdMarks').querySelectorAll('[data-beat]').forEach(b => b.onclick = () => {
      const k = b.dataset.beat; capture('dojo_beat', { mark: k });
      if (k === 'speed') tnApp.start('test'); else if (k === 'iq') tnApp.startQuiz('ninja'); else openGame(k, { from: 'dojo' });
    });
    $id('mdMarks').querySelectorAll('[data-dare]').forEach(b => b.onclick = () => {
      const k = b.dataset.dare; capture('dojo_dare', { game: k });
      Desafios.dare(k, Desafios.bests()[k], b.closest('.nv-rec').querySelector('.nv-rec-box'));
    });
  }
  // Batallas: "Tu turno" (you got a link and haven't played), "Esperando rival" (you sent one nobody played yet:
  // no win is made up for an invitation that was ignored) and "Finalizadas", with the revenge.
  let battlesAt = 0, battlesRun = 0;
  async function renderBattles(force) {
    if (!$id('mdBattles') || (!force && Date.now() - battlesAt < 15000)) return;
    battlesAt = Date.now(); const run = ++battlesRun;
    const { mine, remote } = await Desafios.battles();
    if (run !== battlesRun) return;
    const byId = new Map(remote.map(b => [b.id, b])), turn = [], waiting = [], done = [];
    const items = [...mine.map(l => ({ l, r: byId.get(l.id) })), ...remote.filter(r => r.role && !mine.some(l => l.id === r.id)).map(r => ({ l: null, r }))];
    for (const { l, r } of items) {
      const role = l?.role || r.role, game = l?.game || r.game, g = Desafios.GAMES[game];
      if (!g) continue;
      if (role === 'sent') {
        const resp = r?.responses || [], last = resp.at(-1), score = r?.score ?? l.score;
        if (!last) { waiting.push({ game, html: `Tu marca: <b>${score} ${g.unit}</b> · nadie la jugó todavía` }); continue; }
        const mineRes = last.result === 'won' ? 'lost' : last.result === 'lost' ? 'won' : 'tie';
        done.push({ game, res: mineRes, html: `<b>${esc(last.name)}</b> ${last.score} vs <b>vos</b> ${score} ${g.unit}${resp.length > 1 ? ` · y ${resp.length - 1} más` : ''}`, rival: { from: last.name, score: last.score } });
      } else {
        const my = l?.myScore ?? r?.myScore, from = l?.from || r.from, target = l?.target ?? r.score, id = l?.id || r.id;
        if (my == null) { turn.push({ game, html: `<b>${esc(from)}</b> te desafía: ${target} ${g.unit}`, battle: { id, from, score: target } }); continue; }
        const res = my === target ? 'tie' : (g.lower ? my < target : my > target) ? 'won' : 'lost';
        done.push({ game, res, html: `<b>${esc(from)}</b> ${target} vs <b>vos</b> ${my} ${g.unit}`, rival: { id, from, score: target } });
      }
    }
    const RES = { won: '🏆 Ganaste', lost: 'Perdiste', tie: '🤝 Empate' };
    const row = (it, i, kind) => `<li class="nv-battle ${it.res || ''}"><div><span class="nv-battle-game">${Desafios.GAMES[it.game].name}${it.res ? ` · <b>${RES[it.res]}</b>` : ''}</span><span>${it.html}</span></div>${kind === 'turn' ? `<button class="btn primary" data-play="${i}">Jugar</button>` : kind === 'done' ? `<button class="btn" data-revenge="${i}">Revancha</button>` : ''}</li>`;
    const list = (title, arr, kind) => arr.length ? `<section class="nv-blist"><h3>${title} <span>${arr.length}</span></h3><ul>${arr.map((it, i) => row(it, i, kind)).join('')}</ul></section>` : '';
    $id('mdBattles').innerHTML = turn.length + waiting.length + done.length
      ? list('Tu turno', turn, 'turn') + list('Esperando rival', waiting, 'wait') + list('Finalizadas', done, 'done')
      : `<div class="nv-card nv-bempty"><span aria-hidden="true">⚔️</span><p>Tu primera batalla empieza con una marca. Jugá un desafío corto y compartilo con alguien que creas que puede superarte.</p><button class="btn primary" id="mdFirstBattle">Jugar y desafiar</button></div>`;
    $id('mdNewBattle').parentElement.hidden = !(turn.length + waiting.length + done.length);
    $id('mdTurnCount').hidden = !turn.length; $id('mdTurnCount').textContent = turn.length;
    if ($id('mdFirstBattle')) $id('mdFirstBattle').onclick = newBattle;
    $id('mdBattles').querySelectorAll('[data-play]').forEach(b => b.onclick = () => { const it = turn[b.dataset.play]; capture('battle_play_turn', { game: it.game }); openGame(it.game, { battle: it.battle }); });
    $id('mdBattles').querySelectorAll('[data-revenge]').forEach(b => b.onclick = () => {
      const it = done[b.dataset.revenge]; capture('battle_revenge', { game: it.game });
      openGame(it.game, { battle: { id: it.rival.id || null, from: it.rival.from, score: it.rival.score } });
    });
  }
  function newBattle() { capture('battle_new', { from: 'dojo' }); goTo('desafios'); }

  // On the phone, the groups of a path are compact: the one in progress open, the others one line each.
  function fold() {
    for (const path of [$id('path'), $id('cogPath')]) {
      if (!path) continue;
      path.querySelectorAll(':scope > .group:not(.final):not(.belts-teaser)').forEach(g => {
        if (g.dataset.fold) return;
        const n = g.querySelectorAll('.cards > .lc').length;
        if (!n) return;
        g.dataset.fold = '1';
        const open = !!g.querySelector('.lc.next');
        g.classList.toggle('nv-folded', !open);
        const b = document.createElement('button'); b.type = 'button'; b.className = 'nv-fold-btn';
        const label = () => { b.textContent = g.classList.contains('nv-folded') ? `Ver las ${n} ${path.id === 'path' ? 'lecciones' : 'sesiones'} ▾` : 'Ocultar ▴'; };
        b.onclick = () => { g.classList.toggle('nv-folded'); label(); };
        label(); g.querySelector('.group-head > div')?.append(b);
      });
    }
  }

  // The bridge from the phone: learning with ten fingers needs a physical keyboard, so the phone offers a
  // typing challenge of its own (its own history, not the course's), saving the course for the computer, and
  // Ninja mental, which works fine on a phone. "Tengo teclado físico" turns it off.
  const courseLink = () => `${location.origin}${location.pathname}?desde=celu#teclado`;
  const SAVE_TEXT = 'Mi curso de Templo Ninja para aprender a escribir sin mirar el teclado (para seguir en la compu):';
  function renderBridge() {
    const on = touchOnly();
    $id('nvBridge').hidden = !on;
    $id('nvHeroSpeed').innerHTML = on ? '⚡ Desafío de celular <small>30 s</small>' : '⌨ Medir mi velocidad <small>1 min</small>';
    $id('nvHeroSave').hidden = !on;
    if (on && !renderBridge.seen) { renderBridge.seen = true; capture('mobile_bridge_shown'); }
  }
  async function saveCourse(how) {
    const url = courseLink(), text = `${SAVE_TEXT} ${url}`;
    capture('mobile_bridge_action', { action: how });
    if (how === 'share') { try { await navigator.share({ title: 'Templo Ninja · curso de teclado', text: SAVE_TEXT, url }); return; } catch { return; } }
    if (how === 'copy') { try { await navigator.clipboard.writeText(url); $id('nvSaveMsg').textContent = '✓ Link copiado. Pegalo donde lo vayas a abrir en la compu.'; } catch { $id('nvSaveMsg').textContent = url; } return; }
    if (how === 'whatsapp') return void window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    if (how === 'mail') return void (location.href = `mailto:?subject=${encodeURIComponent('Templo Ninja: mi curso para la compu')}&body=${encodeURIComponent(text)}`);
  }
  function openSave() {
    $id('nvSavePanel').hidden = false; $id('nvShare').hidden = !navigator.share;
    $id('nvSaveAccount').hidden = !$id('acctBtn').classList.contains('out'); // signed in, the progress already travels with the account
    capture('mobile_bridge_action', { action: 'open_save' });
    goTo('teclado', { sub: 'entrenar' });
  }

  // app.js tells where it goes; coming back from a lesson or a session, the page returns to that section.
  let returnTo = null;
  window.tnLayout = {
    start: l => { returnTo = { sec: 'teclado', sub: l === 'test' ? 'medir' : 'entrenar' }; },
    quiz: sess => { returnTo = { sec: 'mente', sub: sess === 'ninja' ? 'desafio' : 'entrenar' }; },
    cog: () => { if (window.tnApp) goTo('mente', { sub: 'entrenar' }); else returnTo = { sec: 'mente', sub: 'entrenar' }; },
    home: () => {
      renderNext();
      if (returnTo && window.tnApp) { const r = returnTo; returnTo = null; requestAnimationFrame(() => goTo(r.sec, { sub: r.sub, smooth: false })); }
    },
  };

  addEventListener('DOMContentLoaded', () => {
    returnTo = null; // whatever app.js did while starting up, the address decides below
    window.tn?.people?.({ site_version: 'nueva' }); // every event of this page says which version it came from
    document.querySelectorAll('[data-go]').forEach(a => a.addEventListener('click', e => {
      e.preventDefault(); if (tnApp.mode() !== 'home' || !$id('game').hidden) { Desafios.close(); tnApp.goHome(); }
      goTo(a.dataset.go); capture('nav_section', { section: a.dataset.go });
    }));
    document.querySelectorAll('[role="tab"][data-sub]').forEach(b => b.onclick = () => { const sec = b.closest('[data-view-of]').dataset.viewOf; setSub(sec, b.dataset.sub); capture('nav_tab', { tab: sec, sub: b.dataset.sub }); });
    document.querySelectorAll('[data-sub-go]').forEach(b => b.onclick = () => setSub(b.closest('[data-view-of]').dataset.viewOf, b.dataset.subGo));
    $id('testBtn').onclick = () => goTo('teclado', { sub: 'medir' });
    $id('scNinja').onclick = () => goTo('mente', { sub: 'entrenar' });
    $id('nvHeroSpeed').onclick = () => { if (touchOnly()) { capture('quick_start', { kind: 'celu' }); openGame('celu'); } else { capture('quick_start', { kind: 'speed' }); tnApp.start('test'); } };
    $id('nvHeroIq').onclick = $id('nvGameIq').onclick = () => { capture('quick_start', { kind: 'iq' }); tnApp.startQuiz('ninja'); };
    $id('nvGameSim').onclick = () => { capture('quick_start', { kind: 'sim' }); tnApp.startQuiz('sim'); };
    $id('tkContinue').onclick = $id('mdContinue').onclick = () => tnApp.start(tnApp.nextLesson());
    $id('mdNewBattle').onclick = newBattle;

    // The bridge from the phone
    $id('nvCelu').onclick = () => { capture('mobile_bridge_action', { action: 'celu' }); openGame('celu'); };
    $id('nvSave').onclick = $id('nvHeroSave').onclick = openSave;
    $id('nvShare').onclick = () => saveCourse('share');
    $id('nvCopy').onclick = () => saveCourse('copy');
    $id('nvWa').onclick = () => saveCourse('whatsapp');
    $id('nvMail').onclick = () => saveCourse('mail');
    $id('nvSaveAccount').onclick = () => { capture('mobile_bridge_action', { action: 'account' }); $id('acctBtn').click(); document.querySelector('#authMode [data-v="register"]')?.click(); };
    $id('nvHasKb').onclick = () => { store('tn-has-keyboard', '1'); capture('mobile_bridge_action', { action: 'has_keyboard' }); renderBridge(); renderTiles(); };
    Desafios.setCta('celu', '💻 Guardarme el curso para la compu', () => { Desafios.close(); openSave(); });
    // Arriving on the computer from the link saved on the phone
    const q = new URLSearchParams(location.search);
    if (q.get('desde') === 'celu') {
      q.delete('desde'); history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : '') + location.hash);
      if (!touchOnly()) { capture('continued_from_phone'); window.tn?.people?.({ came_from_phone: true }); $id('nvWelcome').hidden = false; }
    }

    // Arriving from a battle link: the invitation (who challenges, in what, the score to beat), no account needed
    const battleId = q.get('batalla');
    if (battleId) {
      q.delete('batalla'); history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : '') + location.hash);
      capture('battle_link_opened');
      const gone = text => { $id('mdMsg').textContent = text; $id('mdMsg').hidden = false; goTo('dojo', { sub: 'batallas', smooth: false }); };
      Desafios.loadBattle(battleId).then(b => {
        if (!b) return gone('Esa batalla ya no existe (duran 60 días). Jugá un desafío y mandá la tuya.');
        if (b.role === 'sent' || Desafios.known().some(r => r.id === b.id && r.role === 'sent')) return gone('Esa batalla la creaste vos: cuando tu amigo la juegue, la ves acá.');
        openGame(b.game, { battle: b });
      }).catch(() => gone('No pudimos abrir la batalla. Revisá tu conexión y probá de nuevo.'));
    }

    // Optional dark mode, remembered in this browser (a script in the head applies it before the first paint).
    const themeBtn = $id('nvTheme');
    const paintTheme = () => { const dark = document.documentElement.dataset.theme === 'dark'; themeBtn.setAttribute('aria-label', dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'); themeBtn.title = dark ? 'Modo claro' : 'Modo oscuro'; themeBtn.setAttribute('aria-pressed', String(dark)); };
    themeBtn.onclick = () => {
      const dark = document.documentElement.dataset.theme !== 'dark';
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
      store('tn-theme', dark ? 'dark' : 'light');
      paintTheme(); capture('theme_changed', { theme: dark ? 'dark' : 'light' });
      if (tnApp.mode() === 'home' && tnApp.chartShown()) tnApp.drawChart();
    };
    paintTheme();

    // The section on screen lights up in the header and the tab bar
    const seen = new IntersectionObserver(entries => {
      if (tnApp.mode() !== 'home' || performance.now() < holdMark) return;
      const vis = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (vis) markCurrent(vis.target.dataset.viewOf);
    }, { rootMargin: '-35% 0px -60% 0px' });
    SECTIONS.forEach(s => anchor(s) && seen.observe(anchor(s)));
    // The paths are drawn again when something changes (a track, an account): keep them compact
    for (const p of [$id('path'), $id('cogPath')]) new MutationObserver(fold).observe(p, { childList: true });

    $id('gameBack').onclick = () => Desafios.close();
    renderTiles(); renderNext(); renderBridge();
    const linkedGame = gameOf(location.hash);
    if (tnApp.mode() === 'home' && !battleId) { if (linkedGame) openGame(linkedGame); else if (location.hash) goTo(secOf(location.hash), { smooth: false }); else markCurrent('inicio'); }
    addEventListener('hashchange', () => { if (tnApp.mode() !== 'home' || !$id('game').hidden) return; if (gameOf(location.hash)) openGame(gameOf(location.hash)); else goTo(secOf(location.hash)); });
  });
})();
