-- ==============================================================================
-- Script para insertar cuotas de ejemplo en la Fecha 1 temporada 2026
-- ==============================================================================

-- Limpiar cuotas existentes de estos partidos
DELETE FROM cuotas_partidos WHERE id_partido IN (222, 223, 224, 225, 226, 227, 228, 229);

-- Partido 1: UNIVERSIDAD DE CHILE vs AUDAX ITALIANO (ID: 223)
-- U de Chile es favorito local
INSERT INTO cuotas_partidos (id_partido, tipo_resultado, id_equipo, cuota_decimal, activa) VALUES
(223, 'local', (SELECT ID_EQUIPO FROM DIM_EQUIPO WHERE NOMBRE = 'UNIVERSIDAD DE CHILE'), 1.75, 1),
(223, 'empate', NULL, 3.20, 1),
(223, 'visita', (SELECT ID_EQUIPO FROM DIM_EQUIPO WHERE NOMBRE = 'AUDAX ITALIANO'), 4.50, 1);

-- Partido 2: CD LIMACHE vs COLO COLO (ID: 222)
-- Colo Colo es favorito visitante
INSERT INTO cuotas_partidos (id_partido, tipo_resultado, id_equipo, cuota_decimal, activa) VALUES
(222, 'local', (SELECT ID_EQUIPO FROM DIM_EQUIPO WHERE NOMBRE = 'CD LIMACHE'), 5.00, 1),
(222, 'empate', NULL, 3.80, 1),
(222, 'visita', (SELECT ID_EQUIPO FROM DIM_EQUIPO WHERE NOMBRE = 'COLO COLO'), 1.55, 1);

-- Partido 3: UNIVERSIDAD DE CONCEPCIÓN vs COQUIMBO UNIDO (ID: 224)
-- Partido parejo
INSERT INTO cuotas_partidos (id_partido, tipo_resultado, id_equipo, cuota_decimal, activa) VALUES
(224, 'local', (SELECT ID_EQUIPO FROM DIM_EQUIPO WHERE NOMBRE = 'UNIVERSIDAD DE CONCEPCIÓN'), 2.40, 1),
(224, 'empate', NULL, 3.00, 1),
(224, 'visita', (SELECT ID_EQUIPO FROM DIM_EQUIPO WHERE NOMBRE = 'COQUIMBO UNIDO'), 2.90, 1);

-- Partido 4: COBRESAL vs HUACHIPATO (ID: 225)
-- Cobresal favorito local
INSERT INTO cuotas_partidos (id_partido, tipo_resultado, id_equipo, cuota_decimal, activa) VALUES
(225, 'local', (SELECT ID_EQUIPO FROM DIM_EQUIPO WHERE NOMBRE = 'COBRESAL'), 1.95, 1),
(225, 'empate', NULL, 3.10, 1),
(225, 'visita', (SELECT ID_EQUIPO FROM DIM_EQUIPO WHERE NOMBRE = 'HUACHIPATO'), 3.60, 1);

-- Partido 5: LA SERENA vs UNIVERSIDAD CATÓLICA (ID: 226)
-- UC favorito visitante
INSERT INTO cuotas_partidos (id_partido, tipo_resultado, id_equipo, cuota_decimal, activa) VALUES
(226, 'local', (SELECT ID_EQUIPO FROM DIM_EQUIPO WHERE NOMBRE = 'LA SERENA'), 4.20, 1),
(226, 'empate', NULL, 3.40, 1),
(226, 'visita', (SELECT ID_EQUIPO FROM DIM_EQUIPO WHERE NOMBRE = 'UNIVERSIDAD CATÓLICA'), 1.70, 1);

-- Partido 6: PALESTINO vs ÑUBLENSE (ID: 227)
-- Partido parejo
INSERT INTO cuotas_partidos (id_partido, tipo_resultado, id_equipo, cuota_decimal, activa) VALUES
(227, 'local', (SELECT ID_EQUIPO FROM DIM_EQUIPO WHERE NOMBRE = 'PALESTINO'), 2.20, 1),
(227, 'empate', NULL, 3.15, 1),
(227, 'visita', (SELECT ID_EQUIPO FROM DIM_EQUIPO WHERE NOMBRE = 'ÑUBLENSE'), 3.10, 1);

-- Partido 7: EVERTON vs UNIÓN LA CALERA (ID: 228)
-- Everton favorito local
INSERT INTO cuotas_partidos (id_partido, tipo_resultado, id_equipo, cuota_decimal, activa) VALUES
(228, 'local', (SELECT ID_EQUIPO FROM DIM_EQUIPO WHERE NOMBRE = 'EVERTON'), 2.00, 1),
(228, 'empate', NULL, 3.05, 1),
(228, 'visita', (SELECT ID_EQUIPO FROM DIM_EQUIPO WHERE NOMBRE = 'UNIÓN LA CALERA'), 3.50, 1);

-- Partido 8: O'HIGGINS vs CLUB SOCIAL Y DE DEPORTES CONCEPCIÓN (ID: 229)
-- O'Higgins favorito local
INSERT INTO cuotas_partidos (id_partido, tipo_resultado, id_equipo, cuota_decimal, activa) VALUES
(229, 'local', (SELECT ID_EQUIPO FROM DIM_EQUIPO WHERE NOMBRE = 'O\'HIGGINS'), 1.80, 1),
(229, 'empate', NULL, 3.25, 1),
(229, 'visita', (SELECT ID_EQUIPO FROM DIM_EQUIPO WHERE NOMBRE = 'CLUB SOCIAL Y DE DEPORTES CONCEPCIÓN'), 4.00, 1);

-- Verificar cuotas insertadas
SELECT
    p.ID_PARTIDO,
    CONCAT(el.NOMBRE, ' vs ', ev.NOMBRE) as partido,
    c.tipo_resultado,
    c.cuota_decimal
FROM cuotas_partidos c
INNER JOIN HECHOS_RESULTADOS p ON c.id_partido = p.ID_PARTIDO
INNER JOIN DIM_EQUIPO el ON p.ID_EQUIPO_LOCAL = el.ID_EQUIPO
INNER JOIN DIM_EQUIPO ev ON p.ID_EQUIPO_VISITA = ev.ID_EQUIPO
WHERE p.NUMERO_JORNADA = 1
ORDER BY p.ID_PARTIDO,
    CASE c.tipo_resultado WHEN 'local' THEN 1 WHEN 'empate' THEN 2 WHEN 'visita' THEN 3 END;

-- ==============================================================================
-- Script ejecutado exitosamente
-- ==============================================================================
