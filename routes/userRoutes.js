// routes/userRoutes.js
import { Router } from 'express';
import { getAdminUsers, deleteUser, updateUser, getAdminUsersCount, createUser, getUserById, activateUser } from '../controllers/userController.js';
import { protect, authorizeRole } from '../middleware/auth.js'; 
import { csrfProtection } from '../middleware/csrf.js'; 

const router = Router();

// 🔥 CAMBIO: Solo superadministrador para todas las rutas de usuarios
const superAdminOnly = authorizeRole('superadministrador'); 
const adminAndSuperAdminOnly = authorizeRole('superadministrador', 'administrador'); 

// Ruta GET para obtener la lista de usuarios
router.get('/', protect, superAdminOnly, getAdminUsers);
router.post('/', csrfProtection, protect, superAdminOnly, createUser);
router.get('/count', protect, adminAndSuperAdminOnly, getAdminUsersCount);
router.get('/:id', protect, superAdminOnly, getUserById);

// Rutas de ejemplo para las acciones
router.delete('/:id', csrfProtection, protect, superAdminOnly, deleteUser);
router.put('/:id', csrfProtection, protect, superAdminOnly, updateUser);
router.patch('/:id/activate', csrfProtection, protect, superAdminOnly, activateUser);

export default router;