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
    // En caso de empate en puntos, gana el usuario con fecha_creacion más antigua (se registró primero)
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
        AND u.activo = 1
      GROUP BY p.NUMERO_JORNADA, u.id_usuario, u.username, u.nombre_completo
      ORDER BY p.NUMERO_JORNADA ASC, puntos_jornada DESC, u.fecha_creacion ASC
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
 * Obtener todas las jornadas de todos los torneos con ganadores y mensajes,
 * ordenadas cronológicamente por el primer partido de cada fecha
 * GET /api/mensajes-ganadores/todas-jornadas
 */
exports.getTodasLasJornadas = async (req, res) => {
  try {
    const esAdmin = req.user && req.user.role === 'admin';

    // 1. Puntos por (torneo, jornada, usuario) para determinar ganador
    // Admin ve todos (incluyendo desactivados), usuario regular solo ve activos
    const filtroActivo = esAdmin ? '' : 'AND u.activo = 1';
    const todosPuntos = await executeQuery(`
      SELECT
        a.id_torneo,
        t.NOMBRE as nombre_torneo,
        t.TEMPORADA,
        p.NUMERO_JORNADA as numero_jornada,
        a.id_usuario,
        u.username,
        u.nombre_completo,
        u.activo,
        u.fecha_creacion,
        SUM(a.puntos_ganados) as puntos_jornada,
        COUNT(a.id_apuesta) as apuestas_jornada
      FROM apuestas_usuarios a
      INNER JOIN HECHOS_RESULTADOS p ON a.id_partido = p.ID_PARTIDO
      INNER JOIN DIM_TORNEO t ON a.id_torneo = t.ID_TORNEO
      INNER JOIN usuarios u ON a.id_usuario = u.id_usuario
      WHERE a.estado IN ('ganada', 'perdida')
        AND p.NUMERO_JORNADA IS NOT NULL
        ${filtroActivo}
      GROUP BY a.id_torneo, t.NOMBRE, t.TEMPORADA, p.NUMERO_JORNADA,
               a.id_usuario, u.username, u.nombre_completo, u.activo, u.fecha_creacion
      ORDER BY puntos_jornada DESC, u.fecha_creacion ASC
    `);

    // 2. Primer partido y estado de finalización por (torneo, jornada)
    const estadoFechas = await executeQuery(`
      SELECT
        ID_TORNEO as id_torneo,
        NUMERO_JORNADA as numero_jornada,
        MIN(FECHA_PARTIDO) as fecha_primer_partido,
        CASE
          WHEN COUNT(*) = SUM(CASE WHEN ESTADO_PARTIDO = 'FINALIZADO' THEN 1 ELSE 0 END)
          THEN 1 ELSE 0
        END as todos_finalizados
      FROM HECHOS_RESULTADOS
      WHERE NUMERO_JORNADA IS NOT NULL
      GROUP BY ID_TORNEO, NUMERO_JORNADA
    `);

    const estadoMap = {};
    for (const f of estadoFechas) {
      estadoMap[`${f.id_torneo}_${f.numero_jornada}`] = {
        fecha_primer_partido: f.fecha_primer_partido,
        todos_finalizados: f.todos_finalizados === 1
      };
    }

    // 3. Todos los mensajes
    const mensajes = await executeQuery(`
      SELECT id_torneo, numero_jornada, id_usuario_ganador, mensaje
      FROM mensajes_ganadores_jornada
    `);

    const mensajesMap = {};
    for (const m of mensajes) {
      mensajesMap[`${m.id_torneo}_${m.numero_jornada}`] = m.mensaje;
    }

    // 4. Determinar ganador por (torneo, jornada) — primer resultado por grupo
    const ganadoresMap = {};
    for (const row of todosPuntos) {
      const key = `${row.id_torneo}_${row.numero_jornada}`;
      if (!ganadoresMap[key]) {
        const estado = estadoMap[key] || {};
        ganadoresMap[key] = {
          id_torneo: row.id_torneo,
          nombre_torneo: row.nombre_torneo,
          temporada: row.TEMPORADA,
          numero_jornada: row.numero_jornada,
          fecha_primer_partido: estado.fecha_primer_partido || null,
          todos_finalizados: estado.todos_finalizados || false,
          id_usuario_ganador: row.id_usuario,
          username: row.username,
          nombre_completo: row.nombre_completo,
          usuario_activo: row.activo === 1,
          puntos_jornada: row.puntos_jornada,
          apuestas_jornada: row.apuestas_jornada,
          mensaje: mensajesMap[key] || null
        };
      }
    }

    // 5. Ordenar por fecha_primer_partido ASC
    const jornadas = Object.values(ganadoresMap)
      .filter(j => j.fecha_primer_partido !== null)
      .sort((a, b) => new Date(a.fecha_primer_partido) - new Date(b.fecha_primer_partido));

    res.json({ success: true, jornadas });

  } catch (error) {
    console.error('[MENSAJES_GANADORES] Error al obtener todas las jornadas:', error);
    res.status(500).json({
      error: 'Error al obtener jornadas',
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
 * Eliminar todos los mensajes de un usuario (solo admin)
 * Se usa al desactivar un usuario
 * DELETE /api/mensajes-ganadores/usuario/:idUsuario
 */
exports.deleteMensajesByUsuario = async (req, res) => {
  try {
    const { idUsuario } = req.params;

    const result = await executeQuery(
      'DELETE FROM mensajes_ganadores_jornada WHERE id_usuario_ganador = ?',
      [idUsuario]
    );

    res.json({
      success: true,
      mensajes_eliminados: result.affectedRows
    });

  } catch (error) {
    console.error('[MENSAJES_GANADORES] Error al eliminar mensajes de usuario:', error);
    res.status(500).json({
      error: 'Error al eliminar mensajes del usuario',
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
    // En caso de empate en puntos, gana el usuario con fecha_creacion más antigua (se registró primero)
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
        AND u.activo = 1
      GROUP BY u.id_usuario
      ORDER BY puntos_jornada DESC, u.fecha_creacion ASC
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
