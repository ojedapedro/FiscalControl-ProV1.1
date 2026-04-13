
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
 * Reglas actualizadas:
 * 1. El semáforo es activado por el concepto de pago (desglose).
 * 2. Si hay Rojo, Naranja y Verde -> Prevalece el Rojo.
 * 3. Si hay Naranja y Verde -> Prevalece el Naranja (por vencerse o enviado al auditor).
 * 4. Si TODOS los conceptos están en Verde -> Verde (única condición para verde).
 * 5. Gris -> Únicamente si no hay movimientos Y no hay obligaciones vencidas/próximas.
 */
export const getCategoryTrafficLight = (
  category: Category, 
  storeId: string, 
  payments: Payment[]
): TrafficLightStatus => {
  if (!storeId) return 'slate';

  const configMap = getTaxConfig(category);
  if (!configMap) return 'slate';
  
  let hasRed = false;
  let hasAmber = false;
  let hasMovements = false;
  let allConceptsGreen = true;

  // Iterar por todos los grupos y conceptos definidos en la configuración fiscal
  Object.values(configMap).forEach(groupConfig => {
    // Obtener el estado del calendario para este grupo
    const calendarStatus = getTaxStatus(groupConfig.deadlineDay);
    
    groupConfig.items.forEach(item => {
      // Buscar movimientos (pagos) para este concepto específico
      const itemPayments = payments.filter(p => 
        p.storeId === storeId && 
        p.category === category && 
        p.specificType.startsWith(item.code)
      );

      if (itemPayments.length > 0) {
        hasMovements = true;
        
        const itemHasRed = itemPayments.some(p => 
          p.status === PaymentStatus.REJECTED || 
          p.status === PaymentStatus.OVERDUE
        );
        
        const itemHasAmber = itemPayments.some(p => 
          p.status === PaymentStatus.PENDING || 
          p.status === PaymentStatus.UPLOADED
        );
        
        const itemHasGreen = itemPayments.some(p => 
          p.status === PaymentStatus.APPROVED || 
          p.status === PaymentStatus.PAID
        );

        if (itemHasRed) {
          hasRed = true;
          allConceptsGreen = false;
        } else if (itemHasAmber) {
          hasAmber = true;
          allConceptsGreen = false;
        } else if (!itemHasGreen) {
          // Si tiene pagos pero ninguno es verde (ej. todos en otros estados)
          allConceptsGreen = false;
        }
      } else {
        // Si NO hay movimientos para este concepto, revisamos el calendario
        if (calendarStatus.status === 'Vencido') {
          hasRed = true;
          allConceptsGreen = false;
        } else if (calendarStatus.status === 'Próximo') {
          hasAmber = true;
          allConceptsGreen = false;
        } else {
          // Está "En fecha" pero no se ha pagado aún
          allConceptsGreen = false;
        }
      }
    });
  });

  // 1. Rojo prevalece sobre todo
  if (hasRed) return 'red';

  // 2. Naranja prevalece sobre verde (o si hay conceptos pendientes de pago)
  if (hasAmber) return 'amber';

  // 3. Verde: Única condición es que TODOS los conceptos estén pagados/aprobados
  if (allConceptsGreen) return 'green';

  // 4. Gris: Solo si no hay movimientos Y no hay alertas de calendario
  // Si llegamos aquí y no hay movimientos, es gris. 
  // Si hay movimientos pero no es verde ni rojo ni naranja (caso raro), lo dejamos en naranja por precaución.
  return hasMovements ? 'amber' : 'slate';
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
