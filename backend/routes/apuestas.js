const express = require('express');
const apuestasController = require('../controllers/apuestasController');
const { authenticateToken, requireBettingPermission, requireAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/apuestas
 * Crear una apuesta
 * Requiere autenticación y permiso para apostar
 */
router.post('/', authenticateToken, requireBettingPermission, apuestasController.crearApuesta);

/**
 * GET /api/apuestas/mis-apuestas
 * Obtener apuestas del usuario autenticado
 * Query params: estado, torneo
 * Requiere autenticación
 */
router.get('/mis-apuestas', authenticateToken, apuestasController.getApuestasUsuario);

/**
 * GET /api/apuestas/estadisticas
 * Obtener estadísticas de apuestas del usuario
 * Requiere autenticación
 */
router.get('/estadisticas', authenticateToken, apuestasController.getEstadisticasUsuario);

/**
 * GET /api/apuestas/torneos-fechas
 * Obtener torneos y fechas donde el usuario tiene apuestas
 * Requiere autenticación
 */
router.get('/torneos-fechas', authenticateToken, apuestasController.getTorneosYFechasUsuario);

/**
 * POST /api/apuestas/liquidar/:idPartido
 * Liquidar apuestas de un partido
 * Requiere autenticación y rol de administrador
 */
router.post('/liquidar/:idPartido', authenticateToken, requireAdmin, apuestasController.liquidarApuestasPartido);

/**
 * GET /api/apuestas/admin/usuarios-torneo/:idTorneo
 * Obtener usuarios con sus apuestas en un torneo específico
 * Requiere autenticación y rol de administrador
 */
router.get('/admin/usuarios-torneo/:idTorneo', authenticateToken, requireAdmin, apuestasController.getUsuariosConApuestas);

/**
 * DELETE /api/apuestas/admin/limpiar/:idUsuario/:idTorneo
 * Limpiar todas las apuestas de un usuario en un torneo específico
 * Requiere autenticación y rol de administrador
 */
router.delete('/admin/limpiar/:idUsuario/:idTorneo', authenticateToken, requireAdmin, apuestasController.limpiarApuestasUsuario);

module.exports = router;
