// frontend/src/components/HomePage.js - Con módulo de asignación de jugadores
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div className="homepage">
      <div className="homepage-header">
        <div className="header-content">
          <h1>⚽ Sistema de Estadísticas O'Higgins FC</h1>
          <p>Sistema de Gestión de Estadísticas Deportivas</p>
          <div className="version-info">
            <span className="version-badge">v1.4.0</span>
            <span className="status-badge online">🟢 Sistema Online</span>
          </div>
        </div>
      </div>

      <div className="main-content">
        <div className="welcome-section">
          <div className="welcome-card">
            <div className="welcome-icon">📊</div>
            <h2>Panel de Control Principal</h2>
            <p>Accede al sistema completo de gestión de estadísticas deportivas</p>
            
            <div className="main-actions">
              <button
                onClick={() => handleNavigation('/dashboard')}
                className="main-btn primary"
              >
                Ver Dashboard
              </button>
            </div>
          </div>
        </div>

        <div className="features-preview">
          {/* MÓDULO DE ESTADIOS */}
          <div className="feature-item available">
            <div className="feature-icon">🏟️</div>
            <h3>Gestión de Estadios</h3>
            <p>Administra estadios y sus características</p>
            <span className="feature-status available">✅ Disponible</span>
            <div className="feature-actions">
              <button 
                onClick={() => handleNavigation('/lista-estadios')}
                className="feature-btn primary"
              >
                Ver Estadios
              </button>
              <button 
                onClick={() => handleNavigation('/nuevo-estadio')}
                className="feature-btn success"
              >
                Nuevo Estadio
              </button>
            </div>
          </div>
          
          {/* MÓDULO DE EQUIPOS */}
          <div className="feature-item available">
            <div className="feature-icon">⚽</div>
            <h3>Gestión de Equipos</h3>
            <p>Registro y administración de equipos</p>
            <span className="feature-status available">✅ Disponible</span>
            <div className="feature-actions">
              <button 
                onClick={() => handleNavigation('/lista-equipos')}
                className="feature-btn primary"
              >
                Ver Equipos
              </button>
              <button 
                onClick={() => handleNavigation('/nuevo-equipo')}
                className="feature-btn success"
              >
                Nuevo Equipo
              </button>
            </div>
          </div>

          {/* MÓDULO DE JUGADORES */}
          <div className="feature-item available">
            <div className="feature-icon">👥</div>
            <h3>Gestión de Jugadores</h3>
            <p>Sistema completo de jugadores con nacionalidades y posiciones</p>
            <span className="feature-status available">✅ Disponible</span>
            <div className="feature-actions">
              <button 
                onClick={() => handleNavigation('/jugadores')}
                className="feature-btn primary"
              >
                Ver Jugadores
              </button>
              <button 
                onClick={() => handleNavigation('/jugadores')}
                className="feature-btn success"
              >
                Nuevo Jugador
              </button>
            </div>
          </div>

          {/* MÓDULO DE TORNEOS - CORREGIDO */}
          <div className="feature-item available">
            <div className="feature-icon">🏆</div>
            <h3>Gestión de Torneos</h3>
            <p>Administración completa de torneos, ligas y competencias</p>
            <span className="feature-status available">✅ Disponible</span>
            <div className="feature-actions">
              <button 
                onClick={() => handleNavigation('/torneos')}
                className="feature-btn primary"
              >
                Ver Torneos
              </button>
              <button 
                onClick={() => handleNavigation('/nuevo-torneo')}
                className="feature-btn success"
              >
                Nuevo Torneo
              </button>
            </div>
          </div>

          {/* NUEVO MÓDULO DE ASIGNACIÓN DE JUGADORES */}
          <div className="feature-item available">
            <div className="feature-icon">➕</div>
            <h3>Asignación de Jugadores</h3>
            <p>Asigna jugadores a torneos y equipos específicos</p>
            <span className="feature-status available">✅ Disponible</span>
            <div className="feature-actions">
              <button 
                onClick={() => handleNavigation('/asignacion-jugador')}
                className="feature-btn primary"
              >
                Asignar Jugadores
              </button>
              <button 
                onClick={() => handleNavigation('/listado-jugadores')}
                className="feature-btn secondary"
              >
                Ver Asignaciones
              </button>
            </div>
          </div>
          
          {/* MÓDULOS FUTUROS */}
          <div className="feature-item">
            <div className="feature-icon">⚽</div>
            <h3>Gestión de Partidos</h3>
            <p>Resultados y estadísticas de partidos</p>
            <span className="feature-status coming-soon">📅 Próximamente</span>
          </div>

          <div className="feature-item">
            <div className="feature-icon">📊</div>
            <h3>Reportes y Análisis</h3>
            <p>Dashboard avanzado con estadísticas y reportes</p>
            <span className="feature-status coming-soon">📅 Próximamente</span>
          </div>
        </div>
      </div>

      <div className="homepage-footer">
        <div className="footer-content">
          <p>&copy; 2025 O'Higgins FC - Sistema de Gestión Deportiva</p>
          <div className="footer-status">
            <span>API: ✅ Conectado</span>
            <span>BD: ✅ Activa</span>
            <span>Módulos: 5 activos</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;