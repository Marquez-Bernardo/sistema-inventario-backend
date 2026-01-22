// routes/traspasoRoutes.js
import { Router } from 'express';
import { protect, authorizeRole } from '../middleware/auth.js'; 
import { getPersonasTraspaso, getActivosPorResponsable, realizarTraspaso } from '../controllers/traspasoController.js'; 
import { csrfProtection } from '../middleware/csrf.js'; 

const router = Router();
const adminAndSuperAdminOnly = authorizeRole('superadministrador', 'administrador'); 

// Ruta para obtener el catálogo de personas para los selectores
router.get('/personas', protect, adminAndSuperAdminOnly, getPersonasTraspaso);
router.get('/activos-responsable/:responsable_id', protect, adminAndSuperAdminOnly, getActivosPorResponsable);
router.post('/ejecutar', csrfProtection, protect, adminAndSuperAdminOnly, realizarTraspaso);

export default router;