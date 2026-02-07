const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'ohiggins-stats-secret-key-2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

module.exports = {
  JWT_SECRET,
  JWT_EXPIRES_IN,

  /**
   * Genera un token JWT con el payload proporcionado
   * @param {Object} payload - Datos a incluir en el token (userId, username, role)
   * @returns {string} Token JWT firmado
   */
  generateToken: (payload) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  },

  /**
   * Verifica y decodifica un token JWT
   * @param {string} token - Token JWT a verificar
   * @returns {Object|null} Payload decodificado o null si el token es inválido
   */
  verifyToken: (token) => {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      console.error('Error verificando token:', error.message);
      return null;
    }
  }
};
