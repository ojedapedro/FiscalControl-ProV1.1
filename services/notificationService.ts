
import { api } from './api';
import { Payment, User, Role, PaymentStatus, SystemSettings } from '../types';

export const notificationService = {
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
        await api.sendEmail(user.email, 'Nuevo Pago Registrado - FiscalCtl', message.replace(/\*/g, ''));
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
      await api.sendEmail(creator.email, 'Pago Aprobado - FiscalCtl', message.replace(/\*/g, ''));
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
      await api.sendEmail(creator.email, 'Pago Devuelto - FiscalCtl', message.replace(/\*/g, ''));
    }
  }
};
