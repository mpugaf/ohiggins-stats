// backend/controllers/tokensInvitacionController.js
console.log('📂 Cargando tokensInvitacionController...');

require('dotenv').config();
const mysql = require('mysql2/promise');
const crypto = require('crypto');

// Configuración de base de datos
const dbConfig = {
  host: process.env.DB_HOST || '192.168.100.16',
  user: process.env.DB_USER || 'mpuga',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'MP_DATA_DEV',
  port: process.env.DB_PORT || 3306
};

console.log('🔧 Configuración DB para tokens:', {
  host: dbConfig.host,
  user: dbConfig.user,
  database: dbConfig.database,
  port: dbConfig.port
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

// Generar token único
const generarToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Obtener la URL del frontend apropiada según el origen de la request
const getFrontendUrl = (req) => {
  const allowedUrls = (process.env.FRONTEND_URL || 'http://192.168.100.16:3001')
    .split(',')
    .map(u => u.trim());

  const origin = req.headers.origin || req.headers.referer;
  if (origin) {
    const match = allowedUrls.find(url => origin.startsWith(url));
    if (match) return match;
  }

  return allowedUrls[0];
};

// Generar nuevo token de invitación (solo admin)
const crearTokenInvitacion = async (req, res) => {
  try {
    const adminId = req.user.id_usuario;
    console.log(`🎟️ Admin ${adminId} generando token de invitación...`);

    // Generar token único
    const token = generarToken();

    // Fecha de expiración: 30 días desde ahora
    const fechaExpiracion = new Date();
    fechaExpiracion.setDate(fechaExpiracion.getDate() + 30);

    // Insertar token en la base de datos
    await executeQuery(
      `INSERT INTO tokens_invitacion (token, creado_por, fecha_expiracion)
       VALUES (?, ?, ?)`,
      [token, adminId, fechaExpiracion]
    );

    console.log(`✅ Token creado exitosamente: ${token.substring(0, 10)}...`);

    // Construir URL completa del link de invitación usando el origen de la request
    const frontendUrl = getFrontendUrl(req);
    const invitationLink = `${frontendUrl}/register?token=${token}`;

    res.status(201).json({
      message: 'Token de invitación creado exitosamente',
      token,
      invitationLink,
      fechaExpiracion
    });

  } catch (error) {
    console.error('❌ Error al crear token de invitación:', error);
    res.status(500).json({
      error: 'Error al crear token de invitación',
      detalle: error.message
    });
  }
};

// Validar token de invitación
const validarToken = async (req, res) => {
  try {
    const { token } = req.params;
    console.log(`🔍 Validando token: ${token.substring(0, 10)}...`);

    const resultado = await executeQuery(
      `SELECT
        id_token,
        token,
        usado,
        fecha_expiracion,
        fecha_creacion
       FROM tokens_invitacion
       WHERE token = ?`,
      [token]
    );

    if (resultado.length === 0) {
      console.log('❌ Token no encontrado');
      return res.status(404).json({
        valido: false,
        mensaje: 'Token de invitación no válido'
      });
    }

    const tokenData = resultado[0];

    // Verificar si ya fue usado
    if (tokenData.usado) {
      console.log('❌ Token ya fue usado');
      return res.status(400).json({
        valido: false,
        mensaje: 'Este token de invitación ya fue utilizado'
      });
    }

    // Verificar si expiró
    const ahora = new Date();
    const fechaExpiracion = new Date(tokenData.fecha_expiracion);
    if (ahora > fechaExpiracion) {
      console.log('❌ Token expirado');
      return res.status(400).json({
        valido: false,
        mensaje: 'Este token de invitación ha expirado'
      });
    }

    console.log('✅ Token válido');
    res.json({
      valido: true,
      mensaje: 'Token válido',
      fechaExpiracion: tokenData.fecha_expiracion
    });

  } catch (error) {
    console.error('❌ Error al validar token:', error);
    res.status(500).json({
      error: 'Error al validar token',
      detalle: error.message
    });
  }
};

// Marcar token como usado (interno, llamado desde authController)
const marcarTokenComoUsado = async (token, idUsuarioCreado) => {
  try {
    console.log(`✅ Marcando token como usado por usuario ${idUsuarioCreado}`);

    await executeQuery(
      `UPDATE tokens_invitacion
       SET usado = TRUE,
           id_usuario_creado = ?,
           fecha_uso = NOW()
       WHERE token = ?`,
      [idUsuarioCreado, token]
    );

    console.log('✅ Token marcado como usado');
    return true;
  } catch (error) {
    console.error('❌ Error al marcar token como usado:', error);
    throw error;
  }
};

// Listar todos los tokens (solo admin)
const listarTokens = async (req, res) => {
  try {
    console.log('📋 Listando todos los tokens de invitación...');

    const tokens = await executeQuery(
      `SELECT
        ti.id_token,
        ti.token,
        ti.usado,
        ti.fecha_creacion,
        ti.fecha_uso,
        ti.fecha_expiracion,
        u_creador.username as creado_por_username,
        u_creador.nombre_completo as creado_por_nombre,
        u_creado.username as usuario_creado_username,
        u_creado.nombre_completo as usuario_creado_nombre
       FROM tokens_invitacion ti
       INNER JOIN usuarios u_creador ON ti.creado_por = u_creador.id_usuario
       LEFT JOIN usuarios u_creado ON ti.id_usuario_creado = u_creado.id_usuario
       ORDER BY ti.fecha_creacion DESC`
    );

    console.log(`✅ Se encontraron ${tokens.length} tokens`);

    // Agregar información de estado y link
    const frontendUrl = getFrontendUrl(req);
    const tokensConEstado = tokens.map(token => {
      let estado = 'activo';
      if (token.usado) {
        estado = 'usado';
      } else if (new Date() > new Date(token.fecha_expiracion)) {
        estado = 'expirado';
      }

      return {
        ...token,
        estado,
        invitationLink: `${frontendUrl}/register?token=${token.token}`
      };
    });

    res.json(tokensConEstado);

  } catch (error) {
    console.error('❌ Error al listar tokens:', error);
    res.status(500).json({
      error: 'Error al listar tokens',
      detalle: error.message
    });
  }
};

// Listar tokens activos públicamente (sin datos sensibles)
const listarTokensPublico = async (req, res) => {
  try {
    console.log('📋 Listando tokens activos (público)...');

    const tokens = await executeQuery(
      `SELECT
        id_token,
        token,
        fecha_expiracion
       FROM tokens_invitacion
       WHERE usado = 0
         AND fecha_expiracion > NOW()
       ORDER BY fecha_creacion ASC`
    );

    const frontendUrl = getFrontendUrl(req);
    const tokensPublico = tokens.map((t, index) => ({
      id_token: t.id_token,
      numero: index + 1,
      invitationLink: `${frontendUrl}/register?token=${t.token}`,
      fecha_expiracion: t.fecha_expiracion
    }));

    console.log(`✅ Se encontraron ${tokensPublico.length} tokens activos`);
    res.json(tokensPublico);

  } catch (error) {
    console.error('❌ Error al listar tokens públicos:', error);
    res.status(500).json({
      error: 'Error al listar invitaciones',
      detalle: error.message
    });
  }
};

// Eliminar token (solo admin)
const eliminarToken = async (req, res) => {
  try {
    const { idToken } = req.params;
    console.log(`🗑️ Eliminando token ID: ${idToken}`);

    // Verificar que el token existe
    const tokenExiste = await executeQuery(
      'SELECT id_token, usado FROM tokens_invitacion WHERE id_token = ?',
      [idToken]
    );

    if (tokenExiste.length === 0) {
      return res.status(404).json({
        error: 'Token no encontrado'
      });
    }

    // Permitir eliminar tokens usados (es historial que puede limpiarse)
    // Nota: El usuario creado con este token NO se elimina, solo el registro del token

    // Eliminar token
    await executeQuery(
      'DELETE FROM tokens_invitacion WHERE id_token = ?',
      [idToken]
    );

    console.log('✅ Token eliminado exitosamente');
    res.json({
      message: 'Token eliminado exitosamente'
    });

  } catch (error) {
    console.error('❌ Error al eliminar token:', error);
    res.status(500).json({
      error: 'Error al eliminar token',
      detalle: error.message
    });
  }
};

console.log('✅ tokensInvitacionController cargado correctamente');

module.exports = {
  crearTokenInvitacion,
  validarToken,
  marcarTokenComoUsado,
  listarTokens,
  listarTokensPublico,
  eliminarToken
};
