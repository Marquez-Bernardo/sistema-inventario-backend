// controllers/userController.js
import dbPool from '../config/db.js';
import { hash } from 'bcryptjs';

export async function getAdminUsers(req, res) {
    try {
        const query = `
            SELECT
                p.Id,
                p.nombres,
                p.apellido_paterno,
                p.apellido_materno,
                p.telefono_movil,
                p.correo_institucional,
                p.roles,
                p.activo,
                p.puesto_id,
                pu.nombre_puesto
            FROM personas p
            INNER JOIN puestos pu ON p.puesto_id = pu.Id
            WHERE p.roles IN ('administrador', 'superadministrador')
            ORDER BY p.Id ASC
        `;
        
        const [rows] = await dbPool.execute(query);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
}

/**
 * Función para crear un nuevo usuario
 */
export async function createUser(req, res) {
    const { 
        nombres, 
        apellido_paterno, 
        apellido_materno, 
        telefono_movil, 
        correo_institucional, 
        password, 
        puesto_id, 
        roles 
    } = req.body;

    // 1. Validación de campos obligatorios
    if (!nombres || !apellido_paterno || !correo_institucional || !puesto_id || !roles) {
        return res.status(400).json({ mensaje: 'Faltan campos obligatorios para el registro.' });
    }

    // 2. Validación de Contraseña Segura (Solo si se proporciona o si no es empleado)
    const isEmployee = roles === 'empleado';
    
    if (!isEmployee || password) {
        if (!password) {
            return res.status(400).json({ mensaje: 'La contraseña es obligatoria para este rol.' });
        }

        // Regla: Min 8 caracteres, 1 Mayúscula, 1 Número, 1 Carácter Especial
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ 
                mensaje: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un carácter especial.' 
            });
        }
    }

    try {
        // 3. Verificación preventiva de Correo Duplicado
        const [existingUser] = await dbPool.execute(
            'SELECT id FROM personas WHERE correo_institucional = ?', 
            [correo_institucional]
        );

        if (existingUser.length > 0) {
            return res.status(409).json({ mensaje: 'El correo institucional ya se encuentra registrado.' });
        }

        // 4. Preparar el hash
        let passwordHash = null;
        if (password) {
            passwordHash = await hash(password, 10);
        }

        // 5. Ejecutar el INSERT
        const query = `
            INSERT INTO personas 
            (nombres, apellido_paterno, apellido_materno, telefono_movil, correo_institucional, password_hash, puesto_id, roles, activo) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE)
        `;
        
        await dbPool.execute(query, [
            nombres, 
            apellido_paterno, 
            apellido_materno || null, // Manejo de opcionales
            telefono_movil || null, 
            correo_institucional, 
            passwordHash, 
            puesto_id, 
            roles
        ]);

        return res.status(201).json({ mensaje: 'Usuario creado exitosamente' });

    } catch (error) {
        console.error('Error detallado al crear usuario:', error);

        // Manejo de errores específicos de base de datos (MySQL/MariaDB)
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ mensaje: 'Error: Ya existe un registro con estos datos únicos (Correo o Teléfono).' });
        }

        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).json({ mensaje: 'El puesto seleccionado no es válido.' });
        }

        return res.status(500).json({ 
            mensaje: 'Error interno del servidor.',
            detalles: process.env.NODE_ENV === 'development' ? error.message : null 
        });
    }
}

/**
 * Nueva función para obtener un usuario por ID (para edición)
 */
export async function getUserById(req, res) {
    const { id } = req.params;
    try {
        const query = `
            SELECT 
                p.Id,
                p.nombres,
                p.apellido_paterno,
                p.apellido_materno,
                p.correo_institucional,
                p.telefono_movil,
                p.roles,
                p.activo,
                p.puesto_id,
                pu.nombre_puesto
            FROM personas p
            LEFT JOIN puestos pu ON p.puesto_id = pu.Id
            WHERE p.Id = ?
        `;
        
        const [rows] = await dbPool.execute(query, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }

        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error al obtener usuario por ID:', error);
        res.status(500).json({ mensaje: 'Error interno al consultar datos del usuario.' });
    }
}

export async function getEmployeesCount(req, res) {
    try {
        // Contar usuarios con rol 'empleado' y estado activo (TRUE)
        const query = `
            SELECT COUNT(Id) AS count 
            FROM personas 
            WHERE roles = 'empleado' AND activo = TRUE
        `;
        const [rows] = await dbPool.execute(query);
        
        // Retornamos el resultado en formato JSON
        res.status(200).json({ count: rows[0].count });

    } catch (error) {
        console.error('Error al obtener el conteo de empleados:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
}

/**
 * Función para actualizar un usuario (incluyendo manejo condicional de la contraseña)
 */
export async function updateUser(req, res) {
    const { id } = req.params;
    const { 
        nombres, 
        apellido_paterno, 
        apellido_materno, 
        telefono_movil, 
        correo_institucional, 
        password, // Esta puede venir vacía
        puesto_id, 
        roles, 
        activo 
    } = req.body;

    // Validación básica
    if (!nombres || !apellido_paterno || !correo_institucional || !puesto_id) {
        return res.status(400).json({ mensaje: 'Faltan campos obligatorios para la actualización.' });
    }

    try {
        let passwordUpdateQuery = '';
        let values = [
            nombres, 
            apellido_paterno, 
            apellido_materno, 
            telefono_movil, 
            correo_institucional, 
            puesto_id, 
            roles, 
            activo
        ];

        // 1. Manejo condicional de la contraseña
        if (password && password.trim() !== '') {
            const password_hash = await hash(password, 10); 
            passwordUpdateQuery = ', password_hash = ?';
            // Insertar el hash en la posición correcta de los valores
            values.splice(5, 0, password_hash); 
        }

        // 2. Consulta de actualización
        const query = `
            UPDATE personas 
            SET 
                nombres = ?, 
                apellido_paterno = ?, 
                apellido_materno = ?, 
                telefono_movil = ?, 
                correo_institucional = ?, 
                puesto_id = ?, 
                roles = ?, 
                activo = ?
                ${passwordUpdateQuery}
            WHERE Id = ?
        `;
        
        // El ID siempre va al final para el WHERE
        values.push(id); 

        const [result] = await dbPool.execute(query, values);

        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado para actualizar.' });
        }

        res.status(200).json({ 
            mensaje: 'Usuario actualizado exitosamente'
        });

    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ mensaje: 'El correo institucional ya está registrado por otro usuario.' });
        }
        res.status(500).json({ mensaje: 'Error interno del servidor al actualizar.' });
    }
}

/**
 * Función para realizar la activación (Alta) de un usuario
 */
export async function activateUser(req, res) {
    const { id } = req.params;
    try {
        const query = `
            UPDATE personas 
            SET activo = 1 
            WHERE Id = ?
        `;
        
        const [result] = await dbPool.execute(query, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'No se encontró el usuario para activar.' });
        }

        res.status(200).json({ mensaje: 'Usuario activado exitosamente.' });

    } catch (error) {
        console.error('Error al activar usuario:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor al activar usuario.' });
    }
}

export async function deleteUser(req, res) {
    const { id } = req.params;
    try {
        // Ejecutar UPDATE para establecer 'activo' en 0 (FALSE)
        const query = `
            UPDATE personas 
            SET activo = 0 
            WHERE Id = ?
        `;
        
        const [result] = await dbPool.execute(query, [id]);

        if (result.affectedRows === 0) {
            // Podría ser que el ID no exista o que ya estuviera inactivo
            return res.status(404).json({ mensaje: 'No se encontró el usuario para desactivar o ya estaba inactivo.' });
        }

        res.status(200).json({ mensaje: 'Usuario desactivado (eliminación lógica) exitosamente.' });

    } catch (error) {
        console.error('Error al realizar eliminación lógica de usuario:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor al desactivar usuario.' });
    }
}

/**
 * Nueva función para obtener solo el conteo de usuarios administradores
 */
export async function getAdminUsersCount(req, res) {
    try {
        const query = `
            SELECT COUNT(Id) as total_users
            FROM personas 
            WHERE roles IN ('administrador', 'superadministrador') AND activo = TRUE
        `;
        
        const [rows] = await dbPool.execute(query);
        
        // El resultado es un array de un objeto: [{ total_users: 5 }]
        const count = rows[0].total_users;
        
        res.status(200).json({ count: count });

    } catch (error) {
        console.error('Error al obtener el conteo de usuarios:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor al obtener el conteo.' });
    }
}

export async function getEmployees(req, res) {
    try {
        // 1. Obtener y validar parámetros de paginación
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // 2. Consulta para obtener los datos segmentados (LIMIT y OFFSET)
        const dataQuery = `
            SELECT 
                p.Id, p.nombres, p.apellido_paterno, p.apellido_materno, 
                p.telefono_movil, p.correo_institucional, p.roles, p.activo,
                pu.nombre_puesto
            FROM personas p
            INNER JOIN puestos pu ON p.puesto_id = pu.Id
            WHERE p.roles = 'empleado'
            ORDER BY p.Id ASC
            LIMIT ? OFFSET ?
        `;
        
        // 3. Consulta para el conteo total de empleados
        const countQuery = `
            SELECT COUNT(*) AS total 
            FROM personas 
            WHERE roles = 'empleado'
        `;

        // Ejecutar consultas (Convertimos limit y offset a String para compatibilidad con mysql2 execute)
        const [rows] = await dbPool.execute(dataQuery, [String(limit), String(offset)]);
        const [countRows] = await dbPool.execute(countQuery);
        
        const total = countRows[0].total;

        // 4. Responder con el objeto estructurado para el frontend
        res.status(200).json({
            data: rows,
            total: total,
            currentPage: page,
            totalPages: Math.ceil(total / limit)
        });

    } catch (error) {
        console.error('Error al obtener empleados:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor al consultar empleados.' });
    }
}