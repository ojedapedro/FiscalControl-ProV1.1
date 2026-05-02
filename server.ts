import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Cargar variables de entorno antes de cualquier otra operación
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config(); // Fallback a .env

import express from 'express';

console.log('🚀 [Server] server.ts cargado');
console.log('🚀 [Server] NODE_ENV:', process.env.NODE_ENV);
console.log('🔑 [Server] RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'Configurada ✅' : 'NO CONFIGURADA ❌');
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { checkAndSendNotifications } from './server/notifications';

// SEGURIDAD: Middleware de autenticación, rate limiting, y headers HTTP
import { authMiddleware } from './server/authMiddleware';
import { rateLimiter } from './server/rateLimiter';
import { securityHeaders } from './server/securityHeaders';

// Import API handlers
import pingHandler from './api/ping.ts';
import createPaymentIntentHandler from './api/create-payment-intent.ts';
import sendEmailsHandler from './api/payroll/send-emails.ts';
import sendEmailHandler from './api/notifications/send-email.ts';
import whatsappCheckHandler from './api/notifications/whatsapp/check.ts';
import whatsappSendHandler from './api/notifications/whatsapp/send.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  console.log(`🚀 [Server] Iniciando servidor Express... (${new Date().toISOString()})`);
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || (process.env.NODE_ENV === 'development' ? '*' : []),
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;

  // Socket.IO Logic
  io.on('connection', (socket) => {
    console.log(`🔌 [Socket] Nuevo usuario conectado: ${socket.id}`);

    socket.on('join:room', (room) => {
      socket.join(room);
      console.log(`👥 [Socket] Usuario ${socket.id} se unió a la sala: ${room}`);
    });

    socket.on('chat:message', (message) => {
      // Broadcast simple a todos en la sala. 
      // La persistencia se maneja en el cliente vía Firestore para robustez.
      io.to(message.room).emit('chat:message', message);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 [Socket] Usuario desconectado: ${socket.id}`);
    });
  });

  // SEGURIDAD: Headers HTTP de seguridad (CSP, HSTS, X-Frame-Options, etc.)
  app.use(securityHeaders);

  app.use(express.json({ limit: '5mb' }));
  app.use(cookieParser());
  app.use(session({
    secret: process.env.SESSION_SECRET || 'fiscal-control-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: process.env.NODE_ENV === 'production', 
      sameSite: 'lax',
      httpOnly: true 
    }
  }));

  // --- RUTAS API ---
  
  // Ping: Público (health check)
  app.get('/api/ping', pingHandler);

  // Stripe: Autenticado + Rate Limited (5 req/min)
  app.post('/api/create-payment-intent', 
    authMiddleware, 
    rateLimiter({ maxRequests: 5, windowMs: 60000, message: 'Demasiados intentos de pago. Espere 1 minuto.' }),
    createPaymentIntentHandler
  );

  // Emails de nómina: Autenticado + Rate Limited (10 req/min)
  app.post('/api/payroll/send-emails', 
    authMiddleware, 
    rateLimiter({ maxRequests: 10, windowMs: 60000, message: 'Límite de envío de correos alcanzado.' }),
    sendEmailsHandler
  );

  // Email genérico: Autenticado + Rate Limited (15 req/min)
  app.post('/api/notifications/send-email', 
    authMiddleware, 
    rateLimiter({ maxRequests: 15, windowMs: 60000, message: 'Límite de envío de correos alcanzado.' }),
    sendEmailHandler
  );

  // WhatsApp check: Autenticado + Rate Limited (3 req/min)
  app.post('/api/notifications/whatsapp/check', 
    authMiddleware, 
    rateLimiter({ maxRequests: 3, windowMs: 60000 }),
    whatsappCheckHandler
  );

  // WhatsApp send: Autenticado + Rate Limited (10 req/min)
  app.post('/api/notifications/whatsapp/send', 
    authMiddleware, 
    rateLimiter({ maxRequests: 10, windowMs: 60000, message: 'Límite de envío de WhatsApp alcanzado.' }),
    whatsappSendHandler
  );

  // Global Error Handler — SEGURIDAD: No exponer detalles internos en producción
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('💥 Unhandled Server Error:', err);
    res.status(500).json({ 
      error: 'Error interno del servidor.',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {})
    });
  });

  // Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
    
    // Configurar chequeo diario de notificaciones (cada 24 horas)
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    setInterval(async () => {
      console.log('🕒 [Server] Ejecutando chequeo diario de notificaciones...');
      try {
        await checkAndSendNotifications();
      } catch (err) {
        console.error('❌ [Server] Error en el chequeo diario:', err);
      }
    }, TWENTY_FOUR_HOURS);
    
    // Ejecutar un chequeo inicial después de 30 segundos del arranque
    setTimeout(async () => {
      console.log('🕒 [Server] Ejecutando chequeo inicial de notificaciones...');
      try {
        await checkAndSendNotifications();
      } catch (err) {
        console.error('❌ [Server] Error en el chequeo inicial:', err);
      }
    }, 30000);
  });
}

startServer();
