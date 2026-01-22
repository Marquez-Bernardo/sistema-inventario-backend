// controllers/activoController.js
import dbPool from '../config/db.js';
// 🟢 Nuevas importaciones para manejo de archivos
import fs from 'fs/promises';
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';
// 🟢 Importar helper de PDF
import { generateActivoPDF } from '../utils/pdfGenerator.js';

// 🟢 Setup de directorios para Multer
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_BASE_DIR = path.join(__dirname, '..', 'uploads', 'activos');

// En activoController.js
const getActivoDirectoryPath = (tag) => {
    // Como ya usamos guiones en lugar de diagonales, el TAG es seguro para nombres de carpetas
    return path.join(UPLOADS_BASE_DIR, tag.toString());
};

export async function updateActivoLocation(req, res) {
    const { id } = req.params;
    const { latitud, longitud } = req.body;

    if (!latitud || !longitud) {
        return res.status(400).json({ mensaje: 'Coordenadas no proporcionadas.' });
    }

    try {
        const query = `UPDATE activos SET latitud = ?, longitud = ? WHERE id = ?`;
        await dbPool.execute(query, [latitud, longitud, id]);
        
        res.status(200).json({ mensaje: 'Ubicación geográfica actualizada correctamente.' });
    } catch (error) {
        console.error('Error al actualizar coordenadas:', error);
        res.status(500).json({ mensaje: 'Error interno al guardar la ubicación.' });
    }
}

//TAG
export async function getNextFolio(req, res) {
    // El prefijo llegará como "UPQROO-2025-51101-511"
    const basePrefix = req.params.basePrefix; 
    
    try {
        // Buscamos el valor máximo numérico después del ÚLTIMO guion
        // solo para los registros que coincidan exactamente con el prefijo base
        const query = `
            SELECT MAX(CAST(SUBSTRING_INDEX(tag, '-', -1) AS UNSIGNED)) as ultimoFolio 
            FROM activos 
            WHERE tag LIKE ?
        `;
        
        // Buscamos "UPQROO-2025-51101-511-%"
        const [rows] = await dbPool.execute(query, [`${basePrefix}-%`]);
        
        const nextFolio = (rows[0].ultimoFolio || 0) + 1;
        
        res.status(200).json({ nextFolio });
    } catch (error) {
        console.error('Error al calcular siguiente folio:', error);
        res.status(500).json({ mensaje: 'Error interno al generar folio.' });
    }
}

/**
 * [HELPER] Obtiene todos los catálogos de referencia necesarios para el formulario de Activos.
 */
export async function getActivoLookupData(req, res) {
    try {
        const [fuentes] = await dbPool.execute(`SELECT Id, concepto_adquisicion FROM fuentes_de_financiamiento ORDER BY concepto_adquisicion ASC`);
        const [clasificaciones] = await dbPool.execute(`SELECT Id, clasificacion FROM clasificaciones_internas ORDER BY clasificacion ASC`);
        const [conceptos] = await dbPool.execute(`SELECT Id, concepto FROM clasificaciones_por_concepto ORDER BY concepto ASC`);
        const [areas] = await dbPool.execute(`SELECT Id, area FROM areas ORDER BY area ASC`);
        const [ubicaciones] = await dbPool.execute(`SELECT Id, ubicacion FROM ubicaciones_edificios ORDER BY ubicacion ASC`);
        const [responsables] = await dbPool.execute(`SELECT Id, CONCAT(nombres, ' ', apellido_paterno, ' ', apellido_materno) AS nombre_completo FROM personas WHERE activo = 1 ORDER BY nombres ASC`);

        // 🟢 NUEVO: Catálogo de estatus físico
        const [estatus] = await dbPool.execute(`SELECT Id, estatus FROM estatus ORDER BY estatus ASC`);

        res.status(200).json({
            fuentes,
            clasificaciones,
            conceptos,
            areas,
            ubicaciones,
            responsables,
            estatus
        });
    } catch (error) {
        console.error('Error al obtener datos de catálogo para Activos:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor al consultar catálogos.' });
    }
}

/**
 * Obtiene el conteo total de activos para el Dashboard.
 */
export async function getActivosCount(req, res) {
    try {
        const [rows] = await dbPool.execute(`SELECT COUNT(id) AS count FROM activos`);
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error al obtener el conteo de activos:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
}

/**
 * Obtiene todos los activos con JOINs a todas las tablas relacionadas para mostrar nombres.
 */
export async function getAllActivos(req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // 2. Consulta de datos con JOINs y límites
        const dataQuery = `
            SELECT 
                a.*,
                ff.concepto_adquisicion AS fuente_nombre,
                ci.clasificacion AS clasificacion_nombre,
                cc.concepto AS concepto_nombre,
                cp.partida AS partida_nombre,
                ar.area AS area_nombre,
                ue.ubicacion AS ubicacion_nombre,
                CONCAT(p.nombres, ' ', p.apellido_paterno, ' ', p.apellido_materno) AS responsable_nombre
            FROM 
                activos a
            LEFT JOIN fuentes_de_financiamiento ff ON a.fuente_id = ff.Id
            LEFT JOIN clasificaciones_internas ci ON a.clasificacion_id = ci.Id
            LEFT JOIN clasificaciones_por_concepto cc ON a.concepto_id = cc.Id
            LEFT JOIN clasificaciones_por_partida cp ON a.partida_id = cp.Id
            LEFT JOIN areas ar ON a.area_id = ar.Id
            LEFT JOIN ubicaciones_edificios ue ON a.ubicacion_id = ue.Id
            LEFT JOIN personas p ON a.responsable_id = p.Id
            ORDER BY a.tag ASC
            LIMIT ? OFFSET ?
        `;

        // 3. Consulta para obtener el total de registros
        const countQuery = `SELECT COUNT(*) AS total FROM activos`;

        // Ejecutar consultas
        // Usamos String() para asegurar compatibilidad con el driver de MySQL en los parámetros LIMIT/OFFSET
        const [rows] = await dbPool.execute(dataQuery, [String(limit), String(offset)]);
        const [countRows] = await dbPool.execute(countQuery);

        const total = countRows[0].total;

        // 4. Retornar objeto con estructura de paginación
        res.status(200).json({
            data: rows,
            total: total,
            currentPage: page,
            totalPages: Math.ceil(total / limit)
        });

    } catch (error) {
        console.error('Error al obtener activos:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor al consultar activos.' });
    }
}


// controllers/activoController.js
export async function createActivo(req, res) {
    const {
        tag, cuenta_mayor, cuenta_registro, cog, cuenta_conac, no_serie,
        descripcion, marca, modelo, proveedor, poliza, factura, costo,
        fecha_adquisicion, fecha_inicio_depreciacion, fuente_id, clasificacion_id,
        concepto_id, partida_id, area_id, ubicacion_id, responsable_id,
        estado, estatus_id // 🟢 Campos nuevos
    } = req.body;

    let generatedDirectory = null;
    let newActivoId = null;

    try {
        if (!tag) return res.status(400).json({ mensaje: 'El TAG es obligatorio.' });
        if (!descripcion) return res.status(400).json({ mensaje: 'La descripción es obligatoria.' });

        generatedDirectory = getActivoDirectoryPath(tag);
        await fs.mkdir(generatedDirectory, { recursive: true });

        // 🟢 Query actualizada con estado y estatus_id
        const query = `
            INSERT INTO activos (
                tag, cuenta_mayor, cuenta_registro, cog, cuenta_conac, no_serie,
                descripcion, marca, modelo, proveedor, poliza, factura, costo,
                fecha_adquisicion, fecha_inicio_depreciacion, fuente_id, clasificacion_id,
                concepto_id, partida_id, area_id, ubicacion_id, responsable_id, 
                directorio, estado, estatus_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            tag, cuenta_mayor, cuenta_registro, cog, cuenta_conac, no_serie,
            descripcion, marca, modelo, proveedor, poliza, factura, costo,
            fecha_adquisicion, fecha_inicio_depreciacion, fuente_id, clasificacion_id,
            concepto_id, partida_id, area_id, ubicacion_id, responsable_id,
            tag.toString(), estado || 'ALTA', estatus_id
        ];

        const [result] = await dbPool.execute(query, values);
        newActivoId = result.insertId;

        // Generación de PDF
        const pdfData = { tag, descripcion, id: newActivoId };
        const pdfBuffer = await generateActivoPDF(pdfData);
        const safeTagName = tag.toString().replace(/\//g, '_');
        const pdfFileName = `${safeTagName}_ID.pdf`;
        const pdfFilePath = path.join(generatedDirectory, pdfFileName);
        await fs.writeFile(pdfFilePath, pdfBuffer);

        res.status(201).json({
            mensaje: 'Activo registrado exitosamente.',
            id: newActivoId,
            pdf_url: `/uploads/activos/${safeTagName}/${pdfFileName}`
        });

    } catch (error) {
        console.error('Error al crear activo:', error);
        if (generatedDirectory) await fs.rm(generatedDirectory, { recursive: true, force: true }).catch(() => { });
        res.status(500).json({ mensaje: 'Error al crear el activo.' });
    }
}

// 🟢 NUEVA FUNCIÓN: Obtener el PDF por TAG
export async function getActivoPDF(req, res) {
    const { tag } = req.params;
    const pdfFileName = `${tag}_ID.pdf`; // Directo, sin reemplazos
    const filePath = path.join(getActivoDirectoryPath(tag), pdfFileName);

    try {
        // Verificar si el archivo existe físicamente
        await fs.access(filePath);

        // Configurar encabezados para visualizar correctamente en el navegador
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${pdfFileName}"`);

        // Leer el buffer del archivo y enviarlo
        const data = await fs.readFile(filePath);
        res.send(data);

    } catch (error) {
        if (error.code === 'ENOENT') {
            return res.status(404).json({
                mensaje: `PDF de identificación para el TAG ${tag} no encontrado en el servidor.`
            });
        }
        console.error('Error al servir PDF:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor al obtener el PDF.' });
    }
}
export async function getActivoById(req, res) {
    const { id } = req.params;
    try {
        const query = `SELECT * FROM activos WHERE id = ?`; // 🟢 Traemos todos los campos
        const [rows] = await dbPool.execute(query, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ mensaje: 'Activo no encontrado.' });
        }

        // 🟢 Aseguramos que el costo sea devuelto como string para manejo en JS
        const activo = rows[0];

        res.status(200).json(activo);
    } catch (error) {
        console.error('Error al obtener activo por ID:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
}

export async function updateActivo(req, res) {
    const { id } = req.params;
    const {
        tag, cuenta_mayor, cuenta_registro, cog, cuenta_conac, no_serie,
        descripcion, marca, modelo, proveedor, poliza, factura, costo,
        fecha_adquisicion, fecha_inicio_depreciacion, fuente_id, clasificacion_id,
        concepto_id, partida_id, area_id, ubicacion_id, responsable_id, directorio,
        estado, estatus_id // 🟢 Campos nuevos
    } = req.body;

    try {
        const [result] = await dbPool.execute(
            `UPDATE activos SET 
                tag = ?, cuenta_mayor = ?, cuenta_registro = ?, cog = ?, cuenta_conac = ?, 
                no_serie = ?, descripcion = ?, marca = ?, modelo = ?, proveedor = ?, 
                poliza = ?, factura = ?, costo = ?, fecha_adquisicion = ?, 
                fecha_inicio_depreciacion = ?, fuente_id = ?, clasificacion_id = ?, 
                concepto_id = ?, partida_id = ?, area_id = ?, ubicacion_id = ?, 
                responsable_id = ?, directorio = ?, estado = ?, estatus_id = ?
             WHERE id = ?`,
            [
                tag, cuenta_mayor, cuenta_registro, cog, cuenta_conac, no_serie,
                descripcion, marca, modelo, proveedor, poliza, factura, costo,
                fecha_adquisicion, fecha_inicio_depreciacion, fuente_id, clasificacion_id,
                concepto_id, partida_id, area_id, ubicacion_id, responsable_id,
                directorio, estado, estatus_id, id
            ]
        );

        if (result.affectedRows === 0) return res.status(404).json({ mensaje: 'No se encontró el activo.' });
        res.status(200).json({ mensaje: 'Activo actualizado exitosamente.' });
    } catch (error) {
        console.error('Error al actualizar:', error);
        res.status(500).json({ mensaje: 'Error interno al actualizar.' });
    }
}

export async function deleteActivo(req, res) {
    const { id } = req.params; // 'id' aquí representará el TAG enviado desde la ruta
    try {
        const query = `
            UPDATE activos 
            SET estado = 'BAJA' 
            WHERE tag = ?
        `;
        const [result] = await dbPool.execute(query, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'No se encontró un activo con ese TAG.' });
        }
        res.status(200).json({ mensaje: 'Activo dado de baja (lógica) exitosamente.' });
    } catch (error) {
        console.error('Error al dar de baja activo:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
}

/**
 * Función para dar de ALTA lógica un activo usando el TAG
 */
export async function activateActivo(req, res) {
    const { id } = req.params; // 'id' aquí representará el TAG
    try {
        const query = `
            UPDATE activos 
            SET estado = 'ALTA' 
            WHERE tag = ?
        `;
        const [result] = await dbPool.execute(query, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'No se encontró un activo con ese TAG.' });
        }
        res.status(200).json({ mensaje: 'Activo dado de alta exitosamente.' });
    } catch (error) {
        console.error('Error al activar activo:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
}

// controllers/activoController.js (NUEVAS FUNCIONES DE IMÁGENES)

// 🟢 Configuración de Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const tag = req.params.tag;
        const dest = getActivoDirectoryPath(tag);
        // Asegura que la carpeta exista (aunque ya la creamos en createActivo)
        fs.mkdir(dest, { recursive: true })
            .then(() => cb(null, dest))
            .catch(err => cb(err));
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext);
        // Genera un nombre único
        cb(null, `${name}_${Date.now()}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    // Aceptar solo JPG, JPEG, PNG
    if (file.mimetype.match(/^image\/(jpeg|png|jpg)$/i)) {
        cb(null, true);
    } else {
        cb(new Error("Formato de archivo no soportado. Solo JPG y PNG."), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 1024 * 1024 * 5 } // Límite de 5MB
});

// 🟢 Middleware para manejo de subida (exportable)
export const handleImageUpload = upload.single('imagen');

// 1. Obtener listado de imágenes
export async function getActivoImages(req, res) {
    const { tag } = req.params;
    const dirPath = getActivoDirectoryPath(tag);

    try {
        const files = await fs.readdir(dirPath);
        const imageFiles = files.filter(file => /\.(jpg|jpeg|png)$/i.test(file));

        // Retornar la lista de URLs relativas para el frontend
        const urls = imageFiles.map(file => `/uploads/activos/${tag}/${file}`);

        res.status(200).json(urls);
    } catch (error) {
        // Si la carpeta no existe, retornar array vacío
        if (error.code === 'ENOENT') {
            return res.status(200).json([]);
        }
        console.error('Error al leer directorio de imágenes:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor al obtener imágenes.' });
    }
}

// 2. Manejar la subida de una imagen (después de Multer)
export async function uploadActivoImage(req, res) {
    const tag = req.params.tag;

    if (!req.file) {
        // Si Multer rechazó el archivo
        return res.status(400).json({ mensaje: 'No se subió ningún archivo o el formato no es compatible (solo JPG, PNG).' });
    }

    const relativeUrl = `/uploads/activos/${tag}/${req.file.filename}`;

    res.status(201).json({
        mensaje: 'Imagen subida exitosamente.',
        filename: req.file.filename,
        url: relativeUrl
    });
}

// 3. Eliminar una imagen
export async function deleteActivoImage(req, res) {
    const { tag, filename } = req.params;
    const filePath = path.join(getActivoDirectoryPath(tag), filename);

    try {
        await fs.unlink(filePath);
        res.status(200).json({ mensaje: `Imagen ${filename} eliminada.` });
    } catch (error) {
        if (error.code === 'ENOENT') {
            return res.status(404).json({ mensaje: 'Archivo no encontrado.' });
        }
        console.error('Error al eliminar imagen:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor al eliminar imagen.' });
    }
}

export async function getActivoByTag(req, res) {
    const { tag } = req.params;
    try {
        const query = `SELECT * FROM activos WHERE tag = ?`;
        const [rows] = await dbPool.execute(query, [tag]);
        if (rows.length === 0) return res.status(404).json({ mensaje: 'No encontrado' });
        res.status(200).json(rows[0]);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error interno' });
    }
}