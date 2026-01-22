// routes/areaRoutes.js
import { Router } from 'express';
import { protect, authorizeRole } from '../middleware/auth.js'; 
import { csrfProtection } from '../middleware/csrf.js'; 
const router = Router();
import { getAreasCount, getAllAreas, getAreaById, createArea, updateArea, deleteArea } from '../controllers/areaController.js'; 

const adminAndSuperAdminOnly = authorizeRole('superadministrador', 'administrador'); 

// Rutas de Áreas
router.get('/count', protect, adminAndSuperAdminOnly, getAreasCount);
router.get('/', protect, adminAndSuperAdminOnly, getAllAreas);
router.post('/', csrfProtection, protect, adminAndSuperAdminOnly, createArea);
router.get('/:id', protect, adminAndSuperAdminOnly, getAreaById);
router.put('/:id', csrfProtection, protect, adminAndSuperAdminOnly, updateArea);
router.delete('/:id', csrfProtection, protect, adminAndSuperAdminOnly, deleteArea);

export default router;