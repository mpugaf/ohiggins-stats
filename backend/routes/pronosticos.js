const express = require('express');
const pronosticosController = require('../controllers/pronosticosController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/pronosticos
 * Ver pronósticos de todos los usuarios
 * Solo accesible cuando las apuestas están deshabilitadas
 * Requiere autenticación
 */
router.get('/', authenticateToken, pronosticosController.getPronosticosTodos);

/**
 * GET /api/pronosticos/tabla-posiciones
 * Obtener tabla de posiciones
 * Requiere autenticación
 */
router.get('/tabla-posiciones', authenticateToken, pronosticosController.getTablaPosiciones);

/**
 * GET /api/pronosticos/apuestas-por-partido
 * Ver apuestas de todos los usuarios agrupadas por partido
 * Solo accesible cuando las apuestas están deshabilitadas
 * Requiere autenticación
 */
router.get('/apuestas-por-partido', authenticateToken, pronosticosController.getApuestasPorPartido);

module.exports = router;
