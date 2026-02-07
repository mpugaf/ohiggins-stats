/**
 * Controlador para manejar las sustituciones de jugadores
 * Se integra con la estructura existente de la aplicación
 */

// Obtener todos los partidos
exports.getPartidos = async (req, res) => {
    try {
      // Consulta para obtener los partidos con sus equipos
      const query = `
SELECT hr.ID_PARTIDO, e1.NOMBRE as EQUIPO_LOCAL, e2.NOMBRE as EQUIPO_VISITANTE, hr.FECHA_PARTIDO 
FROM HECHOS_RESULTADOS hr JOIN DIM_EQUIPO e1 ON hr.ID_EQUIPO_LOCAL = e1.ID_EQUIPO 
JOIN DIM_EQUIPO e2 ON hr.ID_EQUIPO_VISITA = e2.ID_EQUIPO ORDER BY hr.FECHA_PARTIDO DESC
      `;
      
      // Se asume una conexión pool similar a otros controladores
      const db = req.app.locals.db;
      const [partidos] = await db.query(query);
      
      res.json(partidos);
    } catch (error) {
      console.error('Error al obtener partidos:', error);
      res.status(500).json({ error: 'Error al obtener partidos' });
    }
  };
  
  // Obtener equipos de un partido específico
  exports.getEquiposDelPartido = async (req, res) => {
    try {
      const { partidoId } = req.params;
      
      const query = `
SELECT DISTINCT e.ID_EQUIPO as ID, e.NOMBRE FROM DIM_EQUIPO e JOIN HECHOS_RESULTADOS hr ON (hr.ID_EQUIPO_LOCAL = e.ID_EQUIPO OR hr.ID_EQUIPO_VISITA = e.ID_EQUIPO) 
WHERE e.ID_EQUIPO IN
 ( SELECT ID_EQUIPO_LOCAL FROM HECHOS_RESULTADOS WHERE ID_PARTIDO = ? UNION SELECT ID_EQUIPO_VISITA FROM HECHOS_RESULTADOS WHERE ID_PARTIDO = ? )
      `;
      
      const db = req.app.locals.db;
      const [equipos] = await db.query(query, [partidoId]);
      
      res.json(equipos);
    } catch (error) {
      console.error('Error al obtener equipos del partido:', error);
      res.status(500).json({ error: 'Error al obtener equipos' });
    }
  };
  
  // Obtener jugadores de un equipo en un partido específico
  exports.getJugadoresDelEquipo = async (req, res) => {
    try {
      const { partidoId, equipoId } = req.params;
      
      const query = `
SELECT 
          j.ID_JUGADOR as ID, 
          j.NOMBRE
        FROM DIM_JUGADOR j
        JOIN DIM_TORNEO_JUGADOR tj ON j.ID_JUGADOR = tj.ID_JUGADOR
        JOIN HECHOS_RESULTADOS hr ON hr.ID_TORNEO = tj.ID_TORNEO
        WHERE hr.ID_PARTIDO = ?;
      `;
      
      const db = req.app.locals.db;
      const [jugadores] = await db.query(query, [partidoId, equipoId]);
      
      res.json(jugadores);
    } catch (error) {
      console.error('Error al obtener jugadores:', error);
      res.status(500).json({ error: 'Error al obtener jugadores' });
    }
  };
  
  // Registrar una sustitución
  exports.registrarSustitucion = async (req, res) => {
    const db = req.app.locals.db;
    const conn = await db.getConnection();
    
    try {
      await conn.beginTransaction();
      
      const { 
        partido_id, 
        equipo_id, 
        jugador_entra_id, 
        jugador_sale_id, 
        minuto 
      } = req.body;
      
      // Validar que ambos jugadores pertenecen al mismo equipo y torneo
      const validacionQuery = `
        SELECT COUNT(*) as count
        FROM DIM_TORNEO_JUGADOR tj1
        JOIN DIM_TORNEO_JUGADOR tj2 ON tj1.ID_EQUIPO = tj2.ID_EQUIPO AND tj1.ID_TORNEO = tj2.ID_TORNEO
        JOIN HECHOS_RESULTADOS hr ON hr.ID_TORNEO = tj1.ID_TORNEO
        WHERE hr.ID = ?
        AND tj1.ID_JUGADOR = ?
        AND tj2.ID_JUGADOR = ?
        AND tj1.ID_EQUIPO = ?
      `;
      
      const [validacion] = await conn.query(validacionQuery, [
        partido_id, 
        jugador_entra_id, 
        jugador_sale_id,
        equipo_id
      ]);
      
      if (validacion[0].count === 0) {
        await conn.rollback();
        return res.status(400).json({ 
          error: 'Los jugadores deben pertenecer al mismo equipo y torneo' 
        });
      }
      
      // Registrar la sustitución en HECHOS_MODIFICACIONES
      const query = `
        INSERT INTO HECHOS_MODIFICACIONES (
          ID_PARTIDO, 
          ID_EQUIPO, 
          ID_JUGADOR_ENTRA, 
          ID_JUGADOR_SALE, 
          MINUTO, 
          TIPO_MODIFICACION
        ) VALUES (?, ?, ?, ?, ?, 'SUSTITUCION')
      `;
      
      await conn.query(query, [
        partido_id,
        equipo_id,
        jugador_entra_id,
        jugador_sale_id,
        minuto
      ]);
      
      await conn.commit();
      res.status(201).json({ mensaje: 'Sustitución registrada correctamente' });
    } catch (error) {
      await conn.rollback();
      console.error('Error al registrar sustitución:', error);
      res.status(500).json({ error: 'Error al registrar sustitución' });
    } finally {
      conn.release();
    }
  };