-- Tabla de Mensajes de Ganadores por Jornada
-- Permite al usuario que obtuvo más puntos en una jornada dejar un mensaje

CREATE TABLE IF NOT EXISTS mensajes_ganadores_jornada (
  id_mensaje INT AUTO_INCREMENT PRIMARY KEY,
  id_torneo INT NOT NULL,
  numero_jornada INT NOT NULL,
  id_usuario_ganador INT NOT NULL,
  mensaje VARCHAR(100) NOT NULL,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (id_torneo) REFERENCES DIM_TORNEO(ID_TORNEO) ON DELETE CASCADE,
  FOREIGN KEY (id_usuario_ganador) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,

  UNIQUE KEY uq_torneo_jornada (id_torneo, numero_jornada),
  INDEX idx_torneo (id_torneo),
  INDEX idx_jornada (numero_jornada),
  INDEX idx_usuario_ganador (id_usuario_ganador)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Comentarios sobre la tabla
-- Esta tabla almacena mensajes que pueden dejar los ganadores de cada jornada
-- Solo un mensaje por torneo/jornada (constraint UNIQUE)
-- El ganador se determina por los puntos obtenidos en la jornada específica

SELECT 'Tabla mensajes_ganadores_jornada creada exitosamente' as mensaje;
