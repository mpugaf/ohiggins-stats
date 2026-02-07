const { verifyToken } = require('../config/jwt');
const { executeQuery } = require('../config/database');

/**
 * Middleware para verificar que el token JWT es válido
 * Agrega el objeto user a req para su uso en rutas protegidas
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"

    if (!token) {
      return res.status(401).json({ error: 'Token de autenticación requerido' });
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(403).json({ error: 'Token inválido o expirado' });
    }

    // Verificar que el usuario aún existe y está activo
    const [user] = await executeQuery(
      'SELECT id_usuario, username, email, role, puede_apostar, activo FROM usuarios WHERE id_usuario = ?',
      [decoded.userId]
    );

    if (!user || !user.activo) {
      return res.status(403).json({ error: 'Usuario no encontrado o inactivo' });
    }

    // Agregar usuario a la request
    req.user = user;
    next();

  } catch (error) {
    console.error('Error en authenticateToken:', error);
    return res.status(500).json({ error: 'Error al validar autenticación' });
  }
};

/**
 * Middleware para verificar rol de administrador
 * Debe usarse después de authenticateToken
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Autenticación requerida' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador.' });
  }

  next();
};

/**
 * Middleware para verificar que el usuario puede apostar
 * Debe usarse después de authenticateToken
 */
const requireBettingPermission = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Autenticación requerida' });
  }

  if (!req.user.puede_apostar) {
    return res.status(403).json({
      error: 'Tu cuenta no tiene permisos para apostar. Contacta al administrador.'
    });
  }

  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireBettingPermission
};
