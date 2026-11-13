/* Brain Snacks — offline cache.
   BUMP VERSION after every edit, or the phone keeps serving the old copy. */
var VERSION = 'brain-snacks-3e76176';
var FILES = ['./', './index.html', './art.js', './game.js', './kit.js',
             './puzzles.js', './puzzles2.js', './puzzles3.js', './puzzles4.js', './puzzles5.js',
             './pairs.js', './oddone.js', './echo.js', './spot.js', './slide.js',
             './snapshot.js', './trail.js', './wakeup.js', './sortit.js', './maze.js',
             './untangle.js', './whichway.js', './fillit.js',
             './bigone.js', './chomp.js', './wholeft.js', './beads.js', './robot.js', './mirror.js',
             './manifest.json', './icon-180.png', './icon-192.png', './icon-512.png'];

/* cache.addAll() is atomic: one 404 anywhere and the whole install rejects, the
   worker never activates, and the app silently loses offline entirely while
   still looking fine on wifi. Cache each file on its own instead. */
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) {
    return Promise.all(FILES.map(function (f) {
      return c.add(f).catch(function () { return null; });
    }));
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.map(function (k) { return k !== VERSION ? caches.delete(k) : null; }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') { return; }
  e.respondWith(caches.match(e.request).then(function (hit) {
    if (hit) { return hit; }
    return fetch(e.request).then(function (res) {
      var copy = res.clone();
      caches.open(VERSION).then(function (c) { c.put(e.request, copy); });
      return res;
    }).catch(function () { return caches.match('./index.html'); });
  }));
});
