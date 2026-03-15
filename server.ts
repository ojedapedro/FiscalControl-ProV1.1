import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';
import cookieParser from 'cookie-parser';
import session from 'express-session';

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

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.APP_URL}/auth/google/callback`
  );

  const SPREADSHEET_ID = '1EaYm-kbgFciU2ZFIJk5B8rLb9y07hZEDbGKIiElLbd8';

  // Auth Routes
  app.get('/api/auth/google/url', (req, res) => {
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.file'
      ],
      prompt: 'consent'
    });
    res.json({ url });
  });

  app.get('/auth/google/callback', async (req, res) => {
    const { code } = req.query;
    try {
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

    oauth2Client.setCredentials(tokens);
    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

    const { data } = req.body; // Expecting { payments: [], budgets: [], employees: [], ... }
    
    try {
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

      res.json({ success: true });
    } catch (error: any) {
      console.error('Sync push error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/sync/pull', async (req, res) => {
    const tokens = (req.session as any).tokens;
    if (!tokens) return res.status(401).json({ error: 'No autenticado' });

    oauth2Client.setCredentials(tokens);
    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

    try {
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
