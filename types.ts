
export enum Role {
  ADMIN = 'Administrador',
  AUDITOR = 'Auditor',
  PRESIDENT = 'Presidencia'
}

export enum PaymentStatus {
  PENDING = 'Pendiente',
  APPROVED = 'Aprobado',
  REJECTED = 'Rechazado',
  OVERDUE = 'Vencido',
  UPLOADED = 'Cargado'
}

export enum Category {
  NATIONAL_TAX = 'Impuesto Nacional',
  MUNICIPAL_TAX = 'Impuesto Municipal',
  UTILITY = 'Servicio Público',
  INVENTORY = 'Inventario',
  OTHER = 'Otro'
}

// Representación del Esquema de Base de Datos
export interface User {
  id: string;
  username: string;
  role: Role;
  email: string;
}

export interface Store {
  id: string;
  name: string;
  location: string;
  status: 'En Regla' | 'En Riesgo' | 'Vencido';
  nextDeadline: string;
  matrixId: string; // Enlace relacional a Casa Matriz
}

export interface Payment {
  id: string;
  storeId: string; // Clave foránea a Tienda
  storeName: string; // Desnormalizado para conveniencia de UI
  userId: string; // Clave foránea a Usuario (Cargador)
  category: Category;
  specificType: string;
  amount: number;
  dueDate: string;
  paymentDate?: string; // Fecha en que se realizó el pago realmente
  status: PaymentStatus;
  receiptUrl?: string; // Ruta al archivo almacenado
  notes?: string; // Notas del cargador
  rejectionReason?: string; // Notas del auditor
  submittedDate: string;
}

export interface ChartData {
  name: string;
  value: number;
  secondaryValue?: number;
}

// Nuevos tipos para Notificaciones
export type AlertSeverity = 'critical' | 'upcoming' | 'scheduled';

export interface AlertItem {
  id: string;
  storeName: string;
  category: string;
  title: string;
  amount: number;
  severity: AlertSeverity;
  timeLabel: string; // e.g., "Overdue 2 days", "Due in 5h"
  dueDate: string;
}
