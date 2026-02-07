-- ==============================================================================
-- Script para actualizar imágenes de equipos
-- Generado automáticamente basado en archivos disponibles
-- ==============================================================================

USE MP_DATA_DEV;

-- Primero, agregar la columna IMAGEN si no existe
ALTER TABLE DIM_EQUIPO
ADD COLUMN IF NOT EXISTS IMAGEN VARCHAR(255) DEFAULT 'default-team.png' COMMENT 'Ruta de la imagen/insignia del equipo';

-- Actualizar equipos con sus respectivas imágenes
UPDATE DIM_EQUIPO SET IMAGEN = 'audax.png' WHERE NOMBRE LIKE '%AUDAX%';
UPDATE DIM_EQUIPO SET IMAGEN = 'cobresal.png' WHERE NOMBRE LIKE '%COBRESAL%';
UPDATE DIM_EQUIPO SET IMAGEN = 'colocolo.png' WHERE NOMBRE LIKE '%COLO COLO%';
UPDATE DIM_EQUIPO SET IMAGEN = 'concepcion.png' WHERE NOMBRE LIKE '%CONCEPCIÓN%' AND NOMBRE NOT LIKE '%UNIVERSIDAD%';
UPDATE DIM_EQUIPO SET IMAGEN = 'coquimbo.png' WHERE NOMBRE LIKE '%COQUIMBO%';
UPDATE DIM_EQUIPO SET IMAGEN = 'everton.png' WHERE NOMBRE LIKE '%EVERTON%';
UPDATE DIM_EQUIPO SET IMAGEN = 'huachipato.png' WHERE NOMBRE LIKE '%HUACHIPATO%';
UPDATE DIM_EQUIPO SET IMAGEN = 'lacalera.png' WHERE NOMBRE LIKE '%LA CALERA%';
UPDATE DIM_EQUIPO SET IMAGEN = 'laserena.png' WHERE NOMBRE LIKE '%LA SERENA%';
UPDATE DIM_EQUIPO SET IMAGEN = 'limache.png' WHERE NOMBRE LIKE '%LIMACHE%';
UPDATE DIM_EQUIPO SET IMAGEN = 'nublense.png' WHERE NOMBRE LIKE '%ÑUBLENSE%' OR NOMBRE LIKE '%NUBLENSE%';
UPDATE DIM_EQUIPO SET IMAGEN = 'ohiggins.png' WHERE NOMBRE LIKE '%O''HIGGINS%' OR NOMBRE LIKE '%OHIGGINS%';
UPDATE DIM_EQUIPO SET IMAGEN = 'palestino.png' WHERE NOMBRE LIKE '%PALESTINO%';
UPDATE DIM_EQUIPO SET IMAGEN = 'ucatolica.png' WHERE NOMBRE LIKE '%UNIVERSIDAD CATÓLICA%' OR NOMBRE LIKE '%CATÓLICA%';
UPDATE DIM_EQUIPO SET IMAGEN = 'udechile.png' WHERE NOMBRE LIKE '%UNIVERSIDAD DE CHILE%' AND NOMBRE NOT LIKE '%CONCEPCIÓN%';
UPDATE DIM_EQUIPO SET IMAGEN = 'udeconce.png' WHERE NOMBRE LIKE '%UNIVERSIDAD DE CONCEPCIÓN%';

-- Verificar resultados
SELECT
    ID_EQUIPO,
    NOMBRE,
    IMAGEN,
    CASE
        WHEN IMAGEN = 'default-team.png' THEN '⚠️  Sin imagen'
        ELSE '✅ Con imagen'
    END as Estado
FROM DIM_EQUIPO
ORDER BY NOMBRE;

-- Estadísticas
SELECT
    COUNT(*) as total_equipos,
    SUM(CASE WHEN IMAGEN != 'default-team.png' AND IMAGEN IS NOT NULL THEN 1 ELSE 0 END) as con_imagen,
    SUM(CASE WHEN IMAGEN = 'default-team.png' OR IMAGEN IS NULL THEN 1 ELSE 0 END) as sin_imagen
FROM DIM_EQUIPO;

COMMIT;
