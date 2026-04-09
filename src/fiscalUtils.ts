
import { Payment, PaymentStatus, Category } from '../types';
import { getTaxConfig } from './taxConfigurations';
import { AlertCircle, Clock, CheckCircle2 } from 'lucide-react';

export type TrafficLightStatus = 'red' | 'green' | 'amber' | 'slate';

export interface FiscalStatusResult {
  status: TrafficLightStatus;
  label: string;
  colorClass: string;
  textClass: string;
  bgSoftClass: string;
}

export const getTaxStatus = (deadlineDay: number) => {
  const today = new Date();
  const currentDay = today.getDate();
  
  if (currentDay > deadlineDay) {
    return { 
      status: 'Vencido', 
      color: 'bg-red-500', 
      text: 'text-red-600', 
      bgSoft: 'bg-red-100',
      icon: AlertCircle
    };
  } else if (deadlineDay - currentDay <= 5) {
    return { 
      status: 'Próximo', 
      color: 'bg-amber-500', 
      text: 'text-amber-600', 
      bgSoft: 'bg-amber-100',
      icon: Clock
    };
  } else {
    return { 
      status: 'En fecha', 
      color: 'bg-emerald-500', 
      text: 'text-emerald-600', 
      bgSoft: 'bg-emerald-100',
      icon: CheckCircle2
    };
  }
};

/**
 * Determina el estado del semáforo para una categoría fiscal específica en una tienda.
 */
export const getCategoryTrafficLight = (
  category: Category, 
  storeId: string, 
  payments: Payment[]
): TrafficLightStatus => {
  if (!storeId) return 'slate';

  const config = getTaxConfig(category);
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  if (!config) {
    // Para categorías sin configuración específica, evaluamos los pagos directos
    const categoryPayments = payments.filter(p => 
      p.storeId === storeId && 
      p.category === category &&
      new Date(p.dueDate).getMonth() === currentMonth &&
      new Date(p.dueDate).getFullYear() === currentYear
    );

    if (categoryPayments.length === 0) return 'slate';
    
    const hasRed = categoryPayments.some(p => p.status === PaymentStatus.REJECTED || p.status === PaymentStatus.OVERDUE);
    if (hasRed) return 'red';
    
    const allApproved = categoryPayments.every(p => p.status === PaymentStatus.APPROVED || p.status === PaymentStatus.PAID);
    return allApproved ? 'green' : 'amber';
  }

  let hasRed = false;
  let allGreen = true;

  Object.values(config).forEach(groupConfig => {
    const baseStatus = getTaxStatus(groupConfig.deadlineDay);

    groupConfig.items.forEach(item => {
      const itemPayments = payments.filter(p => {
        const pDate = new Date(p.dueDate);
        return p.storeId === storeId && 
               p.category === category && 
               p.specificType.startsWith(item.code) &&
               pDate.getMonth() === currentMonth &&
               pDate.getFullYear() === currentYear;
      });

      const hasApprovedOrPaid = itemPayments.some(p => 
        p.status === PaymentStatus.APPROVED || 
        p.status === PaymentStatus.PAID
      );
      
      const hasPendingOrUploaded = itemPayments.some(p => 
        p.status === PaymentStatus.PENDING || 
        p.status === PaymentStatus.UPLOADED
      );

      const hasRejected = itemPayments.some(p => p.status === PaymentStatus.REJECTED);
      const hasOverdue = itemPayments.some(p => p.status === PaymentStatus.OVERDUE);

      if (hasRejected || hasOverdue) {
        hasRed = true;
        allGreen = false;
      } else if (hasPendingOrUploaded) {
        allGreen = false;
      } else if (!hasApprovedOrPaid) {
        if (baseStatus.status === 'Vencido') {
          hasRed = true;
          allGreen = false;
        } else if (baseStatus.status === 'Próximo') {
          allGreen = false;
        }
      }
    });
  });

  if (hasRed) return 'red';
  if (allGreen) return 'green';
  return 'amber'; // Represents Orange/Pending
};

/**
 * Obtiene el estado general de salud fiscal de una tienda.
 */
export const getStoreFiscalHealth = (storeId: string, payments: Payment[]): TrafficLightStatus => {
  const categories = Object.values(Category);
  let hasRed = false;
  let allGreen = true;
  let hasPayments = false;

  categories.forEach(cat => {
    const status = getCategoryTrafficLight(cat, storeId, payments);
    if (status === 'red') hasRed = true;
    if (status !== 'green' && status !== 'slate') allGreen = false;
    if (status !== 'slate') hasPayments = true;
  });

  if (!hasPayments) return 'slate';
  if (hasRed) return 'red';
  if (allGreen) return 'green';
  return 'amber';
};
