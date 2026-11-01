// Network first (so updates show up right away), falling back to the cache when offline.
const CACHE = 'booboo-town-v1';
const CORE = ['./', 'index.html', 'css/style.css', 'manifest.webmanifest', 'icon.svg', 'icon-512.png',
  'js/main.js', 'js/nav.js', 'js/run.js', 'js/ui.js', 'js/art.js', 'js/state.js', 'js/speech.js', 'js/audio.js', 'js/words.js', 'js/town.js',
  'js/scenes/spider.js', 'js/scenes/rainbow.js', 'js/scenes/space.js'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(r => {
    if (r.ok && (new URL(e.request.url).origin === location.origin || e.request.url.includes('fonts.g'))) {
      const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy));
    }
    return r;
  }).catch(() => caches.match(e.request).then(m => m || caches.match('index.html'))));
});
