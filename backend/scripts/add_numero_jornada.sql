-- Script para agregar campo NUMERO_JORNADA a la tabla HECHOS_RESULTADOS
-- Fecha: 2026-01-24
-- Descripción: Agrega el número de jornada/fecha del torneo a cada partido

USE MP_DATA_DEV;

-- Agregar el campo NUMERO_JORNADA después de FECHA_TORNEO
ALTER TABLE HECHOS_RESULTADOS
ADD COLUMN NUMERO_JORNADA INT(11) NULL DEFAULT NULL COMMENT 'Número de jornada/fecha del torneo (ej: 1, 2, 3...)'
AFTER FECHA_TORNEO;

-- Crear índice para consultas por jornada
CREATE INDEX idx_numero_jornada ON HECHOS_RESULTADOS(ID_TORNEO, NUMERO_JORNADA);

-- Verificar la estructura actualizada
DESCRIBE HECHOS_RESULTADOS;

SELECT 'Campo NUMERO_JORNADA agregado exitosamente' AS resultado;
