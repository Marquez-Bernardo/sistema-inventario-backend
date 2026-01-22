// routes/authRoutes.js
import { Router } from 'express';
const router = Router();
import { login } from '../controllers/authController.js';

// Ruta para el inicio de sesión
router.post('/login', login);

// BACKEND: Ruta de Logout (Ejemplo: en authRoutes.js)
router.post('/logout', (req, res) => {
    res.clearCookie('jwt'); 
    res.clearCookie('XSRF-TOKEN'); // <-- Eliminar la cookie CSRF
    res.status(200).json({ mensaje: 'Sesión cerrada exitosamente' });
});

export default router;