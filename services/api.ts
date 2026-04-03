
import { SystemSettings, User } from '../types';

// IMPORTANTE: REEMPLAZA ESTA URL CON LA QUE OBTENGAS AL IMPLEMENTAR EL SCRIPT EN GOOGLE
// Ejemplo: https://script.google.com/macros/s/AKfycbx.../exec
const API_URL = 'https://script.google.com/macros/s/AKfycbyxVkNV8XIqvDgTOY5kj5FQsHCR6BWkHHnxaQ78rMW5kPm_EWoOc3iusVxiG3Dyfp9e/exec';

// Detectar si estamos usando la URL de ejemplo o una inválida para activar el modo offline
const isMockMode = () => API_URL.includes('PLACEHOLDER') || !API_URL.startsWith('https://script.google.com');

export const api = {
  // Forzar chequeo de notificaciones (Test Manual)
  triggerNotificationCheck: async () => {
     if (isMockMode()) {
       return { status: 'success', message: 'Chequeo de notificaciones simulado' };
     }
     const response = await fetch(`${API_URL}?action=checkNotifications`, { method: 'POST' });
     return await response.json();
  },

  // --- NOTIFICACIONES ---
  
  sendWhatsApp: async (to: string, message: string) => {
    if (isMockMode()) {
      console.log(`[MOCK WHATSAPP] To: ${to}, Msg: ${message}`);
      return { status: 'success', message: 'WhatsApp simulado enviado' };
    }
    try {
      const response = await fetch(`${API_URL}?action=sendWhatsApp`, {
        method: 'POST',
        body: JSON.stringify({ to, message })
      });
      return await response.json();
    } catch (e) {
      console.error("Error sending WhatsApp", e);
      return { status: 'error', message: 'Error de conexión' };
    }
  },

  sendEmail: async (to: string, subject: string, body: string) => {
    if (isMockMode()) {
      console.log(`[MOCK EMAIL] To: ${to}, Subject: ${subject}`);
      return { status: 'success', message: 'Email simulado enviado' };
    }
    try {
      const response = await fetch(`${API_URL}?action=sendEmail`, {
        method: 'POST',
        body: JSON.stringify({ to, subject, body })
      });
      return await response.json();
    } catch (e) {
      console.error("Error sending Email", e);
      return { status: 'error', message: 'Error de conexión' };
    }
  },

  sendPayrollEmail: async (entry: any, email: string) => {
    try {
      const response = await fetch('/api/payroll/send-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          entries: [{
            ...entry,
            employeeEmail: email
          }] 
        })
      });
      return await response.json();
    } catch (e) {
      console.error("Error sending payroll email", e);
      return { status: 'error', message: 'Error de conexión' };
    }
  }
};
