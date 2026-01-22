// routes/objetoGastoRoutes.js
import { Router } from 'express';
import { getClasificacionesCount, getAllConceptos, getConceptoById, createConcepto, updateConcepto, deleteConcepto,
    getAllPartidas, getPartidaById, createPartida, updatePartida, deletePartida, getPartidasByConceptoId
} from '../controllers/objetoGastoController.js';
import { protect, authorizeRole } from '../middleware/auth.js'; 
import { csrfProtection } from '../middleware/csrf.js'; 

const router = Router();
const adminAndSuperAdminOnly = authorizeRole('superadministrador', 'administrador'); 

// Conteo combinado
router.get('/count', protect, adminAndSuperAdminOnly, getClasificacionesCount);

// Rutas de Conceptos (Clasificaciones por Concepto)
router.get('/conceptos', protect, adminAndSuperAdminOnly, getAllConceptos);
router.post('/conceptos', csrfProtection, protect, adminAndSuperAdminOnly, createConcepto);
router.get('/conceptos/:id', getConceptoById);
router.put('/conceptos/:id', csrfProtection, protect, adminAndSuperAdminOnly, updateConcepto);
router.delete('/conceptos/:id', csrfProtection, protect, adminAndSuperAdminOnly, deleteConcepto);

// Rutas de Partidas (Clasificaciones por Partida)
router.get('/partidas', protect, adminAndSuperAdminOnly,getAllPartidas);
router.post('/partidas', csrfProtection, protect, adminAndSuperAdminOnly, createPartida);
router.get('/partidas/:id', protect, adminAndSuperAdminOnly, getPartidaById);
router.put('/partidas/:id', csrfProtection, protect, adminAndSuperAdminOnly, updatePartida);
router.delete('/partidas/:id', csrfProtection, protect, adminAndSuperAdminOnly, deletePartida);
router.get('/partidas/by-concepto/:conceptoId', protect, adminAndSuperAdminOnly, getPartidasByConceptoId);

export default router;