/* Small, independently testable learning helpers. No account or analytics required. */
(function (root) {
  const day = (date = new Date()) => new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' }).format(date);
  function streak(days, now = new Date()) {
    const set = new Set(days), cursor = new Date(day(now) + 'T12:00:00Z');
    if (!set.has(day(cursor))) cursor.setUTCDate(cursor.getUTCDate() - 1);
    let count = 0;
    while (set.has(day(cursor))) { count++; cursor.setUTCDate(cursor.getUTCDate() - 1); }
    return count;
  }
  function seededText(seed, paragraphs) {
    let n = 2166136261;
    for (const c of seed) n = Math.imul(n ^ c.charCodeAt(0), 16777619) >>> 0;
    const pool = [...paragraphs];
    for (let i = pool.length - 1; i > 0; i--) {
      n = (Math.imul(n, 1664525) + 1013904223) >>> 0;
      const j = n % (i + 1); [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.join(' ');
  }
  function drill(keys, words) {
    const safe = [...new Set(keys)].filter(k => /^[a-záéíóúüñ,. ]$/i.test(k));
    if (!safe.length) return '';
    return safe.flatMap(k => {
      const candidates = words.filter(w => w.includes(k)).slice(0, 5);
      return [k === ' ' ? 'a la sala' : `${k}${k} ${k}${k}`, ...candidates, ...candidates.slice(0, 2)];
    }).join(' ').trim();
  }
  const jokes = [
    ['El teclado pidió GPS. Vamos tecla por tecla.', 'Las neuronas están precalentando. Nadie corre una maratón en pantuflas.'],
    ['Hay talento. Y una tecla que se hace la distraída.', 'El error se quiso colar. Ya tenemos su foto.'],
    ['Ese ritmo ya merece mate y aplausos.', 'Tu yo de ayer acaba de pedir la revancha.'],
    ['El teclado pidió vacaciones. No estaba preparado.', 'Tus neuronas armaron una cooperativa de aciertos.']
  ];
  function feedback(accuracy, variant = 0, humor = true) {
    if (!humor) return accuracy >= 95 ? 'Excelente precisión. Mantené un ritmo cómodo.' : 'Cada error te muestra qué practicar. Bajá el ritmo y probá de nuevo.';
    return jokes[accuracy < 60 ? 0 : accuracy < 85 ? 1 : accuracy < 95 ? 2 : 3][variant % 2];
  }
  const api = { day, streak, seededText, drill, feedback };
  root.Dojo = api;
  if (typeof module !== 'undefined') module.exports = api;
})(globalThis);
