import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apuestasService, configApuestasService, handleResponse } from '../../services/apiService';
import './LimpiarApuestasUsuario.css';

function LimpiarApuestasUsuario() {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [limpiando, setLimpiando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [torneoActivo, setTorneoActivo] = useState(null);
  const [usuarioExpandido, setUsuarioExpandido] = useState(null);

  useEffect(() => {
    fetchDatos();
  }, []);

  const fetchDatos = async () => {
    try {
      setLoading(true);
      setError('');

      // Obtener configuración y torneos
      const [configResponse, torneosResponse] = await Promise.all([
        configApuestasService.getConfig(),
        configApuestasService.getTorneosFechas()
      ]);

      const configData = await handleResponse(configResponse);
      const torneosData = await handleResponse(torneosResponse);

      // Verificar si hay un torneo activo configurado
      if (!configData.config.torneo_activo_id) {
        setError('No hay un torneo activo configurado');
        setLoading(false);
        return;
      }

      // Buscar el torneo activo en la lista de torneos
      const torneoActivo = torneosData.torneos.find(
        t => t.ID_TORNEO.toString() === configData.config.torneo_activo_id
      );

      if (!torneoActivo) {
        setError('El torneo activo configurado no existe o no tiene partidos programados');
        setLoading(false);
        return;
      }

      setTorneoActivo(torneoActivo);

      // Obtener usuarios con sus apuestas del torneo activo
      const usuariosResponse = await apuestasService.getUsuariosConApuestas(torneoActivo.ID_TORNEO);
      const usuariosData = await handleResponse(usuariosResponse);

      setUsuarios(usuariosData.usuarios || []);

    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError(err.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleLimpiarApuestas = (usuario) => {
    setUsuarioSeleccionado(usuario);
    setError('');
    setMensaje('');
  };

  const confirmarLimpieza = async () => {
    if (!usuarioSeleccionado || !torneoActivo) return;

    setLimpiando(true);
    setError('');
    setMensaje('');

    try {
      const response = await apuestasService.limpiarApuestasUsuario(
        usuarioSeleccionado.id_usuario,
        torneoActivo.ID_TORNEO
      );
      const data = await handleResponse(response);

      setMensaje(
        `✅ ${data.message}\nApuestas eliminadas: ${data.apuestas_eliminadas}`
      );

      // Recargar datos
      setTimeout(() => {
        setUsuarioSeleccionado(null);
        setMensaje('');
        fetchDatos();
      }, 2000);

    } catch (err) {
      console.error('Error al limpiar apuestas:', err);
      setError(err.message || 'Error al limpiar apuestas');
    } finally {
      setLimpiando(false);
    }
  };

  const toggleExpandirUsuario = (idUsuario) => {
    setUsuarioExpandido(usuarioExpandido === idUsuario ? null : idUsuario);
  };

  const formatFecha = (fechaString) => {
    if (!fechaString) return 'N/A';
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEstadoBadgeClass = (estado) => {
    switch (estado) {
      case 'ganada': return 'badge-ganada';
      case 'perdida': return 'badge-perdida';
      case 'pendiente': return 'badge-pendiente';
      default: return 'badge-default';
    }
  };

  if (loading) {
    return (
      <div className="limpiar-apuestas-usuario-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!torneoActivo) {
    return (
      <div className="limpiar-apuestas-usuario-container">
        <div className="alert alert-warning">
          <h3>⚠️ No hay torneo activo</h3>
          <p>Para limpiar apuestas de usuarios, primero debes configurar un torneo activo en la sección de Configuración de Apuestas.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="limpiar-apuestas-usuario-container">
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Limpiar Apuestas de Usuario</h1>
          <p className="page-subtitle">
            Torneo activo: <strong>{torneoActivo.NOMBRE}</strong> - {torneoActivo.TEMPORADA}
          </p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {mensaje && (
        <div className="alert alert-success" style={{ whiteSpace: 'pre-line' }}>
          {mensaje}
        </div>
      )}

      {usuarios.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <p>No hay usuarios registrados con apuestas en este torneo</p>
        </div>
      ) : (
        <div className="usuarios-list">
          {usuarios.map(usuario => (
            <div key={usuario.id_usuario} className="usuario-card">
              <div className="usuario-header" onClick={() => toggleExpandirUsuario(usuario.id_usuario)}>
                <div className="usuario-info">
                  <div className="usuario-nombre">
                    <span className="username-badge">{usuario.username}</span>
                    <span className="nombre-completo">{usuario.nombre_completo || usuario.email}</span>
                  </div>
                  <div className="usuario-stats">
                    <span className="stat-item">
                      <strong>Total:</strong> {usuario.estadisticas.total_apuestas}
                    </span>
                    <span className="stat-item ganada">
                      <strong>Ganadas:</strong> {usuario.estadisticas.apuestas_ganadas}
                    </span>
                    <span className="stat-item perdida">
                      <strong>Perdidas:</strong> {usuario.estadisticas.apuestas_perdidas}
                    </span>
                    <span className="stat-item pendiente">
                      <strong>Pendientes:</strong> {usuario.estadisticas.apuestas_pendientes}
                    </span>
                    <span className="stat-item puntos">
                      <strong>Puntos:</strong> {parseFloat(usuario.estadisticas.total_puntos).toFixed(0)}
                    </span>
                  </div>
                </div>
                <div className="usuario-actions">
                  {usuario.estadisticas.total_apuestas > 0 && (
                    <button
                      className="btn-limpiar"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLimpiarApuestas(usuario);
                      }}
                      disabled={limpiando}
                    >
                      🗑️ Limpiar ({usuario.estadisticas.total_apuestas})
                    </button>
                  )}
                  <span className="expand-icon">
                    {usuarioExpandido === usuario.id_usuario ? '▼' : '▶'}
                  </span>
                </div>
              </div>

              {usuarioExpandido === usuario.id_usuario && usuario.apuestas.length > 0 && (
                <div className="usuario-apuestas">
                  <h4>Apuestas en este torneo:</h4>
                  <div className="apuestas-table-container">
                    <table className="apuestas-table">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Jornada</th>
                          <th>Partido</th>
                          <th>Predicción</th>
                          <th>Resultado</th>
                          <th>Cuota</th>
                          <th>Retorno</th>
                          <th>Estado</th>
                          <th>Puntos</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usuario.apuestas.map(apuesta => (
                          <tr key={apuesta.id_apuesta}>
                            <td>{formatFecha(apuesta.FECHA_PARTIDO)}</td>
                            <td>{apuesta.NUMERO_JORNADA || '-'}</td>
                            <td className="partido-cell">
                              {apuesta.equipo_local} vs {apuesta.equipo_visita}
                            </td>
                            <td className="prediccion-cell">
                              {apuesta.tipo_apuesta === 'local' && `🏠 ${apuesta.equipo_local}`}
                              {apuesta.tipo_apuesta === 'empate' && '🤝 Empate'}
                              {apuesta.tipo_apuesta === 'visita' && `✈️ ${apuesta.equipo_visita}`}
                            </td>
                            <td className="resultado-cell">
                              {apuesta.ESTADO_PARTIDO === 'FINALIZADO'
                                ? `${apuesta.GOLES_LOCAL} - ${apuesta.GOLES_VISITA}`
                                : '-'}
                            </td>
                            <td>{parseFloat(apuesta.valor_cuota).toFixed(2)}x</td>
                            <td>${parseFloat(apuesta.retorno_potencial).toLocaleString('es-CL')}</td>
                            <td>
                              <span className={`estado-badge ${getEstadoBadgeClass(apuesta.estado)}`}>
                                {apuesta.estado}
                              </span>
                            </td>
                            <td className="puntos-cell">
                              {parseFloat(apuesta.puntos_ganados || 0).toFixed(0)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {usuarioExpandido === usuario.id_usuario && usuario.apuestas.length === 0 && (
                <div className="usuario-apuestas">
                  <p className="no-apuestas">Este usuario no tiene apuestas en este torneo</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal de confirmación */}
      {usuarioSeleccionado && (
        <div className="modal-overlay" onClick={() => !limpiando && setUsuarioSeleccionado(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⚠️ Confirmar Limpieza de Apuestas</h3>
              <button
                className="btn-close"
                onClick={() => setUsuarioSeleccionado(null)}
                disabled={limpiando}
              >
                &times;
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-info">
                <div className="info-row">
                  <span className="info-label">Usuario:</span>
                  <span className="info-value">
                    <strong>{usuarioSeleccionado.username}</strong> ({usuarioSeleccionado.nombre_completo || usuarioSeleccionado.email})
                  </span>
                </div>

                <div className="info-row">
                  <span className="info-label">Torneo:</span>
                  <span className="info-value">{torneoActivo.NOMBRE}</span>
                </div>

                <div className="info-row">
                  <span className="info-label">Total de apuestas:</span>
                  <span className="info-value">
                    <strong>{usuarioSeleccionado.estadisticas.total_apuestas}</strong>
                  </span>
                </div>

                <div className="info-row">
                  <span className="info-label">Puntos acumulados:</span>
                  <span className="info-value">
                    <strong>{parseFloat(usuarioSeleccionado.estadisticas.total_puntos).toFixed(0)}</strong>
                  </span>
                </div>
              </div>

              <div className="modal-warning">
                <p>⚠️ Esta acción eliminará <strong>TODAS</strong> las apuestas de este usuario en el torneo activo.</p>
                <p>Se eliminarán:</p>
                <ul>
                  <li>✗ {usuarioSeleccionado.estadisticas.total_apuestas} apuestas (ganadas, perdidas y pendientes)</li>
                  <li>✗ Todo el historial de puntos ganados ({parseFloat(usuarioSeleccionado.estadisticas.total_puntos).toFixed(0)} puntos)</li>
                </ul>
                <p className="warning-critical"><strong>⚡ Esta acción no se puede deshacer.</strong></p>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-cancelar"
                onClick={() => setUsuarioSeleccionado(null)}
                disabled={limpiando}
              >
                Cancelar
              </button>
              <button
                className="btn-confirmar-limpiar"
                onClick={confirmarLimpieza}
                disabled={limpiando}
              >
                {limpiando ? 'Limpiando...' : '🗑️ Confirmar Limpieza'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LimpiarApuestasUsuario;
