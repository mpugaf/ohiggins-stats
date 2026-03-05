import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ApuestasPendientes from './ApuestasPendientes';
import MisApuestas from './MisApuestas';
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
      {/* Tabs de navegación - Rediseñadas */}
      <nav className="tabs-navigation-modern">
        <button
          className={`tab-button-modern ${tabActiva === 'pendientes' ? 'active' : ''}`}
          onClick={() => setTabActiva('pendientes')}
        >
          <span className="tab-label-modern">Apuestas</span>
          <span className="tab-description">Partidos activos</span>
        </button>

        <button
          className={`tab-button-modern ${tabActiva === 'historial' ? 'active' : ''}`}
          onClick={() => setTabActiva('historial')}
        >
          <span className="tab-label-modern">Mis Apuestas</span>
          <span className="tab-description">Mi historial</span>
        </button>

        <button
          className={`tab-button-modern ${tabActiva === 'tabla' ? 'active' : ''}`}
          onClick={() => setTabActiva('tabla')}
        >
          <span className="tab-label-modern">Clasificacion</span>
          <span className="tab-description">Ranking de usuarios</span>
        </button>

        <button
          className={`tab-button-modern ${tabActiva === 'historico' ? 'active' : ''}`}
          onClick={() => setTabActiva('historico')}
        >
          <span className="tab-label-modern">Eventos</span>
          <span className="tab-description">Partidos historicos</span>
        </button>

        <button
          className={`tab-button-modern ${tabActiva === 'roster' ? 'active' : ''}`}
          onClick={() => setTabActiva('roster')}
        >
          <span className="tab-label-modern">Roster</span>
          <span className="tab-description">Planteles</span>
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
