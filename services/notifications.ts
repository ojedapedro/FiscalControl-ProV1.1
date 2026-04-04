import twilio from 'twilio';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase for server-side
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromWhatsApp = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';
const adminNumbers = (process.env.ADMIN_WHATSAPP_NUMBERS || '').split(',').filter(n => n.trim());
const presidencyNumber = process.env.PRESIDENCY_WHATSAPP_NUMBER;

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export async function checkAndSendNotifications() {
  if (!client) {
    console.warn('⚠️ Twilio no está configurado. Saltando notificaciones.');
    return { success: false, message: 'Twilio not configured' };
  }

  console.log('🔍 [Notifications] Iniciando escaneo de pagos para notificaciones...');
  
  try {
    const paymentsRef = collection(db, 'payments');
    const snapshot = await getDocs(paymentsRef);
    const now = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(now.getDate() + 3);

    const overduePayments: any[] = [];
    const upcomingPayments: any[] = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.status === 'PAID' || data.status === 'REJECTED') return;

      const dueDate = new Date(data.dueDate);
      
      // Overdue
      if (dueDate < now) {
        overduePayments.push({ id: doc.id, ...data });
      } 
      // Upcoming (exactly 3 days before or within 3 days)
      else if (dueDate <= threeDaysFromNow) {
        upcomingPayments.push({ id: doc.id, ...data });
      }
    });

    if (overduePayments.length === 0 && upcomingPayments.length === 0) {
      console.log('✅ [Notifications] No hay pagos que requieran notificación hoy.');
      return { success: true, message: 'No notifications needed' };
    }

    let message = '*🔔 Notificación de FiscalControl Pro*\n\n';

    if (overduePayments.length > 0) {
      message += '*⚠️ PAGOS VENCIDOS:*\n';
      overduePayments.forEach(p => {
        message += `- ${p.storeName}: ${p.specificType} ($${p.amount}) - Venció: ${p.dueDate}\n`;
      });
      message += '\n';
    }

    if (upcomingPayments.length > 0) {
      message += '*⏳ PAGOS POR VENCER (3 días):*\n';
      upcomingPayments.forEach(p => {
        message += `- ${p.storeName}: ${p.specificType} ($${p.amount}) - Vence: ${p.dueDate}\n`;
      });
    }

    const recipients = [...adminNumbers];
    if (presidencyNumber) recipients.push(presidencyNumber);

    const uniqueRecipients = [...new Set(recipients)];

    console.log(`📧 [Notifications] Enviando a ${uniqueRecipients.length} destinatarios...`);

    const results = await Promise.all(uniqueRecipients.map(async (to) => {
      try {
        await client.messages.create({
          from: fromWhatsApp,
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
    console.error('💥 [Notifications] Error crítico:', error);
    return { success: false, error: error.message };
  }
}
