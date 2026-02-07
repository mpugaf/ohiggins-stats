// scripts/testConnection.js
require('dotenv').config();
const { testConnection } = require('../config/database');

async function main() {
  try {
    const isConnected = await testConnection();
    if (isConnected) {
      console.log('✅ Conexión exitosa a la base de datos');
    } else {
      console.log('❌ No se pudo conectar a la base de datos');
    }
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit();
}

main();