-- ==============================================================================
-- Script de Creación de Tablas para Sistema de Autenticación y Apuestas
-- O'Higgins Stats - Sistema de Apuestas Deportivas (Compatible con MySQL 5.7/MariaDB)
-- ==============================================================================

-- Tabla de Usuarios (ya existe, skip)
CREATE TABLE IF NOT EXISTS usuarios (
  id_usuario INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nombre_completo VARCHAR(100),
  role ENUM('admin', 'usuario') DEFAULT 'usuario',
  puede_apostar TINYINT(1) DEFAULT 1,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ultimo_acceso TIMESTAMP NULL,
  activo TINYINT(1) DEFAULT 1,
  INDEX idx_username (username),
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de Cuotas de Apuestas (SIN CHECK CONSTRAINT)
CREATE TABLE IF NOT EXISTS cuotas_partidos (
  id_cuota INT AUTO_INCREMENT PRIMARY KEY,
  id_partido INT NOT NULL,
  tipo_resultado ENUM('local', 'empate', 'visita') NOT NULL,
  id_equipo INT NULL,
  cuota_decimal DECIMAL(5,2) NOT NULL,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  activa TINYINT(1) DEFAULT 1,
  FOREIGN KEY (id_partido) REFERENCES HECHOS_RESULTADOS(ID_PARTIDO) ON DELETE CASCADE,
  FOREIGN KEY (id_equipo) REFERENCES DIM_EQUIPO(ID_EQUIPO) ON DELETE SET NULL,
  INDEX idx_partido (id_partido),
  INDEX idx_activa (activa)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de Apuestas de Usuarios
CREATE TABLE IF NOT EXISTS apuestas_usuarios (
  id_apuesta INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  id_partido INT NOT NULL,
  id_torneo INT NOT NULL,
  tipo_apuesta ENUM('local', 'empate', 'visita') NOT NULL,
  id_equipo_predicho INT NULL,
  monto_apuesta DECIMAL(10,2) NOT NULL DEFAULT 100.00,
  valor_cuota DECIMAL(5,2) NOT NULL,
  retorno_potencial DECIMAL(10,2) NOT NULL,
  estado ENUM('pendiente', 'ganada', 'perdida', 'cancelada') DEFAULT 'pendiente',
  puntos_ganados DECIMAL(10,2) DEFAULT 0,
  fecha_apuesta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  FOREIGN KEY (id_partido) REFERENCES HECHOS_RESULTADOS(ID_PARTIDO) ON DELETE CASCADE,
  FOREIGN KEY (id_torneo) REFERENCES DIM_TORNEO(ID_TORNEO) ON DELETE CASCADE,
  FOREIGN KEY (id_equipo_predicho) REFERENCES DIM_EQUIPO(ID_EQUIPO) ON DELETE SET NULL,
  UNIQUE KEY uq_usuario_partido (id_usuario, id_partido),
  INDEX idx_usuario (id_usuario),
  INDEX idx_partido (id_partido),
  INDEX idx_estado (estado),
  INDEX idx_fecha (fecha_apuesta)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de Historial de Puntos
CREATE TABLE IF NOT EXISTS historial_puntos (
  id_punto INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  id_apuesta INT NOT NULL UNIQUE,
  id_partido INT NOT NULL,
  id_torneo INT NOT NULL,
  puntos_ganados DECIMAL(10,2) NOT NULL,
  fecha_credito TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  FOREIGN KEY (id_apuesta) REFERENCES apuestas_usuarios(id_apuesta) ON DELETE CASCADE,
  FOREIGN KEY (id_partido) REFERENCES HECHOS_RESULTADOS(ID_PARTIDO) ON DELETE CASCADE,
  FOREIGN KEY (id_torneo) REFERENCES DIM_TORNEO(ID_TORNEO) ON DELETE CASCADE,
  INDEX idx_usuario (id_usuario),
  INDEX idx_torneo (id_torneo),
  INDEX idx_fecha (fecha_credito)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de Configuración Global de Apuestas
CREATE TABLE IF NOT EXISTS config_apuestas (
  id_config INT AUTO_INCREMENT PRIMARY KEY,
  clave VARCHAR(50) UNIQUE NOT NULL,
  valor VARCHAR(255) NOT NULL,
  descripcion TEXT,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar configuraciones iniciales
INSERT INTO config_apuestas (clave, valor, descripcion) VALUES
('apuestas_habilitadas', 'true', 'Control global para habilitar/deshabilitar apuestas'),
('monto_apuesta_default', '100.00', 'Monto predeterminado de apuesta'),
('torneo_activo_id', '', 'ID del torneo activamente configurado para apuestas')
ON DUPLICATE KEY UPDATE valor = VALUES(valor);

-- Vista de Resumen de Usuarios
CREATE OR REPLACE VIEW v_resumen_usuarios AS
SELECT
  u.id_usuario,
  u.username,
  u.nombre_completo,
  u.email,
  u.role,
  COUNT(a.id_apuesta) AS total_apuestas,
  SUM(CASE WHEN a.estado = 'ganada' THEN 1 ELSE 0 END) AS apuestas_ganadas,
  SUM(CASE WHEN a.estado = 'perdida' THEN 1 ELSE 0 END) AS apuestas_perdidas,
  SUM(CASE WHEN a.estado = 'pendiente' THEN 1 ELSE 0 END) AS apuestas_pendientes,
  COALESCE(SUM(hp.puntos_ganados), 0) AS total_puntos,
  ROUND(
    CASE
      WHEN COUNT(a.id_apuesta) > 0
      THEN (SUM(CASE WHEN a.estado = 'ganada' THEN 1 ELSE 0 END) * 100.0 / COUNT(a.id_apuesta))
      ELSE 0
    END,
    2
  ) AS porcentaje_aciertos,
  u.fecha_creacion,
  u.ultimo_acceso
FROM usuarios u
LEFT JOIN apuestas_usuarios a ON u.id_usuario = a.id_usuario
LEFT JOIN historial_puntos hp ON u.id_usuario = hp.id_usuario
GROUP BY u.id_usuario, u.username, u.nombre_completo, u.email, u.role, u.fecha_creacion, u.ultimo_acceso;

-- ==============================================================================
-- Script ejecutado exitosamente
-- ==============================================================================
