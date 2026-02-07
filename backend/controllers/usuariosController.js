const bcrypt = require('bcryptjs');
const { executeQuery } = require('../config/database');

/**
 * Obtener todos los usuarios
 * Solo accesible para administradores
 */
const getAllUsuarios = async (req, res) => {
    try {
        const query = `
            SELECT
                id_usuario,
                username,
                email,
                nombre_completo,
                role,
                puede_apostar,
                fecha_creacion,
                ultimo_acceso,
                activo
            FROM usuarios
            ORDER BY fecha_creacion DESC
        `;

        const usuarios = await executeQuery(query);

        res.json({
            success: true,
            data: usuarios,
            total: usuarios.length
        });
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener usuarios',
            error: error.message
        });
    }
};

/**
 * Obtener un usuario por ID
 */
const getUsuarioById = async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
            SELECT
                id_usuario,
                username,
                email,
                nombre_completo,
                role,
                puede_apostar,
                fecha_creacion,
                ultimo_acceso,
                activo
            FROM usuarios
            WHERE id_usuario = ?
        `;

        const usuarios = await executeQuery(query, [id]);

        if (usuarios.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        res.json({
            success: true,
            data: usuarios[0]
        });
    } catch (error) {
        console.error('Error al obtener usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener usuario',
            error: error.message
        });
    }
};

/**
 * Crear nuevo usuario
 * Solo accesible para administradores
 */
const createUsuario = async (req, res) => {
    try {
        const { username, email, password, nombre_completo, role, puede_apostar } = req.body;

        // Validaciones
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username, email y password son requeridos'
            });
        }

        // Validar longitud del password
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña debe tener al menos 6 caracteres'
            });
        }

        // Validar role
        const validRoles = ['admin', 'usuario'];
        const userRole = role || 'usuario';
        if (!validRoles.includes(userRole)) {
            return res.status(400).json({
                success: false,
                message: 'Rol inválido. Debe ser "admin" o "usuario"'
            });
        }

        // Verificar si el username ya existe
        const checkUsername = await executeQuery(
            'SELECT id_usuario FROM usuarios WHERE username = ?',
            [username]
        );

        if (checkUsername.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'El nombre de usuario ya está en uso'
            });
        }

        // Verificar si el email ya existe
        const checkEmail = await executeQuery(
            'SELECT id_usuario FROM usuarios WHERE email = ?',
            [email]
        );

        if (checkEmail.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'El email ya está registrado'
            });
        }

        // Hashear password
        const passwordHash = await bcrypt.hash(password, 10);

        // Insertar usuario
        const query = `
            INSERT INTO usuarios (
                username,
                email,
                password_hash,
                nombre_completo,
                role,
                puede_apostar,
                activo
            ) VALUES (?, ?, ?, ?, ?, ?, 1)
        `;

        const result = await executeQuery(query, [
            username,
            email,
            passwordHash,
            nombre_completo || null,
            userRole,
            puede_apostar !== undefined ? puede_apostar : (userRole === 'usuario' ? 1 : 0)
        ]);

        // Obtener el usuario creado
        const nuevoUsuario = await executeQuery(
            `SELECT
                id_usuario,
                username,
                email,
                nombre_completo,
                role,
                puede_apostar,
                fecha_creacion,
                activo
            FROM usuarios WHERE id_usuario = ?`,
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Usuario creado exitosamente',
            data: nuevoUsuario[0]
        });

    } catch (error) {
        console.error('Error al crear usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear usuario',
            error: error.message
        });
    }
};

/**
 * Eliminar usuario
 * Solo accesible para administradores
 * No permite eliminar el propio usuario administrador
 */
const deleteUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const adminUserId = req.user.id_usuario;

        // Validar que el ID sea un número
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'ID de usuario inválido'
            });
        }

        // Prevenir que el admin se elimine a sí mismo
        if (parseInt(id) === adminUserId) {
            return res.status(400).json({
                success: false,
                message: 'No puedes eliminar tu propio usuario'
            });
        }

        // Verificar si el usuario existe
        const usuario = await executeQuery(
            'SELECT id_usuario, username, role FROM usuarios WHERE id_usuario = ?',
            [id]
        );

        if (usuario.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Eliminar usuario (esto podría disparar cascadas en apuestas, etc.)
        const result = await executeQuery(
            'DELETE FROM usuarios WHERE id_usuario = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(500).json({
                success: false,
                message: 'No se pudo eliminar el usuario'
            });
        }

        res.json({
            success: true,
            message: `Usuario "${usuario[0].username}" eliminado exitosamente`
        });

    } catch (error) {
        console.error('Error al eliminar usuario:', error);

        // Manejar error de foreign key constraint
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({
                success: false,
                message: 'No se puede eliminar el usuario porque tiene registros asociados (apuestas, puntos, etc.)'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al eliminar usuario',
            error: error.message
        });
    }
};

/**
 * Activar/Desactivar usuario
 * Alternativa a eliminar permanentemente
 */
const toggleUsuarioActivo = async (req, res) => {
    try {
        const { id } = req.params;
        const adminUserId = req.user.id_usuario;

        // Prevenir que el admin se desactive a sí mismo
        if (parseInt(id) === adminUserId) {
            return res.status(400).json({
                success: false,
                message: 'No puedes desactivar tu propio usuario'
            });
        }

        // Obtener estado actual
        const usuario = await executeQuery(
            'SELECT id_usuario, username, activo FROM usuarios WHERE id_usuario = ?',
            [id]
        );

        if (usuario.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        const nuevoEstado = !usuario[0].activo;

        // Actualizar estado
        await executeQuery(
            'UPDATE usuarios SET activo = ? WHERE id_usuario = ?',
            [nuevoEstado, id]
        );

        res.json({
            success: true,
            message: `Usuario "${usuario[0].username}" ${nuevoEstado ? 'activado' : 'desactivado'} exitosamente`,
            data: { activo: nuevoEstado }
        });

    } catch (error) {
        console.error('Error al cambiar estado del usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cambiar estado del usuario',
            error: error.message
        });
    }
};

module.exports = {
    getAllUsuarios,
    getUsuarioById,
    createUsuario,
    deleteUsuario,
    toggleUsuarioActivo
};
