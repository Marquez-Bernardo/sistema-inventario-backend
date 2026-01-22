// routes/ubicacionEdificioRoutes.js
import { Router } from 'express';
import { protect, authorizeRole } from '../middleware/auth.js'; 
import { csrfProtection } from '../middleware/csrf.js'; 
import { 
    getUbicacionesCount, 
    getAllUbicaciones, 
    getUbicacionById, 
    createUbicacion, 
    updateUbicacion, 
    deleteUbicacion 
} from '../controllers/ubicacionEdificioController.js'; 

const router = Router();
const adminAndSuperAdminOnly = authorizeRole('superadministrador', 'administrador'); 

// Rutas de Ubicaciones de Edificios
router.get('/count', protect, adminAndSuperAdminOnly, getUbicacionesCount);
router.get('/', protect, adminAndSuperAdminOnly, getAllUbicaciones);
router.post('/', csrfProtection, protect, adminAndSuperAdminOnly, createUbicacion);
router.get('/:id', protect, adminAndSuperAdminOnly, getUbicacionById);
router.put('/:id', csrfProtection, protect, adminAndSuperAdminOnly, updateUbicacion);
router.delete('/:id', csrfProtection, protect, adminAndSuperAdminOnly, deleteUbicacion);

export default router;