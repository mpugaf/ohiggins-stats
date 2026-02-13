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
 * Query params: idTorneo (requerido), fecha (opcional)
 * Requiere autenticación
 */
router.get('/tabla-posiciones', authenticateToken, pronosticosController.getTablaPosiciones);

/**
 * GET /api/pronosticos/torneos-disponibles
 * Obtener lista de torneos con apuestas
 * Requiere autenticación
 */
router.get('/torneos-disponibles', authenticateToken, pronosticosController.getTorneosDisponibles);

/**
 * GET /api/pronosticos/fechas-torneo/:idTorneo
 * Obtener fechas disponibles de un torneo
 * Requiere autenticación
 */
router.get('/fechas-torneo/:idTorneo', authenticateToken, pronosticosController.getFechasTorneo);

/**
 * GET /api/pronosticos/ultima-fecha
 * Obtener la última fecha disponible
 * Requiere autenticación
 */
router.get('/ultima-fecha', authenticateToken, pronosticosController.getUltimaFecha);

/**
 * GET /api/pronosticos/apuestas-por-partido
 * Ver apuestas de todos los usuarios agrupadas por partido
 * Solo accesible cuando las apuestas están deshabilitadas
 * Requiere autenticación
 */
router.get('/apuestas-por-partido', authenticateToken, pronosticosController.getApuestasPorPartido);

module.exports = router;
