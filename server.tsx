import fs from 'fs';
import path from 'path';

// Load .env.local variables before anything else
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIndex = trimmed.indexOf('=');
        if (eqIndex > 0) {
          const key = trimmed.substring(0, eqIndex).trim();
          const value = trimmed.substring(eqIndex + 1).trim();
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      }
    });
    console.log('✅ [Server] Variables de entorno cargadas desde .env.local');
  }
} catch (err) {
  console.warn('⚠️ [Server] No se pudo cargar .env.local:', err);
}

import express from 'express';
import { createServer as createViteServer } from 'vite';

console.log('🚀 [Server] server.tsx cargado');
console.log('🚀 [Server] NODE_ENV:', process.env.NODE_ENV);
console.log('🔑 [Server] RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'Configurada ✅' : 'NO CONFIGURADA ❌');
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { checkAndSendNotifications } from './server/notifications';

// SEGURIDAD: Middleware de autenticación y rate limiting
import { authMiddleware } from './server/authMiddleware';
import { rateLimiter } from './server/rateLimiter';

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
  const PORT = 3000;

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

  // Stripe: Autenticado + Rate Limited
  app.post('/api/create-payment-intent', 
    authMiddleware, 
    rateLimiter({ maxRequests: 5, windowMs: 60000 }),
    createPaymentIntentHandler
  );

  // Emails: Autenticado + Rate Limited
  app.post('/api/payroll/send-emails', 
    authMiddleware, 
    rateLimiter({ maxRequests: 10, windowMs: 60000 }),
    sendEmailsHandler
  );
  app.post('/api/notifications/send-email', 
    authMiddleware, 
    rateLimiter({ maxRequests: 15, windowMs: 60000 }),
    sendEmailHandler
  );

  // WhatsApp: Autenticado + Rate Limited
  app.post('/api/notifications/whatsapp/check', 
    authMiddleware, 
    rateLimiter({ maxRequests: 3, windowMs: 60000 }),
    whatsappCheckHandler
  );
  app.post('/api/notifications/whatsapp/send', 
    authMiddleware, 
    rateLimiter({ maxRequests: 10, windowMs: 60000 }),
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
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
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
