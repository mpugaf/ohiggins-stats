const { executeQuery } = require('../config/database');

/**
 * Obtener partidos históricos (finalizados) con apuestas
 * GET /api/partidos-historico
 * Query params: torneoId, fecha (opcional), equipoId (opcional), fechaDesde, fechaHasta (opcional)
 */
exports.getPartidosHistoricos = async (req, res) => {
  try {
    const { torneoId, fecha, equipoId, fechaDesde, fechaHasta } = req.query;

    console.log('[HISTORICO] Params recibidos:', { torneoId, fecha, equipoId, fechaDesde, fechaHasta });

    // Verificar si existe columna IMAGEN en DIM_EQUIPO
    let tieneColumnaImagen = false;
    try {
      await executeQuery(`SELECT IMAGEN FROM DIM_EQUIPO LIMIT 1`);
      tieneColumnaImagen = true;
    } catch (err) {
      console.log('[HISTORICO] Columna IMAGEN no existe en DIM_EQUIPO. Usar valores por defecto.');
    }

    let query = `
      SELECT
        p.ID_PARTIDO,
        p.NUMERO_JORNADA,
        p.FECHA_PARTIDO,
        p.ESTADO_PARTIDO,
        p.GOLES_LOCAL,
        p.GOLES_VISITA,
        p.ID_EQUIPO_LOCAL,
        p.ID_EQUIPO_VISITA,
        t.NOMBRE as nombre_torneo,
        t.TEMPORADA,
        t.RUEDA,
        t.ID_TORNEO,
        el.NOMBRE as equipo_local,
        ${tieneColumnaImagen ? "COALESCE(el.IMAGEN, 'default-team.png')" : "'default-team.png'"} as imagen_local,
        ev.NOMBRE as equipo_visita,
        ${tieneColumnaImagen ? "COALESCE(ev.IMAGEN, 'default-team.png')" : "'default-team.png'"} as imagen_visita,
        e.NOMBRE as nombre_estadio,
        COUNT(DISTINCT a.id_apuesta) as total_apuestas,
        SUM(CASE WHEN a.estado = 'ganada' THEN 1 ELSE 0 END) as apuestas_ganadoras,
        SUM(CASE WHEN a.estado = 'perdida' THEN 1 ELSE 0 END) as apuestas_perdedoras
      FROM HECHOS_RESULTADOS p
      INNER JOIN DIM_TORNEO t ON p.ID_TORNEO = t.ID_TORNEO
      INNER JOIN DIM_EQUIPO el ON p.ID_EQUIPO_LOCAL = el.ID_EQUIPO
      INNER JOIN DIM_EQUIPO ev ON p.ID_EQUIPO_VISITA = ev.ID_EQUIPO
      LEFT JOIN DIM_ESTADIO e ON p.ID_ESTADIO = e.ID_ESTADIO
      LEFT JOIN apuestas_usuarios a ON p.ID_PARTIDO = a.id_partido
      WHERE p.ESTADO_PARTIDO IN ('FINALIZADO', 'SUSPENDIDO', 'CANCELADO')
    `;

    const params = [];

    // Filtrar por torneo si se proporciona
    if (torneoId) {
      query += ' AND p.ID_TORNEO = ?';
      params.push(torneoId);
    }

    // Si hay rango de fechas de calendario, se ignoran los filtros de fecha/equipo
    if (fechaDesde && fechaHasta) {
      query += ' AND DATE(p.FECHA_PARTIDO) BETWEEN ? AND ?';
      params.push(fechaDesde, fechaHasta);
      console.log('[HISTORICO] Aplicando filtro de rango de fechas:', fechaDesde, 'a', fechaHasta);
    } else {
      // Filtrar por fecha/jornada si se proporciona
      if (fecha) {
        query += ' AND p.NUMERO_JORNADA = ?';
        params.push(fecha);
      }

      // Filtrar por equipo si se proporciona (local o visita)
      if (equipoId) {
        query += ' AND (p.ID_EQUIPO_LOCAL = ? OR p.ID_EQUIPO_VISITA = ?)';
        params.push(equipoId, equipoId);
      }
    }

    query += `
      GROUP BY
        p.ID_PARTIDO,
        p.NUMERO_JORNADA,
        p.FECHA_PARTIDO,
        p.ESTADO_PARTIDO,
        p.GOLES_LOCAL,
        p.GOLES_VISITA,
        p.ID_EQUIPO_LOCAL,
        p.ID_EQUIPO_VISITA,
        t.NOMBRE,
        t.TEMPORADA,
        t.RUEDA,
        t.ID_TORNEO,
        el.NOMBRE,
        ${tieneColumnaImagen ? 'el.IMAGEN,' : ''}
        ev.NOMBRE,
        ${tieneColumnaImagen ? 'ev.IMAGEN,' : ''}
        e.NOMBRE
      ORDER BY p.FECHA_PARTIDO DESC
    `;

    const partidos = await executeQuery(query, params);

    console.log('[HISTORICO] Partidos encontrados:', partidos.length);

    res.json({
      success: true,
      partidos,
      total: partidos.length
    });

  } catch (error) {
    console.error('[HISTORICO] Error obteniendo partidos históricos:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener partidos históricos'
    });
  }
};

/**
 * Obtener torneos con partidos finalizados
 * GET /api/partidos-historico/torneos
 */
exports.getTorneosConHistorico = async (req, res) => {
  try {
    const torneos = await executeQuery(`
      SELECT DISTINCT
        t.ID_TORNEO,
        t.NOMBRE,
        t.TEMPORADA,
        t.RUEDA,
        COUNT(DISTINCT p.ID_PARTIDO) as total_partidos
      FROM DIM_TORNEO t
      INNER JOIN HECHOS_RESULTADOS p ON t.ID_TORNEO = p.ID_TORNEO
      WHERE p.ESTADO_PARTIDO IN ('FINALIZADO', 'SUSPENDIDO', 'CANCELADO')
      GROUP BY t.ID_TORNEO, t.NOMBRE, t.TEMPORADA, t.RUEDA
      ORDER BY t.TEMPORADA DESC, t.NOMBRE
    `);

    res.json({
      success: true,
      torneos
    });

  } catch (error) {
    console.error('[HISTORICO] Error obteniendo torneos:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener torneos'
    });
  }
};

/**
 * Obtener fechas/jornadas de un torneo
 * GET /api/partidos-historico/torneos/:torneoId/fechas
 */
exports.getFechasPorTorneo = async (req, res) => {
  try {
    const { torneoId } = req.params;

    const fechas = await executeQuery(
      `SELECT DISTINCT
        NUMERO_JORNADA,
        COUNT(*) as total_partidos
      FROM HECHOS_RESULTADOS
      WHERE ID_TORNEO = ?
        AND ESTADO_PARTIDO IN ('FINALIZADO', 'SUSPENDIDO', 'CANCELADO')
        AND NUMERO_JORNADA IS NOT NULL
      GROUP BY NUMERO_JORNADA
      ORDER BY NUMERO_JORNADA`,
      [torneoId]
    );

    res.json({
      success: true,
      fechas
    });

  } catch (error) {
    console.error('[HISTORICO] Error obteniendo fechas:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener fechas'
    });
  }
};

/**
 * Obtener equipos que participaron en un torneo con partidos finalizados
 * GET /api/partidos-historico/torneos/:torneoId/equipos
 */
exports.getEquiposPorTorneo = async (req, res) => {
  try {
    const { torneoId } = req.params;

    // Verificar si existe columna IMAGEN en DIM_EQUIPO
    let tieneColumnaImagen = false;
    try {
      await executeQuery(`SELECT IMAGEN FROM DIM_EQUIPO LIMIT 1`);
      tieneColumnaImagen = true;
    } catch (err) {
      console.log('[HISTORICO] Columna IMAGEN no existe en DIM_EQUIPO.');
    }

    const equipos = await executeQuery(
      `SELECT DISTINCT
        e.ID_EQUIPO,
        e.NOMBRE,
        ${tieneColumnaImagen ? "COALESCE(e.IMAGEN, 'default-team.png')" : "'default-team.png'"} as IMAGEN,
        COUNT(DISTINCT p.ID_PARTIDO) as total_partidos
      FROM DIM_EQUIPO e
      INNER JOIN HECHOS_RESULTADOS p ON (e.ID_EQUIPO = p.ID_EQUIPO_LOCAL OR e.ID_EQUIPO = p.ID_EQUIPO_VISITA)
      WHERE p.ID_TORNEO = ?
        AND p.ESTADO_PARTIDO IN ('FINALIZADO', 'SUSPENDIDO', 'CANCELADO')
      GROUP BY e.ID_EQUIPO, e.NOMBRE ${tieneColumnaImagen ? ', e.IMAGEN' : ''}
      ORDER BY e.NOMBRE`,
      [torneoId]
    );

    res.json({
      success: true,
      equipos
    });

  } catch (error) {
    console.error('[HISTORICO] Error obteniendo equipos:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener equipos'
    });
  }
};
