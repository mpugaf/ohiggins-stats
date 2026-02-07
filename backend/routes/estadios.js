// backend/routes/estadios.js
console.log('📂 Cargando rutas de estadios...');

const express = require('express');
const router = express.Router();

console.log('📥 Importando controlador...');
const estadioController = require('../controllers/estadioController');

console.log('🔍 Verificando controlador:', typeof estadioController);
console.log('🔍 Métodos disponibles:', Object.keys(estadioController));

// Verificar que cada función existe
const metodos = ['crearEstadio', 'obtenerEstadios', 'obtenerEstadioPorId', 'actualizarEstadio', 'eliminarEstadio'];
metodos.forEach(metodo => {
  console.log(`🔍 ${metodo}:`, typeof estadioController[metodo]);
});

// Rutas de estadios
console.log('🛣️ Configurando rutas...');

router.post('/', (req, res) => {
  console.log('POST /estadios');
  estadioController.crearEstadio(req, res);
});

router.get('/', (req, res) => {
  console.log('GET /estadios');
  estadioController.obtenerEstadios(req, res);
});

router.get('/:id', (req, res) => {
  console.log('GET /estadios/:id');
  estadioController.obtenerEstadioPorId(req, res);
});

router.put('/:id', (req, res) => {
  console.log('PUT /estadios/:id');
  estadioController.actualizarEstadio(req, res);
});

router.delete('/:id', (req, res) => {
  console.log('DELETE /estadios/:id');
  estadioController.eliminarEstadio(req, res);
});

console.log('✅ Rutas de estadios configuradas correctamente');

module.exports = router;