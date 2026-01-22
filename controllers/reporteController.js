// controllers/reporteController.js
import dbPool from '../config/db.js';

export async function getReporteActivosPorResponsable(req, res) {
    const { responsableId } = req.params;

    try {
        const query = `
            SELECT 
                a.id,
                a.tag,
                a.descripcion,
                a.marca,
                a.modelo,
                a.no_serie,
                a.costo,
                a.fecha_inicio_depreciacion,
                p.partida AS partida_nombre,
                p.depreciacion AS porcentaje_anual,
                p.vida_util,
                ar.area AS area_nombre
            FROM 
                activos a
            JOIN 
                clasificaciones_por_partida p ON a.partida_id = p.Id
            LEFT JOIN 
                areas ar ON a.area_id = ar.Id
            WHERE 
                a.responsable_id = ?
                AND a.estado = 'ALTA';
        `;

        const [activos] = await dbPool.execute(query, [responsableId]);

        const fechaActual = new Date();

        const activosProcesados = activos.map(activo => {
            const costoOriginal = parseFloat(activo.costo);
            const fechaInicio = new Date(activo.fecha_inicio_depreciacion);
            
            // 1. Calcular meses transcurridos
            let mesesTranscurridos = (fechaActual.getFullYear() - fechaInicio.getFullYear()) * 12;
            mesesTranscurridos += fechaActual.getMonth() - fechaInicio.getMonth();

            if (fechaActual.getDate() < fechaInicio.getDate()) {
                mesesTranscurridos--;
            }

            let depreciacionAcumulada = 0;
            let valorActual = costoOriginal;

            // 2. Aplicar depreciación
            if (mesesTranscurridos > 0) {
                const porcentajeAnual = parseFloat(activo.porcentaje_anual) / 100;
                const depreciacionMensual = (costoOriginal * porcentajeAnual) / 12;
                depreciacionAcumulada = depreciacionMensual * mesesTranscurridos;
                
                if (depreciacionAcumulada > costoOriginal) {
                    depreciacionAcumulada = costoOriginal;
                }
                valorActual = costoOriginal - depreciacionAcumulada;
            }

            return {
                id: activo.id,
                tag: activo.tag,
                descripcion: activo.descripcion,
                marca: activo.marca || 'N/A',
                modelo: activo.modelo || 'N/A',
                serie: activo.no_serie || 'N/A',
                area: activo.area_nombre || 'No asignada',
                partida: activo.partida_nombre,
                costo_original: costoOriginal,
                valor_actual: parseFloat(valorActual.toFixed(2)),
                depreciacion_acumulada: parseFloat(depreciacionAcumulada.toFixed(2)),
                meses_depreciados: mesesTranscurridos > 0 ? mesesTranscurridos : 0,
                fecha_inicio: activo.fecha_inicio_depreciacion
            };
        });

        res.status(200).json(activosProcesados);
    } catch (error) {
        console.error('Error al generar reporte:', error);
        res.status(500).json({ mensaje: 'Error interno al procesar el reporte de activos.' });
    }
}

// Agregar al final de controllers/reporteController.js

export async function getReporteGeneral(req, res) {
    try {
        const query = `
            SELECT 
                a.id, a.tag, a.descripcion, a.marca, a.modelo, a.no_serie, a.costo, 
                a.fecha_inicio_depreciacion, a.fecha_adquisicion,
                p.depreciacion AS porcentaje_anual,
                CONCAT(u.nombres, ' ', u.apellido_paterno) AS responsable_nombre
            FROM activos a
            JOIN clasificaciones_por_partida p ON a.partida_id = p.Id
            LEFT JOIN personas u ON a.responsable_id = u.Id
            WHERE a.estado = 'ALTA';
        `;

        const [activos] = await dbPool.execute(query);
        const fechaActual = new Date();

        const activosProcesados = activos.map(activo => {
            const costoOriginal = parseFloat(activo.costo) || 0;
            const fechaInicio = new Date(activo.fecha_inicio_depreciacion);
            
            let mesesTranscurridos = (fechaActual.getFullYear() - fechaInicio.getFullYear()) * 12;
            mesesTranscurridos += fechaActual.getMonth() - fechaInicio.getMonth();
            if (fechaActual.getDate() < fechaInicio.getDate()) mesesTranscurridos--;

            let depreciacionAcumulada = 0;
            if (mesesTranscurridos > 0) {
                const depreciacionMensual = (costoOriginal * (parseFloat(activo.porcentaje_anual) / 100)) / 12;
                depreciacionAcumulada = Math.min(depreciacionMensual * mesesTranscurridos, costoOriginal);
            }

            return {
                ...activo,
                costo_original: costoOriginal,
                valor_actual: parseFloat((costoOriginal - depreciacionAcumulada).toFixed(2)),
                fecha_adquisicion: activo.fecha_adquisicion
            };
        });

        res.status(200).json(activosProcesados);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al generar reporte general.' });
    }
}

export async function getReporteDetalladoDepreciacion(req, res) {
    try {
        const query = `
            SELECT 
                a.tag,
                a.descripcion,
                a.costo,
                a.fecha_inicio_depreciacion,
                p.partida AS partida_nombre,
                p.depreciacion AS porcentaje_anual,
                p.vida_util
            FROM 
                activos a
            JOIN 
                clasificaciones_por_partida p ON a.partida_id = p.Id
            WHERE 
                a.estado = 'ALTA';
        `;

        const [activos] = await dbPool.execute(query);
        const fechaActual = new Date();

        const reporte = activos.map(activo => {
            const costoOriginal = parseFloat(activo.costo) || 0;
            const fechaInicio = new Date(activo.fecha_inicio_depreciacion);
            const porcentajeAnualNum = parseFloat(activo.porcentaje_anual) / 100;

            // 1. Calcular meses transcurridos reales a la fecha de hoy
            let meses = (fechaActual.getFullYear() - fechaInicio.getFullYear()) * 12;
            meses += fechaActual.getMonth() - fechaInicio.getMonth();
            if (fechaActual.getDate() < fechaInicio.getDate()) meses--;
            const mesesReales = meses > 0 ? meses : 0;

            // 2. Cálculos de depreciación a la FECHA ACTUAL
            const depreciacionMensual = (costoOriginal * porcentajeAnualNum) / 12;
            const deprAcumuladaReal = Math.min(depreciacionMensual * mesesReales, costoOriginal);
            const valorActualReal = costoOriginal - deprAcumuladaReal;

            return {
                tag: activo.tag,
                descripcion: activo.descripcion,
                fecha_inicio: activo.fecha_inicio_depreciacion,
                partida: activo.partida_nombre,
                porcentaje_anual: activo.porcentaje_anual,
                porcentaje_num: porcentajeAnualNum, 
                vida_util: activo.vida_util,
                costo_original: costoOriginal,
                depreciacion_mensual: parseFloat(depreciacionMensual.toFixed(2)),
                // Esta columna es la fija que solicitaste (valor a hoy)
                valor_actual_real: parseFloat(valorActualReal.toFixed(2)),
                meses_reales: mesesReales 
            };
        });

        res.status(200).json(reporte);
    } catch (error) {
        console.error('Error al generar el reporte:', error);
        res.status(500).json({ mensaje: 'Error al procesar el reporte.' });
    }
}

export async function getHistorialActivo(req, res) {
    const { tag } = req.params; // Obtenemos el TAG de los parámetros de la URL

    try {
        const query = `
            SELECT 
                h.tag,
                CONCAT(p.nombres, ' ', p.apellido_paterno, ' ', p.apellido_materno) AS responsable_nombre,
                ar.area as nombre_area
            FROM historial_activos h
            JOIN personas p ON h.nombre_resguardante_id = p.Id
            LEFT JOIN areas ar ON h.area_id = ar.Id
            WHERE h.tag = ?
        `;

        const [historial] = await dbPool.execute(query, [tag]);

        if (historial.length === 0) {
            return res.status(404).json({ mensaje: 'No se encontró historial para este activo.' });
        }

        res.status(200).json(historial);
    } catch (error) {
        console.error('Error al obtener historial:', error);
        res.status(500).json({ mensaje: 'Error al consultar el historial del activo.' });
    }
}