// frontend/src/components/ListadoJugadores.js - CORREGIDO
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { torneosService, torneoJugadorService, playersService, handleResponse } from '../services/apiService';
import './ListadoJugadores.css';

const ListadoJugadores = () => {
  const navigate = useNavigate();
  const [torneos, setTorneos] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [jugadores, setJugadores] = useState([]);
  const [posiciones, setPosiciones] = useState([]); // ✅ NUEVO: Para edición de posiciones
  const [selectedTorneo, setSelectedTorneo] = useState('');
  const [selectedEquipo, setSelectedEquipo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingPlayer, setEditingPlayer] = useState(null); // ✅ NUEVO: Para modal de edición
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    cargarTorneos();
    cargarPosiciones(); // ✅ NUEVO: Cargar posiciones para edición
  }, []);

  useEffect(() => {
    if (selectedTorneo) {
      cargarEquipos(selectedTorneo);
    } else {
      setEquipos([]);
      setSelectedEquipo('');
      setJugadores([]);
    }
  }, [selectedTorneo]);

  useEffect(() => {
    if (selectedTorneo && selectedEquipo) {
      cargarJugadores(selectedTorneo, selectedEquipo);
    } else {
      setJugadores([]);
    }
  }, [selectedTorneo, selectedEquipo]);

  const cargarTorneos = async () => {
    try {
      setLoading(true);
      console.log('🔄 Cargando torneos con autenticación...');

      const response = await torneosService.getAll();
      const data = await handleResponse(response);

      console.log('✅ Torneos cargados para ListadoJugadores:', data);

      // Debug: Mostrar estructura de los torneos
      if (data.length > 0) {
        console.log('📋 Estructura del primer torneo:', data[0]);
      }

      setTorneos(data);
      setError(null);
    } catch (error) {
      console.error('❌ Error al cargar torneos:', error);
      setError('Error al cargar torneos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const cargarEquipos = async (torneoId) => {
    try {
      const response = await torneosService.getEquipos(torneoId);
      const data = await handleResponse(response);
      setEquipos(data);
    } catch (error) {
      console.error('Error al cargar equipos:', error);
      setError('Error al cargar equipos: ' + error.message);
    }
  };

  // ✅ NUEVO: Función para cargar posiciones
  const cargarPosiciones = async () => {
    try {
      const response = await playersService.getPositions();
      const data = await handleResponse(response);
      setPosiciones(data);
    } catch (error) {
      console.error('Error al cargar posiciones:', error);
    }
  };

  const cargarJugadores = async (torneoId, equipoId) => {
    try {
      setLoading(true);
      const response = await torneosService.getEquipoJugadores(torneoId, equipoId);
      const data = await handleResponse(response);
      setJugadores(data);
      setError(null);
    } catch (error) {
      console.error('Error al cargar jugadores:', error);
      setError('Error al cargar jugadores: ' + error.message);
      setJugadores([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ CORREGIDO: Función para mostrar posiciones completas
  const mostrarPosiciones = (posiciones) => {
    if (!posiciones || posiciones.length === 0) {
      return <span className="sin-posiciones">Sin posiciones</span>;
    }
    
    return (
      <div className="posiciones-list">
        {posiciones.map((posicion, index) => (
          <span key={index} className="posicion-badge">
            {/* ✅ CORRECCIÓN: Mostrar nombre completo en lugar del código */}
            {posicion.nombre}
          </span>
        ))}
      </div>
    );
  };

  // ✅ CORREGIDO: Función para mostrar número de camiseta
  const mostrarNumeroCamiseta = (numero) => {
    if (!numero) {
      return <span className="sin-numero">S/N</span>;
    }
    
    return (
      <div className="jugador-numero">
        {/* ✅ CORRECCIÓN: Mostrar número de camiseta de forma destacada */}
        {numero}
      </div>
    );
  };

  const mostrarNacionalidades = (nacionalidades) => {
    if (!nacionalidades || nacionalidades.length === 0) {
      return <span className="sin-nacionalidades">Sin nacionalidad</span>;
    }
    
    return (
      <div className="nacionalidades-list">
        {nacionalidades.map((nacionalidad, index) => (
          <span key={index} className="nacionalidad-badge">
            {nacionalidad.codigo}
          </span>
        ))}
      </div>
    );
  };

  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return 'N/A';
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    const edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      return edad - 1;
    }
    return edad;
  };

  // ✅ NUEVO: Función para abrir modal de edición
  const handleEditar = (jugador) => {
    setEditingPlayer({
      ...jugador,
      posiciones_seleccionadas: jugador.posiciones?.map(p => p.codigo) || []
    });
    setShowEditModal(true);
  };

  // ✅ NUEVO: Función para cerrar modal
  const handleCerrarModal = () => {
    setShowEditModal(false);
    setEditingPlayer(null);
  };

  // ✅ NUEVO: Función para guardar cambios
  const handleGuardarCambios = async (datosActualizados) => {
    try {
      const { api } = await import('../services/apiService');
      const response = await api.put(
        `/api/torneos/${selectedTorneo}/equipos/${selectedEquipo}/jugadores/${editingPlayer.player_id_fbr}/completo`,
        datosActualizados
      );

      await handleResponse(response);

      // Recargar lista de jugadores
      cargarJugadores(selectedTorneo, selectedEquipo);
      handleCerrarModal();
      alert('Jugador actualizado exitosamente');
    } catch (error) {
      console.error('Error al guardar cambios:', error);
      alert('Error al guardar los cambios: ' + error.message);
    }
  };

  const handleRemover = async (jugador) => {
    if (window.confirm(`¿Está seguro que desea remover a ${jugador.nombre_completo} del torneo?`)) {
      try {
        const { api } = await import('../services/apiService');
        const response = await api.delete(
          `/api/torneos/${selectedTorneo}/equipos/${selectedEquipo}/jugadores/${jugador.player_id_fbr}`
        );

        await handleResponse(response);

        cargarJugadores(selectedTorneo, selectedEquipo);
        alert('Jugador removido exitosamente');
      } catch (error) {
        console.error('Error al remover jugador:', error);
        alert('Error al remover jugador: ' + error.message);
      }
    }
  };

  return (
    <div className="listado-jugadores">
      <div className="header-section">
        <div className="header-content">
          <h1>⚽ Gestión de Jugadores por Torneo</h1>
          <p>Administra los jugadores asignados a cada torneo y equipo</p>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span>{error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <div className="main-content">
        {/* Panel de Selección */}
        <div className="selection-panel">
          <div className="selection-header">
            <h2>🎯 Seleccionar Torneo y Equipo</h2>
            <p>Elige un torneo y equipo para ver sus jugadores</p>
          </div>

          <div className="selection-row">
            <div className="selection-item">
              <label htmlFor="torneo-select">📅 Torneo:</label>
              <select
                id="torneo-select"
                value={selectedTorneo}
                onChange={(e) => setSelectedTorneo(e.target.value)}
              >
                <option value="">Selecciona un torneo</option>
                {torneos.map(torneo => {
                  const torneoId = torneo.ID_TORNEO || torneo.id;
                  return (
                    <option key={torneoId} value={torneoId}>
                      {torneo.nombre_completo ||
                        (torneo.RUEDA
                          ? `${torneo.NOMBRE} ${torneo.TEMPORADA} - ${torneo.RUEDA}`
                          : `${torneo.NOMBRE} ${torneo.TEMPORADA}`)}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="selection-item">
              <label htmlFor="equipo-select">⚽ Equipo:</label>
              <select
                id="equipo-select"
                value={selectedEquipo}
                onChange={(e) => setSelectedEquipo(e.target.value)}
                disabled={!selectedTorneo}
              >
                <option value="">Selecciona un equipo</option>
                {equipos.map(equipo => (
                  <option key={equipo.id} value={equipo.id}>
                    {equipo.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Panel de Jugadores */}
        {selectedTorneo && selectedEquipo && (
          <div className="jugadores-panel">
            <div className="panel-header">
              <h3>👥 Jugadores del Equipo</h3>
              <div className="panel-stats">
                <span className="stat-item">
                  📊 Total: {jugadores.length} jugadores
                </span>
                <span className="stat-item">
                  ✅ Activos: {jugadores.filter(j => j.estado === 'ACTIVO').length}
                </span>
              </div>
            </div>

            <div className="jugadores-container">
              {loading ? (
                <div className="loading">⏳ Cargando jugadores...</div>
              ) : jugadores.length === 0 ? (
                <div className="no-data">
                  <div className="no-data-icon">👤</div>
                  <h4>No hay jugadores registrados</h4>
                  <p>Este equipo no tiene jugadores asignados en el torneo seleccionado</p>
                </div>
              ) : (
                <div className="jugadores-grid">
                  {jugadores.map((jugador) => (
                    <div key={jugador.player_id_fbr} className="jugador-card">
                      <div className="jugador-header">
                        {/* ✅ CORREGIDO: Mostrar número de camiseta */}
                        {mostrarNumeroCamiseta(jugador.numero_camiseta)}
                        
                        <div className="jugador-info">
                          <h4>{jugador.nombre_completo}</h4>
                          {jugador.apodo && <span className="apodo">"{jugador.apodo}"</span>}
                          <span className="edad">{calcularEdad(jugador.fecha_nacimiento)} años</span>
                        </div>

                        <div className="jugador-estado">
                          <span className={`estado-badge ${jugador.estado?.toLowerCase() || 'activo'}`}>
                            {jugador.estado || 'ACTIVO'}
                          </span>
                        </div>
                      </div>

                      <div className="jugador-detalles">
                        <div className="detalle-row">
                          <span className="label">📅 Incorporación:</span>
                          <span>{jugador.fecha_incorporacion ? 
                            new Date(jugador.fecha_incorporacion).toLocaleDateString('es-ES') : 'N/A'}</span>
                        </div>

                        <div className="detalle-row">
                          <span className="label">⚽ Posiciones:</span>
                          {/* ✅ CORREGIDO: Mostrar nombres completos de posiciones */}
                          {mostrarPosiciones(jugador.posiciones)}
                        </div>

                        <div className="detalle-row">
                          <span className="label">🌍 Nacionalidad:</span>
                          {mostrarNacionalidades(jugador.nacionalidades)}
                        </div>
                      </div>

                      <div className="jugador-acciones">
                        {/* ✅ NUEVO: Botón de editar con nueva funcionalidad */}
                        <button
                          onClick={() => handleEditar(jugador)}
                          className="btn-primary"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => handleRemover(jugador)}
                          className="btn-danger"
                        >
                          🗑️ Remover
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ✅ NUEVO: Modal de Edición */}
      {showEditModal && editingPlayer && (
        <ModalEdicionJugador
          jugador={editingPlayer}
          posiciones={posiciones}
          onGuardar={handleGuardarCambios}
          onCancelar={handleCerrarModal}
        />
      )}
    </div>
  );
};

// ✅ NUEVO: Componente Modal de Edición
const ModalEdicionJugador = ({ jugador, posiciones, onGuardar, onCancelar }) => {
  const [formData, setFormData] = useState({
    numero_camiseta: jugador.numero_camiseta || '',
    fecha_incorporacion: jugador.fecha_incorporacion ? 
      jugador.fecha_incorporacion.split('T')[0] : '',
    fecha_salida: jugador.fecha_salida ? 
      jugador.fecha_salida.split('T')[0] : '',
    estado: jugador.estado || 'ACTIVO',
    posiciones_seleccionadas: jugador.posiciones_seleccionadas || []
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // ✅ NUEVO: Manejar selección múltiple de posiciones
  const handlePosicionChange = (codigoPosicion) => {
    setFormData(prev => {
      const posicionesActuales = prev.posiciones_seleccionadas;
      let nuevasPosiciones;

      if (posicionesActuales.includes(codigoPosicion)) {
        nuevasPosiciones = posicionesActuales.filter(p => p !== codigoPosicion);
      } else {
        nuevasPosiciones = [...posicionesActuales, codigoPosicion];
      }

      return {
        ...prev,
        posiciones_seleccionadas: nuevasPosiciones
      };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Convertir códigos de posición a IDs
    const posicionesIds = formData.posiciones_seleccionadas.map(codigo => {
      const posicion = posiciones.find(p => p.codigo_posicion === codigo);
      return posicion?.posicion_id;
    }).filter(Boolean);

    const datosParaEnvio = {
      ...formData,
      posiciones_ids: posicionesIds
    };

    onGuardar(datosParaEnvio);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>✏️ Editar Asignación</h3>
          <button onClick={onCancelar} className="close-btn">✕</button>
        </div>

        <div className="jugador-edit-info">
          <h4>{jugador.nombre_completo}</h4>
          {jugador.apodo && <p>"{jugador.apodo}"</p>}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="numero_camiseta">👕 Número de Camiseta:</label>
            <input
              type="number"
              id="numero_camiseta"
              name="numero_camiseta"
              value={formData.numero_camiseta}
              onChange={handleInputChange}
              min="1"
              max="99"
              placeholder="1-99"
              style={{
                color: '#000000 !important',
                backgroundColor: '#ffffff !important'
              }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="fecha_incorporacion">📅 Fecha de Incorporación:</label>
            <input
              type="date"
              id="fecha_incorporacion"
              name="fecha_incorporacion"
              value={formData.fecha_incorporacion}
              onChange={handleInputChange}
              style={{
                color: '#000000 !important',
                backgroundColor: '#ffffff !important'
              }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="fecha_salida">📅 Fecha de Salida:</label>
            <input
              type="date"
              id="fecha_salida"
              name="fecha_salida"
              value={formData.fecha_salida}
              onChange={handleInputChange}
              style={{
                color: '#000000 !important',
                backgroundColor: '#ffffff !important'
              }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="estado">🏃 Estado:</label>
            <select
              id="estado"
              name="estado"
              value={formData.estado}
              onChange={handleInputChange}
              style={{
                color: '#000000 !important',
                backgroundColor: '#ffffff !important'
              }}
            >
              <option value="ACTIVO">Activo</option>
              <option value="INACTIVO">Inactivo</option>
              <option value="LESIONADO">Lesionado</option>
              <option value="SUSPENDIDO">Suspendido</option>
              <option value="CEDIDO">Cedido</option>
            </select>
          </div>

          {/* ✅ NUEVO: Selección múltiple de posiciones */}
          <div className="form-group">
            <label>⚽ Posiciones:</label>
            <div className="posiciones-selector" style={{ 
              maxHeight: '150px', 
              overflowY: 'auto',
              border: '1px solid #e1e5e9',
              borderRadius: '10px',
              padding: '10px',
              backgroundColor: '#ffffff'
            }}>
              {posiciones.map(posicion => (
                <div key={posicion.codigo_posicion} className="checkbox-item">
                  <input
                    type="checkbox"
                    id={`pos-${posicion.codigo_posicion}`}
                    checked={formData.posiciones_seleccionadas.includes(posicion.codigo_posicion)}
                    onChange={() => handlePosicionChange(posicion.codigo_posicion)}
                  />
                  <label 
                    htmlFor={`pos-${posicion.codigo_posicion}`}
                    style={{ color: '#000000 !important', marginLeft: '8px' }}
                  >
                    <strong>{posicion.codigo_posicion}</strong> - {posicion.nombre_posicion}
                  </label>
                </div>
              ))}
            </div>
            
            {formData.posiciones_seleccionadas.length > 0 && (
              <div style={{ marginTop: '10px' }}>
                <small style={{ color: '#666' }}>
                  Seleccionadas: {formData.posiciones_seleccionadas.join(', ')}
                </small>
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="button" onClick={onCancelar} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ListadoJugadores;