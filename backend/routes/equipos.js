// backend/routes/equipos.js
console.log('📂 Cargando rutas de equipos...');

const express = require('express');
const router = express.Router();

console.log('📥 Importando controlador de equipos...');
let equipoController;
try {
  equipoController = require('../controllers/equipoController');
  console.log('✅ Controlador de equipos cargado correctamente');
} catch (error) {
  console.error('❌ Error cargando controlador de equipos:', error.message);
  throw error;
}

// Middleware para logging de rutas
router.use((req, res, next) => {
  console.log(`⚽ Equipos API: ${req.method} ${req.path}`);
  next();
});

// Verificar que las funciones del controlador existen
const verificarControlador = () => {
  const metodos = ['crearEquipo', 'obtenerEquipos', 'obtenerEquipoPorId', 'actualizarEquipo', 'eliminarEquipo'];
  
  for (const metodo of metodos) {
    if (typeof equipoController[metodo] !== 'function') {
      throw new Error(`Método ${metodo} no encontrado en equipoController`);
    }
  }
  console.log('✅ Todos los métodos del controlador de equipos verificados');
};

verificarControlador();

// Rutas para equipos
router.post('/', (req, res) => {
  console.log('POST /equipos');
  equipoController.crearEquipo(req, res);
});

router.get('/', (req, res) => {
  console.log('GET /equipos');
  equipoController.obtenerEquipos(req, res);
});

router.get('/:id', (req, res) => {
  console.log('GET /equipos/:id');
  equipoController.obtenerEquipoPorId(req, res);
});

router.put('/:id', (req, res) => {
  console.log('PUT /equipos/:id');
  equipoController.actualizarEquipo(req, res);
});

router.delete('/:id', (req, res) => {
  console.log('DELETE /equipos/:id');
  equipoController.eliminarEquipo(req, res);
});

console.log('✅ Rutas de equipos configuradas correctamente');

module.exports = router;