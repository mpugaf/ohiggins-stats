const { pool } = require('../config/database');

class StatsService {
  // Dimensiones
  async getEquipos() {
    try {
      const [rows] = await pool.query('SELECT * FROM DIM_EQUIPO');
      return rows;
    } catch (error) {
      throw new Error(`Error obteniendo equipos: ${error.message}`);
    }
  }

  async getEstadios() {
    try {
      const [rows] = await pool.query('SELECT * FROM DIM_ESTADIO');
      return rows;
    } catch (error) {
      throw new Error(`Error obteniendo estadios: ${error.message}`);
    }
  }

  async getJugadores() {
    try {
      const [rows] = await pool.query('SELECT * FROM DIM_JUGADOR');
      return rows;
    } catch (error) {
      throw new Error(`Error obteniendo jugadores: ${error.message}`);
    }
  }

  async getPaises() {
    try {
      const [rows] = await pool.query('SELECT * FROM DIM_PAIS');
      return rows;
    } catch (error) {
      throw new Error(`Error obteniendo países: ${error.message}`);
    }
  }

  async getPosiciones() {
    try {
      const [rows] = await pool.query('SELECT * FROM DIM_POSICION');
      return rows;
    } catch (error) {
      throw new Error(`Error obteniendo posiciones: ${error.message}`);
    }
  }

  async getJugadorPosiciones() {
    try {
      const [rows] = await pool.query('SELECT * FROM DIM_JUGADOR_POSICION');
      return rows;
    } catch (error) {
      throw new Error(`Error obteniendo posiciones de jugadores: ${error.message}`);
    }
  }

  async getTiposEstadistica() {
    try {
      const [rows] = await pool.query('SELECT * FROM DIM_TIPO_ESTADISTICA');
      return rows;
    } catch (error) {
      throw new Error(`Error obteniendo tipos de estadística: ${error.message}`);
    }
  }

  async getTorneos() {
    try {
      const [rows] = await pool.query('SELECT * FROM DIM_TORNEO');
      return rows;
    } catch (error) {
      throw new Error(`Error obteniendo torneos: ${error.message}`);
    }
  }

  // Métodos para DIM_TORNEO_JUGADOR
  async getTorneoJugadores() {
    try {
      const [rows] = await pool.query('SELECT * FROM DIM_TORNEO_JUGADOR');
      return rows;
    } catch (error) {
      throw new Error(`Error obteniendo torneo jugadores: ${error.message}`);
    }
  }

  async getTorneoJugadorPorId(id) {
    try {
      const [rows] = await pool.query('SELECT * FROM DIM_TORNEO_JUGADOR WHERE ID_TORNEO_JUGADOR = ?', [id]);
      return rows[0];
    } catch (error) {
      throw new Error(`Error obteniendo torneo jugador por ID: ${error.message}`);
    }
  }

  async getJugadoresPorTorneo(torneoId) {
    try {
      const [rows] = await pool.query(`
        SELECT 
          dtj.ID_TORNEO_JUGADOR,
          dj.ID_JUGADOR,
          dj.NOMBRE AS NOMBRE_JUGADOR,
          de.ID_EQUIPO,
          de.NOMBRE AS NOMBRE_EQUIPO,
          dt.ID_TORNEO,
          dt.NOMBRE AS NOMBRE_TORNEO
        FROM DIM_TORNEO_JUGADOR dtj
        JOIN DIM_JUGADOR dj ON dtj.ID_JUGADOR = dj.ID_JUGADOR
        JOIN DIM_EQUIPO de ON dtj.ID_EQUIPO = de.ID_EQUIPO
        JOIN DIM_TORNEO dt ON dtj.ID_TORNEO = dt.ID_TORNEO
        WHERE dtj.ID_TORNEO = ?`, [torneoId]);
      return rows;
    } catch (error) {
      throw new Error(`Error obteniendo jugadores por torneo: ${error.message}`);
    }
  }

  async getJugadoresPorEquipo(equipoId, torneoId = null) {
    try {
      let query = `
        SELECT 
          dtj.ID_TORNEO_JUGADOR,
          dj.ID_JUGADOR,
          dj.NOMBRE AS NOMBRE_JUGADOR,
          dt.ID_TORNEO,
          dt.NOMBRE AS NOMBRE_TORNEO
        FROM DIM_TORNEO_JUGADOR dtj
        JOIN DIM_JUGADOR dj ON dtj.ID_JUGADOR = dj.ID_JUGADOR
        JOIN DIM_TORNEO dt ON dtj.ID_TORNEO = dt.ID_TORNEO
        WHERE dtj.ID_EQUIPO = ?`;
      
      const params = [equipoId];
      
      if (torneoId) {
        query += ' AND dtj.ID_TORNEO = ?';
        params.push(torneoId);
      }

      const [rows] = await pool.query(query, params);
      return rows;
    } catch (error) {
      throw new Error(`Error obteniendo jugadores por equipo: ${error.message}`);
    }
  }

  async crearTorneoJugador(data) {
    try {
      const { ID_JUGADOR, ID_EQUIPO, ID_TORNEO, ACTIVO } = data;
      const [result] = await pool.query(
        'INSERT INTO DIM_TORNEO_JUGADOR (ID_JUGADOR, ID_EQUIPO, ID_TORNEO) VALUES (?, ?, ?)',
        [ID_JUGADOR, ID_EQUIPO, ID_TORNEO, ACTIVO]
      );
      return result.insertId;
    } catch (error) {
      throw new Error(`Error creando torneo jugador: ${error.message}`);
    }
  }

  async actualizarTorneoJugador(id, data) {
    try {
      const { ID_JUGADOR, ID_EQUIPO, ID_TORNEO, ACTIVO } = data;
      const [result] = await pool.query(
        'UPDATE DIM_TORNEO_JUGADOR SET ID_JUGADOR = ?, ID_EQUIPO = ?, ID_TORNEO = ? WHERE ID_TORNEO_JUGADOR = ?',
        [ID_JUGADOR, ID_EQUIPO, ID_TORNEO, ACTIVO, id]
      );
      return result.affectedRows;
    } catch (error) {
      throw new Error(`Error actualizando torneo jugador: ${error.message}`);
    }
  }

  // Hechos
  async getEstadisticas() {
    try {
      const [rows] = await pool.query('SELECT * FROM HECHOS_ESTADISTICAS');
      return rows;
    } catch (error) {
      throw new Error(`Error obteniendo estadísticas: ${error.message}`);
    }
  }

  async getGanancias() {
    try {
      const [rows] = await pool.query('SELECT * FROM HECHOS_GANANCIAS');
      return rows;
    } catch (error) {
      throw new Error(`Error obteniendo ganancias: ${error.message}`);
    }
  }

  async getJugadoresPartido() {
    try {
      const [rows] = await pool.query('SELECT * FROM HECHOS_JUGADORES_PARTIDO');
      return rows;
    } catch (error) {
      throw new Error(`Error obteniendo jugadores por partido: ${error.message}`);
    }
  }

  async getModificaciones() {
    try {
      const [rows] = await pool.query('SELECT * FROM HECHOS_MODIFICACIONES');
      return rows;
    } catch (error) {
      throw new Error(`Error obteniendo modificaciones: ${error.message}`);
    }
  }

  async getResultados() {
    try {
      const [rows] = await pool.query('SELECT * FROM HECHOS_RESULTADOS');
      return rows;
    } catch (error) {
      throw new Error(`Error obteniendo resultados: ${error.message}`);
    }
  }

  async crearJugador(data) {
    const connection = await pool.getConnection();
    try {
      console.log('Datos validados para inserción:', {
        NOMBRE: data.NOMBRE,
        FECHA_NACIMIENTO: data.FECHA_NACIMIENTO,
        ID_PAIS: data.ID_PAIS,
        ID_POSICION: data.ID_POSICION
      });
  
      // Insertar jugador
      console.log('Insertando jugador...');
      const [jugadorResult] = await connection.query(
        'INSERT INTO DIM_JUGADOR (NOMBRE, FECHA_NACIMIENTO) VALUES (?, ?)',
        [data.NOMBRE, data.FECHA_NACIMIENTO]
      );
      const idJugador = jugadorResult.insertId;
      console.log('Jugador insertado con ID:', idJugador);
  
      // Verificar que se insertó el jugador
      if (!idJugador) {
        throw new Error('Error al insertar jugador');
      }
  
      // Verificar que existe la posición
      console.log('Verificando posición...');
      const [posicionExists] = await connection.query(
        'SELECT ID_POSICION FROM DIM_POSICION WHERE ID_POSICION = ?',
        [data.ID_POSICION]
      );
      if (!posicionExists.length) {
        throw new Error('La posición seleccionada no existe');
      }
  
      // Insertar relación jugador-posición
      console.log('Insertando relación jugador-posición...');
      await connection.query(
        'INSERT INTO DIM_JUGADOR_POSICION (ID_JUGADOR, ID_POSICION) VALUES (?, ?)',
        [idJugador, data.ID_POSICION]
      );
  
      // Verificar que existe el país
      console.log('Verificando país...');
      const [paisExists] = await connection.query(
        'SELECT ID_PAIS FROM DIM_PAIS WHERE ID_PAIS = ?',
        [data.ID_PAIS]
      );
      if (!paisExists.length) {
        throw new Error('El país seleccionado no existe');
      }
  
      // Insertar relación jugador-país
      console.log('Insertando relación jugador-país...');
      await connection.query(
        'INSERT INTO DIM_JUGADOR_PAIS (ID_JUGADOR, ID_PAIS) VALUES (?, ?)',
        [idJugador, data.ID_PAIS]
      );
  
      await connection.commit();
      console.log('Transacción completada exitosamente');
      return idJugador;
    } catch (error) {
      console.error('Error en servicio:', error);
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

// En statsService.js
async asignarJugadorEquipoTorneo(data) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const [result] = await connection.query(
      'INSERT INTO DIM_TORNEO_JUGADOR (ID_JUGADOR, ID_EQUIPO, ID_TORNEO) VALUES (?, ?, ?)',
      [data.ID_JUGADOR, data.ID_EQUIPO, data.ID_TORNEO]
    );

    await connection.commit();
    return result.insertId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async getTorneoJugadoresConDetalles() {
  try {
    const [rows] = await pool.query(`
      SELECT 
        dtj.ID_TORNEO_JUGADOR,
        dj.NOMBRE as NOMBRE_JUGADOR,
        de.NOMBRE as NOMBRE_EQUIPO,
        dt.NOMBRE as NOMBRE_TORNEO
      FROM DIM_TORNEO_JUGADOR dtj
      INNER JOIN DIM_JUGADOR dj ON dtj.ID_JUGADOR = dj.ID_JUGADOR
      INNER JOIN DIM_EQUIPO de ON dtj.ID_EQUIPO = de.ID_EQUIPO
      INNER JOIN DIM_TORNEO dt ON dtj.ID_TORNEO = dt.ID_TORNEO
      ORDER BY dj.NOMBRE, dt.NOMBRE
    `);
    return rows;
  } catch (error) {
    console.error('Error en consulta:', error);
    throw new Error(`Error obteniendo asignaciones: ${error.message}`);
  }
}

  ///////////////////
  // async asignarJugadorEquipoTorneo(data) {
  //   console.log('Iniciando asignación con datos:', data);
  //   const connection = await pool.getConnection();
  //   try {
  //     await connection.beginTransaction();
   
  //     // Validar datos requeridos
  //     const { ID_JUGADOR, ID_EQUIPO, ID_TORNEO } = data;
  //     if (!ID_JUGADOR || !ID_EQUIPO || !ID_TORNEO) {
  //       throw new Error('Todos los campos son requeridos');
  //     }
   
  //     // Validar que el jugador existe
  //     const [jugador] = await connection.query(
  //       'SELECT ID_JUGADOR FROM DIM_JUGADOR WHERE ID_JUGADOR = ?',
  //       [ID_JUGADOR]
  //     );
  //     if (!jugador.length) {
  //       throw new Error('Jugador no encontrado');
  //     }
   
  //     // Validar que el equipo existe
  //     const [equipo] = await connection.query(
  //       'SELECT ID_EQUIPO FROM DIM_EQUIPO WHERE ID_EQUIPO = ?',
  //       [ID_EQUIPO]
  //     );
  //     if (!equipo.length) {
  //       throw new Error('Equipo no encontrado');
  //     }
   
  //     // Validar que el torneo existe
  //     const [torneo] = await connection.query(
  //       'SELECT ID_TORNEO FROM DIM_TORNEO WHERE ID_TORNEO = ?',
  //       [ID_TORNEO]
  //     );
  //     if (!torneo.length) {
  //       throw new Error('Torneo no encontrado');
  //     }
   
  //     // Validar que no exista la misma asignación
  //     const [existente] = await connection.query(
  //       'SELECT ID_TORNEO_JUGADOR FROM DIM_TORNEO_JUGADOR WHERE ID_JUGADOR = ? AND ID_EQUIPO = ? AND ID_TORNEO = ?',
  //       [ID_JUGADOR, ID_EQUIPO, ID_TORNEO]
  //     );
  //     if (existente.length) {
  //       throw new Error('El jugador ya está asignado a este equipo en este torneo');
  //     }
   
  //     // Insertar asignación
  //     const [result] = await connection.query(
  //       'INSERT INTO DIM_TORNEO_JUGADOR (ID_JUGADOR, ID_EQUIPO, ID_TORNEO) VALUES (?, ?, ?)',
  //       [ID_JUGADOR, ID_EQUIPO, ID_TORNEO]
  //     );
   
  //     await connection.commit();
  //     return result.insertId;
  //   } catch (error) {
  //     await connection.rollback();
  //     throw error;
  //   } finally {
  //     connection.release();
  //   }
  //  }  

}

module.exports = new StatsService();