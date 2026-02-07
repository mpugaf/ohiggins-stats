-- ==============================================================================
-- Script para agregar campo de imagen/insignia a equipos
-- O'Higgins Stats - Sistema de Gestión de Equipos
-- ==============================================================================

USE MP_DATA_DEV;

-- Agregar campo imagen a la tabla DIM_EQUIPO
ALTER TABLE DIM_EQUIPO
ADD COLUMN IMAGEN VARCHAR(255) DEFAULT 'default-team.png' COMMENT 'Ruta de la imagen/insignia del equipo';

-- Comentario de la tabla actualizado
ALTER TABLE DIM_EQUIPO COMMENT = 'Tabla de dimensión de equipos con información de insignias';

-- Verificar el cambio
DESCRIBE DIM_EQUIPO;

-- Mostrar algunos registros
SELECT ID_EQUIPO, NOMBRE, IMAGEN FROM DIM_EQUIPO LIMIT 10;

COMMIT;
