import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromWhatsApp = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+16415353606';

let client: twilio.Twilio | null = null;
if (accountSid && authToken && accountSid.startsWith('AC')) {
  client = twilio(accountSid, authToken);
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!client) {
    return res.status(503).json({ error: 'Twilio not configured on server' });
  }

  const { to, message } = req.body;

  if (!to || !message) {
    return res.status(400).json({ error: 'To and message are required' });
  }

  // Format number
  const formatWhatsApp = (num: string) => {
    const cleanNum = num.trim();
    if (cleanNum.startsWith('whatsapp:')) return cleanNum;
    return `whatsapp:${cleanNum.startsWith('+') ? cleanNum : `+${cleanNum}`}`;
  };

  try {
    const result = await client.messages.create({
      from: formatWhatsApp(fromWhatsApp),
      to: formatWhatsApp(to),
      body: message
    });
    res.json({ success: true, sid: result.sid });
  } catch (err: any) {
    console.error('Twilio Error:', err.message);
    res.status(500).json({ error: 'Failed to send WhatsApp', details: err.message });
  }
}
