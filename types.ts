
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
  UPLOADED = 'Cargado',
  PAID = 'Pagado'
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

export enum PaymentFrequency {
  NONE = 'Único',
  ANNUAL = 'Anual',
  SEMIANNUAL = 'Semestral',
  QUADRIMESTER = 'Cuatrimestral',
  TRIMESTRAL = 'Trimestral',
  MONTHLY = 'Mensual',
  BIWEEKLY = 'Quincenal',
  WEEKLY = 'Semanal',
  DAILY = 'Diario'
}

// Interfaz para el registro de auditoría
export interface AuditLog {
  date: string;
  action: 'CREACION' | 'APROBACION' | 'RECHAZO' | 'ACTUALIZACION' | 'CORRECCION' | 'APROBACION_MASIVA';
  actorName: string;
  role: Role;
  note?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  avatar?: string;
  password?: string; // Solo para simulación local
  storeId?: string; // Para Administradores y Auditores asignados a una tienda
  allowedCategories?: Category[];
  allowedTaxGroups?: string[];
  allowedTaxItems?: string[];
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
  daysToExpire?: number;
  status: PaymentStatus;
  receiptUrl?: string;
  receiptUrl2?: string;
  notes?: string;
  rejectionReason?: string;
  submittedDate: string;
  
  // Campo de Historial Extendido
  history?: AuditLog[]; 
  
  // Campos para Control de Presupuesto
  originalBudget?: number;
  isOverBudget?: boolean;
  frequency?: PaymentFrequency;

  // Campos del Soporte
  documentDate?: string;
  documentAmount?: number;
  documentName?: string;

  // Campos de Propuesta Financiera
  proposedAmount?: number;
  proposedPaymentDate?: string;
  proposedDueDate?: string;
  proposedDaysToExpire?: number;
  proposedStatus?: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  proposedJustification?: string;

  // Checklist de Auditoría
  checklist?: {
    receiptValid: boolean;
    stampLegible: boolean;
    storeConceptMatch: boolean;
    datesApproved: boolean;
    proposedDatesApproved: boolean;
    amountsApproved: boolean;
    proposedAmountApproved: boolean;
    observationsApproved: boolean;
  };
}

export interface ChartData {
  name: string;
  value: number;
  secondaryValue?: number;
}

export type AlertSeverity = 'critical' | 'scheduled';

export interface AlertItem {
  id: string;
  paymentId: string;
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
  pushEnabled?: boolean;
  notifyPending?: boolean;
  notifyOverdue?: boolean;
  refreshInterval?: number;
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

export interface PPEItemData {
  name: string;
  talla: string;
  cantidad: number;
  precio: number;
  frecuencia: string;
}

export interface PPEAssignment {
  id: string;
  date: string;
  items: PPEItemData[];
  totalCost: number;
}

export interface Employee {
  id: string; // Cédula/ID
  code: string; // CODIGO
  nationality: string; // NACIONALIDAD
  name: string; // NOMBRES
  lastName: string; // APELLIDOS
  age: number; // EDAD
  educationLevel: string; // GRADO DE INSTRUCCIÓN
  position: string; // CARGO
  department: string; // DEPARTAMENTO
  positionDescription: string; // DESCRIPCION DEL CARGO
  hireDate: string; // FECHA DE INGRESO
  socialBenefitsDate?: string; // FECHA DE PRESTACIONES SOCIALES AL DIA
  projectedExitDate?: string; // FECHA DE EGRESO PROYECTADA
  email: string; // CORREO ELECTRONICO
  projectAddress?: string; // DIRECCION DEL PROYECTO
  directPhone: string; // TELEFONO DIRECTO
  emergencyPhone: string; // TELEFONO DE EMERGENCIA
  homeAddress: string; // DIRECCION HABITACION
  gender: string; // SEXO
  wearsGlasses: string; // USA LENTES
  hasCondition: string; // PERSONA CON CONDICION
  height: string; // ESTATURA
  
  storeId: string; // Tienda asignada
  baseSalary: number;
  isActive: boolean;
  bankAccount?: string;
  defaultBonuses: { name: string; amount: number }[];
  defaultDeductions: { name: string; amount: number }[];
  defaultEmployerLiabilities: { name: string; amount: number }[];
  ppeAssignments?: PPEAssignment[];
}

export interface BudgetEntry {
  id: string;
  storeId: string; // Tienda asociada
  date: string; // YYYY-MM-DD
  title: string;
  amount: number;
  category: Category;
  notes?: string;
}
