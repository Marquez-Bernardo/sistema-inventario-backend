// routes/clasificadorInternoRoutes.js
import { Router } from 'express';
import { protect, authorizeRole } from '../middleware/auth.js'; 
import { csrfProtection } from '../middleware/csrf.js'; 
const router = Router();

import { 
    getClasificacionesInternasCount, 
    getAllClasificacionesInternas, 
    getClasificacionInternaById, 
    createClasificacionInterna,
    updateClasificacionInterna, 
    deleteClasificacionInterna,
    getClasificacionesByPartida,
    getPartidasSimples // ⬅️ Nueva función importada
} from '../controllers/clasificadorInternoController.js'; 

// Definición de acceso: Solo superadministrador y administrador
const adminAndSuperAdminOnly = authorizeRole('superadministrador', 'administrador'); 

/**
 * RUTAS DE CLASIFICACIÓN INTERNA
 */

// 1. Obtener el conteo total de registros
router.get('/count', protect, adminAndSuperAdminOnly, getClasificacionesInternasCount);

// 2. Obtener listado de partidas para el selector (Dropdown) del formulario
// Se coloca antes de las rutas con parámetros para evitar conflictos
router.get('/partidas/listado', protect, adminAndSuperAdminOnly, getPartidasSimples);

// 3. Obtener todas las clasificaciones (paginadas y con JOIN a partidas)
router.get('/', protect, adminAndSuperAdminOnly, getAllClasificacionesInternas);

// 4. Crear una nueva clasificación interna
router.post('/', csrfProtection, protect, adminAndSuperAdminOnly, createClasificacionInterna);

// 5. Obtener una clasificación específica por su ID
router.get('/:id', protect, adminAndSuperAdminOnly, getClasificacionInternaById);

// 6. Actualizar una clasificación existente
router.put('/:id', csrfProtection, protect, adminAndSuperAdminOnly, updateClasificacionInterna);

// 7. Eliminar una clasificación (borrado físico)
router.delete('/:id', csrfProtection, protect, adminAndSuperAdminOnly, deleteClasificacionInterna);

// Añadir esta ruta
router.get('/by-partida/:partida_id', protect, adminAndSuperAdminOnly, getClasificacionesByPartida);

export default router;