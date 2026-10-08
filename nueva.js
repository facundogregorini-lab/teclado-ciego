// /nueva: the new layout of the home page (a candidate for an A/B test against index.html). Same engine (app.js);
// this only adds the sections as tabs (Inicio · Teclado · Mente · Ranking), the sub-tabs of each dojo, the
// "Seguí acá" card of the keyboard dojo and the optional dark mode. Loaded before app.js, so that app.js finds
// window.tnLayout and tells it where it goes; the buttons are wired once the page (and window.tnApp) is ready.
(() => {
  const $id = id => document.getElementById(id);
  const TABS = ['inicio', 'teclado', 'mente', 'ranking'];
  const HASH = { inicio: '', teclado: '#teclado', mente: '#ninja', ranking: '#ranking' };
  const gameOf = hash => (/^#juego-(\w+)$/.exec(hash) || [])[1];
  const tabOf = hash => hash === '#teclado' ? 'teclado' : /^#(ninja|entrevistas)$/.test(hash) ? 'mente' : hash === '#ranking' ? 'ranking' : 'inicio';
  const capture = (e, p) => window.tn?.capture?.(e, p);

  function setSub(tab, sub) {
    const view = document.querySelector(`[data-view-of="${tab}"]`);
    if (!view || !view.querySelector(`[data-sub-of="${sub}"]`)) return;
    view.querySelectorAll('[data-sub-of]').forEach(s => { s.hidden = s.dataset.subOf !== sub; });
    view.querySelectorAll('[role="tab"][data-sub]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.sub === sub)));
    if (tab === 'teclado' && sub === 'medir' && window.tnApp?.chartShown()) tnApp.drawChart(); // the chart sizes itself to a visible box
  }
  function setTab(tab, { sub, scroll = true } = {}) {
    if (!TABS.includes(tab)) tab = 'inicio';
    const changed = document.body.dataset.tab !== tab;
    document.body.dataset.tab = tab;
    document.querySelectorAll('[data-go]').forEach(a => a.toggleAttribute('aria-current', a.dataset.go === tab));
    if (sub) setSub(tab, sub);
    const want = location.pathname + location.search + HASH[tab];
    if (location.pathname + location.search + location.hash !== want) history.replaceState(null, '', want);
    if (scroll) scrollTo({ top: 0 });
    if (changed) capture('nav_tab', { tab, sub: sub || null });
  }

  // Desafíos rápidos (desafios.js): their tiles, and their own screen next to the lesson and quiz ones.
  const TILE_ART = {
    reflejos: '<span class="nv-react-dot">¡Ya!</span>',
    numeros: '<span class="nv-vis-txt mono">4 8 1 9</span>',
    chimpance: '<svg viewBox="0 0 120 70" width="104" aria-hidden="true"><g font-family="JetBrains Mono" font-weight="700" font-size="14" text-anchor="middle">' + [[18, 18, 1], [62, 14, 2], [98, 30, 3], [34, 52, 4], [80, 54, 5]].map(([x, y, n]) => `<rect x="${x - 11}" y="${y - 11}" width="22" height="22" rx="5" fill="var(--card)" stroke="var(--line)"/><text x="${x}" y="${y + 5}" fill="var(--ink)">${n}</text>`).join('') + '</g></svg>',
    visual: '<svg viewBox="0 0 70 70" width="64" aria-hidden="true">' + Array.from({ length: 16 }, (_, i) => `<rect x="${(i % 4) * 17 + 1}" y="${Math.floor(i / 4) * 17 + 1}" width="15" height="15" rx="3" fill="${[1, 6, 11, 12].includes(i) ? 'var(--accent)' : 'var(--card)'}" stroke="var(--line)"/>`).join('') + '</svg>',
  };
  const TILE_SUB = { reflejos: 'Tiempo de reacción · 30 s', numeros: 'Como en los psicotécnicos · 1 min', chimpance: '¿Le ganás a un chimpancé? · 1 min', visual: 'Recordá el patrón · 1 min' };
  function renderTiles() {
    const best = Desafios.bests();
    document.querySelectorAll('[data-games]').forEach(slot => {
      slot.parentElement.querySelectorAll('.nv-game[data-game]').forEach(t => t.remove());
      slot.before(...['chimpance', 'numeros', 'visual', 'reflejos'].map(id => {
        const g = Desafios.GAMES[id], b = document.createElement('button');
        b.className = 'nv-game'; b.dataset.game = id;
        b.innerHTML = `<span class="nv-vis">${TILE_ART[id]}</span><b>${g.name}</b><span>${best[id] != null ? `Tu mejor: ${best[id]} ${g.unit}` : TILE_SUB[id]}</span>`;
        b.onclick = () => openGame(id);
        return b;
      }));
    });
  }
  let gameFrom = { tab: 'inicio' };
  function openGame(id) {
    if (!Desafios.GAMES[id]) return;
    if (tnApp.mode() !== 'home') tnApp.goHome();
    gameFrom = { tab: document.body.dataset.tab || 'inicio', sub: document.body.dataset.tab === 'mente' ? 'rapidos' : undefined };
    $id('home').hidden = true; $id('game').hidden = false; document.body.dataset.view = 'game';
    history.replaceState(null, '', location.pathname + location.search + '#juego-' + id);
    scrollTo({ top: 0 });
    Desafios.open(id, closeGame);
  }
  function closeGame() {
    $id('game').hidden = true;
    tnApp.goHome(); renderTiles();
    setTab(gameFrom.tab, { sub: gameFrom.sub });
  }

  // "Seguí acá": the next lesson, how far the course goes and its keys.
  function renderNext() {
    if (!window.tnApp) return;
    const { LESSONS, GROUPS, state: S } = tnApp, nl = tnApp.nextLesson();
    const done = LESSONS.filter(l => S.lessons[l.id]?.stars >= 1).length, all = done === LESSONS.length;
    $id('tkNextEyebrow').textContent = all ? 'Curso base completo 🥋' : `Seguí acá · ${GROUPS[nl.g].name}`;
    $id('tkNextTitle').textContent = all ? 'Repasá o medí tu velocidad' : `Lección ${nl.n}: ${nl.name}`;
    $id('tkNextDesc').textContent = all ? `Terminaste las ${LESSONS.length} lecciones. Volvé a cualquiera para sumar estrellas.` : GROUPS[nl.g].desc;
    $id('tkBar').style.width = Math.round(done / LESSONS.length * 100) + '%';
    $id('tkCount').textContent = `${done} de ${LESSONS.length}`;
    $id('tkContinue').textContent = all ? 'Repasar →' : done ? 'Continuar →' : 'Empezar →';
    $id('tkKeys').innerHTML = nl.type === 'keys' ? [...nl.keys].map(k => `<kbd style="--fc:${tnApp.fcol(tnApp.key(k)?.f || 'th')}">${k.toUpperCase()}</kbd>`).join('') : '';
  }

  // app.js tells where it goes: a lesson or a measurement opens the keyboard dojo, a session the mental one.
  window.tnLayout = {
    start: l => setTab('teclado', { sub: l === 'test' ? 'medir' : 'entrenar', scroll: false }),
    quiz: sess => setTab('mente', { sub: sess === 'ninja' ? 'desafio' : 'entrenar', scroll: false }),
    cog: () => setTab('mente'),
    home: renderNext,
  };

  addEventListener('DOMContentLoaded', () => {
    window.tn?.people?.({ site_version: 'nueva' }); // every event of this page says which version it came from
    const goHome = () => tnApp.goHome();
    document.querySelectorAll('[data-go]').forEach(a => a.addEventListener('click', e => {
      e.preventDefault(); goHome();
      setTab(a.dataset.go, { sub: a.dataset.go === 'teclado' || a.dataset.go === 'mente' ? 'entrenar' : undefined });
    }));
    document.querySelectorAll('[role="tab"][data-sub]').forEach(b => b.onclick = () => { const tab = b.closest('[data-view-of]').dataset.viewOf; setSub(tab, b.dataset.sub); capture('nav_tab', { tab, sub: b.dataset.sub }); });
    document.querySelectorAll('[data-sub-go]').forEach(b => b.onclick = () => setSub(b.closest('[data-view-of]').dataset.viewOf, b.dataset.subGo));
    $id('testBtn').onclick = () => { goHome(); setTab('teclado', { sub: 'medir' }); };
    $id('nvHeroSpeed').onclick = () => { capture('quick_start', { kind: 'speed' }); tnApp.start('test'); };
    $id('nvHeroIq').onclick = $id('nvGameIq').onclick = () => { capture('quick_start', { kind: 'iq' }); tnApp.startQuiz('ninja'); };
    $id('nvGameSim').onclick = () => { capture('quick_start', { kind: 'sim' }); tnApp.startQuiz('sim'); };
    $id('tkContinue').onclick = () => tnApp.start(tnApp.nextLesson());

    // Optional dark mode, remembered in this browser (a script in the head applies it before the first paint).
    const themeBtn = $id('nvTheme');
    const paintTheme = () => { const dark = document.documentElement.dataset.theme === 'dark'; themeBtn.setAttribute('aria-label', dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'); themeBtn.title = dark ? 'Modo claro' : 'Modo oscuro'; themeBtn.setAttribute('aria-pressed', String(dark)); };
    themeBtn.onclick = () => {
      const dark = document.documentElement.dataset.theme !== 'dark';
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
      try { localStorage.setItem('tn-theme', dark ? 'dark' : 'light'); } catch {}
      paintTheme(); capture('theme_changed', { theme: dark ? 'dark' : 'light' });
      if (tnApp.mode() === 'home' && tnApp.chartShown()) tnApp.drawChart();
    };
    paintTheme();

    $id('gameBack').onclick = () => Desafios.close();
    renderTiles(); renderNext();
    const linkedGame = gameOf(location.hash);
    if (tnApp.mode() === 'home') { if (linkedGame) { setTab('inicio', { scroll: false }); openGame(linkedGame); } else setTab(tabOf(location.hash), { scroll: false }); }
    addEventListener('hashchange', () => { if (tnApp.mode() !== 'home' || !$id('game').hidden) return; if (gameOf(location.hash)) openGame(gameOf(location.hash)); else setTab(tabOf(location.hash)); });
  });
})();
