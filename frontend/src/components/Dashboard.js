// frontend/src/components/Dashboard.js - Con módulo de torneos
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  estadiosService,
  equiposService,
  playersService,
  torneosService,
  partidosService,
  handleResponse
} from '../services/apiService';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    estadios: '--',
    equipos: '--',
    jugadores: '--',
    torneos: '--',
    loading: true
  });

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      setStats(prev => ({ ...prev, loading: true }));

      console.log('📊 Cargando estadísticas...');

      // Usar servicios centralizados con autenticación automática
      const [estadiosData, equiposData, jugadoresData, torneosData, partidosData] = await Promise.all([
        estadiosService.getAll().then(handleResponse).catch(() => []),
        equiposService.getAll().then(handleResponse).catch(() => []),
        playersService.getAll().then(handleResponse).catch(() => []),
        torneosService.getAll().then(handleResponse).catch(() => []),
        partidosService.getAll().then(handleResponse).catch(() => [])
      ]);      

      console.log('📊 Datos cargados:', {
        estadios: estadiosData.length,
        equipos: equiposData.length, 
        jugadores: jugadoresData.length,
        torneos: torneosData.length
      });

      setStats({
        estadios: estadiosData.length || 0,
        equipos: equiposData.length || 0,
        jugadores: jugadoresData.length || 0,
        torneos: torneosData.length || 0,
        partidos: partidosData.length || 0,
        loading: false
      });

    } catch (error) {
      console.error('❌ Error al cargar estadísticas:', error);
      setStats({
        estadios: 'Error',
        equipos: 'Error', 
        jugadores: 'Error',
        torneos: 'Error',
        partidos: 'Error',
        loading: false
      });
    }
  };

  const handleNavigation = (path) => {
    if (path !== '#') {
      navigate(path);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleRefreshStats = () => {
    cargarEstadisticas();
  };

  return (
    <div className="dashboard">
      <div className="dashboard-content">
        <div className="dashboard-title-section">
          <div className="title-left">
            <h1>📊 Dashboard O'Higgins FC</h1>
            <p>Panel de administración del sistema</p>
          </div>
          <div className="title-right">
            <button onClick={handleRefreshStats} className="refresh-btn" title="Actualizar estadísticas">
              🔄 Actualizar
            </button>
            <span className="status-indicator">🟢 Sistema Activo</span>
          </div>
        </div>
        <div className="summary-cards">
          <div className="summary-card">
            <div className="card-icon">🏟️</div>
            <div className="card-info">
              <h3>Estadios</h3>
              <p className="card-number">
                {stats.loading ? <span className="loading-number">⏳</span> : stats.estadios}
              </p>
              <span className="card-label">
                {stats.estadios === 1 ? 'Registrado' : 'Registrados'}
              </span>
            </div>
          </div>

          <div className="summary-card">
            <div className="card-icon">⚽</div>
            <div className="card-info">
              <h3>Equipos</h3>
              <p className="card-number">
                {stats.loading ? <span className="loading-number">⏳</span> : stats.equipos}
              </p>
              <span className="card-label">
                {stats.equipos === 1 ? 'Registrado' : 'Registrados'}
              </span>
            </div>
          </div>

          <div className="summary-card">
            <div className="card-icon">👥</div>
            <div className="card-info">
              <h3>Jugadores</h3>
              <p className="card-number">
                {stats.loading ? <span className="loading-number">⏳</span> : stats.jugadores}
              </p>
              <span className="card-label">
                {stats.jugadores === 1 ? 'Registrado' : 'Registrados'}
              </span>
            </div>
          </div>

          <div className="summary-card">
            <div className="card-icon">🏆</div>
            <div className="card-info">
              <h3>Torneos</h3>
              <p className="card-number">
                {stats.loading ? <span className="loading-number">⏳</span> : stats.torneos}
              </p>
              <span className="card-label">
                {stats.torneos === 1 ? 'Registrado' : 'Registrados'}
              </span>
            </div>
          </div>

          <div className="summary-card">
            <div className="card-icon">🏆</div>
            <div className="card-info">
              <h3>Partidos</h3>
              <p className="card-number">
                {stats.loading ? <span className="loading-number">⏳</span> : stats.partidos}
              </p>
              <span className="card-label">
                {stats.torneos === 1 ? 'Registrado' : 'Registrados'}
              </span>
            </div>
          </div>

        </div>

        <div className="modules-section">
          <h2>Módulos Activos</h2>
          <div className="modules-grid">
            <div className="module-card featured">
              <div className="module-header">
                <div className="module-icon">🏟️</div>
                <div className="module-info">
                  <h3>Gestión de Estadios</h3>
                  <p>Administra estadios, capacidades, ubicaciones y características técnicas</p>
                  <span className="module-status active">✅ Completamente Funcional</span>
                </div>
              </div>
              <div className="module-actions">
                <button onClick={() => handleNavigation('/lista-estadios')} className="action-btn primary">
                  📋 Ver Estadios ({stats.estadios})
                </button>
                <button onClick={() => handleNavigation('/nuevo-estadio')} className="action-btn success">
                  ➕ Nuevo Estadio
                </button>
              </div>
              <div className="module-features">
                <h4>Funcionalidades:</h4>
                <ul>
                  <li>✅ Crear estadios con validaciones completas</li>
                  <li>✅ Listar y buscar estadios existentes</li>
                  <li>✅ Editar información de estadios</li>
                  <li>✅ Eliminar estadios (con validaciones)</li>
                  <li>✅ Gestión de capacidad y superficie</li>
                </ul>
              </div>
            </div>

            <div className="module-card featured">
              <div className="module-header">
                <div className="module-icon">⚽</div>
                <div className="module-info">
                  <h3>Gestión de Equipos</h3>
                  <p>Registro y administración de equipos, ciudades y fechas de fundación</p>
                  <span className="module-status active">✅ Completamente Funcional</span>
                </div>
              </div>
              <div className="module-actions">
                <button onClick={() => handleNavigation('/lista-equipos')} className="action-btn primary">
                  📋 Ver Equipos ({stats.equipos})
                </button>
                <button onClick={() => handleNavigation('/nuevo-equipo')} className="action-btn success">
                  ➕ Nuevo Equipo
                </button>
              </div>
              <div className="module-features">
                <h4>Funcionalidades:</h4>
                <ul>
                  <li>✅ Crear equipos con datos completos</li>
                  <li>✅ Gestión de nombres y apodos</li>
                  <li>✅ Control de fechas de fundación</li>
                  <li>✅ Estados activo/inactivo</li>
                  <li>✅ Búsqueda y filtros avanzados</li>
                </ul>
              </div>
            </div>

            <div className="module-card featured">
              <div className="module-header">
                <div className="module-icon">👥</div>
                <div className="module-info">
                  <h3>Gestión de Jugadores</h3>
                  <p>Sistema completo para registro de jugadores con nacionalidades y posiciones</p>
                  <span className="module-status active">✅ Completamente Funcional</span>
                </div>
              </div>
              <div className="module-actions">
                <button onClick={() => handleNavigation('/jugadores')} className="action-btn primary">
                  📋 Ver Jugadores ({stats.jugadores})
                </button>
                <button onClick={() => handleNavigation('/jugadores')} className="action-btn success">
                  ➕ Nuevo Jugador
                </button>
              </div>
              <div className="module-features">
                <h4>Funcionalidades:</h4>
                <ul>
                  <li>✅ Crear jugadores con datos completos</li>
                  <li>✅ Gestión de múltiples nacionalidades</li>
                  <li>✅ Asignación de múltiples posiciones</li>
                  <li>✅ Búsqueda y filtros avanzados</li>
                  <li>✅ Validaciones de datos personales</li>
                </ul>
              </div>
            </div>

            {/* MÓDULO DE ASIGNACIÓN DE JUGADORES - AGREGAR DESPUÉS DEL MÓDULO DE JUGADORES */}
            <div className="module-card featured">
              <div className="module-header">
                <div className="module-icon">➕</div>
                <div className="module-info">
                  <h3>Asignación de Jugadores</h3>
                  <p>Asigna jugadores a torneos y equipos específicos con datos de camiseta</p>
                  <span className="module-status active">✅ Completamente Funcional</span>
                </div>
              </div>
              <div className="module-actions">
                <button onClick={() => handleNavigation('/asignacion-jugador')} className="action-btn primary">
                  ➕ Asignar Jugadores
                </button>
                <button onClick={() => handleNavigation('/listado-jugadores')} className="action-btn secondary">
                  📋 Ver Asignaciones
                </button>
              </div>
              <div className="module-features">
                <h4>Funcionalidades:</h4>
                <ul>
                  <li>✅ Flujo guiado: Torneo → Jugador → Equipo</li>
                  <li>✅ Validación de números de camiseta</li>
                  <li>✅ Fechas de incorporación</li>
                  <li>✅ Información detallada del jugador</li>
                  <li>✅ Resumen de asignación en tiempo real</li>
                </ul>
              </div>
            </div>

            <div className="module-card featured">
              <div className="module-header">
                <div className="module-icon">🏆</div>
                <div className="module-info">
                  <h3>Gestión de Torneos</h3>
                  <p>Administración completa de torneos, ligas y competencias deportivas</p>
                  <span className="module-status active">✅ Completamente Funcional</span>
                </div>
              </div>
              <div className="module-actions">
                <button onClick={() => handleNavigation('/torneos')} className="action-btn primary">
                  📋 Ver Torneos ({stats.torneos})
                </button>
                <button onClick={() => handleNavigation('/torneos')} className="action-btn success">
                  ➕ Nuevo Torneo
                </button>
              </div>
              <div className="module-features">
                <h4>Funcionalidades:</h4>
                <ul>
                  <li>✅ Crear torneos con datos completos</li>
                  <li>✅ Gestión de países organizadores</li>
                  <li>✅ Control de ruedas y temporadas</li>
                  <li>✅ ID únicos automáticos (League ID FBR)</li>
                  <li>✅ Búsqueda y filtros por temporada</li>
                </ul>
              </div>
            </div>

            <div className="module-card featured">
              <div className="module-header">
                <div className="module-icon">🏆</div>
                <div className="module-info">
                  <h3>Gestión de Partidos</h3>
                  <p>Registro y administración de partidos, resultados y estadísticas de encuentros</p>
                  <span className="module-status active">✅ Completamente Funcional</span>
                </div>
              </div>
              <div className="module-actions">
                <button onClick={() => handleNavigation('/partidos-plus')} className="action-btn primary">
                  🏆 Gestión de Partidos ({stats.partidos})
                </button>
              </div>
              <div className="module-features">
                <h4>Funcionalidades:</h4>
                <ul>
                  <li>✅ Crear partidos con datos completos</li>
                  <li>✅ Selección de torneos y equipos</li>
                  <li>✅ Gestión de estadios</li>
                  <li>✅ Fechas y horarios</li>
                  <li>✅ Resultados y estadísticas</li>
                  <li>✅ Búsqueda y filtros avanzados</li>
                  <li>✅ Tabla moderna con gradientes</li>
                  <li>✅ Edición y eliminación inline</li>
                  <li>✅ Modal de edición intuitivo</li>
                </ul>
              </div>
            </div>

            <div className="module-card featured">
              <div className="module-header">
                <div className="module-icon">👥</div>
                <div className="module-info">
                  <h3>Gestión de Usuarios</h3>
                  <p>Administración de usuarios del sistema, roles y permisos de apuestas</p>
                  <span className="module-status active">✅ Completamente Funcional</span>
                </div>
              </div>
              <div className="module-actions">
                <button onClick={() => handleNavigation('/admin/usuarios')} className="action-btn primary">
                  📋 Ver Usuarios
                </button>
                <button onClick={() => handleNavigation('/admin/usuarios/nuevo')} className="action-btn success">
                  ➕ Nuevo Usuario
                </button>
                <button onClick={() => handleNavigation('/admin/tokens-invitacion')} className="action-btn secondary">
                  🎟️ Gestión de Tokens
                </button>
                <button onClick={() => handleNavigation('/admin/gestion-programas')} className="action-btn info">
                  🎙️ Gestión de Programas
                </button>
              </div>
              <div className="module-features">
                <h4>Funcionalidades:</h4>
                <ul>
                  <li>✅ Crear usuarios con validaciones completas</li>
                  <li>✅ Gestión de roles (Admin/Usuario)</li>
                  <li>✅ Control de permisos de apuestas</li>
                  <li>✅ Activar/Desactivar usuarios</li>
                  <li>✅ Eliminar usuarios con validaciones</li>
                  <li>✅ Búsqueda y filtros avanzados</li>
                  <li>🆕 Tokens de invitación únicos (un solo uso)</li>
                </ul>
              </div>
            </div>

            <div className="module-card featured">
              <div className="module-header">
                <div className="module-icon">🎲</div>
                <div className="module-info">
                  <h3>Sistema de Apuestas</h3>
                  <p>Configuración y gestión del sistema de apuestas deportivas</p>
                  <span className="module-status active">✅ Completamente Funcional</span>
                </div>
              </div>
              <div className="module-actions">
                <button onClick={() => handleNavigation('/admin/configuracion-apuestas')} className="action-btn primary">
                  ⚙️ Configurar Apuestas
                </button>
                <button onClick={() => handleNavigation('/admin/limpiar-apuestas-usuario')} className="action-btn warning">
                  🗑️ Limpiar Apuestas Usuario
                </button>
                <button onClick={() => handleNavigation('/admin/limpiar-resultados')} className="action-btn danger">
                  🔄 Limpiar Resultados
                </button>
              </div>
              <div className="module-features">
                <h4>Funcionalidades:</h4>
                <ul>
                  <li>✅ Habilitar/Deshabilitar apuestas globalmente</li>
                  <li>✅ Configurar torneo y fecha habilitada para apuestas</li>
                  <li>✅ Limpiar apuestas específicas (usuario + torneo + fecha)</li>
                  <li>✅ Limpiar resultados de partidos (modo replay)</li>
                  <li>✅ Permitir apuestas en fechas pasadas</li>
                  <li>✅ Ver tabla de posiciones de usuarios</li>
                  <li>✅ Control total del sistema de apuestas</li>
                </ul>
              </div>
            </div>

            <div className="module-card featured">
              <div className="module-header">
                <div className="module-icon">📋</div>
                <div className="module-info">
                  <h3>Consultas y Reportes</h3>
                  <p>Visualización de información organizada por torneos y equipos</p>
                  <span className="module-status active">✅ Completamente Funcional</span>
                </div>
              </div>
              <div className="module-actions">
                <button onClick={() => handleNavigation('/consultas/roster-jugadores')} className="action-btn primary">
                  📋 Roster de Jugadores
                </button>
                <button onClick={() => handleNavigation('/consultas/partidos-historicos-plus')} className="action-btn primary">
                  🗂️ Partidos Históricos
                </button>
              </div>
              <div className="module-features">
                <h4>Funcionalidades:</h4>
                <ul>
                  <li>✅ Ver jugadores por torneo y equipo</li>
                  <li>✅ Organización por posiciones</li>
                  <li>✅ Información detallada de cada jugador</li>
                  <li>✅ Filtros por torneo y equipo</li>
                  <li>✅ Partidos históricos con filtros avanzados</li>
                  <li>✅ Filtrar por equipo y fecha del torneo</li>
                  <li>✅ Rango de fechas personalizado</li>
                  <li>✅ Tabla profesional con gradientes</li>
                  <li>✅ Interfaz visual amigable</li>
                </ul>
              </div>
            </div>

          </div>
        </div>

        <div className="fun-banner">
          <div className="fun-banner-content">
            <div className="fun-icon">🎉</div>
            <div className="fun-text">
              <h2>¡Disfruta la Experiencia O'Higgins!</h2>
              <p>Gestiona tu sistema, organiza torneos y diviértete siguiendo a tu equipo favorito. ⚽💙</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;