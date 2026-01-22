// server.js
import 'dotenv/config.js';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser'; // 1. IMPORTAR
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
// 🟢 Definir __dirname para módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🟢 Servir Archivos Estáticos (Imágenes de Activos)
const UPLOADS_DIR = path.join(__dirname, 'uploads', 'activos');
app.use('/uploads/activos', express.static(UPLOADS_DIR));

// --- CONFIGURACIÓN DE CORS ---
const whitelist = [
    'http://localhost:5173', // Para desarrollo local de Vue
];

const corsOptions = {
    origin: function (origin, callback) {
        if (whitelist.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true // CLAVE: Habilita el manejo de cookies
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Opcional pero recomendado para formularios
app.use(cookieParser()); // 2. USAR cookie-parser AQUÍ

// --- FIN DE CONFIGURACIÓN DE CORS ---

// Asegúrate de usar .js al importar archivos locales en ESM
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import puestoRoutes from './routes/puestoRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import areaRoutes from './routes/areaRoutes.js';
import fuenteFinanciamientoRoutes from './routes/fuenteFinanciamientoRoutes.js';
import clasificadorInternoRoutes from './routes/clasificadorInternoRoutes.js';
import objetoGastoRoutes from './routes/objetoGastoRoutes.js';
import activoRoutes from './routes/activoRoutes.js';
import ubicacionEdificioRoutes from './routes/ubicacionEdificioRoutes.js';
import reporteRoutes from './routes/reporteRoutes.js';
import traspasoRoutes from './routes/traspasoRoutes.js';

const PORT = process.env.PORT || 3000;

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/puestos', puestoRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/areas', areaRoutes);
app.use('/api/fuentes-financiamiento', fuenteFinanciamientoRoutes);
app.use('/api/clasificador-interno', clasificadorInternoRoutes);
app.use('/api/objeto-gasto', objetoGastoRoutes);
app.use('/api/activos', activoRoutes);
app.use('/api/ubicaciones-edificios', ubicacionEdificioRoutes);
app.use('/api/reportes', reporteRoutes);
app.use('/api/traspasos', traspasoRoutes);

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});