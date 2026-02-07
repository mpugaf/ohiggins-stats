// backend/test-env.js - Script para probar variables de entorno
console.log('🔍 Probando carga de variables de entorno...');

require('dotenv').config();

console.log('📁 Ubicación del archivo .env:', process.cwd() + '/.env');
console.log('');

console.log('🔧 Variables de entorno cargadas:');
console.log('DB_HOST:', process.env.DB_HOST || 'NO CONFIGURADO');
console.log('DB_USER:', process.env.DB_USER || 'NO CONFIGURADO');
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***CONFIGURADO***' : 'NO CONFIGURADO');
console.log('DB_NAME:', process.env.DB_NAME || 'NO CONFIGURADO');
console.log('DB_PORT:', process.env.DB_PORT || 'NO CONFIGURADO');
console.log('');

// Probar conexión básica
const mysql = require('mysql2/promise');

const testConnection = async () => {
  const config = {
    host: process.env.DB_HOST || '192.168.100.16',
    user: process.env.DB_USER || 'mpuga',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'MP_DATA_DEV',
    port: process.env.DB_PORT || 3306
  };
  
  console.log('🔗 Probando conexión con:', {
    ...config,
    password: config.password ? '***' : 'VACÍO'
  });
  
  try {
    const connection = await mysql.createConnection(config);
    console.log('✅ Conexión exitosa!');
    
    const [results] = await connection.execute('SELECT COUNT(*) as total FROM DIM_ESTADIO');
    console.log(`📊 Estadios en la tabla: ${results[0].total}`);
    
    await connection.end();
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
  }
};

testConnection();