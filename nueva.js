// /nueva: the new layout of the home page (a candidate for an A/B test against index.html). Same engine (app.js).
// One page that scrolls: Inicio → Teclado (with its lessons) → Mente (with its paths) → Desafíos → Ranking; the
// header and the phone's tab bar take you to each section. It also adds the "Seguí acá" card, compact groups on
// the phone, the bridge from the phone to the computer and the optional dark mode. Loaded before app.js, so that
// app.js finds window.tnLayout and tells it where it goes; the buttons are wired once the page is ready.
(() => {
  const $id = id => document.getElementById(id);
  const SECTIONS = ['inicio', 'teclado', 'mente', 'desafios', 'ranking'];
  const HASH = { inicio: '', teclado: '#teclado', mente: '#ninja', desafios: '#desafios', ranking: '#ranking' };
  const gameOf = hash => (/^#juego-(\w+)$/.exec(hash) || [])[1];
  const secOf = hash => hash === '#teclado' ? 'teclado' : /^#(ninja|entrevistas)$/.test(hash) ? 'mente' : hash === '#desafios' ? 'desafios' : hash === '#ranking' ? 'ranking' : 'inicio';
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
  let gameFrom = 'desafios';
  function openGame(id) {
    if (!Desafios.GAMES[id]) return;
    if (tnApp.mode() !== 'home') tnApp.goHome();
    gameFrom = id === 'celu' ? 'teclado' : 'desafios';
    $id('home').hidden = true; $id('game').hidden = false; document.body.dataset.view = 'game';
    history.replaceState(null, '', location.pathname + location.search + '#juego-' + id);
    scrollTo({ top: 0 });
    Desafios.open(id, closeGame);
  }
  function closeGame() {
    $id('game').hidden = true;
    tnApp.goHome(); renderTiles();
    goTo(gameFrom, { smooth: false });
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
    fold();
  }

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
    $id('tkContinue').onclick = () => tnApp.start(tnApp.nextLesson());

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
    if (tnApp.mode() === 'home') { if (linkedGame) openGame(linkedGame); else if (location.hash) goTo(secOf(location.hash), { smooth: false }); else markCurrent('inicio'); }
    addEventListener('hashchange', () => { if (tnApp.mode() !== 'home' || !$id('game').hidden) return; if (gameOf(location.hash)) openGame(gameOf(location.hash)); else goTo(secOf(location.hash)); });
  });
})();
