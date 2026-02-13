const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/auth/register
 * Registro de nuevo usuario
 */
router.post('/register',
  [
    body('username')
      .trim()
      .isLength({ min: 3, max: 50 })
      .withMessage('Username debe tener entre 3 y 50 caracteres')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username solo puede contener letras, números y guiones bajos'),
    body('email')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Email inválido'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password debe tener al menos 6 caracteres'),
    body('nombre_completo')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Nombre completo no puede exceder 100 caracteres')
  ],
  authController.register
);

/**
 * POST /api/auth/login
 * Login de usuario
 */
router.post('/login', authController.login);

/**
 * GET /api/auth/profile
 * Obtener perfil del usuario autenticado
 * Requiere autenticación
 */
router.get('/profile', authenticateToken, authController.getProfile);

/**
 * PUT /api/auth/cambiar-password
 * Cambiar contraseña del usuario autenticado
 * Requiere autenticación
 */
router.put('/cambiar-password', authenticateToken, authController.cambiarPassword);

module.exports = router;
