// backend/controllers/playersController.js
console.log('📂 Cargando playersController con base de datos...');

// Asegurar que dotenv esté cargado
require('dotenv').config();

const mysql = require('mysql2/promise');

// Configuración de base de datos (igual que equipoController)
const dbConfig = {
  host: process.env.DB_HOST || '192.168.100.16',
  user: process.env.DB_USER || 'mpuga',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'MP_DATA_DEV',
  port: process.env.DB_PORT || 3306
};

console.log('🔧 Configuración DB para jugadores:', {
  host: dbConfig.host,
  user: dbConfig.user,
  database: dbConfig.database,
  port: dbConfig.port,
  password: dbConfig.password ? '***configurado***' : 'NO CONFIGURADO'
});

// Función helper para ejecutar consultas (igual que equipoController)
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

const playersController = {
  // Obtener todos los jugadores - USANDO ID_JUGADOR (estructura migrada)
  getAllPlayers: async (req, res) => {
    console.log('📋 Obteniendo lista de jugadores desde BD...');
    
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
      
      console.log(`✅ Se encontraron ${jugadores.length} jugadores en la BD`);
      
      const jugadoresMapeados = jugadores.map(row => ({
        ID_JUGADOR: row.ID_JUGADOR,
        PLAYER_ID_FBR: row.PLAYER_ID_FBR,
        NOMBRE_COMPLETO: row.NOMBRE_COMPLETO,
        APODO: row.APODO,
        FECHA_NACIMIENTO: row.FECHA_NACIMIENTO,
        PIE_DOMINANTE: row.PIE_DOMINANTE,
        nacionalidades: row.nacionalidades ?
          row.nacionalidades.split(',').map(n => {
            const [codigo, nombre] = n.split(':');
            return { codigo, nombre };
          }) : [],
        posiciones: row.posiciones ?
          row.posiciones.split(',').map(p => {
            const [codigo, nombre] = p.split(':');
            return { codigo, nombre };
          }) : []
      }));

      res.json(jugadoresMapeados);
    } catch (error) {
      console.error('❌ Error al obtener jugadores:', error);
      res.status(500).json({
        error: 'Error al obtener jugadores',
        detalle: error.message,
        timestamp: new Date().toISOString()
      });
    }
  },

  // Obtener jugador por ID - USANDO ID_JUGADOR (estructura migrada)
  getPlayerById: async (req, res) => {
    try {
      const { id } = req.params;
      console.log('🔍 Buscando jugador con ID:', id);
      
      const query = `
        SELECT 
          j.ID_JUGADOR,
          j.PLAYER_ID_FBR,
          j.NOMBRE_COMPLETO,
          j.APODO,
          j.FECHA_NACIMIENTO,
          j.PIE_DOMINANTE,
          GROUP_CONCAT(DISTINCT CONCAT(p.CODIGO_FIFA, ':', p.NOMBRE) SEPARATOR ',') as nacionalidades,
          GROUP_CONCAT(DISTINCT CONCAT(pos.CODIGO_POSICION, ':', pos.NOMBRE) SEPARATOR ',') as posiciones
        FROM DIM_JUGADOR j
        LEFT JOIN DIM_JUGADOR_PAIS jp ON j.ID_JUGADOR = jp.ID_JUGADOR
        LEFT JOIN DIM_PAIS p ON jp.ID_PAIS = p.ID_PAIS
        LEFT JOIN DIM_JUGADOR_POSICION jpos ON j.ID_JUGADOR = jpos.ID_JUGADOR
        LEFT JOIN DIM_POSICION pos ON jpos.ID_POSICION = pos.ID_POSICION
        WHERE j.ID_JUGADOR = ?
        GROUP BY j.ID_JUGADOR, j.PLAYER_ID_FBR, j.NOMBRE_COMPLETO, j.APODO, j.FECHA_NACIMIENTO, j.PIE_DOMINANTE
      `;
      
      const jugador = await executeQuery(query, [id]);
      
      if (jugador.length === 0) {
        console.log('❌ Jugador no encontrado:', id);
        return res.status(404).json({ error: 'Jugador no encontrado' });
      }

      const row = jugador[0];
      const jugadorMapeado = {
        ID_JUGADOR: row.ID_JUGADOR,
        PLAYER_ID_FBR: row.PLAYER_ID_FBR,
        NOMBRE_COMPLETO: row.NOMBRE_COMPLETO,
        APODO: row.APODO,
        FECHA_NACIMIENTO: row.FECHA_NACIMIENTO,
        PIE_DOMINANTE: row.PIE_DOMINANTE,
        nacionalidades: row.nacionalidades ?
          row.nacionalidades.split(',').map(n => {
            const [codigo, nombre] = n.split(':');
            return { codigo, nombre };
          }) : [],
        posiciones: row.posiciones ?
          row.posiciones.split(',').map(p => {
            const [codigo, nombre] = p.split(':');
            return { codigo, nombre };
          }) : []
      };

      console.log('✅ Jugador encontrado:', jugadorMapeado.NOMBRE_COMPLETO);
      res.json(jugadorMapeado);
    } catch (error) {
      console.error('❌ Error al obtener jugador:', error);
      res.status(500).json({
        error: 'Error al obtener jugador',
        detalle: error.message,
        timestamp: new Date().toISOString()
      });
    }
  },

  // Crear nuevo jugador - USANDO ID_JUGADOR (estructura migrada)
  createPlayer: async (req, res) => {
    console.log('📝 Creando nuevo jugador:', req.body);
    
    let connection;
    try {
      const {
        player_id_fbr,
        nombre_completo,
        apodo,
        fecha_nacimiento,
        pie_dominante,
        nacionalidades,
        posiciones
      } = req.body;

      // Validaciones básicas
      if (!nombre_completo) {
        console.log('❌ Faltan campos obligatorios');
        return res.status(400).json({
          error: 'El nombre completo es obligatorio',
          received: req.body
        });
      }

      if (!player_id_fbr) {
        console.log('❌ Falta player_id_fbr');
        return res.status(400).json({ error: 'El player_id_fbr es obligatorio' });
      }

      // Crear conexión manual para transacciones
      connection = await mysql.createConnection(dbConfig);
      await connection.beginTransaction();

      // Verificar que el player_id_fbr no exista ya
      const existingPlayer = await connection.execute(
        'SELECT ID_JUGADOR FROM DIM_JUGADOR WHERE PLAYER_ID_FBR = ?',
        [player_id_fbr]
      );

      if (existingPlayer[0].length > 0) {
        console.log('❌ Jugador ya existe:', player_id_fbr);
        return res.status(400).json({ error: 'Ya existe un jugador con ese PLAYER_ID_FBR' });
      }

      // Insertar jugador en DIM_JUGADOR
      const insertPlayerQuery = `
        INSERT INTO DIM_JUGADOR (
          PLAYER_ID_FBR, 
          NOMBRE_COMPLETO, 
          APODO, 
          FECHA_NACIMIENTO,
          PIE_DOMINANTE
        ) VALUES (?, ?, ?, ?, ?)
      `;

      const [playerResult] = await connection.execute(insertPlayerQuery, [
        player_id_fbr, 
        nombre_completo, 
        apodo || null, 
        fecha_nacimiento || null,
        pie_dominante || null
      ]);

      const jugadorId = playerResult.insertId;
      console.log('✅ Jugador insertado con ID:', jugadorId);

      // Insertar nacionalidades si se proporcionan - USANDO ID_JUGADOR
      if (nacionalidades && nacionalidades.length > 0) {
        for (const codigoPais of nacionalidades) {
          const [paisRows] = await connection.execute(
            'SELECT ID_PAIS FROM DIM_PAIS WHERE CODIGO_FIFA = ?',
            [codigoPais]
          );

          if (paisRows.length > 0) {
            await connection.execute(
              'INSERT INTO DIM_JUGADOR_PAIS (ID_JUGADOR, ID_PAIS, TIPO_RELACION) VALUES (?, ?, ?)',
              [jugadorId, paisRows[0].ID_PAIS, 'NACIONALIDAD']
            );
            console.log(`✅ Nacionalidad agregada: ${codigoPais}`);
          } else {
            console.warn(`⚠️ País con código ${codigoPais} no encontrado`);
          }
        }
      }

      // Insertar posiciones si se proporcionan - USANDO ID_JUGADOR
      if (posiciones && posiciones.length > 0) {
        for (let i = 0; i < posiciones.length; i++) {
          const codigoPosicion = posiciones[i];
          const [posicionRows] = await connection.execute(
            'SELECT ID_POSICION FROM DIM_POSICION WHERE CODIGO_POSICION = ?',
            [codigoPosicion]
          );

          if (posicionRows.length > 0) {
            await connection.execute(
              'INSERT INTO DIM_JUGADOR_POSICION (ID_JUGADOR, ID_POSICION, ES_POSICION_PRINCIPAL, ORDEN_PREFERENCIA) VALUES (?, ?, ?, ?)',
              [jugadorId, posicionRows[0].ID_POSICION, i === 0 ? 1 : 0, i + 1]
            );
            console.log(`✅ Posición agregada: ${codigoPosicion}`);
          } else {
            console.warn(`⚠️ Posición con código ${codigoPosicion} no encontrada`);
          }
        }
      }

      await connection.commit();
      console.log('✅ Jugador creado exitosamente');

      // Obtener el jugador completo creado
      req.params = { id: jugadorId };
      await playersController.getPlayerById(req, res);

    } catch (error) {
      if (connection) {
        await connection.rollback();
      }
      console.error('❌ Error al crear jugador:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        res.status(400).json({ error: 'Ya existe un jugador con ese PLAYER_ID_FBR' });
      } else {
        res.status(500).json({
          error: 'Error interno del servidor',
          detalle: error.message,
          timestamp: new Date().toISOString()
        });
      }
    } finally {
      if (connection) {
        await connection.end();
      }
    }
  },

  // Actualizar jugador - USANDO ID_JUGADOR (estructura migrada)
  updatePlayer: async (req, res) => {
    console.log('📝 Actualizando jugador ID:', req.params.id, 'con datos:', req.body);
    
    let connection;
    try {
      const { id } = req.params;
      const {
        player_id_fbr,
        nombre_completo,
        apodo,
        fecha_nacimiento,
        pie_dominante,
        nacionalidades,
        posiciones
      } = req.body;

      connection = await mysql.createConnection(dbConfig);
      await connection.beginTransaction();

      // Verificar que el jugador existe
      const [existingPlayer] = await connection.execute(
        'SELECT ID_JUGADOR, PLAYER_ID_FBR FROM DIM_JUGADOR WHERE ID_JUGADOR = ?',
        [id]
      );

      if (existingPlayer.length === 0) {
        console.log('❌ Jugador no encontrado para actualizar:', id);
        return res.status(404).json({ error: 'Jugador no encontrado' });
      }

      const currentPlayerIdFbr = existingPlayer[0].PLAYER_ID_FBR;

      // Si se está cambiando el PLAYER_ID_FBR, verificar que no exista en otro jugador
      if (player_id_fbr && player_id_fbr !== currentPlayerIdFbr) {
        const [duplicatePlayer] = await connection.execute(
          'SELECT ID_JUGADOR FROM DIM_JUGADOR WHERE PLAYER_ID_FBR = ? AND ID_JUGADOR != ?',
          [player_id_fbr, id]
        );

        if (duplicatePlayer.length > 0) {
          console.log('❌ Player ID duplicado:', player_id_fbr);
          return res.status(400).json({ error: 'Ya existe otro jugador con ese PLAYER_ID_FBR' });
        }
      }

      const newPlayerIdFbr = player_id_fbr || currentPlayerIdFbr;

      // Actualizar información del jugador
      const updatePlayerQuery = `
        UPDATE DIM_JUGADOR SET 
          PLAYER_ID_FBR = ?, 
          NOMBRE_COMPLETO = ?, 
          APODO = ?, 
          FECHA_NACIMIENTO = ?,
          PIE_DOMINANTE = ?
        WHERE ID_JUGADOR = ?
      `;

      await connection.execute(updatePlayerQuery, [
        newPlayerIdFbr, 
        nombre_completo, 
        apodo || null, 
        fecha_nacimiento || null,
        pie_dominante || null,
        id
      ]);

      // Eliminar nacionalidades existentes y agregar nuevas - USAR ID_JUGADOR
      await connection.execute('DELETE FROM DIM_JUGADOR_PAIS WHERE ID_JUGADOR = ?', [id]);
      
      if (nacionalidades && nacionalidades.length > 0) {
        for (const codigoPais of nacionalidades) {
          const [paisRows] = await connection.execute(
            'SELECT ID_PAIS FROM DIM_PAIS WHERE CODIGO_FIFA = ?',
            [codigoPais]
          );

          if (paisRows.length > 0) {
            await connection.execute(
              'INSERT INTO DIM_JUGADOR_PAIS (ID_JUGADOR, ID_PAIS, TIPO_RELACION) VALUES (?, ?, ?)',
              [id, paisRows[0].ID_PAIS, 'NACIONALIDAD']
            );
          }
        }
      }

      // Eliminar posiciones existentes y agregar nuevas - USAR ID_JUGADOR
      await connection.execute('DELETE FROM DIM_JUGADOR_POSICION WHERE ID_JUGADOR = ?', [id]);
      
      if (posiciones && posiciones.length > 0) {
        for (let i = 0; i < posiciones.length; i++) {
          const codigoPosicion = posiciones[i];
          const [posicionRows] = await connection.execute(
            'SELECT ID_POSICION FROM DIM_POSICION WHERE CODIGO_POSICION = ?',
            [codigoPosicion]
          );

          if (posicionRows.length > 0) {
            await connection.execute(
              'INSERT INTO DIM_JUGADOR_POSICION (ID_JUGADOR, ID_POSICION, ES_POSICION_PRINCIPAL, ORDEN_PREFERENCIA) VALUES (?, ?, ?, ?)',
              [id, posicionRows[0].ID_POSICION, i === 0 ? 1 : 0, i + 1]
            );
          }
        }
      }

      await connection.commit();
      console.log('✅ Jugador actualizado exitosamente:', id);

      // Retornar jugador actualizado
      req.params = { id };
      await playersController.getPlayerById(req, res);

    } catch (error) {
      if (connection) {
        await connection.rollback();
      }
      console.error('❌ Error al actualizar jugador:', error);
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
  },

  // Eliminar jugador - USANDO ID_JUGADOR (estructura migrada)
  deletePlayer: async (req, res) => {
    console.log('🗑️ Eliminando jugador ID:', req.params.id);
    
    let connection;
    try {
      const { id } = req.params;

      connection = await mysql.createConnection(dbConfig);
      await connection.beginTransaction();

      // Verificar que el jugador existe
      const [existingPlayer] = await connection.execute(
        'SELECT ID_JUGADOR, NOMBRE_COMPLETO FROM DIM_JUGADOR WHERE ID_JUGADOR = ?',
        [id]
      );

      if (existingPlayer.length === 0) {
        console.log('❌ Jugador no encontrado para eliminar:', id);
        return res.status(404).json({ error: 'Jugador no encontrado' });
      }

      // Eliminar relaciones - USAR ID_JUGADOR
      await connection.execute('DELETE FROM DIM_JUGADOR_PAIS WHERE ID_JUGADOR = ?', [id]);
      await connection.execute('DELETE FROM DIM_JUGADOR_POSICION WHERE ID_JUGADOR = ?', [id]);
      
      // Eliminar jugador
      await connection.execute('DELETE FROM DIM_JUGADOR WHERE ID_JUGADOR = ?', [id]);

      await connection.commit();
      console.log('✅ Jugador eliminado:', existingPlayer[0].NOMBRE_COMPLETO);

      res.json({ message: 'Jugador eliminado exitosamente' });

    } catch (error) {
      if (connection) {
        await connection.rollback();
      }
      console.error('❌ Error al eliminar jugador:', error);
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
  },

  // Obtener países disponibles para nacionalidades
  getCountries: async (req, res) => {
    console.log('📋 Obteniendo países disponibles...');
    
    try {
      const query = 'SELECT ID_PAIS as pais_id, CODIGO_FIFA as codigo_pais, NOMBRE as nombre_pais FROM DIM_PAIS ORDER BY NOMBRE';
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
  },

  // Obtener posiciones disponibles
  getPositions: async (req, res) => {
    console.log('📋 Obteniendo posiciones disponibles...');
    
    try {
      const query = 'SELECT ID_POSICION as posicion_id, CODIGO_POSICION as codigo_posicion, NOMBRE as nombre_posicion FROM DIM_POSICION ORDER BY NOMBRE';
      const posiciones = await executeQuery(query);
      
      console.log(`✅ Se encontraron ${posiciones.length} posiciones`);
      res.json(posiciones);
    } catch (error) {
      console.error('❌ Error al obtener posiciones:', error);
      res.status(500).json({
        error: 'Error al obtener posiciones',
        detalle: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
};

console.log('✅ Todas las funciones de playersController con BD definidas');

module.exports = playersController;