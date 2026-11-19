// 황지 페이퍼트레일 service worker: makes the game installable (PWA) and playable offline once it has been opened.
// - Pages (navigations) are network-first: a new deploy shows at once; offline, the cached page answers.
// - The hashed build (assets/) never changes under one name: cache-first.
// - Everything else from this site (textures, models, sounds, icons) and the Jua web font: stale-while-revalidate -
//   answered from the cache at once, refreshed in the background for next time.
// Bump VERSION to drop every old cache.
const VERSION = 'v2'; // v2: the hero (girl in a straw hat) icons
const CACHE = 'hwangji-' + VERSION;
const CORE = ['./', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('hwangji-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || req.headers.has('range')) return;
  const url = new URL(req.url);
  const own = url.origin === self.location.origin;
  const font = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!own && !font) return;
  if (req.mode === 'navigate') e.respondWith(page(e));
  else if (own && url.pathname.includes('/assets/')) e.respondWith(cacheFirst(e));
  else e.respondWith(staleWhileRevalidate(e));
});

async function save(key, res) {
  if (!res || !(res.ok || res.type === 'opaque')) return;
  const c = await caches.open(CACHE);
  await c.put(key, res);
}

async function page(e) {
  try {
    const res = await fetch(e.request);
    if (res.ok) e.waitUntil(save('./', res.clone()));
    return res;
  } catch {
    return (await caches.match('./')) || Response.error();
  }
}

async function cacheFirst(e) {
  const hit = await caches.match(e.request);
  if (hit) return hit;
  const res = await fetch(e.request);
  e.waitUntil(save(e.request, res.clone()));
  return res;
}

async function staleWhileRevalidate(e) {
  const hit = await caches.match(e.request);
  const net = fetch(e.request).then((res) => { e.waitUntil(save(e.request, res.clone())); return res; });
  if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
  return net;
}
