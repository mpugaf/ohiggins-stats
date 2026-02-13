-- ==============================================================================
-- Script de Migración: Hacer Email Opcional en Tabla Usuarios
-- O'Higgins Stats - Sistema de Apuestas Deportivas
-- ==============================================================================

USE MP_DATA_DEV;

-- Modificar columna email para permitir NULL
-- El constraint UNIQUE en MySQL permite múltiples valores NULL por defecto
ALTER TABLE usuarios
  MODIFY COLUMN email VARCHAR(100) UNIQUE NULL;

-- Actualizar usuarios que tienen emails placeholder con NULL
-- (usuarios creados con el formato username@ohiggins.local)
UPDATE usuarios
SET email = NULL
WHERE email LIKE '%@ohiggins.local';

-- Verificar los cambios
SELECT
  id_usuario,
  username,
  email,
  nombre_completo,
  role
FROM usuarios
ORDER BY id_usuario;

-- Mensaje de confirmación
SELECT 'Migración completada: campo email ahora es opcional' AS status;
