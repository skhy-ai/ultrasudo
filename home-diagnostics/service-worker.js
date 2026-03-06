const CACHE_NAME = 'home-dx-cache-v1';
const ASSETS = ['./','./index.html','./style.css','./script.js','./manifest.json','./db.js','./remedies.js','./care.js','./sw-register.js'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(ASSETS))); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k))))); });
self.addEventListener('fetch', e => {
  const { request } = e; if (request.method !== 'GET') return;
  e.respondWith(
    caches.match(request).then(cached => {
      const fetched = fetch(request).then(r => { const copy = r.clone(); caches.open(CACHE_NAME).then(c=>c.put(request, copy)); return r; }).catch(()=>cached);
      return cached || fetched;
    })
  );
});
