const express = require('express');
const configApuestasController = require('../controllers/configApuestasController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/config-apuestas
 * Obtener configuración global de apuestas
 * Requiere autenticación
 */
router.get('/', authenticateToken, configApuestasController.getConfig);

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

module.exports = router;
