import express from 'express';
import { createServer as createViteServer } from 'vite';

console.log('🚀 [Server] server.tsx cargado');
console.log('🚀 [Server] NODE_ENV:', process.env.NODE_ENV);
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { checkAndSendNotifications } from './server/notifications';

// Import API handlers
import pingHandler from './api/ping.ts';
import createPaymentIntentHandler from './api/create-payment-intent.ts';
import sendEmailsHandler from './api/payroll/send-emails.ts';
import whatsappCheckHandler from './api/notifications/whatsapp/check.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  console.log('🚀 [Server] Iniciando servidor Express...');
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(cookieParser());
  app.use(session({
    secret: process.env.SESSION_SECRET || 'fiscal-control-secret',
    resave: false,
    saveUninitialized: true,
    cookie: { 
      secure: true, 
      sameSite: 'none',
      httpOnly: true 
    }
  }));

  // Mount API routes
  app.all('/api/ping', pingHandler);
  app.all('/api/create-payment-intent', createPaymentIntentHandler);
  app.all('/api/payroll/send-emails', sendEmailsHandler);
  app.all('/api/notifications/whatsapp/check', whatsappCheckHandler);

  // Global Error Handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('💥 Unhandled Server Error:', err);
    res.status(500).json({ 
      error: 'Error interno del servidor', 
      details: err.message
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
