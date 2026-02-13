const { executeQuery } = require('../config/database');

/**
 * Obtener cuotas de un partido específico
 * GET /api/cuotas/partido/:idPartido
 */
exports.getCuotasByPartido = async (req, res) => {
  const { idPartido } = req.params;

  try {
    const cuotas = await executeQuery(
      `SELECT
        c.id_cuota,
        c.id_partido,
        c.tipo_resultado,
        c.id_equipo,
        c.cuota_decimal,
        c.activa,
        c.fecha_actualizacion,
        e.NOMBRE as nombre_equipo
      FROM cuotas_partidos c
      LEFT JOIN DIM_EQUIPO e ON c.id_equipo = e.ID_EQUIPO
      WHERE c.id_partido = ? AND c.activa = 1
      ORDER BY
        CASE c.tipo_resultado
          WHEN 'local' THEN 1
          WHEN 'empate' THEN 2
          WHEN 'visita' THEN 3
        END`,
      [idPartido]
    );

    res.json({ cuotas });

  } catch (error) {
    console.error('[CUOTAS] Error obteniendo cuotas:', error);
    res.status(500).json({ error: 'Error al obtener cuotas' });
  }
};

/**
 * Crear o actualizar cuotas de un partido (solo admin)
 * POST /api/cuotas/partido/:idPartido
 * Body: { cuotas: [{ tipo_resultado, id_equipo, cuota_decimal }, ...] }
 */
exports.upsertCuotas = async (req, res) => {
  const { idPartido } = req.params;
  const { cuotas } = req.body;

  // Validar que se proporcionan exactamente 3 cuotas
  if (!Array.isArray(cuotas) || cuotas.length !== 3) {
    return res.status(400).json({
      error: 'Debe proporcionar exactamente 3 cuotas (local, empate, visita)'
    });
  }

  // Validar que cada cuota tiene los campos requeridos
  const tiposRequeridos = ['local', 'empate', 'visita'].sort();
  const tiposProporcionados = cuotas.map(c => c.tipo_resultado).sort();

  if (JSON.stringify(tiposProporcionados) !== JSON.stringify(tiposRequeridos)) {
    return res.status(400).json({
      error: 'Debe proporcionar una cuota para cada tipo: local, empate, visita'
    });
  }

  try {
    // Verificar que el partido existe
    const [partido] = await executeQuery(
      'SELECT ID_PARTIDO FROM HECHOS_RESULTADOS WHERE ID_PARTIDO = ?',
      [idPartido]
    );

    if (!partido) {
      return res.status(404).json({ error: 'Partido no encontrado' });
    }

    // Eliminar cuotas antiguas del partido
    await executeQuery('DELETE FROM cuotas_partidos WHERE id_partido = ?', [idPartido]);

    // Insertar nuevas cuotas
    for (const cuota of cuotas) {
      await executeQuery(
        'INSERT INTO cuotas_partidos (id_partido, tipo_resultado, id_equipo, cuota_decimal, activa) VALUES (?, ?, ?, ?, ?)',
        [
          idPartido,
          cuota.tipo_resultado,
          cuota.id_equipo || null,
          cuota.cuota_decimal,
          1
        ]
      );
    }

    console.log(`[CUOTAS] Cuotas actualizadas para partido ${idPartido} por usuario ${req.user.username}`);

    res.json({
      message: 'Cuotas actualizadas exitosamente',
      partido_id: idPartido,
      cuotas_creadas: cuotas.length
    });

  } catch (error) {
    console.error('[CUOTAS] Error actualizando cuotas:', error);
    res.status(500).json({ error: 'Error al actualizar cuotas' });
  }
};

/**
 * Listar todos los partidos con cuotas disponibles para apostar
 * GET /api/cuotas/partidos
 * Filtra por torneo y fecha configurados en config_apuestas
 */
exports.getPartidosConCuotas = async (req, res) => {
  try {
    // Obtener configuración de apuestas
    const configApuestas = await executeQuery(
      `SELECT clave, valor FROM config_apuestas WHERE clave IN ('apuestas_habilitadas', 'torneo_activo_id', 'fecha_habilitada')`
    );

    const config = {};
    configApuestas.forEach(item => {
      config[item.clave] = item.valor;
    });

    // Si las apuestas están deshabilitadas, devolver array vacío
    if (config.apuestas_habilitadas !== 'true') {
      return res.json({ partidos: [], mensaje: 'Las apuestas están temporalmente deshabilitadas' });
    }

    // Verificar si existe la columna IMAGEN en DIM_EQUIPO
    let tieneColumnaImagen = false;
    try {
      await executeQuery(`SELECT IMAGEN FROM DIM_EQUIPO LIMIT 1`);
      tieneColumnaImagen = true;
    } catch (err) {
      console.log('[CUOTAS] Columna IMAGEN no existe aún. Usar valores por defecto.');
    }

    // Construir query con o sin campo IMAGEN según disponibilidad
    let query = `
      SELECT
        p.ID_PARTIDO,
        p.MATCH_ID_FBR,
        p.FECHA_PARTIDO,
        p.ESTADO_PARTIDO,
        p.NUMERO_JORNADA,
        t.NOMBRE as nombre_torneo,
        t.ID_TORNEO,
        el.NOMBRE as equipo_local,
        el.ID_EQUIPO as id_equipo_local,
        ${tieneColumnaImagen ? "COALESCE(el.IMAGEN, 'default-team.png')" : "'default-team.png'"} as imagen_local,
        ev.NOMBRE as equipo_visita,
        ev.ID_EQUIPO as id_equipo_visita,
        ${tieneColumnaImagen ? "COALESCE(ev.IMAGEN, 'default-team.png')" : "'default-team.png'"} as imagen_visita,
        p.GOLES_LOCAL,
        p.GOLES_VISITA,
        COUNT(c.id_cuota) as total_cuotas
      FROM HECHOS_RESULTADOS p
      INNER JOIN cuotas_partidos c ON p.ID_PARTIDO = c.id_partido AND c.activa = 1
      INNER JOIN DIM_TORNEO t ON p.ID_TORNEO = t.ID_TORNEO
      INNER JOIN DIM_EQUIPO el ON p.ID_EQUIPO_LOCAL = el.ID_EQUIPO
      INNER JOIN DIM_EQUIPO ev ON p.ID_EQUIPO_VISITA = ev.ID_EQUIPO
      WHERE p.ESTADO_PARTIDO = 'PROGRAMADO'
    `;

    const params = [];

    // Filtrar por torneo si está configurado
    if (config.torneo_activo_id && config.torneo_activo_id !== '') {
      query += ' AND p.ID_TORNEO = ?';
      params.push(config.torneo_activo_id);
    }

    // Filtrar por fecha si está configurada
    if (config.fecha_habilitada && config.fecha_habilitada !== '') {
      query += ' AND p.NUMERO_JORNADA = ?';
      params.push(config.fecha_habilitada);
    }

    query += `
      GROUP BY
        p.ID_PARTIDO,
        p.MATCH_ID_FBR,
        p.FECHA_PARTIDO,
        p.ESTADO_PARTIDO,
        p.NUMERO_JORNADA,
        t.NOMBRE,
        t.ID_TORNEO,
        el.NOMBRE,
        el.ID_EQUIPO,
        ev.NOMBRE,
        ev.ID_EQUIPO,
        p.GOLES_LOCAL,
        p.GOLES_VISITA
      HAVING total_cuotas = 3
      ORDER BY p.FECHA_PARTIDO ASC
    `;

    const partidos = await executeQuery(query, params);

    res.json({ partidos });

  } catch (error) {
    console.error('[CUOTAS] Error obteniendo partidos con cuotas:', error);
    console.error('[CUOTAS] Error stack:', error.stack);
    res.status(500).json({
      error: 'Error al obtener partidos',
      message: error.message
    });
  }
};

/**
 * Obtener partidos pendientes de apostar para el usuario autenticado
 * (Partidos disponibles donde el usuario NO ha apostado aún)
 * GET /api/cuotas/partidos-sin-apostar
 */
exports.getPartidosSinApostar = async (req, res) => {
  try {
    const userId = req.user.id_usuario;

    // Obtener configuración de apuestas
    const configApuestas = await executeQuery(
      `SELECT clave, valor FROM config_apuestas WHERE clave IN ('apuestas_habilitadas', 'torneo_activo_id', 'fecha_habilitada')`
    );

    const config = {};
    configApuestas.forEach(item => {
      config[item.clave] = item.valor;
    });

    // Si las apuestas están deshabilitadas, devolver array vacío
    if (config.apuestas_habilitadas !== 'true') {
      return res.json({ partidos: [], mensaje: 'Las apuestas están temporalmente deshabilitadas' });
    }

    // Verificar si existe la columna IMAGEN en DIM_EQUIPO
    let tieneColumnaImagen = false;
    try {
      await executeQuery(`SELECT IMAGEN FROM DIM_EQUIPO LIMIT 1`);
      tieneColumnaImagen = true;
    } catch (err) {
      console.log('[CUOTAS] Columna IMAGEN no existe aún. Usar valores por defecto.');
    }

    // Construir query para partidos donde el usuario NO ha apostado
    let query = `
      SELECT
        p.ID_PARTIDO,
        p.MATCH_ID_FBR,
        p.FECHA_PARTIDO,
        p.ESTADO_PARTIDO,
        p.NUMERO_JORNADA,
        t.NOMBRE as nombre_torneo,
        t.ID_TORNEO,
        el.NOMBRE as equipo_local,
        el.ID_EQUIPO as id_equipo_local,
        ${tieneColumnaImagen ? "COALESCE(el.IMAGEN, 'default-team.png')" : "'default-team.png'"} as imagen_local,
        ev.NOMBRE as equipo_visita,
        ev.ID_EQUIPO as id_equipo_visita,
        ${tieneColumnaImagen ? "COALESCE(ev.IMAGEN, 'default-team.png')" : "'default-team.png'"} as imagen_visita,
        p.GOLES_LOCAL,
        p.GOLES_VISITA,
        COUNT(c.id_cuota) as total_cuotas
      FROM HECHOS_RESULTADOS p
      INNER JOIN cuotas_partidos c ON p.ID_PARTIDO = c.id_partido AND c.activa = 1
      INNER JOIN DIM_TORNEO t ON p.ID_TORNEO = t.ID_TORNEO
      INNER JOIN DIM_EQUIPO el ON p.ID_EQUIPO_LOCAL = el.ID_EQUIPO
      INNER JOIN DIM_EQUIPO ev ON p.ID_EQUIPO_VISITA = ev.ID_EQUIPO
      LEFT JOIN apuestas_usuarios a ON p.ID_PARTIDO = a.id_partido AND a.id_usuario = ?
      WHERE p.ESTADO_PARTIDO = 'PROGRAMADO'
        AND a.id_apuesta IS NULL
    `;

    const params = [userId];

    // Filtrar por torneo si está configurado
    if (config.torneo_activo_id && config.torneo_activo_id !== '') {
      query += ' AND p.ID_TORNEO = ?';
      params.push(config.torneo_activo_id);
    }

    // Filtrar por fecha si está configurada
    if (config.fecha_habilitada && config.fecha_habilitada !== '') {
      query += ' AND p.NUMERO_JORNADA = ?';
      params.push(config.fecha_habilitada);
    }

    query += `
      GROUP BY
        p.ID_PARTIDO,
        p.MATCH_ID_FBR,
        p.FECHA_PARTIDO,
        p.ESTADO_PARTIDO,
        p.NUMERO_JORNADA,
        t.NOMBRE,
        t.ID_TORNEO,
        el.NOMBRE,
        el.ID_EQUIPO,
        ${tieneColumnaImagen ? 'el.IMAGEN,' : ''}
        ev.NOMBRE,
        ev.ID_EQUIPO,
        ${tieneColumnaImagen ? 'ev.IMAGEN,' : ''}
        p.GOLES_LOCAL,
        p.GOLES_VISITA
      HAVING total_cuotas = 3
      ORDER BY p.FECHA_PARTIDO ASC
    `;

    const partidos = await executeQuery(query, params);

    // Obtener nombre del torneo activo si está configurado
    let torneoActivoNombre = null;
    if (config.torneo_activo_id) {
      try {
        const torneoInfo = await executeQuery(
          `SELECT NOMBRE, TEMPORADA, RUEDA FROM DIM_TORNEO WHERE ID_TORNEO = ?`,
          [config.torneo_activo_id]
        );
        if (torneoInfo.length > 0) {
          const torneo = torneoInfo[0];
          // Formatear: "Nombre Año - Rueda rueda"
          let ruedaFormateada = '';
          if (torneo.RUEDA && typeof torneo.RUEDA === 'string' && torneo.RUEDA.length > 0) {
            ruedaFormateada = torneo.RUEDA.charAt(0).toUpperCase() + torneo.RUEDA.slice(1).toLowerCase() + ' rueda';
          }
          torneoActivoNombre = `${torneo.NOMBRE || ''} ${torneo.TEMPORADA || ''}${ruedaFormateada ? ' - ' + ruedaFormateada : ''}`.trim();
        }
      } catch (err) {
        console.error('[CUOTAS] Error obteniendo info del torneo:', err);
      }
    }

    res.json({
      success: true,
      partidos,
      total: partidos.length,
      torneo_activo_id: config.torneo_activo_id,
      torneo_activo_nombre: torneoActivoNombre,
      fecha_activa: config.fecha_habilitada
    });

  } catch (error) {
    console.error('[CUOTAS] Error obteniendo partidos sin apostar:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener partidos sin apostar'
    });
  }
};
