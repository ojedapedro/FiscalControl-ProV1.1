import { adminAuth } from './firebaseAdmin';

/**
 * SEGURIDAD: Middleware de autenticación para endpoints API.
 * Verifica el Firebase ID Token enviado en el header Authorization.
 * 
 * Uso: app.post('/api/ruta', authMiddleware, handler);
 * 
 * El frontend debe enviar: Authorization: Bearer <idToken>
 */
export async function authMiddleware(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'No autorizado. Se requiere token de autenticación.',
      code: 'AUTH_REQUIRED'
    });
  }

  const idToken = authHeader.split('Bearer ')[1];

  if (!idToken || idToken === 'undefined' || idToken === 'null') {
    return res.status(401).json({ 
      error: 'Token de autenticación vacío o inválido.',
      code: 'INVALID_TOKEN'
    });
  }

  if (!adminAuth) {
    console.error('❌ [Auth] Firebase Admin Auth no inicializado. Verifique la configuración del servidor.');
    // En desarrollo, permitir pasar si admin no está configurado (con warning)
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ [Auth] Modo desarrollo: Permitiendo request sin verificación de token.');
      req.user = { uid: 'dev-user', email: 'dev@localhost' };
      return next();
    }
    return res.status(503).json({ 
      error: 'Servicio de autenticación no disponible.',
      code: 'AUTH_SERVICE_UNAVAILABLE'
    });
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: decodedToken.role || null,
    };
    next();
  } catch (error: any) {
    console.error('❌ [Auth] Error verificando token:', error.code || error.message);
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ 
        error: 'Token expirado. Por favor, inicie sesión nuevamente.',
        code: 'TOKEN_EXPIRED'
      });
    }

    return res.status(401).json({ 
      error: 'Token de autenticación inválido.',
      code: 'INVALID_TOKEN'
    });
  }
}
