import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AppHeader.css';

const AppHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  // No mostrar header en páginas públicas
  const publicRoutes = ['/login', '/register', '/'];
  if (publicRoutes.includes(location.pathname)) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleGoToDashboard = () => {
    // Para usuarios admin, ir al dashboard
    // Para usuarios normales, ir a partidos-apuestas
    if (user?.role === 'admin') {
      navigate('/dashboard');
    } else {
      navigate('/partidos-apuestas');
    }
  };

  // Determinar si mostrar el botón de volver
  const showBackButton = () => {
    if (user?.role === 'admin') {
      return location.pathname !== '/dashboard';
    } else {
      return location.pathname !== '/partidos-apuestas';
    }
  };

  return (
    <div className="app-header">
      <div className="app-header-content">
        <div className="app-header-left">
          {showBackButton() && (
            <button
              onClick={handleGoToDashboard}
              className="btn-back-dashboard"
              title={user?.role === 'admin' ? 'Volver al Dashboard' : 'Volver a Partidos y Apuestas'}
            >
              🏠 {user?.role === 'admin' ? 'Dashboard' : 'Inicio'}
            </button>
          )}
          <div className="app-title">
            <span className="app-logo">⚽</span>
            <span className="app-name">O'Higgins Stats</span>
          </div>
        </div>

        <div className="app-header-right">
          <div className="user-info-header">
            <div className="user-avatar">
              {user?.role === 'admin' ? '👑' : '🎯'}
            </div>
            <div className="user-details">
              <span className="user-name-header">
                {user?.nombre_completo || user?.username || 'Usuario'}
              </span>
              <span className="user-role-header">
                {user?.role === 'admin' ? 'Administrador' : 'Usuario'}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="btn-logout-header"
            title="Cerrar sesión"
          >
            🚪 Salir
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppHeader;
