-- ==============================================================================
-- Script de Migración: Sistema de Programas/Podcasts
-- O'Higgins Stats - Identificación de usuarios con medios
-- ==============================================================================

USE MP_DATA_DEV;

-- Tabla de Programas (Podcasts, Radios, Medios)
CREATE TABLE IF NOT EXISTS programas (
  id_programa INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE COMMENT 'Nombre del programa/podcast',
  descripcion TEXT COMMENT 'Descripción del programa',
  tipo ENUM('podcast', 'radio', 'blog', 'youtube', 'otro') DEFAULT 'podcast',
  url VARCHAR(255) COMMENT 'URL del programa (sitio web, canal YouTube, etc.)',
  logo_url VARCHAR(255) COMMENT 'URL del logo del programa',
  activo TINYINT(1) DEFAULT 1 COMMENT 'Programa activo/visible',
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_activo (activo),
  INDEX idx_tipo (tipo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Agregar campo id_programa a tabla usuarios
ALTER TABLE usuarios
  ADD COLUMN id_programa INT NULL COMMENT 'Programa/podcast al que representa el usuario',
  ADD INDEX idx_programa (id_programa),
  ADD CONSTRAINT fk_usuario_programa
    FOREIGN KEY (id_programa) REFERENCES programas(id_programa)
    ON DELETE SET NULL;

-- Insertar programas de ejemplo (semilla inicial)
INSERT INTO programas (nombre, descripcion, tipo, url, activo) VALUES
('Sin Programa', 'Usuario independiente sin afiliación a programa', 'otro', NULL, 1),
('Podcast Capo de Provincia', 'Podcast oficial de hinchas de O''Higgins', 'podcast', 'https://example.com/capo', 1),
('Radio Celeste', 'Radio dedicada a O''Higgins FC', 'radio', 'https://example.com/radio', 1),
('Blog Rancagüino', 'Blog de análisis del equipo', 'blog', 'https://example.com/blog', 1)
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- Verificación
SELECT 'Tabla programas creada exitosamente' AS status;
SELECT id_programa, nombre, tipo FROM programas;

COMMIT;
