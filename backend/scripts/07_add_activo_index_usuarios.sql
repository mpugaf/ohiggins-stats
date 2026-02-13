-- Script para asegurar que el campo 'activo' de la tabla usuarios tenga índice
-- Este campo controla si un usuario aparece en los rankings

-- 1. Verificar estructura actual
SELECT 'Estructura actual de la tabla usuarios:' as mensaje;
DESCRIBE usuarios;

-- 2. Agregar índice al campo 'activo' si no existe (para mejorar performance en filtros)
ALTER TABLE usuarios
ADD INDEX IF NOT EXISTS idx_activo (activo);

-- 3. Verificar usuarios actuales y su estado
SELECT 'Usuarios y su estado activo:' as mensaje;
SELECT
    id_usuario,
    username,
    nombre_completo,
    role,
    activo,
    CASE
        WHEN activo = 1 THEN 'VISIBLE EN RANKINGS'
        ELSE 'OCULTO EN RANKINGS'
    END as estado_ranking
FROM usuarios
ORDER BY activo DESC, username;

-- 4. Mensaje informativo
SELECT 'Campo "activo" configurado correctamente:' as mensaje;
SELECT '- activo = 1: Usuario visible en rankings' as info;
SELECT '- activo = 0: Usuario oculto en rankings' as info;
