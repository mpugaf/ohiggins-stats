// frontend/src/components/consultas/RosterJugadores.js - Tabla estilo Excel con edición
import React, { useState, useEffect } from 'react';
import { torneosService, api, handleResponse } from '../../services/apiService';
import { useAuth } from '../../context/AuthContext';
import '../../styles/RosterJugadores.css';

const RosterJugadores = () => {
  const { user, isAdmin } = useAuth();
  const [torneos, setTorneos] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [jugadores, setJugadores] = useState([]);
  const [jugadores2, setJugadores2] = useState([]);
  const [posiciones, setPosiciones] = useState([]);
  const [selectedTorneo, setSelectedTorneo] = useState('');
  const [selectedEquipo, setSelectedEquipo] = useState('');
  const [selectedEquipo2, setSelectedEquipo2] = useState('');
  const [modoComparacion, setModoComparacion] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [error, setError] = useState(null);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    cargarTorneos();
    cargarPosiciones();
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

  useEffect(() => {
    if (selectedTorneo && selectedEquipo2) {
      cargarJugadores2(selectedTorneo, selectedEquipo2);
    } else {
      setJugadores2([]);
    }
  }, [selectedTorneo, selectedEquipo2]);

  const cargarTorneos = async () => {
    try {
      setLoading(true);
      console.log('🔄 Cargando torneos...');

      const response = await torneosService.getAll();
      const data = await handleResponse(response);

      console.log('✅ Torneos cargados:', data);
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
      console.log('🔄 Cargando equipos del torneo:', torneoId);
      const response = await torneosService.getEquipos(torneoId);
      const data = await handleResponse(response);
      console.log('✅ Equipos cargados:', data);
      setEquipos(data);
    } catch (error) {
      console.error('❌ Error al cargar equipos:', error);
      setError('Error al cargar equipos: ' + error.message);
    }
  };

  const cargarPosiciones = async () => {
    try {
      const response = await torneosService.getPositions();
      const data = await handleResponse(response);
      setPosiciones(data);
    } catch (error) {
      console.error('Error al cargar posiciones:', error);
    }
  };

  const cargarJugadores = async (torneoId, equipoId) => {
    try {
      setLoading(true);
      console.log(`🔄 Cargando jugadores - Torneo: ${torneoId}, Equipo: ${equipoId}`);

      const response = await torneosService.getEquipoJugadores(torneoId, equipoId);
      const data = await handleResponse(response);

      console.log('✅ Jugadores cargados:', data);
      setJugadores(data);
      setError(null);
    } catch (error) {
      console.error('❌ Error al cargar jugadores:', error);
      setError('Error al cargar jugadores: ' + error.message);
      setJugadores([]);
    } finally {
      setLoading(false);
    }
  };

  const cargarJugadores2 = async (torneoId, equipoId) => {
    try {
      setLoading2(true);
      console.log(`🔄 Cargando jugadores del equipo 2 - Torneo: ${torneoId}, Equipo: ${equipoId}`);

      const response = await torneosService.getEquipoJugadores(torneoId, equipoId);
      const data = await handleResponse(response);

      console.log('✅ Jugadores del equipo 2 cargados:', data);
      setJugadores2(data);
    } catch (error) {
      console.error('❌ Error al cargar jugadores del equipo 2:', error);
      setJugadores2([]);
    } finally {
      setLoading2(false);
    }
  };

  // Función para traducir pie dominante
  const traducirPie = (pie) => {
    if (!pie) return '-';
    const traducciones = {
      'LEFT': 'Izquierdo',
      'RIGHT': 'Derecho',
      'BOTH': 'Ambos'
    };
    return traducciones[pie.toUpperCase()] || pie;
  };

  // Funciones de edición
  const handleEditar = (jugador) => {
    // Solo permitir edición si es admin
    if (!isAdmin()) {
      alert('Solo los administradores pueden editar jugadores');
      return;
    }

    setEditingPlayer({
      ...jugador,
      posiciones_seleccionadas: jugador.posiciones?.map(p => p.codigo) || []
    });
    setShowEditModal(true);
  };

  const handleCerrarModal = () => {
    setShowEditModal(false);
    setEditingPlayer(null);
  };

  const handleGuardarCambios = async (datosActualizados) => {
    try {
      const response = await api.put(
        `/api/torneos/${selectedTorneo}/equipos/${selectedEquipo}/jugadores/${editingPlayer.player_id_fbr}/completo`,
        datosActualizados
      );

      await handleResponse(response);

      cargarJugadores(selectedTorneo, selectedEquipo);
      handleCerrarModal();
      alert('Jugador actualizado exitosamente');
    } catch (error) {
      console.error('Error al guardar cambios:', error);
      alert('Error al guardar los cambios: ' + error.message);
    }
  };

  // Función para obtener orden de posición
  const obtenerOrdenPosicion = (codigoPosicion) => {
    const orden = {
      // Porteros
      'GK': 1,

      // Defensas centrales
      'DF': 2,
      'CB': 2,

      // Laterales
      'FB': 3,
      'LB': 3,
      'RB': 3,
      'LWB': 3,
      'RWB': 3,

      // Mediocampistas defensivos
      'DM': 4,
      'CDM': 4,

      // Mediocampistas centrales
      'MF': 5,  // Código real en base de datos
      'CM': 5,

      // Mediocampistas ofensivos
      'AM': 6,
      'CAM': 6,

      // Extremos
      'W': 7,
      'LW': 7,
      'RW': 7,
      'LM': 7,
      'RM': 7,

      // Delanteros
      'FW': 8,
      'ST': 8,
      'CF': 8
    };

    return orden[codigoPosicion] || 99;
  };

  // Función para obtener nombre descriptivo de grupo de posición
  const obtenerNombreGrupoPosicion = (orden) => {
    const nombres = {
      1: 'Porteros',
      2: 'Defensas Centrales',
      3: 'Laterales',
      4: 'Mediocampistas Defensivos',
      5: 'Mediocampistas',
      6: 'Mediocampistas Ofensivos',
      7: 'Extremos',
      8: 'Delanteros'
    };

    return nombres[orden] || 'Otras Posiciones';
  };

  // Agrupar jugadores por posición
  const agruparJugadoresPorPosicion = () => {
    if (!jugadores || jugadores.length === 0) return {};

    const grupos = {};

    jugadores.forEach(jugador => {
      let orden = 99; // Por defecto sin posición

      if (jugador.posiciones && jugador.posiciones.length > 0) {
        // Tomar la primera posición (la principal)
        const primeraPosicion = jugador.posiciones[0].codigo;
        orden = obtenerOrdenPosicion(primeraPosicion);
      }

      if (!grupos[orden]) {
        grupos[orden] = [];
      }

      grupos[orden].push(jugador);
    });

    // Ordenar jugadores dentro de cada grupo por número de camiseta
    Object.keys(grupos).forEach(key => {
      grupos[key].sort((a, b) => {
        const numA = a.numero_camiseta || 999;
        const numB = b.numero_camiseta || 999;
        return numA - numB;
      });
    });

    return grupos;
  };

  // Función helper para ordenar jugadores
  const ordenarJugadores = (listaJugadores) => {
    return [...listaJugadores].sort((a, b) => {
      // Primero ordenar por posición
      const posA = a.posiciones && a.posiciones.length > 0 ? a.posiciones[0].codigo : 'ZZ';
      const posB = b.posiciones && b.posiciones.length > 0 ? b.posiciones[0].codigo : 'ZZ';
      const ordenA = obtenerOrdenPosicion(posA);
      const ordenB = obtenerOrdenPosicion(posB);

      if (ordenA !== ordenB) {
        return ordenA - ordenB;
      }

      // Luego por nombre completo alfabéticamente
      const nombreA = a.nombre_completo || '';
      const nombreB = b.nombre_completo || '';
      return nombreA.localeCompare(nombreB, 'es', { sensitivity: 'base' });
    });
  };

  // Ordenar todos los jugadores por posición y número
  const jugadoresOrdenados = ordenarJugadores(jugadores);
  const jugadoresOrdenados2 = ordenarJugadores(jugadores2);

  const torneoActual = torneos.find(t => t.id === parseInt(selectedTorneo));
  const equipoActual = equipos.find(e => e.id === parseInt(selectedEquipo));
  const equipoActual2 = equipos.find(e => e.id === parseInt(selectedEquipo2));

  // Función para renderizar tabla de jugadores
  const renderTablaJugadores = (listaJugadores, equipoInfo, isLoading, equipoLabel = '') => {
    if (isLoading) {
      return (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Cargando {equipoLabel}...</p>
        </div>
      );
    }

    if (listaJugadores.length === 0) {
      return (
        <div className="alert alert-info">
          {equipoLabel ? `No se encontraron jugadores para ${equipoLabel}` : 'No se encontraron jugadores'}
        </div>
      );
    }

    return (
      <>
        <div className="roster-info">
          <h2>{equipoInfo?.nombre || 'Equipo'}</h2>
          <p className="total-jugadores">
            Total de jugadores: <strong>{listaJugadores.length}</strong>
          </p>
        </div>

        <div className="tabla-container">
          <table className="tabla-jugadores">
            <thead>
              <tr>
                <th>#</th>
                <th>Nombre</th>
                <th>Apodo</th>
                <th>Posiciones</th>
                <th>Nac.</th>
                <th>Pie</th>
                <th>Edad</th>
              </tr>
            </thead>
            <tbody>
              {listaJugadores.map(jugador => (
                <tr
                  key={jugador.player_id_fbr}
                  onClick={() => isAdmin() && handleEditar(jugador)}
                  className={isAdmin() ? "fila-jugador editable" : "fila-jugador"}
                  title={isAdmin() ? "Click para editar" : "Solo lectura"}
                >
                  <td className="col-numero">{jugador.numero_camiseta || '-'}</td>
                  <td className="col-nombre">{jugador.nombre_completo}</td>
                  <td className="col-apodo">{jugador.apodo || '-'}</td>
                  <td className="col-posiciones">
                    {jugador.posiciones && jugador.posiciones.length > 0
                      ? jugador.posiciones.map(p => p.nombre || p.nombre_posicion || p.codigo).join(', ')
                      : '-'}
                  </td>
                  <td className="col-nacionalidad">
                    {jugador.nacionalidades && jugador.nacionalidades.length > 0
                      ? jugador.nacionalidades.map(n => n.codigo).join(', ')
                      : '-'}
                  </td>
                  <td className="col-pie">{traducirPie(jugador.pie_dominante)}</td>
                  <td className="col-edad">
                    {jugador.fecha_nacimiento
                      ? calcularEdad(jugador.fecha_nacimiento)
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  };

  return (
    <div className="roster-jugadores-container">
      <div className="roster-header">
        <h1>📋 Roster de Jugadores por Equipo</h1>
        <p className="subtitle">Consulta y compara los jugadores de uno o dos equipos</p>
      </div>

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      <div className="filtros-container">
        <div className="filtro-group">
          <label htmlFor="checkbox-ano-actual">
            <input
              type="checkbox"
              id="checkbox-ano-actual"
              defaultChecked={true}
              disabled={true}
            />
            Torneos del año actual
          </label>
          <small className="text-muted">
            (Esta opción está deshabilitada. Se muestran todos los torneos disponibles)
          </small>
        </div>

        <div className="filtro-group">
          <label htmlFor="select-torneo">Seleccione un Torneo:</label>
          <select
            id="select-torneo"
            className="form-control"
            value={selectedTorneo}
            onChange={(e) => setSelectedTorneo(e.target.value)}
            disabled={loading}
          >
            <option value="">-- Seleccione un torneo --</option>
            {torneos.map(torneo => (
              <option key={torneo.id} value={torneo.id}>
                {torneo.nombre_completo || `${torneo.NOMBRE} ${torneo.TEMPORADA} - ${torneo.RUEDA} rueda`}
              </option>
            ))}
          </select>
        </div>

        <div className="filtro-group">
          <label htmlFor="checkbox-modo-comparacion">
            <input
              type="checkbox"
              id="checkbox-modo-comparacion"
              checked={modoComparacion}
              onChange={(e) => {
                setModoComparacion(e.target.checked);
                if (!e.target.checked) {
                  setSelectedEquipo2('');
                  setJugadores2([]);
                }
              }}
              style={{ cursor: 'pointer' }}
            />
            🆚 Activar modo comparación (ver 2 equipos)
          </label>
          <small className="text-muted">
            Activa esta opción para comparar las alineaciones de dos equipos lado a lado
          </small>
        </div>

        <div className={modoComparacion ? "equipos-grid" : ""}>
          <div className="filtro-group">
            <label htmlFor="select-equipo">{modoComparacion ? 'Equipo 1:' : 'Seleccione un Equipo:'}</label>
            <select
              id="select-equipo"
              className="form-control"
              value={selectedEquipo}
              onChange={(e) => setSelectedEquipo(e.target.value)}
              disabled={loading || !selectedTorneo}
            >
              <option value="">-- Seleccione un equipo --</option>
              {equipos.map(equipo => (
                <option
                  key={equipo.id}
                  value={equipo.id}
                  disabled={modoComparacion && selectedEquipo2 === String(equipo.id)}
                >
                  {equipo.nombre}
                </option>
              ))}
            </select>
          </div>

          {modoComparacion && (
            <div className="filtro-group">
              <label htmlFor="select-equipo2">Equipo 2:</label>
              <select
                id="select-equipo2"
                className="form-control"
                value={selectedEquipo2}
                onChange={(e) => setSelectedEquipo2(e.target.value)}
                disabled={loading2 || !selectedTorneo}
              >
                <option value="">-- Seleccione un equipo --</option>
                {equipos.map(equipo => (
                  <option
                    key={equipo.id}
                    value={equipo.id}
                    disabled={selectedEquipo === String(equipo.id)}
                  >
                    {equipo.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Modo vista única (1 equipo) */}
      {!modoComparacion && selectedEquipo && (
        <div className="roster-single-view">
          {renderTablaJugadores(jugadoresOrdenados, equipoActual, loading)}
        </div>
      )}

      {/* Modo comparación (2 equipos) */}
      {modoComparacion && (selectedEquipo || selectedEquipo2) && (
        <div className="roster-comparison-container">
          <div className="roster-comparison-header">
            <h3>🆚 Comparación de Alineaciones</h3>
            <p className="torneo-info">
              {torneoActual?.nombre_completo || torneoActual?.NOMBRE || 'Torneo'}
              {torneoActual?.TEMPORADA && ` - ${torneoActual.TEMPORADA}`}
            </p>
          </div>

          <div className="roster-comparison-grid">
            <div className="roster-column">
              {selectedEquipo ? (
                renderTablaJugadores(jugadoresOrdenados, equipoActual, loading, 'Equipo 1')
              ) : (
                <div className="alert alert-info">
                  Seleccione el primer equipo para comenzar la comparación
                </div>
              )}
            </div>

            <div className="roster-column">
              {selectedEquipo2 ? (
                renderTablaJugadores(jugadoresOrdenados2, equipoActual2, loading2, 'Equipo 2')
              ) : (
                <div className="alert alert-info">
                  Seleccione el segundo equipo para comparar
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mensaje inicial */}
      {!selectedTorneo && !loading && (
        <div className="mensaje-inicial">
          <p>👆 Seleccione un torneo y configure los equipos a visualizar</p>
        </div>
      )}

      {selectedTorneo && !selectedEquipo && !modoComparacion && (
        <div className="mensaje-inicial">
          <p>👆 Seleccione un equipo para ver su roster</p>
        </div>
      )}

      {/* Modal de Edición */}
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

  function calcularEdad(fechaNacimiento) {
    if (!fechaNacimiento) return 'N/A';
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  }
};

// Componente Modal de Edición
const ModalEdicionJugador = ({ jugador, posiciones, onGuardar, onCancelar }) => {
  const [formData, setFormData] = useState({
    numero_camiseta: jugador.numero_camiseta || '',
    fecha_incorporacion: jugador.fecha_incorporacion ?
      jugador.fecha_incorporacion.split('T')[0] : '',
    fecha_salida: jugador.fecha_salida ?
      jugador.fecha_salida.split('T')[0] : '',
    estado: jugador.estado || 'ACTIVO',
    pie_dominante: jugador.pie_dominante || '',
    posiciones_seleccionadas: jugador.posiciones_seleccionadas || []
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

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
    <div className="modal-overlay" onClick={onCancelar}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>✏️ Editar Jugador</h3>
          <button onClick={onCancelar} className="close-btn">✕</button>
        </div>

        <div className="jugador-edit-info">
          <h4>{jugador.nombre_completo}</h4>
          {jugador.apodo && <p>"{jugador.apodo}"</p>}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="numero_camiseta">👕 Número:</label>
              <input
                type="number"
                id="numero_camiseta"
                name="numero_camiseta"
                value={formData.numero_camiseta}
                onChange={handleInputChange}
                min="1"
                max="99"
                placeholder="1-99"
              />
            </div>

            <div className="form-group">
              <label htmlFor="estado">🏃 Estado:</label>
              <select
                id="estado"
                name="estado"
                value={formData.estado}
                onChange={handleInputChange}
              >
                <option value="ACTIVO">Activo</option>
                <option value="INACTIVO">Inactivo</option>
                <option value="LESIONADO">Lesionado</option>
                <option value="SUSPENDIDO">Suspendido</option>
                <option value="CEDIDO">Cedido</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="pie_dominante">🦶 Pie Hábil:</label>
              <select
                id="pie_dominante"
                name="pie_dominante"
                value={formData.pie_dominante}
                onChange={handleInputChange}
              >
                <option value="">-- Seleccionar --</option>
                <option value="LEFT">Izquierdo</option>
                <option value="RIGHT">Derecho</option>
                <option value="BOTH">Ambos</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="fecha_incorporacion">📅 F. Incorporación:</label>
              <input
                type="date"
                id="fecha_incorporacion"
                name="fecha_incorporacion"
                value={formData.fecha_incorporacion}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="fecha_salida">📅 F. Salida:</label>
              <input
                type="date"
                id="fecha_salida"
                name="fecha_salida"
                value={formData.fecha_salida}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label>⚽ Posiciones:</label>
            <div className="posiciones-selector">
              {posiciones.map(posicion => (
                <div key={posicion.codigo_posicion} className="checkbox-item">
                  <input
                    type="checkbox"
                    id={`pos-${posicion.codigo_posicion}`}
                    checked={formData.posiciones_seleccionadas.includes(posicion.codigo_posicion)}
                    onChange={() => handlePosicionChange(posicion.codigo_posicion)}
                  />
                  <label htmlFor={`pos-${posicion.codigo_posicion}`}>
                    <strong>{posicion.codigo_posicion}</strong> - {posicion.nombre_posicion}
                  </label>
                </div>
              ))}
            </div>

            {formData.posiciones_seleccionadas.length > 0 && (
              <div className="posiciones-seleccionadas">
                <small>
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
              💾 Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RosterJugadores;
