const express = require('express');
const configApuestasController = require('../controllers/configApuestasController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/config-apuestas
 * Obtener configuración global de apuestas
 * PÚBLICO - No requiere autenticación (información visible para todos)
 */
router.get('/', configApuestasController.getConfig);

/**
 * PUT /api/config-apuestas
 * Actualizar configuración de apuestas
 * Requiere autenticación y rol de administrador
 */
router.put('/', authenticateToken, requireAdmin, configApuestasController.updateConfig);

/**
 * GET /api/config-apuestas/torneos-fechas
 * Obtener torneos con fechas disponibles
 * Requiere autenticación y rol de administrador
 */
router.get('/torneos-fechas', authenticateToken, requireAdmin, configApuestasController.getTorneosFechas);

/**
 * GET /api/config-apuestas/partidos/:idTorneo/:fecha
 * Obtener partidos de un torneo/fecha específica con sus cuotas
 * Requiere autenticación y rol de administrador
 */
router.get('/partidos/:idTorneo/:fecha', authenticateToken, requireAdmin, configApuestasController.getPartidosPorTorneoFecha);

module.exports = router;
