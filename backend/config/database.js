// backend/config/database.js
const mysql = require('mysql2');

// Configuración de la conexión a la base de datos
const dbConfig = {
  host: process.env.DB_HOST || '192.168.100.16',
  user: process.env.DB_USER || 'mpuga',
  password: process.env.DB_PASSWORD || '123qweasd',
  database: process.env.DB_NAME || 'MP_DATA_DEV',
  port: process.env.DB_PORT || 3306,
  connectionLimit: 10,
  queueLimit: 0
};

console.log('🔧 Configuración de base de datos:', {
  host: dbConfig.host,
  user: dbConfig.user,
  database: dbConfig.database,
  port: dbConfig.port
});

// Crear pool de conexiones
const pool = mysql.createPool(dbConfig);

// Función para probar la conexión
const testConnection = () => {
  return new Promise((resolve, reject) => {
    pool.getConnection((err, connection) => {
      if (err) {
        console.error('❌ Error conectando a la base de datos:', err.message);
        reject(err);
        return;
      }
      
      console.log('✅ Pool de conexiones creado exitosamente');
      
      // Probar una consulta simple
      connection.query('SELECT 1 as test', (queryErr, results) => {
        connection.release();
        
        if (queryErr) {
          console.error('❌ Error en consulta de prueba:', queryErr.message);
          reject(queryErr);
          return;
        }
        
        console.log('✅ Consulta de prueba exitosa:', results[0]);
        resolve(true);
      });
    });
  });
};

// Función helper para ejecutar consultas con promesas
const executeQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    pool.execute(query, params, (err, results) => {
      if (err) {
        console.error('❌ Error en consulta:', err.message);
        console.error('📝 Query:', query);
        console.error('📝 Params:', params);
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

// Probar conexión al cargar el módulo
testConnection().catch(err => {
  console.error('⚠️ Fallo en conexión inicial a la base de datos');
});

module.exports = {
  pool,
  executeQuery,
  testConnection
};