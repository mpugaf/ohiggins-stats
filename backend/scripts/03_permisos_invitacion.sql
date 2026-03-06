-- =============================================================
-- Script: 03_permisos_invitacion.sql
-- Descripcion: Tabla para asignar permisos de invitacion
--              a usuarios existentes (sin alterar tablas actuales)
-- Ejecutar en Railway (o cualquier MySQL 5.7+)
-- =============================================================

-- 1. CREAR TABLA NUEVA (no toca ninguna tabla existente)
CREATE TABLE IF NOT EXISTS permisos_invitacion (
  id_usuario       INT          NOT NULL,
  id_token         INT          NULL,
  habilitado       TINYINT(1)   NOT NULL DEFAULT 1,
  fecha_asignacion TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_usuario),
  CONSTRAINT fk_pi_usuario FOREIGN KEY (id_usuario)
    REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  CONSTRAINT fk_pi_token FOREIGN KEY (id_token)
    REFERENCES tokens_invitacion(id_token) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================================
-- CONSULTAS DE REFERENCIA (no ejecutar, solo documentacion)
-- =============================================================

-- Q1: Listar usuarios tipo "usuario" ordenados por puntos,
--     con su estado de permiso e informacion del token asignado
/*
SELECT
  u.id_usuario,
  u.username,
  u.nombre_completo,
  COALESCE(r.total_puntos, 0)   AS total_puntos,
  COALESCE(r.total_apuestas, 0) AS total_apuestas,
  pi.habilitado,
  pi.id_token,
  pi.fecha_asignacion,
  ti.token,
  ti.usado,
  ti.fecha_expiracion
FROM usuarios u
LEFT JOIN v_resumen_usuarios    r  ON r.id_usuario  = u.id_usuario
LEFT JOIN permisos_invitacion   pi ON pi.id_usuario = u.id_usuario
LEFT JOIN tokens_invitacion     ti ON ti.id_token   = pi.id_token
WHERE u.role   = 'usuario'
  AND u.activo = 1
ORDER BY COALESCE(r.total_puntos, 0) DESC,
         u.fecha_creacion             ASC;
*/

-- Q2: Asignar permiso a un usuario (admin toggle ON)
--     Paso A: crear token en tokens_invitacion
/*
INSERT INTO tokens_invitacion (token, creado_por, fecha_expiracion)
VALUES ('<hex_aleatorio_64>', <id_admin>, DATE_ADD(NOW(), INTERVAL 30 DAY));
-- Obtener el id del token recien creado: LAST_INSERT_ID()
*/
--     Paso B: insertar o actualizar permiso
/*
INSERT INTO permisos_invitacion (id_usuario, id_token, habilitado)
VALUES (<id_usuario>, <id_token_nuevo>, 1)
ON DUPLICATE KEY UPDATE
  id_token   = VALUES(id_token),
  habilitado = 1;
*/

-- Q3: Revocar permiso (admin toggle OFF) — solo deshabilita, no borra
/*
UPDATE permisos_invitacion
SET habilitado = 0
WHERE id_usuario = <id_usuario>;
*/

-- Q4: Re-habilitar permiso existente (admin toggle ON sobre usuario ya asignado)
/*
UPDATE permisos_invitacion
SET habilitado = 1
WHERE id_usuario = <id_usuario>;
*/

-- Q5: El usuario consulta su propio token asignado (vista usuario)
/*
SELECT
  ti.token,
  ti.fecha_expiracion,
  ti.usado
FROM permisos_invitacion pi
JOIN tokens_invitacion   ti ON ti.id_token = pi.id_token
WHERE pi.id_usuario = <id_usuario_autenticado>
  AND pi.habilitado = 1
  AND ti.usado      = 0
  AND ti.fecha_expiracion > NOW()
LIMIT 1;
*/

-- Q6: Verificar estado de la tabla tras insercion
/*
SELECT
  u.username,
  pi.habilitado,
  LEFT(ti.token, 12) AS token_preview,
  ti.usado,
  ti.fecha_expiracion
FROM permisos_invitacion pi
JOIN usuarios            u  ON u.id_usuario = pi.id_usuario
LEFT JOIN tokens_invitacion ti ON ti.id_token = pi.id_token
ORDER BY pi.fecha_asignacion DESC;
*/
