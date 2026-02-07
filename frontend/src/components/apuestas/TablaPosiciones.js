import React, { useState, useEffect } from 'react';
import { pronosticosService, configApuestasService, handleResponse } from '../../services/apiService';
import TeamLogo from '../common/TeamLogo';
import './TablaPosiciones.css';

const TablaPosiciones = () => {
  const [vistaActiva, setVistaActiva] = useState('tabla'); // 'tabla' o 'apuestas'

  // Tabla de posiciones
  const [tabla, setTabla] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [torneo, setTorneo] = useState('');
  const [fecha, setFecha] = useState('');

  // Apuestas por partido
  const [partidos, setPartidos] = useState([]);
  const [loadingApuestas, setLoadingApuestas] = useState(false);
  const [errorApuestas, setErrorApuestas] = useState('');
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState('');
  const [usuarios, setUsuarios] = useState([]);

  // Config
  const [apuestasHabilitadas, setApuestasHabilitadas] = useState(true);

  useEffect(() => {
    cargarConfiguracion();
    cargarTabla();
  }, []);

  const cargarConfiguracion = async () => {
    try {
      const response = await configApuestasService.getConfig();
      const data = await handleResponse(response);

      if (data.success) {
        setApuestasHabilitadas(data.config.apuestas_habilitadas === 'true');
      }
    } catch (err) {
      console.error('Error cargando configuración:', err);
    }
  };

  const cargarTabla = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await pronosticosService.getTablaPosiciones();
      const data = await handleResponse(response);

      setTabla(data.tabla || []);
      setTorneo(data.torneo || '');
      setFecha(data.fecha || '');

    } catch (err) {
      console.error('Error cargando tabla de posiciones:', err);
      setError(err.message || 'Error al cargar tabla de posiciones');
      setTabla([]);
    } finally {
      setLoading(false);
    }
  };

  const cargarApuestasPorPartido = async () => {
    try {
      setLoadingApuestas(true);
      setErrorApuestas('');

      const response = await pronosticosService.getApuestasPorPartido();
      const data = await handleResponse(response);

      setPartidos(data.partidos || []);
      setTorneo(data.torneo || '');
      setFecha(data.fecha || '');

      // Extraer lista única de usuarios de las apuestas
      const usuariosUnicos = new Map();
      (data.partidos || []).forEach(partido => {
        (partido.apuestas || []).forEach(apuesta => {
          if (!usuariosUnicos.has(apuesta.id_usuario)) {
            usuariosUnicos.set(apuesta.id_usuario, {
              id: apuesta.id_usuario,
              username: apuesta.username,
              nombre_completo: apuesta.nombre_completo
            });
          }
        });
      });

      setUsuarios(Array.from(usuariosUnicos.values()).sort((a, b) =>
        a.nombre_completo.localeCompare(b.nombre_completo)
      ));

    } catch (err) {
      console.error('Error cargando apuestas por partido:', err);
      setErrorApuestas(err.message || 'Error al cargar apuestas');
      setPartidos([]);
    } finally {
      setLoadingApuestas(false);
    }
  };

  const handleCambiarVista = (vista) => {
    setVistaActiva(vista);
    if (vista === 'apuestas' && partidos.length === 0) {
      cargarApuestasPorPartido();
    }
  };

  const getPosicionClass = (posicion) => {
    if (posicion === 1) return 'posicion-oro';
    if (posicion === 2) return 'posicion-plata';
    if (posicion === 3) return 'posicion-bronce';
    return '';
  };

  const getPosicionMedalla = (posicion) => {
    if (posicion === 1) return '🥇';
    if (posicion === 2) return '🥈';
    if (posicion === 3) return '🥉';
    return posicion;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTipoApuestaIcon = (tipo) => {
    const icons = {
      'local': '🏠',
      'empate': '🤝',
      'visita': '✈️'
    };
    return icons[tipo] || '❓';
  };

  const getEstadoBadgeClass = (estado) => {
    const classes = {
      'ganada': 'estado-ganada',
      'perdida': 'estado-perdida',
      'pendiente': 'estado-pendiente',
      'cancelada': 'estado-cancelada'
    };
    return classes[estado] || 'estado-pendiente';
  };

  // Render de loading y errores
  if (loading && vistaActiva === 'tabla') {
    return (
      <div className="tabla-posiciones-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando tabla de posiciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tabla-posiciones-container">
      {/* Tabs de navegación */}
      <div className="tabs-header">
        <button
          className={`tab-btn ${vistaActiva === 'tabla' ? 'active' : ''}`}
          onClick={() => handleCambiarVista('tabla')}
        >
          <span className="tab-icon">🏆</span>
          <span className="tab-label">Tabla de Posiciones</span>
        </button>
        <button
          className={`tab-btn ${vistaActiva === 'apuestas' ? 'active' : ''} ${apuestasHabilitadas ? 'disabled' : ''}`}
          onClick={() => !apuestasHabilitadas && handleCambiarVista('apuestas')}
          disabled={apuestasHabilitadas}
          title={apuestasHabilitadas ? 'Solo disponible cuando las apuestas están cerradas' : 'Ver apuestas de todos los usuarios'}
        >
          <span className="tab-icon">👥</span>
          <span className="tab-label">Apuestas por Partido</span>
          {apuestasHabilitadas && <span className="tab-lock">🔒</span>}
        </button>
      </div>

      {/* Vista: Tabla de Posiciones */}
      {vistaActiva === 'tabla' && (
        <>
          <div className="tabla-header">
            <h2 className="tabla-title">🏆 Tabla de Posiciones</h2>
            {fecha && (
              <p className="tabla-subtitle">
                Fecha {fecha} - Ranking basado en retornos con apuesta de $10,000 por partido
              </p>
            )}
          </div>

          {error && (
            <div className="error-message">{error}</div>
          )}

          {!error && tabla.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <p>No hay datos de apuestas para mostrar</p>
              <p className="empty-hint">Aún no hay usuarios con apuestas registradas</p>
            </div>
          )}

          {!error && tabla.length > 0 && (
            <>
              <div className="tabla-info">
                <div className="info-badge">
                  <span className="info-label">💰 Apuesta Base:</span>
                  <span className="info-value">$10,000</span>
                </div>
                <div className="info-badge">
                  <span className="info-label">📊 Total Usuarios:</span>
                  <span className="info-value">{tabla.length}</span>
                </div>
              </div>

              <div className="tabla-wrapper">
                <table className="tabla-posiciones">
                  <thead>
                    <tr>
                      <th className="col-posicion">Pos</th>
                      <th className="col-usuario">Usuario</th>
                      <th className="col-apuestas">Apuestas</th>
                      <th className="col-ganadas">Ganadas</th>
                      <th className="col-perdidas">Perdidas</th>
                      <th className="col-pendientes">Pendientes</th>
                      <th className="col-porcentaje">% Acierto</th>
                      <th className="col-puntos">Puntos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tabla.map((usuario) => (
                      <tr key={usuario.id_usuario} className={getPosicionClass(usuario.posicion)}>
                        <td className="col-posicion">
                          <span className="posicion-numero">
                            {getPosicionMedalla(usuario.posicion)}
                          </span>
                        </td>
                        <td className="col-usuario">
                          <div className="usuario-info">
                            <span className="usuario-username">{usuario.username}</span>
                            {usuario.nombre_completo && (
                              <span className="usuario-nombre">{usuario.nombre_completo}</span>
                            )}
                          </div>
                        </td>
                        <td className="col-apuestas text-center">
                          <span className="badge badge-total">{usuario.total_apuestas}</span>
                        </td>
                        <td className="col-ganadas text-center">
                          <span className="badge badge-ganadas">{usuario.apuestas_ganadas}</span>
                        </td>
                        <td className="col-perdidas text-center">
                          <span className="badge badge-perdidas">{usuario.apuestas_perdidas}</span>
                        </td>
                        <td className="col-pendientes text-center">
                          <span className="badge badge-pendientes">{usuario.apuestas_pendientes}</span>
                        </td>
                        <td className="col-porcentaje text-center">
                          <span className="porcentaje-valor">
                            {parseFloat(usuario.porcentaje_aciertos || 0).toFixed(1)}%
                          </span>
                        </td>
                        <td className="col-puntos text-right">
                          <span className="puntos-valor">
                            ${parseInt(usuario.puntos_totales || 0).toLocaleString('es-CL')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="tabla-footer">
                <p className="footer-note">
                  ℹ️ Los puntos se calculan multiplicando la apuesta base ($10,000) por la cuota de cada apuesta ganada
                </p>
              </div>
            </>
          )}
        </>
      )}

      {/* Vista: Apuestas por Partido */}
      {vistaActiva === 'apuestas' && (
        <>
          <div className="tabla-header">
            <h2 className="tabla-title">👥 Apuestas por Partido</h2>
            {fecha && (
              <p className="tabla-subtitle">
                Fecha {fecha} - Ver las apuestas por usuario
              </p>
            )}
          </div>

          {/* Selector de Usuario */}
          {!loadingApuestas && !errorApuestas && usuarios.length > 0 && (
            <div className="filtro-usuario-container">
              <label htmlFor="usuario-select" className="filtro-label">
                Seleccionar Usuario:
              </label>
              <select
                id="usuario-select"
                value={usuarioSeleccionado}
                onChange={(e) => setUsuarioSeleccionado(e.target.value)}
                className="filtro-usuario-select"
              >
                <option value="">-- Selecciona un usuario --</option>
                {usuarios.map((usuario) => (
                  <option key={usuario.id} value={usuario.id}>
                    {usuario.nombre_completo || usuario.username}
                  </option>
                ))}
              </select>
            </div>
          )}

          {!usuarioSeleccionado && !loadingApuestas && !errorApuestas && usuarios.length > 0 && (
            <div className="mensaje-seleccion">
              <p>Por favor selecciona un usuario para ver sus apuestas</p>
            </div>
          )}

          {loadingApuestas && (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Cargando apuestas...</p>
            </div>
          )}

          {errorApuestas && (
            <div className="error-message">{errorApuestas}</div>
          )}

          {!loadingApuestas && !errorApuestas && partidos.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">⚽</div>
              <p>No hay partidos con apuestas para mostrar</p>
              <p className="empty-hint">Aún no hay apuestas registradas</p>
            </div>
          )}

          {!loadingApuestas && !errorApuestas && partidos.length > 0 && usuarioSeleccionado && (
            <table className="tabla-simple">
              <thead>
                <tr>
                  <th>Partido</th>
                  <th>Apuesta</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {partidos.map((partido) => {
                  const apuestaUsuario = partido.apuestas.find(
                    a => a.id_usuario === parseInt(usuarioSeleccionado)
                  );

                  if (!apuestaUsuario) return null;

                  return (
                    <tr key={partido.ID_PARTIDO}>
                      <td>
                        {partido.equipo_local} vs {partido.equipo_visita}
                        {partido.GOLES_LOCAL !== null && partido.GOLES_VISITA !== null && (
                          <span className="resultado-inline"> ({partido.GOLES_LOCAL}-{partido.GOLES_VISITA})</span>
                        )}
                      </td>
                      <td>
                        {apuestaUsuario.tipo_apuesta === 'local' && partido.equipo_local}
                        {apuestaUsuario.tipo_apuesta === 'empate' && 'Empate'}
                        {apuestaUsuario.tipo_apuesta === 'visita' && partido.equipo_visita}
                      </td>
                      <td className={`estado-${apuestaUsuario.estado}`}>
                        {apuestaUsuario.estado === 'ganada' && 'Ganada'}
                        {apuestaUsuario.estado === 'perdida' && 'Perdida'}
                        {apuestaUsuario.estado === 'pendiente' && 'Pendiente'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
};

export default TablaPosiciones;
