// backend/controllers/torneoController.js - VERSIÓN CORREGIDA
console.log('📂 Cargando torneoController con base de datos...');

// Asegurar que dotenv esté cargado
require('dotenv').config();

const mysql = require('mysql2/promise');

// Configuración de base de datos
const dbConfig = {
  host: process.env.DB_HOST || '192.168.100.16',
  user: process.env.DB_USER || 'mpuga',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'MP_DATA_DEV',
  port: process.env.DB_PORT || 3306,
  charset: 'utf8mb4',
  timezone: '+00:00'
};

console.log('🔧 Configuración DB para torneos:', {
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

// ============================================================================
// FUNCIONES ORIGINALES DEL CONTROLADOR (MANTENIDAS)
// ============================================================================

const crearTorneo = async (req, res) => {
  try {
    const { nombre, paisOrganizador, rueda, temporada, formatoTorneo, fases } = req.body;

    console.log('📝 Creando nuevo torneo:', req.body);

    // Validaciones básicas
    if (!nombre || !temporada || !formatoTorneo) {
      return res.status(400).json({
        error: 'Los campos nombre, temporada y formato de torneo son obligatorios'
      });
    }

    // Validar formato de torneo
    const formatosValidos = ['RUEDAS', 'FASES'];
    if (!formatosValidos.includes(formatoTorneo.toUpperCase())) {
      return res.status(400).json({
        error: 'El formato de torneo debe ser: RUEDAS o FASES'
      });
    }

    // Si es formato RUEDAS, la rueda es obligatoria
    if (formatoTorneo.toUpperCase() === 'RUEDAS' && !rueda) {
      return res.status(400).json({
        error: 'Para torneos con formato RUEDAS, debe especificar la rueda'
      });
    }

    // Validar que la rueda sea válida (si se proporciona)
    if (rueda) {
      const ruedasValidas = ['PRIMERA', 'SEGUNDA', 'UNICA'];
      if (!ruedasValidas.includes(rueda.toUpperCase())) {
        return res.status(400).json({
          error: 'La rueda debe ser: PRIMERA, SEGUNDA o UNICA'
        });
      }
    }

    // Si es formato FASES, las fases son obligatorias
    if (formatoTorneo.toUpperCase() === 'FASES' && (!fases || fases.length === 0)) {
      return res.status(400).json({
        error: 'Para torneos con formato FASES, debe especificar al menos una fase'
      });
    }

    // Verificar que el país existe (solo si se proporciona)
    if (paisOrganizador) {
      const paisExiste = await executeQuery(
        'SELECT ID_PAIS FROM DIM_PAIS WHERE ID_PAIS = ?',
        [paisOrganizador]
      );

      if (paisExiste.length === 0) {
        return res.status(400).json({
          error: 'El país organizador especificado no existe'
        });
      }
    }

    // Verificar si ya existe un torneo con el mismo nombre, temporada y formato
    let torneoExiste;
    if (formatoTorneo.toUpperCase() === 'RUEDAS') {
      torneoExiste = await executeQuery(
        'SELECT ID_TORNEO FROM DIM_TORNEO WHERE NOMBRE = ? AND RUEDA = ? AND TEMPORADA = ? AND FORMATO_TORNEO = ?',
        [nombre.toUpperCase(), rueda.toUpperCase(), temporada, 'RUEDAS']
      );
    } else {
      torneoExiste = await executeQuery(
        'SELECT ID_TORNEO FROM DIM_TORNEO WHERE NOMBRE = ? AND TEMPORADA = ? AND FORMATO_TORNEO = ?',
        [nombre.toUpperCase(), temporada, 'FASES']
      );
    }

    if (torneoExiste.length > 0) {
      console.log('❌ Torneo ya existe con esas características');
      return res.status(409).json({
        error: 'Ya existe un torneo con esas características'
      });
    }

    // Generar LEAGUE_ID_FBR único
    const maxIdResult = await executeQuery(
      'SELECT MAX(LEAGUE_ID_FBR) as max_id FROM DIM_TORNEO'
    );
    const maxId = maxIdResult[0].max_id || 0;
    const nuevoLeagueId = maxId + 1;

    // Insertar nuevo torneo
    const result = await executeQuery(
      `INSERT INTO DIM_TORNEO (LEAGUE_ID_FBR, NOMBRE, PAIS_ORGANIZADOR, RUEDA, TEMPORADA, FORMATO_TORNEO)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nuevoLeagueId,
        nombre.toUpperCase(),
        paisOrganizador || null,
        rueda ? rueda.toUpperCase() : null,
        temporada,
        formatoTorneo.toUpperCase()
      ]
    );

    const torneoId = result.insertId;
    console.log('✅ Torneo creado exitosamente con ID:', torneoId);

    // Si es formato FASES, insertar las fases
    if (formatoTorneo.toUpperCase() === 'FASES' && fases && fases.length > 0) {
      for (let i = 0; i < fases.length; i++) {
        const fase = fases[i];
        await executeQuery(
          `INSERT INTO DIM_FASE_TORNEO (ID_TORNEO, NOMBRE_FASE, ORDEN, DESCRIPCION)
           VALUES (?, ?, ?, ?)`,
          [torneoId, fase.nombre, i + 1, fase.descripcion || null]
        );
      }
      console.log(`✅ ${fases.length} fases insertadas para el torneo`);
    }

    res.status(201).json({
      message: 'Torneo creado exitosamente',
      torneo: {
        id: torneoId,
        league_id_fbr: nuevoLeagueId,
        nombre: nombre.toUpperCase(),
        pais_organizador: paisOrganizador,
        rueda: rueda ? rueda.toUpperCase() : null,
        temporada: temporada,
        formato_torneo: formatoTorneo.toUpperCase(),
        fases: fases || []
      }
    });

  } catch (error) {
    console.error('❌ Error al crear torneo:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      detalle: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

const obtenerTorneos = async (req, res) => {
  try {
    console.log('📋 Obteniendo lista de torneos...');

    const query = `
      SELECT
        t.ID_TORNEO,
        t.LEAGUE_ID_FBR,
        t.NOMBRE,
        t.PAIS_ORGANIZADOR,
        t.RUEDA,
        t.TEMPORADA,
        t.FORMATO_TORNEO,
        p.NOMBRE as NOMBRE_PAIS,
        p.CODIGO_FIFA as CODIGO_PAIS
      FROM DIM_TORNEO t
      LEFT JOIN DIM_PAIS p ON t.PAIS_ORGANIZADOR = p.ID_PAIS
      ORDER BY t.TEMPORADA DESC, t.NOMBRE ASC
    `;

    const torneos = await executeQuery(query);

    // Para cada torneo con formato FASES, obtener sus fases
    for (const torneo of torneos) {
      if (torneo.FORMATO_TORNEO === 'FASES') {
        const fasesQuery = `
          SELECT ID_FASE, NOMBRE_FASE, ORDEN, DESCRIPCION
          FROM DIM_FASE_TORNEO
          WHERE ID_TORNEO = ?
          ORDER BY ORDEN
        `;
        const fases = await executeQuery(fasesQuery, [torneo.ID_TORNEO]);
        torneo.FASES = fases;
      }
    }

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

const obtenerTorneoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 Buscando torneo con ID:', id);

    const query = `
      SELECT
        t.ID_TORNEO,
        t.LEAGUE_ID_FBR,
        t.NOMBRE,
        t.PAIS_ORGANIZADOR,
        t.RUEDA,
        t.TEMPORADA,
        t.FORMATO_TORNEO,
        p.NOMBRE as NOMBRE_PAIS,
        p.CODIGO_FIFA as CODIGO_PAIS
      FROM DIM_TORNEO t
      LEFT JOIN DIM_PAIS p ON t.PAIS_ORGANIZADOR = p.ID_PAIS
      WHERE t.ID_TORNEO = ?
    `;

    const torneo = await executeQuery(query, [id]);

    if (torneo.length === 0) {
      console.log('❌ Torneo no encontrado:', id);
      return res.status(404).json({
        error: 'Torneo no encontrado'
      });
    }

    const torneoData = torneo[0];

    // Si es formato FASES, obtener las fases
    if (torneoData.FORMATO_TORNEO === 'FASES') {
      const fasesQuery = `
        SELECT ID_FASE, NOMBRE_FASE, ORDEN, DESCRIPCION
        FROM DIM_FASE_TORNEO
        WHERE ID_TORNEO = ?
        ORDER BY ORDEN
      `;
      const fases = await executeQuery(fasesQuery, [id]);
      torneoData.FASES = fases;
    }

    console.log('✅ Torneo encontrado:', torneoData.NOMBRE);
    res.json(torneoData);

  } catch (error) {
    console.error('❌ Error al obtener torneo:', error);
    res.status(500).json({
      error: 'Error al obtener torneo',
      detalle: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

const actualizarTorneo = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, paisOrganizador, rueda, temporada, formatoTorneo, fases } = req.body;

    console.log('📝 Actualizando torneo ID:', id, 'con datos:', req.body);

    // Validaciones básicas
    if (!nombre || !temporada || !formatoTorneo) {
      return res.status(400).json({
        error: 'Los campos nombre, temporada y formato de torneo son obligatorios'
      });
    }

    // Validar formato de torneo
    const formatosValidos = ['RUEDAS', 'FASES'];
    if (!formatosValidos.includes(formatoTorneo.toUpperCase())) {
      return res.status(400).json({
        error: 'El formato de torneo debe ser: RUEDAS o FASES'
      });
    }

    // Si es formato RUEDAS, la rueda es obligatoria
    if (formatoTorneo.toUpperCase() === 'RUEDAS' && !rueda) {
      return res.status(400).json({
        error: 'Para torneos con formato RUEDAS, debe especificar la rueda'
      });
    }

    // Validar que la rueda sea válida (si se proporciona)
    if (rueda) {
      const ruedasValidas = ['PRIMERA', 'SEGUNDA', 'UNICA'];
      if (!ruedasValidas.includes(rueda.toUpperCase())) {
        return res.status(400).json({
          error: 'La rueda debe ser: PRIMERA, SEGUNDA o UNICA'
        });
      }
    }

    // Verificar si el torneo existe
    const torneoExiste = await executeQuery(
      'SELECT ID_TORNEO, LEAGUE_ID_FBR, FORMATO_TORNEO FROM DIM_TORNEO WHERE ID_TORNEO = ?',
      [id]
    );

    if (torneoExiste.length === 0) {
      console.log('❌ Torneo no encontrado para actualizar:', id);
      return res.status(404).json({
        error: 'Torneo no encontrado'
      });
    }

    // Verificar que el país existe (solo si se proporciona)
    if (paisOrganizador) {
      const paisExiste = await executeQuery(
        'SELECT ID_PAIS FROM DIM_PAIS WHERE ID_PAIS = ?',
        [paisOrganizador]
      );

      if (paisExiste.length === 0) {
        return res.status(400).json({
          error: 'El país organizador especificado no existe'
        });
      }
    }

    // Verificar si ya existe otro torneo con las mismas características
    let torneoDuplicado;
    if (formatoTorneo.toUpperCase() === 'RUEDAS') {
      torneoDuplicado = await executeQuery(
        'SELECT ID_TORNEO FROM DIM_TORNEO WHERE NOMBRE = ? AND RUEDA = ? AND TEMPORADA = ? AND FORMATO_TORNEO = ? AND ID_TORNEO != ?',
        [nombre.toUpperCase(), rueda.toUpperCase(), temporada, 'RUEDAS', id]
      );
    } else {
      torneoDuplicado = await executeQuery(
        'SELECT ID_TORNEO FROM DIM_TORNEO WHERE NOMBRE = ? AND TEMPORADA = ? AND FORMATO_TORNEO = ? AND ID_TORNEO != ?',
        [nombre.toUpperCase(), temporada, 'FASES', id]
      );
    }

    if (torneoDuplicado.length > 0) {
      console.log('❌ Ya existe otro torneo con esas características');
      return res.status(409).json({
        error: 'Ya existe otro torneo con esas características'
      });
    }

    // Actualizar torneo
    await executeQuery(
      `UPDATE DIM_TORNEO
       SET NOMBRE = ?, PAIS_ORGANIZADOR = ?, RUEDA = ?, TEMPORADA = ?, FORMATO_TORNEO = ?
       WHERE ID_TORNEO = ?`,
      [
        nombre.toUpperCase(),
        paisOrganizador || null,
        rueda ? rueda.toUpperCase() : null,
        temporada,
        formatoTorneo.toUpperCase(),
        id
      ]
    );

    console.log('✅ Torneo actualizado exitosamente');

    // Si es formato FASES, actualizar las fases
    if (formatoTorneo.toUpperCase() === 'FASES') {
      // Eliminar fases existentes
      await executeQuery('DELETE FROM DIM_FASE_TORNEO WHERE ID_TORNEO = ?', [id]);

      // Insertar nuevas fases
      if (fases && fases.length > 0) {
        for (let i = 0; i < fases.length; i++) {
          const fase = fases[i];
          await executeQuery(
            `INSERT INTO DIM_FASE_TORNEO (ID_TORNEO, NOMBRE_FASE, ORDEN, DESCRIPCION)
             VALUES (?, ?, ?, ?)`,
            [id, fase.nombre, i + 1, fase.descripcion || null]
          );
        }
        console.log(`✅ ${fases.length} fases actualizadas para el torneo`);
      }
    } else if (torneoExiste[0].FORMATO_TORNEO === 'FASES') {
      // Si el torneo cambió de FASES a RUEDAS, eliminar las fases
      await executeQuery('DELETE FROM DIM_FASE_TORNEO WHERE ID_TORNEO = ?', [id]);
      console.log('✅ Fases eliminadas (torneo cambió a formato RUEDAS)');
    }

    res.json({
      message: 'Torneo actualizado exitosamente',
      torneo: {
        id: parseInt(id),
        nombre: nombre.toUpperCase(),
        pais_organizador: paisOrganizador,
        rueda: rueda ? rueda.toUpperCase() : null,
        temporada: temporada,
        formato_torneo: formatoTorneo.toUpperCase()
      }
    });

  } catch (error) {
    console.error('❌ Error al actualizar torneo:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      detalle: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

const eliminarTorneo = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Eliminando torneo ID:', id);

    // Verificar si el torneo existe
    const torneoExiste = await executeQuery(
      'SELECT ID_TORNEO, NOMBRE FROM DIM_TORNEO WHERE ID_TORNEO = ?',
      [id]
    );

    if (torneoExiste.length === 0) {
      console.log('❌ Torneo no encontrado para eliminar:', id);
      return res.status(404).json({
        error: 'Torneo no encontrado'
      });
    }

    // Eliminar torneo
    await executeQuery(
      'DELETE FROM DIM_TORNEO WHERE ID_TORNEO = ?',
      [id]
    );

    console.log('✅ Torneo eliminado:', torneoExiste[0].NOMBRE);

    res.json({
      message: 'Torneo eliminado exitosamente'
    });

  } catch (error) {
    console.error('❌ Error al eliminar torneo:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      detalle: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Obtener países disponibles para el selector
const obtenerPaises = async (req, res) => {
  try {
    console.log('📋 Obteniendo países disponibles...');
    
    const query = 'SELECT ID_PAIS, CODIGO_FIFA, NOMBRE FROM DIM_PAIS ORDER BY NOMBRE';
    const paises = await executeQuery(query);
    
    console.log(`✅ Se encontraron ${paises.length} países`);
    res.json(paises);
  } catch (error) {
    console.error('❌ Error al obtener países:', error);
    res.status(500).json({
      error: 'Error al obtener países',
      detalle: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Función CORREGIDA: Obtener todos los torneos con información completa
const getAllTorneos = async (req, res) => {
  console.log('📋 Obteniendo TODOS los torneos con información completa...');

  try {
    const query = `
      SELECT
        t.ID_TORNEO,
        t.LEAGUE_ID_FBR,
        t.NOMBRE,
        t.PAIS_ORGANIZADOR,
        t.RUEDA,
        t.TEMPORADA,
        t.FORMATO_TORNEO,
        p.NOMBRE as NOMBRE_PAIS,
        p.CODIGO_FIFA as CODIGO_PAIS
      FROM DIM_TORNEO t
      LEFT JOIN DIM_PAIS p ON t.PAIS_ORGANIZADOR = p.ID_PAIS
      ORDER BY t.TEMPORADA DESC, t.NOMBRE ASC
    `;

    const torneos = await executeQuery(query);

    // Para cada torneo con formato FASES, obtener sus fases
    for (const torneo of torneos) {
      if (torneo.FORMATO_TORNEO === 'FASES') {
        const fasesQuery = `
          SELECT ID_FASE, NOMBRE_FASE, ORDEN, DESCRIPCION
          FROM DIM_FASE_TORNEO
          WHERE ID_TORNEO = ?
          ORDER BY ORDEN
        `;
        const fases = await executeQuery(fasesQuery, [torneo.ID_TORNEO]);
        torneo.FASES = fases;
      }
    }

    console.log(`✅ Se encontraron ${torneos.length} torneos totales`);

    res.json(torneos);
  } catch (error) {
    console.error('❌ Error al obtener todos los torneos:', error);
    res.status(500).json({
      error: 'Error al obtener torneos',
      detalle: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Función NUEVA: Obtener jugadores por torneo con equipo y posición
// Agregar esta función al controlador
// Función CORREGIDA: Obtener jugadores por torneo + jugadores sin asignar
const getJugadoresByTorneo = async (req, res) => {
  console.log('📋 Obteniendo jugadores asignados al torneo + jugadores sin asignar...');
  
  try {
    const { torneoId } = req.params;
    
    // PASO 1: Obtener jugadores YA ASIGNADOS al torneo específico
    const queryJugadoresAsignados = `
      SELECT 
        j.ID_JUGADOR,
        j.PLAYER_ID_FBR,
        j.NOMBRE_COMPLETO,
        j.APODO,
        j.FECHA_NACIMIENTO,
        j.PIE_DOMINANTE,
        tj.NUMERO_CAMISETA,
        tj.FECHA_INCORPORACION,
        tj.FECHA_SALIDA,
        tj.ESTADO,
        e.ID_EQUIPO,
        e.NOMBRE as nombre_equipo,
        e.APODO as apodo_equipo,
        GROUP_CONCAT(DISTINCT CONCAT(p.CODIGO_FIFA, ':', p.NOMBRE) SEPARATOR ',') as nacionalidades,
        GROUP_CONCAT(DISTINCT CONCAT(pos.CODIGO_POSICION, ':', pos.NOMBRE) ORDER BY jpos.ORDEN_PREFERENCIA SEPARATOR ',') as posiciones,
        'ASIGNADO' as origen
      FROM DIM_TORNEO_JUGADOR tj
      INNER JOIN DIM_JUGADOR j ON tj.ID_JUGADOR = j.ID_JUGADOR
      INNER JOIN DIM_EQUIPO e ON tj.ID_EQUIPO = e.ID_EQUIPO
      LEFT JOIN DIM_JUGADOR_PAIS jp ON j.ID_JUGADOR = jp.ID_JUGADOR
      LEFT JOIN DIM_PAIS p ON jp.ID_PAIS = p.ID_PAIS
      LEFT JOIN DIM_JUGADOR_POSICION jpos ON j.ID_JUGADOR = jpos.ID_JUGADOR
      LEFT JOIN DIM_POSICION pos ON jpos.ID_POSICION = pos.ID_POSICION
      WHERE tj.ID_TORNEO = ?
      GROUP BY j.ID_JUGADOR, j.PLAYER_ID_FBR, j.NOMBRE_COMPLETO, j.APODO, j.FECHA_NACIMIENTO, 
               j.PIE_DOMINANTE, tj.NUMERO_CAMISETA, tj.FECHA_INCORPORACION, tj.FECHA_SALIDA, 
               tj.ESTADO, e.ID_EQUIPO, e.NOMBRE, e.APODO
    `;

    // PASO 2: Obtener jugadores NO ASIGNADOS a ningún torneo
    const queryJugadoresSinAsignar = `
      SELECT 
        j.ID_JUGADOR,
        j.PLAYER_ID_FBR,
        j.NOMBRE_COMPLETO,
        j.APODO,
        j.FECHA_NACIMIENTO,
        j.PIE_DOMINANTE,
        NULL as NUMERO_CAMISETA,
        NULL as FECHA_INCORPORACION,
        NULL as FECHA_SALIDA,
        'SIN_ASIGNAR' as ESTADO,
        NULL as ID_EQUIPO,
        NULL as nombre_equipo,
        NULL as apodo_equipo,
        GROUP_CONCAT(DISTINCT CONCAT(p.CODIGO_FIFA, ':', p.NOMBRE) SEPARATOR ',') as nacionalidades,
        GROUP_CONCAT(DISTINCT CONCAT(pos.CODIGO_POSICION, ':', pos.NOMBRE) ORDER BY jpos.ORDEN_PREFERENCIA SEPARATOR ',') as posiciones,
        'SIN_ASIGNAR' as origen
      FROM DIM_JUGADOR j
      LEFT JOIN DIM_JUGADOR_PAIS jp ON j.ID_JUGADOR = jp.ID_JUGADOR
      LEFT JOIN DIM_PAIS p ON jp.ID_PAIS = p.ID_PAIS
      LEFT JOIN DIM_JUGADOR_POSICION jpos ON j.ID_JUGADOR = jpos.ID_JUGADOR
      LEFT JOIN DIM_POSICION pos ON jpos.ID_POSICION = pos.ID_POSICION
      WHERE j.ID_JUGADOR NOT IN (
        SELECT DISTINCT ID_JUGADOR 
        FROM DIM_TORNEO_JUGADOR 
        WHERE ID_JUGADOR IS NOT NULL
      )
      GROUP BY j.ID_JUGADOR, j.PLAYER_ID_FBR, j.NOMBRE_COMPLETO, j.APODO, j.FECHA_NACIMIENTO, j.PIE_DOMINANTE
    `;

    console.log(`🔍 Ejecutando consulta para jugadores asignados al torneo ${torneoId}...`);
    const jugadoresAsignados = await executeQuery(queryJugadoresAsignados, [torneoId]);
    
    console.log(`🔍 Ejecutando consulta para jugadores sin asignar a ningún torneo...`);
    const jugadoresSinAsignar = await executeQuery(queryJugadoresSinAsignar);
    
    // PASO 3: Combinar ambos resultados
    const todosLosJugadores = [...jugadoresAsignados, ...jugadoresSinAsignar];
    
    console.log(`✅ Jugadores asignados al torneo: ${jugadoresAsignados.length}`);
    console.log(`✅ Jugadores sin asignar: ${jugadoresSinAsignar.length}`);
    console.log(`✅ Total jugadores disponibles: ${todosLosJugadores.length}`);
    
    // PASO 4: Mapear resultados al formato esperado por el frontend
    const jugadoresMapeados = todosLosJugadores.map(row => ({
      id: row.ID_JUGADOR,
      player_id_fbr: row.PLAYER_ID_FBR,
      nombre_completo: row.NOMBRE_COMPLETO,
      apodo: row.APODO,
      fecha_nacimiento: row.FECHA_NACIMIENTO,
      pie_dominante: row.PIE_DOMINANTE,
      numero_camiseta: row.NUMERO_CAMISETA,
      fecha_incorporacion: row.FECHA_INCORPORACION,
      fecha_salida: row.FECHA_SALIDA,
      estado: row.ESTADO,
      equipo: row.nombre_equipo ? {
        id: row.ID_EQUIPO,
        nombre: row.nombre_equipo,
        apodo: row.apodo_equipo
      } : null,
      nacionalidades: row.nacionalidades ? row.nacionalidades.split(',').map(n => {
        const [codigo, nombre] = n.split(':');
        return { codigo, nombre };
      }) : [],
      posiciones: row.posiciones ? row.posiciones.split(',').map(p => {
        const [codigo, nombre] = p.split(':');
        return { codigo, nombre };
      }) : [],
      origen: row.origen // Para identificar si está asignado o disponible
    }));
    
    // PASO 5: Ordenar resultados (asignados primero, luego sin asignar, por nombre)
    jugadoresMapeados.sort((a, b) => {
      // Primero por origen (ASIGNADO antes que SIN_ASIGNAR)
      if (a.origen !== b.origen) {
        return a.origen === 'ASIGNADO' ? -1 : 1;
      }
      // Luego por nombre
      return a.nombre_completo.localeCompare(b.nombre_completo);
    });
    
    res.json(jugadoresMapeados);
    
  } catch (error) {
    console.error('❌ Error al obtener jugadores por torneo (con sin asignar):', error);
    res.status(500).json({
      error: 'Error al obtener jugadores por torneo',
      detalle: error.message,
      timestamp: new Date().toISOString()
    });
  }
};




// ============================================================================
// NUEVAS FUNCIONES PARA GESTIÓN DE ASIGNACIONES DE JUGADORES - CORREGIDAS
// ============================================================================

// Obtener torneos únicos para selección - CORREGIDO
const getTorneosUnicos = async (req, res) => {
  console.log('📋 Obteniendo torneos únicos...');
  
  try {
    const query = `
      SELECT DISTINCT 
        t.ID_TORNEO as id,
        CONCAT(t.NOMBRE, ' ', t.TEMPORADA, ' - ', t.RUEDA, ' rueda') as nombre,
        COUNT(tj.PLAYER_ID_FBR) as total_jugadores,
        COUNT(DISTINCT tj.ID_EQUIPO) as total_equipos
      FROM DIM_TORNEO t
      INNER JOIN DIM_TORNEO_JUGADOR tj ON t.ID_TORNEO = tj.ID_TORNEO
      GROUP BY t.ID_TORNEO, t.NOMBRE, t.TEMPORADA, t.RUEDA
      ORDER BY t.TEMPORADA DESC, t.NOMBRE ASC
    `;
    
    const torneos = await executeQuery(query);
    console.log(`✅ Se encontraron ${torneos.length} torneos únicos`);
    
    res.json(torneos);
  } catch (error) {
    console.error('❌ Error al obtener torneos únicos:', error);
    res.status(500).json({
      error: 'Error al obtener torneos únicos',
      detalle: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Obtener equipos por torneo - ESTRATEGIA DE CASCADA
const getEquiposByTorneo = async (req, res) => {
  console.log('📋 Obteniendo equipos por torneo...');

  try {
    const { torneoId } = req.params;

    // ESTRATEGIA 1: Intentar obtener equipos desde PARTIDOS (más confiable)
    // Incluye equipos locales, visitantes, extranjeros, segunda división, etc.
    const queryPartidos = `
      SELECT DISTINCT
        e.ID_EQUIPO as id,
        e.NOMBRE as nombre,
        e.APODO as apodo,
        e.CIUDAD as ciudad,
        e.IMAGEN as imagen,
        'partidos' as fuente
      FROM DIM_EQUIPO e
      WHERE e.ID_EQUIPO IN (
        SELECT DISTINCT ID_EQUIPO_LOCAL FROM HECHOS_RESULTADOS WHERE ID_TORNEO = ?
        UNION
        SELECT DISTINCT ID_EQUIPO_VISITA FROM HECHOS_RESULTADOS WHERE ID_TORNEO = ?
      )
      ORDER BY e.NOMBRE
    `;

    let equipos = await executeQuery(queryPartidos, [torneoId, torneoId]);

    if (equipos.length > 0) {
      console.log(`✅ [ESTRATEGIA 1] Se encontraron ${equipos.length} equipos con partidos en el torneo ${torneoId}`);
      return res.json(equipos);
    }

    console.log(`⚠️ [ESTRATEGIA 1] No hay partidos en el torneo ${torneoId}. Probando estrategia 2...`);

    // ESTRATEGIA 2: Obtener equipos que tienen jugadores asignados
    const queryJugadores = `
      SELECT DISTINCT
        e.ID_EQUIPO as id,
        e.NOMBRE as nombre,
        e.APODO as apodo,
        e.CIUDAD as ciudad,
        e.IMAGEN as imagen,
        COUNT(tj.ID_JUGADOR) as total_jugadores,
        'jugadores_asignados' as fuente
      FROM DIM_EQUIPO e
      INNER JOIN DIM_TORNEO_JUGADOR tj ON e.ID_EQUIPO = tj.ID_EQUIPO
      WHERE tj.ID_TORNEO = ?
      GROUP BY e.ID_EQUIPO, e.NOMBRE, e.APODO, e.CIUDAD, e.IMAGEN
      ORDER BY e.NOMBRE
    `;

    equipos = await executeQuery(queryJugadores, [torneoId]);

    if (equipos.length > 0) {
      console.log(`✅ [ESTRATEGIA 2] Se encontraron ${equipos.length} equipos con jugadores asignados en el torneo ${torneoId}`);
      return res.json(equipos);
    }

    console.log(`⚠️ [ESTRATEGIA 2] No hay jugadores asignados en el torneo ${torneoId}. Usando estrategia 3...`);

    // ESTRATEGIA 3: Devolver TODOS los equipos disponibles
    // Esto permite empezar a asignar jugadores en torneos nuevos
    const queryTodos = `
      SELECT
        ID_EQUIPO as id,
        NOMBRE as nombre,
        APODO as apodo,
        CIUDAD as ciudad,
        IMAGEN as imagen,
        'todos_disponibles' as fuente
      FROM DIM_EQUIPO
      ORDER BY NOMBRE
    `;

    equipos = await executeQuery(queryTodos);
    console.log(`✅ [ESTRATEGIA 3] Devolviendo ${equipos.length} equipos disponibles para asignación`);

    res.json(equipos);
  } catch (error) {
    console.error('❌ Error al obtener equipos por torneo:', error);
    res.status(500).json({
      error: 'Error al obtener equipos por torneo',
      detalle: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Obtener todos los equipos (para asignación)
const getAllEquipos = async (req, res) => {
  console.log('📋 Obteniendo todos los equipos...');
  
  try {
    const query = `
      SELECT 
        ID_EQUIPO as id,
        NOMBRE as nombre,
        APODO as apodo,
        CIUDAD as ciudad
      FROM DIM_EQUIPO
      ORDER BY NOMBRE
    `;
    
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

// Obtener todos los jugadores (para asignación) - CORREGIDO
const getAllJugadores = async (req, res) => {
  console.log('📋 Obteniendo todos los jugadores...');
  
  try {
    const query = `
      SELECT 
        j.ID_JUGADOR,
        j.PLAYER_ID_FBR,
        j.NOMBRE_COMPLETO,
        j.APODO,
        j.FECHA_NACIMIENTO,
        j.PIE_DOMINANTE,
        GROUP_CONCAT(DISTINCT CONCAT(p.CODIGO_FIFA, ':', p.NOMBRE) SEPARATOR ',') as nacionalidades,
        -- 🔧 CORRECCIÓN: Usar pos.NOMBRE en lugar de pos.CODIGO_POSICION
        GROUP_CONCAT(DISTINCT CONCAT(pos.CODIGO_POSICION, ':', pos.NOMBRE) SEPARATOR ',') as posiciones
      FROM DIM_JUGADOR j
      LEFT JOIN DIM_JUGADOR_PAIS jp ON j.ID_JUGADOR = jp.ID_JUGADOR
      LEFT JOIN DIM_PAIS p ON jp.ID_PAIS = p.ID_PAIS
      LEFT JOIN DIM_JUGADOR_POSICION jpos ON j.ID_JUGADOR = jpos.ID_JUGADOR
      LEFT JOIN DIM_POSICION pos ON jpos.ID_POSICION = pos.ID_POSICION
      GROUP BY j.ID_JUGADOR, j.PLAYER_ID_FBR, j.NOMBRE_COMPLETO, j.APODO, j.FECHA_NACIMIENTO, j.PIE_DOMINANTE
      ORDER BY j.NOMBRE_COMPLETO
    `;
    
    const jugadores = await executeQuery(query);
    
    const jugadoresMapeados = jugadores.map(row => ({
      id: row.ID_JUGADOR,
      player_id_fbr: row.PLAYER_ID_FBR,
      nombre_completo: row.NOMBRE_COMPLETO,
      apodo: row.APODO,
      fecha_nacimiento: row.FECHA_NACIMIENTO,
      pie_dominante: row.PIE_DOMINANTE,
      nacionalidades: row.nacionalidades ? 
        row.nacionalidades.split(',').map(n => {
          const [codigo, nombre] = n.split(':');
          return { codigo, nombre };
        }) : [],
      posiciones: row.posiciones ? 
        row.posiciones.split(',').map(p => {
          const [codigo, nombre] = p.split(':');
          return { codigo, nombre }; // ✅ Ahora 'nombre' contendrá el nombre completo
        }) : []
    }));
    
    console.log(`✅ Se encontraron ${jugadoresMapeados.length} jugadores`);
    res.json(jugadoresMapeados);
  } catch (error) {
    console.error('❌ Error al obtener jugadores:', error);
    res.status(500).json({
      error: 'Error al obtener jugadores',
      detalle: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Agregar función para actualizar posiciones de un jugador en el torneo
const actualizarPosicionesJugador = async (req, res) => {
  console.log('📝 Actualizando posiciones del jugador:', req.body);
  
  let connection;
  try {
    const { playerIdFbr } = req.params;
    const { posiciones } = req.body; // Array de IDs de posiciones
    
    if (!posiciones || !Array.isArray(posiciones)) {
      return res.status(400).json({
        error: 'Las posiciones deben ser un array'
      });
    }

    connection = await mysql.createConnection(dbConfig);
    await connection.beginTransaction();

    // Verificar que el jugador existe
    const [jugadorExiste] = await connection.execute(
      'SELECT ID_JUGADOR FROM DIM_JUGADOR WHERE PLAYER_ID_FBR = ?',
      [playerIdFbr]
    );

    if (jugadorExiste.length === 0) {
      return res.status(404).json({
        error: 'Jugador no encontrado'
      });
    }

    const jugadorId = jugadorExiste[0].ID_JUGADOR;

    // Eliminar posiciones existentes
    await connection.execute(
      'DELETE FROM DIM_JUGADOR_POSICION WHERE ID_JUGADOR = ?',
      [jugadorId]
    );

    // Insertar nuevas posiciones
    if (posiciones.length > 0) {
      const insertQuery = 'INSERT INTO DIM_JUGADOR_POSICION (ID_JUGADOR, ID_POSICION) VALUES ?';
      const values = posiciones.map(posicionId => [jugadorId, posicionId]);
      
      await connection.query(insertQuery, [values]);
    }

    await connection.commit();
    console.log('✅ Posiciones actualizadas exitosamente');

    res.json({
      message: 'Posiciones actualizadas exitosamente',
      jugador_id: jugadorId,
      posiciones_actualizadas: posiciones.length
    });

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('❌ Error al actualizar posiciones:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      detalle: error.message,
      timestamp: new Date().toISOString()
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// Función ACTUALIZADA: Obtener jugadores por torneo y equipo usando ID_JUGADOR
const getJugadoresByTorneoEquipo = async (req, res) => {
  console.log('📋 Obteniendo jugadores por torneo y equipo...');

  try {
    const { torneoId, equipoId } = req.params;
    console.log(`🔍 Parámetros recibidos: torneoId=${torneoId}, equipoId=${equipoId}`);

    const query = `
      SELECT
        j.ID_JUGADOR,
        j.PLAYER_ID_FBR,
        j.NOMBRE_COMPLETO,
        j.APODO,
        j.FECHA_NACIMIENTO,
        j.PIE_DOMINANTE,
        tj.NUMERO_CAMISETA,
        tj.FECHA_INCORPORACION,
        tj.FECHA_SALIDA,
        tj.ESTADO,
        e.NOMBRE as nombre_equipo,
        e.APODO as apodo_equipo,
        GROUP_CONCAT(DISTINCT CONCAT(p.CODIGO_FIFA, ':', p.NOMBRE) SEPARATOR ',') as nacionalidades,
        GROUP_CONCAT(DISTINCT CONCAT(pos.CODIGO_POSICION, ':', pos.NOMBRE) ORDER BY jpos.ORDEN_PREFERENCIA SEPARATOR ',') as posiciones,
        MIN(
          CASE pos.CODIGO_POSICION
            -- Arqueros
            WHEN 'GK' THEN 1
            -- Defensas centrales
            WHEN 'DF' THEN 2
            WHEN 'CB' THEN 2
            -- Laterales
            WHEN 'FB' THEN 3
            WHEN 'LB' THEN 3
            WHEN 'RB' THEN 3
            WHEN 'LWB' THEN 3
            WHEN 'RWB' THEN 3
            -- Mediocampistas defensivos
            WHEN 'DM' THEN 4
            WHEN 'CDM' THEN 4
            -- Mediocampistas
            WHEN 'MF' THEN 5
            WHEN 'CM' THEN 5
            -- Mediocampistas ofensivos
            WHEN 'AM' THEN 6
            WHEN 'CAM' THEN 6
            -- Extremos
            WHEN 'W' THEN 7
            WHEN 'LW' THEN 7
            WHEN 'RW' THEN 7
            WHEN 'LM' THEN 7
            WHEN 'RM' THEN 7
            -- Delanteros
            WHEN 'FW' THEN 8
            WHEN 'ST' THEN 8
            WHEN 'CF' THEN 8
            ELSE 99
          END
        ) as orden_posicion
      FROM DIM_TORNEO_JUGADOR tj
      INNER JOIN DIM_JUGADOR j ON tj.ID_JUGADOR = j.ID_JUGADOR
      INNER JOIN DIM_EQUIPO e ON tj.ID_EQUIPO = e.ID_EQUIPO
      LEFT JOIN DIM_JUGADOR_PAIS jp ON j.ID_JUGADOR = jp.ID_JUGADOR
      LEFT JOIN DIM_PAIS p ON jp.ID_PAIS = p.ID_PAIS
      LEFT JOIN DIM_JUGADOR_POSICION jpos ON j.ID_JUGADOR = jpos.ID_JUGADOR
      LEFT JOIN DIM_POSICION pos ON jpos.ID_POSICION = pos.ID_POSICION
      WHERE tj.ID_TORNEO = ? AND tj.ID_EQUIPO = ?
      GROUP BY j.ID_JUGADOR, j.PLAYER_ID_FBR, j.NOMBRE_COMPLETO, j.APODO, j.FECHA_NACIMIENTO, j.PIE_DOMINANTE,
               tj.NUMERO_CAMISETA, tj.FECHA_INCORPORACION, tj.FECHA_SALIDA, tj.ESTADO, e.NOMBRE, e.APODO
      ORDER BY orden_posicion ASC, j.NOMBRE_COMPLETO ASC
    `;

    const jugadores = await executeQuery(query, [torneoId, equipoId]);

    console.log(`✅ Se encontraron ${jugadores.length} jugadores en torneo ${torneoId} equipo ${equipoId}`);

    if (jugadores.length === 0) {
      console.log('⚠️ No se encontraron jugadores. Verificando si hay datos en DIM_TORNEO_JUGADOR...');
      const checkQuery = 'SELECT COUNT(*) as total FROM DIM_TORNEO_JUGADOR WHERE ID_TORNEO = ? AND ID_EQUIPO = ?';
      const checkResult = await executeQuery(checkQuery, [torneoId, equipoId]);
      console.log(`🔍 Registros en DIM_TORNEO_JUGADOR: ${checkResult[0].total}`);
    }
    
    const jugadoresMapeados = jugadores.map(row => ({
      id: row.ID_JUGADOR,
      player_id_fbr: row.PLAYER_ID_FBR,
      nombre_completo: row.NOMBRE_COMPLETO,
      apodo: row.APODO,
      fecha_nacimiento: row.FECHA_NACIMIENTO,
      pie_dominante: row.PIE_DOMINANTE,
      numero_camiseta: row.NUMERO_CAMISETA,
      fecha_incorporacion: row.FECHA_INCORPORACION,
      fecha_salida: row.FECHA_SALIDA,
      estado: row.ESTADO,
      nombre_equipo: row.nombre_equipo,
      apodo_equipo: row.apodo_equipo,
      nacionalidades: row.nacionalidades ? row.nacionalidades.split(',').map(n => {
        const [codigo, nombre] = n.split(':');
        return { codigo, nombre };
      }) : [],
      posiciones: row.posiciones ? row.posiciones.split(',').map(p => {
        const [codigo, nombre] = p.split(':');
        return { codigo, nombre };
      }) : []
    }));
    
    res.json(jugadoresMapeados);
  } catch (error) {
    console.error('❌ Error al obtener jugadores por torneo y equipo:', error);
    res.status(500).json({
      error: 'Error al obtener jugadores por torneo y equipo',
      detalle: error.message,
      timestamp: new Date().toISOString()
    });
  }
};


// Función ACTUALIZADA: Asignar jugador usando ID_JUGADOR
const asignarJugadorTorneoEquipo = async (req, res) => {
  console.log('📝 Asignando jugador a torneo-equipo:', req.body);
  
  let connection;
  try {
    const {
      torneoId,
      equipoId,
      jugadorId,  // Ahora usando jugadorId en lugar de playerIdFbr
      numeroCamiseta,
      fechaIncorporacion
    } = req.body;

    // Validaciones básicas
    if (!torneoId || !equipoId || !jugadorId) {
      return res.status(400).json({
        error: 'Torneo, equipo y jugador son obligatorios'
      });
    }

    connection = await mysql.createConnection(dbConfig);
    await connection.beginTransaction();

    // NUEVA VALIDACIÓN: Verificar si el jugador ya está en este torneo
    const [asignacionExistente] = await connection.execute(
      'SELECT ID_EQUIPO, ESTADO FROM DIM_TORNEO_JUGADOR WHERE ID_TORNEO = ? AND ID_JUGADOR = ?',
      [torneoId, jugadorId]
    );

    if (asignacionExistente.length > 0) {
      const equipoActual = asignacionExistente[0].ID_EQUIPO;
      const estadoActual = asignacionExistente[0].ESTADO;
      
      if (parseInt(equipoActual) === parseInt(equipoId)) {
        // El jugador ya está asignado al mismo equipo en este torneo
        return res.status(409).json({
          error: `El jugador ya está asignado a este equipo en este torneo (Estado: ${estadoActual})`
        });
      } else {
        // El jugador está en el torneo pero en otro equipo
        return res.status(400).json({
          error: 'Un jugador no puede cambiar de equipo dentro del mismo torneo. Para reasignarlo, debe eliminarlo primero del equipo actual.'
        });
      }
    }

    // Verificar que el número de camiseta no esté ocupado (si se proporciona)
    if (numeroCamiseta) {
      const [existeNumero] = await connection.execute(
        'SELECT ID_JUGADOR FROM DIM_TORNEO_JUGADOR WHERE ID_TORNEO = ? AND ID_EQUIPO = ? AND NUMERO_CAMISETA = ?',
        [torneoId, equipoId, numeroCamiseta]
      );

      if (existeNumero.length > 0) {
        return res.status(409).json({
          error: `El número de camiseta ${numeroCamiseta} ya está ocupado en este equipo`
        });
      }
    }

    // Obtener PLAYER_ID_FBR del jugador para mantener compatibilidad
    const [jugadorData] = await connection.execute(
      'SELECT PLAYER_ID_FBR, NOMBRE_COMPLETO FROM DIM_JUGADOR WHERE ID_JUGADOR = ?',
      [jugadorId]
    );

    if (jugadorData.length === 0) {
      return res.status(404).json({
        error: 'Jugador no encontrado'
      });
    }

    console.log(`📋 Asignando ${jugadorData[0].NOMBRE_COMPLETO} al torneo ${torneoId} y equipo ${equipoId}`);

    // Insertar nueva asignación
    const insertQuery = `
      INSERT INTO DIM_TORNEO_JUGADOR 
      (ID_TORNEO, ID_JUGADOR, PLAYER_ID_FBR, ID_EQUIPO, NUMERO_CAMISETA, FECHA_INCORPORACION, ESTADO, FECHA_CREACION) 
      VALUES (?, ?, ?, ?, ?, ?, 'ACTIVO', current_timestamp())
    `;

    await connection.execute(insertQuery, [
      torneoId,
      jugadorId,
      jugadorData[0].PLAYER_ID_FBR,  // Mantener para compatibilidad
      equipoId,
      numeroCamiseta || null,
      fechaIncorporacion || null
    ]);

    await connection.commit();
    console.log('✅ Jugador asignado exitosamente');

    res.status(201).json({
      message: `Jugador ${jugadorData[0].NOMBRE_COMPLETO} asignado exitosamente`,
      asignacion: {
        torneoId,
        equipoId,
        jugadorId,
        nombreJugador: jugadorData[0].NOMBRE_COMPLETO,
        numeroCamiseta,
        fechaIncorporacion
      }
    });

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('❌ Error al asignar jugador:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      detalle: error.message,
      timestamp: new Date().toISOString()
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// =====================================================================
// NUEVA FUNCIÓN: Obtener asignaciones de un jugador
// =====================================================================

const getAsignacionesJugador = async (req, res) => {
  console.log('📋 Obteniendo asignaciones del jugador...');
  
  try {
    const { jugadorId } = req.params;
    
    const query = `
      SELECT 
        t.ID_TORNEO,
        t.NOMBRE as nombre_torneo,
        t.TEMPORADA,
        t.RUEDA,
        e.ID_EQUIPO,
        e.NOMBRE as nombre_equipo,
        e.APODO as apodo_equipo,
        tj.NUMERO_CAMISETA,
        tj.FECHA_INCORPORACION,
        tj.ESTADO
      FROM DIM_TORNEO_JUGADOR tj
      INNER JOIN DIM_TORNEO t ON tj.ID_TORNEO = t.ID_TORNEO
      INNER JOIN DIM_EQUIPO e ON tj.ID_EQUIPO = e.ID_EQUIPO
      WHERE tj.ID_JUGADOR = ?
      ORDER BY t.TEMPORADA DESC, t.NOMBRE ASC
    `;
    
    const asignaciones = await executeQuery(query, [jugadorId]);
    
    console.log(`✅ Se encontraron ${asignaciones.length} asignaciones para el jugador ${jugadorId}`);
    
    res.json(asignaciones);
  } catch (error) {
    console.error('❌ Error al obtener asignaciones del jugador:', error);
    res.status(500).json({
      error: 'Error al obtener asignaciones del jugador',
      detalle: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Remover jugador de torneo-equipo
const removerJugadorTorneoEquipo = async (req, res) => {
  console.log('🗑️ Removiendo jugador de torneo-equipo...');
  console.log('📋 Parámetros recibidos:', req.params);
  
  let connection;
  try {
    const { torneoId, equipoId, jugadorId } = req.params;
    
    // Validación de parámetros
    console.log(`📋 Validando parámetros: torneoId=${torneoId}, equipoId=${equipoId}, jugadorId=${jugadorId}`);
    
    if (!torneoId || !equipoId || !jugadorId) {
      console.error('❌ Parámetros faltantes:', { torneoId, equipoId, jugadorId });
      return res.status(400).json({
        error: 'Parámetros faltantes: torneoId, equipoId y jugadorId son requeridos'
      });
    }

    console.log('🔗 Creando conexión a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    await connection.beginTransaction();
    console.log('✅ Conexión creada y transacción iniciada');

    // PASO 1: Determinar si jugadorId es ID_JUGADOR o PLAYER_ID_FBR
    console.log('🔍 Determinando tipo de ID recibido...');
    let idJugadorReal = null;
    let playerIdFbrReal = null;
    
    // Primero, intentar buscar por ID_JUGADOR
    const consultaPorIdJugador = 'SELECT ID_JUGADOR, PLAYER_ID_FBR FROM DIM_TORNEO_JUGADOR WHERE ID_TORNEO = ? AND ID_EQUIPO = ? AND ID_JUGADOR = ?';
    console.log('🔍 Buscando por ID_JUGADOR:', consultaPorIdJugador);
    
    const [existePorIdJugador] = await connection.execute(consultaPorIdJugador, [torneoId, equipoId, jugadorId]);
    
    if (existePorIdJugador.length > 0) {
      // El jugadorId es efectivamente un ID_JUGADOR
      console.log('✅ Parámetro jugadorId es un ID_JUGADOR válido');
      idJugadorReal = jugadorId;
      playerIdFbrReal = existePorIdJugador[0].PLAYER_ID_FBR;
    } else {
      // Intentar buscar por PLAYER_ID_FBR
      console.log('🔍 No encontrado por ID_JUGADOR, intentando por PLAYER_ID_FBR...');
      const consultaPorPlayerIdFbr = 'SELECT ID_JUGADOR, PLAYER_ID_FBR FROM DIM_TORNEO_JUGADOR WHERE ID_TORNEO = ? AND ID_EQUIPO = ? AND PLAYER_ID_FBR = ?';
      console.log('🔍 Buscando por PLAYER_ID_FBR:', consultaPorPlayerIdFbr);
      
      const [existePorPlayerIdFbr] = await connection.execute(consultaPorPlayerIdFbr, [torneoId, equipoId, jugadorId]);
      
      if (existePorPlayerIdFbr.length > 0) {
        // El jugadorId es efectivamente un PLAYER_ID_FBR
        console.log('✅ Parámetro jugadorId es un PLAYER_ID_FBR válido');
        idJugadorReal = existePorPlayerIdFbr[0].ID_JUGADOR;
        playerIdFbrReal = jugadorId;
      } else {
        console.error('❌ No se encontró la asignación del jugador con ningún tipo de ID');
        await connection.rollback();
        return res.status(404).json({
          error: `No se encontró la asignación del jugador con ID ${jugadorId} en este torneo y equipo`
        });
      }
    }

    console.log(`✅ Asignación encontrada - ID_JUGADOR: ${idJugadorReal}, PLAYER_ID_FBR: ${playerIdFbrReal}`);

    // PASO 2: Eliminar la asignación usando ID_JUGADOR (más confiable)
    console.log('🗑️ Procediendo a eliminar la asignación...');
    const consultaEliminacion = 'DELETE FROM DIM_TORNEO_JUGADOR WHERE ID_TORNEO = ? AND ID_EQUIPO = ? AND ID_JUGADOR = ?';
    console.log('🗑️ Consulta de eliminación:', consultaEliminacion);
    console.log('🗑️ Parámetros de eliminación:', [torneoId, equipoId, idJugadorReal]);
    
    const resultadoEliminacion = await connection.execute(consultaEliminacion, [torneoId, equipoId, idJugadorReal]);
    console.log('🗑️ Resultado de eliminación:', resultadoEliminacion);

    // Verificar que se eliminó al menos un registro
    if (resultadoEliminacion[0].affectedRows === 0) {
      console.error('❌ No se eliminó ningún registro');
      await connection.rollback();
      return res.status(404).json({
        error: 'No se pudo eliminar la asignación del jugador'
      });
    }

    await connection.commit();
    console.log('✅ Transacción completada exitosamente');
    console.log(`✅ Jugador removido exitosamente - Registros afectados: ${resultadoEliminacion[0].affectedRows}`);

    res.json({
      message: 'Jugador removido exitosamente del torneo y equipo',
      detalles: {
        torneoId: parseInt(torneoId),
        equipoId: parseInt(equipoId),
        idJugadorEliminado: parseInt(idJugadorReal),
        playerIdFbrEliminado: playerIdFbrReal,
        registrosAfectados: resultadoEliminacion[0].affectedRows
      }
    });

  } catch (error) {
    console.error('❌ Error en removerJugadorTorneoEquipo:', error);
    console.error('📍 Stack trace:', error.stack);
    
    if (connection) {
      try {
        await connection.rollback();
        console.log('↩️ Rollback ejecutado');
      } catch (rollbackError) {
        console.error('❌ Error en rollback:', rollbackError);
      }
    }
    
    res.status(500).json({
      error: 'Error interno del servidor al remover jugador',
      detalle: error.message,
      timestamp: new Date().toISOString()
    });
  } finally {
    if (connection) {
      try {
        await connection.end();
        console.log('🔚 Conexión cerrada');
      } catch (closeError) {
        console.error('❌ Error cerrando conexión:', closeError);
      }
    }
  }
};

// Actualizar asignación
const actualizarAsignacion = async (req, res) => {
  console.log('📝 Actualizando asignación:', req.body);
  
  let connection;
  try {
    const { torneoId, equipoId, playerIdFbr } = req.params;
    const {
      numeroCamiseta,
      fechaIncorporacion,
      fechaSalida,
      estado
    } = req.body;

    connection = await mysql.createConnection(dbConfig);
    await connection.beginTransaction();

    // Verificar que existe la asignación
    const [existeAsignacion] = await connection.execute(
      'SELECT * FROM DIM_TORNEO_JUGADOR WHERE ID_TORNEO = ? AND ID_EQUIPO = ? AND PLAYER_ID_FBR = ?',
      [torneoId, equipoId, playerIdFbr]
    );

    if (existeAsignacion.length === 0) {
      return res.status(404).json({
        error: 'No se encontró la asignación del jugador'
      });
    }

    // Verificar número de camiseta si se está cambiando
    if (numeroCamiseta && numeroCamiseta !== existeAsignacion[0].NUMERO_CAMISETA) {
      const [existeNumero] = await connection.execute(
        'SELECT * FROM DIM_TORNEO_JUGADOR WHERE ID_TORNEO = ? AND ID_EQUIPO = ? AND NUMERO_CAMISETA = ? AND PLAYER_ID_FBR != ?',
        [torneoId, equipoId, numeroCamiseta, playerIdFbr]
      );

      if (existeNumero.length > 0) {
        return res.status(409).json({
          error: `El número de camiseta ${numeroCamiseta} ya está ocupado`
        });
      }
    }

    // Actualizar asignación
    const updateQuery = `
      UPDATE DIM_TORNEO_JUGADOR SET 
        NUMERO_CAMISETA = ?,
        FECHA_INCORPORACION = ?,
        FECHA_SALIDA = ?,
        ESTADO = ?
      WHERE ID_TORNEO = ? AND ID_EQUIPO = ? AND PLAYER_ID_FBR = ?
    `;

    await connection.execute(updateQuery, [
      numeroCamiseta || existeAsignacion[0].NUMERO_CAMISETA,
      fechaIncorporacion || existeAsignacion[0].FECHA_INCORPORACION,
      fechaSalida || existeAsignacion[0].FECHA_SALIDA,
      estado || existeAsignacion[0].ESTADO,
      torneoId,
      equipoId,
      playerIdFbr
    ]);

    await connection.commit();
    console.log('✅ Asignación actualizada exitosamente');

    res.json({
      message: 'Asignación actualizada exitosamente'
    });

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('❌ Error al actualizar asignación:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      detalle: error.message,
      timestamp: new Date().toISOString()
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// Nueva función: Actualizar asignación completa (asignación + posiciones)
const actualizarAsignacionCompleta = async (req, res) => {
  console.log('📝 Actualizando asignación completa...');
  console.log('📍 Params:', req.params);
  console.log('📦 Body:', JSON.stringify(req.body, null, 2));

  let connection;
  try {
    const { torneoId, equipoId, jugadorId } = req.params;
    const {
      numero_camiseta,
      fecha_incorporacion,
      fecha_salida,
      estado,
      pie_dominante,
      posiciones_ids
    } = req.body;

    connection = await mysql.createConnection(dbConfig);
    await connection.beginTransaction();

    // 1. Obtener ID_JUGADOR desde PLAYER_ID_FBR
    const [jugadorData] = await connection.execute(
      'SELECT ID_JUGADOR FROM DIM_JUGADOR WHERE PLAYER_ID_FBR = ?',
      [jugadorId]
    );

    if (jugadorData.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Jugador no encontrado' });
    }

    const idJugador = jugadorData[0].ID_JUGADOR;
    console.log(`✅ ID_JUGADOR encontrado: ${idJugador}`);

    // 2. Verificar que existe la asignación
    const [existeAsignacion] = await connection.execute(
      `SELECT tj.*, j.PLAYER_ID_FBR
       FROM DIM_TORNEO_JUGADOR tj
       INNER JOIN DIM_JUGADOR j ON tj.ID_JUGADOR = j.ID_JUGADOR
       WHERE tj.ID_TORNEO = ? AND tj.ID_EQUIPO = ? AND j.PLAYER_ID_FBR = ?`,
      [torneoId, equipoId, jugadorId]
    );

    if (existeAsignacion.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'No se encontró la asignación del jugador' });
    }

    // 3. Verificar número de camiseta si se está cambiando
    if (numero_camiseta && numero_camiseta !== existeAsignacion[0].NUMERO_CAMISETA) {
      const [existeNumero] = await connection.execute(
        `SELECT tj.*
         FROM DIM_TORNEO_JUGADOR tj
         INNER JOIN DIM_JUGADOR j ON tj.ID_JUGADOR = j.ID_JUGADOR
         WHERE tj.ID_TORNEO = ? AND tj.ID_EQUIPO = ? AND tj.NUMERO_CAMISETA = ? AND j.PLAYER_ID_FBR != ?`,
        [torneoId, equipoId, numero_camiseta, jugadorId]
      );

      if (existeNumero.length > 0) {
        await connection.rollback();
        return res.status(409).json({
          error: `El número de camiseta ${numero_camiseta} ya está ocupado`
        });
      }
    }

    // 4. Actualizar asignación en DIM_TORNEO_JUGADOR
    const updateQuery = `
      UPDATE DIM_TORNEO_JUGADOR tj
      INNER JOIN DIM_JUGADOR j ON tj.ID_JUGADOR = j.ID_JUGADOR
      SET
        tj.NUMERO_CAMISETA = ?,
        tj.FECHA_INCORPORACION = ?,
        tj.FECHA_SALIDA = ?,
        tj.ESTADO = ?
      WHERE tj.ID_TORNEO = ? AND tj.ID_EQUIPO = ? AND j.PLAYER_ID_FBR = ?
    `;

    await connection.execute(updateQuery, [
      numero_camiseta || existeAsignacion[0].NUMERO_CAMISETA,
      fecha_incorporacion || existeAsignacion[0].FECHA_INCORPORACION,
      fecha_salida || existeAsignacion[0].FECHA_SALIDA,
      estado || existeAsignacion[0].ESTADO,
      torneoId,
      equipoId,
      jugadorId
    ]);

    // 5. Actualizar pie_dominante en DIM_JUGADOR si se envió
    if (pie_dominante !== undefined) {
      // Convertir cadena vacía a NULL para el campo ENUM
      const pieValue = pie_dominante === '' ? null : pie_dominante;
      console.log(`🦶 Actualizando PIE_DOMINANTE: ${pieValue} para jugador ${idJugador}`);

      const [pieResult] = await connection.execute(
        'UPDATE DIM_JUGADOR SET PIE_DOMINANTE = ? WHERE ID_JUGADOR = ?',
        [pieValue, idJugador]
      );
      console.log(`✅ PIE_DOMINANTE actualizado: ${pieResult.changedRows} filas afectadas`);
    }

    // 6. Actualizar posiciones si se enviaron
    if (posiciones_ids && Array.isArray(posiciones_ids)) {
      console.log(`📍 Actualizando posiciones. Total: ${posiciones_ids.length}`, posiciones_ids);

      // Eliminar posiciones existentes
      const [deleteResult] = await connection.execute(
        'DELETE FROM DIM_JUGADOR_POSICION WHERE ID_JUGADOR = ?',
        [idJugador]
      );
      console.log(`✅ Posiciones antiguas eliminadas: ${deleteResult.affectedRows} filas`);

      // Insertar nuevas posiciones (un registro por cada posición)
      if (posiciones_ids.length > 0) {
        for (let i = 0; i < posiciones_ids.length; i++) {
          const esPrincipal = i === 0 ? 1 : 0; // La primera es la principal
          const ordenPreferencia = i + 1; // Orden secuencial

          console.log(`  ➕ Insertando posición ID=${posiciones_ids[i]} (principal: ${esPrincipal}, orden: ${ordenPreferencia})`);

          await connection.execute(
            `INSERT INTO DIM_JUGADOR_POSICION
             (ID_JUGADOR, ID_POSICION, ES_POSICION_PRINCIPAL, ORDEN_PREFERENCIA)
             VALUES (?, ?, ?, ?)`,
            [idJugador, posiciones_ids[i], esPrincipal, ordenPreferencia]
          );
        }

        console.log(`✅ ${posiciones_ids.length} posiciones insertadas correctamente`);
      }
    }

    await connection.commit();
    console.log('✅✅✅ Asignación completa actualizada exitosamente');
    console.log(`📊 Resumen: Jugador ${jugadorId} (ID: ${idJugador}) actualizado`);

    res.json({
      message: 'Asignación actualizada exitosamente',
      jugador_id: idJugador,
      player_id_fbr: jugadorId
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('❌❌❌ Error al actualizar asignación completa:', error.message);
    console.error('📍 Stack trace:', error.stack);
    res.status(500).json({
      error: 'Error al actualizar asignación completa',
      detalle: error.message,
      timestamp: new Date().toISOString()
    });
  } finally {
    if (connection) await connection.end();
  }
};

// =====================================================================
// NUEVAS FUNCIONES: Gestión de Fases
// =====================================================================

// Obtener plantillas de fases disponibles
const obtenerPlantillasFases = async (req, res) => {
  try {
    console.log('📋 Obteniendo plantillas de fases...');

    const query = `
      SELECT DISTINCT TIPO_TORNEO
      FROM DIM_PLANTILLA_FASE
      ORDER BY TIPO_TORNEO
    `;

    const tipos = await executeQuery(query);

    // Para cada tipo, obtener sus fases
    const plantillas = {};
    for (const tipo of tipos) {
      const fasesQuery = `
        SELECT ID_PLANTILLA, NOMBRE_FASE, ORDEN, DESCRIPCION
        FROM DIM_PLANTILLA_FASE
        WHERE TIPO_TORNEO = ?
        ORDER BY ORDEN
      `;
      const fases = await executeQuery(fasesQuery, [tipo.TIPO_TORNEO]);
      plantillas[tipo.TIPO_TORNEO] = fases;
    }

    console.log(`✅ Se encontraron ${Object.keys(plantillas).length} tipos de plantillas`);
    res.json(plantillas);

  } catch (error) {
    console.error('❌ Error al obtener plantillas de fases:', error);
    res.status(500).json({
      error: 'Error al obtener plantillas de fases',
      detalle: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Obtener fases de un torneo específico
const obtenerFasesTorneo = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📋 Obteniendo fases del torneo ${id}...`);

    const query = `
      SELECT ID_FASE, NOMBRE_FASE, ORDEN, DESCRIPCION, FECHA_INICIO, FECHA_FIN
      FROM DIM_FASE_TORNEO
      WHERE ID_TORNEO = ?
      ORDER BY ORDEN
    `;

    const fases = await executeQuery(query, [id]);

    console.log(`✅ Se encontraron ${fases.length} fases para el torneo ${id}`);
    res.json(fases);

  } catch (error) {
    console.error('❌ Error al obtener fases del torneo:', error);
    res.status(500).json({
      error: 'Error al obtener fases del torneo',
      detalle: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Agregar fase a un torneo
const agregarFaseTorneo = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombreFase, descripcion, fechaInicio, fechaFin } = req.body;

    console.log(`📝 Agregando fase al torneo ${id}:`, req.body);

    // Validar que el torneo existe y es de formato FASES
    const torneoQuery = await executeQuery(
      'SELECT FORMATO_TORNEO FROM DIM_TORNEO WHERE ID_TORNEO = ?',
      [id]
    );

    if (torneoQuery.length === 0) {
      return res.status(404).json({ error: 'Torneo no encontrado' });
    }

    if (torneoQuery[0].FORMATO_TORNEO !== 'FASES') {
      return res.status(400).json({
        error: 'Solo se pueden agregar fases a torneos con formato FASES'
      });
    }

    // Obtener el orden máximo actual
    const ordenQuery = await executeQuery(
      'SELECT COALESCE(MAX(ORDEN), 0) as max_orden FROM DIM_FASE_TORNEO WHERE ID_TORNEO = ?',
      [id]
    );
    const nuevoOrden = ordenQuery[0].max_orden + 1;

    // Insertar la nueva fase
    const result = await executeQuery(
      `INSERT INTO DIM_FASE_TORNEO (ID_TORNEO, NOMBRE_FASE, ORDEN, DESCRIPCION, FECHA_INICIO, FECHA_FIN)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, nombreFase, nuevoOrden, descripcion || null, fechaInicio || null, fechaFin || null]
    );

    console.log('✅ Fase agregada exitosamente con ID:', result.insertId);

    res.status(201).json({
      message: 'Fase agregada exitosamente',
      fase: {
        id: result.insertId,
        nombre_fase: nombreFase,
        orden: nuevoOrden,
        descripcion,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin
      }
    });

  } catch (error) {
    console.error('❌ Error al agregar fase:', error);
    res.status(500).json({
      error: 'Error al agregar fase',
      detalle: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

console.log('✅ Todas las funciones de torneoController definidas (CRUD + Asignaciones + Fases) - CORREGIDAS');

module.exports = {
  // Funciones originales CRUD
  crearTorneo,
  obtenerTorneos,
  obtenerTorneoPorId,
  actualizarTorneo,
  eliminarTorneo,
  obtenerPaises,

  // Nuevas funciones para asignaciones - ASEGURAR QUE TODAS ESTÉN AQUÍ
  getTorneosUnicos,
  getEquiposByTorneo,
  getAllEquipos,
  getAllJugadores,
  getJugadoresByTorneoEquipo,
  asignarJugadorTorneoEquipo,
  removerJugadorTorneoEquipo,     // ← CRÍTICO: Esta debe estar aquí
  actualizarAsignacion,
  actualizarAsignacionCompleta,   // ← NUEVO: Actualizar asignación completa (asignación + posiciones)
  actualizarPosicionesJugador,
  getAllTorneos,                  // ← NECESARIA para /all
  getJugadoresByTorneo,          // ← NECESARIA para /:torneoId/jugadores
  getAsignacionesJugador,

  // Nuevas funciones para gestión de fases
  obtenerPlantillasFases,
  obtenerFasesTorneo,
  agregarFaseTorneo
};