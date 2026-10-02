(() => {
  const scenes = { beach: 'Un respiro junto al mar', mountains: 'Un momento entre montañas', forest: 'La calma de estar en el bosque' };
  const order = Object.keys(scenes);
  const buttons = document.querySelectorAll('.scene-picker button');
  const slides = document.querySelectorAll('.hero-slides .slide');
  const dots = document.querySelectorAll('.hero-dots i');
  const still = matchMedia('(prefers-reduced-motion: reduce)');
  const ROTATE_MS = 7000;
  let heroScene = 'beach', timer = 0, paused = false;
  try { paused = localStorage.getItem('templo-pause-scene') === 'true'; } catch {}
  const pause = document.createElement('button');
  pause.type = 'button'; pause.className = 'scene-pause';
  document.querySelector('.landscape-note').append(pause);
  const labelPause = () => { pause.textContent = paused ? '▶ Paisaje' : 'Ⅱ Pausar'; pause.setAttribute('aria-label', paused ? 'Reanudar paisajes' : 'Pausar paisajes'); pause.setAttribute('aria-pressed', String(paused)); };
  labelPause();
  pause.onclick = () => { paused = !paused; try { localStorage.setItem('templo-pause-scene', String(paused)); } catch {} labelPause(); rotate(); };

  // The photo of a slide is requested the first time it is shown, or right before, as the next one.
  const load = slide => { const f = slide?.querySelector('.frame'); if (f && !f.style.backgroundImage) f.style.backgroundImage = `url('assets/${slide.dataset.scene}.jpg')`; };
  const after = scene => order[(order.indexOf(scene) + 1) % order.length];
  function showHero(scene) {
    heroScene = scene;
    slides.forEach(s => { if (s.dataset.scene === scene) load(s); s.classList.toggle('on', s.dataset.scene === scene); });
    dots.forEach((d, i) => d.classList.toggle('on', order[i] === scene));
    document.documentElement.dataset.heroScene = scene;
    document.getElementById('sceneCaption').textContent = scenes[scene];
    load([...slides].find(s => s.dataset.scene === after(scene)));
  }
  // The hero goes through beach, mountains and forest by itself (not with reduced motion).
  function rotate() {
    clearInterval(timer);
    if (still.matches || paused) return;
    timer = setInterval(() => { if (!document.hidden) showHero(after(heroScene)); }, ROTATE_MS);
  }

  function selectScene(scene) {
    if (!Object.hasOwn(scenes, scene)) return;
    document.documentElement.dataset.scene = scene;
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.scene === scene)));
    showHero(scene); rotate();
  }
  let saved = null;
  try { saved = localStorage.getItem('teclado-ciego-scene'); } catch { /* Storage may be unavailable in private browsing. */ }
  if (Object.hasOwn(scenes, saved)) selectScene(saved); else { showHero('beach'); rotate(); }
  still.addEventListener?.('change', rotate);
  buttons.forEach(button => button.addEventListener('click', () => {
    selectScene(button.dataset.scene);
    try { localStorage.setItem('teclado-ciego-scene', button.dataset.scene); } catch { /* The current selection still works. */ }
  }));
})();
