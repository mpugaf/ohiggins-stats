// backend/routes/tokensInvitacion.js
console.log('📂 Cargando rutas de tokens de invitación...');

const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');

console.log('📥 Importando controlador de tokens...');
let tokensController;
try {
  tokensController = require('../controllers/tokensInvitacionController');
  console.log('✅ Controlador de tokens cargado correctamente');
} catch (error) {
  console.error('❌ Error cargando controlador de tokens:', error.message);
  throw error;
}

// Middleware para logging
router.use((req, res, next) => {
  console.log(`🎟️ Tokens Invitación API: ${req.method} ${req.path}`);
  next();
});

// Verificar que las funciones del controlador existen
const verificarControlador = () => {
  const metodos = [
    'crearTokenInvitacion',
    'validarToken',
    'listarTokens',
    'listarTokensPublico',
    'eliminarToken'
  ];

  for (const metodo of metodos) {
    if (typeof tokensController[metodo] !== 'function') {
      throw new Error(`Método ${metodo} no encontrado en tokensInvitacionController`);
    }
  }
  console.log('✅ Todos los métodos del controlador de tokens verificados');
};

verificarControlador();

// Rutas públicas (sin autenticación)
// Listar tokens activos (público, sin datos sensibles)
router.get('/publico', (req, res) => {
  console.log('GET /tokens-invitacion/publico');
  tokensController.listarTokensPublico(req, res);
});

// Validar token de invitación
router.get('/validar/:token', (req, res) => {
  console.log('GET /tokens-invitacion/validar/:token');
  tokensController.validarToken(req, res);
});

// Rutas protegidas (solo admin)
// Crear nuevo token de invitación
router.post('/', authenticateToken, requireAdmin, (req, res) => {
  console.log('POST /tokens-invitacion - Crear nuevo token');
  tokensController.crearTokenInvitacion(req, res);
});

// Listar todos los tokens
router.get('/', authenticateToken, requireAdmin, (req, res) => {
  console.log('GET /tokens-invitacion - Listar tokens');
  tokensController.listarTokens(req, res);
});

// Eliminar token
router.delete('/:idToken', authenticateToken, requireAdmin, (req, res) => {
  console.log('DELETE /tokens-invitacion/:idToken - Eliminar token');
  tokensController.eliminarToken(req, res);
});

console.log('✅ Rutas de tokens de invitación configuradas correctamente');

module.exports = router;
