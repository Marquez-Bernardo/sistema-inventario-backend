// middleware/csrf.js

/**
 * Middleware para la protección contra Cross-Site Request Forgery (CSRF) 
 * utilizando el patrón Double-Submit Cookie.
 * * Revisa:
 * 1. La cookie 'XSRF-TOKEN' (establecida por el servidor, inaccesible por sitios maliciosos).
 * 2. La cabecera 'x-xsrf-token' (enviada por el frontend, accesible por JS/Axios).
 * Si no coinciden en peticiones que modifican datos, se deniega el acceso.
 */
export const csrfProtection = (req, res, next) => {
    // Solo verificamos la protección CSRF en métodos que MODIFICAN datos
    // Las peticiones GET son consideradas seguras (idempotentes).
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        
        // 1. Obtener el token de la Cookie (la que el atacante no puede robar/modificar)
        const csrfCookie = req.cookies['XSRF-TOKEN'];
        
        // 2. Obtener el token de la Cabecera (el que el frontend lee de la cookie y reenvía)
        // Axios usa 'X-XSRF-TOKEN' por defecto si lo configuramos así.
        const csrfHeader = req.headers['x-xsrf-token']; 

        // Verificación: si falta alguno o no coinciden, es un ataque potencial.
        if (!csrfCookie || csrfCookie !== csrfHeader) {
            // Limpiar las cookies de sesión si falla la verificación CSRF (opcional pero recomendado)
            res.clearCookie('jwt'); 
            res.clearCookie('XSRF-TOKEN'); 
            
            return res.status(403).json({ 
                msg: 'Acceso denegado. Token CSRF inválido o faltante.' 
            });
        }
    }
    
    // Si es un método seguro (GET) o la verificación es exitosa, continuamos.
    next();
};