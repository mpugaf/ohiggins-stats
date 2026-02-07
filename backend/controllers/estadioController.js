// backend/controllers/estadioController.js
console.log('📂 Cargando estadioController con base de datos...');

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

console.log('🔧 Configuración DB para estadios:', {
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

const crearEstadio = async (req, res) => {
  console.log('📝 Creando nuevo estadio:', req.body);
  
  try {
    const { nombre, capacidad, ciudad, fechaInauguracion, superficie } = req.body;

    // Validaciones básicas
    if (!nombre || !capacidad || !ciudad || !fechaInauguracion || !superficie) {
      console.log('❌ Faltan campos obligatorios');
      return res.status(400).json({
        error: 'Todos los campos son obligatorios',
        received: req.body
      });
    }

    // Validar capacidad
    if (isNaN(capacidad) || parseInt(capacidad) <= 0) {
      return res.status(400).json({
        error: 'La capacidad debe ser un número positivo'
      });
    }

    // Verificar si ya existe
    const existeEstadio = await executeQuery(
      'SELECT ID_ESTADIO FROM DIM_ESTADIO WHERE NOMBRE = ?',
      [nombre.toUpperCase()]
    );

    if (existeEstadio.length > 0) {
      return res.status(409).json({
        error: 'Ya existe un estadio con ese nombre'
      });
    }

    // Insertar nuevo estadio
    const resultado = await executeQuery(
      `INSERT INTO DIM_ESTADIO (NOMBRE, CAPACIDAD, CIUDAD, FECHA_INAUGURACION, SUPERFICIE) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        nombre.toUpperCase(),
        parseInt(capacidad),
        ciudad.toUpperCase(),
        fechaInauguracion,
        superficie.toUpperCase()
      ]
    );

    console.log('✅ Estadio creado exitosamente, ID:', resultado.insertId);

    res.status(201).json({
      message: 'Estadio creado exitosamente',
      estadio: {
        id: resultado.insertId,
        nombre: nombre.toUpperCase(),
        capacidad: parseInt(capacidad),
        ciudad: ciudad.toUpperCase(),
        fechaInauguracion,
        superficie: superficie.toUpperCase()
      }
    });

  } catch (error) {
    console.error('❌ Error al crear estadio:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      detalle: error.message
    });
  }
};

const obtenerEstadios = async (req, res) => {
  console.log('📋 Obteniendo lista de estadios desde BD...');
  
  try {
    const estadios = await executeQuery(
      'SELECT * FROM DIM_ESTADIO ORDER BY NOMBRE'
    );

    console.log(`✅ Se encontraron ${estadios.length} estadios en la BD`);
    
    // Log de cada estadio para debugging
    estadios.forEach(estadio => {
      console.log(`📍 Estadio: ${estadio.NOMBRE} - ${estadio.CIUDAD} (${estadio.CAPACIDAD})`);
    });
    
    res.json(estadios);
    
  } catch (error) {
    console.error('❌ Error al obtener estadios:', error);
    res.status(500).json({
      error: 'Error al obtener estadios',
      detalle: error.message
    });
  }
};

const obtenerEstadioPorId = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 Buscando estadio con ID:', id);

    const estadio = await executeQuery(
      'SELECT * FROM DIM_ESTADIO WHERE ID_ESTADIO = ?',
      [id]
    );

    if (estadio.length === 0) {
      return res.status(404).json({
        error: 'Estadio no encontrado'
      });
    }

    res.json(estadio[0]);
    
  } catch (error) {
    console.error('❌ Error al obtener estadio:', error);
    res.status(500).json({
      error: 'Error al obtener estadio',
      detalle: error.message
    });
  }
};

const actualizarEstadio = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, capacidad, ciudad, fechaInauguracion, superficie } = req.body;
    
    console.log('📝 Actualizando estadio ID:', id);

    // Validaciones
    if (!nombre || !capacidad || !ciudad || !fechaInauguracion || !superficie) {
      return res.status(400).json({
        error: 'Todos los campos son obligatorios'
      });
    }

    if (isNaN(capacidad) || parseInt(capacidad) <= 0) {
      return res.status(400).json({
        error: 'La capacidad debe ser un número positivo'
      });
    }

    // Verificar si existe
    const estadioExiste = await executeQuery(
      'SELECT ID_ESTADIO FROM DIM_ESTADIO WHERE ID_ESTADIO = ?',
      [id]
    );

    if (estadioExiste.length === 0) {
      return res.status(404).json({
        error: 'Estadio no encontrado'
      });
    }

    // Verificar nombre duplicado
    const nombreDuplicado = await executeQuery(
      'SELECT ID_ESTADIO FROM DIM_ESTADIO WHERE NOMBRE = ? AND ID_ESTADIO != ?',
      [nombre.toUpperCase(), id]
    );

    if (nombreDuplicado.length > 0) {
      return res.status(409).json({
        error: 'Ya existe otro estadio con ese nombre'
      });
    }

    // Actualizar
    await executeQuery(
      `UPDATE DIM_ESTADIO 
       SET NOMBRE = ?, CAPACIDAD = ?, CIUDAD = ?, FECHA_INAUGURACION = ?, SUPERFICIE = ?
       WHERE ID_ESTADIO = ?`,
      [
        nombre.toUpperCase(),
        parseInt(capacidad),
        ciudad.toUpperCase(),
        fechaInauguracion,
        superficie.toUpperCase(),
        id
      ]
    );

    res.json({
      message: 'Estadio actualizado exitosamente',
      estadio: {
        id: parseInt(id),
        nombre: nombre.toUpperCase(),
        capacidad: parseInt(capacidad),
        ciudad: ciudad.toUpperCase(),
        fechaInauguracion,
        superficie: superficie.toUpperCase()
      }
    });

  } catch (error) {
    console.error('❌ Error al actualizar estadio:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      detalle: error.message
    });
  }
};

const eliminarEstadio = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Eliminando estadio ID:', id);

    // Verificar si existe
    const estadioExiste = await executeQuery(
      'SELECT ID_ESTADIO, NOMBRE FROM DIM_ESTADIO WHERE ID_ESTADIO = ?',
      [id]
    );

    if (estadioExiste.length === 0) {
      return res.status(404).json({
        error: 'Estadio no encontrado'
      });
    }

    // Eliminar
    await executeQuery(
      'DELETE FROM DIM_ESTADIO WHERE ID_ESTADIO = ?',
      [id]
    );

    res.json({
      message: 'Estadio eliminado exitosamente'
    });

  } catch (error) {
    console.error('❌ Error al eliminar estadio:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      detalle: error.message
    });
  }
};

console.log('✅ Todas las funciones de estadioController con BD definidas');

module.exports = {
  crearEstadio,
  obtenerEstadios,
  obtenerEstadioPorId,
  actualizarEstadio,
  eliminarEstadio
};