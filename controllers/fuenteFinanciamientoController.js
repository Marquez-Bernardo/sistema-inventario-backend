// controllers/fuenteFinanciamientoController.js
import dbPool from '../config/db.js';

/**
 * Obtiene el conteo total de fuentes de financiamiento.
 */
export async function getFuentesFinanciamientoCount(req, res) {
    try {
        const query = `SELECT COUNT(Id) AS count FROM fuentes_de_financiamiento`;
        const [rows] = await dbPool.execute(query);
        res.status(200).json({ count: rows[0].count });
    } catch (error) {
        console.error('Error al obtener el conteo de fuentes de financiamiento:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
}

/**
 * Obtiene todas las fuentes de financiamiento.
 */
export async function getAllFuentesFinanciamiento(req, res) {
    try {
        const query = `SELECT Id, concepto_adquisicion FROM fuentes_de_financiamiento ORDER BY Id ASC`;
        const [rows] = await dbPool.execute(query);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error al obtener fuentes de financiamiento:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor al consultar fuentes de financiamiento.' });
    }
}

/**
 * Obtiene un registro por ID.
 */
export async function getFuenteFinanciamientoById(req, res) {
    const { id } = req.params;
    try {
        const query = `SELECT Id, concepto_adquisicion FROM fuentes_de_financiamiento WHERE Id = ?`;
        const [rows] = await dbPool.execute(query, [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ mensaje: 'Fuente de financiamiento no encontrada.' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error al obtener fuente de financiamiento por ID:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
}

/**
 * Crea una nueva fuente de financiamiento.
 */
export async function createFuenteFinanciamiento(req, res) {
    const { concepto_adquisicion } = req.body;
    if (!concepto_adquisicion) {
        return res.status(400).json({ mensaje: 'El concepto de adquisición es obligatorio.' });
    }

    try {
        const query = `INSERT INTO fuentes_de_financiamiento (concepto_adquisicion) VALUES (?)`;
        const [result] = await dbPool.execute(query, [concepto_adquisicion]);
        res.status(201).json({ 
            mensaje: 'Fuente de financiamiento creada exitosamente', 
            id: result.insertId 
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ mensaje: 'Este concepto de adquisición ya existe.' });
        }
        console.error('Error al crear fuente de financiamiento:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor al crear la fuente de financiamiento.' });
    }
}

/**
 * Actualiza una fuente de financiamiento existente.
 */
export async function updateFuenteFinanciamiento(req, res) {
    const { id } = req.params;
    const { concepto_adquisicion } = req.body;
    
    if (!concepto_adquisicion) {
        return res.status(400).json({ mensaje: 'El concepto de adquisición es obligatorio.' });
    }

    try {
        const query = `UPDATE fuentes_de_financiamiento SET concepto_adquisicion = ? WHERE Id = ?`;
        const [result] = await dbPool.execute(query, [concepto_adquisicion, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'Fuente de financiamiento no encontrada o no se realizaron cambios.' });
        }
        res.status(200).json({ mensaje: 'Fuente de financiamiento actualizada exitosamente' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ mensaje: 'Este concepto de adquisición ya existe.' });
        }
        console.error('Error al actualizar fuente de financiamiento:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor al actualizar la fuente de financiamiento.' });
    }
}

/**
 * Elimina (borrado físico) una fuente de financiamiento.
 */
export async function deleteFuenteFinanciamiento(req, res) {
    const { id } = req.params;
    try {
        const query = `DELETE FROM fuentes_de_financiamiento WHERE Id = ?`;
        const [result] = await dbPool.execute(query, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'Fuente de financiamiento no encontrada.' });
        }
        res.status(200).json({ mensaje: 'Fuente de financiamiento eliminada exitosamente.' });
    } catch (error) {
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({ 
                mensaje: 'No se puede eliminar la fuente de financiamiento porque está siendo utilizada en otra tabla.' 
            });
        }
        console.error('Error al eliminar fuente de financiamiento:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor al eliminar la fuente de financiamiento.' });
    }
}