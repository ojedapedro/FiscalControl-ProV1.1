export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { checkAndSendNotifications } = await import('../../../server/notifications');
    const result = await checkAndSendNotifications();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Error interno al procesar notificaciones', details: err.message, stack: err.stack });
  }
}
