// controllers/traspasoController.js
import dbPool from '../config/db.js';

/**
 * Obtiene el listado de personas (Id y Nombre Completo) para los selectores de traspaso.
 */
export async function getPersonasTraspaso(req, res) {
    try {
        const query = `
            SELECT 
                Id, 
                CONCAT(nombres, ' ', apellido_paterno, ' ', apellido_materno) AS nombre_completo 
            FROM personas 
            WHERE activo = 1 
            ORDER BY nombres ASC
        `;
        const [rows] = await dbPool.execute(query);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error al obtener personas para traspaso:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor al consultar personas.' });
    }
}

/**
 * Obtiene los activos relacionados a un responsable específico.
 */
export async function getActivosPorResponsable(req, res) {
    const { responsable_id } = req.params;
    try {
        const query = `
            SELECT
                a.id,
                a.tag,
                a.descripcion,
                ar.area AS area_nombre
            FROM 
                activos a
            JOIN 
                areas ar ON a.area_id = ar.Id
            WHERE 
                a.responsable_id = ?
                AND a.estado = 'ALTA';
        `;
        const [rows] = await dbPool.execute(query, [responsable_id]);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error al obtener activos del responsable:', error);
        res.status(500).json({ mensaje: 'Error al consultar los activos.' });
    }
}

/**
 * Actualiza el responsable_id de múltiples activos y registra al responsable ANTERIOR en el historial.
 */
export async function realizarTraspaso(req, res) {
    const { persona_destino_id, activos_ids } = req.body;

    if (!persona_destino_id || !activos_ids || activos_ids.length === 0) {
        return res.status(400).json({ mensaje: 'Datos insuficientes para el traspaso.' });
    }

    const connection = await dbPool.getConnection();

    try {
        // Iniciamos la transacción
        await connection.beginTransaction();

        // 1. Consultamos los datos ACTUALES (Origen) de los activos antes de modificarlos
        // Obtenemos el responsable_id actual para guardarlo como origen en el historial
        const [activosActuales] = await connection.query(
            'SELECT tag, responsable_id, area_id FROM activos WHERE id IN (?)',
            [activos_ids]
        );

        if (activosActuales.length === 0) {
            throw new Error('No se encontraron los activos seleccionados.');
        }

        // 2. Insertar en 'historial_activos' con los datos de ORIGEN
        const historialValues = activosActuales.map(activo => [
            null,                // Id autoincremental
            activo.tag,          // Tag del activo
            activo.responsable_id, // Persona de ORIGEN (el que entrega)
            activo.area_id       // Área actual
        ]);

        const insertHistorialQuery = `
            INSERT INTO historial_activos (Id, tag, nombre_resguardante_id, area_id) 
            VALUES ?
        `;
        await connection.query(insertHistorialQuery, [historialValues]);

        // 3. Ahora sí, actualizamos el responsable al de DESTINO en la tabla activos
        const updateQuery = `
            UPDATE activos 
            SET responsable_id = ? 
            WHERE id IN (?)
        `;
        const [updateResult] = await connection.query(updateQuery, [persona_destino_id, activos_ids]);

        // Confirmamos todos los cambios
        await connection.commit();

        res.status(200).json({ 
            mensaje: 'Traspaso completado e historial de origen registrado.', 
            actualizados: updateResult.affectedRows 
        });

    } catch (error) {
        // Si algo falla, deshacemos todo para no dejar datos inconsistentes
        await connection.rollback();
        console.error('Error en el traspaso masivo:', error);
        res.status(500).json({ mensaje: 'Error al procesar el traspaso en la base de datos.' });
    } finally {
        // Liberamos la conexión
        connection.release();
    }
}