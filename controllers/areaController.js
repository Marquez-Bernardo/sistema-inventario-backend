// controllers/areaController.js
import dbPool from '../config/db.js';

/**
 * Obtiene el conteo total de áreas.
 */
export async function getAreasCount(req, res) {
    try {
        const query = `SELECT COUNT(Id) AS count FROM areas`;
        const [rows] = await dbPool.execute(query);
        res.status(200).json({ count: rows[0].count });
    } catch (error) {
        console.error('Error al obtener el conteo de áreas:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
}

/**
 * Obtiene todas las áreas.
 */
export async function getAllAreas(req, res) {
    try {
        const query = `SELECT Id, area FROM areas ORDER BY Id ASC`;
        const [rows] = await dbPool.execute(query);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error al obtener áreas:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor al consultar áreas.' });
    }
}

/**
 * Obtiene un área por ID.
 */
export async function getAreaById(req, res) {
    const { id } = req.params;
    try {
        const query = `SELECT Id, area FROM areas WHERE Id = ?`;
        const [rows] = await dbPool.execute(query, [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ mensaje: 'Área no encontrada.' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error al obtener área por ID:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
}

/**
 * Crea una nueva área.
 */
export async function createArea(req, res) {
    const { area } = req.body; // El campo se llama 'area'
    if (!area) {
        return res.status(400).json({ mensaje: 'El nombre del área es obligatorio.' });
    }

    try {
        const query = `INSERT INTO areas (area) VALUES (?)`; // Inserción en la columna 'area'
        const [result] = await dbPool.execute(query, [area]);
        res.status(201).json({ 
            mensaje: 'Área creada exitosamente', 
            id: result.insertId 
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ mensaje: 'El nombre del área ya existe.' });
        }
        console.error('Error al crear área:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor al crear el área.' });
    }
}

/**
 * Actualiza un área existente.
 */
export async function updateArea(req, res) {
    const { id } = req.params;
    const { area } = req.body;
    
    if (!area) {
        return res.status(400).json({ mensaje: 'El nombre del área es obligatorio.' });
    }

    try {
        const query = `UPDATE areas SET area = ? WHERE Id = ?`;
        const [result] = await dbPool.execute(query, [area, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'Área no encontrada o no se realizaron cambios.' });
        }
        res.status(200).json({ mensaje: 'Área actualizada exitosamente' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ mensaje: 'El nombre del área ya existe.' });
        }
        console.error('Error al actualizar área:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor al actualizar el área.' });
    }
}

/**
 * Elimina (borrado físico) un área.
 */
export async function deleteArea(req, res) {
    const { id } = req.params;
    try {
        const query = `DELETE FROM areas WHERE Id = ?`;
        const [result] = await dbPool.execute(query, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'Área no encontrada.' });
        }
        res.status(200).json({ mensaje: 'Área eliminada exitosamente.' });
    } catch (error) {
        // Asumiendo que puede haber claves foráneas que la referencien
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({ 
                mensaje: 'No se puede eliminar el área porque está referenciada en otra tabla.' 
            });
        }
        console.error('Error al eliminar área:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor al eliminar el área.' });
    }
}