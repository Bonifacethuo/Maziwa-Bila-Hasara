// Scope caches to this project; never delete another GitHub Pages app's cache.
const PREFIX = `maziwa-bila-hasara:${self.registration.scope}:`;
const CACHE = `${PREFIX}v3`;
const ASSETS = ['./', './index.html', './styles.css', './app.js', './domain.js', './icon.svg', './manifest.webmanifest'].map(path => new URL(path, self.registration.scope).href);
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => Promise.all(ASSETS.map(async url => {
    const fresh = new URL(url); fresh.searchParams.set('release','2');
    const response = await fetch(new Request(fresh.href, {cache:'reload'}));
    if (!response.ok) throw new Error('App shell could not be cached');
    await cache.put(url,response);
  }))));
  // Existing tabs retain a coherent release until closed. Do not interrupt a farm form.
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => (key.startsWith(PREFIX) && key !== CACHE) || key === 'maziwa-v1').map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  // Query strings are not cache keys. Only exact, known app assets are handled.
  url.search = ''; url.hash = '';
  if (!ASSETS.includes(url.href)) return;
  event.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match(url.href);
    return cached || fetch(event.request);
  }));
});
