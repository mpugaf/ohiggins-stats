import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  torneoJugadorService,
  torneosService,
  equiposService,
  handleResponse
} from '../services/apiService';
import './ClonarAsignaciones.css';

const ClonarAsignaciones = () => {
  const navigate = useNavigate();

  const [torneos, setTorneos] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [torneoOrigen, setTorneoOrigen] = useState('');
  const [torneoDestino, setTorneoDestino] = useState('');
  const [equipoOrigen, setEquipoOrigen] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [infoTorneoOrigen, setInfoTorneoOrigen] = useState(null);
  const [infoTorneoDestino, setInfoTorneoDestino] = useState(null);

  // Selección de jugadores (tabla inline)
  const [jugadoresDisponibles, setJugadoresDisponibles] = useState([]);
  const [jugadoresSeleccionados, setJugadoresSeleccionados] = useState([]);
  const [loadingJugadores, setLoadingJugadores] = useState(false);

  // Modal de confirmación
  const [showConfirmacion, setShowConfirmacion] = useState(false);
  const [confirmacionData, setConfirmacionData] = useState(null);

  const [resultado, setResultado] = useState(null);

  useEffect(() => {
    cargarTorneos();
    cargarEquipos();
  }, []);

  const cargarTorneos = async () => {
    try {
      const response = await torneosService.getAll();
      const data = await handleResponse(response);
      setTorneos(data);
    } catch (err) {
      console.error('Error al cargar torneos:', err);
      setError('Error al cargar torneos');
    }
  };

  const cargarEquipos = async () => {
    try {
      const response = await equiposService.getAll();
      const data = await handleResponse(response);
      setEquipos(data);
    } catch (err) {
      console.error('Error al cargar equipos:', err);
      setError('Error al cargar equipos');
    }
  };

  const verificarTorneo = async (idTorneo, tipo) => {
    if (!idTorneo) {
      if (tipo === 'origen') setInfoTorneoOrigen(null);
      if (tipo === 'destino') setInfoTorneoDestino(null);
      return;
    }

    try {
      const response = await torneoJugadorService.verificarAsignacionesTorneo(idTorneo);
      const data = await handleResponse(response);

      const torneo = torneos.find(t => t.ID_TORNEO === parseInt(idTorneo));
      const info = {
        ...torneo,
        totalAsignaciones: data.totalAsignaciones,
        tieneAsignaciones: data.tieneAsignaciones
      };

      if (tipo === 'origen') {
        setInfoTorneoOrigen(info);
      } else {
        setInfoTorneoDestino(info);
      }
    } catch (err) {
      console.error(`Error al verificar torneo ${tipo}:`, err);
    }
  };

  const handleOrigenChange = (e) => {
    const value = e.target.value;
    setTorneoOrigen(value);
    verificarTorneo(value, 'origen');
    setResultado(null);
    setError('');
    setSuccessMessage('');
  };

  const handleDestinoChange = (e) => {
    const value = e.target.value;
    setTorneoDestino(value);
    verificarTorneo(value, 'destino');
    setResultado(null);
    setError('');
    setSuccessMessage('');
  };

  const handleEquipoChange = async (e) => {
    const value = e.target.value;
    setEquipoOrigen(value);
    setResultado(null);
    setError('');
    setSuccessMessage('');

    // Cargar jugadores automáticamente cuando se selecciona el equipo
    if (value && torneoOrigen) {
      await cargarJugadoresEquipo(parseInt(torneoOrigen), parseInt(value));
    } else {
      setJugadoresDisponibles([]);
      setJugadoresSeleccionados([]);
    }
  };

  const cargarJugadoresEquipo = async (idTorneo, idEquipo) => {
    setError('');
    setSuccessMessage('');

    try {
      setLoadingJugadores(true);

      // Obtener jugadores del equipo en el torneo origen
      const response = await torneoJugadorService.getJugadoresPorEquipoYTorneo(
        idTorneo,
        idEquipo
      );
      const data = await handleResponse(response);

      if (!data.jugadores || data.jugadores.length === 0) {
        setError('No se encontraron jugadores para el equipo seleccionado en el torneo origen');
        setJugadoresDisponibles([]);
        setJugadoresSeleccionados([]);
        return;
      }

      // Marcar todos los jugadores como seleccionados por defecto
      setJugadoresDisponibles(data.jugadores);
      setJugadoresSeleccionados(data.jugadores.map(j => j.ID_JUGADOR));

    } catch (err) {
      console.error('Error al obtener jugadores:', err);
      setError(err.message || 'Error al obtener jugadores del equipo');
      setJugadoresDisponibles([]);
      setJugadoresSeleccionados([]);
    } finally {
      setLoadingJugadores(false);
    }
  };

  const toggleJugador = (idJugador) => {
    setJugadoresSeleccionados(prev => {
      if (prev.includes(idJugador)) {
        return prev.filter(id => id !== idJugador);
      } else {
        return [...prev, idJugador];
      }
    });
  };

  const toggleTodos = () => {
    if (jugadoresSeleccionados.length === jugadoresDisponibles.length) {
      // Deseleccionar todos
      setJugadoresSeleccionados([]);
    } else {
      // Seleccionar todos
      setJugadoresSeleccionados(jugadoresDisponibles.map(j => j.ID_JUGADOR));
    }
  };

  const handleClonar = async (forzar = false) => {
    // Validaciones
    if (!torneoOrigen) {
      setError('Debe seleccionar un torneo origen');
      return;
    }

    if (!torneoDestino) {
      setError('Debe seleccionar un torneo destino');
      return;
    }

    if (!equipoOrigen) {
      setError('Debe seleccionar un equipo');
      return;
    }

    if (torneoOrigen === torneoDestino) {
      setError('El torneo origen y destino no pueden ser el mismo');
      return;
    }

    if (jugadoresSeleccionados.length === 0) {
      setError('Debe seleccionar al menos un jugador');
      return;
    }

    try {
      setLoading(true);

      const response = await torneoJugadorService.clonarAsignaciones({
        idTorneoOrigen: parseInt(torneoOrigen),
        idTorneoDestino: parseInt(torneoDestino),
        idEquipo: parseInt(equipoOrigen),
        jugadoresIds: jugadoresSeleccionados,
        forzar
      });

      // Manejar respuesta: si es 409, puede ser solicitud de confirmación
      let data;
      if (response.status === 409) {
        // Conflict - puede requerir confirmación
        data = await response.json();

        // Si requiere confirmación, mostrar modal
        if (data.requiresConfirmation && !forzar) {
          setConfirmacionData(data);
          setShowConfirmacion(true);
          setLoading(false);
          return;
        }

        // Si no es confirmación, es un error real
        throw new Error(data.error || data.message || 'Error al clonar asignaciones');
      } else {
        // Respuesta exitosa o error diferente
        data = await handleResponse(response);
      }

      // Éxito
      setSuccessMessage(data.message);
      setResultado(data);

      // Actualizar información de torneos
      await verificarTorneo(torneoOrigen, 'origen');
      await verificarTorneo(torneoDestino, 'destino');

      // Limpiar formulario después de 5 segundos
      setTimeout(() => {
        setTorneoOrigen('');
        setTorneoDestino('');
        setEquipoOrigen('');
        setInfoTorneoOrigen(null);
        setInfoTorneoDestino(null);
        setResultado(null);
        setJugadoresDisponibles([]);
        setJugadoresSeleccionados([]);
      }, 5000);

    } catch (err) {
      console.error('Error al clonar asignaciones:', err);
      setError(err.message || 'Error al clonar asignaciones');
    } finally {
      setLoading(false);
    }
  };

  const confirmarClonacion = () => {
    setShowConfirmacion(false);
    setConfirmacionData(null);
    handleClonar(true);
  };

  const cancelarConfirmacion = () => {
    setShowConfirmacion(false);
    setConfirmacionData(null);
  };

  return (
    <div className="clonar-asignaciones">
      <div className="clonar-header">
        <button onClick={() => navigate('/asignaciones')} className="back-btn">
          ← Volver a Asignaciones
        </button>
        <h1>🔄 Clonar Asignaciones entre Torneos</h1>
        <p>Copie las asignaciones de jugadores de un equipo en un torneo a otro torneo</p>
      </div>

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">❌</span>
          <span>{error}</span>
          <button onClick={() => setError('')} className="alert-close">✕</button>
        </div>
      )}

      {successMessage && (
        <div className="alert alert-success">
          <span className="alert-icon">✅</span>
          <span>{successMessage}</span>
        </div>
      )}

      <div className="clonar-form-container">
        <div className="form-row-side-by-side">
          {/* Torneo Origen */}
          <div className="form-group">
            <label htmlFor="torneoOrigen">
              <span className="label-icon">📤</span>
              Torneo Origen
              <span className="label-required">*</span>
            </label>
            <select
              id="torneoOrigen"
              value={torneoOrigen}
              onChange={handleOrigenChange}
              className="form-select"
              disabled={loading}
            >
              <option value="">Seleccione torneo origen...</option>
              {torneos.map((t) => (
                <option key={t.ID_TORNEO} value={t.ID_TORNEO}>
                  {t.NOMBRE} - {t.TEMPORADA} {t.RUEDA ? `(${t.RUEDA})` : ''}
                </option>
              ))}
            </select>
            {infoTorneoOrigen && (
              <div className="torneo-info">
                <div className="info-badge">
                  📊 {infoTorneoOrigen.totalAsignaciones} asignaciones
                </div>
                {infoTorneoOrigen.totalAsignaciones === 0 && (
                  <div className="info-warning">
                    ⚠️ Este torneo no tiene asignaciones
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Torneo Destino */}
          <div className="form-group">
            <label htmlFor="torneoDestino">
              <span className="label-icon">📥</span>
              Torneo Destino
              <span className="label-required">*</span>
            </label>
            <select
              id="torneoDestino"
              value={torneoDestino}
              onChange={handleDestinoChange}
              className="form-select"
              disabled={loading}
            >
              <option value="">Seleccione torneo destino...</option>
              {torneos.map((t) => (
                <option
                  key={t.ID_TORNEO}
                  value={t.ID_TORNEO}
                  disabled={t.ID_TORNEO === parseInt(torneoOrigen)}
                >
                  {t.NOMBRE} - {t.TEMPORADA} {t.RUEDA ? `(${t.RUEDA})` : ''}
                </option>
              ))}
            </select>
            {infoTorneoDestino && (
              <div className="torneo-info">
                <div className="info-badge">
                  📊 {infoTorneoDestino.totalAsignaciones} asignaciones existentes
                </div>
                {infoTorneoDestino.tieneAsignaciones && (
                  <div className="info-warning">
                    ⚠️ Este torneo ya tiene asignaciones (se pedirá confirmación)
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Selector de Equipo */}
        <div className="form-group">
          <label htmlFor="equipoOrigen">
            <span className="label-icon">⚽</span>
            Equipo
            <span className="label-required">*</span>
          </label>
          <select
            id="equipoOrigen"
            value={equipoOrigen}
            onChange={handleEquipoChange}
            className="form-select"
            disabled={loading}
          >
            <option value="">Seleccione el equipo...</option>
            {equipos.map((e) => (
              <option key={e.ID_EQUIPO} value={e.ID_EQUIPO}>
                {e.NOMBRE} {e.APODO ? `(${e.APODO})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="form-info-box">
          <div className="info-icon">ℹ️</div>
          <div className="info-content">
            <h4>¿Cómo funciona?</h4>
            <ol>
              <li>Seleccione el torneo origen y el torneo destino</li>
              <li>Seleccione el equipo cuyos jugadores desea clonar</li>
              <li>Se mostrará automáticamente la lista de jugadores asignados al equipo en el torneo origen</li>
              <li>Todos los jugadores vienen marcados por defecto</li>
              <li>Desmarque los que NO desea asignar al torneo destino</li>
              <li>Confirme la clonación</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Tabla de jugadores disponibles */}
      {loadingJugadores && (
        <div className="jugadores-loading">
          <span className="spinner"></span>
          <p>Cargando jugadores...</p>
        </div>
      )}

      {!loadingJugadores && jugadoresDisponibles.length > 0 && (
        <div className="jugadores-section">
          <div className="jugadores-header">
            <h3>👥 Jugadores del Equipo en Torneo Origen</h3>
            <div className="jugadores-info">
              <span className="badge">
                Total: {jugadoresDisponibles.length}
              </span>
              <span className="badge badge-primary">
                Seleccionados: {jugadoresSeleccionados.length}
              </span>
            </div>
          </div>

          <div className="jugadores-actions">
            <button onClick={toggleTodos} className="btn btn-secondary">
              {jugadoresSeleccionados.length === jugadoresDisponibles.length
                ? '❌ Deseleccionar Todos'
                : '✅ Seleccionar Todos'}
            </button>
          </div>

          <div className="jugadores-table-container">
            <table className="jugadores-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>
                    <input
                      type="checkbox"
                      checked={jugadoresSeleccionados.length === jugadoresDisponibles.length}
                      onChange={toggleTodos}
                    />
                  </th>
                  <th>Jugador</th>
                  <th>Posición</th>
                  <th>Nacionalidad</th>
                  <th>N° Camiseta</th>
                </tr>
              </thead>
              <tbody>
                {jugadoresDisponibles.map((jugador) => (
                  <tr
                    key={jugador.ID_JUGADOR}
                    className={jugadoresSeleccionados.includes(jugador.ID_JUGADOR) ? 'selected' : ''}
                    onClick={() => toggleJugador(jugador.ID_JUGADOR)}
                  >
                    <td>
                      <input
                        type="checkbox"
                        checked={jugadoresSeleccionados.includes(jugador.ID_JUGADOR)}
                        onChange={() => toggleJugador(jugador.ID_JUGADOR)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td className="jugador-nombre-cell">
                      <strong>{jugador.jugador_nombre}</strong>
                    </td>
                    <td>
                      {jugador.posicion ? (
                        <span className="badge badge-posicion">{jugador.posicion}</span>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td>
                      {jugador.nacionalidad ? (
                        <span>🌍 {jugador.nacionalidad}</span>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td>
                      {jugador.NUMERO_CAMISETA ? (
                        <span className="numero-camiseta">#{jugador.NUMERO_CAMISETA}</span>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="form-actions" style={{ marginTop: '20px' }}>
            <button
              onClick={() => handleClonar(false)}
              disabled={loading || jugadoresSeleccionados.length === 0}
              className="btn btn-primary btn-large"
            >
              {loading ? (
                <>
                  <span className="spinner-small"></span>
                  Procesando...
                </>
              ) : (
                <>
                  🔄 Clonar {jugadoresSeleccionados.length} Jugador{jugadoresSeleccionados.length !== 1 ? 'es' : ''}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Resultado de la clonación */}
      {resultado && resultado.resumen && (
        <div className="resultado-container">
          <h3>📊 Resultado de la Clonación</h3>

          <div className="resumen-stats">
            <div className="stat-card stat-total">
              <div className="stat-icon">📋</div>
              <div className="stat-info">
                <div className="stat-value">{resultado.resumen.total}</div>
                <div className="stat-label">Total Procesadas</div>
              </div>
            </div>
            <div className="stat-card stat-creadas">
              <div className="stat-icon">✅</div>
              <div className="stat-info">
                <div className="stat-value">{resultado.resumen.creadas}</div>
                <div className="stat-label">Nuevas Creadas</div>
              </div>
            </div>
            <div className="stat-card stat-actualizadas">
              <div className="stat-icon">♻️</div>
              <div className="stat-info">
                <div className="stat-value">{resultado.resumen.actualizadas}</div>
                <div className="stat-label">Actualizadas</div>
              </div>
            </div>
            <div className="stat-card stat-omitidas">
              <div className="stat-icon">⏭️</div>
              <div className="stat-info">
                <div className="stat-value">{resultado.resumen.omitidas}</div>
                <div className="stat-label">Omitidas</div>
              </div>
            </div>
          </div>

          {/* Detalle de resultados */}
          <div className="resultado-detalle">
            {resultado.resultados.creadas.length > 0 && (
              <div className="detalle-seccion">
                <h4>✅ Asignaciones Creadas ({resultado.resultados.creadas.length})</h4>
                <ul className="detalle-list">
                  {resultado.resultados.creadas.map((item, index) => (
                    <li key={index}>
                      <span className="jugador-nombre">{item.jugador}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {resultado.resultados.actualizadas.length > 0 && (
              <div className="detalle-seccion">
                <h4>♻️ Asignaciones Actualizadas ({resultado.resultados.actualizadas.length})</h4>
                <ul className="detalle-list">
                  {resultado.resultados.actualizadas.map((item, index) => (
                    <li key={index}>
                      <span className="jugador-nombre">{item.jugador}</span>
                      <span className="razon">{item.razon}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {resultado.resultados.omitidas.length > 0 && (
              <div className="detalle-seccion">
                <h4>⏭️ Asignaciones Omitidas ({resultado.resultados.omitidas.length})</h4>
                <ul className="detalle-list">
                  {resultado.resultados.omitidas.map((item, index) => (
                    <li key={index}>
                      <span className="jugador-nombre">{item.jugador}</span>
                      <span className="razon">{item.razon}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Confirmación */}
      {showConfirmacion && confirmacionData && (
        <div className="modal-overlay">
          <div className="modal-confirm">
            <div className="modal-header">
              <h3>⚠️ Confirmar Clonación</h3>
            </div>
            <div className="modal-body">
              <p className="modal-message">{confirmacionData.message}</p>

              <div className="modal-torneos-info">
                <div className="torneo-card">
                  <h4>📤 Torneo Origen</h4>
                  <p className="torneo-nombre">{confirmacionData.torneoOrigen.nombre}</p>
                  <p className="torneo-detalle">
                    {confirmacionData.torneoOrigen.temporada} - {confirmacionData.torneoOrigen.rueda}
                  </p>
                  <p className="torneo-asignaciones">
                    {jugadoresSeleccionados.length} jugadores seleccionados
                  </p>
                </div>

                <div className="arrow-icon">→</div>

                <div className="torneo-card">
                  <h4>📥 Torneo Destino</h4>
                  <p className="torneo-nombre">{confirmacionData.torneoDestino.nombre}</p>
                  <p className="torneo-detalle">
                    {confirmacionData.torneoDestino.temporada} - {confirmacionData.torneoDestino.rueda}
                  </p>
                  <p className="torneo-asignaciones">
                    {confirmacionData.torneoDestino.totalAsignaciones} asignaciones existentes
                  </p>
                </div>
              </div>

              <div className="modal-warning">
                <p>⚠️ Las asignaciones existentes en el torneo destino serán:</p>
                <ul>
                  <li>✅ <strong>Omitidas</strong> si el jugador ya está en el mismo equipo</li>
                  <li>♻️ <strong>Actualizadas</strong> si el jugador está en otro equipo</li>
                  <li>✅ <strong>Creadas</strong> si el jugador no tiene asignación en el destino</li>
                </ul>
              </div>
            </div>
            <div className="modal-actions">
              <button onClick={cancelarConfirmacion} className="btn btn-secondary">
                Cancelar
              </button>
              <button onClick={confirmarClonacion} className="btn btn-primary">
                Confirmar Clonación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClonarAsignaciones;
