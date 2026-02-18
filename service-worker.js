
// service-worker.js

const CACHE_STATIC_NAME = 'fiscal-static-v4';
const CACHE_API_NAME = 'fiscal-api-v1';

// Recursos críticos para que la app arranque (App Shell)
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  // Si tienes iconos locales, agrégalos aquí.
  // Las librerías externas (CDN) se cachearán dinámicamente con Stale-While-Revalidate
];

// 1. INSTALACIÓN: Pre-cachear el App Shell
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_STATIC_NAME).then((cache) => {
      console.log('SW: Pre-caching App Shell');
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// 2. ACTIVACIÓN: Limpiar cachés antiguas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_STATIC_NAME && cacheName !== CACHE_API_NAME) {
            console.log('SW: Borrando caché antigua', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. FETCH: Manejo de Peticiones
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // A) ESTRATEGIA NETWORK-FIRST (Para API Google Sheets)
  // Intentar red primero, si falla (offline), devolver caché.
  if (url.hostname.includes('script.google.com')) {
    // Solo cacheamos peticiones GET (lectura de datos)
    if (event.request.method === 'GET') {
      event.respondWith(
        fetch(event.request)
          .then((networkResponse) => {
            // Si la red responde bien, guardamos una copia en caché y devolvemos la respuesta
            return caches.open(CACHE_API_NAME).then((cache) => {
              cache.put(event.request, networkResponse.clone());
              return networkResponse;
            });
          })
          .catch(() => {
            // Si falla la red, intentamos devolver lo que haya en caché
            return caches.match(event.request);
          })
      );
    }
    return; // Dejar pasar POSTs u otros métodos directamente a la red
  }

  // B) ESTRATEGIA APP SHELL (Navegación)
  // Si es una navegación (abrir la app), servimos index.html siempre
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html').then((cached) => {
        return cached || fetch(event.request);
      })
    );
    return;
  }

  // C) ESTRATEGIA STALE-WHILE-REVALIDATE (Activos Estáticos)
  // Sirve rápido del caché, actualiza en background.
  // Aplica para archivos locales y CDNs (JS, CSS, Fuentes, Imágenes)
  if (
    event.request.destination === 'script' ||
    event.request.destination === 'style' ||
    event.request.destination === 'image' ||
    event.request.destination === 'font' ||
    url.origin === self.location.origin // Archivos locales
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          // Validar respuesta antes de cachear
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic' || networkResponse.type === 'cors') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_STATIC_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        }).catch((err) => {
           // Fallo silencioso en background update
           // console.log('SW: Fallo actualización background', err);
        });

        // Devolver caché si existe, sino esperar a la red
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // D) FALLBACK (Por defecto Network Only)
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
      url: '/'
    },
    actions: [
      { action: 'explore', title: 'Ver Detalles' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      // Si ya hay una ventana abierta, enfocarla
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === '/' && 'focus' in client) return client.focus();
      }
      // Si no, abrir una nueva
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
