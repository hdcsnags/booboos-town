// Network first (so updates show up right away), falling back to the cache when offline.
// Voice clips are cache-first; the page fetches them all once in the background (js/speech.js warm()).
const CACHE = 'booboo-town-v3';
const CORE = ['./', 'index.html', 'css/style.css', 'manifest.webmanifest', 'icon.svg', 'icon-512.png',
  'js/main.js', 'js/nav.js', 'js/run.js', 'js/ui.js', 'js/art.js', 'js/state.js', 'js/speech.js', 'js/audio.js', 'js/words.js', 'js/town.js',
  'js/scenes/spider.js', 'js/scenes/rainbow.js', 'js/scenes/space.js',
  'js/scenes/common.js', 'js/scenes/garden.js', 'js/scenes/bakery.js', 'js/scenes/trains.js'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // voice clips never change (the file name is a hash of the words): cache first
  if (url.pathname.includes('/audio/voice/') && url.pathname.endsWith('.mp3')) {
    e.respondWith(caches.match(e.request).then(m => m || fetch(e.request).then(r => {
      if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
      return r;
    })));
    return;
  }
  e.respondWith(fetch(e.request).then(r => {
    if (r.ok && (url.origin === location.origin || e.request.url.includes('fonts.g'))) {
      const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy));
    }
    return r;
  }).catch(() => caches.match(e.request).then(m => m || caches.match('index.html'))));
});
