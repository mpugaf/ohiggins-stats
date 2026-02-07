// backend/routes/torneos.js - VERSIÓN COMPLETA CON ASIGNACIONES
console.log('📂 Cargando rutas de torneos...');

const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/auth');

console.log('📥 Importando controlador de torneos...');
let torneoController;
try {
  torneoController = require('../controllers/torneoController');
  console.log('✅ Controlador de torneos cargado correctamente');
} catch (error) {
  console.error('❌ Error cargando controlador de torneos:', error.message);
  throw error;
}

// Middleware para logging de rutas
router.use((req, res, next) => {
  console.log(`🏆 Torneos API: ${req.method} ${req.path}`);
  next();
});

// Verificar que las funciones del controlador existen
const verificarControlador = () => {
  const metodosBasicos = ['crearTorneo', 'obtenerTorneos', 'obtenerTorneoPorId', 'actualizarTorneo', 'eliminarTorneo', 'obtenerPaises'];
  const metodosAsignaciones = ['getAllTorneos', 'getJugadoresByTorneo', 'getEquiposByTorneo', 'getJugadoresByTorneoEquipo', 'asignarJugadorTorneoEquipo', 'removerJugadorTorneoEquipo'];
  
  const todosLosMetodos = [...metodosBasicos, ...metodosAsignaciones];
  
  for (const metodo of todosLosMetodos) {
    if (typeof torneoController[metodo] !== 'function') {
      console.warn(`⚠️ Método ${metodo} no encontrado en torneoController`);
    }
  }
  console.log('✅ Verificación del controlador de torneos completada');
};

verificarControlador();

// =============================================================================
// RUTAS PARA DATOS AUXILIARES
// =============================================================================

router.get('/data/paises', (req, res) => {
  console.log('GET /torneos/data/paises');
  torneoController.obtenerPaises(req, res);
});

// Obtener posiciones (para usuarios no-admin que leen el roster)
router.get('/data/positions', (req, res) => {
  console.log('GET /torneos/data/positions');
  const playersController = require('../controllers/playersController');
  playersController.getPositions(req, res);
});

// =============================================================================
// RUTAS BÁSICAS CRUD PARA TORNEOS
// =============================================================================

router.post('/', (req, res) => {
  console.log('POST /torneos');
  torneoController.crearTorneo(req, res);
});

router.get('/all', (req, res) => {
  console.log('GET /torneos/all');
  if (typeof torneoController.getAllTorneos === 'function') {
    torneoController.getAllTorneos(req, res);
  } else {
    console.error('❌ Función getAllTorneos no encontrada');
    res.status(500).json({ error: 'Función getAllTorneos no implementada' });
  }
});

router.get('/', (req, res) => {
  console.log('GET /torneos');
  torneoController.obtenerTorneos(req, res);
});

router.get('/:id', (req, res) => {
  console.log('GET /torneos/:id');
  // Verificar si es una ruta específica (números) vs rutas con nombres
  if (/^\d+$/.test(req.params.id)) {
    torneoController.obtenerTorneoPorId(req, res);
  } else {
    // Si no es un número, pasar al siguiente middleware
    next();
  }
});

router.put('/:id', (req, res) => {
  console.log('PUT /torneos/:id');
  torneoController.actualizarTorneo(req, res);
});

router.delete('/:id', (req, res) => {
  console.log('DELETE /torneos/:id');
  torneoController.eliminarTorneo(req, res);
});

// =============================================================================
// RUTAS PARA GESTIÓN DE ASIGNACIONES DE JUGADORES
// =============================================================================

// Obtener jugadores por torneo (incluyendo disponibles sin asignar)
router.get('/:torneoId/jugadores', (req, res) => {
  console.log(`GET /torneos/${req.params.torneoId}/jugadores`);
  if (typeof torneoController.getJugadoresByTorneo === 'function') {
    torneoController.getJugadoresByTorneo(req, res);
  } else {
    console.error('❌ Función getJugadoresByTorneo no encontrada');
    res.status(500).json({ error: 'Función getJugadoresByTorneo no implementada' });
  }
});

// Obtener equipos por torneo
router.get('/:torneoId/equipos', (req, res) => {
  console.log(`GET /torneos/${req.params.torneoId}/equipos`);
  if (typeof torneoController.getEquiposByTorneo === 'function') {
    torneoController.getEquiposByTorneo(req, res);
  } else {
    console.error('❌ Función getEquiposByTorneo no encontrada');
    res.status(500).json({ error: 'Función getEquiposByTorneo no implementada' });
  }
});

// Obtener jugadores específicos de un equipo en un torneo
router.get('/:torneoId/equipos/:equipoId/jugadores', (req, res) => {
  console.log(`GET /torneos/${req.params.torneoId}/equipos/${req.params.equipoId}/jugadores`);
  if (typeof torneoController.getJugadoresByTorneoEquipo === 'function') {
    torneoController.getJugadoresByTorneoEquipo(req, res);
  } else {
    console.error('❌ Función getJugadoresByTorneoEquipo no encontrada');
    res.status(500).json({ error: 'Función getJugadoresByTorneoEquipo no implementada' });
  }
});

// Asignar jugador a torneo y equipo
router.post('/asignaciones', (req, res) => {
  console.log('POST /torneos/asignaciones');
  if (typeof torneoController.asignarJugadorTorneoEquipo === 'function') {
    torneoController.asignarJugadorTorneoEquipo(req, res);
  } else {
    console.error('❌ Función asignarJugadorTorneoEquipo no encontrada');
    res.status(500).json({ error: 'Función asignarJugadorTorneoEquipo no implementada' });
  }
});

// RUTA CRÍTICA: Remover jugador de torneo-equipo
router.delete('/:torneoId/equipos/:equipoId/jugadores/:jugadorId', (req, res) => {
  console.log(`DELETE /torneos/${req.params.torneoId}/equipos/${req.params.equipoId}/jugadores/${req.params.jugadorId}`);
  if (typeof torneoController.removerJugadorTorneoEquipo === 'function') {
    torneoController.removerJugadorTorneoEquipo(req, res);
  } else {
    console.error('❌ Función removerJugadorTorneoEquipo no encontrada');
    res.status(500).json({ error: 'Función removerJugadorTorneoEquipo no implementada' });
  }
});

// Actualizar asignación completa (asignación + posiciones) - SOLO ADMIN
router.put('/:torneoId/equipos/:equipoId/jugadores/:jugadorId/completo', requireAdmin, (req, res) => {
  console.log(`PUT /torneos/${req.params.torneoId}/equipos/${req.params.equipoId}/jugadores/${req.params.jugadorId}/completo`);
  if (typeof torneoController.actualizarAsignacionCompleta === 'function') {
    torneoController.actualizarAsignacionCompleta(req, res);
  } else {
    console.error('❌ Función actualizarAsignacionCompleta no encontrada');
    res.status(500).json({ error: 'Función actualizarAsignacionCompleta no implementada' });
  }
});

// Actualizar asignación básica (solo campos de DIM_TORNEO_JUGADOR)
router.put('/:torneoId/equipos/:equipoId/jugadores/:jugadorId', (req, res) => {
  console.log(`PUT /torneos/${req.params.torneoId}/equipos/${req.params.equipoId}/jugadores/${req.params.jugadorId}`);
  if (typeof torneoController.actualizarAsignacion === 'function') {
    torneoController.actualizarAsignacion(req, res);
  } else {
    console.error('❌ Función actualizarAsignacion no encontrada');
    res.status(500).json({ error: 'Función actualizarAsignacion no implementada' });
  }
});

// =============================================================================
// RUTAS ADICIONALES (si existen)
// =============================================================================

// Obtener asignaciones de un jugador específico
router.get('/jugador/:jugadorId/asignaciones', (req, res) => {
  console.log(`GET /torneos/jugador/${req.params.jugadorId}/asignaciones`);
  if (typeof torneoController.getAsignacionesJugador === 'function') {
    torneoController.getAsignacionesJugador(req, res);
  } else {
    console.error('❌ Función getAsignacionesJugador no encontrada');
    res.status(500).json({ error: 'Función getAsignacionesJugador no implementada' });
  }
});

// Actualizar posiciones de jugador (si existe)
router.put('/jugador/:jugadorId/posiciones', (req, res) => {
  console.log(`PUT /torneos/jugador/${req.params.jugadorId}/posiciones`);
  if (typeof torneoController.actualizarPosicionesJugador === 'function') {
    torneoController.actualizarPosicionesJugador(req, res);
  } else {
    console.error('❌ Función actualizarPosicionesJugador no encontrada');
    res.status(500).json({ error: 'Función actualizarPosicionesJugador no implementada' });
  }
});

// =============================================================================
// MIDDLEWARE DE MANEJO DE ERRORES ESPECÍFICO PARA TORNEOS
// =============================================================================

router.use((err, req, res, next) => {
  console.error('❌ Error en rutas de torneos:', err);
  res.status(500).json({
    error: 'Error interno en el módulo de torneos',
    detalle: err.message,
    timestamp: new Date().toISOString()
  });
});

console.log('✅ Rutas de torneos configuradas correctamente');
console.log('📋 Rutas disponibles:');
console.log('   - GET /torneos/all');
console.log('   - GET /torneos/:torneoId/jugadores');
console.log('   - GET /torneos/:torneoId/equipos');
console.log('   - GET /torneos/:torneoId/equipos/:equipoId/jugadores');
console.log('   - POST /torneos/asignaciones');
console.log('   - DELETE /torneos/:torneoId/equipos/:equipoId/jugadores/:jugadorId');
console.log('   - PUT /torneos/:torneoId/equipos/:equipoId/jugadores/:jugadorId');

module.exports = router;