const express = require('express');
const partidosHistoricoController = require('../controllers/partidosHistoricoController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/partidos-historico
 * Obtener partidos históricos (finalizados)
 * Query params: torneoId, fecha
 * Requiere autenticación
 */
router.get('/', authenticateToken, partidosHistoricoController.getPartidosHistoricos);

/**
 * GET /api/partidos-historico/torneos
 * Obtener torneos con partidos finalizados
 * Requiere autenticación
 */
router.get('/torneos', authenticateToken, partidosHistoricoController.getTorneosConHistorico);

/**
 * GET /api/partidos-historico/torneos/:torneoId/fechas
 * Obtener fechas/jornadas de un torneo con partidos finalizados
 * Requiere autenticación
 */
router.get('/torneos/:torneoId/fechas', authenticateToken, partidosHistoricoController.getFechasPorTorneo);

/**
 * GET /api/partidos-historico/torneos/:torneoId/equipos
 * Obtener equipos que participaron en un torneo con partidos finalizados
 * Requiere autenticación
 */
router.get('/torneos/:torneoId/equipos', authenticateToken, partidosHistoricoController.getEquiposPorTorneo);

module.exports = router;
