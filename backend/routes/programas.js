const express = require('express');
const router = express.Router();
const programasController = require('../controllers/programasController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Logging middleware
router.use((req, res, next) => {
  console.log(`[PROGRAMAS] ${req.method} ${req.path}`);
  next();
});

// Rutas públicas/autenticadas (cualquier usuario puede ver programas)
router.get('/', authenticateToken, programasController.obtenerProgramas);
router.get('/:id', authenticateToken, programasController.obtenerProgramaPorId);
router.get('/:id/usuarios', authenticateToken, programasController.obtenerUsuariosPorPrograma);

// Rutas solo admin
router.post('/', authenticateToken, requireAdmin, programasController.crearPrograma);
router.put('/:id', authenticateToken, requireAdmin, programasController.actualizarPrograma);
router.delete('/:id', authenticateToken, requireAdmin, programasController.eliminarPrograma);

module.exports = router;
