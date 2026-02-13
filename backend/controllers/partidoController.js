// backend/controllers/partidoController.js
console.log('📂 Cargando partidoController con base de datos...');

// Asegurar que dotenv esté cargado
require('dotenv').config();

const mysql = require('mysql2/promise');

// Configuración de base de datos
const dbConfig = {
  host: process.env.DB_HOST || '192.168.100.16',
  user: process.env.DB_USER || 'mpuga',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'MP_DATA_DEV',
  port: process.env.DB_PORT || 3306
};

console.log('🔧 Configuración DB para partidos:', {
  host: dbConfig.host,
  user: dbConfig.user,
  database: dbConfig.database,
  port: dbConfig.port,
  password: dbConfig.password ? '***configurado***' : 'NO CONFIGURADO'
});

// Función helper para ejecutar consultas
const executeQuery = async (query, params = []) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [results] = await connection.execute(query, params);
    console.log(`✅ Query ejecutada: ${query.substring(0, 50)}...`);
    return results;
  } catch (error) {
    console.error('❌ Error en consulta:', error.message);
    console.error('📝 Query:', query);
    console.error('📝 Params:', params);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

const crearPartido = async (req, res) => {
  console.log('📝 Creando nuevo partido:', req.body);
  
  try {
    const {
      matchIdFbr,
      idTorneo,
      fechaPartido,
      idEquipoLocal,
      idEquipoVisita,
      idEstadio,
      golesLocal,
      golesVisita,
      esCampoNeutro,
      arbitro,
      asistencia,
      clima,
      estadoPartido,
      numeroJornada
    } = req.body;

    // Validaciones básicas
    if (!matchIdFbr || !idTorneo || !fechaPartido || !idEquipoLocal || !idEquipoVisita || !idEstadio) {
      console.log('❌ Faltan campos obligatorios');
      return res.status(400).json({
        error: 'Los campos matchIdFbr, idTorneo, fechaPartido, equipos y estadio son obligatorios',
        received: req.body
      });
    }

    // Validar que los equipos sean diferentes
    if (parseInt(idEquipoLocal) === parseInt(idEquipoVisita)) {
      return res.status(400).json({
        error: 'El equipo local y visitante deben ser diferentes'
      });
    }

    // Verificar si ya existe un partido con el mismo MATCH_ID_FBR
    const existePartido = await executeQuery(
      'SELECT ID_PARTIDO FROM HECHOS_RESULTADOS WHERE MATCH_ID_FBR = ?',
      [matchIdFbr]
    );

    if (existePartido.length > 0) {
      console.log('❌ Partido ya existe:', matchIdFbr);
      return res.status(409).json({
        error: 'Ya existe un partido con ese ID'
      });
    }

    // Generar FECHA_TORNEO en formato YYYYMMDD
    const fechaObj = new Date(fechaPartido);
    const fechaTorneo = parseInt(
      fechaObj.getFullYear().toString() +
      (fechaObj.getMonth() + 1).toString().padStart(2, '0') +
      fechaObj.getDate().toString().padStart(2, '0')
    );

    // Procesar goles: permitir 0 como valor válido
    const procesarGoles = (goles) => {
      if (goles === null || goles === undefined || goles === '') {
        return null;
      }
      const golesNum = parseInt(goles);
      return isNaN(golesNum) ? null : golesNum;
    };

    const golesLocalFinal = procesarGoles(golesLocal);
    const golesVisitaFinal = procesarGoles(golesVisita);

    // Insertar nuevo partido
    console.log('➕ Insertando nuevo partido');
    const resultado = await executeQuery(
      `INSERT INTO HECHOS_RESULTADOS (
        MATCH_ID_FBR, ID_TORNEO, FECHA_PARTIDO, FECHA_TORNEO, NUMERO_JORNADA,
        ID_EQUIPO_LOCAL, ID_EQUIPO_VISITA, ID_ESTADIO,
        GOLES_LOCAL, GOLES_VISITA, ES_CAMPO_NEUTRO,
        ARBITRO, ASISTENCIA, CLIMA, ESTADO_PARTIDO
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        matchIdFbr,
        parseInt(idTorneo),
        fechaPartido,
        fechaTorneo,
        numeroJornada ? parseInt(numeroJornada) : null,
        parseInt(idEquipoLocal),
        parseInt(idEquipoVisita),
        parseInt(idEstadio),
        golesLocalFinal,
        golesVisitaFinal,
        esCampoNeutro ? 1 : 0,
        arbitro || null,
        parseInt(asistencia) || null,
        clima || null,
        estadoPartido || 'PROGRAMADO'
      ]
    );

    console.log('✅ Partido creado exitosamente, ID:', resultado.insertId);

    res.status(201).json({
      message: 'Partido creado exitosamente',
      partido: {
        id: resultado.insertId,
        matchIdFbr,
        idTorneo: parseInt(idTorneo),
        fechaPartido,
        fechaTorneo,
        idEquipoLocal: parseInt(idEquipoLocal),
        idEquipoVisita: parseInt(idEquipoVisita),
        idEstadio: parseInt(idEstadio),
        golesLocal: golesLocalFinal,
        golesVisita: golesVisitaFinal,
        esCampoNeutro: esCampoNeutro ? 1 : 0,
        arbitro,
        asistencia: parseInt(asistencia) || null,
        clima,
        estadoPartido: estadoPartido || 'PROGRAMADO'
      }
    });

  } catch (error) {
    console.error('❌ Error al crear partido:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      detalle: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

const obtenerPartidos = async (req, res) => {
  console.log('📋 Obteniendo lista de partidos desde BD...');

  try {
    const { torneoId, equipoId, estado, numeroJornada, fechaDesde, fechaHasta, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT
        hr.ID_PARTIDO,
        hr.MATCH_ID_FBR,
        hr.ID_TORNEO,
        hr.FECHA_PARTIDO,
        hr.FECHA_TORNEO,
        hr.NUMERO_JORNADA,
        hr.ID_EQUIPO_LOCAL,
        hr.ID_EQUIPO_VISITA,
        hr.ID_ESTADIO,
        hr.GOLES_LOCAL,
        hr.GOLES_VISITA,
        hr.ES_CAMPO_NEUTRO,
        hr.ARBITRO,
        hr.ASISTENCIA,
        hr.CLIMA,
        hr.ESTADO_PARTIDO,
        hr.FECHA_CREACION,

        -- Información de torneo
        t.NOMBRE as NOMBRE_TORNEO,
        t.TEMPORADA,
        t.RUEDA,

        -- Información de equipos
        el.NOMBRE as NOMBRE_EQUIPO_LOCAL,
        el.APODO as APODO_EQUIPO_LOCAL,
        COALESCE(el.IMAGEN, 'default-team.png') as IMAGEN_EQUIPO_LOCAL,
        ev.NOMBRE as NOMBRE_EQUIPO_VISITA,
        ev.APODO as APODO_EQUIPO_VISITA,
        COALESCE(ev.IMAGEN, 'default-team.png') as IMAGEN_EQUIPO_VISITA,

        -- Información de estadio
        e.NOMBRE as NOMBRE_ESTADIO,
        e.CIUDAD as CIUDAD_ESTADIO

      FROM HECHOS_RESULTADOS hr
      INNER JOIN DIM_TORNEO t ON hr.ID_TORNEO = t.ID_TORNEO
      INNER JOIN DIM_EQUIPO el ON hr.ID_EQUIPO_LOCAL = el.ID_EQUIPO
      INNER JOIN DIM_EQUIPO ev ON hr.ID_EQUIPO_VISITA = ev.ID_EQUIPO
      INNER JOIN DIM_ESTADIO e ON hr.ID_ESTADIO = e.ID_ESTADIO
    `;

    const conditions = [];
    const params = [];

    if (torneoId) {
      conditions.push('hr.ID_TORNEO = ?');
      params.push(torneoId);
    }

    if (equipoId) {
      conditions.push('(hr.ID_EQUIPO_LOCAL = ? OR hr.ID_EQUIPO_VISITA = ?)');
      params.push(equipoId, equipoId);
    }

    if (estado) {
      conditions.push('hr.ESTADO_PARTIDO = ?');
      params.push(estado);
    }

    // Filtro por número de jornada (fecha jugada)
    if (numeroJornada) {
      conditions.push('hr.NUMERO_JORNADA = ?');
      params.push(parseInt(numeroJornada));
    }

    // Filtro por rango de fechas
    if (fechaDesde) {
      conditions.push('DATE(hr.FECHA_PARTIDO) >= ?');
      params.push(fechaDesde);
    }

    if (fechaHasta) {
      conditions.push('DATE(hr.FECHA_PARTIDO) <= ?');
      params.push(fechaHasta);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    // Ordenar primero por número de jornada, luego por fecha del partido
    query += ' ORDER BY hr.NUMERO_JORNADA ASC, hr.FECHA_PARTIDO ASC';
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const partidos = await executeQuery(query, params);

    console.log(`✅ Se encontraron ${partidos.length} partidos en la BD`);
    
    res.json(partidos);
    
  } catch (error) {
    console.error('❌ Error al obtener partidos:', error);
    res.status(500).json({
      error: 'Error al obtener partidos',
      detalle: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

const obtenerPartidoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 Buscando partido con ID:', id);

    const query = `
      SELECT 
        hr.*,
        t.NOMBRE as NOMBRE_TORNEO,
        t.TEMPORADA,
        t.RUEDA,
        el.NOMBRE as NOMBRE_EQUIPO_LOCAL,
        el.APODO as APODO_EQUIPO_LOCAL,
        ev.NOMBRE as NOMBRE_EQUIPO_VISITA,
        ev.APODO as APODO_EQUIPO_VISITA,
        e.NOMBRE as NOMBRE_ESTADIO,
        e.CIUDAD as CIUDAD_ESTADIO
      FROM HECHOS_RESULTADOS hr
      INNER JOIN DIM_TORNEO t ON hr.ID_TORNEO = t.ID_TORNEO
      INNER JOIN DIM_EQUIPO el ON hr.ID_EQUIPO_LOCAL = el.ID_EQUIPO
      INNER JOIN DIM_EQUIPO ev ON hr.ID_EQUIPO_VISITA = ev.ID_EQUIPO
      INNER JOIN DIM_ESTADIO e ON hr.ID_ESTADIO = e.ID_ESTADIO
      WHERE hr.ID_PARTIDO = ?
    `;

    const partido = await executeQuery(query, [id]);

    if (partido.length === 0) {
      console.log('❌ Partido no encontrado:', id);
      return res.status(404).json({
        error: 'Partido no encontrado'
      });
    }

    console.log('✅ Partido encontrado:', partido[0].MATCH_ID_FBR);
    res.json(partido[0]);
    
  } catch (error) {
    console.error('❌ Error al obtener partido:', error);
    res.status(500).json({
      error: 'Error al obtener partido',
      detalle: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

const actualizarPartido = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      matchIdFbr,
      idTorneo,
      fechaPartido,
      idEquipoLocal,
      idEquipoVisita,
      idEstadio,
      golesLocal,
      golesVisita,
      esCampoNeutro,
      arbitro,
      asistencia,
      clima,
      estadoPartido,
      numeroJornada
    } = req.body;

    console.log('📝 Actualizando partido ID:', id);
    console.log('📋 Datos recibidos:', JSON.stringify(req.body, null, 2));

    // Validaciones básicas
    if (!matchIdFbr || !idTorneo || !fechaPartido || !idEquipoLocal || !idEquipoVisita || !idEstadio) {
      return res.status(400).json({
        error: 'Los campos básicos son obligatorios'
      });
    }

    // Validar que los equipos sean diferentes
    if (parseInt(idEquipoLocal) === parseInt(idEquipoVisita)) {
      return res.status(400).json({
        error: 'El equipo local y visitante deben ser diferentes'
      });
    }

    // Verificar si el partido existe
    const partidoExiste = await executeQuery(
      'SELECT ID_PARTIDO FROM HECHOS_RESULTADOS WHERE ID_PARTIDO = ?',
      [id]
    );

    if (partidoExiste.length === 0) {
      console.log('❌ Partido no encontrado para actualizar:', id);
      return res.status(404).json({
        error: 'Partido no encontrado'
      });
    }

    // Verificar MATCH_ID_FBR duplicado
    const matchIdDuplicado = await executeQuery(
      'SELECT ID_PARTIDO FROM HECHOS_RESULTADOS WHERE MATCH_ID_FBR = ? AND ID_PARTIDO != ?',
      [matchIdFbr, id]
    );

    if (matchIdDuplicado.length > 0) {
      console.log('❌ MATCH_ID_FBR duplicado para actualización:', matchIdFbr);
      return res.status(409).json({
        error: 'Ya existe otro partido con ese ID de partido'
      });
    }

    // Generar FECHA_TORNEO
    const fechaObj = new Date(fechaPartido);
    const fechaTorneo = parseInt(
      fechaObj.getFullYear().toString() +
      (fechaObj.getMonth() + 1).toString().padStart(2, '0') +
      fechaObj.getDate().toString().padStart(2, '0')
    );

    // Procesar goles: permitir 0 como valor válido
    const procesarGoles = (goles) => {
      if (goles === null || goles === undefined || goles === '') {
        return null;
      }
      const golesNum = parseInt(goles);
      return isNaN(golesNum) ? null : golesNum;
    };

    const golesLocalFinal = procesarGoles(golesLocal);
    const golesVisitaFinal = procesarGoles(golesVisita);

    console.log('⚽ Goles procesados - Local:', golesLocalFinal, 'Visita:', golesVisitaFinal);
    console.log('📅 FECHA_TORNEO generada:', fechaTorneo);
    console.log('🏁 Estado del partido:', estadoPartido);

    // Actualizar partido
    await executeQuery(
      `UPDATE HECHOS_RESULTADOS SET
        MATCH_ID_FBR = ?, ID_TORNEO = ?, FECHA_PARTIDO = ?, FECHA_TORNEO = ?, NUMERO_JORNADA = ?,
        ID_EQUIPO_LOCAL = ?, ID_EQUIPO_VISITA = ?, ID_ESTADIO = ?,
        GOLES_LOCAL = ?, GOLES_VISITA = ?, ES_CAMPO_NEUTRO = ?,
        ARBITRO = ?, ASISTENCIA = ?, CLIMA = ?, ESTADO_PARTIDO = ?
       WHERE ID_PARTIDO = ?`,
      [
        matchIdFbr,
        parseInt(idTorneo),
        fechaPartido,
        fechaTorneo,
        numeroJornada ? parseInt(numeroJornada) : null,
        parseInt(idEquipoLocal),
        parseInt(idEquipoVisita),
        parseInt(idEstadio),
        golesLocalFinal,
        golesVisitaFinal,
        esCampoNeutro ? 1 : 0,
        arbitro || null,
        parseInt(asistencia) || null,
        clima || null,
        estadoPartido || 'PROGRAMADO',
        id
      ]
    );

    console.log('✅ Partido actualizado exitosamente:', id);

    // Liquidar apuestas automáticamente si el partido está FINALIZADO y tiene resultados
    let mensajeLiquidacion = null;
    if (estadoPartido === 'FINALIZADO' && golesLocalFinal !== null && golesVisitaFinal !== null) {
      try {
        console.log('💰 Liquidando apuestas automáticamente para partido:', id);

        // Determinar resultado del partido
        let resultadoPartido;
        if (golesLocalFinal > golesVisitaFinal) {
          resultadoPartido = 'local';
        } else if (golesLocalFinal < golesVisitaFinal) {
          resultadoPartido = 'visita';
        } else {
          resultadoPartido = 'empate';
        }

        console.log(`🎯 Resultado del partido: ${resultadoPartido} (${golesLocalFinal}-${golesVisitaFinal})`);

        // Obtener apuestas pendientes
        const apuestasPendientes = await executeQuery(
          'SELECT id_apuesta, id_usuario, tipo_apuesta, id_equipo_predicho, retorno_potencial FROM apuestas_usuarios WHERE id_partido = ? AND estado = "pendiente"',
          [id]
        );

        if (apuestasPendientes.length > 0) {
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

            console.log(`📊 Usuario ${apuesta.id_usuario}: apostó "${tipoApuestaNormalizado}" vs resultado "${resultadoNormalizado}" = ${esGanadora ? 'GANÓ ✅' : 'PERDIÓ ❌'}`);

            // Actualizar estado de la apuesta
            await executeQuery(
              'UPDATE apuestas_usuarios SET estado = ?, puntos_ganados = ? WHERE id_apuesta = ?',
              [nuevoEstado, puntosGanados, apuesta.id_apuesta]
            );

            // Si ganó, registrar en historial de puntos
            if (esGanadora) {
              await executeQuery(
                'INSERT INTO historial_puntos (id_usuario, id_apuesta, id_partido, id_torneo, puntos_ganados) VALUES (?, ?, ?, ?, ?)',
                [apuesta.id_usuario, apuesta.id_apuesta, id, idTorneo, puntosGanados]
              );
              apuestasGanadas++;
            } else {
              apuestasPerdidas++;
            }
          }

          mensajeLiquidacion = {
            resultado_partido: resultadoPartido,
            apuestas_ganadas: apuestasGanadas,
            apuestas_perdidas: apuestasPerdidas,
            total_liquidadas: apuestasPendientes.length
          };

          console.log(`✅ Apuestas liquidadas automáticamente - Resultado: ${resultadoPartido} - Ganadas: ${apuestasGanadas}, Perdidas: ${apuestasPerdidas}`);
        } else {
          console.log('ℹ️ No hay apuestas pendientes para liquidar');
        }
      } catch (error) {
        console.error('⚠️ Error al liquidar apuestas automáticamente:', error);
        // No lanzamos el error para no afectar la actualización del partido
      }
    }

    res.json({
      message: 'Partido actualizado exitosamente',
      liquidacion: mensajeLiquidacion,
      partido: {
        id: parseInt(id),
        matchIdFbr,
        idTorneo: parseInt(idTorneo),
        fechaPartido,
        fechaTorneo,
        idEquipoLocal: parseInt(idEquipoLocal),
        idEquipoVisita: parseInt(idEquipoVisita),
        idEstadio: parseInt(idEstadio),
        golesLocal: golesLocalFinal,
        golesVisita: golesVisitaFinal,
        esCampoNeutro: esCampoNeutro ? 1 : 0,
        arbitro,
        asistencia: asistencia ? parseInt(asistencia) : null,
        clima,
        estadoPartido
      }
    });

  } catch (error) {
    console.error('❌ Error al actualizar partido:', error);
    console.error('📍 Stack trace:', error.stack);
    res.status(500).json({
      error: 'Error interno del servidor',
      detalle: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }
};

const eliminarPartido = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Eliminando partido ID:', id);

    // Verificar si el partido existe
    const partidoExiste = await executeQuery(
      'SELECT ID_PARTIDO, MATCH_ID_FBR FROM HECHOS_RESULTADOS WHERE ID_PARTIDO = ?',
      [id]
    );

    if (partidoExiste.length === 0) {
      console.log('❌ Partido no encontrado para eliminar:', id);
      return res.status(404).json({
        error: 'Partido no encontrado'
      });
    }

    // Verificar si el partido tiene estadísticas asociadas
    const tieneEstadisticas = await executeQuery(
      'SELECT COUNT(*) as total FROM HECHOS_ESTADISTICAS WHERE ID_PARTIDO = ?',
      [id]
    );

    if (tieneEstadisticas[0].total > 0) {
      console.log('❌ Partido tiene estadísticas, no se puede eliminar:', id);
      return res.status(409).json({
        error: 'No se puede eliminar el partido porque tiene estadísticas asociadas'
      });
    }

    // Eliminar partido
    await executeQuery(
      'DELETE FROM HECHOS_RESULTADOS WHERE ID_PARTIDO = ?',
      [id]
    );

    console.log('✅ Partido eliminado:', partidoExiste[0].MATCH_ID_FBR);

    res.json({
      message: 'Partido eliminado exitosamente'
    });

  } catch (error) {
    console.error('❌ Error al eliminar partido:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      detalle: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Obtener datos auxiliares para formularios
const obtenerTorneos = async (req, res) => {
  try {
    console.log('📋 Obteniendo torneos para formulario...');
    
    const query = 'SELECT ID_TORNEO, NOMBRE, TEMPORADA, RUEDA FROM DIM_TORNEO ORDER BY TEMPORADA DESC, NOMBRE';
    const torneos = await executeQuery(query);
    
    console.log(`✅ Se encontraron ${torneos.length} torneos`);
    res.json(torneos);
  } catch (error) {
    console.error('❌ Error al obtener torneos:', error);
    res.status(500).json({
      error: 'Error al obtener torneos',
      detalle: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

const obtenerEquipos = async (req, res) => {
  try {
    console.log('📋 Obteniendo equipos para formulario...');
    
    const query = 'SELECT ID_EQUIPO, NOMBRE, APODO, CIUDAD FROM DIM_EQUIPO ORDER BY NOMBRE';
    const equipos = await executeQuery(query);
    
    console.log(`✅ Se encontraron ${equipos.length} equipos`);
    res.json(equipos);
  } catch (error) {
    console.error('❌ Error al obtener equipos:', error);
    res.status(500).json({
      error: 'Error al obtener equipos',
      detalle: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

const obtenerEstadios = async (req, res) => {
  try {
    console.log('📋 Obteniendo estadios para formulario...');
    
    const query = 'SELECT ID_ESTADIO, NOMBRE, CIUDAD, CAPACIDAD FROM DIM_ESTADIO ORDER BY NOMBRE';
    const estadios = await executeQuery(query);
    
    console.log(`✅ Se encontraron ${estadios.length} estadios`);
    res.json(estadios);
  } catch (error) {
    console.error('❌ Error al obtener estadios:', error);
    res.status(500).json({
      error: 'Error al obtener estadios',
      detalle: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

console.log('✅ Todas las funciones de partidoController con BD definidas');

module.exports = {
  crearPartido,
  obtenerPartidos,
  obtenerPartidoPorId,
  actualizarPartido,
  eliminarPartido,
  obtenerTorneos,
  obtenerEquipos,
  obtenerEstadios
};