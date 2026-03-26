import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import Stripe from 'stripe';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(cookieParser());
  app.use(session({
    secret: process.env.SESSION_SECRET || 'fiscal-control-secret',
    resave: false,
    saveUninitialized: true,
    cookie: { 
      secure: true, 
      sameSite: 'none',
      httpOnly: true 
    }
  }));

  const getOAuth2Client = () => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      throw new Error('Faltan las credenciales de Google (GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET) en las variables de entorno.');
    }
    return new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.APP_URL}/auth/google/callback`
    );
  };

  const SPREADSHEET_ID = '1EaYm-kbgFciU2ZFIJk5B8rLb9y07hZEDbGKIiElLbd8';

  // Stripe Initialization
  let stripe: Stripe | null = null;
  const getStripe = () => {
    if (!stripe) {
      const key = process.env.STRIPE_SECRET_KEY;
      if (!key) {
        console.warn('STRIPE_SECRET_KEY no está configurada. Los pagos no funcionarán.');
        return null;
      }
      stripe = new Stripe(key);
    }
    return stripe;
  };

  // Stripe Payment Intent Route
  app.post('/api/create-payment-intent', async (req, res) => {
    const { amount, currency = 'usd', paymentId } = req.body;
    
    const stripeClient = getStripe();
    if (!stripeClient) {
      return res.status(500).json({ error: 'Stripe no está configurado en el servidor.' });
    }

    try {
      const paymentIntent = await stripeClient.paymentIntents.create({
        amount: Math.round(amount * 100), // Stripe expects amount in cents
        currency,
        metadata: { paymentId },
        automatic_payment_methods: { enabled: true },
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error('Error creating payment intent:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Auth Routes
  app.get('/api/auth/google/url', (req, res) => {
    try {
      const oauth2Client = getOAuth2Client();
      const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: [
          'https://www.googleapis.com/auth/spreadsheets',
          'https://www.googleapis.com/auth/drive.file'
        ],
        prompt: 'consent'
      });
      res.json({ url });
    } catch (error: any) {
      console.error('Error generating auth URL:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/auth/google/callback', async (req, res) => {
    const { code } = req.query;
    try {
      const oauth2Client = getOAuth2Client();
      const { tokens } = await oauth2Client.getToken(code as string);
      // Store tokens in session or database
      // For this demo, we'll use session
      (req.session as any).tokens = tokens;
      
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Autenticación exitosa. Esta ventana se cerrará automáticamente.</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('Error in Google callback:', error);
      res.status(500).send('Error en la autenticación');
    }
  });

  app.get('/api/auth/status', (req, res) => {
    res.json({ isAuthenticated: !!(req.session as any).tokens });
  });

  app.post('/api/sync/push', async (req, res) => {
    const tokens = (req.session as any).tokens;
    if (!tokens) return res.status(401).json({ error: 'No autenticado' });

    try {
      const oauth2Client = getOAuth2Client();
      oauth2Client.setCredentials(tokens);
      const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

      const { data } = req.body; // Expecting { payments: [], budgets: [], employees: [], ... }
      // 1. Store the entire state as a JSON string in 'App_Data!A1'
      // First, ensure 'App_Data' sheet exists
      const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
      const sheetNames = spreadsheet.data.sheets?.map(s => s.properties?.title) || [];
      
      if (!sheetNames.includes('App_Data')) {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: SPREADSHEET_ID,
          requestBody: {
            requests: [{ addSheet: { properties: { title: 'App_Data' } } }]
          }
        });
      }

      const jsonState = JSON.stringify(data);
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: 'App_Data!A1',
        valueInputOption: 'RAW',
        requestBody: {
          values: [[jsonState]]
        }
      });

      // 2. Update 'Expediente' sheet with structured employee data
      if (data.employees && Array.isArray(data.employees)) {
        if (!sheetNames.includes('Expediente')) {
          await sheets.spreadsheets.batchUpdate({
            spreadsheetId: SPREADSHEET_ID,
            requestBody: {
              requests: [{ addSheet: { properties: { title: 'Expediente' } } }]
            }
          });
        }

        const headers = [
          'ID', 'CODIGO', 'NACIONALIDAD', 'NOMBRES', 'APELLIDOS', 'EDAD', 
          'GRADO DE INSTRUCCIÓN', 'CARGO', 'DEPARTAMENTO', 'DESCRIPCION DEL CARGO', 
          'FECHA DE INGRESO', 'FECHA DE PRESTACIONES SOCIALES AL DIA', 
          'FECHA DE EGRESO PROYECTADA', 'CORREO ELECTRONICO', 'DIRECCION DEL PROYECTO', 
          'TELEFONO DIRECTO', 'TELEFONO DE EMERGENCIA', 'DIRECCION HABITACION', 
          'SEXO', 'USA LENTES', 'PERSONA CON CONDICION', 'ESTATURA', 
          'TIENDA', 'SUELDO BASE', 'ESTADO'
        ];

        const rows = data.employees.map((e: any) => [
          e.id, e.code, e.nationality, e.name, e.lastName, e.age,
          e.educationLevel, e.position, e.department, e.positionDescription,
          e.hireDate, e.socialBenefitsDate || '', e.projectedExitDate || '',
          e.email, e.projectAddress || '', e.directPhone, e.emergencyPhone,
          e.homeAddress, e.gender, e.wearsGlasses, e.hasCondition, e.height,
          e.storeId, e.baseSalary, e.isActive ? 'ACTIVO' : 'INACTIVO'
        ]);

        // Clear and update
        await sheets.spreadsheets.values.clear({
          spreadsheetId: SPREADSHEET_ID,
          range: 'Expediente!A:Z',
        });

        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: 'Expediente!A1',
          valueInputOption: 'RAW',
          requestBody: {
            values: [headers, ...rows]
          }
        });
      }

      // 3. Update 'Exchange_Rates' if provided in settings
      if (data.settings && data.settings.exchangeRate) {
        if (!sheetNames.includes('Exchange_Rates')) {
          await sheets.spreadsheets.batchUpdate({
            spreadsheetId: SPREADSHEET_ID,
            requestBody: {
              requests: [{ addSheet: { properties: { title: 'Exchange_Rates' } } }]
            }
          });
          // Add headers if new sheet
          await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Exchange_Rates!A1',
            valueInputOption: 'RAW',
            requestBody: {
              values: [['Fecha', 'Tasa']]
            }
          });
        }

        const today = new Date().toISOString().split('T')[0];
        const rate = data.settings.exchangeRate;

        // Check if rate for today already exists
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: 'Exchange_Rates!A:B',
        });

        const rows = response.data.values || [];
        const todayRowIndex = rows.findIndex(row => row[0] === today);

        if (todayRowIndex !== -1) {
          // Update existing row
          await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `Exchange_Rates!B${todayRowIndex + 1}`,
            valueInputOption: 'RAW',
            requestBody: {
              values: [[rate]]
            }
          });
        } else {
          // Append new row
          await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Exchange_Rates!A:B',
            valueInputOption: 'RAW',
            requestBody: {
              values: [[today, rate]]
            }
          });
        }
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error('Sync push error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/exchange-rate/:date', async (req, res) => {
    const tokens = (req.session as any).tokens;
    if (!tokens) return res.status(401).json({ error: 'No autenticado' });

    const { date } = req.params; // YYYY-MM-DD

    try {
      const oauth2Client = getOAuth2Client();
      oauth2Client.setCredentials(tokens);
      const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Exchange_Rates!A:B',
      });

      const rows = response.data.values || [];
      const rateRow = rows.find(row => row[0] === date);

      if (rateRow) {
        res.json({ success: true, rate: parseFloat(rateRow[1]) });
      } else {
        res.json({ success: true, rate: null });
      }
    } catch (error: any) {
      console.error('Get exchange rate error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/exchange-rate/save', async (req, res) => {
    const tokens = (req.session as any).tokens;
    if (!tokens) return res.status(401).json({ error: 'No autenticado' });

    const { rate, date } = req.body;
    const targetDate = date || new Date().toISOString().split('T')[0];

    try {
      const oauth2Client = getOAuth2Client();
      oauth2Client.setCredentials(tokens);
      const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

      const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
      const sheetNames = spreadsheet.data.sheets?.map(s => s.properties?.title) || [];
      
      if (!sheetNames.includes('Exchange_Rates')) {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: SPREADSHEET_ID,
          requestBody: {
            requests: [{ addSheet: { properties: { title: 'Exchange_Rates' } } }]
          }
        });
        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: 'Exchange_Rates!A1',
          valueInputOption: 'RAW',
          requestBody: {
            values: [['Fecha', 'Tasa']]
          }
        });
      }

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Exchange_Rates!A:B',
      });

      const rows = response.data.values || [];
      const rowIndex = rows.findIndex(row => row[0] === targetDate);

      if (rowIndex !== -1) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `Exchange_Rates!B${rowIndex + 1}`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [[rate]]
          }
        });
      } else {
        await sheets.spreadsheets.values.append({
          spreadsheetId: SPREADSHEET_ID,
          range: 'Exchange_Rates!A:B',
          valueInputOption: 'RAW',
          requestBody: {
            values: [[targetDate, rate]]
          }
        });
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error('Save exchange rate error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/sync/pull', async (req, res) => {
    const tokens = (req.session as any).tokens;
    if (!tokens) return res.status(401).json({ error: 'No autenticado' });

    try {
      const oauth2Client = getOAuth2Client();
      oauth2Client.setCredentials(tokens);
      const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'App_Data!A1',
      });

      const rows = response.data.values;
      if (rows && rows.length > 0) {
        const data = JSON.parse(rows[0][0]);
        res.json({ success: true, data });
      } else {
        res.json({ success: true, data: null });
      }
    } catch (error: any) {
      console.error('Sync pull error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
