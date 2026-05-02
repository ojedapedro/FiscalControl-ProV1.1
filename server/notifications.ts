import twilio from 'twilio';
import { adminDb } from './firebaseAdmin';
import { SystemSettings, PaymentStatus } from '../types.ts';
import { splitMessage } from '../src/utils.ts';

/**
 * SEGURIDAD: Este módulo ahora usa Firebase Admin SDK en lugar del Web SDK.
 * Ya no depende de reglas de Firestore abiertas (allow read: if true).
 * El Admin SDK tiene acceso completo y bypasea las reglas de seguridad.
 */

const fromWhatsApp = process.env.TWILIO_WHATSAPP_FROM || process.env.TWILIO_WHATSAPP || 'whatsapp:+16415353606';
const adminNumbers = (process.env.ADMIN_WHATSAPP_NUMBERS || process.env.ADMIN_WHATSAPP || '').split(',').filter(n => n.trim());
const presidencyNumber = process.env.PRESIDENCY_WHATSAPP_NUMBER || process.env.PRESIDENCY_WHATSAPP || process.env.PRESIDENCY_WHA;

// Helper to format WhatsApp number
const formatWhatsApp = (num: string) => {
  const cleanNum = num.trim();
  if (cleanNum.startsWith('whatsapp:')) return cleanNum;
  return `whatsapp:${cleanNum.startsWith('+') ? cleanNum : `+${cleanNum}`}`;
};

// Lazy client initialization
let clientCache: twilio.Twilio | null = null;
function getTwilioClient(): twilio.Twilio | null {
  if (clientCache) return clientCache;
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token || !sid.trim().startsWith('AC')) return null;
  try {
    clientCache = twilio(sid.trim(), token.trim());
    return clientCache;
  } catch {
    return null;
  }
}

export async function checkAndSendNotifications() {
  const client = getTwilioClient();
  
  if (!client) {
    return { success: false, message: 'Twilio no configurado.' };
  }

  if (!adminDb) {
    return { success: false, message: 'Firebase Admin no inicializado. Configure GOOGLE_APPLICATION_CREDENTIALS.' };
  }

  console.log('🔍 [Notifications] Iniciando auditoría con Admin SDK...');
  
  try {
    // 1. Obtener Configuración (usando Admin SDK — bypasea reglas de seguridad)
    const settingsDoc = await adminDb.collection('settings').doc('global').get();
    const settings = settingsDoc.exists ? settingsDoc.data() as SystemSettings : null;
    
    if (settings && settings.whatsappEnabled === false) {
      return { success: true, message: 'WhatsApp desactivado.' };
    }

    const warningDays = settings?.daysBeforeWarning || 3;
    const criticalDays = settings?.daysBeforeCritical || 1;
    const gatewayUrl = settings?.whatsappGatewayUrl || '';
    const settingsPhone = settings?.whatsappPhone || '';

    // 2. Obtener Pagos (usando Admin SDK)
    const paymentsSnapshot = await adminDb.collection('payments').get();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdueArr: any[] = [];
    const criticalArr: any[] = [];
    const warningArr: any[] = [];

    paymentsSnapshot.forEach(docSnap => {
      const p = docSnap.data();
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
      return { success: true, message: 'No hay pagos urgentes.' };
    }

    // 3. Construir Mensaje
    let message = `📊 *REPORTE FORZA 22*\n${today.toLocaleDateString()}\n`;
    message += `--------------------------------\n\n`;

    if (overdueArr.length > 0) {
      message += `🔴 *VENCIDOS*\n`;
      overdueArr.forEach(p => {
        message += `• ${p.storeName}: $${p.amount.toLocaleString()} | ${Math.abs(p.diffDays)}d atrasado\n`;
      });
      message += `\n`;
    }

    if (criticalArr.length > 0) {
      message += `🚨 *CRÍTICO*\n`;
      criticalArr.forEach(p => {
        const d = p.diffDays === 0 ? 'HOY' : `${p.diffDays}d`;
        message += `• ${p.storeName}: $${p.amount.toLocaleString()} | Vence ${d}\n`;
      });
      message += `\n`;
    }

    if (warningArr.length > 0) {
      message += `🟡 *PRÓXIMOS*\n`;
      warningArr.forEach(p => {
        message += `• ${p.storeName}: $${p.amount.toLocaleString()} | ${p.diffDays}d\n`;
      });
      message += `\n`;
    }

    message += `--------------------------------\n`;
    message += `💡 _Verifique el panel de control._`;

    // 4. Enviar
    const recipients = [...adminNumbers];
    if (presidencyNumber) recipients.push(presidencyNumber);
    if (settingsPhone) recipients.push(settingsPhone);
    const uniqueRecipients = [...new Set(recipients)].map(formatWhatsApp);

    const fromFormatted = formatWhatsApp(fromWhatsApp);
    console.log(`📧 Enviando desde ${fromFormatted} a ${uniqueRecipients.length} destinatarios...`);

    const results = await Promise.all(uniqueRecipients.map(async (to) => {
      try {
        const messageChunks = splitMessage(message, 1500);
        
        for (const chunk of messageChunks) {
          // Soporte para Gateway Externo (CallMeBot, etc)
          if (gatewayUrl && gatewayUrl.includes('[MESSAGE]')) {
            const cleanPhone = to.replace('whatsapp:', '').replace('+', '');
            const finalUrl = gatewayUrl
              .replace('[PHONE]', cleanPhone)
              .replace('[MESSAGE]', encodeURIComponent(chunk));
            
            await fetch(finalUrl);
          } else {
            // Si no hay gateway URL, usar Twilio (Default)
            await client!.messages.create({
              from: fromFormatted,
              to: to,
              body: chunk
            });
          }
        }
        
        return { to, success: true, method: gatewayUrl ? 'gateway' : 'twilio' };
      } catch (err: any) {
        let errorHint = '';
        if (err.message.includes('Channel')) {
          errorHint = ' | TIP: El número emisor (' + fromFormatted + ') no está habilitado para WhatsApp en Twilio. Si usas Sandbox, el emisor debe ser whatsapp:+14155238886';
        }
        console.error(`❌ Error en ${to}:`, err.message);
        return { to, success: false, error: err.message + errorHint };
      }
    }));

    const successful = results.filter(r => r.success).length;
    return { success: successful > 0, total: uniqueRecipients.length, successful, results };
  } catch (error: any) {
    console.error('💥 Error en auditoría:', error);
    return { success: false, message: error.message };
  }
}
