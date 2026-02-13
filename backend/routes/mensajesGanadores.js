// backend/routes/mensajesGanadores.js
const express = require('express');
const router = express.Router();
const mensajesGanadoresController = require('../controllers/mensajesGanadoresController');
const { authenticateToken } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Obtener ganadores de cada jornada de un torneo
router.get('/ganadores/:idTorneo', mensajesGanadoresController.getGanadoresPorJornada);

// Obtener todos los mensajes de un torneo
router.get('/mensajes/:idTorneo', mensajesGanadoresController.getMensajesTorneo);

// Guardar mensaje de ganador (solo el ganador puede escribir)
router.post('/mensajes/:idTorneo/:numeroJornada', mensajesGanadoresController.guardarMensaje);

module.exports = router;
