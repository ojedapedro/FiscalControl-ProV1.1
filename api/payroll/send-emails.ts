export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { Resend } = await import('resend');
    const React = await import('react');
    const { render } = await import('@react-email/render');
    const { PayrollEmailTemplate } = await import('../../components/PayrollEmailTemplate');

    const { entries } = req.body;
    
    if (!entries || !Array.isArray(entries)) {
      return res.status(400).json({ error: 'Se requiere una lista de entradas de nómina.' });
    }

    const key = process.env.RESEND_API_KEY;
    if (!key) {
      return res.status(500).json({ error: 'Resend no está configurado en el servidor.' });
    }
    const resendClient = new Resend(key);

    const results = [];

    for (const entry of entries) {
      try {
        if (!entry.employeeEmail) {
          results.push({ id: entry.id, success: false, error: 'Correo no proporcionado' });
          continue;
        }

        const html = await render(
          React.createElement(PayrollEmailTemplate, {
            employeeName: entry.employeeName,
            month: entry.month,
            baseSalary: entry.baseSalary,
            totalWorkerNet: entry.totalWorkerNet,
            bonuses: entry.bonuses || [],
            deductions: entry.deductions || []
          })
        );

        const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
        const targetEmail = process.env.RESEND_TEST_TO_EMAIL || entry.employeeEmail;

        const { data, error } = await resendClient.emails.send({
          from: `Nómina FiscalControl <${fromEmail}>`,
          to: [targetEmail],
          subject: `Recibo de Pago - ${entry.month} - ${entry.employeeName}`,
          html: html,
        });

        if (error) {
          results.push({ id: entry.id, success: false, error: error.message });
        } else {
          results.push({ id: entry.id, success: true, messageId: data?.id });
        }
      } catch (err: any) {
        results.push({ id: entry.id, success: false, error: err.message });
      }
    }

    res.json({ success: true, results });
  } catch (err: any) {
    res.status(500).json({ error: 'Error fatal en el servidor', details: err.message, stack: err.stack });
  }
}
