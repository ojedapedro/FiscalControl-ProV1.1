
import { Payment, SystemSettings } from '../types';
import { INITIAL_PAYMENTS } from '../constants';

// IMPORTANTE: REEMPLAZA ESTA URL CON LA QUE OBTENGAS AL IMPLEMENTAR EL SCRIPT EN GOOGLE
// Ejemplo: https://script.google.com/macros/s/AKfycbx.../exec
const API_URL = 'https://script.google.com/macros/s/AKfycbzO6FJxLFCZha_c2tEzrX25P6hJ4qwm-_us0bZamnP15pSCwUsr8Z1YeCz_uKQODEQpZw/exec';

// Detectar si estamos usando la URL de ejemplo o una inválida para activar el modo offline
const isMockMode = () => API_URL.includes('PLACEHOLDER') || !API_URL.startsWith('https://script.google.com');

export const api = {
  // Inicializar estructura de hojas
  setupDatabase: async () => {
    if (isMockMode()) {
       console.warn('API: Modo Mock - Simulando Setup DB');
       return { message: 'Base de datos simulada inicializada (Modo Demo)' };
    }
    try {
      const response = await fetch(`${API_URL}?action=setup`, { method: 'POST' });
      return await response.json();
    } catch (error) {
      console.error('Error setup DB:', error);
      throw error;
    }
  },

  // Obtener Configuración
  getSettings: async (): Promise<SystemSettings | null> => {
    if (isMockMode()) return null;
    try {
      const response = await fetch(`${API_URL}?action=getSettings`);
      const json = await response.json();
      return json.data;
    } catch (e) {
      console.error(e);
      return null;
    }
  },

  // Guardar Configuración
  saveSettings: async (settings: SystemSettings) => {
    if (isMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { status: 'success', message: 'Configuración guardada (Mock)' };
    }
    const response = await fetch(`${API_URL}?action=saveSettings`, {
      method: 'POST',
      body: JSON.stringify(settings)
    });
    return await response.json();
  },

  // Forzar chequeo de notificaciones (Test Manual)
  triggerNotificationCheck: async () => {
     if (isMockMode()) {
       return { status: 'success', message: 'Chequeo de notificaciones simulado' };
     }
     const response = await fetch(`${API_URL}?action=checkNotifications`, { method: 'POST' });
     return await response.json();
  },

  // Obtener Pagos (Read)
  getPayments: async (): Promise<Payment[]> => {
    // Si no hay URL configurada, devolvemos datos de prueba para que la app no crashee
    if (isMockMode()) {
      console.warn('API: Modo Mock - Retornando datos de prueba. Configura la API_URL en services/api.ts para conectar con Google Sheets.');
      // Simulamos un pequeño delay de red
      await new Promise(resolve => setTimeout(resolve, 800));
      return INITIAL_PAYMENTS;
    }

    try {
      const response = await fetch(`${API_URL}?action=getPayments`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const json = await response.json();
      if (json.status === 'error') throw new Error(json.message);
      
      // Asegurar tipos de datos correctos
      return json.data.map((p: any) => ({
        ...p,
        amount: Number(p.amount),
        // Manejo robusto del historial (puede venir como string JSON o array)
        history: Array.isArray(p.history) ? p.history : (typeof p.history === 'string' ? JSON.parse(p.history) : [])
      }));
    } catch (error) {
      console.error('Error fetching payments:', error);
      // Fallback a datos locales si falla la conexión real para mantener la app usable
      return INITIAL_PAYMENTS;
    }
  },

  // Crear Pago (Create)
  createPayment: async (payment: Payment) => {
    if (isMockMode()) {
       await new Promise(resolve => setTimeout(resolve, 800));
       return { status: 'success', message: 'Pago simulado creado' };
    }

    const payload = JSON.stringify(payment);
    const response = await fetch(`${API_URL}?action=addPayment`, {
      method: 'POST',
      body: payload
    });
    return await response.json();
  },

  // Actualizar Pago (Update)
  updatePayment: async (payment: Payment) => {
    if (isMockMode()) {
       await new Promise(resolve => setTimeout(resolve, 800));
       return { status: 'success', message: 'Pago simulado actualizado' };
    }

    const payload = JSON.stringify(payment);
    const response = await fetch(`${API_URL}?action=updatePayment`, {
      method: 'POST',
      body: payload
    });
    return await response.json();
  },

  // Borrar Pago (Delete)
  deletePayment: async (id: string) => {
    if (isMockMode()) {
       await new Promise(resolve => setTimeout(resolve, 800));
       return { status: 'success', message: 'Pago simulado eliminado' };
    }

    const response = await fetch(`${API_URL}?action=deletePayment`, {
      method: 'POST',
      body: JSON.stringify({ id })
    });
    return await response.json();
  }
};
