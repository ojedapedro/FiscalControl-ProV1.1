import express from 'express';
import { createServer as createViteServer } from 'vite';

console.log('🚀 [Server] server.tsx cargado');
console.log('🚀 [Server] NODE_ENV:', process.env.NODE_ENV);
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import Stripe from 'stripe';
import { Resend } from 'resend';
import React from 'react';
import { render } from '@react-email/render';
import { PayrollEmailTemplate } from './components/PayrollEmailTemplate';
import { checkAndSendNotifications } from './services/notifications';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  console.log('🚀 [Server] Iniciando servidor Express...');
  const app = express();
  const PORT = 3000;

  // Health check route - moved to the VERY TOP
  app.get('/api/ping', (req, res) => {
    console.log('🔍 [Server] PING recibido');
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      env: {
        hasResendKey: !!process.env.RESEND_API_KEY,
        nodeEnv: process.env.NODE_ENV
      }
    });
  });

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

  // Stripe Initialization
  let stripe: Stripe | null = null;
  const getStripe = () => {
    if (!stripe) {
      const key = process.env.STRIPE_SECRET_KEY;
      if (!key) {
        console.warn('STRIPE_SECRET_KEY no está configurada. Los pagos no funcionarán.');
        return null;
      }
      stripe = new Stripe(key);
    }
    return stripe;
  };

  // Resend Initialization
  let resend: Resend | null = null;
  const getResend = () => {
    if (!resend) {
      const key = process.env.RESEND_API_KEY;
      if (!key) {
        console.warn('⚠️ RESEND_API_KEY no está configurada en el entorno.');
        return null;
      }
      console.log('✅ Resend inicializado con API Key (longitud: ' + key.length + ')');
      resend = new Resend(key);
    }
    return resend;
  };

  // Stripe Payment Intent Route
  app.post('/api/create-payment-intent', async (req, res) => {
    const { amount, currency = 'usd', paymentId } = req.body;

    const stripeClient = getStripe();
    if (!stripeClient) {
      return res.status(500).json({ error: 'Stripe no está configurado en el servidor.' });
    }

    try {
      const paymentIntent = await stripeClient.paymentIntents.create({
        amount: Math.round(amount * 100), // Stripe expects amount in cents
        currency,
        metadata: { paymentId },
        automatic_payment_methods: { enabled: true },
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error('Error creating payment intent:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Bulk Email Route for Payroll
  app.post('/api/payroll/send-emails', async (req, res, next) => {
    console.log('📧 [Server] Petición recibida en /api/payroll/send-emails');
    try {
      const { entries } = req.body;

      if (!entries || !Array.isArray(entries)) {
        console.warn('⚠️ [Server] Petición inválida: entries no es un array.');
        return res.status(400).json({ error: 'Se requiere una lista de entradas de nómina.' });
      }

      const resendClient = getResend();
      if (!resendClient) {
        console.error('❌ [Server] Resend no configurado.');
        return res.status(500).json({ error: 'Resend no está configurado en el servidor. Verifica la variable RESEND_API_KEY en Settings.' });
      }

      console.log(`📧 [Server] Procesando ${entries.length} correos secuencialmente...`);
      const results = [];

      for (const entry of entries) {
        try {
          if (!entry.employeeEmail) {
            console.warn(`   [Email] ⚠️ Saltando ${entry.employeeName}: Correo no proporcionado`);
            results.push({ id: entry.id, success: false, error: 'Correo no proporcionado' });
            continue;
          }

          console.log(`   [Email] Generando HTML para: ${entry.employeeName}`);
          const html = await render(
            <PayrollEmailTemplate
              employeeName={entry.employeeName}
              month={entry.month}
              baseSalary={entry.baseSalary}
              totalWorkerNet={entry.totalWorkerNet}
              bonuses={entry.bonuses || []}
              deductions={entry.deductions || []}
            />
          );

          console.log(`   [Email] Enviando vía Resend a: ${entry.employeeEmail}`);
          const { data, error } = await resendClient.emails.send({
            from: 'Nómina FiscalControl <onboarding@resend.dev>',
            to: [entry.employeeEmail],
            subject: `Recibo de Pago - ${entry.month} - ${entry.employeeName}`,
            html: html,
          });

          if (error) {
            console.error(`   [Email] ❌ Error de Resend (${entry.employeeEmail}):`, error);
            results.push({ id: entry.id, success: false, error: error.message });
          } else {
            console.log(`   [Email] ✅ Enviado con éxito a: ${entry.employeeName}`);
            results.push({ id: entry.id, success: true, messageId: data?.id });
          }
        } catch (err: any) {
          console.error(`   [Email] 💥 Error crítico (${entry.employeeName}):`, err);
          results.push({ id: entry.id, success: false, error: err.message || 'Error interno al procesar correo' });
        }
      }

      console.log(`📧 [Server] Finalizado: ${results.filter(r => r.success).length} éxitos, ${results.filter(r => !r.success).length} fallos.`);
      res.json({ success: true, results });
    } catch (err: any) {
      console.error('[Server] 💥 Error fatal en la ruta de correos:', err);
      res.status(500).json({ error: 'Error fatal en el servidor', details: err.message });
    }
  });

  // Twilio WhatsApp Notification Route
  app.post('/api/notifications/whatsapp/check', async (req, res) => {
    console.log('📱 [Server] Petición recibida en /api/notifications/whatsapp/check');
    try {
      const result = await checkAndSendNotifications();
      res.json(result);
    } catch (err: any) {
      console.error('[Server] 💥 Error en la ruta de notificaciones:', err);
      res.status(500).json({ error: 'Error interno al procesar notificaciones', details: err.message });
    }
  });

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
