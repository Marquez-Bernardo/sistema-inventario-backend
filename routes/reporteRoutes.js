// routes/reporteRoutes.js
import { Router } from 'express';
import { getReporteActivosPorResponsable, getReporteGeneral,
    getReporteDetalladoDepreciacion, getHistorialActivo
 } from '../controllers/reporteController.js';
import { protect, authorizeRole } from '../middleware/auth.js';

const router = Router();

// Acceso permitido para administradores y superadministradores
const adminAccess = authorizeRole('superadministrador', 'administrador');

router.get('/responsable/:responsableId', protect, adminAccess, getReporteActivosPorResponsable);
router.get('/general', protect, adminAccess, getReporteGeneral);
router.get('/detallado-depreciacion', protect, adminAccess, getReporteDetalladoDepreciacion);
router.get('/historial/:tag', protect, adminAccess, getHistorialActivo);

export default router;