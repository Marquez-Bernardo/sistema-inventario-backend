// controllers/clasificadorInternoController.js
import dbPool from '../config/db.js';

export async function getClasificacionesByPartida(req, res) {
    const { partida_id } = req.params;
    try {
        // Filtramos por la columna que relaciona la clasificación con la partida
        const query = `SELECT Id, clasificacion, cog FROM clasificaciones_internas WHERE concepto_id = ? ORDER BY clasificacion ASC`;
        const [rows] = await dbPool.execute(query, [partida_id]);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error al obtener clasificaciones por partida:', error);
        res.status(500).json({ mensaje: 'Error al obtener clasificaciones.' });
    }
}

/**
 * Obtiene el listado de partidas incluyendo la clave genérica para el selector.
 */
export async function getPartidasSimples(req, res) {
    try {
        // Añadimos cve_partida_genérica a la consulta
        const query = `SELECT Id, partida, cve_partida_genérica FROM clasificaciones_por_partida ORDER BY partida ASC`;
        const [rows] = await dbPool.execute(query);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error al obtener partidas:', error);
        res.status(500).json({ mensaje: 'Error interno al obtener partidas.' });
    }
}

/**
 * Obtiene el conteo total de clasificaciones internas.
 */
export async function getClasificacionesInternasCount(req, res) {
    try {
        const query = `SELECT COUNT(Id) AS count FROM clasificaciones_internas`;
        const [rows] = await dbPool.execute(query);
        res.status(200).json({ count: rows[0].count });
    } catch (error) {
        console.error('Error al obtener el conteo de clasificaciones internas:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
}

/**
 * Obtiene todas las clasificaciones internas con paginación.
 * Incluye la nueva columna 'cog' y el nombre de la partida relacionada mediante un JOIN.
 */
export async function getAllClasificacionesInternas(req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // JOIN para traer 'partida' (nombre) de la tabla foránea clasificaciones_por_partida
        const dataQuery = `
            SELECT 
                ci.Id, 
                ci.clasificacion, 
                ci.cog, 
                ci.concepto_id, 
                cp.partida AS nombre_partida
            FROM clasificaciones_internas ci
            LEFT JOIN clasificaciones_por_partida cp ON ci.concepto_id = cp.Id
            ORDER BY ci.Id ASC 
            LIMIT ? OFFSET ?`;
        
        const countQuery = `SELECT COUNT(*) AS total FROM clasificaciones_internas`;

        const [rows] = await dbPool.execute(dataQuery, [limit, offset]);
        const [countResult] = await dbPool.execute(countQuery);

        const total = countResult[0].total;

        res.status(200).json({
            data: rows,
            total: total,
            currentPage: page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('Error al obtener clasificaciones internas paginadas:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
}

/**
 * Obtiene una clasificación interna específica por su ID.
 */
export async function getClasificacionInternaById(req, res) {
    const { id } = req.params;
    try {
        const query = `SELECT Id, clasificacion, cog, concepto_id FROM clasificaciones_internas WHERE Id = ?`;
        const [rows] = await dbPool.execute(query, [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ mensaje: 'Clasificación interna no encontrada.' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error al obtener clasificación interna por ID:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
}

/**
 * Crea una nueva clasificación interna.
 * Requiere clasificacion, cog y concepto_id.
 */
export async function createClasificacionInterna(req, res) {
    const { clasificacion, cog, concepto_id } = req.body;
    
    if (!clasificacion || !cog || !concepto_id) {
        return res.status(400).json({ 
            mensaje: 'El nombre de la clasificación, el COG y la partida son obligatorios.' 
        });
    }

    try {
        const query = `INSERT INTO clasificaciones_internas (clasificacion, cog, concepto_id) VALUES (?, ?, ?)`;
        const [result] = await dbPool.execute(query, [clasificacion, cog, concepto_id]);
        res.status(201).json({ 
            mensaje: 'Clasificación interna creada exitosamente', 
            id: result.insertId 
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ mensaje: 'Esta clasificación interna o COG ya existe.' });
        }
        console.error('Error al crear clasificación interna:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor al crear la clasificación.' });
    }
}

/**
 * Actualiza una clasificación interna existente.
 */
export async function updateClasificacionInterna(req, res) {
    const { id } = req.params;
    const { clasificacion, cog, concepto_id } = req.body;
    
    if (!clasificacion || !cog || !concepto_id) {
        return res.status(400).json({ 
            mensaje: 'El nombre de la clasificación, el COG y la partida son obligatorios.' 
        });
    }

    try {
        const query = `
            UPDATE clasificaciones_internas 
            SET clasificacion = ?, cog = ?, concepto_id = ? 
            WHERE Id = ?`;
        const [result] = await dbPool.execute(query, [clasificacion, cog, concepto_id, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'Clasificación interna no encontrada.' });
        }
        res.status(200).json({ mensaje: 'Clasificación interna actualizada exitosamente' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ mensaje: 'El nombre o el COG ya están en uso por otra clasificación.' });
        }
        console.error('Error al actualizar clasificación interna:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor al actualizar.' });
    }
}

/**
 * Elimina una clasificación interna (borrado físico).
 */
export async function deleteClasificacionInterna(req, res) {
    const { id } = req.params;
    try {
        const query = `DELETE FROM clasificaciones_internas WHERE Id = ?`;
        const [result] = await dbPool.execute(query, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'Clasificación interna no encontrada.' });
        }
        res.status(200).json({ mensaje: 'Clasificación interna eliminada exitosamente.' });
    } catch (error) {
        // Error si hay claves foráneas que dependen de este registro
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({ 
                mensaje: 'No se puede eliminar porque está siendo utilizada en el inventario o activos.' 
            });
        }
        console.error('Error al eliminar clasificación interna:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor al eliminar.' });
    }
}