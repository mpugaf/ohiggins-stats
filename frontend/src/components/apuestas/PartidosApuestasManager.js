import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ApuestasPendientes from './ApuestasPendientes';
import MisApuestas from './MisApuestas';
import EstadisticasUsuario from './EstadisticasUsuario';
import TablaPosiciones from './TablaPosiciones';
import PartidosHistoricosPlus from './PartidosHistoricosPlus';
import RosterJugadores from '../consultas/RosterJugadores';
import './PartidosApuestasManager.css';

function PartidosApuestasManager() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tabActiva, setTabActiva] = useState('pendientes');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleApuestaCreada = () => {
    // Forzar refresh de componentes
    setRefreshKey(prev => prev + 1);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="apuestas-manager">
      {/* Estadísticas del usuario */}
      <section className="stats-section">
        <EstadisticasUsuario key={refreshKey} />
      </section>

      {/* Tabs de navegación - Rediseñadas */}
      <nav className="tabs-navigation-modern">
        <button
          className={`tab-button-modern ${tabActiva === 'pendientes' ? 'active' : ''}`}
          onClick={() => setTabActiva('pendientes')}
        >
          <div className="tab-icon-modern">⏳</div>
          <div className="tab-content-text">
            <span className="tab-label-modern">Apuestas Pendientes</span>
            <span className="tab-description">Ver tus apuestas activas</span>
          </div>
        </button>

        <button
          className={`tab-button-modern ${tabActiva === 'historial' ? 'active' : ''}`}
          onClick={() => setTabActiva('historial')}
        >
          <div className="tab-icon-modern">📋</div>
          <div className="tab-content-text">
            <span className="tab-label-modern">Historial Completo</span>
            <span className="tab-description">Mis apuestas anteriores</span>
          </div>
        </button>

        <button
          className={`tab-button-modern ${tabActiva === 'tabla' ? 'active' : ''}`}
          onClick={() => setTabActiva('tabla')}
        >
          <div className="tab-icon-modern">🏆</div>
          <div className="tab-content-text">
            <span className="tab-label-modern">Tabla de Posiciones</span>
            <span className="tab-description">Ranking de usuarios</span>
          </div>
        </button>

        <button
          className={`tab-button-modern ${tabActiva === 'historico' ? 'active' : ''}`}
          onClick={() => setTabActiva('historico')}
        >
          <div className="tab-icon-modern">📊</div>
          <div className="tab-content-text">
            <span className="tab-label-modern">Partidos Históricos</span>
            <span className="tab-description">Resultados finalizados</span>
          </div>
        </button>

        <button
          className={`tab-button-modern ${tabActiva === 'roster' ? 'active' : ''}`}
          onClick={() => setTabActiva('roster')}
        >
          <div className="tab-icon-modern">👥</div>
          <div className="tab-content-text">
            <span className="tab-label-modern">Roster de Jugadores</span>
            <span className="tab-description">Consultar planteles</span>
          </div>
        </button>
      </nav>

      {/* Contenido de tabs */}
      <main className="tab-content-modern">

        {tabActiva === 'pendientes' && (
          <div className="tab-wrapper-modern">
            <ApuestasPendientes
              key={`pendientes-${refreshKey}`}
              onApuestaCreada={handleApuestaCreada}
            />
          </div>
        )}

        {tabActiva === 'historial' && (
          <div className="tab-wrapper-modern">
            <MisApuestas key={`historial-${refreshKey}`} />
          </div>
        )}

        {tabActiva === 'tabla' && (
          <div className="tab-wrapper-modern">
            <TablaPosiciones key={refreshKey} />
          </div>
        )}

        {tabActiva === 'historico' && (
          <div className="tab-wrapper-modern">
            <PartidosHistoricosPlus key={refreshKey} />
          </div>
        )}

        {tabActiva === 'roster' && (
          <div className="tab-wrapper-modern">
            <RosterJugadores key={refreshKey} />
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
