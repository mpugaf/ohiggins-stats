// backend/controllers/equipoController.js
console.log('📂 Cargando equipoController con base de datos...');

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

console.log('🔧 Configuración DB para equipos:', {
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

const crearEquipo = async (req, res) => {
  console.log('📝 Creando nuevo equipo:', req.body);
  
  try {
    const { nombre, apodo, ciudad, fechaFundacion } = req.body;

    // Validaciones básicas
    if (!nombre || !ciudad) {
      console.log('❌ Faltan campos obligatorios');
      return res.status(400).json({
        error: 'El nombre y la ciudad son obligatorios',
        received: req.body
      });
    }

    // Validar fecha de fundación si se proporciona
    if (fechaFundacion) {
      const fecha = new Date(fechaFundacion);
      const fechaActual = new Date();
      if (fecha > fechaActual) {
        return res.status(400).json({
          error: 'La fecha de fundación no puede ser futura'
        });
      }
    }

    // Verificar si ya existe un equipo con el mismo nombre
    console.log('🔍 Verificando si existe equipo con nombre:', nombre);
    const existeEquipo = await executeQuery(
      'SELECT ID_EQUIPO FROM DIM_EQUIPO WHERE NOMBRE = ?',
      [nombre.toUpperCase()]
    );

    if (existeEquipo.length > 0) {
      console.log('❌ Equipo ya existe:', nombre);
      return res.status(409).json({
        error: 'Ya existe un equipo con ese nombre'
      });
    }

    // Insertar nuevo equipo
    console.log('➕ Insertando nuevo equipo');
    const resultado = await executeQuery(
      `INSERT INTO DIM_EQUIPO (TEAM_ID_FBR, NOMBRE, APODO, CIUDAD, FECHA_FUNDACION) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        `custom_${Date.now()}`, // Generar ID temporal único
        nombre.toUpperCase(),
        apodo ? apodo.toUpperCase() : null,
        ciudad.toUpperCase(),
        fechaFundacion || null
      ]
    );

    console.log('✅ Equipo creado exitosamente, ID:', resultado.insertId);

    res.status(201).json({
      message: 'Equipo creado exitosamente',
      equipo: {
        id: resultado.insertId,
        nombre: nombre.toUpperCase(),
        apodo: apodo ? apodo.toUpperCase() : null,
        ciudad: ciudad.toUpperCase(),
        fechaFundacion: fechaFundacion || null
      }
    });

  } catch (error) {
    console.error('❌ Error al crear equipo:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      detalle: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

const obtenerEquipos = async (req, res) => {
  console.log('📋 Obteniendo lista de equipos desde BD...');
  
  try {
    const equipos = await executeQuery(
      'SELECT * FROM DIM_EQUIPO ORDER BY NOMBRE'
    );

    console.log(`✅ Se encontraron ${equipos.length} equipos en la BD`);
    
    // Log de cada equipo para debugging
    equipos.forEach(equipo => {
      console.log(`⚽ Equipo: ${equipo.NOMBRE} - ${equipo.CIUDAD} (ID: ${equipo.ID_EQUIPO})`);
    });
    
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

const obtenerEquipoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 Buscando equipo con ID:', id);

    const equipo = await executeQuery(
      'SELECT * FROM DIM_EQUIPO WHERE ID_EQUIPO = ?',
      [id]
    );

    if (equipo.length === 0) {
      console.log('❌ Equipo no encontrado:', id);
      return res.status(404).json({
        error: 'Equipo no encontrado'
      });
    }

    console.log('✅ Equipo encontrado:', equipo[0].NOMBRE);
    res.json(equipo[0]);
    
  } catch (error) {
    console.error('❌ Error al obtener equipo:', error);
    res.status(500).json({
      error: 'Error al obtener equipo',
      detalle: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

const actualizarEquipo = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apodo, ciudad, fechaFundacion } = req.body;
    
    console.log('📝 Actualizando equipo ID:', id, 'con datos:', req.body);

    // Validaciones básicas
    if (!nombre || !ciudad) {
      return res.status(400).json({
        error: 'El nombre y la ciudad son obligatorios'
      });
    }

    // Validar fecha de fundación si se proporciona
    if (fechaFundacion) {
      const fecha = new Date(fechaFundacion);
      const fechaActual = new Date();
      if (fecha > fechaActual) {
        return res.status(400).json({
          error: 'La fecha de fundación no puede ser futura'
        });
      }
    }

    // Verificar si el equipo existe
    const equipoExiste = await executeQuery(
      'SELECT ID_EQUIPO FROM DIM_EQUIPO WHERE ID_EQUIPO = ?',
      [id]
    );

    if (equipoExiste.length === 0) {
      console.log('❌ Equipo no encontrado para actualizar:', id);
      return res.status(404).json({
        error: 'Equipo no encontrado'
      });
    }

    // Verificar si ya existe otro equipo con el mismo nombre
    const nombreDuplicado = await executeQuery(
      'SELECT ID_EQUIPO FROM DIM_EQUIPO WHERE NOMBRE = ? AND ID_EQUIPO != ?',
      [nombre.toUpperCase(), id]
    );

    if (nombreDuplicado.length > 0) {
      console.log('❌ Nombre duplicado para actualización:', nombre);
      return res.status(409).json({
        error: 'Ya existe otro equipo con ese nombre'
      });
    }

    // Actualizar equipo
    await executeQuery(
      `UPDATE DIM_EQUIPO 
       SET NOMBRE = ?, APODO = ?, CIUDAD = ?, FECHA_FUNDACION = ?
       WHERE ID_EQUIPO = ?`,
      [
        nombre.toUpperCase(),
        apodo ? apodo.toUpperCase() : null,
        ciudad.toUpperCase(),
        fechaFundacion || null,
        id
      ]
    );

    console.log('✅ Equipo actualizado exitosamente:', id);

    res.json({
      message: 'Equipo actualizado exitosamente',
      equipo: {
        id: parseInt(id),
        nombre: nombre.toUpperCase(),
        apodo: apodo ? apodo.toUpperCase() : null,
        ciudad: ciudad.toUpperCase(),
        fechaFundacion: fechaFundacion || null
      }
    });

  } catch (error) {
    console.error('❌ Error al actualizar equipo:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      detalle: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

const eliminarEquipo = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Eliminando equipo ID:', id);

    // Verificar si el equipo existe
    const equipoExiste = await executeQuery(
      'SELECT ID_EQUIPO, NOMBRE FROM DIM_EQUIPO WHERE ID_EQUIPO = ?',
      [id]
    );

    if (equipoExiste.length === 0) {
      console.log('❌ Equipo no encontrado para eliminar:', id);
      return res.status(404).json({
        error: 'Equipo no encontrado'
      });
    }

    // Verificar si el equipo está siendo usado en algún partido (local o visitante)
    const equipoEnUso = await executeQuery(
      'SELECT COUNT(*) as total FROM HECHOS_RESULTADOS WHERE ID_EQUIPO_LOCAL = ? OR ID_EQUIPO_VISITA = ?',
      [id, id]
    );

    if (equipoEnUso[0].total > 0) {
      console.log('❌ Equipo en uso, no se puede eliminar:', id);
      return res.status(409).json({
        error: 'No se puede eliminar el equipo porque tiene partidos registrados'
      });
    }

    // Eliminar equipo directamente (ya que no hay campo ACTIVO)
    await executeQuery(
      'DELETE FROM DIM_EQUIPO WHERE ID_EQUIPO = ?',
      [id]
    );

    console.log('✅ Equipo eliminado:', equipoExiste[0].NOMBRE);

    res.json({
      message: 'Equipo eliminado exitosamente'
    });

  } catch (error) {
    console.error('❌ Error al eliminar equipo:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      detalle: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

console.log('✅ Todas las funciones de equipoController con BD definidas');

module.exports = {
  crearEquipo,
  obtenerEquipos,
  obtenerEquipoPorId,
  actualizarEquipo,
  eliminarEquipo
};