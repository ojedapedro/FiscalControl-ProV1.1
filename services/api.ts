
import { Payment } from '../types';

// IMPORTANTE: REEMPLAZA ESTA URL CON LA QUE OBTENGAS AL IMPLEMENTAR EL SCRIPT EN GOOGLE
// Ejemplo: https://script.google.com/macros/s/AKfycbx.../exec
const API_URL = 'https://script.google.com/macros/s/AKfycbz_XXXXXXXXX_PLACEHOLDER_URL/exec';

export const api = {
  // Inicializar estructura de hojas
  setupDatabase: async () => {
    try {
      const response = await fetch(`${API_URL}?action=setup`, { method: 'POST' });
      return await response.json();
    } catch (error) {
      console.error('Error setup DB:', error);
      throw error;
    }
  },

  // Obtener Pagos (Read)
  getPayments: async (): Promise<Payment[]> => {
    try {
      const response = await fetch(`${API_URL}?action=getPayments`);
      const json = await response.json();
      if (json.status === 'error') throw new Error(json.message);
      
      // Asegurar tipos de datos correctos
      return json.data.map((p: any) => ({
        ...p,
        amount: Number(p.amount),
        // Convertir strings de fechas de vuelta si es necesario o manejarlos como string
        history: Array.isArray(p.history) ? p.history : []
      }));
    } catch (error) {
      console.error('Error fetching payments:', error);
      return [];
    }
  },

  // Crear Pago (Create)
  createPayment: async (payment: Payment) => {
    // Simulamos un delay de red si es muy rápido
    const payload = JSON.stringify(payment);
    const response = await fetch(`${API_URL}?action=addPayment`, {
      method: 'POST',
      body: payload
    });
    return await response.json();
  },

  // Actualizar Pago (Update)
  updatePayment: async (payment: Payment) => {
    const payload = JSON.stringify(payment);
    const response = await fetch(`${API_URL}?action=updatePayment`, {
      method: 'POST',
      body: payload
    });
    return await response.json();
  },

  // Borrar Pago (Delete)
  deletePayment: async (id: string) => {
    const response = await fetch(`${API_URL}?action=deletePayment`, {
      method: 'POST',
      body: JSON.stringify({ id })
    });
    return await response.json();
  }
};
