// /nueva: the new layout of the home page (a candidate for an A/B test against index.html). Same engine (app.js);
// this only adds the sections as tabs (Inicio · Teclado · Mente · Ranking), the sub-tabs of each dojo, the
// "Seguí acá" card of the keyboard dojo and the optional dark mode. Loaded before app.js, so that app.js finds
// window.tnLayout and tells it where it goes; the buttons are wired once the page (and window.tnApp) is ready.
(() => {
  const $id = id => document.getElementById(id);
  const TABS = ['inicio', 'teclado', 'mente', 'ranking'];
  const HASH = { inicio: '', teclado: '#teclado', mente: '#ninja', ranking: '#ranking' };
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
    $id('nvHeroSpeed').onclick = $id('nvGameSpeed').onclick = () => { capture('quick_start', { kind: 'speed' }); tnApp.start('test'); };
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

    renderNext();
    if (tnApp.mode() === 'home') setTab(tabOf(location.hash), { scroll: false });
    addEventListener('hashchange', () => { if (tnApp.mode() === 'home') setTab(tabOf(location.hash)); });
  });
})();
