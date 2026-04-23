
import { Payment, PaymentStatus, Category, Store } from '../types';
import { getTaxConfig } from './taxConfigurations';
import { AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { FISCAL_CALENDAR_2026 } from './constants/fiscalCalendar';

export type TrafficLightStatus = 'red' | 'green' | 'amber' | 'slate';

export interface FiscalStatusResult {
  status: TrafficLightStatus;
  label: string;
  colorClass: string;
  textClass: string;
  bgSoftClass: string;
}

export const getFiscalDueDate = (category: Category, itemCode: string, rifEnding: number, date: Date = new Date()) => {
  const monthIdx = date.getMonth(); // 0-11
  
  // Logic for SPE (Sujetos Pasivos Especiales) - IVA and Biweekly Retentions
  // These usually have prefixes starting with 2.1 (IVA) or 7.3-7.6 (Biweekly SENIAT)
  const isBiweekly = itemCode.startsWith('2.1') || 
                     itemCode.startsWith('7.3') || 
                     itemCode.startsWith('7.4') || 
                     itemCode.startsWith('7.5') || 
                     itemCode.startsWith('7.6') ||
                     itemCode.startsWith('2.3'); // IGTF

  if (isBiweekly) {
    const day = date.getDate();
    const table = day <= 15 ? FISCAL_CALENDAR_2026.firstHalf : FISCAL_CALENDAR_2026.secondHalf;
    const rifDates = table[rifEnding as unknown as keyof typeof table];
    const targetDay = rifDates[monthIdx];
    
    if (day <= 15) {
      // For 1-15 period, payment is usually late in the same month
      return new Date(date.getFullYear(), monthIdx, targetDay);
    } else {
      // For 16-EOH, payment is early in NEXT month
      // Note: Table a.2 Jan value is for Dec second half.
      const nextMonthDate = new Date(date.getFullYear(), monthIdx + 1, 1);
      const nextMonthIdx = nextMonthDate.getMonth();
      const nextMonthRifDates = FISCAL_CALENDAR_2026.secondHalf[rifEnding as keyof typeof FISCAL_CALENDAR_2026.secondHalf];
      const nextTargetDay = nextMonthRifDates[nextMonthIdx];
      
      // If we are calculating for 16-31 Jan, we look at table a.2 for FEB.
      return new Date(nextMonthDate.getFullYear(), nextMonthIdx, nextTargetDay || 5);
    }
  }

  // Pensions logic
  if (itemCode.startsWith('7.8')) {
    const rifDates = FISCAL_CALENDAR_2026.pensiones[rifEnding as keyof typeof FISCAL_CALENDAR_2026.pensiones];
    return new Date(date.getFullYear(), monthIdx, rifDates[monthIdx]);
  }

  // Default fallback for items not in Gaceta explicitly or handled by standard deadlines
  return null;
};

export const getTaxStatus = (deadlineDay: number, category?: Category, itemCode?: string, store?: Store) => {
  const today = new Date();
  const currentDay = today.getDate();
  
  let targetDueDate: Date | null = null;
  if (category && itemCode && store && store.rifEnding !== undefined) {
    targetDueDate = getFiscalDueDate(category, itemCode, store.rifEnding, today);
  }

  if (targetDueDate) {
    const diffTime = targetDueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { 
        status: 'Vencido', 
        color: 'bg-red-500', 
        text: 'text-red-600', 
        bgSoft: 'bg-red-100',
        icon: AlertCircle
      };
    } else if (diffDays <= 5) {
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
  }

  // Old logic for static deadlineDay
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
 * 5. Color Predominante: Las categorías sin actividad ya no son grises; ahora se muestran en Verde si no hay obligaciones pendientes, manteniendo la coherencia visual del semáforo.
 */
export const getCategoryTrafficLight = (
  category: Category, 
  storeId: string, 
  payments: Payment[],
  store?: Store
): TrafficLightStatus => {
  if (!storeId) return 'slate';

  const configMap = getTaxConfig(category);
  if (!configMap) return 'green';
  
  let hasRed = false;
  let hasAmber = false;
  let hasMovements = false;
  let allConceptsGreen = true;

  // Iterar por todos los grupos y conceptos definidos en la configuración fiscal
  Object.values(configMap).forEach(groupConfig => {
    groupConfig.items.forEach(item => {
      // Obtener el estado del calendario para este concepto específico considerando RIF
      const calendarStatus = getTaxStatus(groupConfig.deadlineDay, category, item.code, store);
      
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

  // 4. Gris: ELIMINADO según solicitud del usuario.
  // Si no hay movimientos y no hay alertas de calendario, se considera "Verde" (Al día)
  // por defecto, integrándose con la lógica de semáforo predominante.
  return hasMovements ? 'amber' : 'green';
};

/**
 * Obtiene el estado general de salud fiscal de una tienda.
 */
export const getStoreFiscalHealth = (storeId: string, payments: Payment[], store?: Store): TrafficLightStatus => {
  const categories = Object.values(Category);
  let hasRed = false;
  let allGreen = true;
  let hasPayments = false;

  categories.forEach(cat => {
    const status = getCategoryTrafficLight(cat, storeId, payments, store);
    if (status === 'red') hasRed = true;
    if (status !== 'green' && status !== 'slate') allGreen = false;
    if (status !== 'slate') hasPayments = true;
  });

  if (!hasPayments) return 'slate';
  if (hasRed) return 'red';
  if (allGreen) return 'green';
  return 'amber';
};
