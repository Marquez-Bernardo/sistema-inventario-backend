// controllers/authController.js

import dbPool from '../config/db.js';
import { compare } from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto'; // Importamos el módulo para generar el token CSRF

// Función auxiliar para generar el token JWT
const signToken = (id, roles) => {
    return jwt.sign(
        { id, roles }, 
        process.env.JWT_SECRET, 
        {
            expiresIn: process.env.JWT_EXPIRES_IN, 
        }
    );
};

export async function login(req, res) {
    const { correo_institucional, password } = req.body;

    if (!correo_institucional || !password) {
        return res.status(400).json({ mensaje: 'Faltan credenciales.' });
    }

    try {
        // 1. Buscar y validar usuario
        const [rows] = await dbPool.execute(
            'SELECT Id, password_hash, nombres, roles FROM personas WHERE correo_institucional = ? AND activo = TRUE',
            [correo_institucional]
        );

        const persona = rows[0];

        if (!persona) {
            return res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos.' });
        }

        // 2. Comparar la contraseña hasheada
        const match = await compare(password, persona.password_hash);

        if (!match) {
            return res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos.' });
        }

        // --- IMPLEMENTACIÓN JWT Y CSRF (DOUBLE-SUBMIT COOKIE) ---

        // 3. Generar el JWT
        const token = signToken(persona.Id, persona.roles);
        
        // 4. GENERAR TOKEN CSRF
        const csrfToken = crypto.randomBytes(16).toString('hex'); 

        // 5. Establecer la cookie HTTP-ONLY para el JWT (Sesión)
        res.cookie('jwt', token, {
            httpOnly: true, // CLAVE: Protege contra XSS
            // Usamos lógica para desarrollo (http) o producción (https)
            secure: process.env.NODE_ENV === 'production', 
            sameSite: 'Lax', // Protección CSRF parcial
            maxAge: 24 * 60 * 60 * 1000, // 24 horas (ajustar a JWT_EXPIRES_IN)
        });

        // 6. ESTABLECER LA COOKIE XSRF-TOKEN (Regular) para la protección CSRF
        res.cookie('XSRF-TOKEN', csrfToken, {
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax', // Usar 'lax' para desarrollo
            maxAge: 24 * 60 * 60 * 1000,
            httpOnly: false // Importante: debe ser false para que JS pueda leerla
        });

        // 7. Respuesta exitosa (SÓLO la información del usuario)
        res.status(200).json({
            mensaje: 'Inicio de sesión exitoso',
            usuario: {
                id: persona.Id,
                nombre: persona.nombres,
                rol: persona.roles,
            }
        });

    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
}