-- Script para permitir valores NULL en columnas de goles
-- Esto es necesario para partidos programados que aún no se han jugado

USE MP_DATA_DEV;

-- Modificar columna GOLES_LOCAL para permitir NULL
ALTER TABLE HECHOS_RESULTADOS
MODIFY COLUMN GOLES_LOCAL INT DEFAULT NULL;

-- Modificar columna GOLES_VISITA para permitir NULL
ALTER TABLE HECHOS_RESULTADOS
MODIFY COLUMN GOLES_VISITA INT DEFAULT NULL;

-- Verificar los cambios
DESCRIBE HECHOS_RESULTADOS;

SELECT
    'Script ejecutado exitosamente' as mensaje,
    'Las columnas GOLES_LOCAL y GOLES_VISITA ahora permiten NULL' as detalle;
