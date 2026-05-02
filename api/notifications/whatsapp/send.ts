import twilio from 'twilio';
import { adminDb } from '../../../server/firebaseAdmin';
import { splitMessage } from '../../../src/utils.ts';

// Firebase Admin SDK se importa desde el módulo centralizado
const db = adminDb;

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromWhatsApp = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+16415353606';

// Lazy client initialization for resilience
let clientCache: twilio.Twilio | null = null;
function getTwilioClient(): twilio.Twilio | null {
  if (clientCache) return clientCache;
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token || !sid.startsWith('AC')) return null;
  try {
    clientCache = twilio(sid, token);
    return clientCache;
  } catch {
    return null;
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, message } = req.body;
  if (!to || !message) {
    return res.status(400).json({ error: 'To and message are required' });
  }

  try {
    // 1. Verificar si hay un Gateway URL configurado en el sistema (Admin SDK)
    let gatewayUrl = '';
    if (db) {
      const settingsDoc = await db.collection('settings').doc('global').get();
      if (settingsDoc.exists) {
        gatewayUrl = settingsDoc.data()?.whatsappGatewayUrl || '';
      }
    }

    const cleanTo = to.replace('whatsapp:', '').replace('+', '').trim();
    const messageChunks = splitMessage(message, 1500);
    let lastResult = null;

    // 2. Si hay Gateway URL, intentar usarlo
    if (gatewayUrl && gatewayUrl.includes('[MESSAGE]')) {
      let allOk = true;
      for (const chunk of messageChunks) {
        const finalUrl = gatewayUrl
          .replace('[PHONE]', cleanTo)
          .replace('[MESSAGE]', encodeURIComponent(chunk));
        
        const gatewayRes = await fetch(finalUrl);
        if (!gatewayRes.ok) allOk = false;
      }
      
      if (allOk) {
        return res.json({ success: true, method: 'gateway' });
      }
    }

    // 3. De lo contrario, usar Twilio (si está configurado)
    const client = getTwilioClient();
    if (!client) {
      return res.status(503).json({ error: 'Twilio not configured and no valid Gateway URL' });
    }

    const formatTwilio = (num: string) => {
      const cleanNum = num.trim();
      if (cleanNum.startsWith('whatsapp:')) return cleanNum;
      return `whatsapp:${cleanNum.startsWith('+') ? cleanNum : `+${cleanNum}`}`;
    };

    const fromFormatted = formatTwilio(fromWhatsApp);
    const toFormatted = formatTwilio(to);

    for (const chunk of messageChunks) {
      lastResult = await client.messages.create({
        from: fromFormatted,
        to: toFormatted,
        body: chunk
      });
    }
    
    res.json({ success: true, sid: lastResult?.sid, method: 'twilio' });
  } catch (err: any) {
    console.error('Send WhatsApp Error:', err.message);
    res.status(500).json({ error: 'Failed to send WhatsApp', details: err.message });
  }
}
