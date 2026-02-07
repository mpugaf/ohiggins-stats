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
 * Basado en apuestas de 10,000 pesos por partido
 */
exports.getTablaPosiciones = async (req, res) => {
  try {
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
        u.id_usuario,
        u.username,
        u.nombre_completo,
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
      torneo: configObj.torneo_activo_id,
      fecha: configObj.fecha_habilitada
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
 * Obtener apuestas de todos los usuarios por partido
 * GET /api/pronosticos/apuestas-por-partido
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

    // Obtener torneo y fecha configurados
    const configData = await executeQuery(
      `SELECT clave, valor FROM config_apuestas WHERE clave IN ('torneo_activo_id', 'fecha_habilitada')`
    );

    const configObj = {};
    configData.forEach(item => {
      configObj[item.clave] = item.valor;
    });

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

    // Filtrar por torneo si está configurado
    if (configObj.torneo_activo_id && configObj.torneo_activo_id !== '') {
      queryPartidos += ' AND p.ID_TORNEO = ?';
      params.push(configObj.torneo_activo_id);
    }

    // Filtrar por fecha si está configurada
    if (configObj.fecha_habilitada && configObj.fecha_habilitada !== '') {
      queryPartidos += ' AND p.NUMERO_JORNADA = ?';
      params.push(configObj.fecha_habilitada);
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
      torneo: configObj.torneo_activo_id,
      fecha: configObj.fecha_habilitada
    });

  } catch (error) {
    console.error('[PRONOSTICOS] Error obteniendo apuestas por partido:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener apuestas por partido'
    });
  }
};
