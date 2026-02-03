
import { Category, Payment, PaymentStatus, Store, AlertItem } from './types';

export const STORES: Store[] = [
  { id: 'S101', name: 'Tienda 101 - Principal', location: 'Caracas, DC', status: 'En Regla', nextDeadline: '2023-11-15', matrixId: 'HQ-01' },
  { id: 'S145', name: 'Tienda 145', location: 'Maracaibo, ZU', status: 'En Riesgo', nextDeadline: '2023-11-01', matrixId: 'HQ-01' },
  { id: 'S203', name: 'Tienda 203', location: 'Valencia, CA', status: 'En Regla', nextDeadline: '2023-11-20', matrixId: 'HQ-01' },
  { id: 'S089', name: 'Tienda 089', location: 'Barquisimeto, LA', status: 'Vencido', nextDeadline: '2023-10-30', matrixId: 'HQ-01' },
  { id: 'S112', name: 'Tienda 112', location: 'Lechería, AN', status: 'En Regla', nextDeadline: '2023-12-05', matrixId: 'HQ-01' },
];

export const INITIAL_PAYMENTS: Payment[] = [
  {
    id: 'PAG-8832',
    storeId: 'S101',
    storeName: 'Tienda 101 - Principal',
    userId: 'U-001',
    category: Category.MUNICIPAL_TAX,
    specificType: 'Impuesto Municipal T3',
    amount: 1250.00,
    dueDate: '2023-11-15',
    paymentDate: '2023-10-24',
    status: PaymentStatus.PENDING,
    submittedDate: '2023-10-24T10:00:00',
    notes: 'Por favor revisar pronto, fecha límite acercándose.'
  },
  {
    id: 'PAG-8833',
    storeId: 'S145',
    storeName: 'Tienda 145',
    userId: 'U-002',
    category: Category.UTILITY,
    specificType: 'Factura Electricidad',
    amount: 345.50,
    dueDate: '2023-10-20',
    status: PaymentStatus.OVERDUE,
    submittedDate: '2023-10-15T09:30:00',
  },
  {
    id: 'PAG-8834',
    storeId: 'S203',
    storeName: 'Tienda 203',
    userId: 'U-001',
    category: Category.NATIONAL_TAX,
    specificType: 'Impuesto Nacional (IVA)',
    amount: 4200.00,
    dueDate: '2023-10-25',
    paymentDate: '2023-10-22',
    status: PaymentStatus.PENDING,
    submittedDate: '2023-10-22T14:15:00',
  },
  {
    id: 'PAG-8835',
    storeId: 'S089',
    storeName: 'Tienda 089',
    userId: 'U-003',
    category: Category.UTILITY,
    specificType: 'Servicio Internet',
    amount: 120.00,
    dueDate: '2023-10-28',
    paymentDate: '2023-10-20',
    status: PaymentStatus.APPROVED,
    submittedDate: '2023-10-20T11:00:00',
  },
  {
    id: 'PAG-8836',
    storeId: 'S112',
    storeName: 'Tienda 112',
    userId: 'U-001',
    category: Category.UTILITY,
    specificType: 'Servicio de Agua',
    amount: 85.20,
    dueDate: '2023-10-29',
    paymentDate: '2023-10-23',
    status: PaymentStatus.UPLOADED,
    submittedDate: '2023-10-23T16:45:00',
  }
];

export const REPORT_DATA = [
  { name: 'Ene', value: 4000, secondaryValue: 2400 },
  { name: 'Feb', value: 3000, secondaryValue: 1398 },
  { name: 'Mar', value: 2000, secondaryValue: 9800 },
  { name: 'Abr', value: 2780, secondaryValue: 3908 },
  { name: 'May', value: 1890, secondaryValue: 4800 },
  { name: 'Jun', value: 2390, secondaryValue: 3800 },
  { name: 'Jul', value: 3490, secondaryValue: 4300 },
];

export const MOCK_ALERTS: AlertItem[] = [
  {
    id: 'AL-001',
    storeName: 'TIENDA A',
    category: 'MUNICIPAL',
    title: 'Impuesto Municipal - T3',
    amount: 4250.00,
    severity: 'critical',
    timeLabel: 'Vencido hace 2 días',
    dueDate: '2023-10-25'
  },
  {
    id: 'AL-002',
    storeName: 'TIENDA C',
    category: 'ESTATAL',
    title: 'Impuesto Estatal Ventas',
    amount: 1200.50,
    severity: 'critical',
    timeLabel: 'Vencido hace 1 día',
    dueDate: '2023-10-26'
  },
  {
    id: 'AL-003',
    storeName: 'TIENDA B',
    category: 'SERVICIOS',
    title: 'Factura Electricidad - Tienda B',
    amount: 850.00,
    severity: 'upcoming',
    timeLabel: 'Vence en 5h',
    dueDate: '2023-10-28'
  },
  {
    id: 'AL-004',
    storeName: 'ALMACÉN 1',
    category: 'INVENTARIO',
    title: 'Reposición de Inventario',
    amount: 12400.00,
    severity: 'upcoming',
    timeLabel: 'Vence mañana',
    dueDate: '2023-10-29'
  },
  {
    id: 'AL-005',
    storeName: 'TIENDA A',
    category: 'ALQUILER',
    title: 'Pago de Arrendamiento',
    amount: 3500.00,
    severity: 'scheduled',
    timeLabel: '28 Nov',
    dueDate: '2023-11-28'
  }
];
