-- Script para crear tabla de tokens de invitación
-- Permite a los admins generar links únicos de registro

CREATE TABLE IF NOT EXISTS tokens_invitacion (
  id_token INT AUTO_INCREMENT PRIMARY KEY,
  token VARCHAR(64) UNIQUE NOT NULL,
  creado_por INT NOT NULL,
  usado BOOLEAN DEFAULT FALSE,
  id_usuario_creado INT NULL,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_uso TIMESTAMP NULL,
  fecha_expiracion TIMESTAMP NULL,

  FOREIGN KEY (creado_por) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  FOREIGN KEY (id_usuario_creado) REFERENCES usuarios(id_usuario) ON DELETE SET NULL,

  INDEX idx_token (token),
  INDEX idx_usado (usado),
  INDEX idx_creado_por (creado_por)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Comentarios
ALTER TABLE tokens_invitacion
  COMMENT = 'Tokens únicos para invitar a nuevos usuarios a registrarse';
