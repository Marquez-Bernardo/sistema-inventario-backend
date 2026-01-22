// routes/fuenteFinanciamientoRoutes.js
import { Router } from 'express';
import { getFuentesFinanciamientoCount, getAllFuentesFinanciamiento, getFuenteFinanciamientoById, 
    createFuenteFinanciamiento, updateFuenteFinanciamiento, deleteFuenteFinanciamiento } from '../controllers/fuenteFinanciamientoController.js';
import { protect, authorizeRole } from '../middleware/auth.js'; 
import { csrfProtection } from '../middleware/csrf.js'; 

const router = Router();
const adminAndSuperAdminOnly = authorizeRole('superadministrador', 'administrador'); 

// Rutas de Fuentes de Financiamiento
router.get('/count', protect, adminAndSuperAdminOnly, getFuentesFinanciamientoCount);
router.get('/', protect, adminAndSuperAdminOnly, getAllFuentesFinanciamiento);
router.post('/', csrfProtection, protect, adminAndSuperAdminOnly, createFuenteFinanciamiento);
router.get('/:id', protect, adminAndSuperAdminOnly, getFuenteFinanciamientoById);
router.put('/:id', csrfProtection, protect, adminAndSuperAdminOnly, updateFuenteFinanciamiento);
router.delete('/:id', csrfProtection, protect, adminAndSuperAdminOnly, deleteFuenteFinanciamiento);
export default router;