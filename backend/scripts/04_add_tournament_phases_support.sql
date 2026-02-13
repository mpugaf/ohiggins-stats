-- Script para agregar soporte de torneos con fases (en lugar de ruedas)
-- Ejemplos: Copa Libertadores (fases: grupos, octavos, cuartos, semis, final)
--           Mundial FIFA (fases: grupos, octavos, cuartos, semis, tercer lugar, final)

USE MP_DATA_DEV;

-- 1. Agregar campo para diferenciar formato de torneo (ruedas vs fases)
ALTER TABLE DIM_TORNEO
ADD COLUMN FORMATO_TORNEO ENUM('RUEDAS', 'FASES') NOT NULL DEFAULT 'RUEDAS'
AFTER RUEDA;

-- 2. Hacer que el campo RUEDA sea nullable (cuando el torneo es por fases)
ALTER TABLE DIM_TORNEO
MODIFY COLUMN RUEDA ENUM('PRIMERA','SEGUNDA','UNICA') NULL;

-- 3. Crear tabla para las fases de torneos
CREATE TABLE IF NOT EXISTS DIM_FASE_TORNEO (
    ID_FASE INT AUTO_INCREMENT PRIMARY KEY,
    ID_TORNEO INT NOT NULL,
    NOMBRE_FASE VARCHAR(50) NOT NULL,
    ORDEN INT NOT NULL COMMENT 'Orden de la fase en el torneo (1, 2, 3...)',
    DESCRIPCION TEXT NULL,
    FECHA_INICIO DATE NULL,
    FECHA_FIN DATE NULL,
    FECHA_CREACION TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Foreign key
    CONSTRAINT FK_FASE_TORNEO FOREIGN KEY (ID_TORNEO)
        REFERENCES DIM_TORNEO(ID_TORNEO) ON DELETE CASCADE,

    -- Unicidad: No puede haber dos fases con el mismo nombre en el mismo torneo
    CONSTRAINT UQ_FASE_TORNEO UNIQUE (ID_TORNEO, NOMBRE_FASE),

    -- Index para mejorar consultas
    INDEX IDX_TORNEO_ORDEN (ID_TORNEO, ORDEN)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Fases de torneos (grupos, octavos, cuartos, etc.)';

-- 4. Agregar campo FASE a la tabla HECHOS_RESULTADOS (partidos)
ALTER TABLE HECHOS_RESULTADOS
ADD COLUMN ID_FASE INT NULL
AFTER FECHA_TORNEO,
ADD CONSTRAINT FK_PARTIDO_FASE FOREIGN KEY (ID_FASE)
    REFERENCES DIM_FASE_TORNEO(ID_FASE) ON DELETE SET NULL;

-- 5. Actualizar torneos existentes: establecer formato RUEDAS para todos los actuales
UPDATE DIM_TORNEO SET FORMATO_TORNEO = 'RUEDAS';

-- 6. Agregar check constraint para validar que:
--    - Si FORMATO_TORNEO = 'RUEDAS', entonces RUEDA debe estar definida
--    - Si FORMATO_TORNEO = 'FASES', entonces RUEDA debe ser NULL
-- Nota: MySQL 5.7 no soporta CHECK constraints, se valida en aplicación

-- 7. Insertar fases comunes predefinidas (opcional, para facilitar creación de torneos)
-- Estas son plantillas que se pueden usar al crear torneos
CREATE TABLE IF NOT EXISTS DIM_PLANTILLA_FASE (
    ID_PLANTILLA INT AUTO_INCREMENT PRIMARY KEY,
    TIPO_TORNEO VARCHAR(50) NOT NULL COMMENT 'Ej: LIBERTADORES, MUNDIAL, COPA_NACIONAL',
    NOMBRE_FASE VARCHAR(50) NOT NULL,
    ORDEN INT NOT NULL,
    DESCRIPCION TEXT NULL,

    CONSTRAINT UQ_PLANTILLA_FASE UNIQUE (TIPO_TORNEO, NOMBRE_FASE)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Plantillas de fases para diferentes tipos de torneos';

-- Insertar plantillas comunes
INSERT INTO DIM_PLANTILLA_FASE (TIPO_TORNEO, NOMBRE_FASE, ORDEN, DESCRIPCION) VALUES
-- Copa Libertadores / Sudamericana
('COPA_CONMEBOL', 'Fase de Grupos', 1, 'Primera fase, todos contra todos'),
('COPA_CONMEBOL', 'Octavos de Final', 2, 'Eliminación directa'),
('COPA_CONMEBOL', 'Cuartos de Final', 3, 'Eliminación directa'),
('COPA_CONMEBOL', 'Semifinales', 4, 'Eliminación directa'),
('COPA_CONMEBOL', 'Final', 5, 'Partido definitorio'),

-- Mundial FIFA
('MUNDIAL_FIFA', 'Fase de Grupos', 1, 'Primera ronda, todos contra todos'),
('MUNDIAL_FIFA', 'Octavos de Final', 2, 'Eliminación directa'),
('MUNDIAL_FIFA', 'Cuartos de Final', 3, 'Eliminación directa'),
('MUNDIAL_FIFA', 'Semifinales', 4, 'Eliminación directa'),
('MUNDIAL_FIFA', 'Tercer Lugar', 5, 'Partido por el tercer puesto'),
('MUNDIAL_FIFA', 'Final', 6, 'Partido definitorio'),

-- Copa Nacional
('COPA_NACIONAL', 'Primera Ronda', 1, 'Primera fase de eliminación'),
('COPA_NACIONAL', 'Segunda Ronda', 2, 'Segunda fase de eliminación'),
('COPA_NACIONAL', 'Octavos de Final', 3, 'Eliminación directa'),
('COPA_NACIONAL', 'Cuartos de Final', 4, 'Eliminación directa'),
('COPA_NACIONAL', 'Semifinales', 5, 'Eliminación directa'),
('COPA_NACIONAL', 'Final', 6, 'Partido definitorio');

-- 8. Crear vista para obtener torneos con su información completa
CREATE OR REPLACE VIEW vw_torneos_completos AS
SELECT
    t.ID_TORNEO,
    t.LEAGUE_ID_FBR,
    t.NOMBRE,
    t.TEMPORADA,
    t.PAIS_ORGANIZADOR,
    t.RUEDA,
    t.FORMATO_TORNEO,
    p.NOMBRE AS PAIS_NOMBRE,
    p.CODIGO_FIFA AS PAIS_CODIGO,
    -- Concatenar información de rueda o fase
    CASE
        WHEN t.FORMATO_TORNEO = 'RUEDAS' THEN
            CONCAT(t.NOMBRE, ' - ', t.TEMPORADA, ' (', t.RUEDA, ')')
        WHEN t.FORMATO_TORNEO = 'FASES' THEN
            CONCAT(t.NOMBRE, ' - ', t.TEMPORADA)
        ELSE
            CONCAT(t.NOMBRE, ' - ', t.TEMPORADA)
    END AS NOMBRE_COMPLETO
FROM DIM_TORNEO t
LEFT JOIN DIM_PAIS p ON t.PAIS_ORGANIZADOR = p.ID_PAIS;

-- Verificación
SELECT 'Script ejecutado correctamente. Verificando cambios...' AS Mensaje;

-- Mostrar estructura actualizada
DESCRIBE DIM_TORNEO;
DESCRIBE DIM_FASE_TORNEO;

-- Mostrar torneos con el nuevo campo
SELECT ID_TORNEO, NOMBRE, TEMPORADA, FORMATO_TORNEO, RUEDA
FROM DIM_TORNEO
ORDER BY ID_TORNEO DESC
LIMIT 5;
