
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
  OBJECT = 'Objeto',
  INSTITUTIONS = 'Instituciones Nacionales y Regionales',
  TRANSPORT = 'Transporte',
  SENIAT_DECLARATIONS = 'SENIAT Declaraciones y Contabilidad',
  SENIAT_BOOKS = 'SENIAT Libros',
  SYSTEMS = 'Sistemas, Marketing y Oficinas',
  UTILITY = 'Servicio Público',
  INVENTORY = 'Inventario',
  PAYROLL = 'Nómina y Pasivos Laborales',
  OTHER = 'Otro'
}

// Interfaz para el registro de auditoría
export interface AuditLog {
  date: string;
  action: 'CREACION' | 'APROBACION' | 'RECHAZO' | 'ACTUALIZACION' | 'CORRECCION';
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
  address?: string;
  municipality?: string;
  status: 'En Regla' | 'En Riesgo' | 'Vencido';
  nextDeadline: string;
  matrixId: string;
  lat?: number;
  lng?: number;
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

  // Campos del Soporte
  documentDate?: string;
  documentAmount?: number;
  documentName?: string;
}

export interface ChartData {
  name: string;
  value: number;
  secondaryValue?: number;
}

export type AlertSeverity = 'critical' | 'scheduled';

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
  exchangeRate: number;
}

export interface PayrollLiability {
  name: string;
  amount: number;
  type: 'WORKER' | 'EMPLOYER';
}

export interface PayrollEntry {
  id: string;
  employeeName: string;
  employeeId: string;
  storeId: string; // Tienda asociada
  month: string;
  baseSalary: number;
  bonuses: { name: string; amount: number }[];
  deductions: { name: string; amount: number }[];
  employerLiabilities: { name: string; amount: number }[];
  totalWorkerNet: number;
  totalEmployerCost: number;
  status: 'PENDIENTE' | 'PROCESADO';
  submittedDate: string;
}

export interface Employee {
  id: string; // Cédula/ID
  name: string;
  position: string;
  department: string;
  storeId: string; // Tienda asignada
  hireDate: string;
  baseSalary: number;
  isActive: boolean;
  bankAccount?: string;
  defaultBonuses: { name: string; amount: number }[];
  defaultDeductions: { name: string; amount: number }[];
  defaultEmployerLiabilities: { name: string; amount: number }[];
}
