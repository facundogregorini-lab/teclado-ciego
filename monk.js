/* Ayudanos a mejorar: a monk peeks from the right edge of the screen; a click opens a playful dialog to write to the monks
   (api/feedback.js). The monks read every message in comentarios.html.
   So it never gets in the way: it's small and half hidden at the edge, it leaves during lessons and quizzes (body[data-view]),
   it can be tucked away (the "Ayudanos a mejorar" link at the bottom still opens it), it works with the keyboard and
   it respects prefers-reduced-motion. Its hint bubble shows up only once per browser. */
(() => {
  const HIDE = 'tn-monk-hidden', TEASED = 'tn-monk-teased', TOKEN = 'teclado-ciego-token';
  const get = k => { try { return localStorage.getItem(k); } catch { return null; } };
  const set = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch {} };
  const track = (event, props) => window.tn?.capture?.(event, props);

  const MOODS = [
    { v: 1, e: '😖', label: 'Muy mal', say: 'Uy… respirá hondo y contanos qué pasó. Lo vamos a arreglar.' },
    { v: 2, e: '😕', label: 'Mal', say: 'Mmm, algo no fluye. Contanos qué te molestó.' },
    { v: 3, e: '😐', label: 'Más o menos', say: 'El camino del medio… ¿qué le falta al templo?' },
    { v: 4, e: '🙂', label: 'Bien', say: '¡Bien! ¿Qué haría que fuera excelente?' },
    { v: 5, e: '🤩', label: '¡Genial!', say: '¡El gong suena de alegría! ¿Qué es lo que más te gusta?' },
  ];
  const KINDS = [
    { v: 'idea', e: '💡', label: 'Una idea', ph: 'Estaría buenísimo que…' },
    { v: 'bug', e: '🐞', label: 'Algo no anda', ph: 'Cuando hago… pasa… (contanos también en qué dispositivo)' },
    { v: 'love', e: '❤️', label: 'Algo que me gusta', ph: 'Lo que más me gusta es…' },
    { v: 'otro', e: '🗨️', label: 'Otra cosa', ph: 'Querido monje…' },
  ];
  const HELLO = '¡Hola, pequeño saltamontes! ¿Cómo te va en el templo?';
  const THANKS = [
    '"La gota constante horada la piedra." Tu mensaje también.',
    'Un monje acaba de servir té para leer tu pergamino 🍵',
    '"Cada maestro fue antes un desastre." Gracias por ayudarnos a dejar de serlo.',
    '"El que pregunta es tonto un minuto; el que no, toda la vida." Gracias por hablar.',
  ];

  /* ---------- The monk, in SVG: one face per mood, 0 = calm ---------- */
  const INK = '#3b2a1e';
  const closed = up => `<path d="M46 ${up ? 49 : 47} q5 ${up ? -5 : 4} 10 0 M64 ${up ? 49 : 47} q5 ${up ? -5 : 4} 10 0" stroke="${INK}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
  const open = (r = 2.8) => `<circle cx="51" cy="48" r="${r}" fill="${INK}"/><circle cx="69" cy="48" r="${r}" fill="${INK}"/><circle cx="52" cy="47" r=".9" fill="#fff"/><circle cx="70" cy="47" r=".9" fill="#fff"/>`;
  const FACES = {
    0: closed(false) + `<path d="M54 59 q6 5 12 0" stroke="${INK}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`,
    1: open(2.6) + `<path d="M44 42 L55 38 M76 42 L65 38" stroke="${INK}" stroke-width="2" stroke-linecap="round"/><path d="M54 63 q6 -6 12 0" stroke="${INK}" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M76 52 q2 5 0 7 q-2 -2 0 -7Z" fill="#7cc3f0"/>`,
    2: open(2.6) + `<path d="M45 41 L55 40 M75 41 L65 40" stroke="${INK}" stroke-width="2" stroke-linecap="round"/><path d="M54 62 q6 -3 12 0" stroke="${INK}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`,
    3: open(2.6) + `<path d="M54 61 h12" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>`,
    4: open(2.8) + `<path d="M53 58 q7 6 14 0" stroke="${INK}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`,
    5: closed(true) + `<path d="M51 57 q9 12 18 0Z" fill="#8a3b2a"/><path d="M54 58.5 q6 2 12 0" stroke="#fff" stroke-width="1.6" fill="none"/>`,
  };
  const monk = (face = 0) => `<svg viewBox="0 0 120 140" aria-hidden="true" focusable="false">
    <ellipse cx="60" cy="134" rx="34" ry="5" fill="#0000001a"/>
    <g class="monk-body">
      <path d="M28 134 Q26 88 60 77 Q94 88 92 134Z" fill="#e98a2c"/>
      <path d="M42 81 L82 134 H68 L36 90Z" fill="#c65a1d" opacity=".8"/>
      <g fill="#7a4a2a">${[0, 1, 2, 3, 4, 5, 6].map(i => `<circle cx="${44 + i * 5.3}" cy="${81 + Math.sin(i / 6 * Math.PI) * 9}" r="2.3"/>`).join('')}</g>
      <g class="monk-head">
        <circle cx="34" cy="49" r="6" fill="#eab48c"/><circle cx="86" cy="49" r="6" fill="#eab48c"/>
        <circle cx="60" cy="47" r="26" fill="#f2c9a0"/>
        <ellipse cx="50" cy="31" rx="8" ry="4" fill="#fff" opacity=".45" transform="rotate(-20 50 31)"/>
        <circle cx="45" cy="56" r="4" fill="#f4a7a0" opacity=".6"/><circle cx="75" cy="56" r="4" fill="#f4a7a0" opacity=".6"/>
        <g class="monk-face">${FACES[face] || FACES[0]}</g>
      </g>
      <g class="monk-scroll-held"><rect x="38" y="100" width="44" height="13" rx="6.5" fill="#f6e7c1" stroke="#c9a227" stroke-width="1.5"/><path d="M47 105 h22 M47 109 h16" stroke="#c9a227" stroke-width="1.2"/>
        <circle cx="44" cy="106.5" r="6" fill="#f2c9a0"/><circle cx="76" cy="106.5" r="6" fill="#f2c9a0"/></g>
    </g>
  </svg>`;

  /* ---------- On the edge of the screen ---------- */
  const peek = document.createElement('button');
  peek.type = 'button'; peek.className = 'monk-peek'; peek.id = 'monkPeek';
  peek.setAttribute('aria-haspopup', 'dialog');
  peek.setAttribute('aria-label', 'Ayudanos a mejorar: dejale un comentario a los monjes');
  peek.innerHTML = `<span class="monk-tag" aria-hidden="true">Ayudanos a mejorar</span><span class="monk-art">${monk()}</span>`;
  const bubble = document.createElement('div');
  bubble.className = 'monk-bubble'; bubble.id = 'monkBubble'; bubble.hidden = true;
  bubble.innerHTML = '<button type="button" class="monk-bubble-open">¿Nos ayudás a mejorar el templo? Los monjes leen todo 🙏</button><button type="button" class="monk-bubble-x" aria-label="Cerrar el mensaje del monje">×</button>';

  /* ---------- The dialog ---------- */
  const dlg = document.createElement('dialog');
  dlg.id = 'monkDlg'; dlg.className = 'monk-dlg';
  dlg.setAttribute('aria-labelledby', 'monkTitle');
  const radios = (name, list) => list.map(o => `<label><input type="radio" name="${name}" value="${o.v}"><span class="em" aria-hidden="true">${o.e}</span><small>${o.label}</small></label>`).join('');
  dlg.innerHTML = `
    <form class="dlg monk-form" id="monkForm" novalidate>
      <div class="monk-stage"><div class="monk-big" id="monkBig">${monk()}</div><p class="monk-say" id="monkSay" aria-live="polite">${HELLO}</p></div>
      <h2 id="monkTitle">Ayudanos a mejorar</h2>
      <fieldset class="monk-moods"><legend>¿Cómo te sentís en el templo?</legend><div>${radios('mood', MOODS)}</div></fieldset>
      <fieldset class="monk-kinds"><legend>¿Sobre qué nos escribís?</legend><div>${radios('kind', KINDS)}</div></fieldset>
      <label class="field" for="monkText">Tu mensaje a los monjes<textarea id="monkText" rows="4" maxlength="1000" placeholder="Querido monje…"></textarea></label>
      <div class="monk-meta"><label class="monk-sign" id="monkSignRow" hidden><input type="checkbox" id="monkSign" checked> Firmar como <b id="monkSignName"></b></label><span class="monk-count" id="monkCount">0/1000</span></div>
      <input class="monk-hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
      <p class="err" id="monkErr" role="alert"></p>
      <div class="actions"><button type="submit" class="btn primary" id="monkSend">Enviar el pergamino 📜</button><button type="button" class="linkbtn" id="monkClose">Ahora no</button></div>
      <button type="button" class="linkbtn monk-tuck" id="monkTuck"></button>
    </form>
    <div class="dlg monk-done" id="monkDone" hidden>
      <div class="monk-gong" aria-hidden="true"><i></i><i></i><i></i></div>
      <div class="monk-big bow" id="monkBow">${monk(5)}</div>
      <span class="monk-flying" aria-hidden="true">📜</span>
      <h2 tabindex="-1" id="monkDoneTitle">¡Pergamino recibido!</h2>
      <p id="monkThanks"></p>
      <div class="actions"><button type="button" class="btn primary" id="monkBack">Volver a practicar</button></div>
    </div>`;
  document.body.append(peek, bubble, dlg);
  const $ = id => document.getElementById(id);
  const form = $('monkForm'), text = $('monkText');

  const view = () => document.body.dataset.view || 'home';
  const tucked = () => get(HIDE) === '1';
  function place() {
    peek.hidden = tucked() || view() !== 'home';
    if (peek.hidden) bubble.hidden = true;
    $('monkTuck').textContent = tucked() ? 'Volver a mostrar al monje en el costado' : 'Esconder al monje del costado';
  }
  new MutationObserver(place).observe(document.body, { attributes: true, attributeFilter: ['data-view'] });
  place();

  function face(v) {
    const big = $('monkBig');
    big.innerHTML = monk(v);
    big.classList.remove('pop'); void big.offsetWidth; big.classList.add('pop');
  }
  function reset() {
    form.reset(); form.hidden = false; $('monkDone').hidden = true;
    $('monkErr').textContent = ''; $('monkCount').textContent = '0/1000'; $('monkSay').textContent = HELLO;
    text.placeholder = 'Querido monje…'; face(0);
  }
  let source = 'monk';
  async function openMonk(from = 'monk') {
    source = from; bubble.hidden = true; set(TEASED, '1');
    if (!dlg.open) { if (form.hidden) reset(); dlg.showModal(); }
    place(); track('feedback_opened', { source: from });
    // With a session, the message can be signed with the name the account shows
    const token = get(TOKEN);
    $('monkSignRow').hidden = true;
    if (token) {
      try {
        const r = await fetch('/api/auth', { headers: { Authorization: 'Bearer ' + token } });
        const who = r.ok ? (await r.json()).user : null;
        if (who) { $('monkSignName').textContent = who.display || who.name; $('monkSignRow').hidden = false; }
      } catch {}
    }
  }
  window.openMonk = openMonk;

  peek.onclick = () => openMonk('monk');
  bubble.querySelector('.monk-bubble-x').onclick = () => { bubble.hidden = true; };
  bubble.querySelector('.monk-bubble-open').onclick = () => openMonk('bubble');
  document.addEventListener('click', e => { const link = e.target.closest?.('[data-monk-open]'); if (link) { e.preventDefault(); openMonk('link'); } });
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); }); // a click on the backdrop closes it
  $('monkClose').onclick = () => dlg.close();
  $('monkBack').onclick = () => dlg.close();
  dlg.addEventListener('close', () => { if (!form.hidden) return; reset(); });
  $('monkTuck').onclick = () => { set(HIDE, tucked() ? null : '1'); place(); };

  form.addEventListener('change', e => {
    if (e.target.name === 'mood') { const m = MOODS.find(o => String(o.v) === e.target.value); face(m.v); $('monkSay').textContent = m.say; }
    if (e.target.name === 'kind') text.placeholder = KINDS.find(o => o.v === e.target.value).ph;
  });
  text.addEventListener('input', () => { $('monkCount').textContent = `${[...text.value].length}/1000`; });
  text.addEventListener('keydown', e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) form.requestSubmit(); });

  form.onsubmit = async e => {
    e.preventDefault();
    const err = $('monkErr'), send = $('monkSend'), data = new FormData(form);
    if ([...text.value.trim()].length < 3) { err.textContent = 'Escribile a los monjes al menos unas palabras.'; text.focus(); return; }
    err.textContent = ''; send.disabled = true;
    const mood = Number(data.get('mood')) || null, kind = data.get('kind') || 'otro', token = get(TOKEN);
    try {
      const r = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
        body: JSON.stringify({ mood, kind, text: text.value, sign: !$('monkSignRow').hidden && $('monkSign').checked, page: view(), website: data.get('website') }),
      });
      const json = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(json.error || (r.status === 404 ? 'Los comentarios funcionan en la versión publicada.' : 'No se pudo enviar. Probá de nuevo.'));
      track('feedback_sent', { mood, kind, length: [...text.value].length, source });
      $('monkThanks').textContent = THANKS[Math.floor(Math.random() * THANKS.length)];
      form.hidden = true; $('monkDone').hidden = false; $('monkDoneTitle').focus();
    } catch (error) { err.textContent = error.message === 'Failed to fetch' ? 'No se pudo conectar. Revisá tu conexión y probá de nuevo.' : error.message; }
    send.disabled = false;
  };

  // A single hint, once per browser: after a while on the home page, never over a dialog or during practice
  if (!get(TEASED)) setTimeout(() => {
    if (get(TEASED) || peek.hidden || document.hidden || document.querySelector('dialog[open]')) return;
    set(TEASED, '1'); bubble.hidden = false;
    setTimeout(() => { bubble.hidden = true; }, 9000);
  }, 25000);
})();
