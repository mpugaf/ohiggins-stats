// backend/controllers/mensajesGanadoresController.js
const { executeQuery } = require('../config/database');

/**
 * Obtener ganadores de cada jornada de un torneo
 * Calcula quién obtuvo más puntos en cada fecha
 */
exports.getGanadoresPorJornada = async (req, res) => {
  try {
    const { idTorneo } = req.params;

    if (!idTorneo) {
      return res.status(400).json({
        error: 'El parámetro idTorneo es requerido'
      });
    }

    // Query para obtener el ganador de cada jornada
    const query = `
      SELECT
        p.NUMERO_JORNADA as numero_jornada,
        u.id_usuario,
        u.username,
        u.nombre_completo,
        SUM(a.puntos_ganados) as puntos_jornada,
        COUNT(a.id_apuesta) as apuestas_jornada
      FROM apuestas_usuarios a
      INNER JOIN HECHOS_RESULTADOS p ON a.id_partido = p.ID_PARTIDO
      INNER JOIN usuarios u ON a.id_usuario = u.id_usuario
      WHERE a.id_torneo = ?
        AND a.estado IN ('ganada', 'perdida')
        AND p.NUMERO_JORNADA IS NOT NULL
      GROUP BY p.NUMERO_JORNADA, u.id_usuario, u.username, u.nombre_completo
      ORDER BY p.NUMERO_JORNADA ASC, puntos_jornada DESC
    `;

    const resultados = await executeQuery(query, [idTorneo]);

    // Agrupar por jornada y tomar solo el primer lugar (ganador)
    const ganadoresPorJornada = {};

    resultados.forEach(row => {
      const jornada = row.numero_jornada;

      // Si no existe ganador para esta jornada, o hay empate (mismo puntaje), tomar el primero
      if (!ganadoresPorJornada[jornada]) {
        ganadoresPorJornada[jornada] = {
          numero_jornada: jornada,
          id_usuario_ganador: row.id_usuario,
          username: row.username,
          nombre_completo: row.nombre_completo,
          puntos_jornada: row.puntos_jornada,
          apuestas_jornada: row.apuestas_jornada
        };
      }
    });

    // Convertir objeto a array
    const ganadores = Object.values(ganadoresPorJornada);

    res.json({
      success: true,
      ganadores,
      total_jornadas: ganadores.length
    });

  } catch (error) {
    console.error('[MENSAJES_GANADORES] Error al obtener ganadores por jornada:', error);
    res.status(500).json({
      error: 'Error al obtener ganadores por jornada',
      detalle: error.message
    });
  }
};

/**
 * Obtener todos los mensajes de un torneo
 */
exports.getMensajesTorneo = async (req, res) => {
  try {
    const { idTorneo } = req.params;

    if (!idTorneo) {
      return res.status(400).json({
        error: 'El parámetro idTorneo es requerido'
      });
    }

    const query = `
      SELECT
        m.id_mensaje,
        m.id_torneo,
        m.numero_jornada,
        m.id_usuario_ganador,
        m.mensaje,
        m.fecha_creacion,
        m.fecha_actualizacion,
        u.username,
        u.nombre_completo,
        t.NOMBRE as nombre_torneo,
        t.TEMPORADA
      FROM mensajes_ganadores_jornada m
      INNER JOIN usuarios u ON m.id_usuario_ganador = u.id_usuario
      INNER JOIN DIM_TORNEO t ON m.id_torneo = t.ID_TORNEO
      WHERE m.id_torneo = ?
      ORDER BY m.numero_jornada ASC
    `;

    const mensajes = await executeQuery(query, [idTorneo]);

    res.json({
      success: true,
      mensajes,
      total: mensajes.length
    });

  } catch (error) {
    console.error('[MENSAJES_GANADORES] Error al obtener mensajes:', error);
    res.status(500).json({
      error: 'Error al obtener mensajes del torneo',
      detalle: error.message
    });
  }
};

/**
 * Crear o actualizar mensaje de ganador
 * Solo el usuario ganador de esa jornada puede escribir
 */
exports.guardarMensaje = async (req, res) => {
  try {
    const { idTorneo, numeroJornada } = req.params;
    const { mensaje } = req.body;
    const idUsuario = req.user.id_usuario; // Del middleware authenticateToken

    // Validaciones
    if (!idTorneo || !numeroJornada) {
      return res.status(400).json({
        error: 'Se requieren idTorneo y numeroJornada'
      });
    }

    if (!mensaje || mensaje.trim().length === 0) {
      return res.status(400).json({
        error: 'El mensaje no puede estar vacío'
      });
    }

    if (mensaje.length > 100) {
      return res.status(400).json({
        error: 'El mensaje no puede exceder 100 caracteres'
      });
    }

    // Verificar si el usuario es el ganador de esta jornada
    const queryGanador = `
      SELECT
        u.id_usuario,
        SUM(a.puntos_ganados) as puntos_jornada
      FROM apuestas_usuarios a
      INNER JOIN HECHOS_RESULTADOS p ON a.id_partido = p.ID_PARTIDO
      INNER JOIN usuarios u ON a.id_usuario = u.id_usuario
      WHERE a.id_torneo = ?
        AND p.NUMERO_JORNADA = ?
        AND a.estado IN ('ganada', 'perdida')
      GROUP BY u.id_usuario
      ORDER BY puntos_jornada DESC
      LIMIT 1
    `;

    const ganadores = await executeQuery(queryGanador, [idTorneo, numeroJornada]);

    if (ganadores.length === 0) {
      return res.status(404).json({
        error: 'No se encontró ganador para esta jornada'
      });
    }

    const ganador = ganadores[0];

    if (ganador.id_usuario !== idUsuario) {
      return res.status(403).json({
        error: 'Solo el ganador de esta jornada puede dejar un mensaje'
      });
    }

    // Verificar si ya existe un mensaje para esta jornada
    const queryExistente = `
      SELECT id_mensaje
      FROM mensajes_ganadores_jornada
      WHERE id_torneo = ? AND numero_jornada = ?
    `;

    const mensajesExistentes = await executeQuery(queryExistente, [idTorneo, numeroJornada]);

    if (mensajesExistentes.length > 0) {
      // Ya existe mensaje - no se puede modificar
      return res.status(409).json({
        error: 'Ya existe un mensaje para esta jornada y no puede ser modificado'
      });
    }

    // Crear nuevo mensaje
    const queryInsert = `
      INSERT INTO mensajes_ganadores_jornada
        (id_torneo, numero_jornada, id_usuario_ganador, mensaje)
      VALUES (?, ?, ?, ?)
    `;

    await executeQuery(queryInsert, [
      idTorneo,
      numeroJornada,
      idUsuario,
      mensaje.trim()
    ]);

    res.json({
      success: true,
      message: 'Mensaje guardado exitosamente'
    });

  } catch (error) {
    console.error('[MENSAJES_GANADORES] Error al guardar mensaje:', error);
    res.status(500).json({
      error: 'Error al guardar mensaje',
      detalle: error.message
    });
  }
};
