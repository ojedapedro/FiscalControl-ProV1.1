/**
 * @deprecated Este archivo es redundante. Todas las rutas API están definidas en server.ts.
 * Este módulo será eliminado en una futura versión. No importar ni utilizar.
 * Punto de entrada real: server.ts
 */
import express from 'express';
import Stripe from 'stripe';
import { Resend } from 'resend';
import React from 'react';
import { render } from '@react-email/render';
import { PayrollEmailTemplate } from '../components/PayrollEmailTemplate';
import { checkAndSendNotifications } from '../server/notifications';

const app = express();
app.use(express.json({ limit: '50mb' }));

// Health check route
app.get('/api/ping', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(), 
    env: { 
      hasResendKey: !!process.env.RESEND_API_KEY,
      nodeEnv: process.env.NODE_ENV
    } 
  });
});

// Stripe Initialization
let stripe: Stripe | null = null;
const getStripe = () => {
  if (!stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) return null;
    stripe = new Stripe(key);
  }
  return stripe;
};

// Resend Initialization
let resend: Resend | null = null;
const getResend = () => {
  if (!resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) return null;
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
      amount: Math.round(amount * 100),
      currency,
      metadata: { paymentId },
      automatic_payment_methods: { enabled: true },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk Email Route for Payroll
app.post('/api/payroll/send-emails', async (req, res) => {
  try {
    const { entries } = req.body;
    
    if (!entries || !Array.isArray(entries)) {
      return res.status(400).json({ error: 'Se requiere una lista de entradas de nómina.' });
    }

    const resendClient = getResend();
    if (!resendClient) {
      return res.status(500).json({ error: 'Resend no está configurado en el servidor.' });
    }

    const results = [];

    for (const entry of entries) {
      try {
        if (!entry.employeeEmail) {
          results.push({ id: entry.id, success: false, error: 'Correo no proporcionado' });
          continue;
        }

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

        const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
        const targetEmail = process.env.RESEND_TEST_TO_EMAIL || entry.employeeEmail;

        const { data, error } = await resendClient.emails.send({
          from: `Nómina FiscalControl <${fromEmail}>`,
          to: [targetEmail],
          subject: `Recibo de Pago - ${entry.month} - ${entry.employeeName}`,
          html: html,
        });

        if (error) {
          results.push({ id: entry.id, success: false, error: error.message });
        } else {
          results.push({ id: entry.id, success: true, messageId: data?.id });
        }
      } catch (err: any) {
        results.push({ id: entry.id, success: false, error: err.message });
      }
    }

    res.json({ success: true, results });
  } catch (err: any) {
    res.status(500).json({ error: 'Error fatal en el servidor', details: err.message });
  }
});

// Twilio WhatsApp Notification Route
app.post('/api/notifications/whatsapp/check', async (req, res) => {
  try {
    const result = await checkAndSendNotifications();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Error interno al procesar notificaciones', details: err.message });
  }
});

export default app;
