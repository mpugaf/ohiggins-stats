const express = require('express');
const cuotasController = require('../controllers/cuotasController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/cuotas/partidos
 * Obtener lista de partidos con cuotas disponibles
 * Requiere autenticación
 */
router.get('/partidos', authenticateToken, cuotasController.getPartidosConCuotas);

/**
 * GET /api/cuotas/partidos-sin-apostar
 * Obtener partidos donde el usuario NO ha apostado aún
 * Requiere autenticación
 */
router.get('/partidos-sin-apostar', authenticateToken, cuotasController.getPartidosSinApostar);

/**
 * GET /api/cuotas/partido/:idPartido
 * Obtener cuotas de un partido específico
 * Requiere autenticación
 */
router.get('/partido/:idPartido', authenticateToken, cuotasController.getCuotasByPartido);

/**
 * POST /api/cuotas/partido/:idPartido
 * Crear o actualizar cuotas de un partido
 * Requiere autenticación y rol de administrador
 */
router.post('/partido/:idPartido', authenticateToken, requireAdmin, cuotasController.upsertCuotas);

module.exports = router;
