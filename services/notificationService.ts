
import { api } from './api';
import { Payment, User, Role, PaymentStatus, SystemSettings, PayrollEntry, Employee } from '../types';

export const notificationService = {
  /**
   * Notifica el recibo de pago de nómina al empleado
   */
  notifyPayrollReceipt: async (entry: PayrollEntry, employee: Employee, settings: SystemSettings | null) => {
    if (!settings?.emailEnabled && !settings?.whatsappEnabled) return;

    if (settings.emailEnabled && employee.email) {
      // Usar la API de Resend a través de nuestro backend
      await api.sendPayrollEmail(entry, employee.email);
    }

    if (settings.whatsappEnabled && employee.directPhone) {
      const message = `📄 *Recibo de Pago de Nómina*\n\n` +
        `Hola ${employee.name},\n` +
        `Tu pago del mes de ${entry.month} ha sido procesado.\n\n` +
        `Monto Neto: $${entry.totalWorkerNet.toLocaleString()}\n` +
        `Equivalente: Bs. ${(entry.totalWorkerNet * (settings.exchangeRate || 1)).toLocaleString()}\n\n` +
        `El recibo detallado ha sido enviado a tu correo electrónico.`;
      await api.sendWhatsApp(employee.directPhone, message);
    }
  },

  /**
   * Notifica cuando se crea un nuevo pago
   */
  notifyNewPayment: async (payment: Payment, users: User[], settings: SystemSettings | null) => {
    if (!settings?.whatsappEnabled && !settings?.emailEnabled) return;

    // Personas involucradas: Auditores y Admins de la misma tienda
    const recipients = users.filter(u => 
      (u.role === Role.AUDITOR || u.role === Role.ADMIN || u.role === Role.SUPER_ADMIN) && 
      (u.storeId === payment.storeId || u.role === Role.SUPER_ADMIN)
    );

    const message = `📢 *Nuevo Pago Registrado*\n\n` +
      `Tienda: ${payment.storeName}\n` +
      `Concepto: ${payment.specificType}\n` +
      `Monto: $${payment.amount.toLocaleString()}\n` +
      `Vence: ${payment.dueDate}\n\n` +
      `Por favor, ingrese al sistema para auditar.`;

    for (const user of recipients) {
      if (settings.whatsappEnabled && user.phone) {
        await api.sendWhatsApp(user.phone, message);
      }
      if (settings.emailEnabled && user.email) {
        await api.sendEmail(user.email, 'Nuevo Pago Registrado - Forza 22', message.replace(/\*/g, ''));
      }
    }
  },

  /**
   * Notifica cuando un pago es aprobado
   */
  notifyPaymentApproved: async (payment: Payment, users: User[], settings: SystemSettings | null) => {
    if (!settings?.whatsappEnabled && !settings?.emailEnabled) return;

    // Persona involucrada: El creador del pago
    const creator = users.find(u => u.id === payment.userId);
    if (!creator) return;

    const message = `✅ *Pago Aprobado*\n\n` +
      `Su pago para *${payment.storeName}* (${payment.specificType}) por un monto de $${payment.amount.toLocaleString()} ha sido aprobado por auditoría.\n\n` +
      `Fecha Vencimiento: ${payment.dueDate}`;

    if (settings.whatsappEnabled && creator.phone) {
      await api.sendWhatsApp(creator.phone, message);
    }
    if (settings.emailEnabled && creator.email) {
      await api.sendEmail(creator.email, 'Pago Aprobado - Forza 22', message.replace(/\*/g, ''));
    }
  },

  /**
   * Notifica cuando un pago es rechazado/devuelto
   */
  notifyPaymentRejected: async (payment: Payment, reason: string, users: User[], settings: SystemSettings | null) => {
    if (!settings?.whatsappEnabled && !settings?.emailEnabled) return;

    // Persona involucrada: El creador del pago
    const creator = users.find(u => u.id === payment.userId);
    if (!creator) return;

    const message = `❌ *Pago Devuelto para Corrección*\n\n` +
      `Su pago para *${payment.storeName}* (${payment.specificType}) ha sido devuelto.\n\n` +
      `*Motivo:* ${reason}\n\n` +
      `Por favor, corrija los datos y vuelva a enviar.`;

    if (settings.whatsappEnabled && creator.phone) {
      await api.sendWhatsApp(creator.phone, message);
    }
    if (settings.emailEnabled && creator.email) {
      await api.sendEmail(creator.email, 'Pago Devuelto - Forza 22', message.replace(/\*/g, ''));
    }
  },

  /**
   * Notifica un recordatorio de pago próximo a vencer o vencido
   */
  notifyPaymentReminder: async (payment: Payment, users: User[], settings: SystemSettings | null) => {
    if (!settings?.whatsappEnabled && !settings?.emailEnabled) return;

    // Personas involucradas: El creador del pago y los auditores de la tienda
    const recipients = users.filter(u => 
      (u.id === payment.userId) || 
      ((u.role === Role.AUDITOR || u.role === Role.ADMIN || u.role === Role.SUPER_ADMIN) && 
       (u.storeId === payment.storeId || u.role === Role.SUPER_ADMIN))
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(payment.dueDate + 'T00:00:00');
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let statusText = '';
    if (diffDays < 0) {
      statusText = `⚠️ *VENCIDO* hace ${Math.abs(diffDays)} día(s)`;
    } else if (diffDays === 0) {
      statusText = `🚨 *VENCE HOY*`;
    } else {
      statusText = `📅 Vence en ${diffDays} día(s)`;
    }

    const message = `🔔 *RECORDATORIO DE PAGO*\n\n` +
      `Tienda: ${payment.storeName}\n` +
      `Concepto: ${payment.specificType}\n` +
      `Monto: $${payment.amount.toLocaleString()}\n` +
      `Estado: ${statusText}\n\n` +
      `Por favor, asegúrese de procesar este pago a la brevedad.`;

    for (const user of recipients) {
      if (settings.whatsappEnabled && user.phone) {
        await api.sendWhatsApp(user.phone, message);
      }
      if (settings.emailEnabled && user.email) {
        await api.sendEmail(user.email, 'Recordatorio de Pago - Forza 22', message.replace(/\*/g, ''));
      }
    }
  }
};
