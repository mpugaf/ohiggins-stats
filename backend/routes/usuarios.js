const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Middleware de logging
router.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
});

// Verificar que el controlador esté correctamente importado
if (!usuariosController || typeof usuariosController !== 'object') {
    console.error('ERROR: usuariosController no fue importado correctamente');
}

// Todas las rutas requieren autenticación y rol de administrador
router.use(authenticateToken);
router.use(requireAdmin);

// GET /api/usuarios - Listar todos los usuarios
router.get('/', (req, res) => {
    console.log('Procesando GET /api/usuarios');
    if (typeof usuariosController.getAllUsuarios !== 'function') {
        console.error('ERROR: getAllUsuarios no es una función');
        return res.status(500).json({ error: 'Controlador no configurado correctamente' });
    }
    usuariosController.getAllUsuarios(req, res);
});

// GET /api/usuarios/:id - Obtener usuario por ID
router.get('/:id', (req, res) => {
    console.log(`Procesando GET /api/usuarios/${req.params.id}`);
    if (typeof usuariosController.getUsuarioById !== 'function') {
        console.error('ERROR: getUsuarioById no es una función');
        return res.status(500).json({ error: 'Controlador no configurado correctamente' });
    }
    usuariosController.getUsuarioById(req, res);
});

// POST /api/usuarios - Crear nuevo usuario
router.post('/', (req, res) => {
    console.log('Procesando POST /api/usuarios');
    console.log('Body:', req.body);
    if (typeof usuariosController.createUsuario !== 'function') {
        console.error('ERROR: createUsuario no es una función');
        return res.status(500).json({ error: 'Controlador no configurado correctamente' });
    }
    usuariosController.createUsuario(req, res);
});

// DELETE /api/usuarios/:id - Eliminar usuario
router.delete('/:id', (req, res) => {
    console.log(`Procesando DELETE /api/usuarios/${req.params.id}`);
    if (typeof usuariosController.deleteUsuario !== 'function') {
        console.error('ERROR: deleteUsuario no es una función');
        return res.status(500).json({ error: 'Controlador no configurado correctamente' });
    }
    usuariosController.deleteUsuario(req, res);
});

// PATCH /api/usuarios/:id/toggle-activo - Activar/Desactivar usuario
router.patch('/:id/toggle-activo', (req, res) => {
    console.log(`Procesando PATCH /api/usuarios/${req.params.id}/toggle-activo`);
    if (typeof usuariosController.toggleUsuarioActivo !== 'function') {
        console.error('ERROR: toggleUsuarioActivo no es una función');
        return res.status(500).json({ error: 'Controlador no configurado correctamente' });
    }
    usuariosController.toggleUsuarioActivo(req, res);
});

module.exports = router;
