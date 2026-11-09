'use strict';
/* Cambie este número cada vez que publique una versión nueva. */
const CACHE_VERSION = 'v1';
const CACHE = 'calculadora-' + CACHE_VERSION;

/* Todas las rutas son relativas al alcance (scope) del Service Worker,
   por lo que funcionan en la raíz o en un subdirectorio (/calculadora/). */
const FILES = [
  './',
  'index.html',
  'styles.css',
  'app.js',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png'
].map(function (p) { return new URL(p, self.registration.scope).href; });

const INDEX = new URL('index.html', self.registration.scope).href;

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE)
      .then(function (cache) { return cache.addAll(FILES); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys
          .filter(function (k) { return k.indexOf('calculadora-') === 0 && k !== CACHE; })
          .map(function (k) { return caches.delete(k); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

/* Caché primero (carga rápida y sin conexión); en segundo plano se
   actualiza la copia para que la próxima apertura use la versión nueva. */
self.addEventListener('fetch', function (event) {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then(function (hit) {
      const network = fetch(req).then(function (res) {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      });
      if (hit) {
        network.catch(function () {});
        return hit;
      }
      return network.catch(function () {
        if (req.mode === 'navigate') return caches.match(INDEX);
        return Response.error();
      });
    })
  );
});
