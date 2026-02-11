
// service-worker.js

const CACHE_NAME = 'fiscal-control-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Escuchar eventos 'push' (simulados o reales desde backend)
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'Alerta Fiscal', body: 'Tiene pagos pendientes.' };
  
  const options = {
    body: data.body,
    // Icono actualizado con el nuevo logo de la app
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

// Manejar clic en la notificación
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    // Abrir la ventana de la aplicación si no está abierta
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clientList) => {
        if (clientList.length > 0) {
          let client = clientList[0];
          for (let i = 0; i < clientList.length; i++) {
            if (clientList[i].focused) {
              client = clientList[i];
            }
          }
          return client.focus();
        }
        return self.clients.openWindow('/');
      })
    );
  }
});
