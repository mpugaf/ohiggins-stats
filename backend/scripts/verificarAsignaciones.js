// backend/scripts/verificarAsignaciones.js
// Script para verificar asignaciones de jugadores en torneos

require('dotenv').config();
const { executeQuery } = require('../config/database');

async function verificarAsignaciones() {
  console.log('🔍 Verificando asignaciones de jugadores en torneos...\n');

  try {
    // 1. Contar total de asignaciones
    const totalQuery = 'SELECT COUNT(*) as total FROM DIM_TORNEO_JUGADOR';
    const totalResult = await executeQuery(totalQuery);
    console.log(`📊 Total de asignaciones en DIM_TORNEO_JUGADOR: ${totalResult[0].total}\n`);

    if (totalResult[0].total === 0) {
      console.log('❌ No hay asignaciones en DIM_TORNEO_JUGADOR');
      console.log('💡 Necesitas asignar jugadores a torneos usando el módulo de asignaciones\n');
      process.exit(0);
    }

    // 2. Listar torneos con asignaciones
    const torneosQuery = `
      SELECT
        t.ID_TORNEO,
        t.NOMBRE as TORNEO,
        t.TEMPORADA,
        COUNT(DISTINCT tj.ID_EQUIPO) as total_equipos,
        COUNT(tj.ID_JUGADOR) as total_jugadores
      FROM DIM_TORNEO t
      INNER JOIN DIM_TORNEO_JUGADOR tj ON t.ID_TORNEO = tj.ID_TORNEO
      GROUP BY t.ID_TORNEO, t.NOMBRE, t.TEMPORADA
      ORDER BY t.TEMPORADA DESC
    `;
    const torneos = await executeQuery(torneosQuery);

    console.log('🏆 Torneos con asignaciones:');
    console.log('═'.repeat(80));
    torneos.forEach(t => {
      console.log(`ID: ${t.ID_TORNEO} | ${t.TORNEO} (${t.TEMPORADA}) | ${t.total_equipos} equipos | ${t.total_jugadores} jugadores`);
    });
    console.log('');

    // 3. Para cada torneo, listar equipos con jugadores
    for (const torneo of torneos) {
      console.log(`\n📋 Detalle de "${torneo.TORNEO}" (ID: ${torneo.ID_TORNEO}):`);
      console.log('─'.repeat(80));

      const equiposQuery = `
        SELECT
          e.ID_EQUIPO,
          e.NOMBRE as EQUIPO,
          COUNT(tj.ID_JUGADOR) as total_jugadores
        FROM DIM_EQUIPO e
        INNER JOIN DIM_TORNEO_JUGADOR tj ON e.ID_EQUIPO = tj.ID_EQUIPO
        WHERE tj.ID_TORNEO = ?
        GROUP BY e.ID_EQUIPO, e.NOMBRE
        ORDER BY e.NOMBRE
      `;
      const equipos = await executeQuery(equiposQuery, [torneo.ID_TORNEO]);

      equipos.forEach(eq => {
        console.log(`  ⚽ ${eq.EQUIPO} (ID: ${eq.ID_EQUIPO}) - ${eq.total_jugadores} jugadores`);
      });
    }

    // 4. Ejemplo de jugadores de un equipo en un torneo
    if (torneos.length > 0) {
      const primerTorneo = torneos[0];
      const equiposDelTorneo = await executeQuery(
        `SELECT DISTINCT e.ID_EQUIPO, e.NOMBRE
         FROM DIM_EQUIPO e
         INNER JOIN DIM_TORNEO_JUGADOR tj ON e.ID_EQUIPO = tj.ID_EQUIPO
         WHERE tj.ID_TORNEO = ?
         LIMIT 1`,
        [primerTorneo.ID_TORNEO]
      );

      if (equiposDelTorneo.length > 0) {
        const primerEquipo = equiposDelTorneo[0];

        console.log(`\n\n👥 Ejemplo de jugadores de "${primerEquipo.NOMBRE}" en "${primerTorneo.TORNEO}":`);
        console.log('═'.repeat(80));

        const jugadoresQuery = `
          SELECT
            j.ID_JUGADOR,
            j.NOMBRE_COMPLETO,
            tj.NUMERO_CAMISETA,
            GROUP_CONCAT(DISTINCT pos.CODIGO_POSICION) as posiciones
          FROM DIM_TORNEO_JUGADOR tj
          INNER JOIN DIM_JUGADOR j ON tj.ID_JUGADOR = j.ID_JUGADOR
          LEFT JOIN DIM_JUGADOR_POSICION jpos ON j.ID_JUGADOR = jpos.ID_JUGADOR
          LEFT JOIN DIM_POSICION pos ON jpos.ID_POSICION = pos.ID_POSICION
          WHERE tj.ID_TORNEO = ? AND tj.ID_EQUIPO = ?
          GROUP BY j.ID_JUGADOR, j.NOMBRE_COMPLETO, tj.NUMERO_CAMISETA
          ORDER BY tj.NUMERO_CAMISETA ASC
          LIMIT 10
        `;
        const jugadores = await executeQuery(jugadoresQuery, [primerTorneo.ID_TORNEO, primerEquipo.ID_EQUIPO]);

        jugadores.forEach(jug => {
          const num = jug.NUMERO_CAMISETA || '-';
          const pos = jug.posiciones || 'Sin posición';
          console.log(`  #${num.toString().padStart(2, ' ')} | ${jug.NOMBRE_COMPLETO} | ${pos}`);
        });

        console.log(`\n💡 Puedes consultar estos jugadores usando:`);
        console.log(`   Torneo ID: ${primerTorneo.ID_TORNEO}`);
        console.log(`   Equipo ID: ${primerEquipo.ID_EQUIPO}`);
      }
    }

    console.log('\n✅ Verificación completada\n');

  } catch (error) {
    console.error('❌ Error al verificar asignaciones:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Ejecutar
verificarAsignaciones();
