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

    res.json({
      success: true,
      config: configObj
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
      WHERE p.ESTADO_PARTIDO = 'PROGRAMADO'
      ORDER BY t.TEMPORADA DESC, t.NOMBRE`
    );

    // Para cada torneo, obtener las fechas disponibles
    const torneosConFechas = await Promise.all(
      torneos.map(async (torneo) => {
        const fechas = await executeQuery(
          `SELECT DISTINCT NUMERO_JORNADA
          FROM HECHOS_RESULTADOS
          WHERE ID_TORNEO = ? AND ESTADO_PARTIDO = 'PROGRAMADO' AND NUMERO_JORNADA IS NOT NULL
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
