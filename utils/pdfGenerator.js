// utils/pdfGenerator.js
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

// Dimensiones de la etiqueta (10cm x 7cm aprox)
const PAGE_WIDTH = 283; 
const PAGE_HEIGHT = 198; 
const MARGIN = 15;

/**
 * Genera el PDF de un activo con solo el Código QR y el TAG.
 * Optimizado para lectura rápida y tamaño de impresión exacto.
 */
export async function generateActivoPDF(activoData) {
    const doc = new PDFDocument({
        size: [PAGE_WIDTH, PAGE_HEIGHT],
        margin: 0
    });

    const rojoInstitucional = '#4C0000';

    // 1. Encabezado Estético
    doc.rect(0, 0, PAGE_WIDTH, 40)
        .fill(rojoInstitucional);

    doc.fontSize(11)
        .fillColor('#FFFFFF')
        .font('Helvetica-Bold')
        .text('ACTIVO FIJO - CONTROL INTERNO', 0, 15, {
            width: PAGE_WIDTH,
            align: 'center'
        });

    // 2. Configuración del QR y TAG
    // Centraremos el QR en la etiqueta para que se vea mejor
    const QR_SIZE_PTS = 56.7; // 2cm exactos
    const centerX = (PAGE_WIDTH - QR_SIZE_PTS) / 2;
    const centerY = 65;

    try {
        const tagString = String(activoData.tag);
        const redirectUrl = `http://localhost:5173/activos/view/${encodeURIComponent(tagString)}`;

        // Generamos el QR
        const qrDataURL = await QRCode.toDataURL(redirectUrl, {
            errorCorrectionLevel: 'M',
            margin: 1,
            scale: 10,
            color: {
                dark: "#000000",
                light: "#ffffff"
            }
        });

        // Dibujar el QR centrado
        doc.image(qrDataURL, centerX, centerY, { 
            width: QR_SIZE_PTS, 
            height: QR_SIZE_PTS 
        });

        // Dibujar el TAG justo debajo del QR
        doc.fontSize(14) // Un poco más grande para que sea legible a simple vista
            .fillColor('black')
            .font('Helvetica-Bold')
            .text(tagString, 0, centerY + QR_SIZE_PTS + 15, {
                width: PAGE_WIDTH,
                align: 'center'
            });

        // Pequeña leyenda de ayuda
        doc.fontSize(7)
            .fillColor('gray')
            .font('Helvetica')
            .text('ESCANEÉ PARA CONSULTAR / EDITAR', 0, centerY + QR_SIZE_PTS + 35, {
                width: PAGE_WIDTH,
                align: 'center'
            });

    } catch (err) {
        console.error('Error generando QR:', err);
        doc.fontSize(10).text('Error al generar QR', MARGIN, 100);
    }

    // Pie de página (opcional, muy discreto)
    doc.fontSize(6)
        .fillColor('#CCCCCC')
        .text(`Impreso: ${new Date().toLocaleDateString()}`, 0, PAGE_HEIGHT - 15, {
            width: PAGE_WIDTH - MARGIN,
            align: 'right'
        });

    doc.end();
    return doc;
}