const { executeQuery } = require('../config/database');

/**
 * Obtener todas las asignaciones de jugadores a torneos y equipos
 * GET /api/torneo-jugador
 */
exports.getAsignaciones = async (req, res) => {
  try {
    const asignaciones = await executeQuery(`
      SELECT
        tj.ID_TORNEO_JUGADOR,
        tj.ID_JUGADOR,
        tj.ID_EQUIPO,
        tj.ID_TORNEO,
        tj.NUMERO_CAMISETA,
        tj.FECHA_INCORPORACION,
        tj.FECHA_SALIDA,
        tj.ESTADO,
        j.NOMBRE_COMPLETO as jugador_nombre,
        j.APODO as jugador_apodo,
        e.NOMBRE as equipo_nombre,
        e.APODO as equipo_apodo,
        e.IMAGEN as equipo_imagen,
        t.NOMBRE as torneo_nombre,
        t.TEMPORADA as torneo_temporada,
        t.RUEDA as torneo_rueda
      FROM DIM_TORNEO_JUGADOR tj
      INNER JOIN DIM_JUGADOR j ON tj.ID_JUGADOR = j.ID_JUGADOR
      INNER JOIN DIM_EQUIPO e ON tj.ID_EQUIPO = e.ID_EQUIPO
      INNER JOIN DIM_TORNEO t ON tj.ID_TORNEO = t.ID_TORNEO
      ORDER BY t.TEMPORADA DESC, j.NOMBRE_COMPLETO ASC
    `);

    res.json({ asignaciones });
  } catch (error) {
    console.error('[TORNEO_JUGADOR] Error obteniendo asignaciones:', error);
    res.status(500).json({ error: 'Error al obtener asignaciones' });
  }
};

/**
 * Obtener asignaciones de un jugador específico
 * GET /api/torneo-jugador/jugador/:idJugador
 */
exports.getAsignacionesPorJugador = async (req, res) => {
  const { idJugador } = req.params;

  try {
    const asignaciones = await executeQuery(`
      SELECT
        tj.ID_TORNEO_JUGADOR,
        tj.ID_JUGADOR,
        tj.ID_EQUIPO,
        tj.ID_TORNEO,
        tj.NUMERO_CAMISETA,
        tj.FECHA_INCORPORACION,
        tj.FECHA_SALIDA,
        tj.ESTADO,
        e.NOMBRE as equipo_nombre,
        e.APODO as equipo_apodo,
        e.IMAGEN as equipo_imagen,
        t.NOMBRE as torneo_nombre,
        t.TEMPORADA as torneo_temporada,
        t.RUEDA as torneo_rueda
      FROM DIM_TORNEO_JUGADOR tj
      INNER JOIN DIM_EQUIPO e ON tj.ID_EQUIPO = e.ID_EQUIPO
      INNER JOIN DIM_TORNEO t ON tj.ID_TORNEO = t.ID_TORNEO
      WHERE tj.ID_JUGADOR = ?
      ORDER BY t.TEMPORADA DESC, t.RUEDA ASC
    `, [idJugador]);

    res.json({ asignaciones });
  } catch (error) {
    console.error('[TORNEO_JUGADOR] Error obteniendo asignaciones del jugador:', error);
    res.status(500).json({ error: 'Error al obtener asignaciones del jugador' });
  }
};

/**
 * Obtener la última asignación activa de un jugador
 * GET /api/torneo-jugador/jugador/:idJugador/ultima
 */
exports.getUltimaAsignacion = async (req, res) => {
  const { idJugador } = req.params;

  try {
    const [ultimaAsignacion] = await executeQuery(`
      SELECT
        tj.ID_TORNEO_JUGADOR,
        tj.ID_JUGADOR,
        tj.ID_EQUIPO,
        tj.ID_TORNEO,
        tj.NUMERO_CAMISETA,
        tj.FECHA_INCORPORACION,
        tj.FECHA_SALIDA,
        tj.ESTADO,
        e.NOMBRE as equipo_nombre,
        e.APODO as equipo_apodo,
        e.IMAGEN as equipo_imagen,
        t.NOMBRE as torneo_nombre,
        t.TEMPORADA as torneo_temporada,
        t.RUEDA as torneo_rueda
      FROM DIM_TORNEO_JUGADOR tj
      INNER JOIN DIM_EQUIPO e ON tj.ID_EQUIPO = e.ID_EQUIPO
      INNER JOIN DIM_TORNEO t ON tj.ID_TORNEO = t.ID_TORNEO
      WHERE tj.ID_JUGADOR = ?
      ORDER BY t.TEMPORADA DESC, t.RUEDA DESC, tj.FECHA_INCORPORACION DESC
      LIMIT 1
    `, [idJugador]);

    if (!ultimaAsignacion) {
      // No es un error, simplemente el jugador no tiene asignaciones previas
      return res.json({
        success: true,
        asignacion: null,
        message: 'Jugador sin asignaciones previas'
      });
    }

    res.json({
      success: true,
      asignacion: ultimaAsignacion
    });
  } catch (error) {
    console.error('[TORNEO_JUGADOR] Error obteniendo última asignación:', error);
    res.status(500).json({ error: 'Error al obtener última asignación del jugador' });
  }
};

/**
 * Crear una nueva asignación
 * POST /api/torneo-jugador
 * Body: { idJugador, idEquipo, idTorneo, numeroCamiseta?, fechaIncorporacion?, estado? }
 */
exports.crearAsignacion = async (req, res) => {
  const { idJugador, idEquipo, idTorneo, numeroCamiseta, fechaIncorporacion, estado } = req.body;

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('[CREAR_ASIGNACION] Datos recibidos:');
  console.log('  - Jugador ID:', idJugador);
  console.log('  - Equipo ID:', idEquipo);
  console.log('  - Torneo ID:', idTorneo);
  console.log('  - Número Camiseta:', numeroCamiseta || 'N/A');
  console.log('  - Fecha Incorporación:', fechaIncorporacion || 'N/A');
  console.log('  - Estado:', estado || 'N/A');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Validar campos requeridos
  if (!idJugador || !idEquipo || !idTorneo) {
    return res.status(400).json({ error: 'idJugador, idEquipo e idTorneo son requeridos' });
  }

  try {
    // Verificar que el jugador existe
    const [jugador] = await executeQuery(
      'SELECT ID_JUGADOR FROM DIM_JUGADOR WHERE ID_JUGADOR = ?',
      [idJugador]
    );
    if (!jugador) {
      return res.status(404).json({ error: 'Jugador no encontrado' });
    }

    // Verificar que el equipo existe
    const [equipo] = await executeQuery(
      'SELECT ID_EQUIPO FROM DIM_EQUIPO WHERE ID_EQUIPO = ?',
      [idEquipo]
    );
    if (!equipo) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }

    // Verificar que el torneo existe
    const [torneo] = await executeQuery(
      'SELECT ID_TORNEO FROM DIM_TORNEO WHERE ID_TORNEO = ?',
      [idTorneo]
    );
    if (!torneo) {
      return res.status(404).json({ error: 'Torneo no encontrado' });
    }

    // Verificar si ya existe una asignación del jugador en este torneo
    console.log('[VERIFICAR] Buscando asignación existente en torneo:', idTorneo);
    const [asignacionExistente] = await executeQuery(
      'SELECT ID_TORNEO_JUGADOR, ID_EQUIPO FROM DIM_TORNEO_JUGADOR WHERE ID_JUGADOR = ? AND ID_TORNEO = ?',
      [idJugador, idTorneo]
    );

    if (asignacionExistente) {
      console.log('[ENCONTRADO] Asignación existente:', asignacionExistente);

      // Si ya está en el MISMO equipo, es un duplicado
      if (asignacionExistente.ID_EQUIPO === idEquipo) {
        console.log('[DUPLICADO] Jugador ya está en este equipo en este torneo');
        return res.status(409).json({
          error: 'Este jugador ya está asignado a este equipo en este torneo.'
        });
      }

      // Si está en un equipo DIFERENTE, es una REASIGNACIÓN
      console.log(`[REASIGNACION] Jugador ${idJugador} del equipo ${asignacionExistente.ID_EQUIPO} al equipo ${idEquipo} en torneo ${idTorneo}`);

      // Verificar número de camiseta en el NUEVO equipo (si se proporciona)
      if (numeroCamiseta) {
        const [camisetaEnUso] = await executeQuery(
          'SELECT ID_TORNEO_JUGADOR FROM DIM_TORNEO_JUGADOR WHERE ID_EQUIPO = ? AND ID_TORNEO = ? AND NUMERO_CAMISETA = ? AND ID_TORNEO_JUGADOR != ?',
          [idEquipo, idTorneo, numeroCamiseta, asignacionExistente.ID_TORNEO_JUGADOR]
        );

        if (camisetaEnUso) {
          return res.status(409).json({
            error: `El número de camiseta ${numeroCamiseta} ya está en uso en el equipo destino para este torneo`
          });
        }
      }

      // Actualizar la asignación existente con el nuevo equipo
      await executeQuery(`
        UPDATE DIM_TORNEO_JUGADOR
        SET
          ID_EQUIPO = ?,
          NUMERO_CAMISETA = ?,
          FECHA_INCORPORACION = ?,
          ESTADO = ?
        WHERE ID_TORNEO_JUGADOR = ?
      `, [idEquipo, numeroCamiseta || null, fechaIncorporacion || null, estado || 'ACTIVO', asignacionExistente.ID_TORNEO_JUGADOR]);

      return res.status(200).json({
        message: 'Jugador reasignado exitosamente al nuevo equipo',
        id: asignacionExistente.ID_TORNEO_JUGADOR,
        esReasignacion: true
      });
    }

    console.log('[NO ENCONTRADO] No existe asignación previa en este torneo. Creando nueva...');

    // Verificar si el número de camiseta ya está en uso en este equipo/torneo (NUEVA asignación)
    if (numeroCamiseta) {
      const [camisetaEnUso] = await executeQuery(
        'SELECT ID_TORNEO_JUGADOR FROM DIM_TORNEO_JUGADOR WHERE ID_EQUIPO = ? AND ID_TORNEO = ? AND NUMERO_CAMISETA = ?',
        [idEquipo, idTorneo, numeroCamiseta]
      );

      if (camisetaEnUso) {
        return res.status(409).json({
          error: `El número de camiseta ${numeroCamiseta} ya está en uso en este equipo para este torneo`
        });
      }
    }

    // Crear la asignación
    const result = await executeQuery(`
      INSERT INTO DIM_TORNEO_JUGADOR
        (ID_JUGADOR, ID_EQUIPO, ID_TORNEO, NUMERO_CAMISETA, FECHA_INCORPORACION, ESTADO)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [idJugador, idEquipo, idTorneo, numeroCamiseta || null, fechaIncorporacion || null, estado || 'ACTIVO']);

    console.log(`[TORNEO_JUGADOR] Nueva asignación creada: Jugador ${idJugador} -> Equipo ${idEquipo} en Torneo ${idTorneo}`);

    // Si el jugador tiene asignaciones anteriores en el MISMO EQUIPO en otros torneos, marcar la más reciente como finalizada
    // Esto permite mantener un historial de continuidad del jugador en el equipo
    try {
      const asignacionesAnteriores = await executeQuery(`
        SELECT
          tj.ID_TORNEO_JUGADOR,
          t.TEMPORADA,
          t.RUEDA
        FROM DIM_TORNEO_JUGADOR tj
        INNER JOIN DIM_TORNEO t ON tj.ID_TORNEO = t.ID_TORNEO
        WHERE tj.ID_JUGADOR = ?
          AND tj.ID_EQUIPO = ?
          AND tj.ID_TORNEO != ?
          AND tj.FECHA_SALIDA IS NULL
        ORDER BY t.TEMPORADA DESC, t.RUEDA DESC
        LIMIT 1
      `, [idJugador, idEquipo, idTorneo]);

      if (asignacionesAnteriores.length > 0) {
        const asignacionAnterior = asignacionesAnteriores[0];
        await executeQuery(`
          UPDATE DIM_TORNEO_JUGADOR
          SET FECHA_SALIDA = CURDATE()
          WHERE ID_TORNEO_JUGADOR = ?
        `, [asignacionAnterior.ID_TORNEO_JUGADOR]);

        console.log(`[TORNEO_JUGADOR] Asignación anterior (ID: ${asignacionAnterior.ID_TORNEO_JUGADOR}) marcada como finalizada`);
      }
    } catch (updateError) {
      console.warn('[TORNEO_JUGADOR] No se pudo actualizar asignación anterior:', updateError.message);
      // No fallar la creación si no se puede actualizar la anterior
    }

    res.status(201).json({
      message: 'Asignación creada exitosamente',
      id: result.insertId
    });

  } catch (error) {
    console.error('[TORNEO_JUGADOR] Error creando asignación:', error);
    res.status(500).json({ error: 'Error al crear asignación' });
  }
};

/**
 * Actualizar una asignación existente
 * PUT /api/torneo-jugador/:id
 * Body: { idEquipo?, numeroCamiseta?, fechaIncorporacion?, fechaSalida?, estado? }
 */
exports.actualizarAsignacion = async (req, res) => {
  const { id } = req.params;
  const { idEquipo, numeroCamiseta, fechaIncorporacion, fechaSalida, estado } = req.body;

  try {
    // Verificar que la asignación existe
    const [asignacion] = await executeQuery(
      'SELECT * FROM DIM_TORNEO_JUGADOR WHERE ID_TORNEO_JUGADOR = ?',
      [id]
    );

    if (!asignacion) {
      return res.status(404).json({ error: 'Asignación no encontrada' });
    }

    // Si se cambia el equipo, verificar que existe
    if (idEquipo) {
      const [equipo] = await executeQuery(
        'SELECT ID_EQUIPO FROM DIM_EQUIPO WHERE ID_EQUIPO = ?',
        [idEquipo]
      );
      if (!equipo) {
        return res.status(404).json({ error: 'Equipo no encontrado' });
      }
    }

    // Si se cambia el número de camiseta, verificar que no esté en uso
    if (numeroCamiseta) {
      const equipoFinal = idEquipo || asignacion.ID_EQUIPO;
      const [camisetaEnUso] = await executeQuery(
        'SELECT ID_TORNEO_JUGADOR FROM DIM_TORNEO_JUGADOR WHERE ID_EQUIPO = ? AND ID_TORNEO = ? AND NUMERO_CAMISETA = ? AND ID_TORNEO_JUGADOR != ?',
        [equipoFinal, asignacion.ID_TORNEO, numeroCamiseta, id]
      );

      if (camisetaEnUso) {
        return res.status(409).json({
          error: `El número de camiseta ${numeroCamiseta} ya está en uso en este equipo para este torneo`
        });
      }
    }

    // Construir query de actualización
    const updates = [];
    const values = [];

    if (idEquipo !== undefined) {
      updates.push('ID_EQUIPO = ?');
      values.push(idEquipo);
    }
    if (numeroCamiseta !== undefined) {
      updates.push('NUMERO_CAMISETA = ?');
      values.push(numeroCamiseta);
    }
    if (fechaIncorporacion !== undefined) {
      updates.push('FECHA_INCORPORACION = ?');
      values.push(fechaIncorporacion);
    }
    if (fechaSalida !== undefined) {
      updates.push('FECHA_SALIDA = ?');
      values.push(fechaSalida);
    }
    if (estado !== undefined) {
      updates.push('ESTADO = ?');
      values.push(estado);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No se proporcionaron campos para actualizar' });
    }

    values.push(id);

    await executeQuery(
      `UPDATE DIM_TORNEO_JUGADOR SET ${updates.join(', ')} WHERE ID_TORNEO_JUGADOR = ?`,
      values
    );

    console.log(`[TORNEO_JUGADOR] Asignación ${id} actualizada`);

    res.json({ message: 'Asignación actualizada exitosamente' });

  } catch (error) {
    console.error('[TORNEO_JUGADOR] Error actualizando asignación:', error);
    res.status(500).json({ error: 'Error al actualizar asignación' });
  }
};

/**
 * Eliminar una asignación
 * DELETE /api/torneo-jugador/:id
 */
exports.eliminarAsignacion = async (req, res) => {
  const { id } = req.params;

  try {
    // Verificar que la asignación existe
    const [asignacion] = await executeQuery(
      'SELECT ID_TORNEO_JUGADOR FROM DIM_TORNEO_JUGADOR WHERE ID_TORNEO_JUGADOR = ?',
      [id]
    );

    if (!asignacion) {
      return res.status(404).json({ error: 'Asignación no encontrada' });
    }

    // Eliminar la asignación
    await executeQuery(
      'DELETE FROM DIM_TORNEO_JUGADOR WHERE ID_TORNEO_JUGADOR = ?',
      [id]
    );

    console.log(`[TORNEO_JUGADOR] Asignación ${id} eliminada`);

    res.json({ message: 'Asignación eliminada exitosamente' });

  } catch (error) {
    console.error('[TORNEO_JUGADOR] Error eliminando asignación:', error);
    res.status(500).json({ error: 'Error al eliminar asignación' });
  }
};

/**
 * Crear asignaciones masivas de un jugador a múltiples torneos
 * POST /api/torneo-jugador/asignacion-masiva
 * Body: {
 *   idJugador: number,
 *   idEquipo: number,
 *   temporada: string,
 *   torneosIds: number[],
 *   numeroCamiseta?: number,
 *   fechaIncorporacion?: string,
 *   estado?: string
 * }
 */
exports.crearAsignacionMasiva = async (req, res) => {
  const {
    idJugador,
    idEquipo,
    temporada,
    torneosIds,
    numeroCamiseta,
    fechaIncorporacion,
    estado
  } = req.body;

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('[ASIGNACION_MASIVA] Datos recibidos:');
  console.log('  - Jugador ID:', idJugador);
  console.log('  - Equipo ID:', idEquipo);
  console.log('  - Temporada:', temporada);
  console.log('  - Torneos IDs:', torneosIds);
  console.log('  - Número Camiseta:', numeroCamiseta || 'N/A');
  console.log('  - Fecha Incorporación:', fechaIncorporacion || 'N/A');
  console.log('  - Estado:', estado || 'N/A');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Validar campos requeridos
  if (!idJugador || !idEquipo || !temporada || !torneosIds || !Array.isArray(torneosIds) || torneosIds.length === 0) {
    return res.status(400).json({
      error: 'idJugador, idEquipo, temporada y torneosIds (array no vacío) son requeridos'
    });
  }

  try {
    // Verificar que el jugador existe
    const [jugador] = await executeQuery(
      'SELECT ID_JUGADOR, NOMBRE_COMPLETO FROM DIM_JUGADOR WHERE ID_JUGADOR = ?',
      [idJugador]
    );
    if (!jugador) {
      return res.status(404).json({ error: 'Jugador no encontrado' });
    }

    // Verificar que el equipo existe
    const [equipo] = await executeQuery(
      'SELECT ID_EQUIPO, NOMBRE FROM DIM_EQUIPO WHERE ID_EQUIPO = ?',
      [idEquipo]
    );
    if (!equipo) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }

    // Verificar que todos los torneos existen y son de la temporada correcta
    // Protección adicional contra arrays vacíos
    if (!Array.isArray(torneosIds) || torneosIds.length === 0) {
      return res.status(400).json({
        error: 'Debe proporcionar al menos un torneo en torneosIds'
      });
    }

    // Crear placeholders para prepared statement
    const placeholders = torneosIds.map(() => '?').join(',');
    const torneos = await executeQuery(
      `SELECT ID_TORNEO, NOMBRE, TEMPORADA FROM DIM_TORNEO WHERE ID_TORNEO IN (${placeholders})`,
      torneosIds
    );

    if (torneos.length !== torneosIds.length) {
      return res.status(404).json({
        error: `Algunos torneos no fueron encontrados. Se esperaban ${torneosIds.length}, se encontraron ${torneos.length}`
      });
    }

    // Verificar que todos los torneos son de la temporada especificada
    const torneosIncorrectos = torneos.filter(t => t.TEMPORADA !== temporada);
    if (torneosIncorrectos.length > 0) {
      return res.status(400).json({
        error: `Los siguientes torneos no pertenecen a la temporada ${temporada}: ${torneosIncorrectos.map(t => t.NOMBRE).join(', ')}`
      });
    }

    // Verificar si el número de camiseta ya está en uso en algún torneo
    if (numeroCamiseta) {
      const camisetasEnUso = await executeQuery(
        `SELECT ID_TORNEO, ID_JUGADOR FROM DIM_TORNEO_JUGADOR
         WHERE ID_EQUIPO = ?
           AND ID_TORNEO IN (${placeholders})
           AND NUMERO_CAMISETA = ?
           AND ID_JUGADOR != ?`,
        [idEquipo, ...torneosIds, numeroCamiseta, idJugador]
      );

      if (camisetasEnUso.length > 0) {
        const torneosConflicto = torneos
          .filter(t => camisetasEnUso.some(c => c.ID_TORNEO === t.ID_TORNEO))
          .map(t => t.NOMBRE);

        return res.status(409).json({
          error: `El número de camiseta ${numeroCamiseta} ya está en uso en los siguientes torneos: ${torneosConflicto.join(', ')}`
        });
      }
    }

    // Verificar asignaciones existentes
    const asignacionesExistentes = await executeQuery(
      `SELECT ID_TORNEO_JUGADOR, ID_TORNEO, ID_EQUIPO FROM DIM_TORNEO_JUGADOR
       WHERE ID_JUGADOR = ?
         AND ID_TORNEO IN (${placeholders})`,
      [idJugador, ...torneosIds]
    );

    const resultados = {
      creadas: [],
      actualizadas: [],
      omitidas: []
    };

    // Iniciar transacción
    await executeQuery('START TRANSACTION');

    try {
      for (const torneoId of torneosIds) {
        const torneo = torneos.find(t => t.ID_TORNEO === torneoId);
        const asignacionExistente = asignacionesExistentes.find(a => a.ID_TORNEO === torneoId);

        if (asignacionExistente) {
          // Si ya existe asignación en este torneo
          if (asignacionExistente.ID_EQUIPO === idEquipo) {
            // Mismo equipo: omitir
            resultados.omitidas.push({
              torneo: torneo.NOMBRE,
              razon: 'Ya existe asignación en este equipo'
            });
          } else {
            // Equipo diferente: reasignar (actualizar)
            await executeQuery(`
              UPDATE DIM_TORNEO_JUGADOR
              SET
                ID_EQUIPO = ?,
                NUMERO_CAMISETA = ?,
                FECHA_INCORPORACION = ?,
                ESTADO = ?
              WHERE ID_TORNEO_JUGADOR = ?
            `, [
              idEquipo,
              numeroCamiseta || null,
              fechaIncorporacion || null,
              estado || 'ACTIVO',
              asignacionExistente.ID_TORNEO_JUGADOR
            ]);

            resultados.actualizadas.push({
              torneo: torneo.NOMBRE,
              razon: 'Reasignado al nuevo equipo'
            });
          }
        } else {
          // No existe asignación: crear nueva
          const result = await executeQuery(`
            INSERT INTO DIM_TORNEO_JUGADOR
              (ID_JUGADOR, ID_EQUIPO, ID_TORNEO, NUMERO_CAMISETA, FECHA_INCORPORACION, ESTADO)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [
            idJugador,
            idEquipo,
            torneoId,
            numeroCamiseta || null,
            fechaIncorporacion || null,
            estado || 'ACTIVO'
          ]);

          resultados.creadas.push({
            torneo: torneo.NOMBRE,
            id: result.insertId
          });
        }
      }

      // Confirmar transacción
      await executeQuery('COMMIT');

      console.log('[ASIGNACION_MASIVA] Resultados:');
      console.log('  ✅ Creadas:', resultados.creadas.length);
      console.log('  ♻️  Actualizadas:', resultados.actualizadas.length);
      console.log('  ⏭️  Omitidas:', resultados.omitidas.length);

      res.status(200).json({
        message: 'Asignación masiva completada',
        jugador: jugador.NOMBRE_COMPLETO,
        equipo: equipo.NOMBRE,
        temporada,
        resultados,
        resumen: {
          total: torneosIds.length,
          creadas: resultados.creadas.length,
          actualizadas: resultados.actualizadas.length,
          omitidas: resultados.omitidas.length
        }
      });

    } catch (transactionError) {
      // Revertir transacción en caso de error
      await executeQuery('ROLLBACK');
      throw transactionError;
    }

  } catch (error) {
    console.error('[ASIGNACION_MASIVA] Error:', error);
    res.status(500).json({ error: 'Error al crear asignación masiva: ' + error.message });
  }
};

/**
 * Actualizar número de camiseta para todas las asignaciones de un jugador en una temporada
 * PUT /api/torneo-jugador/actualizar-camiseta-temporada
 * Body: {
 *   idJugador: number,
 *   idEquipo: number,
 *   temporada: string,
 *   numeroCamiseta: number
 * }
 */
exports.actualizarCamisetaTemporada = async (req, res) => {
  const { idJugador, idEquipo, temporada, numeroCamiseta } = req.body;

  if (!idJugador || !idEquipo || !temporada || !numeroCamiseta) {
    return res.status(400).json({
      error: 'idJugador, idEquipo, temporada y numeroCamiseta son requeridos'
    });
  }

  try {
    // Verificar que el número no esté en uso por otro jugador en esta temporada
    const [conflicto] = await executeQuery(`
      SELECT tj.ID_TORNEO_JUGADOR, t.NOMBRE as torneo_nombre
      FROM DIM_TORNEO_JUGADOR tj
      INNER JOIN DIM_TORNEO t ON tj.ID_TORNEO = t.ID_TORNEO
      WHERE tj.ID_EQUIPO = ?
        AND tj.NUMERO_CAMISETA = ?
        AND tj.ID_JUGADOR != ?
        AND t.TEMPORADA = ?
      LIMIT 1
    `, [idEquipo, numeroCamiseta, idJugador, temporada]);

    if (conflicto) {
      return res.status(409).json({
        error: `El número ${numeroCamiseta} ya está en uso por otro jugador en ${conflicto.torneo_nombre}`
      });
    }

    // Actualizar todas las asignaciones del jugador en esa temporada/equipo
    const result = await executeQuery(`
      UPDATE DIM_TORNEO_JUGADOR tj
      INNER JOIN DIM_TORNEO t ON tj.ID_TORNEO = t.ID_TORNEO
      SET tj.NUMERO_CAMISETA = ?
      WHERE tj.ID_JUGADOR = ?
        AND tj.ID_EQUIPO = ?
        AND t.TEMPORADA = ?
    `, [numeroCamiseta, idJugador, idEquipo, temporada]);

    console.log(`[ACTUALIZAR_CAMISETA] Actualizado número ${numeroCamiseta} para jugador ${idJugador} en ${result.affectedRows} torneos`);

    res.json({
      message: 'Número de camiseta actualizado exitosamente',
      torneosActualizados: result.affectedRows
    });

  } catch (error) {
    console.error('[ACTUALIZAR_CAMISETA] Error:', error);
    res.status(500).json({ error: 'Error al actualizar número de camiseta' });
  }
};

/**
 * Verificar si un torneo tiene asignaciones
 * GET /api/torneo-jugador/verificar-asignaciones/:idTorneo
 */
exports.verificarAsignacionesTorneo = async (req, res) => {
  const { idTorneo } = req.params;

  try {
    const asignaciones = await executeQuery(`
      SELECT COUNT(*) as total
      FROM DIM_TORNEO_JUGADOR
      WHERE ID_TORNEO = ?
    `, [idTorneo]);

    const total = asignaciones[0].total;

    res.json({
      success: true,
      tieneAsignaciones: total > 0,
      totalAsignaciones: total
    });

  } catch (error) {
    console.error('[VERIFICAR_ASIGNACIONES] Error:', error);
    res.status(500).json({ error: 'Error al verificar asignaciones del torneo' });
  }
};

/**
 * Obtener jugadores de un equipo en un torneo específico
 * GET /api/torneo-jugador/jugadores-equipo/:idTorneo/:idEquipo
 */
exports.getJugadoresPorEquipoYTorneo = async (req, res) => {
  const { idTorneo, idEquipo } = req.params;

  try {
    const jugadores = await executeQuery(`
      SELECT
        tj.ID_TORNEO_JUGADOR,
        tj.ID_JUGADOR,
        tj.ID_EQUIPO,
        tj.ID_TORNEO,
        tj.NUMERO_CAMISETA,
        tj.FECHA_INCORPORACION,
        tj.ESTADO,
        j.NOMBRE_COMPLETO as jugador_nombre,
        j.APODO as jugador_apodo,
        j.FECHA_NACIMIENTO,
        pos.NOMBRE as posicion,
        p.NOMBRE as nacionalidad
      FROM DIM_TORNEO_JUGADOR tj
      INNER JOIN DIM_JUGADOR j ON tj.ID_JUGADOR = j.ID_JUGADOR
      LEFT JOIN DIM_JUGADOR_POSICION jpos ON j.ID_JUGADOR = jpos.ID_JUGADOR AND jpos.ES_POSICION_PRINCIPAL = TRUE
      LEFT JOIN DIM_POSICION pos ON jpos.ID_POSICION = pos.ID_POSICION
      LEFT JOIN DIM_JUGADOR_PAIS jp ON j.ID_JUGADOR = jp.ID_JUGADOR AND jp.TIPO_RELACION = 'NACIMIENTO'
      LEFT JOIN DIM_PAIS p ON jp.ID_PAIS = p.ID_PAIS
      WHERE tj.ID_TORNEO = ?
        AND tj.ID_EQUIPO = ?
      ORDER BY pos.NOMBRE, j.NOMBRE_COMPLETO
    `, [idTorneo, idEquipo]);

    res.json({
      success: true,
      jugadores
    });

  } catch (error) {
    console.error('[JUGADORES_EQUIPO_TORNEO] Error:', error);
    res.status(500).json({ error: 'Error al obtener jugadores del equipo en el torneo' });
  }
};

/**
 * Clonar asignaciones de un torneo a otro
 * POST /api/torneo-jugador/clonar-asignaciones
 * Body: {
 *   idTorneoOrigen: number,
 *   idTorneoDestino: number,
 *   idEquipo: number (optional),
 *   jugadoresIds: number[] (optional, si no se proporciona clona todos),
 *   forzar: boolean (optional, default: false)
 * }
 */
exports.clonarAsignacionesEntreTorneos = async (req, res) => {
  const { idTorneoOrigen, idTorneoDestino, idEquipo, jugadoresIds, forzar } = req.body;

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('[CLONAR_ASIGNACIONES] Datos recibidos:');
  console.log('  - Torneo Origen ID:', idTorneoOrigen);
  console.log('  - Torneo Destino ID:', idTorneoDestino);
  console.log('  - Equipo ID:', idEquipo || 'Todos');
  console.log('  - Jugadores seleccionados:', jugadoresIds ? jugadoresIds.length : 'Todos');
  console.log('  - Forzar:', forzar || false);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Validar campos requeridos
  if (!idTorneoOrigen || !idTorneoDestino) {
    return res.status(400).json({
      error: 'idTorneoOrigen e idTorneoDestino son requeridos'
    });
  }

  // Validar que no sean el mismo torneo
  if (idTorneoOrigen === idTorneoDestino) {
    return res.status(400).json({
      error: 'El torneo origen y destino no pueden ser el mismo'
    });
  }

  try {
    // Verificar que ambos torneos existen
    const [torneoOrigen] = await executeQuery(
      'SELECT ID_TORNEO, NOMBRE, TEMPORADA, RUEDA FROM DIM_TORNEO WHERE ID_TORNEO = ?',
      [idTorneoOrigen]
    );
    if (!torneoOrigen) {
      return res.status(404).json({ error: 'Torneo origen no encontrado' });
    }

    const [torneoDestino] = await executeQuery(
      'SELECT ID_TORNEO, NOMBRE, TEMPORADA, RUEDA FROM DIM_TORNEO WHERE ID_TORNEO = ?',
      [idTorneoDestino]
    );
    if (!torneoDestino) {
      return res.status(404).json({ error: 'Torneo destino no encontrado' });
    }

    // Construir query para obtener asignaciones del torneo origen
    let queryAsignaciones = `
      SELECT
        ID_JUGADOR,
        ID_EQUIPO,
        NUMERO_CAMISETA,
        FECHA_INCORPORACION,
        ESTADO
      FROM DIM_TORNEO_JUGADOR
      WHERE ID_TORNEO = ?
    `;

    const paramsAsignaciones = [idTorneoOrigen];

    // Filtrar por equipo si se especifica
    if (idEquipo) {
      queryAsignaciones += ' AND ID_EQUIPO = ?';
      paramsAsignaciones.push(idEquipo);
    }

    // Filtrar por jugadores específicos si se especifican
    if (jugadoresIds && Array.isArray(jugadoresIds) && jugadoresIds.length > 0) {
      const placeholders = jugadoresIds.map(() => '?').join(',');
      queryAsignaciones += ` AND ID_JUGADOR IN (${placeholders})`;
      paramsAsignaciones.push(...jugadoresIds);
    }

    const asignacionesOrigen = await executeQuery(queryAsignaciones, paramsAsignaciones);

    if (asignacionesOrigen.length === 0) {
      return res.status(400).json({
        error: `No se encontraron asignaciones para clonar con los filtros especificados`
      });
    }

    // Verificar si el torneo destino ya tiene asignaciones
    const asignacionesDestino = await executeQuery(`
      SELECT COUNT(*) as total
      FROM DIM_TORNEO_JUGADOR
      WHERE ID_TORNEO = ?
    `, [idTorneoDestino]);

    const tieneAsignacionesDestino = asignacionesDestino[0].total > 0;

    // Si tiene asignaciones y no se fuerza, retornar warning
    if (tieneAsignacionesDestino && !forzar) {
      return res.status(409).json({
        requiresConfirmation: true,
        message: `El torneo destino "${torneoDestino.NOMBRE}" ya tiene ${asignacionesDestino[0].total} asignaciones. ¿Desea continuar?`,
        torneoOrigen: {
          id: torneoOrigen.ID_TORNEO,
          nombre: torneoOrigen.NOMBRE,
          temporada: torneoOrigen.TEMPORADA,
          rueda: torneoOrigen.RUEDA,
          totalAsignaciones: asignacionesOrigen.length
        },
        torneoDestino: {
          id: torneoDestino.ID_TORNEO,
          nombre: torneoDestino.NOMBRE,
          temporada: torneoDestino.TEMPORADA,
          rueda: torneoDestino.RUEDA,
          totalAsignaciones: asignacionesDestino[0].total
        }
      });
    }

    // Proceder con la clonación
    const resultados = {
      creadas: [],
      actualizadas: [],
      omitidas: [],
      errores: []
    };

    // Iniciar transacción
    await executeQuery('START TRANSACTION');

    try {
      for (const asignacion of asignacionesOrigen) {
        // Verificar si el jugador ya tiene asignación en el torneo destino
        const [asignacionExistente] = await executeQuery(`
          SELECT ID_TORNEO_JUGADOR, ID_EQUIPO
          FROM DIM_TORNEO_JUGADOR
          WHERE ID_JUGADOR = ? AND ID_TORNEO = ?
        `, [asignacion.ID_JUGADOR, idTorneoDestino]);

        // Obtener nombre del jugador para el reporte
        const [jugador] = await executeQuery(
          'SELECT NOMBRE_COMPLETO FROM DIM_JUGADOR WHERE ID_JUGADOR = ?',
          [asignacion.ID_JUGADOR]
        );
        const nombreJugador = jugador ? jugador.NOMBRE_COMPLETO : `ID ${asignacion.ID_JUGADOR}`;

        if (asignacionExistente) {
          // Si ya existe asignación
          if (asignacionExistente.ID_EQUIPO === asignacion.ID_EQUIPO) {
            // Mismo equipo: omitir
            resultados.omitidas.push({
              jugador: nombreJugador,
              razon: 'Ya existe asignación en este equipo'
            });
          } else {
            // Equipo diferente: actualizar
            await executeQuery(`
              UPDATE DIM_TORNEO_JUGADOR
              SET
                ID_EQUIPO = ?,
                NUMERO_CAMISETA = ?,
                FECHA_INCORPORACION = ?,
                ESTADO = ?
              WHERE ID_TORNEO_JUGADOR = ?
            `, [
              asignacion.ID_EQUIPO,
              asignacion.NUMERO_CAMISETA,
              asignacion.FECHA_INCORPORACION,
              asignacion.ESTADO || 'ACTIVO',
              asignacionExistente.ID_TORNEO_JUGADOR
            ]);

            resultados.actualizadas.push({
              jugador: nombreJugador,
              razon: 'Reasignado al equipo del torneo origen'
            });
          }
        } else {
          // No existe: crear nueva asignación
          const result = await executeQuery(`
            INSERT INTO DIM_TORNEO_JUGADOR
              (ID_JUGADOR, ID_EQUIPO, ID_TORNEO, NUMERO_CAMISETA, FECHA_INCORPORACION, ESTADO)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [
            asignacion.ID_JUGADOR,
            asignacion.ID_EQUIPO,
            idTorneoDestino,
            asignacion.NUMERO_CAMISETA,
            asignacion.FECHA_INCORPORACION,
            asignacion.ESTADO || 'ACTIVO'
          ]);

          resultados.creadas.push({
            jugador: nombreJugador,
            id: result.insertId
          });
        }
      }

      // Confirmar transacción
      await executeQuery('COMMIT');

      console.log('[CLONAR_ASIGNACIONES] Resultados:');
      console.log('  ✅ Creadas:', resultados.creadas.length);
      console.log('  ♻️  Actualizadas:', resultados.actualizadas.length);
      console.log('  ⏭️  Omitidas:', resultados.omitidas.length);

      res.status(200).json({
        success: true,
        message: `Asignaciones clonadas exitosamente de "${torneoOrigen.NOMBRE}" a "${torneoDestino.NOMBRE}"`,
        torneoOrigen: {
          id: torneoOrigen.ID_TORNEO,
          nombre: torneoOrigen.NOMBRE,
          temporada: torneoOrigen.TEMPORADA,
          rueda: torneoOrigen.RUEDA
        },
        torneoDestino: {
          id: torneoDestino.ID_TORNEO,
          nombre: torneoDestino.NOMBRE,
          temporada: torneoDestino.TEMPORADA,
          rueda: torneoDestino.RUEDA
        },
        resultados,
        resumen: {
          total: asignacionesOrigen.length,
          creadas: resultados.creadas.length,
          actualizadas: resultados.actualizadas.length,
          omitidas: resultados.omitidas.length,
          errores: resultados.errores.length
        }
      });

    } catch (transactionError) {
      // Revertir transacción en caso de error
      await executeQuery('ROLLBACK');
      throw transactionError;
    }

  } catch (error) {
    console.error('[CLONAR_ASIGNACIONES] Error:', error);
    res.status(500).json({ error: 'Error al clonar asignaciones: ' + error.message });
  }
};
