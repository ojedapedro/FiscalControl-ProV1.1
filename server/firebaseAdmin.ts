import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';

let adminApp: App;
let db: Firestore | null = null;
let adminAuth: Auth | null = null;

try {
  const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  if (getApps().length === 0) {
    // Opción 1: Service Account JSON (más seguro para producción)
    const saPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    
    if (saPath && fs.existsSync(saPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(saPath, 'utf8'));
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        projectId: firebaseConfig.projectId,
      });
      console.log('✅ [Admin SDK] Inicializado con Service Account.');
    } else {
      // Opción 2: Application Default Credentials (GCP, Cloud Run, Firebase Hosting)
      // En local sin SA, funciona si ejecutas: gcloud auth application-default login
      adminApp = initializeApp({
        projectId: firebaseConfig.projectId,
      });
      console.log('✅ [Admin SDK] Inicializado con Application Default Credentials.');
    }
  } else {
    adminApp = getApps()[0];
  }

  // Inicializar Firestore con database ID nombrado si existe
  const databaseId = firebaseConfig.firestoreDatabaseId && 
    firebaseConfig.firestoreDatabaseId !== '(default)' 
    ? firebaseConfig.firestoreDatabaseId 
    : undefined;

  db = databaseId ? getFirestore(adminApp, databaseId) : getFirestore(adminApp);
  adminAuth = getAuth(adminApp);

  console.log(`✅ [Admin SDK] Firestore conectado (DB: ${databaseId || '(default)'}).`);
} catch (err: any) {
  console.error('❌ [Admin SDK] Error inicializando Firebase Admin:', err.message);
  console.error('   Para desarrollo local, configure GOOGLE_APPLICATION_CREDENTIALS con la ruta a su Service Account JSON.');
}

export { db as adminDb, adminAuth };
