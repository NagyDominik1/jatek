/* ═══════════════════════════════════════════════
   SERVICE WORKER — offline működés

   Nincs szerver és nincs adatbázis: a teljes játék
   statikus fájl, így egyszerűen becsomagolható a
   böngésző gyorsítótárába.

   A statikus fájlok „stale-while-revalidate" módon jönnek: a
   cache-ből azonnal megvan, közben frissül a háttérben. Egy
   módosítás így a KÖVETKEZŐ betöltésnél jelenik meg. Ha azonnal
   kell (vagy kiüríted a cache-t), emeld a VERSION-t.
═══════════════════════════════════════════════ */

const VERSION = 'v18';
const SHELL = `kingscup-shell-${VERSION}`;
const FONTS = `kingscup-fonts-${VERSION}`;

const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/icon.svg',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/apple-touch-icon.png',
  './assets/css/tokens.css',
  './assets/css/base.css',
  './assets/css/components.css',
  './assets/css/screens.css',
  './assets/js/main.js',
  './assets/js/dom.js',
  './assets/js/rules.js',
  './assets/js/prefs.js',
  './assets/js/fx.js',
  './assets/js/players.js',
  './assets/js/notes.js',
  './assets/js/deck.js',
  './assets/js/end.js',
  './assets/js/wheel.js',
  './assets/js/platform.js',
  './assets/js/install.js',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(SHELL)
      /* cache:'reload' — enélkül az addAll a böngésző HTTP-gyorsítótárán
         keresztül tölt, és egy verzióemelés után is a RÉGI fájlokat sütné
         be a saját cache-ébe. Innentől a telepítés mindig hálózatról hoz. */
      .then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== SHELL && k !== FONTS).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  /* ── Google Fonts: előbb a cache, közben frissítünk ──
     Első betöltéskor letölti, utána offline is megvan. */
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.open(FONTS).then(async cache => {
        const hit = await cache.match(req);
        const net = fetch(req).then(res => {
          if (res.ok || res.type === 'opaque') cache.put(req, res.clone());
          return res;
        }).catch(() => hit);
        return hit || net;
      })
    );
    return;
  }

  /* Csak a saját hatókörünk: XAMPP alatt a webgyökér közös, és
     egy /favicon.ico-féle kérés nem a mi játékunk dolga. */
  const scope = new URL('./', location.href).pathname;
  if (url.origin !== location.origin || !url.pathname.startsWith(scope)) return;

  /* ── navigáció: hálózat először, offline-ban a mentett index ── */
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(SHELL).then(c => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  /* ── statikus fájlok: cache-ből azonnal, közben frissítés ──
     Így offline is elindul, viszont egy fájl módosítása a
     következő betöltésnél magától megjelenik — nem kell hozzá
     minden apró javítás után VERSION-t emelni. */
  event.respondWith(
    caches.open(SHELL).then(async cache => {
      const hit = await cache.match(req);
      const net = fetch(req)
        .then(res => {
          if (res.ok) cache.put(req, res.clone());
          return res;
        })
        .catch(() => hit);
      return hit || net;
    })
  );
});
