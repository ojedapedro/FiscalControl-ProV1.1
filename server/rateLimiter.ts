/**
 * SEGURIDAD: Rate Limiter simple en memoria para endpoints API.
 * Previene abuso de APIs de email, WhatsApp y pagos.
 * 
 * Para producción con múltiples instancias, reemplazar con Redis-based rate limiter.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitEntry>();

// Limpiar entradas expiradas cada 5 minutos
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetTime) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

interface RateLimitOptions {
  /** Número máximo de requests permitidos en la ventana de tiempo */
  maxRequests: number;
  /** Ventana de tiempo en milisegundos */
  windowMs: number;
  /** Mensaje de error personalizado */
  message?: string;
}

/**
 * Crea un middleware de rate limiting.
 * 
 * @example
 * // 10 requests por minuto
 * app.post('/api/send-email', rateLimiter({ maxRequests: 10, windowMs: 60000 }), handler);
 * 
 * // 3 requests por hora
 * app.post('/api/payment', rateLimiter({ maxRequests: 3, windowMs: 3600000 }), handler);
 */
export function rateLimiter(options: RateLimitOptions) {
  const { maxRequests, windowMs, message } = options;

  return (req: any, res: any, next: any) => {
    // Usar IP + ruta como key. Si hay usuario autenticado, incluir uid.
    const clientId = req.user?.uid || req.ip || req.connection?.remoteAddress || 'unknown';
    const key = `${clientId}:${req.path}`;
    const now = Date.now();

    let entry = store.get(key);

    if (!entry || now > entry.resetTime) {
      // Primera request o ventana expirada
      entry = { count: 1, resetTime: now + windowMs };
      store.set(key, entry);
      
      // Añadir headers informativos
      res.set('X-RateLimit-Limit', String(maxRequests));
      res.set('X-RateLimit-Remaining', String(maxRequests - 1));
      res.set('X-RateLimit-Reset', String(Math.ceil(entry.resetTime / 1000)));
      
      return next();
    }

    entry.count++;

    if (entry.count > maxRequests) {
      const retryAfterSec = Math.ceil((entry.resetTime - now) / 1000);
      
      res.set('X-RateLimit-Limit', String(maxRequests));
      res.set('X-RateLimit-Remaining', '0');
      res.set('X-RateLimit-Reset', String(Math.ceil(entry.resetTime / 1000)));
      res.set('Retry-After', String(retryAfterSec));
      
      console.warn(`⚠️ [RateLimit] Límite excedido para ${key} (${entry.count}/${maxRequests})`);
      
      return res.status(429).json({
        error: message || 'Demasiadas solicitudes. Por favor, espere antes de intentar nuevamente.',
        retryAfter: retryAfterSec,
        code: 'RATE_LIMIT_EXCEEDED'
      });
    }

    res.set('X-RateLimit-Limit', String(maxRequests));
    res.set('X-RateLimit-Remaining', String(maxRequests - entry.count));
    res.set('X-RateLimit-Reset', String(Math.ceil(entry.resetTime / 1000)));
    
    next();
  };
}
