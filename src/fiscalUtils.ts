
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
 * Reglas:
 * 1. Si hay al menos un pago en Rojo -> Rojo.
 * 2. Si no hay Rojos, pero hay al menos un pago en Naranja -> Naranja.
 * 3. Solo si todos los pagos son Verdes -> Verde.
 * 4. Si no hay pagos -> Gris (Slate).
 */
/**
 * Determina el estado del semáforo para una categoría fiscal específica en una tienda.
 * Reglas:
 * 1. Si hay al menos un concepto en Rojo -> Rojo.
 * 2. Si no hay Rojos, pero hay al menos un concepto en Naranja -> Naranja.
 * 3. Solo si todos los conceptos son Verdes -> Verde.
 * 4. Si no hay conceptos -> Gris (Slate).
 */
export const getCategoryTrafficLight = (
  category: Category, 
  storeId: string, 
  payments: Payment[]
): TrafficLightStatus => {
  if (!storeId) return 'slate';

  const configMap = getTaxConfig(category);
  if (!configMap) return 'slate';

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  let hasRed = false;
  let hasAmber = false;
  let allGreen = true;
  let hasItems = false;

  Object.values(configMap).forEach(groupConfig => {
    groupConfig.items.forEach(item => {
      hasItems = true;
      
      // Buscar pagos para este concepto específico
      const itemPayments = payments.filter(p => 
        p.storeId === storeId && 
        p.category === category && 
        p.specificType.startsWith(item.code)
      );

      let itemStatus: TrafficLightStatus = 'slate';

      if (itemPayments.length > 0) {
        // Evaluar basado en pagos existentes
        const hasRejectedOrOverdue = itemPayments.some(p => p.status === PaymentStatus.REJECTED || p.status === PaymentStatus.OVERDUE);
        const hasPendingOrUploaded = itemPayments.some(p => p.status === PaymentStatus.PENDING || p.status === PaymentStatus.UPLOADED);
        const hasApprovedOrPaid = itemPayments.some(p => p.status === PaymentStatus.APPROVED || p.status === PaymentStatus.PAID);
        
        if (hasRejectedOrOverdue) itemStatus = 'red';
        else if (hasPendingOrUploaded) itemStatus = 'amber';
        else if (hasApprovedOrPaid) itemStatus = 'green';
      } else {
        // Evaluar basado en fecha límite si no hay pagos
        const dateStatus = getTaxStatus(groupConfig.deadlineDay);
        if (dateStatus.status === 'Vencido') itemStatus = 'red';
        else if (dateStatus.status === 'Próximo') itemStatus = 'amber';
        else itemStatus = 'slate'; // Cambiado de 'green' a 'slate'
      }

      // Agregar a la lógica de prioridad
      if (itemStatus === 'red') {
        hasRed = true;
        allGreen = false;
      } else if (itemStatus === 'amber') {
        hasAmber = true;
        allGreen = false;
      } else if (itemStatus === 'slate') {
        allGreen = false;
      }
    });
  });

  if (!hasItems) return 'slate';
  if (hasRed) return 'red';
  if (hasAmber) return 'amber';
  if (allGreen) return 'green';
  
  return 'slate';
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
