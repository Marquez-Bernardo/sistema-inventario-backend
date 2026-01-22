// controllers/ubicacionEdificioController.js
import dbPool from '../config/db.js';

/**
 * Obtiene el conteo total de ubicaciones de edificios.
 */
export async function getUbicacionesCount(req, res) {
    try {
        const query = `SELECT COUNT(Id) AS count FROM ubicaciones_edificios`;
        const [rows] = await dbPool.execute(query);
        res.status(200).json({ count: rows[0].count });
    } catch (error) {
        console.error('Error al obtener el conteo de ubicaciones:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
}

/**
 * Obtiene todas las ubicaciones de edificios.
 */
export async function getAllUbicaciones(req, res) {
    try {
        const query = `SELECT Id, ubicacion FROM ubicaciones_edificios ORDER BY Id ASC`;
        const [rows] = await dbPool.execute(query);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error al obtener ubicaciones:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor al consultar ubicaciones.' });
    }
}

/**
 * Obtiene una ubicación por ID.
 */
export async function getUbicacionById(req, res) {
    const { id } = req.params;
    try {
        const query = `SELECT Id, ubicacion FROM ubicaciones_edificios WHERE Id = ?`;
        const [rows] = await dbPool.execute(query, [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ mensaje: 'Ubicación no encontrada.' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error al obtener ubicación por ID:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
}

/**
 * Crea una nueva ubicación.
 */
export async function createUbicacion(req, res) {
    const { ubicacion } = req.body;
    if (!ubicacion) {
        return res.status(400).json({ mensaje: 'El nombre de la ubicación es obligatorio.' });
    }

    try {
        const query = `INSERT INTO ubicaciones_edificios (ubicacion) VALUES (?)`;
        const [result] = await dbPool.execute(query, [ubicacion]);
        res.status(201).json({ 
            mensaje: 'Ubicación creada exitosamente', 
            id: result.insertId 
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ mensaje: 'El nombre de la ubicación ya existe.' });
        }
        console.error('Error al crear ubicación:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor al crear la ubicación.' });
    }
}

/**
 * Actualiza una ubicación existente.
 */
export async function updateUbicacion(req, res) {
    const { id } = req.params;
    const { ubicacion } = req.body;
    
    if (!ubicacion) {
        return res.status(400).json({ mensaje: 'El nombre de la ubicación es obligatorio.' });
    }

    try {
        const query = `UPDATE ubicaciones_edificios SET ubicacion = ? WHERE Id = ?`;
        const [result] = await dbPool.execute(query, [ubicacion, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'Ubicación no encontrada o no se realizaron cambios.' });
        }
        res.status(200).json({ mensaje: 'Ubicación actualizada exitosamente' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ mensaje: 'El nombre de la ubicación ya existe.' });
        }
        console.error('Error al actualizar ubicación:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor al actualizar la ubicación.' });
    }
}

/**
 * Elimina (borrado físico) una ubicación.
 */
export async function deleteUbicacion(req, res) {
    const { id } = req.params;
    try {
        const query = `DELETE FROM ubicaciones_edificios WHERE Id = ?`;
        const [result] = await dbPool.execute(query, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'Ubicación no encontrada.' });
        }
        res.status(200).json({ mensaje: 'Ubicación eliminada exitosamente.' });
    } catch (error) {
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({ 
                mensaje: 'No se puede eliminar la ubicación porque está referenciada en otra tabla.' 
            });
        }
        console.error('Error al eliminar ubicación:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor al eliminar la ubicación.' });
    }
}