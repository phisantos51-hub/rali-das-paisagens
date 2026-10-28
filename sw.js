/* Guarda os arquivos do jogo no navegador, para funcionar sem internet.
   Sempre tenta buscar a versão mais nova; se não houver internet,
   usa a cópia guardada. */
var CACHE = 'rali-das-paisagens-v1';
var ARQUIVOS = ['./', 'index.html', 'estilo.css', 'missoes.js', 'jogo.js'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ARQUIVOS); }));
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then(function (resp) {
      if (resp && resp.ok) {
        var copia = resp.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copia); });
      }
      return resp;
    }).catch(function () {
      return caches.match(e.request, { ignoreSearch: true });
    })
  );
});
