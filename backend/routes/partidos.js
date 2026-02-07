// backend/routes/partidos.js
console.log('📂 Cargando rutas de partidos...');

const express = require('express');
const router = express.Router();

console.log('📥 Importando controlador de partidos...');
let partidoController;
try {
  partidoController = require('../controllers/partidoController');
  console.log('✅ Controlador de partidos cargado correctamente');
} catch (error) {
  console.error('❌ Error cargando controlador de partidos:', error.message);
  throw error;
}

// Middleware para logging de rutas
router.use((req, res, next) => {
  console.log(`⚽ Partidos API: ${req.method} ${req.path}`);
  next();
});

// Verificar que las funciones del controlador existen
const verificarControlador = () => {
  const metodos = [
    'crearPartido', 
    'obtenerPartidos', 
    'obtenerPartidoPorId', 
    'actualizarPartido', 
    'eliminarPartido',
    'obtenerTorneos',
    'obtenerEquipos',
    'obtenerEstadios'
  ];
  
  for (const metodo of metodos) {
    if (typeof partidoController[metodo] !== 'function') {
      throw new Error(`Método ${metodo} no encontrado en partidoController`);
    }
  }
  console.log('✅ Todos los métodos del controlador de partidos verificados');
};

verificarControlador();

// Rutas para datos auxiliares
router.get('/data/torneos', (req, res) => {
  console.log('GET /partidos/data/torneos');
  partidoController.obtenerTorneos(req, res);
});

router.get('/data/equipos', (req, res) => {
  console.log('GET /partidos/data/equipos');
  partidoController.obtenerEquipos(req, res);
});

router.get('/data/estadios', (req, res) => {
  console.log('GET /partidos/data/estadios');
  partidoController.obtenerEstadios(req, res);
});

// Rutas principales para partidos
router.post('/', (req, res) => {
  console.log('POST /partidos');
  partidoController.crearPartido(req, res);
});

router.get('/', (req, res) => {
  console.log('GET /partidos');
  partidoController.obtenerPartidos(req, res);
});

router.get('/:id', (req, res) => {
  console.log('GET /partidos/:id');
  partidoController.obtenerPartidoPorId(req, res);
});

router.put('/:id', (req, res) => {
  console.log('PUT /partidos/:id');
  partidoController.actualizarPartido(req, res);
});

router.delete('/:id', (req, res) => {
  console.log('DELETE /partidos/:id');
  partidoController.eliminarPartido(req, res);
});

console.log('✅ Rutas de partidos configuradas correctamente');

module.exports = router;