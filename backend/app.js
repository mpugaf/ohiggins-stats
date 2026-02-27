// backend/app.js - Con módulo de equipos, jugadores Y TORNEOS
console.log('🚀 Iniciando servidor...');

// Cargar variables de entorno PRIMERO, antes de cualquier import
require('dotenv').config();
console.log('🔧 Variables de entorno cargadas');
console.log('🔑 DB_PASSWORD configurado:', process.env.DB_PASSWORD ? 'SÍ' : 'NO');

const express = require('express');
const cors = require('cors');

const app = express();

// Middleware básico
console.log('⚙️ Configurando middleware...');

// CORS Configuration - Support for multiple frontend URLs
const frontendUrls = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : ['http://192.168.100.16:3001', 'http://localhost:3001'];

console.log('🌐 CORS permitido para:', frontendUrls);

app.use(cors({
  origin: frontendUrls,
  credentials: true
}));
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Ruta de salud básica
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Servidor funcionando',
    timestamp: new Date().toISOString()
  });
});

// ==================== RUTAS PÚBLICAS ====================
// Rutas de autenticación (no requieren token)
console.log('📥 Cargando rutas de autenticación...');
try {
  const authRoutes = require('./routes/auth');
  app.use('/api/auth', authRoutes);
  console.log('✅ Rutas de autenticación cargadas exitosamente');
} catch (error) {
  console.error('❌ Error cargando rutas de autenticación:', error.message);
  console.error('📍 Stack:', error.stack);
}

console.log('📥 Cargando rutas de tokens de invitación...');
try {
  const tokensInvitacionRoutes = require('./routes/tokensInvitacion');
  app.use('/api/tokens-invitacion', tokensInvitacionRoutes);
  console.log('✅ Rutas de tokens de invitación cargadas exitosamente');
} catch (error) {
  console.error('❌ Error cargando rutas de tokens de invitación:', error.message);
  console.error('📍 Stack:', error.stack);
}

// ==================== RUTAS PROTEGIDAS ====================
// Importar middleware de autenticación
const { authenticateToken, requireAdmin } = require('./middleware/auth');

// Rutas de usuarios autenticados - Sistema de Apuestas
console.log('📥 Cargando rutas de cuotas...');
try {
  const cuotasRoutes = require('./routes/cuotas');
  app.use('/api/cuotas', cuotasRoutes);
  console.log('✅ Rutas de cuotas cargadas exitosamente');
} catch (error) {
  console.error('❌ Error cargando rutas de cuotas:', error.message);
  console.error('📍 Stack:', error.stack);
}

console.log('📥 Cargando rutas de apuestas...');
try {
  const apuestasRoutes = require('./routes/apuestas');
  app.use('/api/apuestas', apuestasRoutes);
  console.log('✅ Rutas de apuestas cargadas exitosamente');
} catch (error) {
  console.error('❌ Error cargando rutas de apuestas:', error.message);
  console.error('📍 Stack:', error.stack);
}

console.log('📥 Cargando rutas de configuración de apuestas...');
try {
  const configApuestasRoutes = require('./routes/configApuestas');
  app.use('/api/config-apuestas', configApuestasRoutes);
  console.log('✅ Rutas de configuración de apuestas cargadas exitosamente');
} catch (error) {
  console.error('❌ Error cargando rutas de configuración de apuestas:', error.message);
  console.error('📍 Stack:', error.stack);
}

console.log('📥 Cargando rutas de pronósticos...');
try {
  const pronosticosRoutes = require('./routes/pronosticos');
  app.use('/api/pronosticos', pronosticosRoutes);
  console.log('✅ Rutas de pronósticos cargadas exitosamente');
} catch (error) {
  console.error('❌ Error cargando rutas de pronósticos:', error.message);
  console.error('📍 Stack:', error.stack);
}

console.log('📥 Cargando rutas de mensajes de ganadores...');
try {
  const mensajesGanadoresRoutes = require('./routes/mensajesGanadores');
  app.use('/api/mensajes-ganadores', mensajesGanadoresRoutes);
  console.log('✅ Rutas de mensajes de ganadores cargadas exitosamente');
} catch (error) {
  console.error('❌ Error cargando rutas de mensajes de ganadores:', error.message);
  console.error('📍 Stack:', error.stack);
}

// Rutas de usuarios autenticados - Consulta de datos
console.log('📥 Cargando rutas de torneos...');
try {
  const torneosRoutes = require('./routes/torneos');
  app.use('/api/torneos', authenticateToken, torneosRoutes);
  console.log('✅ Rutas de torneos cargadas exitosamente');
} catch (error) {
  console.error('❌ Error cargando rutas de torneos:', error.message);
  console.error('📍 Stack:', error.stack);
}

console.log('📥 Cargando rutas de partidos...');
try {
  const partidosRoutes = require('./routes/partidos');
  app.use('/api/partidos', authenticateToken, partidosRoutes);
  console.log('✅ Rutas de partidos cargadas exitosamente');
} catch (error) {
  console.error('❌ Error cargando rutas de partidos:', error.message);
  console.error('📍 Stack:', error.stack);
}

console.log('📥 Cargando rutas de partidos históricos...');
try {
  const partidosHistoricoRoutes = require('./routes/partidosHistorico');
  app.use('/api/partidos-historico', partidosHistoricoRoutes);
  console.log('✅ Rutas de partidos históricos cargadas exitosamente');
} catch (error) {
  console.error('❌ Error cargando rutas de partidos históricos:', error.message);
  console.error('📍 Stack:', error.stack);
}

// Rutas de administrador solamente
console.log('📥 Cargando rutas de estadios...');
try {
  const estadiosRoutes = require('./routes/estadios');
  app.use('/api/estadios', authenticateToken, requireAdmin, estadiosRoutes);
  console.log('✅ Rutas de estadios cargadas exitosamente');
} catch (error) {
  console.error('❌ Error cargando rutas de estadios:', error.message);
  console.error('📍 Stack:', error.stack);
}

console.log('📥 Cargando rutas de equipos...');
try {
  const equiposRoutes = require('./routes/equipos');
  app.use('/api/equipos', authenticateToken, requireAdmin, equiposRoutes);
  console.log('✅ Rutas de equipos cargadas exitosamente');
} catch (error) {
  console.error('❌ Error cargando rutas de equipos:', error.message);
  console.error('📍 Stack:', error.stack);
}

console.log('📥 Cargando rutas de jugadores...');
try {
  const playersRoutes = require('./routes/players');
  app.use('/api/players', authenticateToken, requireAdmin, playersRoutes);
  console.log('✅ Rutas de jugadores cargadas exitosamente');
} catch (error) {
  console.error('❌ Error cargando rutas de jugadores:', error.message);
  console.error('📍 Stack:', error.stack);
}

console.log('📥 Cargando rutas de usuarios...');
try {
  const usuariosRoutes = require('./routes/usuarios');
  app.use('/api/usuarios', authenticateToken, requireAdmin, usuariosRoutes);
  console.log('✅ Rutas de usuarios cargadas exitosamente');
} catch (error) {
  console.error('❌ Error cargando rutas de usuarios:', error.message);
  console.error('📍 Stack:', error.stack);
}

console.log('📥 Cargando rutas de asignaciones torneo-jugador...');
try {
  const torneoJugadorRoutes = require('./routes/torneoJugador');
  app.use('/api/torneo-jugador', authenticateToken, requireAdmin, torneoJugadorRoutes);
  console.log('✅ Rutas de asignaciones torneo-jugador cargadas exitosamente');
} catch (error) {
  console.error('❌ Error cargando rutas de asignaciones torneo-jugador:', error.message);
  console.error('📍 Stack:', error.stack);
}

// Rutas de programas (autenticadas)
console.log('📥 Cargando rutas de programas...');
try {
  const programasRoutes = require('./routes/programas');
  app.use('/api/programas', programasRoutes);
  console.log('✅ Rutas de programas cargadas exitosamente');
} catch (error) {
  console.error('❌ Error cargando rutas de programas:', error.message);
  console.error('📍 Stack:', error.stack);
}

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    message: 'API O\'Higgins Stats - Sistema de Apuestas',
    version: '2.0.0',
    endpoints: {
      public: {
        health: '/api/health',
        auth: {
          register: 'POST /api/auth/register',
          login: 'POST /api/auth/login',
          profile: 'GET /api/auth/profile (requiere token)'
        }
      },
      authenticated: {
        torneos: '/api/torneos (requiere token)',
        partidos: '/api/partidos (requiere token)',
        cuotas: '/api/cuotas (requiere token)',
        apuestas: {
          crear: 'POST /api/apuestas (requiere token y permiso para apostar)',
          misApuestas: 'GET /api/apuestas/mis-apuestas (requiere token)',
          estadisticas: 'GET /api/apuestas/estadisticas (requiere token)'
        }
      },
      admin: {
        estadios: '/api/estadios (requiere token y rol admin)',
        equipos: '/api/equipos (requiere token y rol admin)',
        jugadores: '/api/players (requiere token y rol admin)',
        usuarios: '/api/usuarios (requiere token y rol admin)',
        programas: '/api/programas (requiere token, admin para crear/editar)',
        liquidarApuestas: 'POST /api/apuestas/liquidar/:idPartido (requiere token y rol admin)',
        gestionCuotas: 'POST /api/cuotas/partido/:idPartido (requiere token y rol admin)'
      }
    }
  });
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// Middleware para rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Configuración del puerto y arranque del servidor
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📍 URL: http://192.168.100.16:${PORT}`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log('');
  console.log('==================== ENDPOINTS ====================');
  console.log(`🏥 Health check: http://192.168.100.16:${PORT}/api/health`);
  console.log('');
  console.log('🔓 PÚBLICAS:');
  console.log(`🔐 Auth API: http://192.168.100.16:${PORT}/api/auth`);
  console.log('');
  console.log('🔒 AUTENTICADAS:');
  console.log(`🏆 Torneos API: http://192.168.100.16:${PORT}/api/torneos`);
  console.log(`🎯 Partidos API: http://192.168.100.16:${PORT}/api/partidos`);
  console.log(`💰 Cuotas API: http://192.168.100.16:${PORT}/api/cuotas`);
  console.log(`🎲 Apuestas API: http://192.168.100.16:${PORT}/api/apuestas`);
  console.log('');
  console.log('👑 SOLO ADMINISTRADORES:');
  console.log(`🏟️ Estadios API: http://192.168.100.16:${PORT}/api/estadios`);
  console.log(`⚽ Equipos API: http://192.168.100.16:${PORT}/api/equipos`);
  console.log(`👤 Jugadores API: http://192.168.100.16:${PORT}/api/players`);
  console.log(`👥 Usuarios API: http://192.168.100.16:${PORT}/api/usuarios`);
  console.log('===================================================');
  console.log('');
});

// Manejo de errores no capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});