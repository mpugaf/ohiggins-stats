const { executeQuery } = require('../config/database');

/**
 * Obtener configuración global de apuestas
 * GET /api/config-apuestas
 */
exports.getConfig = async (req, res) => {
  try {
    const config = await executeQuery(
      'SELECT clave, valor, descripcion FROM config_apuestas'
    );

    // Convertir array a objeto para fácil acceso
    const configObj = {};
    config.forEach(item => {
      configObj[item.clave] = item.valor;
    });

    // Obtener información completa del torneo activo si existe
    let torneoActivoNombre = null;
    if (configObj.torneo_activo_id) {
      try {
        const [torneo] = await executeQuery(
          'SELECT NOMBRE, TEMPORADA, RUEDA FROM DIM_TORNEO WHERE ID_TORNEO = ?',
          [configObj.torneo_activo_id]
        );

        if (torneo) {
          // Formatear: "Nombre Año - Rueda rueda"
          let ruedaFormateada = '';
          if (torneo.RUEDA && typeof torneo.RUEDA === 'string' && torneo.RUEDA.length > 0) {
            ruedaFormateada = torneo.RUEDA.charAt(0).toUpperCase() + torneo.RUEDA.slice(1).toLowerCase() + ' rueda';
          }
          torneoActivoNombre = `${torneo.NOMBRE || ''} ${torneo.TEMPORADA || ''}${ruedaFormateada ? ' - ' + ruedaFormateada : ''}`.trim();
        }
      } catch (err) {
        console.error('[CONFIG] Error obteniendo info del torneo:', err);
      }
    }

    res.json({
      success: true,
      config: {
        ...configObj,
        torneo_activo_nombre: torneoActivoNombre
      }
    });

  } catch (error) {
    console.error('[CONFIG] Error obteniendo configuración:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener configuración'
    });
  }
};

/**
 * Actualizar configuración de apuestas (solo admin)
 * PUT /api/config-apuestas
 * Body: { apuestas_habilitadas, torneo_activo_id, fecha_habilitada }
 */
exports.updateConfig = async (req, res) => {
  try {
    const { apuestas_habilitadas, torneo_activo_id, fecha_habilitada } = req.body;

    // Actualizar apuestas_habilitadas
    if (apuestas_habilitadas !== undefined) {
      await executeQuery(
        'UPDATE config_apuestas SET valor = ? WHERE clave = ?',
        [apuestas_habilitadas ? 'true' : 'false', 'apuestas_habilitadas']
      );
    }

    // Actualizar torneo_activo_id
    if (torneo_activo_id !== undefined) {
      await executeQuery(
        'UPDATE config_apuestas SET valor = ? WHERE clave = ?',
        [torneo_activo_id || '', 'torneo_activo_id']
      );
    }

    // Actualizar fecha_habilitada
    if (fecha_habilitada !== undefined) {
      await executeQuery(
        'UPDATE config_apuestas SET valor = ? WHERE clave = ?',
        [fecha_habilitada || '', 'fecha_habilitada']
      );
    }

    console.log(`[CONFIG] Configuración actualizada por admin ${req.user.username}`);

    res.json({
      success: true,
      message: 'Configuración actualizada exitosamente'
    });

  } catch (error) {
    console.error('[CONFIG] Error actualizando configuración:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar configuración'
    });
  }
};

/**
 * Obtener torneos disponibles con sus fechas
 * GET /api/config-apuestas/torneos-fechas
 * NOTA: Muestra TODAS las fechas (incluso finalizadas) para permitir modo "replay"
 */
exports.getTorneosFechas = async (req, res) => {
  try {
    const torneos = await executeQuery(
      `SELECT DISTINCT
        t.ID_TORNEO,
        t.NOMBRE,
        t.TEMPORADA,
        t.RUEDA
      FROM DIM_TORNEO t
      INNER JOIN HECHOS_RESULTADOS p ON t.ID_TORNEO = p.ID_TORNEO
      ORDER BY t.TEMPORADA DESC, t.NOMBRE`
    );

    // Para cada torneo, obtener TODAS las fechas disponibles (sin filtrar por estado)
    const torneosConFechas = await Promise.all(
      torneos.map(async (torneo) => {
        const fechas = await executeQuery(
          `SELECT DISTINCT NUMERO_JORNADA
          FROM HECHOS_RESULTADOS
          WHERE ID_TORNEO = ? AND NUMERO_JORNADA IS NOT NULL
          ORDER BY NUMERO_JORNADA`,
          [torneo.ID_TORNEO]
        );

        return {
          ...torneo,
          fechas: fechas.map(f => f.NUMERO_JORNADA)
        };
      })
    );

    res.json({
      success: true,
      torneos: torneosConFechas
    });

  } catch (error) {
    console.error('[CONFIG] Error obteniendo torneos y fechas:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener torneos y fechas'
    });
  }
};

/**
 * Obtener partidos de un torneo/fecha específica con sus cuotas
 * GET /api/config-apuestas/partidos/:idTorneo/:fecha
 */
exports.getPartidosPorTorneoFecha = async (req, res) => {
  try {
    const { idTorneo, fecha } = req.params;

    // Verificar si existe la columna IMAGEN en DIM_EQUIPO
    let tieneColumnaImagen = false;
    try {
      await executeQuery(`SELECT IMAGEN FROM DIM_EQUIPO LIMIT 1`);
      tieneColumnaImagen = true;
    } catch (err) {
      console.log('[CONFIG] Columna IMAGEN no existe aún. Usar valores por defecto.');
    }

    // Obtener partidos del torneo/fecha (incluye todos los estados)
    let query = `
      SELECT
        p.ID_PARTIDO,
        p.MATCH_ID_FBR,
        p.FECHA_PARTIDO,
        p.ESTADO_PARTIDO,
        p.NUMERO_JORNADA,
        p.GOLES_LOCAL,
        p.GOLES_VISITA,
        el.NOMBRE as equipo_local,
        el.ID_EQUIPO as id_equipo_local,
        ${tieneColumnaImagen ? "COALESCE(el.IMAGEN, 'default-team.png')" : "'default-team.png'"} as imagen_local,
        ev.NOMBRE as equipo_visita,
        ev.ID_EQUIPO as id_equipo_visita,
        ${tieneColumnaImagen ? "COALESCE(ev.IMAGEN, 'default-team.png')" : "'default-team.png'"} as imagen_visita
      FROM HECHOS_RESULTADOS p
      INNER JOIN DIM_EQUIPO el ON p.ID_EQUIPO_LOCAL = el.ID_EQUIPO
      INNER JOIN DIM_EQUIPO ev ON p.ID_EQUIPO_VISITA = ev.ID_EQUIPO
      WHERE p.ID_TORNEO = ?
    `;

    const params = [idTorneo];

    if (fecha && fecha !== 'todas') {
      query += ' AND p.NUMERO_JORNADA = ?';
      params.push(fecha);
    }

    query += ' ORDER BY p.FECHA_PARTIDO ASC';

    const partidos = await executeQuery(query, params);

    // Para cada partido, obtener sus cuotas
    const partidosConCuotas = await Promise.all(
      partidos.map(async (partido) => {
        const cuotas = await executeQuery(
          `SELECT id_cuota, tipo_resultado, id_equipo, cuota_decimal, activa
          FROM cuotas_partidos
          WHERE id_partido = ?
          ORDER BY
            CASE tipo_resultado
              WHEN 'local' THEN 1
              WHEN 'empate' THEN 2
              WHEN 'visita' THEN 3
            END`,
          [partido.ID_PARTIDO]
        );

        return {
          ...partido,
          cuotas: cuotas || [],
          tiene_cuotas: cuotas && cuotas.length === 3
        };
      })
    );

    res.json({
      success: true,
      partidos: partidosConCuotas
    });

  } catch (error) {
    console.error('[CONFIG] Error obteniendo partidos:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener partidos'
    });
  }
};
