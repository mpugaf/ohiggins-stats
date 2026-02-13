const { executeQuery } = require('../config/database');

/**
 * Ver pronósticos de todos los usuarios
 * GET /api/pronosticos
 * Solo accesible cuando las apuestas están deshabilitadas
 */
exports.getPronosticosTodos = async (req, res) => {
  try {
    // Verificar que las apuestas estén deshabilitadas
    const [config] = await executeQuery(
      `SELECT valor FROM config_apuestas WHERE clave = 'apuestas_habilitadas'`
    );

    if (config && config.valor === 'true') {
      return res.status(403).json({
        success: false,
        error: 'Los pronósticos solo están disponibles cuando las apuestas están cerradas'
      });
    }

    // Obtener torneo y fecha configurados
    const configData = await executeQuery(
      `SELECT clave, valor FROM config_apuestas WHERE clave IN ('torneo_activo_id', 'fecha_habilitada')`
    );

    const configObj = {};
    configData.forEach(item => {
      configObj[item.clave] = item.valor;
    });

    // Construir query con filtros
    let query = `
      SELECT
        u.username,
        u.nombre_completo,
        a.tipo_apuesta,
        a.valor_cuota,
        a.retorno_potencial,
        a.estado,
        a.puntos_ganados,
        a.fecha_apuesta,
        p.ID_PARTIDO,
        p.NUMERO_JORNADA,
        p.FECHA_PARTIDO,
        p.GOLES_LOCAL,
        p.GOLES_VISITA,
        p.ESTADO_PARTIDO,
        t.NOMBRE as nombre_torneo,
        t.TEMPORADA,
        el.NOMBRE as equipo_local,
        ev.NOMBRE as equipo_visita,
        ep.NOMBRE as equipo_predicho
      FROM apuestas_usuarios a
      INNER JOIN usuarios u ON a.id_usuario = u.id_usuario
      INNER JOIN HECHOS_RESULTADOS p ON a.id_partido = p.ID_PARTIDO
      INNER JOIN DIM_TORNEO t ON a.id_torneo = t.ID_TORNEO
      INNER JOIN DIM_EQUIPO el ON p.ID_EQUIPO_LOCAL = el.ID_EQUIPO
      INNER JOIN DIM_EQUIPO ev ON p.ID_EQUIPO_VISITA = ev.ID_EQUIPO
      LEFT JOIN DIM_EQUIPO ep ON a.id_equipo_predicho = ep.ID_EQUIPO
      WHERE 1=1
    `;

    const params = [];

    // Filtrar por torneo si está configurado
    if (configObj.torneo_activo_id && configObj.torneo_activo_id !== '') {
      query += ' AND a.id_torneo = ?';
      params.push(configObj.torneo_activo_id);
    }

    // Filtrar por fecha si está configurada
    if (configObj.fecha_habilitada && configObj.fecha_habilitada !== '') {
      query += ' AND p.NUMERO_JORNADA = ?';
      params.push(configObj.fecha_habilitada);
    }

    query += ' ORDER BY p.FECHA_PARTIDO, u.username';

    const pronosticos = await executeQuery(query, params);

    res.json({
      success: true,
      pronosticos
    });

  } catch (error) {
    console.error('[PRONOSTICOS] Error obteniendo pronósticos:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener pronósticos'
    });
  }
};

/**
 * Obtener tabla de posiciones
 * GET /api/pronosticos/tabla-posiciones
 * Query params: idTorneo (requerido), fecha (opcional)
 * Basado en apuestas de 10,000 pesos por partido
 */
exports.getTablaPosiciones = async (req, res) => {
  try {
    const { idTorneo, fecha } = req.query;

    // Validar que se proporcione el torneo
    if (!idTorneo) {
      return res.status(400).json({
        success: false,
        error: 'El parámetro idTorneo es requerido'
      });
    }

    // Verificar si el usuario es admin (viene del middleware authenticateToken)
    const esAdmin = req.user && req.user.role === 'admin';

    // Construir query con filtros
    let query = `
      SELECT
        u.id_usuario,
        u.username,
        u.nombre_completo,
        u.activo,
        COUNT(a.id_apuesta) as total_apuestas,
        SUM(CASE WHEN a.estado = 'ganada' THEN 1 ELSE 0 END) as apuestas_ganadas,
        SUM(CASE WHEN a.estado = 'perdida' THEN 1 ELSE 0 END) as apuestas_perdidas,
        SUM(CASE WHEN a.estado = 'pendiente' THEN 1 ELSE 0 END) as apuestas_pendientes,
        SUM(CASE WHEN a.estado = 'ganada' THEN (10000 * a.valor_cuota) ELSE 0 END) as puntos_totales,
        ROUND(
          CASE
            WHEN COUNT(a.id_apuesta) > 0
            THEN (SUM(CASE WHEN a.estado = 'ganada' THEN 1 ELSE 0 END) * 100.0 / COUNT(a.id_apuesta))
            ELSE 0
          END,
          2
        ) as porcentaje_aciertos
      FROM usuarios u
      INNER JOIN apuestas_usuarios a ON u.id_usuario = a.id_usuario
      INNER JOIN HECHOS_RESULTADOS p ON a.id_partido = p.ID_PARTIDO
      WHERE a.id_torneo = ?
    `;

    const params = [idTorneo];

    // Si NO es admin, filtrar solo usuarios activos
    if (!esAdmin) {
      query += ' AND u.activo = 1';
    }

    // Filtrar por fecha específica si se proporciona
    if (fecha && fecha !== '' && fecha !== 'todas') {
      query += ' AND p.NUMERO_JORNADA = ?';
      params.push(fecha);
    }

    query += `
      GROUP BY u.id_usuario, u.username, u.nombre_completo
      ORDER BY puntos_totales DESC, porcentaje_aciertos DESC, apuestas_ganadas DESC
    `;

    const tabla = await executeQuery(query, params);

    // Agregar posición
    const tablaConPosicion = tabla.map((usuario, index) => ({
      posicion: index + 1,
      ...usuario
    }));

    res.json({
      success: true,
      tabla: tablaConPosicion,
      torneo: idTorneo,
      fecha: fecha || 'todas'
    });

  } catch (error) {
    console.error('[PRONOSTICOS] Error obteniendo tabla de posiciones:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener tabla de posiciones'
    });
  }
};

/**
 * Obtener torneos disponibles con apuestas
 * GET /api/pronosticos/torneos-disponibles
 */
exports.getTorneosDisponibles = async (req, res) => {
  try {
    const torneos = await executeQuery(`
      SELECT DISTINCT
        t.ID_TORNEO,
        t.NOMBRE,
        t.TEMPORADA
      FROM DIM_TORNEO t
      INNER JOIN apuestas_usuarios a ON t.ID_TORNEO = a.id_torneo
      ORDER BY t.TEMPORADA DESC, t.NOMBRE ASC
    `);

    res.json({
      success: true,
      torneos
    });

  } catch (error) {
    console.error('[PRONOSTICOS] Error obteniendo torneos:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener torneos disponibles'
    });
  }
};

/**
 * Obtener fechas disponibles de un torneo
 * GET /api/pronosticos/fechas-torneo/:idTorneo
 */
exports.getFechasTorneo = async (req, res) => {
  try {
    const { idTorneo } = req.params;

    const fechas = await executeQuery(`
      SELECT DISTINCT p.NUMERO_JORNADA as fecha
      FROM HECHOS_RESULTADOS p
      INNER JOIN apuestas_usuarios a ON p.ID_PARTIDO = a.id_partido
      WHERE a.id_torneo = ?
      ORDER BY p.NUMERO_JORNADA DESC
    `, [idTorneo]);

    res.json({
      success: true,
      fechas: fechas.map(f => f.fecha)
    });

  } catch (error) {
    console.error('[PRONOSTICOS] Error obteniendo fechas del torneo:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener fechas del torneo'
    });
  }
};

/**
 * Obtener la última fecha disponible
 * GET /api/pronosticos/ultima-fecha
 */
exports.getUltimaFecha = async (req, res) => {
  try {
    const [ultimaInfo] = await executeQuery(`
      SELECT
        a.id_torneo,
        t.NOMBRE as nombre_torneo,
        p.NUMERO_JORNADA as ultima_fecha
      FROM apuestas_usuarios a
      INNER JOIN HECHOS_RESULTADOS p ON a.id_partido = p.ID_PARTIDO
      INNER JOIN DIM_TORNEO t ON a.id_torneo = t.ID_TORNEO
      ORDER BY p.NUMERO_JORNADA DESC
      LIMIT 1
    `);

    if (!ultimaInfo) {
      return res.json({
        success: true,
        torneo: null,
        fecha: null
      });
    }

    res.json({
      success: true,
      torneo: ultimaInfo.id_torneo,
      fecha: ultimaInfo.ultima_fecha,
      nombre_torneo: ultimaInfo.nombre_torneo
    });

  } catch (error) {
    console.error('[PRONOSTICOS] Error obteniendo última fecha:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener última fecha disponible'
    });
  }
};

/**
 * Obtener apuestas de todos los usuarios por partido
 * GET /api/pronosticos/apuestas-por-partido
 * Query params: idTorneo (opcional), fecha (opcional)
 * Solo accesible cuando las apuestas están deshabilitadas
 */
exports.getApuestasPorPartido = async (req, res) => {
  try {
    // Verificar que las apuestas estén deshabilitadas
    const [config] = await executeQuery(
      `SELECT valor FROM config_apuestas WHERE clave = 'apuestas_habilitadas'`
    );

    if (config && config.valor === 'true') {
      return res.status(403).json({
        success: false,
        error: 'Las apuestas de los usuarios solo están disponibles cuando las apuestas están cerradas'
      });
    }

    // Obtener torneo y fecha de query params O de configuración
    const { idTorneo, fecha } = req.query;

    let torneoFinal = idTorneo;
    let fechaFinal = fecha;

    // Si no se proporcionan parámetros, usar configuración
    if (!torneoFinal || !fechaFinal) {
      const configData = await executeQuery(
        `SELECT clave, valor FROM config_apuestas WHERE clave IN ('torneo_activo_id', 'fecha_habilitada')`
      );

      const configObj = {};
      configData.forEach(item => {
        configObj[item.clave] = item.valor;
      });

      torneoFinal = torneoFinal || configObj.torneo_activo_id;
      fechaFinal = fechaFinal || configObj.fecha_habilitada;
    }

    // Verificar si existe columna IMAGEN en DIM_EQUIPO
    let tieneColumnaImagen = false;
    try {
      await executeQuery(`SELECT IMAGEN FROM DIM_EQUIPO LIMIT 1`);
      tieneColumnaImagen = true;
    } catch (err) {
      console.log('[PRONOSTICOS] Columna IMAGEN no existe. Usar valores por defecto.');
    }

    // Construir query para obtener partidos con apuestas
    let queryPartidos = `
      SELECT DISTINCT
        p.ID_PARTIDO,
        p.NUMERO_JORNADA,
        p.FECHA_PARTIDO,
        p.GOLES_LOCAL,
        p.GOLES_VISITA,
        p.ESTADO_PARTIDO,
        t.NOMBRE as nombre_torneo,
        t.TEMPORADA,
        el.NOMBRE as equipo_local,
        el.ID_EQUIPO as id_equipo_local,
        ${tieneColumnaImagen ? "COALESCE(el.IMAGEN, 'default-team.png')" : "'default-team.png'"} as imagen_local,
        ev.NOMBRE as equipo_visita,
        ev.ID_EQUIPO as id_equipo_visita,
        ${tieneColumnaImagen ? "COALESCE(ev.IMAGEN, 'default-team.png')" : "'default-team.png'"} as imagen_visita
      FROM HECHOS_RESULTADOS p
      INNER JOIN DIM_TORNEO t ON p.ID_TORNEO = t.ID_TORNEO
      INNER JOIN DIM_EQUIPO el ON p.ID_EQUIPO_LOCAL = el.ID_EQUIPO
      INNER JOIN DIM_EQUIPO ev ON p.ID_EQUIPO_VISITA = ev.ID_EQUIPO
      INNER JOIN apuestas_usuarios a ON p.ID_PARTIDO = a.id_partido
      WHERE 1=1
    `;

    const params = [];

    // Filtrar por torneo si está especificado
    if (torneoFinal && torneoFinal !== '') {
      queryPartidos += ' AND p.ID_TORNEO = ?';
      params.push(torneoFinal);
    }

    // Filtrar por fecha si está especificada (no filtrar si es 'todas')
    if (fechaFinal && fechaFinal !== '' && fechaFinal !== 'todas') {
      queryPartidos += ' AND p.NUMERO_JORNADA = ?';
      params.push(fechaFinal);
    }

    queryPartidos += ' ORDER BY p.FECHA_PARTIDO, p.ID_PARTIDO';

    const partidos = await executeQuery(queryPartidos, params);

    // Para cada partido, obtener las apuestas de todos los usuarios
    const partidosConApuestas = [];

    for (const partido of partidos) {
      const apuestas = await executeQuery(
        `SELECT
          u.id_usuario,
          u.username,
          u.nombre_completo,
          a.tipo_apuesta,
          a.valor_cuota,
          a.retorno_potencial,
          a.estado,
          a.puntos_ganados,
          a.fecha_apuesta,
          ep.NOMBRE as equipo_predicho
        FROM apuestas_usuarios a
        INNER JOIN usuarios u ON a.id_usuario = u.id_usuario
        LEFT JOIN DIM_EQUIPO ep ON a.id_equipo_predicho = ep.ID_EQUIPO
        WHERE a.id_partido = ?
        ORDER BY a.fecha_apuesta ASC`,
        [partido.ID_PARTIDO]
      );

      // Contar apuestas por tipo
      const conteoApuestas = {
        local: apuestas.filter(a => a.tipo_apuesta === 'local').length,
        empate: apuestas.filter(a => a.tipo_apuesta === 'empate').length,
        visita: apuestas.filter(a => a.tipo_apuesta === 'visita').length,
        total: apuestas.length
      };

      partidosConApuestas.push({
        ...partido,
        apuestas,
        conteoApuestas
      });
    }

    res.json({
      success: true,
      partidos: partidosConApuestas,
      torneo: torneoFinal,
      fecha: fechaFinal
    });

  } catch (error) {
    console.error('[PRONOSTICOS] Error obteniendo apuestas por partido:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener apuestas por partido'
    });
  }
};
