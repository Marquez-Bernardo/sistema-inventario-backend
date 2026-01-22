// controllers/puestoController.js
import dbPool from '../config/db.js';

/**
 * Obtiene los puestos con paginación (Especial para la Tabla)
 */
export async function getPuestos(req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const dataQuery = `SELECT Id, nombre_puesto FROM puestos ORDER BY Id ASC LIMIT ? OFFSET ?`;
        const countQuery = `SELECT COUNT(Id) AS total FROM puestos`;

        const [rows] = await dbPool.execute(dataQuery, [String(limit), String(offset)]);
        const [countRows] = await dbPool.execute(countQuery);
        
        res.status(200).json({
            data: rows,
            total: countRows[0].total
        });
    } catch (error) {
        console.error('Error al obtener puestos paginados:', error);
        res.status(500).json({ mensaje: 'Error al consultar puestos.' });
    }
}

/**
 * Obtiene el conteo total de puestos.
 */
export async function getPuestosCount(req, res) {
    try {
        const query = `SELECT COUNT(Id) AS count FROM puestos`;
        const [rows] = await dbPool.execute(query);
        res.status(200).json({ count: rows[0].count });
    } catch (error) {
        console.error('Error al obtener el conteo de puestos:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
}

/**
 * Obtiene todos los puestos sin paginación (Especial para Dropdowns/Selects)
 */
export async function getAllPuestos(req, res) {
    try {
        const query = 'SELECT Id, nombre_puesto FROM puestos ORDER BY nombre_puesto ASC';
        const [rows] = await dbPool.execute(query);

        // Devolvemos el array directamente para que el frontend lo procese sin problemas
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error al obtener todos los puestos:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
}

/**
 * Obtiene un puesto por ID.
 */
export async function getPuestoById(req, res) {
    const { id } = req.params;
    try {
        const query = `SELECT Id, nombre_puesto FROM puestos WHERE Id = ?`;
        const [rows] = await dbPool.execute(query, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ mensaje: 'Puesto no encontrado.' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error al obtener puesto por ID:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
}

/**
 * Crea un nuevo puesto.
 */
export async function createPuesto(req, res) {
    const { nombre_puesto } = req.body;
    if (!nombre_puesto) {
        return res.status(400).json({ mensaje: 'El nombre del puesto es obligatorio.' });
    }

    try {
        const query = `INSERT INTO puestos (nombre_puesto) VALUES (?)`;
        const [result] = await dbPool.execute(query, [nombre_puesto]);
        res.status(201).json({
            mensaje: 'Puesto creado exitosamente',
            id: result.insertId
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ mensaje: 'El nombre del puesto ya existe.' });
        }
        console.error('Error al crear puesto:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor al crear el puesto.' });
    }
}

/**
 * Actualiza un puesto existente.
 */
export async function updatePuesto(req, res) {
    const { id } = req.params;
    const { nombre_puesto } = req.body;

    if (!nombre_puesto) {
        return res.status(400).json({ mensaje: 'El nombre del puesto es obligatorio.' });
    }

    try {
        const query = `UPDATE puestos SET nombre_puesto = ? WHERE Id = ?`;
        const [result] = await dbPool.execute(query, [nombre_puesto, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'Puesto no encontrado o no se realizaron cambios.' });
        }
        res.status(200).json({ mensaje: 'Puesto actualizado exitosamente' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ mensaje: 'El nombre del puesto ya existe.' });
        }
        console.error('Error al actualizar puesto:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor al actualizar el puesto.' });
    }
}

/**
 * Elimina (borrado físico) un puesto.
 * Esto fallará automáticamente si el puesto_id está en uso en la tabla personas (FOREIGN KEY).
 */
export async function deletePuesto(req, res) {
    const { id } = req.params;
    try {
        const query = `DELETE FROM puestos WHERE Id = ?`;
        const [result] = await dbPool.execute(query, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'Puesto no encontrado.' });
        }
        res.status(200).json({ mensaje: 'Puesto eliminado exitosamente.' });
    } catch (error) {
        // Código de error 1451 es ER_ROW_IS_REFERENCED_2 (MySQL)
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({
                mensaje: 'No se puede eliminar el puesto porque está asignado a uno o más empleados.'
            });
        }
        console.error('Error al eliminar puesto:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor al eliminar el puesto.' });
    }
}