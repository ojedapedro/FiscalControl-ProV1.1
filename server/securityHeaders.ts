/**
 * SEGURIDAD: Middleware de headers HTTP de seguridad.
 * Implementación manual (sin dependencia de helmet) para máximo control.
 * 
 * Referencia OWASP: https://owasp.org/www-project-secure-headers/
 */
export function securityHeaders(req: any, res: any, next: any) {
  // Prevenir MIME-type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevenir clickjacking (embeber la app en iframes externos)
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // Activar filtro XSS del navegador
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Controlar qué información se envía como Referer
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Restringir APIs del navegador (cámara, micrófono, geolocalización, etc.)
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(self)');

  // HSTS: Forzar HTTPS en producción (max-age: 1 año)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  // Content-Security-Policy básica
  // Permite scripts inline (necesario para Vite HMR en dev), imágenes externas, y fuentes de Google
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",  // unsafe-eval requerido por Vite en dev
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https: http:",
    "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.firebaseapp.com wss://*.firebaseio.com https://firestore.googleapis.com https://*.google.com",
    "frame-src 'self' https://*.stripe.com https://accounts.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '));

  next();
}
