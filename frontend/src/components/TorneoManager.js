// frontend/src/components/TorneoManager.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './TorneoManager.css';

const TorneoManager = () => {
  const navigate = useNavigate();
  
  // Estados principales
  const [torneos, setTorneos] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [jugadores, setJugadores] = useState([]);
  const [jugadoresDisponibles, setJugadoresDisponibles] = useState([]);
  
  // Estados de selección
  const [torneoSeleccionado, setTorneoSeleccionado] = useState('');
  const [equipoSeleccionado, setEquipoSeleccionado] = useState('');
  
  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mostrarFormularioAsignacion, setMostrarFormularioAsignacion] = useState(false);
  const [jugadorEnEdicion, setJugadorEnEdicion] = useState(null);
  
  // Estados del formulario
  const [formData, setFormData] = useState({
    playerIdFbr: '',
    numeroCamiseta: '',
    fechaIncorporacion: ''
  });

  // Cargar torneos al montar el componente
  useEffect(() => {
    cargarTorneos();
  }, []);

  // Cargar equipos cuando se selecciona un torneo
  useEffect(() => {
    if (torneoSeleccionado) {
      cargarEquiposPorTorneo(torneoSeleccionado);
      setEquipoSeleccionado('');
      setJugadores([]);
    }
  }, [torneoSeleccionado]);

  // Cargar jugadores cuando se selecciona un equipo
  useEffect(() => {
    if (torneoSeleccionado && equipoSeleccionado) {
      cargarJugadoresPorTorneoEquipo(torneoSeleccionado, equipoSeleccionado);
      cargarJugadoresDisponibles(torneoSeleccionado, equipoSeleccionado);
    }
  }, [equipoSeleccionado]);

  const cargarTorneos = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://192.168.100.16:3000/api/torneos/all');
      
      if (!response.ok) {
        throw new Error('Error al cargar torneos');
      }
      
      const data = await response.json();
      setTorneos(data);
    } catch (err) {
      setError('Error al cargar torneos: ' + err.message);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const cargarEquiposPorTorneo = async (torneoId) => {
    try {
      setLoading(true);
      const response = await fetch(`http://192.168.100.16:3000/api/torneos/${torneoId}/equipos`);
      
      if (!response.ok) {
        throw new Error('Error al cargar equipos');
      }
      
      const data = await response.json();
      setEquipos(data);
    } catch (err) {
      setError('Error al cargar equipos: ' + err.message);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const cargarJugadoresPorTorneoEquipo = async (torneoId, equipoId) => {
    try {
      setLoading(true);
      const response = await fetch(`http://192.168.100.16:3000/api/torneos/${torneoId}/equipos/${equipoId}/jugadores`);
      
      if (!response.ok) {
        throw new Error('Error al cargar jugadores');
      }
      
      const data = await response.json();
      setJugadores(data);
    } catch (err) {
      setError('Error al cargar jugadores: ' + err.message);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const cargarJugadoresDisponibles = async (torneoId, equipoId) => {
    try {
      const response = await fetch(`http://192.168.100.16:3000/api/torneos/jugadores/disponibles?torneoId=${torneoId}&equipoId=${equipoId}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar jugadores disponibles');
      }
      
      const data = await response.json();
      setJugadoresDisponibles(data);
    } catch (err) {
      console.error('Error al cargar jugadores disponibles:', err);
    }
  };

  const handleAsignarJugador = async (e) => {
    e.preventDefault();
    
    if (!formData.playerIdFbr) {
      setError('Debe seleccionar un jugador');
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch('http://192.168.100.16:3000/api/torneos/asignaciones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          torneoId: torneoSeleccionado,
          equipoId: equipoSeleccionado,
          playerIdFbr: formData.playerIdFbr,
          numeroCamiseta: formData.numeroCamiseta || null,
          fechaIncorporacion: formData.fechaIncorporacion || null
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al asignar jugador');
      }

      alert('¡Jugador asignado exitosamente!');
      
      // Resetear formulario y recargar datos
      setFormData({
        playerIdFbr: '',
        numeroCamiseta: '',
        fechaIncorporacion: ''
      });
      setMostrarFormularioAsignacion(false);
      
      // Recargar listas
      cargarJugadoresPorTorneoEquipo(torneoSeleccionado, equipoSeleccionado);
      cargarJugadoresDisponibles(torneoSeleccionado, equipoSeleccionado);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoverJugador = async (playerIdFbr) => {
    if (!window.confirm('¿Está seguro de que desea remover este jugador del torneo/equipo?')) {
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch(
        `http://192.168.100.16:3000/api/torneos/asignaciones/${torneoSeleccionado}/${equipoSeleccionado}/${playerIdFbr}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al remover jugador');
      }

      alert('Jugador removido exitosamente');
      
      // Recargar listas
      cargarJugadoresPorTorneoEquipo(torneoSeleccionado, equipoSeleccionado);
      cargarJugadoresDisponibles(torneoSeleccionado, equipoSeleccionado);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-ES');
  };

  const obtenerEquipoNombre = () => {
    const equipo = equipos.find(e => e.id === parseInt(equipoSeleccionado));
    return equipo ? `${equipo.nombre} ${equipo.apodo ? '(' + equipo.apodo + ')' : ''}` : '';
  };

  return (
    <div className="torneo-manager">
      <div className="header-section">
        <div className="header-content">
          <h1>🏆 Gestión de Torneos y Jugadores</h1>
          <p>Gestiona las asignaciones de jugadores por torneo y equipo</p>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span>❌ {error}</span>
          <button onClick={() => setError('')}>✕</button>
        </div>
      )}

      <div className="main-content">
        {/* Panel de Selección */}
        <div className="selection-panel">
          <div className="selection-row">
            <div className="selection-item">
              <label>📋 Seleccionar Torneo:</label>
              <select
                value={torneoSeleccionado}
                onChange={(e) => setTorneoSeleccionado(e.target.value)}
                disabled={loading}
              >
                <option value="">-- Seleccione un torneo --</option>
                {torneos.map(torneo => (
                  <option key={torneo.id} value={torneo.id}>
                    Torneo {torneo.nombre} ({torneo.total_jugadores} jugadores)
                  </option>
                ))}
              </select>
            </div>

            {torneoSeleccionado && (
              <div className="selection-item">
                <label>⚽ Seleccionar Equipo:</label>
                <select
                  value={equipoSeleccionado}
                  onChange={(e) => setEquipoSeleccionado(e.target.value)}
                  disabled={loading}
                >
                  <option value="">-- Seleccione un equipo --</option>
                  {equipos.map(equipo => (
                    <option key={equipo.id} value={equipo.id}>
                      {equipo.nombre} {equipo.apodo && `(${equipo.apodo})`} - {equipo.total_jugadores} jugadores
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Panel de Jugadores */}
        {torneoSeleccionado && equipoSeleccionado && (
          <div className="jugadores-panel">
            <div className="panel-header">
              <h3>👥 Jugadores de {obtenerEquipoNombre()} en Torneo {torneoSeleccionado}</h3>
              <button
                onClick={() => setMostrarFormularioAsignacion(true)}
                className="btn-primary"
                disabled={loading}
              >
                ➕ Asignar Jugador
              </button>
            </div>

            {loading ? (
              <div className="loading">⏳ Cargando jugadores...</div>
            ) : (
              <div className="jugadores-grid">
                {jugadores.length === 0 ? (
                  <div className="no-data">
                    📝 No hay jugadores asignados a este equipo en el torneo seleccionado
                  </div>
                ) : (
                  jugadores.map(jugador => (
                    <div key={jugador.player_id_fbr} className="jugador-card">
                      <div className="jugador-header">
                        <div className="jugador-numero">
                          {jugador.numero_camiseta || '?'}
                        </div>
                        <div className="jugador-info">
                          <h4>{jugador.nombre_completo}</h4>
                          {jugador.apodo && <span className="apodo">"{jugador.apodo}"</span>}
                        </div>
                        <div className="jugador-estado">
                          <span className={`estado-badge ${jugador.estado?.toLowerCase()}`}>
                            {jugador.estado || 'ACTIVO'}
                          </span>
                        </div>
                      </div>

                      <div className="jugador-detalles">
                        <div className="detalle-row">
                          <span className="label">📅 Incorporación:</span>
                          <span>{formatearFecha(jugador.fecha_incorporacion)}</span>
                        </div>
                        
                        {jugador.pie_dominante && (
                          <div className="detalle-row">
                            <span className="label">🦶 Pie dominante:</span>
                            <span>{jugador.pie_dominante}</span>
                          </div>
                        )}

                        {jugador.posiciones && jugador.posiciones.length > 0 && (
                          <div className="detalle-row">
                            <span className="label">⚽ Posiciones:</span>
                            <span>
                              {jugador.posiciones.map(pos => pos.codigo).join(', ')}
                            </span>
                          </div>
                        )}

                        {jugador.nacionalidades && jugador.nacionalidades.length > 0 && (
                          <div className="detalle-row">
                            <span className="label">🌍 Nacionalidad:</span>
                            <span>
                              {jugador.nacionalidades.map(nac => nac.codigo).join(', ')}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="jugador-acciones">
                        <button
                          onClick={() => setJugadorEnEdicion(jugador)}
                          className="btn-secondary"
                          title="Editar asignación"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleRemoverJugador(jugador.player_id_fbr)}
                          className="btn-danger"
                          title="Remover del torneo/equipo"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Formulario de Asignación */}
        {mostrarFormularioAsignacion && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>➕ Asignar Jugador</h3>
                <button
                  onClick={() => setMostrarFormularioAsignacion(false)}
                  className="close-btn"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAsignarJugador}>
                <div className="form-group">
                  <label>👤 Jugador:</label>
                  <select
                    value={formData.playerIdFbr}
                    onChange={(e) => setFormData({...formData, playerIdFbr: e.target.value})}
                    required
                  >
                    <option value="">-- Seleccione un jugador --</option>
                    {jugadoresDisponibles.map(jugador => (
                      <option key={jugador.player_id_fbr} value={jugador.player_id_fbr}>
                        {jugador.nombre_completo} {jugador.apodo && `"${jugador.apodo}"`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>👕 Número de Camiseta:</label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={formData.numeroCamiseta}
                    onChange={(e) => setFormData({...formData, numeroCamiseta: e.target.value})}
                    placeholder="Opcional"
                  />
                </div>

                <div className="form-group">
                  <label>📅 Fecha de Incorporación:</label>
                  <input
                    type="date"
                    value={formData.fechaIncorporacion}
                    onChange={(e) => setFormData({...formData, fechaIncorporacion: e.target.value})}
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    onClick={() => setMostrarFormularioAsignacion(false)}
                    className="btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Asignando...' : 'Asignar Jugador'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Estadísticas */}
        {torneoSeleccionado && equipoSeleccionado && (
          <div className="estadisticas-panel">
            <h3>📊 Estadísticas</h3>
            <div className="estadisticas-grid">
              <div className="estadistica-item">
                <div className="stat-number">{jugadores.length}</div>
                <div className="stat-label">Jugadores Asignados</div>
              </div>
              <div className="estadistica-item">
                <div className="stat-number">{jugadoresDisponibles.length}</div>
                <div className="stat-label">Jugadores Disponibles</div>
              </div>
              <div className="estadistica-item">
                <div className="stat-number">
                  {jugadores.filter(j => j.numero_camiseta).length}
                </div>
                <div className="stat-label">Con Número de Camiseta</div>
              </div>
              <div className="estadistica-item">
                <div className="stat-number">
                  {jugadores.filter(j => j.estado === 'ACTIVO').length}
                </div>
                <div className="stat-label">Jugadores Activos</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TorneoManager;