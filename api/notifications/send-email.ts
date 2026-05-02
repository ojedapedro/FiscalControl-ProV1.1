import { Resend } from 'resend';

// SEGURIDAD: Escapar HTML para prevenir inyección en correos electrónicos
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { to, subject, body } = req.body;
    
    if (!to || !subject || !body) {
      return res.status(400).json({ error: 'Faltan campos requeridos: to, subject, body.' });
    }

    const key = process.env.RESEND_API_KEY;
    console.log('🔍 [send-email-v2] Verificando RESEND_API_KEY:', key ? 'Presente' : 'AUSENTE');
    
    if (!key) {
      console.warn('⚠️ RESEND_API_KEY no configurada. Simulando envío de correo (Modo Demo).');
      console.log(`[SIMULACIÓN EMAIL] Para: ${to}, Asunto: ${subject}`);
      return res.status(200).json({ 
        success: true, 
        message: 'Envío simulado correctamente (Modo Demo)',
        isDemo: true 
      });
    }
    
    const resendClient = new Resend(key);
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    const targetEmail = process.env.RESEND_TEST_TO_EMAIL || to;

    // SEGURIDAD: Sanitizar subject y body antes de insertar en HTML
    const safeSubject = escapeHtml(subject);
    const safeBody = escapeHtml(body);

    const { data, error } = await resendClient.emails.send({
      from: `Forza 22 <${fromEmail}>`,
      to: [targetEmail],
      subject: subject,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333; line-height: 1.6;">
          <div style="max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
            <div style="background-color: #0ea5e9; padding: 20px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 24px;">Forza 22</h1>
            </div>
            <div style="padding: 30px;">
              <h2 style="color: #0ea5e9; margin-top: 0;">${safeSubject}</h2>
              <div style="white-space: pre-wrap; font-size: 16px;">${safeBody}</div>
              <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; text-align: center;">
                Este es un correo automático, por favor no responda a este mensaje.
                <br>© ${new Date().getFullYear()} Forza 22
              </div>
            </div>
          </div>
        </div>
      `,
    });

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    res.status(200).json({ success: true, data });
  } catch (err: any) {
    console.error('💥 Error en send-email:', err);
    res.status(500).json({ 
      error: 'Error interno del servidor de correo.',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {})
    });
  }
}
