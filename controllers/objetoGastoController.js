// controllers/objetoGastoController.js
import dbPool from '../config/db.js';

/**
 * Obtiene el conteo total combinado de clasificaciones por concepto y por partida.
 */
export async function getClasificacionesCount(req, res) {
    try {
        const [conceptos] = await dbPool.execute(`SELECT COUNT(Id) AS count FROM clasificaciones_por_concepto`);
        const [partidas] = await dbPool.execute(`SELECT COUNT(Id) AS count FROM clasificaciones_por_partida`);
        
        // 🟢 Requisito: Conteo combinado
        const totalCount = conceptos[0].count + partidas[0].count;
        
        res.status(200).json({ count: totalCount });
    } catch (error) {
        console.error('Error al obtener el conteo de clasificaciones:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
}

// --- Operaciones CRUD para Conceptos ---

export async function getAllConceptos(req, res) {
    try {
        // Se agregan: cuenta, cve_partida_generica
        const query = `SELECT Id, concepto, cuenta, cve_partida_generica FROM clasificaciones_por_concepto ORDER BY Id ASC`;
        const [rows] = await dbPool.execute(query);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error al obtener conceptos:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor al consultar conceptos.' });
    }
}

export async function getConceptoById(req, res) {
    const { id } = req.params;
    try {
        // Se seleccionan las nuevas columnas
        const query = `SELECT Id, concepto, cuenta, cve_partida_generica FROM clasificaciones_por_concepto WHERE Id = ?`;
        const [rows] = await dbPool.execute(query, [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ mensaje: 'Concepto no encontrado.' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
}

export async function createConcepto(req, res) {
    const { concepto, cuenta, cve_partida_generica } = req.body;
    if (!concepto) {
        return res.status(400).json({ mensaje: 'El nombre del concepto es obligatorio.' });
    }

    try {
        // Inserción incluyendo nuevas columnas
        const query = `INSERT INTO clasificaciones_por_concepto (concepto, cuenta, cve_partida_generica) VALUES (?, ?, ?)`;
        const [result] = await dbPool.execute(query, [concepto, cuenta || null, cve_partida_generica || null]);
        res.status(201).json({ mensaje: 'Concepto creado exitosamente', id: result.insertId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ mensaje: 'El nombre ya existe.' });
        res.status(500).json({ mensaje: 'Error al crear el concepto.' });
    }
}

export async function updateConcepto(req, res) {
    const { id } = req.params;
    const { concepto, cuenta, cve_partida_generica } = req.body;
    
    try {
        // Actualización incluyendo nuevas columnas
        const query = `UPDATE clasificaciones_por_concepto SET concepto = ?, cuenta = ?, cve_partida_generica = ? WHERE Id = ?`;
        const [result] = await dbPool.execute(query, [concepto, cuenta, cve_partida_generica, id]);

        if (result.affectedRows === 0) return res.status(404).json({ mensaje: 'No encontrado.' });
        res.status(200).json({ mensaje: 'Concepto actualizado exitosamente' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al actualizar el concepto.' });
    }
}

export async function deleteConcepto(req, res) {
    const { id } = req.params;
    try {
        const query = `DELETE FROM clasificaciones_por_concepto WHERE Id = ?`;
        const [result] = await dbPool.execute(query, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'Concepto no encontrado.' });
        }
        res.status(200).json({ mensaje: 'Concepto eliminado exitosamente.' });
    } catch (error) {
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({ 
                mensaje: 'No se puede eliminar el concepto porque tiene partidas asociadas.' 
            });
        }
        console.error('Error al eliminar concepto:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor al eliminar el concepto.' });
    }
}

// --- Operaciones CRUD para Partidas ---

export async function getAllPartidas(req, res) {
    try {
        // Se agregan: p.cuenta, p.cve_partida_generica, p.cuenta_contable
        const query = `
            SELECT 
                p.Id, 
                p.partida,
                p.cve_partida_genérica, 
                p.concepto_id, 
                p.depreciacion, 
                p.vida_util,
                p.cuenta,
                p.cuenta_contable,
                c.concepto AS concepto_nombre
            FROM 
                clasificaciones_por_partida p
            JOIN 
                clasificaciones_por_concepto c ON p.concepto_id = c.Id
            ORDER BY 
                p.Id ASC
        `;
        const [rows] = await dbPool.execute(query);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error al obtener partidas:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor al consultar partidas.' });
    }
}

export async function getPartidaById(req, res) {
    const { id } = req.params;
    try {
        const query = `
            SELECT Id, partida, concepto_id, depreciacion, vida_util, cve_partida_genérica, cuenta, cuenta_contable
            FROM clasificaciones_por_partida 
            WHERE Id = ?
        `;
        const [rows] = await dbPool.execute(query, [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ mensaje: 'Partida no encontrada.' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error al obtener partida por ID:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
}

export async function createPartida(req, res) {
    const { partida, concepto_id, depreciacion, vida_util, cve_partida_genérica, cuenta, cuenta_contable } = req.body;
    
    if (!partida || !concepto_id) {
        return res.status(400).json({ mensaje: 'Faltan campos obligatorios para la partida.' });
    }

    try {
        const query = `
            INSERT INTO clasificaciones_por_partida 
            (partida, concepto_id, depreciacion, vida_util, cve_partida_genérica, cuenta, cuenta_contable) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await dbPool.execute(query, [
            partida, concepto_id, depreciacion || 0, vida_util || 0, 
            cve_partida_genérica || null, cuenta || null, cuenta_contable || null
        ]);
        res.status(201).json({ mensaje: 'Partida creada exitosamente', id: result.insertId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ mensaje: 'El nombre de la partida ya existe.' });
        }
        console.error('Error al crear partida:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
}

export async function updatePartida(req, res) {
    const { id } = req.params;
    const { partida, concepto_id, depreciacion, vida_util, cve_partida_genérica, cuenta, cuenta_contable } = req.body;

    try {
        const query = `
            UPDATE clasificaciones_por_partida 
            SET partida = ?, concepto_id = ?, depreciacion = ?, vida_util = ?, 
                cve_partida_genérica = ?, cuenta = ?, cuenta_contable = ?
            WHERE Id = ?
        `;
        const [result] = await dbPool.execute(query, [
            partida, concepto_id, depreciacion, vida_util, 
            cve_partida_genérica, cuenta, cuenta_contable, id
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'Partida no encontrada.' });
        }
        res.status(200).json({ mensaje: 'Partida actualizada exitosamente' });
    } catch (error) {
        console.error('Error al actualizar partida:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
}

export async function deletePartida(req, res) {
    const { id } = req.params;
    try {
        const query = `DELETE FROM clasificaciones_por_partida WHERE Id = ?`;
        const [result] = await dbPool.execute(query, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'Partida no encontrada.' });
        }
        res.status(200).json({ mensaje: 'Partida eliminada exitosamente.' });
    } catch (error) {
        console.error('Error al eliminar partida:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor al eliminar la partida.' });
    }
}

export async function getPartidasByConceptoId(req, res) {
    const { conceptoId } = req.params;
    try {
        const query = `
            SELECT Id, cuenta, cuenta_contable, partida
            FROM clasificaciones_por_partida
            WHERE concepto_id = ?
            ORDER BY partida ASC
        `;
        const [rows] = await dbPool.execute(query, [conceptoId]);
        res.status(200).json(rows);
    } catch (error) {
        console.error(`Error al obtener partidas para concepto ${conceptoId}:`, error);
        res.status(500).json({ mensaje: 'Error interno del servidor al consultar partidas.' });
    }
}