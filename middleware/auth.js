// middleware/auth.js

import jwt from 'jsonwebtoken';

// 1. Middleware de protección (Lee el token de la cookie y adjunta req.user)
export const protect = (req, res, next) => {
    // CLAVE: Obtener el token directamente de la cookie 'jwt'
    const token = req.cookies.jwt; 

    if (!token) {
        return res.status(401).json({ 
            msg: 'No autorizado, no se encontró token de autenticación (cookie).' 
        });
    }

    try {
        // Verificar y decodificar el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 👇 VERIFICACIÓN RÁPIDA: Ver qué contiene el token
        console.log('🔐 Token decodificado en protect:', decoded);
        console.log('📋 Propiedades del token:', Object.keys(decoded));

        // Adjuntar el payload decodificado a la solicitud (contiene id y rol)
        req.user = decoded; 

        next();

    } catch (error) {
        // Si el token falla (expiró, es inválido), limpiar la cookie para forzar el re-login
        res.clearCookie('jwt'); 
        res.clearCookie('XSRF-TOKEN'); // Limpiar también la cookie CSRF
        
        console.error('Error en el middleware de autenticación (Cookie):', error.message);
        return res.status(401).json({ 
            msg: 'No autorizado, token fallido o expirado' 
        });
    }
};

// 2. Función de autorización (Verifica los roles del usuario)
export const authorizeRole = (...allowedRoles) => {
    return (req, res, next) => {
        console.log('🔍 authorizeRole - req.user:', req.user);
        console.log('🎯 Roles permitidos para esta ruta:', allowedRoles);
        
        // 👇 CAMBIAR de 'req.user.rol' a 'req.user.roles'
        if (!req.user || !req.user.roles) {  // ❌ ANTES: !req.user.rol
            console.error('❌ Error: req.user.roles no encontrado');
            console.error('   req.user existe?:', !!req.user);
            console.error('   req.user.roles existe?:', req.user?.roles);
            console.error('   Propiedades de req.user:', req.user ? Object.keys(req.user) : 'req.user es undefined');
            
            return res.status(403).json({ 
                msg: 'Acceso denegado: Información de rol no disponible.' 
            });
        }

        // 👇 CAMBIAR de 'req.user.rol' a 'req.user.roles'
        const userRole = req.user.roles;  // ❌ ANTES: req.user.rol
        console.log('👤 Rol del usuario:', userRole);
        console.log('✅ ¿El rol está permitido?:', allowedRoles.includes(userRole));
        
        if (allowedRoles.includes(userRole)) {
            console.log('🎉 Acceso autorizado para rol:', userRole);
            next(); 
        } else {
            console.log('🚫 Acceso denegado. Rol actual:', userRole, '| Roles requeridos:', allowedRoles);
            return res.status(403).json({ 
                msg: `Acceso denegado. Se requiere el rol: ${allowedRoles.join(' o ')}. Rol actual: ${userRole}` 
            });
        }
    };
};