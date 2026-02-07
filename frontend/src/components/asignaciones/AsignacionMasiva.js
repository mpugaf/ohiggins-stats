import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  torneoJugadorService,
  playersService,
  torneosService,
  equiposService,
  handleResponse
} from '../../services/apiService';
import './AsignacionMasiva.css';

const AsignacionMasiva = () => {
  const navigate = useNavigate();

  // Estados para listados
  const [jugadores, setJugadores] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [torneos, setTorneos] = useState([]);

  // Estados del formulario
  const [form, setForm] = useState({
    idJugador: '',
    idEquipo: '',
    temporada: new Date().getFullYear().toString(),
    torneosIds: [],
    numeroCamiseta: '',
    fechaIncorporacion: '',
    estado: 'ACTIVO'
  });

  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [resultadosAsignacion, setResultadosAsignacion] = useState(null);

  // Torneos filtrados por temporada
  const [torneosPorTemporada, setTorneosPorTemporada] = useState([]);

  // Búsqueda de jugador
  const [busquedaJugador, setBusquedaJugador] = useState('');
  const [mostrarResultadosJugador, setMostrarResultadosJugador] = useState(false);
  const [jugadoresFiltrados, setJugadoresFiltrados] = useState([]);

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    // Filtrar jugadores cuando cambia la búsqueda
    if (busquedaJugador.trim().length >= 2) {
      const textoLower = busquedaJugador.toLowerCase();
      const filtrados = jugadores.filter(j => {
        const nombreCompleto = j.NOMBRE_COMPLETO?.toLowerCase() || '';
        const apodo = j.APODO?.toLowerCase() || '';
        return nombreCompleto.includes(textoLower) || apodo.includes(textoLower);
      });
      setJugadoresFiltrados(filtrados);
      setMostrarResultadosJugador(true);
    } else {
      setJugadoresFiltrados([]);
      setMostrarResultadosJugador(false);
    }
  }, [busquedaJugador, jugadores]);

  useEffect(() => {
    // Cerrar dropdown al hacer click fuera
    const handleClickOutside = (event) => {
      if (mostrarResultadosJugador && !event.target.closest('.form-group')) {
        setMostrarResultadosJugador(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [mostrarResultadosJugador]);

  useEffect(() => {
    // Filtrar torneos cuando cambia la temporada
    if (form.temporada) {
      const torneosTemp = torneos.filter(t => t.TEMPORADA === form.temporada);
      setTorneosPorTemporada(torneosTemp);
      // Limpiar selección de torneos si cambia temporada
      setForm(prev => ({ ...prev, torneosIds: [] }));
    }
  }, [form.temporada, torneos]);

  const cargarDatos = async () => {
    try {
      setLoading(true);

      const [jugadoresRes, torneosRes, equiposRes] = await Promise.all([
        playersService.getAll().then(handleResponse),
        torneosService.getAll().then(handleResponse),
        equiposService.getAll().then(handleResponse)
      ]);

      setJugadores(jugadoresRes || []);
      setTorneos(torneosRes || []);
      setEquipos(equiposRes || []);

    } catch (err) {
      console.error('Error cargando datos:', err);
      setError('Error al cargar los datos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTorneoCheckboxChange = (torneoId, isChecked) => {
    const torneoIdNum = parseInt(torneoId, 10);

    console.log('🔘 Checkbox change - Torneo ID:', torneoIdNum, 'Checked:', isChecked);
    console.log('   Estado actual torneosIds:', form.torneosIds);

    setForm(prev => {
      let newTorneosIds;

      if (isChecked) {
        // Agregar si no está ya en el array
        if (!prev.torneosIds.includes(torneoIdNum)) {
          newTorneosIds = [...prev.torneosIds, torneoIdNum];
        } else {
          newTorneosIds = prev.torneosIds;
        }
      } else {
        // Remover del array
        newTorneosIds = prev.torneosIds.filter(id => id !== torneoIdNum);
      }

      console.log('   Nuevo estado torneosIds:', newTorneosIds);

      return {
        ...prev,
        torneosIds: newTorneosIds
      };
    });
  };

  const seleccionarTodosTorneos = () => {
    const todosIds = torneosPorTemporada.map(t => t.ID_TORNEO);
    setForm(prev => ({ ...prev, torneosIds: todosIds }));
  };

  const deseleccionarTodosTorneos = () => {
    setForm(prev => ({ ...prev, torneosIds: [] }));
  };

  const handleSeleccionarJugador = async (jugador) => {
    setForm(prev => ({ ...prev, idJugador: jugador.ID_JUGADOR }));
    setBusquedaJugador(`${jugador.NOMBRE_COMPLETO}${jugador.APODO ? ` "${jugador.APODO}"` : ''}`);
    setMostrarResultadosJugador(false);

    // Cargar última asignación para pre-llenar datos
    try {
      const response = await torneoJugadorService.getUltimaAsignacion(jugador.ID_JUGADOR);
      const data = await handleResponse(response);

      if (data.asignacion) {
        console.log('📋 Última asignación del jugador:', data.asignacion);

        // Pre-llenar número de camiseta y fecha de incorporación si existen
        setForm(prev => ({
          ...prev,
          numeroCamiseta: data.asignacion.NUMERO_CAMISETA || '',
          fechaIncorporacion: data.asignacion.FECHA_INCORPORACION
            ? data.asignacion.FECHA_INCORPORACION.split('T')[0]
            : '',
          estado: data.asignacion.ESTADO || 'ACTIVO'
        }));

        setSuccessMessage(`ℹ️ Datos pre-llenados de última asignación en ${data.asignacion.equipo_nombre}`);
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      // Si no tiene asignaciones previas, es normal
      console.log('ℹ️ Jugador sin asignaciones previas');
    }
  };

  const handleLimpiarJugador = () => {
    setForm({
      idJugador: '',
      idEquipo: '',
      temporada: new Date().getFullYear().toString(),
      torneosIds: [],
      numeroCamiseta: '',
      fechaIncorporacion: '',
      estado: 'ACTIVO'
    });
    setBusquedaJugador('');
    setMostrarResultadosJugador(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validación
    if (!form.idJugador) {
      setError('Debe seleccionar un jugador');
      return;
    }
    if (!form.idEquipo) {
      setError('Debe seleccionar un equipo');
      return;
    }
    if (!form.temporada) {
      setError('Debe especificar una temporada');
      return;
    }
    if (form.torneosIds.length === 0) {
      setError('Debe seleccionar al menos un torneo');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setResultadosAsignacion(null);

      const data = {
        idJugador: parseInt(form.idJugador, 10),
        idEquipo: parseInt(form.idEquipo, 10),
        temporada: form.temporada,
        torneosIds: form.torneosIds,
        numeroCamiseta: form.numeroCamiseta ? parseInt(form.numeroCamiseta, 10) : null,
        fechaIncorporacion: form.fechaIncorporacion || null,
        estado: form.estado
      };

      console.log('📤 Enviando asignación masiva:', data);

      const response = await torneoJugadorService.crearAsignacionMasiva(data);
      const result = await handleResponse(response);

      setSuccessMessage(`✅ Asignación masiva completada: ${result.resumen.creadas} creadas, ${result.resumen.actualizadas} actualizadas, ${result.resumen.omitidas} omitidas`);
      setResultadosAsignacion(result);

      // Limpiar formulario
      setForm({
        idJugador: '',
        idEquipo: '',
        temporada: new Date().getFullYear().toString(),
        torneosIds: [],
        numeroCamiseta: '',
        fechaIncorporacion: '',
        estado: 'ACTIVO'
      });

      setTimeout(() => {
        setSuccessMessage('');
        setResultadosAsignacion(null);
      }, 10000);

    } catch (err) {
      console.error('Error en asignación masiva:', err);
      setError(err.message || 'Error al crear asignación masiva');
    } finally {
      setLoading(false);
    }
  };

  const jugadorSeleccionado = jugadores.find(j => j.ID_JUGADOR === parseInt(form.idJugador, 10));
  const equipoSeleccionado = equipos.find(e => e.ID_EQUIPO === parseInt(form.idEquipo, 10));

  return (
    <div className="asignacion-masiva-container">
      <div className="page-header">
        <h1>⚡ Asignación Masiva: Jugador → Equipo → Torneos</h1>
        <p>Asigna un jugador a un equipo para múltiples torneos en una sola operación</p>
        <button onClick={() => navigate('/asignacion-jugador')} className="btn-back">
          ← Volver a asignaciones individuales
        </button>
      </div>

      {/* Mensajes */}
      {error && (
        <div className="alert alert-error">
          ❌ {error}
          <button onClick={() => setError('')} className="close-btn">×</button>
        </div>
      )}

      {successMessage && (
        <div className="alert alert-success">
          {successMessage}
        </div>
      )}

      {/* Formulario */}
      <div className="form-card">
        <form onSubmit={handleSubmit}>
          {/* Paso 1: Seleccionar Jugador y Equipo */}
          <div className="form-section">
            <h3>📋 Paso 1: Seleccionar Jugador y Equipo</h3>
            <div className="form-row">
              <div className="form-group" style={{ position: 'relative' }}>
                <label>👤 Jugador *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={busquedaJugador}
                    onChange={(e) => setBusquedaJugador(e.target.value)}
                    onFocus={() => busquedaJugador.length >= 2 && setMostrarResultadosJugador(true)}
                    placeholder="Escribe el nombre del jugador..."
                    disabled={loading}
                    required={!form.idJugador}
                    style={{
                      width: '100%',
                      paddingRight: form.idJugador ? '40px' : '10px'
                    }}
                  />
                  {form.idJugador && (
                    <button
                      type="button"
                      onClick={handleLimpiarJugador}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Resultados de búsqueda */}
                {mostrarResultadosJugador && jugadoresFiltrados.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'white',
                    border: '2px solid #00BFFF',
                    borderRadius: '8px',
                    maxHeight: '300px',
                    overflowY: 'auto',
                    zIndex: 1000,
                    marginTop: '4px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                  }}>
                    {jugadoresFiltrados.map(j => (
                      <div
                        key={j.ID_JUGADOR}
                        onClick={() => handleSeleccionarJugador(j)}
                        style={{
                          padding: '12px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #e9ecef',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#f8f9fa'}
                        onMouseLeave={(e) => e.target.style.background = 'white'}
                      >
                        <div style={{ fontWeight: 600, color: '#2c3e50' }}>
                          {j.NOMBRE_COMPLETO}
                        </div>
                        {j.APODO && (
                          <div style={{ fontSize: '13px', color: '#6c757d', fontStyle: 'italic' }}>
                            "{j.APODO}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {busquedaJugador.length >= 2 && jugadoresFiltrados.length === 0 && mostrarResultadosJugador && (
                  <small style={{color: '#dc3545', marginTop: '5px', display: 'block'}}>
                    No se encontraron jugadores con ese nombre
                  </small>
                )}

                {busquedaJugador.length < 2 && busquedaJugador.length > 0 && (
                  <small style={{color: '#6c757d', marginTop: '5px', display: 'block'}}>
                    Escribe al menos 2 caracteres para buscar
                  </small>
                )}

                {form.idJugador && (
                  <small style={{color: '#28a745', marginTop: '5px', display: 'block', fontWeight: 600}}>
                    ✓ Jugador seleccionado
                  </small>
                )}
              </div>

              <div className="form-group">
                <label>⚽ Equipo *</label>
                <select
                  value={form.idEquipo}
                  onChange={(e) => setForm({ ...form, idEquipo: e.target.value })}
                  required
                  disabled={loading}
                >
                  <option key="empty-equipo" value="">-- Seleccione un equipo --</option>
                  {equipos.map(e => (
                    <option key={e.ID_EQUIPO} value={e.ID_EQUIPO}>
                      {e.NOMBRE} {e.APODO && `(${e.APODO})`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>📅 Temporada *</label>
                <input
                  type="text"
                  value={form.temporada}
                  onChange={(e) => setForm({ ...form, temporada: e.target.value })}
                  placeholder="2026"
                  required
                  disabled={loading}
                  pattern="[0-9]{4}"
                  maxLength={4}
                />
              </div>
            </div>
          </div>

          {/* Paso 2: Seleccionar Torneos */}
          <div className="form-section">
            <h3>🏆 Paso 2: Seleccionar Torneos (Temporada: {form.temporada})</h3>

            {torneosPorTemporada.length === 0 ? (
              <div className="empty-state">
                <p>No hay torneos disponibles para la temporada {form.temporada}</p>
              </div>
            ) : (
              <>
                <div className="torneos-actions">
                  <button type="button" onClick={seleccionarTodosTorneos} className="btn-secondary">
                    ✅ Seleccionar Todos
                  </button>
                  <button type="button" onClick={deseleccionarTodosTorneos} className="btn-secondary">
                    ❌ Deseleccionar Todos
                  </button>
                  <span className="torneos-count">
                    {form.torneosIds.length} de {torneosPorTemporada.length} seleccionados
                  </span>
                </div>

                <div className="torneos-grid">
                  {torneosPorTemporada.map((torneo, index) => {
                    const isChecked = form.torneosIds.includes(torneo.ID_TORNEO);
                    return (
                      <div
                        key={`torneo-${torneo.ID_TORNEO}-${index}`}
                        className={`torneo-checkbox-card ${isChecked ? 'checked' : ''}`}
                        onClick={() => handleTorneoCheckboxChange(torneo.ID_TORNEO, !isChecked)}
                        style={{ cursor: 'pointer' }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleTorneoCheckboxChange(torneo.ID_TORNEO, e.target.checked);
                          }}
                          disabled={loading}
                          style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="torneo-info">
                          <strong>{torneo.NOMBRE}</strong>
                          <span className="torneo-meta">
                            {torneo.TEMPORADA} - {torneo.RUEDA}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Paso 3: Detalles Adicionales */}
          <div className="form-section">
            <h3>📝 Paso 3: Detalles Adicionales (Opcional)</h3>
            <div className="form-row">
              <div className="form-group">
                <label>👕 Número de Camiseta</label>
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={form.numeroCamiseta}
                  onChange={(e) => setForm({ ...form, numeroCamiseta: e.target.value })}
                  placeholder="Ej: 10"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>📅 Fecha de Incorporación</label>
                <input
                  type="date"
                  value={form.fechaIncorporacion}
                  onChange={(e) => setForm({ ...form, fechaIncorporacion: e.target.value })}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>📊 Estado</label>
                <select
                  value={form.estado}
                  onChange={(e) => setForm({ ...form, estado: e.target.value })}
                  disabled={loading}
                >
                  <option key="ACTIVO" value="ACTIVO">✅ Activo</option>
                  <option key="CEDIDO" value="CEDIDO">🔄 Cedido</option>
                  <option key="LESIONADO" value="LESIONADO">🤕 Lesionado</option>
                  <option key="SUSPENDIDO" value="SUSPENDIDO">🚫 Suspendido</option>
                  <option key="INACTIVO" value="INACTIVO">⭕ Inactivo</option>
                </select>
              </div>
            </div>
          </div>

          {/* Resumen antes de enviar */}
          {form.idJugador && form.idEquipo && form.torneosIds.length > 0 && (
            <div className="resumen-card">
              <h3>📊 Resumen de la Asignación</h3>
              <div className="resumen-content">
                <div className="resumen-item">
                  <span className="resumen-label">Jugador:</span>
                  <span className="resumen-value">
                    {jugadorSeleccionado?.NOMBRE_COMPLETO}
                    {jugadorSeleccionado?.APODO && ` "${jugadorSeleccionado.APODO}"`}
                  </span>
                </div>
                <div className="resumen-item">
                  <span className="resumen-label">Equipo:</span>
                  <span className="resumen-value">
                    {equipoSeleccionado?.NOMBRE}
                    {equipoSeleccionado?.APODO && ` (${equipoSeleccionado.APODO})`}
                  </span>
                </div>
                <div className="resumen-item">
                  <span className="resumen-label">Temporada:</span>
                  <span className="resumen-value">{form.temporada}</span>
                </div>
                <div className="resumen-item">
                  <span className="resumen-label">Torneos seleccionados:</span>
                  <span className="resumen-value">{form.torneosIds.length}</span>
                </div>
                {form.numeroCamiseta && (
                  <div className="resumen-item">
                    <span className="resumen-label">Número de camiseta:</span>
                    <span className="resumen-value">#{form.numeroCamiseta}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Botón de envío */}
          <div className="form-actions">
            <button type="submit" className="btn-primary btn-large" disabled={loading || form.torneosIds.length === 0}>
              {loading ? '⏳ Creando asignaciones...' : `✅ Crear ${form.torneosIds.length} Asignación(es)`}
            </button>
          </div>
        </form>
      </div>

      {/* Resultados detallados */}
      {resultadosAsignacion && (
        <div className="resultados-card">
          <h3>📊 Resultados de la Asignación Masiva</h3>

          <div className="resultados-summary">
            <div className="summary-stat success">
              <div className="stat-number">{resultadosAsignacion.resumen.creadas}</div>
              <div className="stat-label">Creadas</div>
            </div>
            <div className="summary-stat warning">
              <div className="stat-number">{resultadosAsignacion.resumen.actualizadas}</div>
              <div className="stat-label">Actualizadas</div>
            </div>
            <div className="summary-stat info">
              <div className="stat-number">{resultadosAsignacion.resumen.omitidas}</div>
              <div className="stat-label">Omitidas</div>
            </div>
          </div>

          {resultadosAsignacion.resultados.creadas.length > 0 && (
            <div className="resultado-seccion">
              <h4>✅ Asignaciones Creadas</h4>
              <ul>
                {resultadosAsignacion.resultados.creadas.map((item, idx) => (
                  <li key={idx}>
                    <strong>{item.torneo}</strong>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {resultadosAsignacion.resultados.actualizadas.length > 0 && (
            <div className="resultado-seccion">
              <h4>♻️ Asignaciones Actualizadas (Reasignaciones)</h4>
              <ul>
                {resultadosAsignacion.resultados.actualizadas.map((item, idx) => (
                  <li key={idx}>
                    <strong>{item.torneo}</strong> - {item.razon}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {resultadosAsignacion.resultados.omitidas.length > 0 && (
            <div className="resultado-seccion">
              <h4>⏭️ Asignaciones Omitidas</h4>
              <ul>
                {resultadosAsignacion.resultados.omitidas.map((item, idx) => (
                  <li key={idx}>
                    <strong>{item.torneo}</strong> - {item.razon}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AsignacionMasiva;
