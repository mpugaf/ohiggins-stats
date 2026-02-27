const { executeQuery } = require('../config/database');

/**
 * Obtener todos los programas activos
 * GET /api/programas
 */
exports.obtenerProgramas = async (req, res) => {
  try {
    const programas = await executeQuery(
      'SELECT id_programa, nombre, descripcion, tipo, url, logo_url FROM programas WHERE activo = 1 ORDER BY nombre ASC'
    );
    res.json({ data: programas, count: programas.length });
  } catch (error) {
    console.error('Error al obtener programas:', error);
    res.status(500).json({ error: 'Error al obtener programas' });
  }
};

/**
 * Obtener programa por ID
 * GET /api/programas/:id
 */
exports.obtenerProgramaPorId = async (req, res) => {
  const { id } = req.params;

  try {
    const [programa] = await executeQuery(
      'SELECT * FROM programas WHERE id_programa = ?',
      [id]
    );

    if (!programa) {
      return res.status(404).json({ error: 'Programa no encontrado' });
    }

    res.json({ data: programa });
  } catch (error) {
    console.error('Error al obtener programa:', error);
    res.status(500).json({ error: 'Error al obtener programa' });
  }
};

/**
 * Crear nuevo programa (ADMIN)
 * POST /api/programas
 */
exports.crearPrograma = async (req, res) => {
  const { nombre, descripcion, tipo, url, logo_url } = req.body;

  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ error: 'El nombre del programa es obligatorio' });
  }

  try {
    // Verificar duplicado
    const existing = await executeQuery(
      'SELECT id_programa FROM programas WHERE nombre = ?',
      [nombre.trim()]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Ya existe un programa con ese nombre' });
    }

    // Crear programa
    const result = await executeQuery(
      'INSERT INTO programas (nombre, descripcion, tipo, url, logo_url, activo) VALUES (?, ?, ?, ?, ?, 1)',
      [nombre.trim(), descripcion || null, tipo || 'podcast', url || null, logo_url || null]
    );

    res.status(201).json({
      message: 'Programa creado exitosamente',
      id_programa: result.insertId,
      data: { nombre, descripcion, tipo, url, logo_url }
    });
  } catch (error) {
    console.error('Error al crear programa:', error);
    res.status(500).json({ error: 'Error al crear programa' });
  }
};

/**
 * Actualizar programa (ADMIN)
 * PUT /api/programas/:id
 */
exports.actualizarPrograma = async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, tipo, url, logo_url, activo } = req.body;

  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ error: 'El nombre del programa es obligatorio' });
  }

  try {
    // Verificar que existe
    const [existing] = await executeQuery(
      'SELECT id_programa FROM programas WHERE id_programa = ?',
      [id]
    );

    if (!existing) {
      return res.status(404).json({ error: 'Programa no encontrado' });
    }

    // Actualizar
    await executeQuery(
      'UPDATE programas SET nombre = ?, descripcion = ?, tipo = ?, url = ?, logo_url = ?, activo = ? WHERE id_programa = ?',
      [nombre.trim(), descripcion || null, tipo || 'podcast', url || null, logo_url || null, activo !== undefined ? activo : 1, id]
    );

    res.json({ message: 'Programa actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar programa:', error);
    res.status(500).json({ error: 'Error al actualizar programa' });
  }
};

/**
 * Eliminar programa (ADMIN)
 * DELETE /api/programas/:id
 */
exports.eliminarPrograma = async (req, res) => {
  const { id } = req.params;

  // No permitir eliminar "Sin Programa" (id=1)
  if (id == 1) {
    return res.status(400).json({ error: 'No se puede eliminar el programa "Sin Programa"' });
  }

  try {
    // Verificar que existe
    const [existing] = await executeQuery(
      'SELECT id_programa FROM programas WHERE id_programa = ?',
      [id]
    );

    if (!existing) {
      return res.status(404).json({ error: 'Programa no encontrado' });
    }

    // Eliminar (ON DELETE SET NULL manejará los usuarios asociados)
    await executeQuery('DELETE FROM programas WHERE id_programa = ?', [id]);

    res.json({ message: 'Programa eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar programa:', error);
    res.status(500).json({ error: 'Error al eliminar programa' });
  }
};

/**
 * Obtener usuarios por programa
 * GET /api/programas/:id/usuarios
 */
exports.obtenerUsuariosPorPrograma = async (req, res) => {
  const { id } = req.params;

  try {
    const usuarios = await executeQuery(
      `SELECT u.id_usuario, u.username, u.nombre_completo,
              COUNT(a.id_apuesta) AS total_apuestas,
              COALESCE(SUM(hp.puntos_ganados), 0) AS total_puntos
       FROM usuarios u
       LEFT JOIN apuestas_usuarios a ON u.id_usuario = a.id_usuario
       LEFT JOIN historial_puntos hp ON u.id_usuario = hp.id_usuario
       WHERE u.id_programa = ? AND u.activo = 1
       GROUP BY u.id_usuario
       ORDER BY total_puntos DESC`,
      [id]
    );

    res.json({ data: usuarios, count: usuarios.length });
  } catch (error) {
    console.error('Error al obtener usuarios por programa:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};
