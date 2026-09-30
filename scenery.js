(() => {
  const scenes = { beach: 'Un respiro junto al mar', mountains: 'Un momento entre montañas', forest: 'La calma de estar en el bosque' };
  const buttons = document.querySelectorAll('.scene-picker button');
  function selectScene(scene) {
    if (!Object.hasOwn(scenes, scene)) return;
    document.documentElement.dataset.scene = scene;
    document.getElementById('sceneCaption').textContent = scenes[scene];
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.scene === scene)));
  }
  try { selectScene(localStorage.getItem('teclado-ciego-scene')); } catch { /* Storage may be unavailable in private browsing. */ }
  buttons.forEach(button => button.addEventListener('click', () => {
    selectScene(button.dataset.scene);
    try { localStorage.setItem('teclado-ciego-scene', button.dataset.scene); } catch { /* The current selection still works. */ }
  }));
})();
