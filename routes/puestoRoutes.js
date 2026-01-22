import { Router } from 'express';
import { getPuestos, getPuestosCount, getAllPuestos, getPuestoById, createPuesto, updatePuesto, deletePuesto } from '../controllers/puestoController.js';
import { protect, authorizeRole } from '../middleware/auth.js'; 
import { csrfProtection } from '../middleware/csrf.js'; 


const router = Router();
const adminAndSuperAdminOnly = authorizeRole('superadministrador', 'administrador'); 

router.get('/', protect, adminAndSuperAdminOnly, getPuestos);
router.get('/count', protect, adminAndSuperAdminOnly, getPuestosCount);
router.get('/all/list', protect, adminAndSuperAdminOnly, getAllPuestos);
router.post('/', csrfProtection, protect, adminAndSuperAdminOnly, createPuesto);
router.get('/:id', protect, adminAndSuperAdminOnly, getPuestoById);
router.put('/:id', csrfProtection, protect, adminAndSuperAdminOnly, updatePuesto);
router.delete('/:id', csrfProtection, protect, adminAndSuperAdminOnly, deletePuesto);

export default router;