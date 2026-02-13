const { executeQuery } = require('../config/database');

/**
 * Crear una apuesta
 * POST /api/apuestas
 * Body: { id_partido, tipo_apuesta, id_equipo_predicho, monto_apuesta }
 */
exports.crearApuesta = async (req, res) => {
  const idUsuario = req.user.id_usuario;
  const { id_partido, tipo_apuesta, id_equipo_predicho, monto_apuesta } = req.body;

  // Validar campos requeridos
  if (!id_partido || !tipo_apuesta) {
    return res.status(400).json({ error: 'id_partido y tipo_apuesta son requeridos' });
  }

  if (!['local', 'empate', 'visita'].includes(tipo_apuesta)) {
    return res.status(400).json({ error: 'tipo_apuesta debe ser: local, empate o visita' });
  }

  if (tipo_apuesta !== 'empate' && !id_equipo_predicho) {
    return res.status(400).json({
      error: 'id_equipo_predicho es requerido para apuestas de local/visita'
    });
  }

  try {
    // Verificar que el partido existe y está programado
    const [partido] = await executeQuery(
      'SELECT ID_PARTIDO, ID_TORNEO, ESTADO_PARTIDO FROM HECHOS_RESULTADOS WHERE ID_PARTIDO = ?',
      [id_partido]
    );

    if (!partido) {
      return res.status(404).json({ error: 'Partido no encontrado' });
    }

    if (partido.ESTADO_PARTIDO !== 'PROGRAMADO') {
      return res.status(400).json({
        error: 'Solo se puede apostar en partidos programados. Este partido ya finalizó o está en curso.'
      });
    }

    // Verificar que no existe una apuesta previa del usuario para este partido
    const [apuestaExistente] = await executeQuery(
      'SELECT id_apuesta FROM apuestas_usuarios WHERE id_usuario = ? AND id_partido = ?',
      [idUsuario, id_partido]
    );

    if (apuestaExistente) {
      return res.status(409).json({
        error: 'Ya has apostado en este partido. Solo se permite una apuesta por partido.'
      });
    }

    // Obtener la cuota correspondiente
    const [cuota] = await executeQuery(
      'SELECT cuota_decimal FROM cuotas_partidos WHERE id_partido = ? AND tipo_resultado = ? AND activa = 1',
      [id_partido, tipo_apuesta]
    );

    if (!cuota) {
      return res.status(404).json({
        error: 'Cuota no encontrada para esta opción de apuesta. El partido puede no tener cuotas configuradas.'
      });
    }

    // Monto fijo de apuesta: 10.000 pesos chilenos (no modificable)
    const MONTO_FIJO_APUESTA = 10000.00;
    const retornoPotencial = (MONTO_FIJO_APUESTA * cuota.cuota_decimal).toFixed(2);

    // Crear la apuesta
    const result = await executeQuery(
      `INSERT INTO apuestas_usuarios
        (id_usuario, id_partido, id_torneo, tipo_apuesta, id_equipo_predicho, monto_apuesta, valor_cuota, retorno_potencial, estado)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pendiente')`,
      [idUsuario, id_partido, partido.ID_TORNEO, tipo_apuesta, id_equipo_predicho || null, MONTO_FIJO_APUESTA, cuota.cuota_decimal, retornoPotencial]
    );

    console.log(`[APUESTAS] Nueva apuesta creada: Usuario ${req.user.username} apostó ${tipo_apuesta} en partido ${id_partido}`);

    res.status(201).json({
      message: 'Apuesta creada exitosamente',
      apuesta: {
        id_apuesta: result.insertId,
        id_partido,
        tipo_apuesta,
        monto_apuesta: MONTO_FIJO_APUESTA,
        valor_cuota: cuota.cuota_decimal,
        retorno_potencial: retornoPotencial,
        estado: 'pendiente'
      }
    });

  } catch (error) {
    console.error('[APUESTAS] Error creando apuesta:', error);
    res.status(500).json({ error: 'Error al crear apuesta' });
  }
};

/**
 * Crear múltiples apuestas en batch
 * POST /api/apuestas/batch
 * Body: { apuestas: [{ idPartido, tipo, cuota, idEquipoPredicho, partidoInfo }] }
 */
exports.crearApuestasBatch = async (req, res) => {
  const idUsuario = req.user.id_usuario;
  const { apuestas } = req.body;

  if (!apuestas || !Array.isArray(apuestas) || apuestas.length === 0) {
    return res.status(400).json({ error: 'Se requiere un array de apuestas' });
  }

  const exitosas = [];
  const fallidas = [];

  for (const apuesta of apuestas) {
    try {
      const { idPartido, tipo, idEquipoPredicho, partidoInfo } = apuesta;

      // Validar campos
      if (!idPartido || !tipo) {
        fallidas.push({
          equipoLocal: partidoInfo?.equipoLocal || 'Desconocido',
          equipoVisita: partidoInfo?.equipoVisita || 'Desconocido',
          tipoApuesta: tipo || 'N/A',
          error: 'Datos incompletos'
        });
        continue;
      }

      // Verificar que el partido existe y está programado
      const [partido] = await executeQuery(
        'SELECT ID_PARTIDO, ID_TORNEO, ESTADO_PARTIDO FROM HECHOS_RESULTADOS WHERE ID_PARTIDO = ?',
        [idPartido]
      );

      if (!partido || partido.ESTADO_PARTIDO !== 'PROGRAMADO') {
        fallidas.push({
          equipoLocal: partidoInfo?.equipoLocal || 'Desconocido',
          equipoVisita: partidoInfo?.equipoVisita || 'Desconocido',
          tipoApuesta: tipo,
          error: 'Partido no disponible para apostar'
        });
        continue;
      }

      // Verificar apuesta duplicada
      const [apuestaExistente] = await executeQuery(
        'SELECT id_apuesta FROM apuestas_usuarios WHERE id_usuario = ? AND id_partido = ?',
        [idUsuario, idPartido]
      );

      if (apuestaExistente) {
        fallidas.push({
          equipoLocal: partidoInfo?.equipoLocal || 'Desconocido',
          equipoVisita: partidoInfo?.equipoVisita || 'Desconocido',
          tipoApuesta: tipo,
          error: 'Ya apostaste en este partido'
        });
        continue;
      }

      // Obtener cuota
      const [cuotaData] = await executeQuery(
        'SELECT cuota_decimal FROM cuotas_partidos WHERE id_partido = ? AND tipo_resultado = ? AND activa = 1',
        [idPartido, tipo]
      );

      if (!cuotaData) {
        fallidas.push({
          equipoLocal: partidoInfo?.equipoLocal || 'Desconocido',
          equipoVisita: partidoInfo?.equipoVisita || 'Desconocido',
          tipoApuesta: tipo,
          error: 'Cuota no disponible'
        });
        continue;
      }

      // Crear apuesta
      const MONTO_FIJO_APUESTA = 10000.00;
      const retornoPotencial = (MONTO_FIJO_APUESTA * cuotaData.cuota_decimal).toFixed(2);

      await executeQuery(
        `INSERT INTO apuestas_usuarios
          (id_usuario, id_partido, id_torneo, tipo_apuesta, id_equipo_predicho, monto_apuesta, valor_cuota, retorno_potencial, estado)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pendiente')`,
        [idUsuario, idPartido, partido.ID_TORNEO, tipo, idEquipoPredicho || null, MONTO_FIJO_APUESTA, cuotaData.cuota_decimal, retornoPotencial]
      );

      exitosas.push({
        equipoLocal: partidoInfo?.equipoLocal || 'Desconocido',
        equipoVisita: partidoInfo?.equipoVisita || 'Desconocido',
        tipoApuesta: tipo
      });

    } catch (error) {
      console.error('[APUESTAS BATCH] Error en apuesta:', error);
      fallidas.push({
        equipoLocal: apuesta.partidoInfo?.equipoLocal || 'Desconocido',
        equipoVisita: apuesta.partidoInfo?.equipoVisita || 'Desconocido',
        tipoApuesta: apuesta.tipo || 'N/A',
        error: 'Error al procesar'
      });
    }
  }

  console.log(`[APUESTAS BATCH] Usuario ${req.user.username}: ${exitosas.length} exitosas, ${fallidas.length} fallidas`);

  res.status(200).json({
    message: `Proceso completado: ${exitosas.length} exitosas, ${fallidas.length} fallidas`,
    exitosas,
    fallidas
  });
};

/**
 * Obtener apuestas del usuario autenticado
 * GET /api/apuestas/mis-apuestas?estado=&torneo=&fecha=
 */
exports.getApuestasUsuario = async (req, res) => {
  const idUsuario = req.user.id_usuario;
  const { estado, torneo, fecha } = req.query;

  try {
    let query = `
      SELECT
        a.id_apuesta,
        a.id_partido,
        a.tipo_apuesta,
        a.monto_apuesta,
        a.valor_cuota,
        a.retorno_potencial,
        a.estado,
        a.puntos_ganados,
        a.fecha_apuesta,
        p.FECHA_PARTIDO,
        p.NUMERO_JORNADA,
        p.GOLES_LOCAL,
        p.GOLES_VISITA,
        p.ESTADO_PARTIDO,
        t.ID_TORNEO,
        t.NOMBRE as nombre_torneo,
        el.NOMBRE as equipo_local,
        el.IMAGEN as imagen_local,
        ev.NOMBRE as equipo_visita,
        ev.IMAGEN as imagen_visita,
        ep.NOMBRE as equipo_predicho
      FROM apuestas_usuarios a
      INNER JOIN HECHOS_RESULTADOS p ON a.id_partido = p.ID_PARTIDO
      INNER JOIN DIM_TORNEO t ON a.id_torneo = t.ID_TORNEO
      INNER JOIN DIM_EQUIPO el ON p.ID_EQUIPO_LOCAL = el.ID_EQUIPO
      INNER JOIN DIM_EQUIPO ev ON p.ID_EQUIPO_VISITA = ev.ID_EQUIPO
      LEFT JOIN DIM_EQUIPO ep ON a.id_equipo_predicho = ep.ID_EQUIPO
      WHERE a.id_usuario = ?
    `;

    const params = [idUsuario];

    if (estado) {
      query += ' AND a.estado = ?';
      params.push(estado);
    }

    if (torneo) {
      query += ' AND a.id_torneo = ?';
      params.push(torneo);
    }

    if (fecha) {
      query += ' AND p.NUMERO_JORNADA = ?';
      params.push(fecha);
    }

    query += ' ORDER BY p.NUMERO_JORNADA ASC, p.FECHA_PARTIDO ASC';

    const apuestas = await executeQuery(query, params);

    res.json({ apuestas });

  } catch (error) {
    console.error('[APUESTAS] Error obteniendo apuestas:', error);
    res.status(500).json({ error: 'Error al obtener apuestas' });
  }
};

/**
 * Liquidar apuestas de un partido (solo admin)
 * POST /api/apuestas/liquidar/:idPartido
 */
exports.liquidarApuestasPartido = async (req, res) => {
  const { idPartido } = req.params;

  try {
    // Obtener resultado del partido
    const [partido] = await executeQuery(
      `SELECT
        ID_PARTIDO,
        ID_TORNEO,
        ID_EQUIPO_LOCAL,
        ID_EQUIPO_VISITA,
        GOLES_LOCAL,
        GOLES_VISITA,
        ESTADO_PARTIDO
      FROM HECHOS_RESULTADOS
      WHERE ID_PARTIDO = ?`,
      [idPartido]
    );

    if (!partido) {
      return res.status(404).json({ error: 'Partido no encontrado' });
    }

    if (partido.ESTADO_PARTIDO === 'PROGRAMADO') {
      return res.status(400).json({ error: 'El partido aún no ha finalizado' });
    }

    if (partido.GOLES_LOCAL === null || partido.GOLES_VISITA === null) {
      return res.status(400).json({
        error: 'El partido no tiene resultado registrado. Actualiza el resultado antes de liquidar.'
      });
    }

    // Determinar resultado del partido
    let resultadoPartido;
    let equipoGanadorId = null;

    if (partido.GOLES_LOCAL > partido.GOLES_VISITA) {
      resultadoPartido = 'local';
      equipoGanadorId = partido.ID_EQUIPO_LOCAL;
    } else if (partido.GOLES_LOCAL < partido.GOLES_VISITA) {
      resultadoPartido = 'visita';
      equipoGanadorId = partido.ID_EQUIPO_VISITA;
    } else {
      resultadoPartido = 'empate';
    }

    console.log(`[LIQUIDACIÓN] Resultado del partido ${idPartido}: ${resultadoPartido} (${partido.GOLES_LOCAL}-${partido.GOLES_VISITA})`);

    // Obtener todas las apuestas pendientes del partido
    const apuestasPendientes = await executeQuery(
      'SELECT id_apuesta, id_usuario, tipo_apuesta, id_equipo_predicho, retorno_potencial FROM apuestas_usuarios WHERE id_partido = ? AND estado = "pendiente"',
      [idPartido]
    );

    if (apuestasPendientes.length === 0) {
      return res.status(200).json({
        message: 'No hay apuestas pendientes para liquidar en este partido',
        resultado_partido: resultadoPartido
      });
    }

    let apuestasGanadas = 0;
    let apuestasPerdidas = 0;

    // Liquidar cada apuesta
    for (const apuesta of apuestasPendientes) {
      // Normalizar valores para comparación (trim y lowercase)
      const tipoApuestaNormalizado = (apuesta.tipo_apuesta || '').toString().trim().toLowerCase();
      const resultadoNormalizado = resultadoPartido.toLowerCase();

      const esGanadora = tipoApuestaNormalizado === resultadoNormalizado;
      const nuevoEstado = esGanadora ? 'ganada' : 'perdida';
      const puntosGanados = esGanadora ? parseFloat(apuesta.retorno_potencial) : 0;

      console.log(`[LIQUIDACIÓN] Usuario ${apuesta.id_usuario}: apostó "${tipoApuestaNormalizado}" vs resultado "${resultadoNormalizado}" = ${esGanadora ? 'GANÓ' : 'PERDIÓ'}`);

      // Actualizar estado de la apuesta
      await executeQuery(
        'UPDATE apuestas_usuarios SET estado = ?, puntos_ganados = ? WHERE id_apuesta = ?',
        [nuevoEstado, puntosGanados, apuesta.id_apuesta]
      );

      // Si ganó, registrar en historial de puntos
      if (esGanadora) {
        await executeQuery(
          'INSERT INTO historial_puntos (id_usuario, id_apuesta, id_partido, id_torneo, puntos_ganados) VALUES (?, ?, ?, ?, ?)',
          [apuesta.id_usuario, apuesta.id_apuesta, idPartido, partido.ID_TORNEO, puntosGanados]
        );
        apuestasGanadas++;
      } else {
        apuestasPerdidas++;
      }
    }

    console.log(`[APUESTAS] Liquidación completada: Partido ${idPartido} - Resultado: ${resultadoPartido} - Ganadas: ${apuestasGanadas}, Perdidas: ${apuestasPerdidas}`);

    res.json({
      message: 'Apuestas liquidadas exitosamente',
      resultado_partido: resultadoPartido,
      apuestas_ganadas: apuestasGanadas,
      apuestas_perdidas: apuestasPerdidas,
      total_liquidadas: apuestasPendientes.length
    });

  } catch (error) {
    console.error('[APUESTAS] Error liquidando apuestas:', error);
    res.status(500).json({ error: 'Error al liquidar apuestas' });
  }
};

/**
 * Obtener usuarios con sus apuestas en un torneo específico (solo admin)
 * GET /api/apuestas/admin/usuarios-torneo/:idTorneo
 */
exports.getUsuariosConApuestas = async (req, res) => {
  const { idTorneo } = req.params;

  try {
    console.log(`[APUESTAS] Admin ${req.user.username} consultando usuarios con apuestas del torneo ${idTorneo}`);

    // Obtener todos los usuarios (excepto admins)
    const usuarios = await executeQuery(
      `SELECT
        id_usuario,
        username,
        email,
        nombre_completo,
        role,
        fecha_creacion
      FROM usuarios
      WHERE role = 'usuario' AND activo = 1
      ORDER BY username`
    );

    // Para cada usuario, obtener sus apuestas del torneo
    const usuariosConApuestas = await Promise.all(
      usuarios.map(async (usuario) => {
        const apuestas = await executeQuery(
          `SELECT
            a.id_apuesta,
            a.id_partido,
            a.tipo_apuesta,
            a.monto_apuesta,
            a.valor_cuota,
            a.retorno_potencial,
            a.estado,
            a.puntos_ganados,
            a.fecha_apuesta,
            p.FECHA_PARTIDO,
            p.NUMERO_JORNADA,
            p.GOLES_LOCAL,
            p.GOLES_VISITA,
            p.ESTADO_PARTIDO,
            el.NOMBRE as equipo_local,
            ev.NOMBRE as equipo_visita,
            ep.NOMBRE as equipo_predicho
          FROM apuestas_usuarios a
          INNER JOIN HECHOS_RESULTADOS p ON a.id_partido = p.ID_PARTIDO
          INNER JOIN DIM_EQUIPO el ON p.ID_EQUIPO_LOCAL = el.ID_EQUIPO
          INNER JOIN DIM_EQUIPO ev ON p.ID_EQUIPO_VISITA = ev.ID_EQUIPO
          LEFT JOIN DIM_EQUIPO ep ON a.id_equipo_predicho = ep.ID_EQUIPO
          WHERE a.id_usuario = ? AND a.id_torneo = ?
          ORDER BY p.FECHA_PARTIDO DESC`,
          [usuario.id_usuario, idTorneo]
        );

        // Calcular estadísticas del usuario en este torneo
        const [stats] = await executeQuery(
          `SELECT
            COUNT(*) as total_apuestas,
            SUM(CASE WHEN estado = 'ganada' THEN 1 ELSE 0 END) as apuestas_ganadas,
            SUM(CASE WHEN estado = 'perdida' THEN 1 ELSE 0 END) as apuestas_perdidas,
            SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as apuestas_pendientes,
            COALESCE(SUM(puntos_ganados), 0) as total_puntos
          FROM apuestas_usuarios
          WHERE id_usuario = ? AND id_torneo = ?`,
          [usuario.id_usuario, idTorneo]
        );

        return {
          ...usuario,
          apuestas,
          estadisticas: stats || {
            total_apuestas: 0,
            apuestas_ganadas: 0,
            apuestas_perdidas: 0,
            apuestas_pendientes: 0,
            total_puntos: 0
          }
        };
      })
    );

    res.json({
      success: true,
      usuarios: usuariosConApuestas
    });

  } catch (error) {
    console.error('[APUESTAS] Error obteniendo usuarios con apuestas:', error);
    res.status(500).json({ error: 'Error al obtener usuarios con apuestas' });
  }
};

/**
 * Limpiar apuestas de un usuario en un torneo específico (solo admin)
 * DELETE /api/apuestas/admin/limpiar/:idUsuario/:idTorneo
 */
exports.limpiarApuestasUsuario = async (req, res) => {
  const { idUsuario, idTorneo } = req.params;
  const { fecha } = req.query; // Fecha opcional desde query params

  try {
    const fechaTexto = fecha ? ` (Fecha ${fecha})` : '';
    console.log(`[APUESTAS] Admin ${req.user.username} limpiando apuestas del usuario ${idUsuario} en torneo ${idTorneo}${fechaTexto}`);

    // Verificar que el usuario existe
    const [usuario] = await executeQuery(
      'SELECT id_usuario, username FROM usuarios WHERE id_usuario = ?',
      [idUsuario]
    );

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Verificar que el torneo existe
    const [torneo] = await executeQuery(
      'SELECT ID_TORNEO, NOMBRE FROM DIM_TORNEO WHERE ID_TORNEO = ?',
      [idTorneo]
    );

    if (!torneo) {
      return res.status(404).json({ error: 'Torneo no encontrado' });
    }

    // Construir queries dinámicamente según si hay fecha o no
    let countQuery = `
      SELECT COUNT(*) as total
      FROM apuestas_usuarios au
      INNER JOIN HECHOS_RESULTADOS hr ON au.id_partido = hr.ID_PARTIDO
      WHERE au.id_usuario = ? AND au.id_torneo = ?
    `;
    let deleteHistorialQuery = `
      DELETE hp FROM historial_puntos hp
      INNER JOIN apuestas_usuarios au ON hp.id_apuesta = au.id_apuesta
      INNER JOIN HECHOS_RESULTADOS hr ON au.id_partido = hr.ID_PARTIDO
      WHERE hp.id_usuario = ? AND hp.id_torneo = ?
    `;
    let deleteApuestasQuery = `
      DELETE au FROM apuestas_usuarios au
      INNER JOIN HECHOS_RESULTADOS hr ON au.id_partido = hr.ID_PARTIDO
      WHERE au.id_usuario = ? AND au.id_torneo = ?
    `;

    const queryParams = [idUsuario, idTorneo];

    // Si se especifica fecha, agregar filtro
    if (fecha) {
      countQuery += ' AND hr.FECHA_TORNEO = ?';
      deleteHistorialQuery += ' AND hr.FECHA_TORNEO = ?';
      deleteApuestasQuery += ' AND hr.FECHA_TORNEO = ?';
      queryParams.push(fecha);
    }

    // Obtener el conteo de apuestas antes de eliminar
    const [countResult] = await executeQuery(countQuery, queryParams);

    const totalApuestas = countResult.total;

    if (totalApuestas === 0) {
      return res.status(200).json({
        message: `El usuario ${usuario.username} no tiene apuestas en el torneo ${torneo.NOMBRE}${fechaTexto}`,
        apuestas_eliminadas: 0
      });
    }

    // Eliminar historial de puntos asociados a estas apuestas
    await executeQuery(deleteHistorialQuery, queryParams);

    // Eliminar las apuestas del usuario en el torneo (y fecha si aplica)
    await executeQuery(deleteApuestasQuery, queryParams);

    console.log(`[APUESTAS] Limpieza completada: ${totalApuestas} apuestas eliminadas del usuario ${usuario.username} en torneo ${torneo.NOMBRE}${fechaTexto}`);

    res.json({
      message: `Apuestas del usuario ${usuario.username} eliminadas exitosamente del torneo ${torneo.NOMBRE}${fechaTexto}`,
      usuario: usuario.username,
      torneo: torneo.NOMBRE,
      fecha: fecha || 'Todas',
      apuestas_eliminadas: totalApuestas
    });

  } catch (error) {
    console.error('[APUESTAS] Error limpiando apuestas:', error);
    res.status(500).json({ error: 'Error al limpiar apuestas del usuario' });
  }
};

/**
 * Obtener estadísticas de apuestas del usuario
 * GET /api/apuestas/estadisticas
 */
exports.getEstadisticasUsuario = async (req, res) => {
  const idUsuario = req.user.id_usuario;

  try {
    console.log(`[APUESTAS] Obteniendo estadísticas para usuario ${idUsuario}`);

    const results = await executeQuery(
      `SELECT
        COUNT(*) as total_apuestas,
        SUM(CASE WHEN estado = 'ganada' THEN 1 ELSE 0 END) as apuestas_ganadas,
        SUM(CASE WHEN estado = 'perdida' THEN 1 ELSE 0 END) as apuestas_perdidas,
        SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as apuestas_pendientes,
        COALESCE(SUM(puntos_ganados), 0) as total_puntos,
        ROUND(
          CASE
            WHEN COUNT(*) > 0
            THEN (SUM(CASE WHEN estado = 'ganada' THEN 1 ELSE 0 END) * 100.0 / COUNT(*))
            ELSE 0
          END,
          2
        ) as porcentaje_aciertos
      FROM apuestas_usuarios
      WHERE id_usuario = ?`,
      [idUsuario]
    );

    const stats = results && results.length > 0 ? results[0] : null;

    const estadisticas = {
      total_apuestas: stats?.total_apuestas || 0,
      apuestas_ganadas: stats?.apuestas_ganadas || 0,
      apuestas_perdidas: stats?.apuestas_perdidas || 0,
      apuestas_pendientes: stats?.apuestas_pendientes || 0,
      total_puntos: parseFloat(stats?.total_puntos || 0),
      porcentaje_aciertos: parseFloat(stats?.porcentaje_aciertos || 0)
    };

    console.log(`[APUESTAS] Estadísticas obtenidas:`, estadisticas);

    res.json({ estadisticas });

  } catch (error) {
    console.error('[APUESTAS] Error obteniendo estadísticas:', error);
    console.error('[APUESTAS] Error stack:', error.stack);

    // Retornar estadísticas vacías en caso de error
    res.json({
      estadisticas: {
        total_apuestas: 0,
        apuestas_ganadas: 0,
        apuestas_perdidas: 0,
        apuestas_pendientes: 0,
        total_puntos: 0,
        porcentaje_aciertos: 0
      }
    });
  }
};

/**
 * Obtener torneos y fechas donde el usuario tiene apuestas
 * GET /api/apuestas/torneos-fechas
 */
exports.getTorneosYFechasUsuario = async (req, res) => {
  const idUsuario = req.user.id_usuario;

  try {
    // Obtener torneos únicos donde el usuario tiene apuestas
    const torneos = await executeQuery(
      `SELECT DISTINCT
        t.ID_TORNEO,
        t.NOMBRE,
        t.TEMPORADA,
        t.RUEDA,
        t.FORMATO_TORNEO
      FROM apuestas_usuarios a
      INNER JOIN DIM_TORNEO t ON a.id_torneo = t.ID_TORNEO
      WHERE a.id_usuario = ?
      ORDER BY t.TEMPORADA DESC, t.NOMBRE ASC`,
      [idUsuario]
    );

    // Obtener fechas únicas por torneo donde el usuario tiene apuestas
    const fechasPorTorneo = {};

    for (const torneo of torneos) {
      const fechas = await executeQuery(
        `SELECT DISTINCT p.NUMERO_JORNADA
        FROM apuestas_usuarios a
        INNER JOIN HECHOS_RESULTADOS p ON a.id_partido = p.ID_PARTIDO
        WHERE a.id_usuario = ?
          AND a.id_torneo = ?
          AND p.NUMERO_JORNADA IS NOT NULL
        ORDER BY p.NUMERO_JORNADA ASC`,
        [idUsuario, torneo.ID_TORNEO]
      );

      const fechasArray = fechas.map(f => f.NUMERO_JORNADA).filter(Boolean);

      console.log(`[APUESTAS] Fechas encontradas para torneo ${torneo.ID_TORNEO}:`, {
        fechasRaw: fechas,
        fechasArray: fechasArray
      });

      fechasPorTorneo[torneo.ID_TORNEO] = fechasArray;
    }

    console.log('[APUESTAS] Torneos y fechas del usuario:', {
      torneos: torneos.map(t => ({ id: t.ID_TORNEO, nombre: t.NOMBRE })),
      fechasPorTorneo
    });

    res.json({
      torneos,
      fechasPorTorneo
    });

  } catch (error) {
    console.error('[APUESTAS] Error obteniendo torneos y fechas:', error);
    res.status(500).json({ error: 'Error al obtener torneos y fechas' });
  }
};

/**
 * Obtener partidos por torneo y fecha (para verificación antes de limpiar)
 * GET /api/apuestas/partidos-por-fecha?torneoId=X&fecha=Y
 */
exports.getPartidosPorFecha = async (req, res) => {
  const { torneoId, fecha } = req.query;

  try {
    console.log(`[APUESTAS] Admin ${req.user.username} consultando partidos del torneo ${torneoId}, fecha ${fecha}`);

    if (!torneoId || !fecha) {
      return res.status(400).json({ error: 'torneoId y fecha son requeridos' });
    }

    // Obtener partidos de la fecha especificada con información de apuestas
    const partidos = await executeQuery(
      `SELECT
        p.ID_PARTIDO,
        p.FECHA_PARTIDO,
        p.NUMERO_JORNADA as FECHA_TORNEO,
        p.ESTADO_PARTIDO,
        p.GOLES_LOCAL,
        p.GOLES_VISITA,
        el.NOMBRE as equipo_local,
        ev.NOMBRE as equipo_visita,
        COUNT(a.id_apuesta) as total_apuestas
      FROM HECHOS_RESULTADOS p
      INNER JOIN DIM_EQUIPO el ON p.ID_EQUIPO_LOCAL = el.ID_EQUIPO
      INNER JOIN DIM_EQUIPO ev ON p.ID_EQUIPO_VISITA = ev.ID_EQUIPO
      LEFT JOIN apuestas_usuarios a ON p.ID_PARTIDO = a.id_partido
      WHERE p.ID_TORNEO = ? AND p.NUMERO_JORNADA = ?
      GROUP BY p.ID_PARTIDO
      ORDER BY p.FECHA_PARTIDO ASC`,
      [torneoId, fecha]
    );

    res.json({
      success: true,
      partidos
    });

  } catch (error) {
    console.error('[APUESTAS] Error obteniendo partidos por fecha:', error);
    res.status(500).json({ error: 'Error al obtener partidos' });
  }
};

/**
 * Limpiar resultados de partidos para modo replay (solo admin)
 * POST /api/apuestas/limpiar-resultados
 * Body: { torneoId, fecha }
 */
exports.limpiarResultados = async (req, res) => {
  const { torneoId, fecha } = req.body;

  try {
    console.log(`[APUESTAS] Admin ${req.user.username} limpiando resultados del torneo ${torneoId}, fecha ${fecha}`);

    if (!torneoId || !fecha) {
      return res.status(400).json({ error: 'torneoId y fecha son requeridos' });
    }

    // Obtener información del torneo
    const [torneo] = await executeQuery(
      'SELECT ID_TORNEO, NOMBRE FROM DIM_TORNEO WHERE ID_TORNEO = ?',
      [torneoId]
    );

    if (!torneo) {
      return res.status(404).json({ error: 'Torneo no encontrado' });
    }

    // Contar partidos afectados
    const [countResult] = await executeQuery(
      `SELECT COUNT(*) as total
      FROM HECHOS_RESULTADOS
      WHERE ID_TORNEO = ? AND NUMERO_JORNADA = ?`,
      [torneoId, fecha]
    );

    const totalPartidos = countResult.total;

    if (totalPartidos === 0) {
      return res.status(404).json({
        error: `No se encontraron partidos para el torneo ${torneo.NOMBRE}, fecha ${fecha}`
      });
    }

    // 1. Marcar todas las apuestas de estos partidos como "pendiente" y resetear puntos
    const updateApuestasResult = await executeQuery(
      `UPDATE apuestas_usuarios a
      INNER JOIN HECHOS_RESULTADOS p ON a.id_partido = p.ID_PARTIDO
      SET a.estado = 'pendiente', a.puntos_ganados = 0
      WHERE p.ID_TORNEO = ? AND p.NUMERO_JORNADA = ?`,
      [torneoId, fecha]
    );

    const apuestasActualizadas = updateApuestasResult.affectedRows || 0;

    // 2. Eliminar registros de historial_puntos de estas apuestas
    await executeQuery(
      `DELETE hp FROM historial_puntos hp
      INNER JOIN apuestas_usuarios a ON hp.id_apuesta = a.id_apuesta
      INNER JOIN HECHOS_RESULTADOS p ON a.id_partido = p.ID_PARTIDO
      WHERE p.ID_TORNEO = ? AND p.NUMERO_JORNADA = ?`,
      [torneoId, fecha]
    );

    // 3. Limpiar resultados de los partidos (goles a NULL, estado a PROGRAMADO)
    await executeQuery(
      `UPDATE HECHOS_RESULTADOS
      SET GOLES_LOCAL = NULL,
          GOLES_VISITA = NULL,
          ESTADO_PARTIDO = 'PROGRAMADO'
      WHERE ID_TORNEO = ? AND NUMERO_JORNADA = ?`,
      [torneoId, fecha]
    );

    console.log(`[APUESTAS] Limpieza completada: ${totalPartidos} partidos, ${apuestasActualizadas} apuestas marcadas como pendientes`);

    res.json({
      success: true,
      message: 'Resultados limpiados exitosamente',
      torneo: torneo.NOMBRE,
      fecha: fecha,
      partidos_actualizados: totalPartidos,
      apuestas_actualizadas: apuestasActualizadas
    });

  } catch (error) {
    console.error('[APUESTAS] Error limpiando resultados:', error);
    res.status(500).json({ error: 'Error al limpiar resultados de partidos' });
  }
};
