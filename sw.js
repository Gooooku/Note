// Service Worker — Notes Élèves
// Permet l'utilisation hors ligne sur iPad via GitHub Pages.
// Change la version pour forcer la mise à jour du cache après une modif.

const VERSION = 'v1.7.1';
const CACHE = `notes-eleves-${VERSION}`;

// Tous les chemins sont relatifs pour fonctionner sous /repo-name/ sur GitHub Pages
const ASSETS = [
  './',
  './index.html'
];

// INSTALL — pré-cache des fichiers principaux
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ACTIVATE — nettoyage des anciens caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// FETCH — stratégie "stale-while-revalidate" :
// On sert d'abord depuis le cache (rapide + offline),
// puis on met à jour le cache en arrière-plan quand on a du réseau.
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  // On ne gère que le même origin (GitHub Pages)
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.open(CACHE).then(cache =>
      cache.match(event.request).then(cached => {
        const networkFetch = fetch(event.request)
          .then(response => {
            if (response && response.status === 200 && response.type === 'basic') {
              cache.put(event.request, response.clone());
            }
            return response;
          })
          .catch(() => cached);
        return cached || networkFetch;
      })
    )
  );
});
