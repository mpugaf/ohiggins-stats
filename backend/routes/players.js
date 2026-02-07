// backend/routes/players.js
console.log('📂 Cargando rutas de jugadores...');

const express = require('express');
const router = express.Router();

console.log('📥 Importando controlador de jugadores...');
let playersController;
try {
  playersController = require('../controllers/playersController');
  console.log('✅ Controlador de jugadores cargado correctamente');
} catch (error) {
  console.error('❌ Error cargando controlador de jugadores:', error.message);
  throw error;
}

// Middleware para logging de rutas
router.use((req, res, next) => {
  console.log(`👥 Players API: ${req.method} ${req.path}`);
  next();
});

// Verificar que las funciones del controlador existen
const verificarControlador = () => {
  const metodos = [
    'getAllPlayers', 
    'getPlayerById', 
    'createPlayer', 
    'updatePlayer', 
    'deletePlayer',
    'getCountries',
    'getPositions'
  ];
  
  for (const metodo of metodos) {
    if (typeof playersController[metodo] !== 'function') {
      throw new Error(`Método ${metodo} no encontrado en playersController`);
    }
  }
  console.log('✅ Todos los métodos del controlador de jugadores verificados');
};

verificarControlador();

// ===============================================
// RUTAS DE DATOS DE APOYO (DEBEN IR PRIMERO)
// ===============================================

// Obtener países para nacionalidades
router.get('/data/countries', (req, res) => {
  console.log('GET /players/data/countries');
  playersController.getCountries(req, res);
});

// Obtener posiciones disponibles
router.get('/data/positions', (req, res) => {
  console.log('GET /players/data/positions');
  playersController.getPositions(req, res);
});

// ===============================================
// RUTAS PRINCIPALES DE JUGADORES
// ===============================================

// Obtener todos los jugadores
router.get('/', (req, res) => {
  console.log('GET /players');
  playersController.getAllPlayers(req, res);
});

// Obtener jugador por ID
router.get('/:id', (req, res) => {
  console.log('GET /players/:id');
  playersController.getPlayerById(req, res);
});

// Crear nuevo jugador
router.post('/', (req, res) => {
  console.log('POST /players');
  playersController.createPlayer(req, res);
});

// Actualizar jugador
router.put('/:id', (req, res) => {
  console.log('PUT /players/:id');
  playersController.updatePlayer(req, res);
});

// Eliminar jugador
router.delete('/:id', (req, res) => {
  console.log('DELETE /players/:id');
  playersController.deletePlayer(req, res);
});

console.log('✅ Rutas de jugadores configuradas correctamente');

module.exports = router;