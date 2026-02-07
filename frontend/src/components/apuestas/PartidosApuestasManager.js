import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PartidosDisponibles from './PartidosDisponibles';
import ApuestasPendientes from './ApuestasPendientes';
import MisApuestas from './MisApuestas';
import EstadisticasUsuario from './EstadisticasUsuario';
import TablaPosiciones from './TablaPosiciones';
import PartidosHistoricos from './PartidosHistoricos';
import './PartidosApuestasManager.css';

function PartidosApuestasManager() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tabActiva, setTabActiva] = useState('disponibles');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleApuestaCreada = () => {
    // Forzar refresh de componentes
    setRefreshKey(prev => prev + 1);
  };

  const handleLogout = () => {
    logout();
  };

  const handleNavigateToRoster = () => {
    navigate('/consultas/roster-jugadores');
  };

  return (
    <div className="apuestas-manager">
      {/* Estadísticas del usuario */}
      <section className="stats-section">
        <EstadisticasUsuario key={refreshKey} />
      </section>

      {/* Tabs de navegación */}
      <nav className="tabs-navigation">
        <button
          className={`tab-button ${tabActiva === 'disponibles' ? 'active' : ''}`}
          onClick={() => setTabActiva('disponibles')}
        >
          <span className="tab-icon">⚽</span>
          <span className="tab-label">Partidos Disponibles</span>
        </button>

        <button
          className={`tab-button ${tabActiva === 'pendientes' ? 'active' : ''}`}
          onClick={() => setTabActiva('pendientes')}
        >
          <span className="tab-icon">⏳</span>
          <span className="tab-label">Apuestas Pendientes</span>
        </button>

        <button
          className={`tab-button ${tabActiva === 'historial' ? 'active' : ''}`}
          onClick={() => setTabActiva('historial')}
        >
          <span className="tab-icon">📋</span>
          <span className="tab-label">Historial Completo</span>
        </button>

        <button
          className={`tab-button ${tabActiva === 'tabla' ? 'active' : ''}`}
          onClick={() => setTabActiva('tabla')}
        >
          <span className="tab-icon">🏆</span>
          <span className="tab-label">Tabla de Posiciones</span>
        </button>

        <button
          className={`tab-button ${tabActiva === 'historico' ? 'active' : ''}`}
          onClick={() => setTabActiva('historico')}
        >
          <span className="tab-icon">📋</span>
          <span className="tab-label">Partidos Históricos</span>
        </button>

        <button
          className="tab-button"
          onClick={handleNavigateToRoster}
        >
          <span className="tab-icon">👥</span>
          <span className="tab-label">Roster de Jugadores</span>
        </button>
      </nav>

      {/* Contenido de tabs */}
      <main className="tab-content">
        {tabActiva === 'disponibles' && (
          <PartidosDisponibles
            key={refreshKey}
            onApuestaCreada={handleApuestaCreada}
          />
        )}

        {tabActiva === 'pendientes' && (
          <div className="tab-wrapper">
            <ApuestasPendientes
              key={`pendientes-${refreshKey}`}
              onApuestaCreada={handleApuestaCreada}
            />
          </div>
        )}

        {tabActiva === 'historial' && (
          <div className="tab-wrapper">
            <MisApuestas key={`historial-${refreshKey}`} />
          </div>
        )}

        {tabActiva === 'tabla' && (
          <div className="tab-wrapper">
            <TablaPosiciones key={refreshKey} />
          </div>
        )}

        {tabActiva === 'historico' && (
          <div className="tab-wrapper">
            <PartidosHistoricos key={refreshKey} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="manager-footer">
        <p>&copy; 2026 O'Higgins Stats. Sistema de Apuestas Deportivas.</p>
        <p className="footer-warning">
           Sistema hecho por celestes para celestes.
        </p>
      </footer>
    </div>
  );
}

export default PartidosApuestasManager;
