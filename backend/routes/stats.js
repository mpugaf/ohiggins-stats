const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const sustitucionesController = require('../controllers/sustitucionesController');

// Rutas para dimensiones
router.get('/equipos', statsController.getEquipos);
router.get('/estadios', statsController.getEstadios);
router.get('/jugadores', statsController.getJugadores);
router.get('/paises', statsController.getPaises);
router.get('/posiciones', statsController.getPosiciones);
router.get('/jugador-posiciones', statsController.getJugadorPosiciones);
router.get('/tipos-estadistica', statsController.getTiposEstadistica);
router.get('/torneos', statsController.getTorneos);

// Rutas para DIM_TORNEO_JUGADOR
router.get('/torneo-jugadores', statsController.getTorneoJugadores);
router.get('/torneo-jugadores/:id', statsController.getTorneoJugadorPorId);
router.get('/torneo/:torneoId/jugadores', statsController.getJugadoresPorTorneo);
router.get('/equipo/:equipoId/jugadores', statsController.getJugadoresPorEquipo);
router.post('/torneo-jugadores', statsController.crearTorneoJugador);
router.put('/torneo-jugadores/:id', statsController.actualizarTorneoJugador);

// Rutas para hechos
router.get('/estadisticas', statsController.getEstadisticas);
router.get('/ganancias', statsController.getGanancias);
router.get('/jugadores-partido', statsController.getJugadoresPartido);
router.get('/modificaciones', statsController.getModificaciones);
router.get('/resultados', statsController.getResultados);
router.get('/torneo-jugadores-detalles', statsController.getTorneoJugadoresConDetalles);

//Rutas para ingresos
router.post('/jugadores', statsController.crearJugador);
router.post('/torneo-jugadores', statsController.asignarJugadorEquipoTorneo);

// Nuevas rutas para sustituciones
router.get('/partidos', sustitucionesController.getPartidos);
router.get('/partidos/:partidoId/equipos', sustitucionesController.getEquiposDelPartido);
router.get('/partidos/:partidoId/equipos/:equipoId/jugadores', sustitucionesController.getJugadoresDelEquipo);
router.post('/sustituciones', sustitucionesController.registrarSustitucion);

router.post('/test', (req, res) => {
    console.log('Datos recibidos:', req.body);
    res.json({ message: 'Test exitoso' });
  });

module.exports = router;