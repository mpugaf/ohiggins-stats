import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, configApuestasService, handleResponse } from '../../services/apiService';
import './LimpiarResultados.css';

function LimpiarResultados() {
  const navigate = useNavigate();
  const [torneos, setTorneos] = useState([]);
  const [torneoSeleccionado, setTorneoSeleccionado] = useState('');
  const [fechasDisponibles, setFechasDisponibles] = useState([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState('');
  const [partidosAfectados, setPartidosAfectados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [limpiando, setLimpiando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

  useEffect(() => {
    cargarTorneos();
  }, []);

  const cargarTorneos = async () => {
    try {
      setLoading(true);
      const response = await configApuestasService.getTorneosFechas();
      const data = await handleResponse(response);
      setTorneos(data.torneos || []);
    } catch (err) {
      console.error('Error al cargar torneos:', err);
      setError('Error al cargar torneos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTorneoChange = async (e) => {
    const torneoId = e.target.value;
    setTorneoSeleccionado(torneoId);
    setFechaSeleccionada('');
    setPartidosAfectados([]);
    setError('');
    setMensaje('');

    if (!torneoId) {
      setFechasDisponibles([]);
      return;
    }

    const torneoEncontrado = torneos.find(t => t.ID_TORNEO.toString() === torneoId);
    if (torneoEncontrado && torneoEncontrado.fechas) {
      setFechasDisponibles(torneoEncontrado.fechas);
    } else {
      setFechasDisponibles([]);
    }
  };

  const handleFechaChange = (e) => {
    setFechaSeleccionada(e.target.value);
    setPartidosAfectados([]);
    setError('');
    setMensaje('');
  };

  const verificarPartidosAfectados = async () => {
    if (!torneoSeleccionado || !fechaSeleccionada) {
      setError('Debes seleccionar un torneo y una fecha');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Construir URL con query parameters manualmente (fetch no maneja params automáticamente)
      const response = await api.get(`/api/apuestas/partidos-por-fecha?torneoId=${torneoSeleccionado}&fecha=${fechaSeleccionada}`);

      const data = await handleResponse(response);
      setPartidosAfectados(data.partidos || []);

      if (data.partidos && data.partidos.length > 0) {
        setMostrarConfirmacion(true);
      } else {
        setError('No se encontraron partidos para este torneo y fecha');
      }
    } catch (err) {
      console.error('Error al verificar partidos:', err);
      setError('Error al verificar partidos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmarLimpieza = async () => {
    if (!torneoSeleccionado || !fechaSeleccionada) return;

    setLimpiando(true);
    setError('');
    setMensaje('');

    try {
      const response = await api.post('/api/apuestas/limpiar-resultados', {
        torneoId: torneoSeleccionado,
        fecha: fechaSeleccionada
      });

      const data = await handleResponse(response);

      const torneoNombre = torneos.find(t => t.ID_TORNEO.toString() === torneoSeleccionado)?.NOMBRE || 'Torneo';

      setMensaje(
        `✅ ${data.message}\n` +
        `Torneo: ${torneoNombre}\n` +
        `Fecha: ${fechaSeleccionada}\n` +
        `Partidos afectados: ${data.partidos_actualizados}\n` +
        `Apuestas marcadas como pendientes: ${data.apuestas_actualizadas || 0}`
      );

      // Limpiar selecciones después de 3 segundos
      setTimeout(() => {
        setMostrarConfirmacion(false);
        setPartidosAfectados([]);
        setTorneoSeleccionado('');
        setFechaSeleccionada('');
        setMensaje('');
      }, 5000);

    } catch (err) {
      console.error('Error al limpiar resultados:', err);
      setError(err.message || 'Error al limpiar resultados');
    } finally {
      setLimpiando(false);
    }
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

  return (
    <div className="limpiar-resultados-container">
      <div className="page-header">
        <button onClick={() => navigate('/dashboard')} className="btn-back">
          ← Volver al Dashboard
        </button>
        <div className="page-header-content">
          <h1 className="page-title">🔄 Limpiar Resultados de Partidos</h1>
          <p className="page-subtitle">
            Permite limpiar los resultados de partidos para modo "replay" de apuestas
          </p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">❌</span>
          {error}
        </div>
      )}

      {mensaje && (
        <div className="alert alert-success" style={{ whiteSpace: 'pre-line' }}>
          <span className="alert-icon">✅</span>
          {mensaje}
        </div>
      )}

      <div className="info-section">
        <div className="info-box">
          <h3>ℹ️ ¿Qué hace esta funcionalidad?</h3>
          <ul>
            <li>✅ Limpia los resultados (goles) de partidos de una fecha específica</li>
            <li>✅ Marca todos los partidos como "PROGRAMADO" (sin finalizar)</li>
            <li>✅ Marca todas las apuestas de esos partidos como "PENDIENTE"</li>
            <li>✅ Permite que usuarios nuevos apuesten en fechas pasadas</li>
            <li>✅ Útil para hacer "replay" del sistema de apuestas</li>
          </ul>
        </div>

        <div className="warning-box">
          <h3>⚠️ Advertencia</h3>
          <p>Esta acción NO elimina apuestas, solo limpia los resultados de los partidos.</p>
          <p>Las apuestas existentes quedarán marcadas como "pendientes" nuevamente.</p>
          <p className="warning-critical">⚡ Esta acción no se puede deshacer automáticamente.</p>
        </div>
      </div>

      <div className="form-section">
        <div className="form-card">
          <h3>Seleccionar Partidos a Limpiar</h3>

          <div className="form-group">
            <label className="form-label">
              <strong>1. Seleccionar Torneo:</strong>
            </label>
            <select
              className="form-select"
              value={torneoSeleccionado}
              onChange={handleTorneoChange}
              disabled={loading || limpiando}
            >
              <option value="">-- Seleccionar Torneo --</option>
              {torneos.map(torneo => (
                <option key={torneo.ID_TORNEO} value={torneo.ID_TORNEO}>
                  {torneo.NOMBRE} - {torneo.TEMPORADA}
                </option>
              ))}
            </select>
          </div>

          {fechasDisponibles.length > 0 && (
            <div className="form-group">
              <label className="form-label">
                <strong>2. Seleccionar Fecha/Jornada:</strong>
              </label>
              <select
                className="form-select"
                value={fechaSeleccionada}
                onChange={handleFechaChange}
                disabled={loading || limpiando}
              >
                <option value="">-- Seleccionar Fecha --</option>
                {fechasDisponibles.map(fecha => (
                  <option key={fecha} value={fecha}>
                    Fecha {fecha}
                  </option>
                ))}
              </select>
            </div>
          )}

          {torneoSeleccionado && fechaSeleccionada && !mostrarConfirmacion && (
            <div className="form-actions">
              <button
                className="btn-verificar"
                onClick={verificarPartidosAfectados}
                disabled={loading || limpiando}
              >
                {loading ? 'Verificando...' : '🔍 Verificar Partidos Afectados'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de confirmación */}
      {mostrarConfirmacion && partidosAfectados.length > 0 && (
        <div className="modal-overlay" onClick={() => !limpiando && setMostrarConfirmacion(false)}>
          <div className="modal-content-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⚠️ Confirmar Limpieza de Resultados</h3>
              <button
                className="btn-close"
                onClick={() => setMostrarConfirmacion(false)}
                disabled={limpiando}
              >
                &times;
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-info">
                <div className="info-row">
                  <span className="info-label">Torneo:</span>
                  <span className="info-value">
                    <strong>{torneos.find(t => t.ID_TORNEO.toString() === torneoSeleccionado)?.NOMBRE}</strong>
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Fecha/Jornada:</span>
                  <span className="info-value">
                    <strong>Fecha {fechaSeleccionada}</strong>
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Partidos afectados:</span>
                  <span className="info-value">
                    <strong>{partidosAfectados.length}</strong>
                  </span>
                </div>
              </div>

              <div className="partidos-afectados">
                <h4>Partidos que serán limpiados:</h4>
                <div className="partidos-list">
                  {partidosAfectados.map((partido, index) => (
                    <div key={partido.ID_PARTIDO} className="partido-item">
                      <span className="partido-numero">{index + 1}.</span>
                      <span className="partido-info">
                        {partido.equipo_local} vs {partido.equipo_visita}
                      </span>
                      <span className="partido-resultado">
                        {partido.ESTADO_PARTIDO === 'FINALIZADO'
                          ? `(${partido.GOLES_LOCAL} - ${partido.GOLES_VISITA})`
                          : `(${partido.ESTADO_PARTIDO})`
                        }
                      </span>
                      <span className="partido-fecha">
                        {formatFecha(partido.FECHA_PARTIDO)}
                      </span>
                      {partido.total_apuestas > 0 && (
                        <span className="partido-apuestas">
                          {partido.total_apuestas} apuesta{partido.total_apuestas !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-warning">
                <p>⚠️ Esta acción realizará los siguientes cambios:</p>
                <ul>
                  <li>🔄 Marcará {partidosAfectados.length} partido{partidosAfectados.length !== 1 ? 's' : ''} como "PROGRAMADO"</li>
                  <li>🔄 Limpiará los goles (se establecerán en NULL)</li>
                  <li>🔄 Marcará todas las apuestas de estos partidos como "PENDIENTE"</li>
                  <li>🔄 Restablecerá los puntos ganados a 0</li>
                </ul>
                <p className="warning-critical">
                  <strong>⚡ Los usuarios podrán apostar nuevamente en estos partidos si la fecha está habilitada.</strong>
                </p>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-cancelar"
                onClick={() => setMostrarConfirmacion(false)}
                disabled={limpiando}
              >
                Cancelar
              </button>
              <button
                className="btn-confirmar-limpiar"
                onClick={confirmarLimpieza}
                disabled={limpiando}
              >
                {limpiando ? 'Limpiando...' : '🔄 Confirmar Limpieza de Resultados'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LimpiarResultados;
