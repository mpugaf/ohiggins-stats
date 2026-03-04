// backend/routes/mensajesGanadores.js
const express = require('express');
const router = express.Router();
const mensajesGanadoresController = require('../controllers/mensajesGanadoresController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Obtener todas las jornadas de todos los torneos (orden cronológico)
router.get('/todas-jornadas', mensajesGanadoresController.getTodasLasJornadas);

// Obtener ganadores de cada jornada de un torneo
router.get('/ganadores/:idTorneo', mensajesGanadoresController.getGanadoresPorJornada);

// Obtener todos los mensajes de un torneo
router.get('/mensajes/:idTorneo', mensajesGanadoresController.getMensajesTorneo);

// Guardar mensaje de ganador (solo el ganador puede escribir)
router.post('/mensajes/:idTorneo/:numeroJornada', mensajesGanadoresController.guardarMensaje);

// Eliminar todos los mensajes de un usuario (solo admin)
router.delete('/usuario/:idUsuario', requireAdmin, mensajesGanadoresController.deleteMensajesByUsuario);

module.exports = router;
