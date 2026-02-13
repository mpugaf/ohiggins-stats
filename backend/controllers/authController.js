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

  const { username, email, password, nombre_completo, invitationToken } = req.body;

  try {
    // Si se proporciona token de invitación, validarlo primero
    if (invitationToken) {
      console.log(`[AUTH] Validando token de invitación: ${invitationToken.substring(0, 10)}...`);

      // Verificar que el token existe y es válido
      const tokenData = await executeQuery(
        `SELECT id_token, usado, fecha_expiracion
         FROM tokens_invitacion
         WHERE token = ?`,
        [invitationToken]
      );

      if (tokenData.length === 0) {
        return res.status(400).json({ error: 'Token de invitación no válido' });
      }

      // Verificar si ya fue usado
      if (tokenData[0].usado) {
        return res.status(400).json({ error: 'Este token de invitación ya fue utilizado' });
      }

      // Verificar si expiró
      const ahora = new Date();
      const fechaExpiracion = new Date(tokenData[0].fecha_expiracion);
      if (ahora > fechaExpiracion) {
        return res.status(400).json({ error: 'Este token de invitación ha expirado' });
      }

      console.log('[AUTH] Token de invitación válido');
    }

    // Verificar username único (email es opcional)
    let existingUserQuery = 'SELECT id_usuario FROM usuarios WHERE username = ?';
    const queryParams = [username];

    // Si se proporciona email, verificar que tampoco esté duplicado
    if (email && email.trim()) {
      existingUserQuery += ' OR email = ?';
      queryParams.push(email.trim());
    }

    const existingUser = await executeQuery(existingUserQuery, queryParams);

    if (existingUser.length > 0) {
      return res.status(409).json({ error: 'El username o email ya está registrado' });
    }

    // Hash password con bcrypt (10 rounds)
    const passwordHash = await bcrypt.hash(password, 10);

    // Email opcional: si no se proporciona, usar username@ohiggins.local como placeholder
    const userEmail = (email && email.trim()) ? email.trim() : `${username}@ohiggins.local`;

    // Crear usuario
    const result = await executeQuery(
      'INSERT INTO usuarios (username, email, password_hash, nombre_completo, role, puede_apostar) VALUES (?, ?, ?, ?, ?, ?)',
      [username, userEmail, passwordHash, nombre_completo || username, 'usuario', 1]
    );

    const newUserId = result.insertId;

    // Si se usó un token de invitación, marcarlo como usado
    if (invitationToken) {
      console.log(`[AUTH] Marcando token como usado por usuario ${newUserId}`);
      await executeQuery(
        `UPDATE tokens_invitacion
         SET usado = TRUE,
             id_usuario_creado = ?,
             fecha_uso = NOW()
         WHERE token = ?`,
        [newUserId, invitationToken]
      );
      console.log('[AUTH] Token marcado como usado');
    }

    // Generar token JWT
    const token = generateToken({
      userId: newUserId,
      username,
      role: 'usuario'
    });

    console.log(`[AUTH] Nuevo usuario registrado: ${username} (ID: ${newUserId})`);

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      token,
      user: {
        id_usuario: newUserId,
        username,
        email: userEmail,
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

/**
 * Cambiar contraseña del usuario autenticado
 * PUT /api/auth/cambiar-password
 */
exports.cambiarPassword = async (req, res) => {
  const { passwordActual, passwordNuevo } = req.body;

  // Validación de campos
  if (!passwordActual || !passwordNuevo) {
    return res.status(400).json({ error: 'Se requieren la contraseña actual y la nueva contraseña' });
  }

  if (passwordNuevo.length < 6) {
    return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
  }

  try {
    // Obtener usuario actual con password hash
    const [user] = await executeQuery(
      'SELECT id_usuario, username, password_hash FROM usuarios WHERE id_usuario = ?',
      [req.user.id_usuario]
    );

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Verificar que la contraseña actual sea correcta
    const isValid = await bcrypt.compare(passwordActual, user.password_hash);

    if (!isValid) {
      return res.status(401).json({ error: 'La contraseña actual es incorrecta' });
    }

    // Hash de la nueva contraseña
    const nuevoPasswordHash = await bcrypt.hash(passwordNuevo, 10);

    // Actualizar contraseña en la base de datos
    await executeQuery(
      'UPDATE usuarios SET password_hash = ? WHERE id_usuario = ?',
      [nuevoPasswordHash, req.user.id_usuario]
    );

    console.log(`[AUTH] Contraseña actualizada para usuario: ${user.username} (ID: ${user.id_usuario})`);

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });

  } catch (error) {
    console.error('[AUTH] Error al cambiar contraseña:', error);
    res.status(500).json({ error: 'Error al cambiar contraseña' });
  }
};
