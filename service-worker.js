
// service-worker.js

const CACHE_NAME = 'fiscal-control-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json'
  // En producción, aquí se añadirían los bundles JS/CSS generados
];

// 1. INSTALACIÓN: Cachear recursos estáticos (App Shell)
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Forzar activación inmediata
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Intentamos cachear lo básico. Si falla alguno, no importa en dev,
      // pero es crucial para producción.
      return cache.addAll(ASSETS_TO_CACHE).catch(err => console.log('SW: Cache precache error', err));
    })
  );
});

// 2. ACTIVACIÓN: Limpiar cachés viejas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. FETCH: Estrategia "Network First" para API, "Stale-While-Revalidate" para assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Si es una llamada a la API de Google Scripts, SIEMPRE ir a la red (no cachear datos dinámicos)
  if (url.hostname.includes('script.google.com')) {
    return; // Dejar que el navegador maneje la red normalmente
  }

  // Para otros recursos (imágenes, scripts, html)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Estrategia: Devolver caché si existe, pero actualizar en segundo plano (Stale-while-revalidate)
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Solo cachear respuestas válidas y seguras
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Si falla la red y no hay caché, retornar fallback offline si fuese necesario
      });

      return cachedResponse || fetchPromise;
    })
  );
});

// 4. PUSH NOTIFICATIONS
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'Alerta Fiscal', body: 'Tiene pagos pendientes.' };
  
  const options = {
    body: data.body,
    icon: 'https://i.ibb.co/GvxRWGWB/Pix-Verse-Image-Effect-prompt-crea-una-imagen-p.jpg',
    badge: 'https://i.ibb.co/GvxRWGWB/Pix-Verse-Image-Effect-prompt-crea-una-imagen-p.jpg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      { action: 'explore', title: 'Ver Pagos' },
      { action: 'close', title: 'Cerrar' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'explore') {
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clientList) => {
        if (clientList.length > 0) {
          let client = clientList[0];
          for (let i = 0; i < clientList.length; i++) {
            if (clientList[i].focused) {
              return client.focus();
            }
          }
          if (clientList.length > 0) return clientList[0].focus();
        }
        return self.clients.openWindow('/');
      })
    );
  }
});
