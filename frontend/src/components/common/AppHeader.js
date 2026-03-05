import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api, handleResponse } from '../../services/apiService';
import ChangePasswordModal from './ChangePasswordModal';
import './AppHeader.css';

const AppHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  // No mostrar header en páginas públicas - VERIFICAR PRIMERO
  const publicRoutes = ['/login', '/register', '/'];
  const isPublicRoute = publicRoutes.includes(location.pathname);

  const [configApuestas, setConfigApuestas] = useState(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isInstruccionesOpen, setIsInstruccionesOpen] = useState(false);

  useEffect(() => {
    // Solo cargar si NO es ruta pública
    if (isPublicRoute) {
      return;
    }

    // Cargar inmediatamente al montar
    cargarConfigApuestas();

    // Configurar polling cada 30 segundos para sincronización automática
    const intervalId = setInterval(() => {
      cargarConfigApuestas();
    }, 30000); // 30 segundos

    // Cleanup: limpiar intervalo cuando se desmonta
    return () => {
      clearInterval(intervalId);
    };
  }, [isPublicRoute]);

  const cargarConfigApuestas = async () => {
    try {
      const response = await api.get('/api/config-apuestas');
      const data = await handleResponse(response);
      setConfigApuestas(data.config);
    } catch (error) {
      console.error('Error al cargar configuración de apuestas:', error);
      // Silenciar error para evitar loops infinitos
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleGoToDashboard = () => {
    if (user?.role === 'admin') {
      navigate('/dashboard');
    } else {
      navigate('/partidos-apuestas');
    }
  };

  const showBackButton = () => {
    if (user?.role === 'admin') {
      return location.pathname !== '/dashboard';
    } else {
      return location.pathname !== '/partidos-apuestas';
    }
  };

  const apuestasHabilitadas = configApuestas?.apuestas_habilitadas === 'true';

  // Early return para rutas públicas
  if (isPublicRoute) {
    return null;
  }

  return (
    <>
      {/* Aviso de Apuestas - Parte Superior */}
      {configApuestas && user?.role !== 'admin' && (
        <div className={`apuestas-banner ${
          apuestasHabilitadas && configApuestas.torneo_activo_id
            ? 'habilitadas'
            : 'deshabilitadas'
        }`}>
          <div className="apuestas-banner-content">
            <div className={`banner-icon ${
              apuestasHabilitadas && configApuestas.torneo_activo_id ? 'icon-enabled' : 'icon-disabled'
            }`}>
              {apuestasHabilitadas && configApuestas.torneo_activo_id ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
              )}
            </div>
            <div className="banner-text">
              <span className="banner-title">
                {apuestasHabilitadas && configApuestas.torneo_activo_id
                  ? 'APUESTAS HABILITADAS'
                  : apuestasHabilitadas
                  ? 'APUESTAS NO CONFIGURADAS'
                  : 'APUESTAS DESHABILITADAS'}
              </span>
              <span className="banner-subtitle">
                {apuestasHabilitadas && configApuestas.torneo_activo_id
                  ? `Torneo: ${configApuestas.torneo_activo_nombre || 'Sin especificar'}${configApuestas.fecha_habilitada ? ` | Fecha: ${configApuestas.fecha_habilitada}` : ''}`
                  : apuestasHabilitadas
                  ? 'El administrador debe configurar un torneo activo'
                  : 'Las apuestas están pausadas temporalmente - Vuelve pronto'}
              </span>
            </div>
            <div className="banner-status">
              <div className={`status-dot ${
                apuestasHabilitadas && configApuestas.torneo_activo_id ? 'active' : 'inactive'
              }`}></div>
            </div>
          </div>
        </div>
      )}

      {/* Header Principal */}
      <div className="app-header-modern">
        {/* Fondo animado */}
        <div className="header-background">
          <div className="header-particle header-particle-1"></div>
          <div className="header-particle header-particle-2"></div>
          <div className="header-particle header-particle-3"></div>
        </div>

        <div className="app-header-content-modern">
          {/* Lado Izquierdo */}
          <div className="app-header-left-modern">
            {showBackButton() && (
              <button
                onClick={handleGoToDashboard}
                className="btn-back-modern"
                title={user?.role === 'admin' ? 'Volver al Dashboard' : 'Volver a Inicio'}
              >
                <span className="btn-icon">🏠</span>
                <span className="btn-text">{user?.role === 'admin' ? 'Dashboard' : 'Inicio'}</span>
              </button>
            )}

            <div className="app-brand">
              <div className="brand-logo">
                <img src="/images/equipos/ohiggins.png" alt="O'Higgins" className="brand-badge" />
                <div className="brand-glow"></div>
              </div>
              <div className="brand-text">
                <span className="brand-name">O'HIGGINS STATS</span>
                <span className="brand-subtitle">Por los hinchas, para los hinchas</span>
              </div>
            </div>
          </div>

          {/* Lado Derecho */}
          <div className="app-header-right-modern">
            {user?.role !== 'admin' && (
              <button
                onClick={() => setIsInstruccionesOpen(true)}
                className="btn-instrucciones-modern"
                title="Ver instrucciones del sistema"
              >
                <span className="btn-text">Instrucciones</span>
              </button>
            )}

            <div
              className="user-card-modern"
              onClick={() => setIsPasswordModalOpen(true)}
              title="Cambiar contraseña"
            >
              <div className="user-avatar-modern">
                <span className="avatar-initials">
                  {(user?.nombre_completo || user?.username || 'U').substring(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="user-info-modern">
                <span className="user-name-modern">
                  {user?.nombre_completo || user?.username || 'Usuario'}
                </span>
                <span className="user-role-modern">
                  {user?.role === 'admin' ? 'ADMINISTRADOR' : 'USUARIO'}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="btn-logout-modern"
              title="Cerrar sesión"
            >
              <svg className="logout-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              <span className="btn-text">CERRAR SESIÓN</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Cambio de Contraseña */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        username={user?.username || ''}
      />

      {/* Modal de Instrucciones */}
      {isInstruccionesOpen && (
        <div className="instrucciones-overlay" onClick={() => setIsInstruccionesOpen(false)}>
          <div className="instrucciones-modal" onClick={e => e.stopPropagation()}>
            <div className="instrucciones-bg-image">
              <img src="/images/equipos/ohiggins.png" alt="" aria-hidden="true" />
            </div>
            <div className="instrucciones-content">
              <div className="instrucciones-header">
                <h2 className="instrucciones-title">Instrucciones — O'Higgins Stats-Bet</h2>
                <button className="instrucciones-close" onClick={() => setIsInstruccionesOpen(false)} title="Cerrar">✕</button>
              </div>

              <div className="instrucciones-body">
                <p>
                  <strong>O'Higgins Stats-Bet</strong> es un proyecto para hinchas cuyo objetivo es descubrir
                  quién sabe más, a través de apuestas <strong>sin dinero real</strong>, pero con la misma emoción
                  de predecir resultados que aún no ocurren. Las ganancias simuladas se suman en una
                  <strong> tabla de posiciones por usuario</strong>, visible para todos.
                </p>

                <h3>¿Cómo funciona cada apuesta?</h3>
                <p>
                  Por cada partido de la fecha en juego se entregan <strong>$10.000 pesos virtuales</strong> para apostar
                  por el equipo local, el equipo visita o por empate. Cada pronóstico tiene una cuota visible
                  en el partido; si aciertas, tus $10.000 se multiplican por esa cuota.
                </p>

                <h3>Fechas y torneos</h3>
                <p>
                  Las apuestas son por fecha/jornada y están disponibles para cada torneo que dispute O'Higgins.
                  Se habilitan una vez que las cuotas están definidas y se cierran antes del inicio del
                  primer partido de la fecha. Mientras están abiertas, <strong>nadie puede ver las apuestas de otro usuario</strong>.
                  Una vez cerradas, todos los pronósticos quedan visibles para transparencia y entendimiento
                  del puntaje de cada jugador.
                </p>

                <h3>Premio del ganador de cada fecha</h3>
                <p>
                  El ganador de cada fecha tendrá un espacio en el módulo de <strong>Tabla de Posiciones</strong> para
                  escribir un texto libre que celebre su triunfo. Estos mensajes se acumulan de forma
                  secuencial, formando un <em>mural de campeones</em>.
                </p>

                <h3>Registro y privacidad</h3>
                <p>
                  Para mantener la comunidad controlada, la única forma de registrarse es mediante un
                  <strong> link de uso único</strong> enviado por el administrador. No se solicita correo electrónico;
                  la contraseña es tuya y solo tuya, protegida con JWT.
                </p>

                <h3>Módulos disponibles</h3>
                <ul>
                  <li>
                    <strong>Historial completo:</strong> Revisa tus apuestas anteriores filtrando por torneo
                    y fecha, con ganancia o pérdida de cada una.
                  </li>
                  <li>
                    <strong>Tabla de posiciones:</strong> Ranking global o por fecha de cada torneo.
                    Incluye sub-módulo de <em>Apuestas por partido</em> (visible solo con apuestas cerradas)
                    y <em>Mis estadísticas</em> con apuestas ganadas, perdidas, pendientes, ganancia acumulada
                    y porcentaje de aciertos.
                  </li>
                  <li>
                    <strong>Partidos históricos:</strong> Reporte de todos los partidos registrados.
                    Filtra por torneo, equipo, fecha puntual o rango de fechas.
                  </li>
                  <li>
                    <strong>Roster de jugadores:</strong> Consulta la plantilla de un equipo o activa el
                    <em> modo comparación</em> para comparar dos plantillas lado a lado, ordenadas por posición.
                  </li>
                </ul>

                <p className="instrucciones-slogan">
                  ¡A DEMOSTRAR QUIÉN ES EL CAPO QUE MÁS SABE!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AppHeader;
