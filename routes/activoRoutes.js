// routes/activoRoutes.js
import { Router } from 'express';
import { protect, authorizeRole } from '../middleware/auth.js'; 
import { csrfProtection } from '../middleware/csrf.js'; 
import { 
    getActivosCount, 
    getAllActivos, 
    getActivoLookupData,
    createActivo,
    getActivoById,
    updateActivo,
    deleteActivo,
    activateActivo,
    handleImageUpload,   
    getActivoImages,   
    uploadActivoImage,    
    deleteActivoImage,
    getNextFolio,
    updateActivoLocation,
    getActivoPDF,
    getActivoByTag
} from '../controllers/activoController.js'; 

const router = Router();
const adminAndSuperAdminOnly = authorizeRole('superadministrador', 'administrador'); 

// Conteo para Dashboard
router.get('/count', protect, adminAndSuperAdminOnly, getActivosCount);

// Datos de catálogo para el formulario
router.get('/lookup-data', protect, adminAndSuperAdminOnly, getActivoLookupData);

//TAG
// Registrar la ruta (colócala antes de las rutas con :id para evitar conflictos)
router.get('/by-tag/:tag', protect, adminAndSuperAdminOnly, getActivoByTag);
router.get('/next-folio/:basePrefix', protect, adminAndSuperAdminOnly, getNextFolio);

// CRUD Activos
router.get('/', protect, adminAndSuperAdminOnly, getAllActivos);
router.post('/', csrfProtection, protect, adminAndSuperAdminOnly, createActivo);
router.get('/:id', protect, adminAndSuperAdminOnly, getActivoById);
router.put('/:id', csrfProtection, protect, adminAndSuperAdminOnly, updateActivo);
router.delete('/:id', csrfProtection, protect, adminAndSuperAdminOnly, deleteActivo);
router.patch('/:id/activate', csrfProtection, protect, adminAndSuperAdminOnly, activateActivo);
// 🟢 RUTAS DE MANEJO DE IMÁGENES
// Nota: Usamos el TAG en la ruta para identificar la carpeta
router.get('/:tag/imagenes', protect, adminAndSuperAdminOnly, getActivoImages);
// handleImageUpload procesa el archivo antes de llamar a uploadActivoImage
router.post('/:tag/upload', csrfProtection, handleImageUpload, uploadActivoImage); 
router.delete('/:tag/imagenes/:filename', csrfProtection, protect, adminAndSuperAdminOnly, deleteActivoImage);

// 🟢 RUTA PARA OBTENER EL PDF (Abrir en navegador o Descargar)
router.get('/:tag/pdf', protect, adminAndSuperAdminOnly, getActivoPDF);
// Añade esta línea junto a las demás rutas de activos
router.patch('/:id/location', csrfProtection, protect, adminAndSuperAdminOnly, updateActivoLocation);

export default router;