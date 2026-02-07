const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const { executeQuery } = require('../config/database');
const { generateToken } = require('../config/jwt');

/**
 * Registro de nuevo usuario
 * POST /api/auth/register
 */
exports.register = async (req, res) => {
  // Validar campos
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, password, nombre_completo } = req.body;

  try {
    // Verificar username y email únicos
    const existingUser = await executeQuery(
      'SELECT id_usuario FROM usuarios WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUser.length > 0) {
      return res.status(409).json({ error: 'El username o email ya está registrado' });
    }

    // Hash password con bcrypt (10 rounds)
    const passwordHash = await bcrypt.hash(password, 10);

    // Crear usuario
    const result = await executeQuery(
      'INSERT INTO usuarios (username, email, password_hash, nombre_completo, role, puede_apostar) VALUES (?, ?, ?, ?, ?, ?)',
      [username, email, passwordHash, nombre_completo || username, 'usuario', 1]
    );

    // Generar token JWT
    const token = generateToken({
      userId: result.insertId,
      username,
      role: 'usuario'
    });

    console.log(`[AUTH] Nuevo usuario registrado: ${username} (ID: ${result.insertId})`);

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      token,
      user: {
        id_usuario: result.insertId,
        username,
        email,
        nombre_completo: nombre_completo || username,
        role: 'usuario',
        puede_apostar: true
      }
    });

  } catch (error) {
    console.error('[AUTH] Error en registro:', error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
};

/**
 * Login de usuario
 * POST /api/auth/login
 */
exports.login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username y password son requeridos' });
  }

  try {
    // Buscar usuario por username
    const [user] = await executeQuery(
      'SELECT id_usuario, username, email, password_hash, nombre_completo, role, puede_apostar, activo FROM usuarios WHERE username = ?',
      [username]
    );

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    if (!user.activo) {
      return res.status(403).json({ error: 'Usuario inactivo. Contacta al administrador.' });
    }

    // Verificar password
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Actualizar último acceso
    await executeQuery(
      'UPDATE usuarios SET ultimo_acceso = NOW() WHERE id_usuario = ?',
      [user.id_usuario]
    );

    // Generar token JWT
    const token = generateToken({
      userId: user.id_usuario,
      username: user.username,
      role: user.role
    });

    console.log(`[AUTH] Login exitoso: ${username} (Role: ${user.role})`);

    res.json({
      message: 'Login exitoso',
      token,
      user: {
        id_usuario: user.id_usuario,
        username: user.username,
        email: user.email,
        nombre_completo: user.nombre_completo,
        role: user.role,
        puede_apostar: user.puede_apostar
      }
    });

  } catch (error) {
    console.error('[AUTH] Error en login:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};

/**
 * Obtener perfil del usuario autenticado
 * GET /api/auth/profile
 */
exports.getProfile = async (req, res) => {
  try {
    const [user] = await executeQuery(
      'SELECT id_usuario, username, email, nombre_completo, role, puede_apostar, fecha_creacion, ultimo_acceso FROM usuarios WHERE id_usuario = ?',
      [req.user.id_usuario]
    );

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ user });

  } catch (error) {
    console.error('[AUTH] Error obteniendo perfil:', error);
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
};
