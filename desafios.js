// Desafíos rápidos (/nueva): four short brain games, free and without an account. Each one runs in #game and
// ends with a score, a reference to compare with and the best score of this browser.
//   reflejos  · reaction time, 5 tries (average in ms, lower is better)
//   numeros   · number memory: a number shows for a moment and you type it back; one digit more each time
//   chimpance · chimp test: numbers on a grid; after the first click they hide, click them in order
//   visual    · visual memory: some squares light up; click the same ones, the grid grows
window.Desafios = (() => {
  const $id = id => document.getElementById(id);
  const capture = (e, p) => window.tn?.capture?.(e, p);
  const rnd = n => Math.floor(Math.random() * n);
  const KEY = 'tn-desafios';
  const bests = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
  const saveBest = (id, score, lowerIsBetter) => {
    const b = bests(), old = b[id];
    const better = old == null || (lowerIsBetter ? score < old : score > old);
    if (better) { b[id] = score; try { localStorage.setItem(KEY, JSON.stringify(b)); } catch {} }
    return { best: better ? score : old, record: better && old != null };
  };

  const GAMES = {
    reflejos: { name: 'Reflejos', unit: 'ms', lower: true, lead: 'Cuando el recuadro se ponga verde, tocá lo más rápido que puedas. Son 5 intentos.',
      compare: s => `${s < 220 ? 'Reflejos de ninja ⚡' : s < 280 ? '¡Muy rápido!' : s < 350 ? 'Bien, en el rango normal.' : 'Seguí practicando: con el celu y los dedos fríos todo es más lento.'} Un tiempo de reacción típico está entre 200 y 300 ms.` },
    numeros: { name: 'Memoria de números', unit: 'dígitos', lead: 'Vas a ver un número por unos segundos. Cuando desaparezca, escribilo. Cada vez es un dígito más largo.',
      compare: s => `${s >= 10 ? 'Memoria de ninja 🧠' : s >= 8 ? '¡Muy por encima de lo habitual!' : s >= 6 ? 'Bien: en el rango de la mayoría.' : 'Arrancaste. Se entrena agrupando los dígitos de a dos o tres.'} La mayoría de los adultos recuerda entre 5 y 9 dígitos (el famoso "7 ± 2").` },
    chimpance: { name: 'Test del chimpancé', unit: 'números', lead: 'Memorizá dónde está cada número. Tocá el 1: los demás se esconden y tenés que seguir en orden. Tenés 3 vidas.',
      compare: s => `${s >= 9 ? '¡Le ganaste al chimpancé! 🐒' : 'El chimpancé todavía te gana. 🐒'} Ayumu, un chimpancé de la Universidad de Kioto, recordaba 9 números de un vistazo (Inoue y Matsuzawa, 2007).` },
    visual: { name: 'Memoria visual', unit: 'nivel', lead: 'Se iluminan algunos cuadros: memorizalos y tocá los mismos. Cada nivel suma uno y la grilla crece. Tenés 3 vidas.',
      compare: s => `${s >= 12 ? 'Memoria fotográfica 📸' : s >= 8 ? '¡Muy buena memoria visual!' : 'Buen comienzo.'} Ayuda mirar el dibujo que forman los cuadros, no cada cuadro suelto.` },
  };

  let cur = null, timers = [], keyHandler = null, onExit = () => {};
  const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };
  const clear = () => { timers.forEach(clearTimeout); timers = []; if (keyHandler) removeEventListener('keydown', keyHandler); keyHandler = null; };
  const stage = () => $id('gameStage');
  const live = txt => { $id('gameLive').textContent = txt; };
  const onKey = fn => { if (keyHandler) removeEventListener('keydown', keyHandler); keyHandler = fn; addEventListener('keydown', fn); };

  function open(id, exit) {
    if (!GAMES[id]) return;
    clear(); cur = id; onExit = exit || onExit;
    $id('gameTitle').textContent = GAMES[id].name;
    live('');
    intro();
    capture('game_opened', { game: id });
  }
  function close() { clear(); cur = null; onExit(); }

  function intro() {
    const g = GAMES[cur], best = bests()[cur];
    stage().className = 'gm-stage';
    stage().innerHTML = `<div class="gm-intro"><p>${g.lead}</p>${best != null ? `<p class="gm-best">Tu mejor marca: <b>${best} ${g.unit}</b></p>` : ''}<button class="btn primary" id="gameGo">Empezar</button></div>`;
    $id('gameGo').onclick = () => { capture('game_started', { game: cur }); RUN[cur](); };
    $id('gameGo').focus();
  }
  function finish(score) {
    clear();
    const g = GAMES[cur], { best, record } = saveBest(cur, score, g.lower);
    capture('game_completed', { game: cur, score, record });
    const shareText = `Hice "${g.name}" en Templo Ninja: ${score} ${g.unit}. ¿Me ganás? 🥷`;
    stage().className = 'gm-stage';
    stage().innerHTML = `<div class="gm-result"><span class="eyebrow">Tu resultado</span><div class="gm-score">${score}<small> ${g.unit}</small></div>
      ${record ? '<p class="gm-record">🏅 ¡Nueva mejor marca!</p>' : `<p class="gm-best">Tu mejor marca: <b>${best} ${g.unit}</b></p>`}
      <p class="gm-compare">${g.compare(score)}</p>
      <div class="actions"><button class="btn primary" id="gameAgain">Otra vez</button><button class="btn" id="gameShare">Desafiar a un amigo</button><button class="btn" id="gameOut">Más desafíos</button></div></div>`;
    $id('gameAgain').onclick = () => { capture('game_started', { game: cur, again: true }); RUN[cur](); };
    $id('gameOut').onclick = close;
    $id('gameShare').onclick = async () => {
      const url = location.origin + location.pathname + '#juego-' + cur;
      capture('game_shared', { game: cur, score });
      if (navigator.share) { try { await navigator.share({ text: shareText, url }); return; } catch {} }
      open_(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + url)}`);
    };
    $id('gameAgain').focus();
  }
  const open_ = url => window.open(url, '_blank', 'noopener');

  const RUN = {
    // ---------- Reaction time ----------
    reflejos() {
      clear();
      const times = [], TRIES = 5;
      let state = 'wait', t0 = 0;
      const box = document.createElement('button'); box.className = 'gm-react'; box.type = 'button';
      stage().className = 'gm-stage'; stage().replaceChildren(box);
      const paint = (cls, html) => { box.className = 'gm-react ' + cls; box.innerHTML = html; };
      const arm = () => {
        state = 'wait'; paint('wait', '<b>Esperá el verde…</b>');
        live(`Intento ${times.length + 1} de ${TRIES}`);
        later(() => { state = 'go'; t0 = performance.now(); paint('go', '<b>¡Ya!</b>'); }, 1500 + rnd(2500));
      };
      const hit = () => {
        if (state === 'wait') { clear(); state = 'early'; paint('early', '<b>¡Muy pronto!</b><span>Tocá para reintentar</span>'); bindKeys(); return; }
        if (state === 'early') { arm(); return; }
        if (state === 'go') {
          const ms = Math.round(performance.now() - t0); times.push(ms); state = 'shown';
          if (times.length === TRIES) { finish(Math.round(times.reduce((a, b) => a + b, 0) / TRIES)); return; }
          paint('shown', `<b>${ms} ms</b><span>Tocá para el siguiente</span>`); return;
        }
        if (state === 'shown') arm();
      };
      const bindKeys = () => onKey(e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); hit(); } else if (e.key === 'Escape') close(); });
      box.addEventListener('pointerdown', e => { e.preventDefault(); hit(); });
      bindKeys(); arm();
    },

    // ---------- Number memory ----------
    numeros() {
      clear();
      let n = 3;
      const round = () => {
        const num = String(1 + rnd(9)) + Array.from({ length: n - 1 }, () => rnd(10)).join('');
        const ms = 1000 + n * 600;
        live(`${n} dígitos`);
        stage().className = 'gm-stage';
        stage().innerHTML = `<div class="gm-num"><div class="gm-digits">${num}</div><div class="gm-timer"><i style="animation-duration:${ms}ms"></i></div></div>`;
        onKey(e => { if (e.key === 'Escape') close(); });
        later(() => {
          stage().innerHTML = `<form class="gm-num" id="gmNumForm"><p>¿Cuál era el número?</p><input id="gmNumIn" class="gm-input" inputmode="numeric" autocomplete="off" maxlength="${n}" aria-label="El número"><button class="btn primary">Listo</button></form>`;
          const inp = $id('gmNumIn'); inp.focus();
          $id('gmNumForm').onsubmit = e => {
            e.preventDefault();
            const ok = inp.value.replace(/\D/g, '') === num;
            stage().innerHTML = `<div class="gm-num"><p class="gm-check ${ok ? 'ok' : 'bad'}">${ok ? '✓ ¡Bien!' : '✗ No era'}</p><div class="gm-compare-num"><span>Número</span><b>${num}</b><span>Vos</span><b>${(inp.value || '—').replace(/[<>&]/g, '')}</b></div><button class="btn primary" id="gmNumNext">${ok ? 'Siguiente' : 'Ver resultado'}</button></div>`;
            const next = () => ok ? (n++, round()) : finish(n - 1);
            $id('gmNumNext').onclick = next; $id('gmNumNext').focus();
          };
        }, ms);
      };
      round();
    },

    // ---------- Chimp test ----------
    chimpance() {
      clear();
      let n = 4, lives = 3;
      const COLS = 8, ROWS = 5;
      const round = () => {
        live(`${n} números · ${'♥'.repeat(lives)}`);
        const cells = []; while (cells.length < n) { const c = rnd(COLS * ROWS); if (!cells.includes(c)) cells.push(c); }
        const grid = document.createElement('div'); grid.className = 'gm-chimp'; grid.style.setProperty('--cols', COLS); grid.style.setProperty('--rows', ROWS);
        let next = 1, hidden = false;
        cells.forEach((c, i) => {
          const b = document.createElement('button'); b.type = 'button'; b.className = 'gm-cell'; b.textContent = i + 1; b.dataset.n = i + 1;
          b.style.setProperty('--c', (c % COLS) + 1); b.style.setProperty('--r', Math.floor(c / COLS) + 1); // on a phone the grid turns (CSS)
          b.onclick = () => {
            if (+b.dataset.n !== next) { lives--; grid.classList.add('miss'); b.classList.add('wrong'); return later(() => lives ? round() : finish(n - 1), 700); }
            b.classList.add('done'); b.disabled = true; next++;
            if (!hidden) { hidden = true; grid.classList.add('hide'); }
            if (next > n) { n = Math.min(n + 1, COLS * ROWS); later(round, 450); }
          };
          grid.append(b);
        });
        stage().className = 'gm-stage wide'; stage().replaceChildren(grid);
        onKey(e => { if (e.key === 'Escape') close(); });
      };
      round();
    },

    // ---------- Visual memory ----------
    visual() {
      clear();
      let level = 1, lives = 3;
      const sizeOf = l => l <= 2 ? 3 : l <= 5 ? 4 : l <= 9 ? 5 : l <= 14 ? 6 : 7;
      const round = () => {
        const size = sizeOf(level), count = level + 2;
        live(`Nivel ${level} · ${'♥'.repeat(lives)}`);
        const lit = new Set(); while (lit.size < count) lit.add(rnd(size * size));
        const grid = document.createElement('div'); grid.className = 'gm-vis show'; grid.style.setProperty('--size', size);
        let found = 0, misses = 0, ready = false;
        for (let i = 0; i < size * size; i++) {
          const b = document.createElement('button'); b.type = 'button'; b.className = 'gm-sq' + (lit.has(i) ? ' lit' : ''); b.setAttribute('aria-label', 'Cuadro ' + (i + 1));
          b.onclick = () => {
            if (!ready || b.classList.contains('ok') || b.classList.contains('no')) return;
            if (lit.has(i)) { b.classList.add('ok'); if (++found === count) { ready = false; level++; later(round, 600); } }
            else { b.classList.add('no'); if (++misses === 3) { ready = false; lives--; grid.classList.add('miss'); later(() => lives ? round() : finish(level - 1), 800); } }
          };
          grid.append(b);
        }
        stage().className = 'gm-stage'; stage().replaceChildren(grid);
        onKey(e => { if (e.key === 'Escape') close(); });
        later(() => { grid.classList.remove('show'); ready = true; }, 900 + count * 120);
      };
      round();
    },
  };

  return { open, close, GAMES, bests };
})();
