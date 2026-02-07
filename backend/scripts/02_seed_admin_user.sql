-- ==============================================================================
-- Script de Semilla: Usuario Administrador Inicial
-- O'Higgins Stats - Sistema de Apuestas Deportivas
-- ==============================================================================

-- Crear usuario administrador inicial
-- Username: admin
-- Password: admin123 (hash bcrypt con 10 rounds)
-- IMPORTANTE: Cambiar la contraseña después del primer login

INSERT INTO usuarios (username, email, password_hash, nombre_completo, role, puede_apostar, activo)
VALUES (
  'admin',
  'admin@ohiggins-stats.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- hash de 'password'
  'Administrador del Sistema',
  'admin',
  0, -- Los admins no pueden apostar
  1
)
ON DUPLICATE KEY UPDATE username = username;

-- Crear usuario de prueba
-- Username: usuario_test
-- Password: test123

INSERT INTO usuarios (username, email, password_hash, nombre_completo, role, puede_apostar, activo)
VALUES (
  'usuario_test',
  'test@ohiggins-stats.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- hash de 'password'
  'Usuario de Prueba',
  'usuario',
  1,
  1
)
ON DUPLICATE KEY UPDATE username = username;

-- ==============================================================================
-- Usuarios de prueba creados
-- Admin: admin / password
-- Usuario: usuario_test / password
-- IMPORTANTE: Cambiar estas contraseñas en producción
-- ==============================================================================
