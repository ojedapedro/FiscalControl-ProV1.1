
export enum Role {
  SUPER_ADMIN = 'Super Usuario',
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

// Interfaz para el registro de auditoría
export interface AuditLog {
  date: string;
  action: 'CREACION' | 'APROBACION' | 'RECHAZO' | 'ACTUALIZACION';
  actorName: string;
  role: Role;
  note?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  password?: string; // Solo para simulación local
}

export interface Store {
  id: string;
  name: string;
  location: string;
  status: 'En Regla' | 'En Riesgo' | 'Vencido';
  nextDeadline: string;
  matrixId: string;
}

export interface Payment {
  id: string;
  storeId: string;
  storeName: string;
  userId: string;
  category: Category;
  specificType: string;
  amount: number;
  dueDate: string;
  paymentDate?: string;
  status: PaymentStatus;
  receiptUrl?: string;
  notes?: string;
  rejectionReason?: string;
  submittedDate: string;
  
  // Campo de Historial Extendido
  history?: AuditLog[]; 
  
  // Campos para Control de Presupuesto
  originalBudget?: number;
  isOverBudget?: boolean;
  justification?: string;
  justificationFileUrl?: string;
}

export interface ChartData {
  name: string;
  value: number;
  secondaryValue?: number;
}

export type AlertSeverity = 'critical' | 'upcoming' | 'scheduled';

export interface AlertItem {
  id: string;
  storeName: string;
  category: string;
  title: string;
  amount: number;
  severity: AlertSeverity;
  timeLabel: string;
  dueDate: string;
}

export interface SystemSettings {
  whatsappEnabled: boolean;
  whatsappPhone: string;
  whatsappGatewayUrl: string;
  daysBeforeWarning: number;
  daysBeforeCritical: number;
  emailEnabled: boolean;
}
