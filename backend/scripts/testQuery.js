// backend/scripts/testQuery.js
// Script para probar la consulta exacta del endpoint

require('dotenv').config();
const { executeQuery } = require('../config/database');

async function testQuery() {
  console.log('🧪 Probando consulta exacta del endpoint getJugadoresByTorneoEquipo...\n');

  try {
    // Usar el torneo 11 y equipo 13 (O'Higgins) que sabemos que tiene datos
    const torneoId = 11;
    const equipoId = 13;

    console.log(`📋 Parámetros: Torneo=${torneoId}, Equipo=${equipoId} (O'Higgins)\n`);

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
        GROUP_CONCAT(DISTINCT CONCAT(pos.CODIGO_POSICION, ':', pos.NOMBRE) ORDER BY jpos.ORDEN_PREFERENCIA SEPARATOR ',') as posiciones
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
      ORDER BY tj.NUMERO_CAMISETA ASC, j.NOMBRE_COMPLETO ASC
    `;

    console.log('🔍 Ejecutando consulta...\n');
    const jugadores = await executeQuery(query, [torneoId, equipoId]);

    console.log(`✅ Resultados: ${jugadores.length} jugadores encontrados\n`);

    if (jugadores.length > 0) {
      console.log('📊 Primeros 5 jugadores:');
      console.log('═'.repeat(80));
      jugadores.slice(0, 5).forEach((j, idx) => {
        console.log(`\n${idx + 1}. ${j.NOMBRE_COMPLETO}`);
        console.log(`   ID: ${j.ID_JUGADOR}`);
        console.log(`   Número: ${j.NUMERO_CAMISETA || 'Sin número'}`);
        console.log(`   Posiciones: ${j.posiciones || 'Sin posiciones'}`);
        console.log(`   Nacionalidades: ${j.nacionalidades || 'Sin nacionalidades'}`);
        console.log(`   Equipo: ${j.nombre_equipo}`);
      });

      console.log('\n\n💡 La consulta funciona correctamente.');
      console.log('📌 Datos de ejemplo para el frontend:');
      console.log(JSON.stringify(jugadores[0], null, 2));
    } else {
      console.log('❌ No se encontraron jugadores');
      console.log('🔍 Verificando si existe el registro en DIM_TORNEO_JUGADOR...');

      const checkQuery = 'SELECT * FROM DIM_TORNEO_JUGADOR WHERE ID_TORNEO = ? AND ID_EQUIPO = ? LIMIT 1';
      const check = await executeQuery(checkQuery, [torneoId, equipoId]);
      console.log('Resultado:', check);
    }

  } catch (error) {
    console.error('❌ Error al ejecutar consulta:', error);
    console.error('Mensaje:', error.message);
    console.error('Stack:', error.stack);
  }

  process.exit(0);
}

testQuery();
