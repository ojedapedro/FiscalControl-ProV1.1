
import { Payment, SystemSettings, User, BudgetEntry } from '../types';
import { INITIAL_PAYMENTS } from '../constants';

// IMPORTANTE: REEMPLAZA ESTA URL CON LA QUE OBTENGAS AL IMPLEMENTAR EL SCRIPT EN GOOGLE
// Ejemplo: https://script.google.com/macros/s/AKfycbx.../exec
const API_URL = 'https://script.google.com/macros/s/AKfycbzns2LHhoqtlSzHXtfCi588SG4R-MqCOo4imEuwCJF7Ojb5XwWK4kQW9WCBZDyfIURWew/exec';

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

  // Obtener Usuarios (API o Mock)
  getUsers: async (): Promise<User[]> => {
    if (isMockMode()) return []; 
    try {
      const response = await fetch(`${API_URL}?action=getUsers`);
      const json = await response.json();
      if (json.status === 'error') return [];
      
      // Validar datos para evitar crashes en UI
      // Aseguramos que 'name' nunca sea undefined, ni null, ni vacío
      return json.data.map((u: any) => ({
        ...u,
        name: (u.name && typeof u.name === 'string') ? u.name : 'Sin Nombre'
      }));
    } catch (e) {
      console.error("Error fetching users", e);
      return [];
    }
  },

  // Crear Usuario
  createUser: async (user: User) => {
    if (isMockMode()) {
       await new Promise(resolve => setTimeout(resolve, 800));
       return { status: 'success', message: 'Usuario simulado creado' };
    }
    const response = await fetch(`${API_URL}?action=addUser`, {
      method: 'POST',
      body: JSON.stringify(user)
    });
    return await response.json();
  },

  // Actualizar Usuario
  updateUser: async (user: User) => {
    if (isMockMode()) {
       await new Promise(resolve => setTimeout(resolve, 800));
       return { status: 'success', message: 'Usuario simulado actualizado' };
    }
    const response = await fetch(`${API_URL}?action=updateUser`, {
      method: 'POST',
      body: JSON.stringify(user)
    });
    return await response.json();
  },

  // Borrar Usuario
  deleteUser: async (id: string) => {
    if (isMockMode()) {
       await new Promise(resolve => setTimeout(resolve, 800));
       return { status: 'success', message: 'Usuario simulado eliminado' };
    }
    const response = await fetch(`${API_URL}?action=deleteUser`, {
      method: 'POST',
      body: JSON.stringify({ id })
    });
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
  },

  // --- EMPLEADOS (NÓMINA) ---
  
  // Obtener Empleados
  getEmployees: async (): Promise<any[]> => {
    if (isMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return []; // Return empty mock data for now
    }
    try {
      const response = await fetch(`${API_URL}?action=getEmployees`);
      const json = await response.json();
      if (json.status === 'error') return [];
      
      return (json.data || []).map((e: any) => ({
        ...e,
        age: Number(e.age || 0),
        baseSalary: Number(e.baseSalary || 0),
        isActive: e.isActive === true || e.isActive === 'true' || e.isActive === 'TRUE',
        defaultBonuses: Array.isArray(e.defaultBonuses) ? e.defaultBonuses : (typeof e.defaultBonuses === 'string' ? JSON.parse(e.defaultBonuses) : []),
        defaultDeductions: Array.isArray(e.defaultDeductions) ? e.defaultDeductions : (typeof e.defaultDeductions === 'string' ? JSON.parse(e.defaultDeductions) : []),
        defaultEmployerLiabilities: Array.isArray(e.defaultEmployerLiabilities) ? e.defaultEmployerLiabilities : (typeof e.defaultEmployerLiabilities === 'string' ? JSON.parse(e.defaultEmployerLiabilities) : []),
        ppeAssignments: Array.isArray(e.ppeAssignments) ? e.ppeAssignments : (typeof e.ppeAssignments === 'string' ? JSON.parse(e.ppeAssignments) : [])
      }));
    } catch (e) {
      console.error("Error fetching employees", e);
      return [];
    }
  },

  // Crear Empleado
  createEmployee: async (employee: any) => {
    if (isMockMode()) {
       await new Promise(resolve => setTimeout(resolve, 800));
       return { status: 'success', message: 'Empleado simulado creado' };
    }
    const response = await fetch(`${API_URL}?action=addEmployee`, {
      method: 'POST',
      body: JSON.stringify(employee)
    });
    return await response.json();
  },

  // Actualizar Empleado
  updateEmployee: async (employee: any) => {
    if (isMockMode()) {
       await new Promise(resolve => setTimeout(resolve, 800));
       return { status: 'success', message: 'Empleado simulado actualizado' };
    }
    const response = await fetch(`${API_URL}?action=updateEmployee`, {
      method: 'POST',
      body: JSON.stringify(employee)
    });
    return await response.json();
  },

  // Borrar Empleado
  deleteEmployee: async (id: string) => {
    if (isMockMode()) {
       await new Promise(resolve => setTimeout(resolve, 800));
       return { status: 'success', message: 'Empleado simulado eliminado' };
    }
    const response = await fetch(`${API_URL}?action=deleteEmployee`, {
      method: 'POST',
      body: JSON.stringify({ id })
    });
    return await response.json();
  },

  // --- HISTÓRICO DE NÓMINA ---
  
  // Obtener Nóminas
  getPayrollEntries: async (): Promise<any[]> => {
    if (isMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return [];
    }
    try {
      const response = await fetch(`${API_URL}?action=getPayrollEntries`);
      const json = await response.json();
      if (json.status === 'error') return [];
      
      return (json.data || []).map((entry: any) => ({
        ...entry,
        baseSalary: Number(entry.baseSalary || 0),
        totalWorkerNet: Number(entry.totalWorkerNet || 0),
        totalEmployerCost: Number(entry.totalEmployerCost || 0),
        bonuses: Array.isArray(entry.bonuses) ? entry.bonuses : (typeof entry.bonuses === 'string' ? JSON.parse(entry.bonuses) : []),
        deductions: Array.isArray(entry.deductions) ? entry.deductions : (typeof entry.deductions === 'string' ? JSON.parse(entry.deductions) : []),
        employerLiabilities: Array.isArray(entry.employerLiabilities) ? entry.employerLiabilities : (typeof entry.employerLiabilities === 'string' ? JSON.parse(entry.employerLiabilities) : [])
      }));
    } catch (e) {
      console.error("Error fetching payroll entries", e);
      return [];
    }
  },

  // Crear Nómina
  createPayrollEntry: async (entry: any) => {
    if (isMockMode()) {
       await new Promise(resolve => setTimeout(resolve, 800));
       return { status: 'success', message: 'Nómina simulada creada' };
    }
    const response = await fetch(`${API_URL}?action=addPayrollEntry`, {
      method: 'POST',
      body: JSON.stringify(entry)
    });
    return await response.json();
  },

  // Actualizar Nómina
  updatePayrollEntry: async (entry: any) => {
    if (isMockMode()) {
       await new Promise(resolve => setTimeout(resolve, 800));
       return { status: 'success', message: 'Nómina simulada actualizada' };
    }
    const response = await fetch(`${API_URL}?action=updatePayrollEntry`, {
      method: 'POST',
      body: JSON.stringify(entry)
    });
    return await response.json();
  },

  // Borrar Nómina
  deletePayrollEntry: async (id: string) => {
    if (isMockMode()) {
       await new Promise(resolve => setTimeout(resolve, 800));
       return { status: 'success', message: 'Nómina simulada eliminada' };
    }
    const response = await fetch(`${API_URL}?action=deletePayrollEntry`, {
      method: 'POST',
      body: JSON.stringify({ id })
    });
    return await response.json();
  },

  // --- PRESUPUESTO ---
  
  getBudgets: async (): Promise<BudgetEntry[]> => {
    if (isMockMode()) {
      const saved = localStorage.getItem('fiscal_budgets');
      return saved ? JSON.parse(saved) : [];
    }
    try {
      const response = await fetch(`${API_URL}?action=getBudgets`);
      const json = await response.json();
      if (json.status === 'error') return [];
      return (json.data || []).map((b: any) => ({
        ...b,
        amount: Number(b.amount)
      }));
    } catch (e) {
      console.error("Error fetching budgets", e);
      return [];
    }
  },

  createBudget: async (budget: BudgetEntry) => {
    if (isMockMode()) {
      const saved = localStorage.getItem('fiscal_budgets');
      const budgets = saved ? JSON.parse(saved) : [];
      const newBudgets = [...budgets, budget];
      localStorage.setItem('fiscal_budgets', JSON.stringify(newBudgets));
      return { status: 'success', message: 'Presupuesto simulado guardado' };
    }
    const response = await fetch(`${API_URL}?action=addBudget`, {
      method: 'POST',
      body: JSON.stringify(budget)
    });
    return await response.json();
  },

  deleteBudget: async (id: string) => {
    if (isMockMode()) {
      const saved = localStorage.getItem('fiscal_budgets');
      const budgets = saved ? JSON.parse(saved) : [];
      const newBudgets = budgets.filter((b: any) => b.id !== id);
      localStorage.setItem('fiscal_budgets', JSON.stringify(newBudgets));
      return { status: 'success', message: 'Presupuesto simulado eliminado' };
    }
    const response = await fetch(`${API_URL}?action=deleteBudget`, {
      method: 'POST',
      body: JSON.stringify({ id })
    });
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

  // --- SYNC (Google Drive Server) ---
  getAuthStatus: async () => {
    try {
      const response = await fetch('/api/auth/status');
      return await response.json();
    } catch (e) {
      return { authenticated: false };
    }
  },
  pushSync: async (data: any) => {
    const response = await fetch('/api/sync/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data })
    });
    return await response.json();
  },
  pullSync: async () => {
    const response = await fetch('/api/sync/pull');
    return await response.json();
  }
};
