const express = require('express');
const router = express.Router();
const torneoJugadorController = require('../controllers/torneoJugadorController');

// Middleware de logging
router.use((req, res, next) => {
  console.log(`[TORNEO_JUGADOR_ROUTES] ${req.method} ${req.path}`);
  next();
});

// Rutas
router.get('/', torneoJugadorController.getAsignaciones);
router.get('/jugador/:idJugador/ultima', torneoJugadorController.getUltimaAsignacion);
router.get('/jugador/:idJugador', torneoJugadorController.getAsignacionesPorJugador);
router.post('/', torneoJugadorController.crearAsignacion);
router.put('/:id', torneoJugadorController.actualizarAsignacion);
router.delete('/:id', torneoJugadorController.eliminarAsignacion);

// Rutas de asignación masiva
router.post('/asignacion-masiva', torneoJugadorController.crearAsignacionMasiva);
router.put('/actualizar-camiseta-temporada', torneoJugadorController.actualizarCamisetaTemporada);

module.exports = router;
