
// service-worker.js

const CACHE_NAME = 'fiscal-control-v3';
// Usamos rutas absolutas '/' para evitar problemas con subdirectorios o redirecciones
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

// 1. INSTALACIÓN
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Intentamos cachear los assets críticos.
      return cache.addAll(ASSETS_TO_CACHE).catch(err => {
        console.warn('SW: Fallo precaching de algunos assets, continuando...', err);
      });
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

// 3. FETCH
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ignorar llamadas a API externas (Google Scripts, etc)
  if (!url.origin.includes(self.location.origin)) {
    return; 
  }

  // ESTRATEGIA DE NAVEGACIÓN (App Shell):
  // Si la petición es una navegación (abrir la app, recargar), servimos siempre index.html (o la raíz /)
  // Esto soluciona errores 404 si el usuario entra por una ruta que el servidor no conoce (SPA routing)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('/').then((cachedItem) => {
        // Retornar caché, o intentar red, o fallar a index.html si todo falla
        return cachedItem || fetch(event.request).catch(() => caches.match('/index.html'));
      })
    );
    return;
  }

  // ESTRATEGIA PARA ASSETS (Stale-While-Revalidate):
  // Servir caché rápido, actualizar en segundo plano.
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Fallo silencioso en fetch de background
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
