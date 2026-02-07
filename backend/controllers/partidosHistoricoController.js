const { executeQuery } = require('../config/database');

/**
 * Obtener partidos históricos (finalizados) con apuestas
 * GET /api/partidos-historico
 * Query params: torneoId, fecha (opcional)
 */
exports.getPartidosHistoricos = async (req, res) => {
  try {
    const { torneoId, fecha } = req.query;

    let query = `
      SELECT
        p.ID_PARTIDO,
        p.NUMERO_JORNADA,
        p.FECHA_PARTIDO,
        p.ESTADO_PARTIDO,
        p.GOLES_LOCAL,
        p.GOLES_VISITA,
        t.NOMBRE as nombre_torneo,
        t.TEMPORADA,
        t.RUEDA,
        t.ID_TORNEO,
        el.NOMBRE as equipo_local,
        ev.NOMBRE as equipo_visita,
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

    // Filtrar por fecha/jornada si se proporciona
    if (fecha) {
      query += ' AND p.NUMERO_JORNADA = ?';
      params.push(fecha);
    }

    query += `
      GROUP BY
        p.ID_PARTIDO,
        p.NUMERO_JORNADA,
        p.FECHA_PARTIDO,
        p.ESTADO_PARTIDO,
        p.GOLES_LOCAL,
        p.GOLES_VISITA,
        t.NOMBRE,
        t.TEMPORADA,
        t.RUEDA,
        t.ID_TORNEO,
        el.NOMBRE,
        ev.NOMBRE,
        e.NOMBRE
      ORDER BY p.FECHA_PARTIDO DESC
    `;

    const partidos = await executeQuery(query, params);

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
