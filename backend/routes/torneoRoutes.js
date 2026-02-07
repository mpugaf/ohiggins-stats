// Rutas API actualizadas para manejo de posiciones múltiples
// backend/routes/torneoRoutes.js (ACTUALIZACIONES)

const express = require('express');
const router = express.Router();
const torneoController = require('../controllers/torneoController');

// ===== RUTAS EXISTENTES =====
// ... todas las rutas existentes se mantienen ...

// ===== NUEVAS RUTAS PARA GESTIÓN MEJORADA =====

// ✅ NUEVA RUTA: Actualizar posiciones de un jugador
router.put('/jugadores/:playerIdFbr/posiciones', torneoController.actualizarPosicionesJugador);

// ✅ RUTA MEJORADA: Actualizar asignación completa (incluyendo posiciones)
router.put('/torneos/:torneoId/equipos/:equipoId/jugadores/:playerIdFbr/completo', 
  torneoController.actualizarAsignacionCompleta);

// ✅ NUEVA RUTA: Obtener posiciones disponibles
router.get('/posiciones', torneoController.obtenerPosiciones);

module.exports = router;

// ===== FUNCIONES ADICIONALES PARA EL CONTROLADOR =====

// Función para obtener todas las posiciones disponibles
const obtenerPosiciones = async (req, res) => {
  console.log('📋 Obteniendo posiciones disponibles...');
  
  try {
    const query = `
      SELECT 
        ID_POSICION as posicion_id,
        CODIGO_POSICION as codigo_posicion,
        NOMBRE as nombre_posicion,
        DESCRIPCION as descripcion
      FROM DIM_POSICION
      ORDER BY NOMBRE
    `;
    
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
};

// Función para actualizar asignación completa (número + posiciones)
const actualizarAsignacionCompleta = async (req, res) => {
  console.log('📝 Actualizando asignación completa:', req.body);
  
  let connection;
  try {
    const { torneoId, equipoId, playerIdFbr } = req.params;
    const {
      numero_camiseta,
      fecha_incorporacion,
      fecha_salida,
      estado,
      posiciones_ids
    } = req.body;

    connection = await mysql.createConnection(dbConfig);
    await connection.beginTransaction();

    // 1. Verificar que existe la asignación
    const [existeAsignacion] = await connection.execute(
      'SELECT * FROM DIM_TORNEO_JUGADOR WHERE ID_TORNEO = ? AND ID_EQUIPO = ? AND PLAYER_ID_FBR = ?',
      [torneoId, equipoId, playerIdFbr]
    );

    if (existeAsignacion.length === 0) {
      return res.status(404).json({
        error: 'No se encontró la asignación del jugador'
      });
    }

    // 2. Verificar número de camiseta si se está cambiando
    if (numero_camiseta && numero_camiseta !== existeAsignacion[0].NUMERO_CAMISETA) {
      const [existeNumero] = await connection.execute(
        'SELECT * FROM DIM_TORNEO_JUGADOR WHERE ID_TORNEO = ? AND ID_EQUIPO = ? AND NUMERO_CAMISETA = ? AND PLAYER_ID_FBR != ?',
        [torneoId, equipoId, numero_camiseta, playerIdFbr]
      );

      if (existeNumero.length > 0) {
        return res.status(409).json({
          error: `El número de camiseta ${numero_camiseta} ya está ocupado`
        });
      }
    }

    // 3. Actualizar datos en DIM_TORNEO_JUGADOR
    const updateQuery = `
      UPDATE DIM_TORNEO_JUGADOR SET 
        NUMERO_CAMISETA = ?,
        FECHA_INCORPORACION = ?,
        FECHA_SALIDA = ?,
        ESTADO = ?
      WHERE ID_TORNEO = ? AND ID_EQUIPO = ? AND PLAYER_ID_FBR = ?
    `;

    await connection.execute(updateQuery, [
      numero_camiseta || existeAsignacion[0].NUMERO_CAMISETA,
      fecha_incorporacion || existeAsignacion[0].FECHA_INCORPORACION,
      fecha_salida || existeAsignacion[0].FECHA_SALIDA,
      estado || existeAsignacion[0].ESTADO,
      torneoId,
      equipoId,
      playerIdFbr
    ]);

    // 4. Actualizar posiciones si se proporcionaron
    if (posiciones_ids && Array.isArray(posiciones_ids)) {
      // Obtener ID_JUGADOR
      const [jugadorInfo] = await connection.execute(
        'SELECT ID_JUGADOR FROM DIM_JUGADOR WHERE PLAYER_ID_FBR = ?',
        [playerIdFbr]
      );

      if (jugadorInfo.length > 0) {
        const jugadorId = jugadorInfo[0].ID_JUGADOR;

        // Eliminar posiciones existentes
        await connection.execute(
          'DELETE FROM DIM_JUGADOR_POSICION WHERE ID_JUGADOR = ?',
          [jugadorId]
        );

        // Insertar nuevas posiciones
        if (posiciones_ids.length > 0) {
          const insertQuery = 'INSERT INTO DIM_JUGADOR_POSICION (ID_JUGADOR, ID_POSICION) VALUES ?';
          const values = posiciones_ids.map(posicionId => [jugadorId, posicionId]);
          
          await connection.query(insertQuery, [values]);
        }
      }
    }

    await connection.commit();
    console.log('✅ Asignación completa actualizada exitosamente');

    res.json({
      message: 'Asignación actualizada exitosamente',
      actualizado: {
        numero_camiseta,
        fecha_incorporacion,
        estado,
        posiciones_actualizadas: posiciones_ids?.length || 0
      }
    });

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('❌ Error al actualizar asignación completa:', error);
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

// ===== EXPORTAR FUNCIONES ADICIONALES =====
// Agregar al final del archivo torneoController.js:

module.exports = {
  // ... funciones existentes ...
  
  // ✅ Funciones corregidas
  getJugadoresByTorneoEquipo,
  getAllJugadores,
  
  // ✅ Nuevas funciones
  actualizarPosicionesJugador,
  obtenerPosiciones,
  actualizarAsignacionCompleta
};