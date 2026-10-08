// Templo Ninja installed from the home screen (PWA): what the browser needs to offer "Agregar a mi inicio", and a
// fallback when there is no connection. Always the network first (prices, accounts and battles stay fresh); the
// copy kept of each page and file is used only when the network fails. The API and analytics are never touched.
const CACHE = 'tn-v1';
const SHELL = ['/nueva', '/nueva.css', '/nueva.js', '/app.css', '/app.js', '/desafios.js', '/icons/icon-192.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {}).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin || /^\/(api|ingest)\//.test(url.pathname)) return;
  e.respondWith(fetch(req).then(res => {
    if (res.ok && res.type === 'basic') { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match(req, { ignoreSearch: req.mode === 'navigate' }).then(hit => hit || (req.mode === 'navigate' ? caches.match('/nueva') : undefined)).then(hit => hit || Response.error())));
});
