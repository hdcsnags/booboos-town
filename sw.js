// Network first (so updates show up right away), falling back to the cache when offline.
// After install, Booboo's recorded voice clips are cached in the background for offline play.
const CACHE = 'booboo-town-v2';
const CORE = ['./', 'index.html', 'css/style.css', 'manifest.webmanifest', 'icon.svg', 'icon-512.png',
  'js/main.js', 'js/nav.js', 'js/run.js', 'js/ui.js', 'js/art.js', 'js/state.js', 'js/speech.js', 'js/audio.js', 'js/words.js', 'js/town.js',
  'js/scenes/spider.js', 'js/scenes/rainbow.js', 'js/scenes/space.js', 'audio/voice/index.json'];
async function cacheVoice() {
  try {
    const c = await caches.open(CACHE);
    const idx = await (await fetch('audio/voice/index.json', { cache: 'no-cache' })).json();
    const files = [...new Set(Object.values(idx.clips))];
    for (let i = 0; i < files.length; i += 20) {
      await Promise.all(files.slice(i, i + 20).map(async f => {
        const url = 'audio/voice/' + f;
        if (!(await c.match(url))) { const r = await fetch(url); if (r.ok) await c.put(url, r); }
      }));
    }
  } catch (e) {}
}
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
  cacheVoice();
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
