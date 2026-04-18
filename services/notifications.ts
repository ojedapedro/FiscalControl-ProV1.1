import twilio from 'twilio';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { SystemSettings, PaymentStatus } from '../types';

// Initialize Firebase for server-side
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromWhatsApp = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+16415353606';
const adminNumbers = (process.env.ADMIN_WHATSAPP_NUMBERS || '').split(',').filter(n => n.trim());
const presidencyNumber = process.env.PRESIDENCY_WHATSAPP_NUMBER;

let client: twilio.Twilio | null = null;

// Helper to format WhatsApp number
const formatWhatsApp = (num: string) => {
  const cleanNum = num.trim();
  if (cleanNum.startsWith('whatsapp:')) return cleanNum;
  return `whatsapp:${cleanNum.startsWith('+') ? cleanNum : `+${cleanNum}`}`;
};

// Validación básica antes de intentar inicializar para evitar errores de validación del SDK
if (accountSid && authToken && accountSid.startsWith('AC')) {
  try {
    client = twilio(accountSid, authToken);
  } catch (error: any) {
    console.warn('⚠️ Error al inicializar Twilio (verifica tus credenciales):', error.message);
  }
}

export async function checkAndSendNotifications() {
  if (!client) {
    console.warn('⚠️ Twilio no está configurado. Saltando notificaciones.');
    return { success: false, message: 'Twilio not configured' };
  }

  console.log('🔍 [Notifications] Iniciando auditoría de pagos para notificaciones...');
  
  try {
    // 1. Obtener Configuración Global
    const settingsDoc = await getDoc(doc(db, 'settings', 'global'));
    const settings = settingsDoc.exists() ? settingsDoc.data() as SystemSettings : null;
    
    if (settings && !settings.whatsappEnabled) {
      console.log('🔇 [Notifications] WhatsApp está desactivado en la configuración global.');
      return { success: true, message: 'WhatsApp disabled in settings' };
    }

    const warningDays = settings?.daysBeforeWarning || 3;
    const criticalDays = settings?.daysBeforeCritical || 1;

    // 2. Obtener Pagos
    const paymentsRef = collection(db, 'payments');
    const snapshot = await getDocs(paymentsRef);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdueArr: any[] = [];
    const criticalArr: any[] = [];
    const warningArr: any[] = [];

    snapshot.forEach(docSnap => {
      const p = docSnap.data();
      // Solo notificar pagos que no han sido pagados ni rechazados
      if (p.status === PaymentStatus.PAID || p.status === PaymentStatus.REJECTED) return;

      const dueDate = new Date(p.dueDate + 'T00:00:00');
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        overdueArr.push({ ...p, diffDays });
      } else if (diffDays <= criticalDays) {
        criticalArr.push({ ...p, diffDays });
      } else if (diffDays <= warningDays) {
        warningArr.push({ ...p, diffDays });
      }
    });

    if (overdueArr.length === 0 && criticalArr.length === 0 && warningArr.length === 0) {
      console.log('✅ [Notifications] No hay pagos urgentes hoy.');
      return { success: true, message: 'No urgent payments found' };
    }

    // 3. Construir Mensaje de Auditoría y Prioridad
    let message = `📊 *REPORTE DE AUDITORÍA - FORZA 22*\n`;
    message += `Fecha: ${today.toLocaleDateString()}\n`;
    message += `--------------------------------\n\n`;

    if (overdueArr.length > 0) {
      message += `🔴 *PAGOS VENCIDOS (CRÍTICO)*\n`;
      message += `_Atención inmediata requerida_\n`;
      overdueArr.forEach(p => {
        message += `• ${p.storeName}: ${p.specificType}\n  💰 $${p.amount.toLocaleString()} | 🗓️ Hace ${Math.abs(p.diffDays)}d\n`;
      });
      message += `\n`;
    }

    if (criticalArr.length > 0) {
      message += `🚨 *URGENTE (VENCE PRONTO)*\n`;
      criticalArr.forEach(p => {
        const d = p.diffDays === 0 ? 'HOY' : `en ${p.diffDays}d`;
        message += `• ${p.storeName}: ${p.specificType}\n  💰 $${p.amount.toLocaleString()} | ⏰ Vence ${d}\n`;
      });
      message += `\n`;
    }

    if (warningArr.length > 0) {
      message += `🟡 *RECORDATORIO (PREVENTIVO)*\n`;
      warningArr.forEach(p => {
        message += `• ${p.storeName}: ${p.specificType}\n  💰 $${p.amount.toLocaleString()} | 📅 Vence en ${p.diffDays}d\n`;
      });
      message += `\n`;
    }

    message += `--------------------------------\n`;
    message += `💡 _Por favor, verifique y proceda con el pago según la prioridad indicada._`;

    // 4. Preparar Destinatarios
    const recipients = [...adminNumbers];
    if (presidencyNumber) recipients.push(presidencyNumber);

    const uniqueRecipients = [...new Set(recipients)].map(formatWhatsApp);

    console.log(`📧 [Notifications] Enviando reporte a ${uniqueRecipients.length} destinatarios...`);

    const results = await Promise.all(uniqueRecipients.map(async (to) => {
      try {
        await client!.messages.create({
          from: formatWhatsApp(fromWhatsApp),
          to: to,
          body: message
        });
        return { to, success: true };
      } catch (err: any) {
        console.error(`❌ [Notifications] Error enviando a ${to}:`, err.message);
        return { to, success: false, error: err.message };
      }
    }));

    return { success: true, results };
  } catch (error: any) {
    console.error('💥 [Notifications] Error crítico en auditoría:', error);
    return { success: false, error: error.message };
  }
}
