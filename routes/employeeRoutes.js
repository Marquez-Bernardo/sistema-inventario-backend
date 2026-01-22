// routes/employeeRoutes.js
import { Router } from 'express';
import { protect, authorizeRole } from '../middleware/auth.js'; 
import { csrfProtection } from '../middleware/csrf.js'; 
const router = Router();

// ✅ MANTENER: Superadministrador y administrador para empleados
const adminAndSuperAdminOnly = authorizeRole('superadministrador', 'administrador'); 

import { 
    getEmployees, // Para obtener la lista de empleados
    createUser, 
    updateUser, 
    deleteUser, 
    getUserById,
    getEmployeesCount
} from '../controllers/userController.js'; 

// Ruta GET para obtener solo empleados
router.get('/', protect, adminAndSuperAdminOnly, getEmployees);
router.get('/count', protect, adminAndSuperAdminOnly, getEmployeesCount);

// Reutilizar rutas CRUD genéricas (POST, GET/:id, PUT, DELETE)
router.post('/', csrfProtection, protect, adminAndSuperAdminOnly, createUser);
router.get('/:id', protect, adminAndSuperAdminOnly, getUserById);
router.put('/:id', csrfProtection, protect, adminAndSuperAdminOnly, updateUser);
router.delete('/:id', csrfProtection, protect, adminAndSuperAdminOnly, deleteUser); 

export default router;