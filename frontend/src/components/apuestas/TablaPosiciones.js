import React, { useState, useEffect } from 'react';
import { pronosticosService, configApuestasService, mensajesGanadoresService, handleResponse } from '../../services/apiService';
import { useAuth } from '../../context/AuthContext';
import TeamLogo from '../common/TeamLogo';
import './TablaPosiciones.css';
import './MensajesGanadores.css';

const TablaPosiciones = () => {
  const { user } = useAuth();
  const [vistaActiva, setVistaActiva] = useState('tabla'); // 'tabla' o 'apuestas'

  // Tabla de posiciones
  const [tabla, setTabla] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Mensajes de ganadores
  const [ganadoresJornadas, setGanadoresJornadas] = useState([]);
  const [mensajesGanadores, setMensajesGanadores] = useState({});
  const [loadingMensajes, setLoadingMensajes] = useState(false);

  // Filtros
  const [torneos, setTorneos] = useState([]);
  const [torneoSeleccionado, setTorneoSeleccionado] = useState('');
  const [fechas, setFechas] = useState([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState('todas');

  // Apuestas por partido
  const [partidos, setPartidos] = useState([]);
  const [loadingApuestas, setLoadingApuestas] = useState(false);
  const [errorApuestas, setErrorApuestas] = useState('');
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState('');
  const [usuarios, setUsuarios] = useState([]);
  const [torneoApuestas, setTorneoApuestas] = useState('');
  const [fechaApuestas, setFechaApuestas] = useState('todas');
  const [fechasApuestas, setFechasApuestas] = useState([]);

  // Config
  const [apuestasHabilitadas, setApuestasHabilitadas] = useState(true);

  useEffect(() => {
    cargarConfiguracion();
    inicializarDatos();
  }, []);

  useEffect(() => {
    if (torneoSeleccionado && fechaSeleccionada) {
      cargarTabla();
    }
  }, [torneoSeleccionado, fechaSeleccionada]);

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

  const inicializarDatos = async () => {
    try {
      setLoading(true);
      setError('');

      // Cargar torneos disponibles
      const torneosResponse = await pronosticosService.getTorneosDisponibles();
      const torneosData = await handleResponse(torneosResponse);

      if (torneosData.success && torneosData.torneos.length > 0) {
        setTorneos(torneosData.torneos);

        // Obtener última fecha disponible
        const ultimaFechaResponse = await pronosticosService.getUltimaFecha();
        const ultimaFechaData = await handleResponse(ultimaFechaResponse);

        if (ultimaFechaData.success && ultimaFechaData.torneo && ultimaFechaData.fecha) {
          // Establecer torneo y fecha por defecto (última fecha)
          setTorneoSeleccionado(ultimaFechaData.torneo.toString());
          setFechaSeleccionada(ultimaFechaData.fecha.toString());

          // Cargar fechas del torneo
          const fechasResponse = await pronosticosService.getFechasTorneo(ultimaFechaData.torneo);
          const fechasData = await handleResponse(fechasResponse);
          if (fechasData.success) {
            setFechas(fechasData.fechas || []);
          }
        } else {
          // Si no hay última fecha, usar el primer torneo y todas las fechas
          const primerTorneo = torneosData.torneos[0].ID_TORNEO.toString();
          setTorneoSeleccionado(primerTorneo);
          setFechaSeleccionada('todas');

          // Cargar fechas del primer torneo
          const fechasResponse = await pronosticosService.getFechasTorneo(primerTorneo);
          const fechasData = await handleResponse(fechasResponse);
          if (fechasData.success) {
            setFechas(fechasData.fechas || []);
          }
        }
      } else {
        setError('No hay torneos con apuestas disponibles');
      }

    } catch (err) {
      console.error('Error inicializando datos:', err);
      setError(err.message || 'Error al cargar datos iniciales');
    } finally {
      setLoading(false);
    }
  };

  const cargarTabla = async () => {
    if (!torneoSeleccionado) return;

    try {
      setLoading(true);
      setError('');

      const response = await pronosticosService.getTablaPosiciones(
        torneoSeleccionado,
        fechaSeleccionada
      );
      const data = await handleResponse(response);

      setTabla(data.tabla || []);

    } catch (err) {
      console.error('Error cargando tabla de posiciones:', err);
      setError(err.message || 'Error al cargar tabla de posiciones');
      setTabla([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCambioTorneo = async (e) => {
    const nuevoTorneo = e.target.value;
    setTorneoSeleccionado(nuevoTorneo);
    setFechaSeleccionada('todas');
    setFechas([]);

    if (nuevoTorneo) {
      try {
        const response = await pronosticosService.getFechasTorneo(nuevoTorneo);
        const data = await handleResponse(response);
        if (data.success) {
          setFechas(data.fechas || []);
        }
      } catch (err) {
        console.error('Error cargando fechas del torneo:', err);
      }
    }
  };

  const handleCambioFecha = (e) => {
    setFechaSeleccionada(e.target.value);
  };

  // Funciones para mensajes de ganadores
  const cargarMensajesGanadores = async (idTorneo) => {
    if (!idTorneo) return;

    try {
      setLoadingMensajes(true);

      // Cargar ganadores de cada jornada
      const ganadoresResponse = await mensajesGanadoresService.getGanadores(idTorneo);
      const ganadoresData = await handleResponse(ganadoresResponse);

      if (ganadoresData.success) {
        setGanadoresJornadas(ganadoresData.ganadores || []);
      }

      // Cargar mensajes existentes
      const mensajesResponse = await mensajesGanadoresService.getMensajes(idTorneo);
      const mensajesData = await handleResponse(mensajesResponse);

      if (mensajesData.success) {
        // Convertir array de mensajes a objeto por jornada
        const mensajesPorJornada = {};
        mensajesData.mensajes.forEach(msg => {
          mensajesPorJornada[msg.numero_jornada] = msg.mensaje;
        });
        setMensajesGanadores(mensajesPorJornada);
      }

    } catch (err) {
      console.error('Error cargando mensajes de ganadores:', err);
    } finally {
      setLoadingMensajes(false);
    }
  };

  const guardarMensajeGanador = async (numeroJornada, mensaje) => {
    if (!torneoSeleccionado || !mensaje || mensaje.trim().length === 0) {
      return;
    }

    try {
      const response = await mensajesGanadoresService.guardarMensaje(
        torneoSeleccionado,
        numeroJornada,
        mensaje.trim()
      );

      const data = await handleResponse(response);

      if (data.success) {
        alert('Mensaje guardado exitosamente');
        // Actualizar estado local
        setMensajesGanadores(prev => ({
          ...prev,
          [numeroJornada]: mensaje.trim()
        }));
      }

    } catch (err) {
      console.error('Error guardando mensaje:', err);
      alert('Error al guardar mensaje: ' + err.message);
    }
  };

  // Efecto para cargar mensajes cuando cambia el torneo
  useEffect(() => {
    if (torneoSeleccionado) {
      cargarMensajesGanadores(torneoSeleccionado);
    }
  }, [torneoSeleccionado]);

  const cargarApuestasPorPartido = async (torneoId = null, fecha = null) => {
    try {
      setLoadingApuestas(true);
      setErrorApuestas('');

      // Si no se pasa torneo, usar el seleccionado
      const torneoFinal = torneoId || torneoApuestas;
      const fechaFinal = fecha || fechaApuestas;

      if (!torneoFinal) {
        setErrorApuestas('Debes seleccionar un torneo');
        setPartidos([]);
        setLoadingApuestas(false);
        return;
      }

      // Llamar endpoint con parámetros
      const response = await pronosticosService.getApuestasPorPartidoFiltrado(
        torneoFinal,
        fechaFinal === 'todas' ? null : fechaFinal
      );
      const data = await handleResponse(response);

      // Ordenar partidos por fecha (más antiguo a más nuevo)
      const partidosOrdenados = (data.partidos || []).sort((a, b) => {
        return new Date(a.FECHA_PARTIDO) - new Date(b.FECHA_PARTIDO);
      });

      setPartidos(partidosOrdenados);

      // Extraer lista única de usuarios de las apuestas
      const usuariosUnicos = new Map();
      partidosOrdenados.forEach(partido => {
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

  const handleCambioTorneoApuestas = async (e) => {
    const nuevoTorneo = e.target.value;
    setTorneoApuestas(nuevoTorneo);
    setFechaApuestas('todas');
    setFechasApuestas([]);
    setUsuarioSeleccionado('');
    setPartidos([]);

    if (nuevoTorneo) {
      try {
        const response = await pronosticosService.getFechasTorneo(nuevoTorneo);
        const data = await handleResponse(response);
        if (data.success) {
          setFechasApuestas(data.fechas || []);
          // Cargar apuestas automáticamente
          cargarApuestasPorPartido(nuevoTorneo, 'todas');
        }
      } catch (err) {
        console.error('Error cargando fechas del torneo:', err);
      }
    }
  };

  const handleCambioFechaApuestas = (e) => {
    const nuevaFecha = e.target.value;
    setFechaApuestas(nuevaFecha);
    setUsuarioSeleccionado('');
    if (torneoApuestas) {
      cargarApuestasPorPartido(torneoApuestas, nuevaFecha);
    }
  };

  const handleCambiarVista = (vista) => {
    setVistaActiva(vista);
    if (vista === 'apuestas') {
      // Si no hay torneo seleccionado, usar el de la tabla de posiciones
      if (!torneoApuestas && torneoSeleccionado) {
        setTorneoApuestas(torneoSeleccionado);
        // Cargar fechas del torneo
        pronosticosService.getFechasTorneo(torneoSeleccionado)
          .then(response => handleResponse(response))
          .then(data => {
            if (data.success) {
              setFechasApuestas(data.fechas || []);
              cargarApuestasPorPartido(torneoSeleccionado, 'todas');
            }
          })
          .catch(err => console.error('Error cargando fechas:', err));
      } else if (torneoApuestas && partidos.length === 0) {
        cargarApuestasPorPartido();
      }
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
          </div>

          {/* Filtros de Torneo y Fecha */}
          <div className="filtros-container">
            <div className="filtro-group">
              <label htmlFor="torneo-select" className="filtro-label">
                Torneo:
              </label>
              <select
                id="torneo-select"
                value={torneoSeleccionado}
                onChange={handleCambioTorneo}
                className="filtro-select"
                disabled={loading}
              >
                <option value="">-- Selecciona un torneo --</option>
                {torneos.map((torneo) => (
                  <option key={torneo.ID_TORNEO} value={torneo.ID_TORNEO}>
                    {torneo.NOMBRE} {torneo.TEMPORADA}
                  </option>
                ))}
              </select>
            </div>

            <div className="filtro-group">
              <label htmlFor="fecha-select" className="filtro-label">
                Fecha:
              </label>
              <select
                id="fecha-select"
                value={fechaSeleccionada}
                onChange={handleCambioFecha}
                className="filtro-select"
                disabled={loading || !torneoSeleccionado}
              >
                <option value="todas">Todas las fechas</option>
                {fechas.map((fecha) => (
                  <option key={fecha} value={fecha}>
                    Fecha {fecha}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {fechaSeleccionada && (
            <p className="tabla-subtitle">
              {fechaSeleccionada === 'todas'
                ? 'Acumulado de todas las fechas'
                : `Fecha ${fechaSeleccionada}`
              } - Ranking basado en retornos con apuesta de $10,000 por partido
            </p>
          )}

          {error && (
            <div className="error-message">{error}</div>
          )}

          {!error && !loading && tabla.length === 0 && torneoSeleccionado && (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <p>No hay datos de apuestas para mostrar</p>
              <p className="empty-hint">Aún no hay usuarios con apuestas registradas en este torneo/fecha</p>
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
            <p className="tabla-subtitle">
              Consulta las apuestas de cada usuario por partido
            </p>
          </div>

          {/* Filtros de Torneo y Fecha */}
          <div className="filtros-container">
            <div className="filtro-group">
              <label htmlFor="torneo-apuestas-select" className="filtro-label">
                Torneo:
              </label>
              <select
                id="torneo-apuestas-select"
                value={torneoApuestas}
                onChange={handleCambioTorneoApuestas}
                className="filtro-select"
                disabled={loadingApuestas}
              >
                <option value="">-- Selecciona un torneo --</option>
                {torneos.map((torneo) => (
                  <option key={torneo.ID_TORNEO} value={torneo.ID_TORNEO}>
                    {torneo.NOMBRE} {torneo.TEMPORADA}
                  </option>
                ))}
              </select>
            </div>

            {torneoApuestas && (
              <div className="filtro-group">
                <label htmlFor="fecha-apuestas-select" className="filtro-label">
                  Fecha:
                </label>
                <select
                  id="fecha-apuestas-select"
                  value={fechaApuestas}
                  onChange={handleCambioFechaApuestas}
                  className="filtro-select"
                  disabled={loadingApuestas}
                >
                  <option value="todas">Todas las fechas (agrupadas)</option>
                  {fechasApuestas.map((fecha) => (
                    <option key={fecha} value={fecha}>
                      Fecha {fecha}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {torneoApuestas && usuarios.length > 0 && (
              <div className="filtro-group">
                <label htmlFor="usuario-select" className="filtro-label">
                  Usuario:
                </label>
                <select
                  id="usuario-select"
                  value={usuarioSeleccionado}
                  onChange={(e) => setUsuarioSeleccionado(e.target.value)}
                  className="filtro-select"
                >
                  <option value="">-- Todos los usuarios --</option>
                  {usuarios.map((usuario) => (
                    <option key={usuario.id} value={usuario.id}>
                      {usuario.nombre_completo || usuario.username}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {!torneoApuestas && !loadingApuestas && (
            <div className="mensaje-seleccion">
              <p>Por favor selecciona un torneo para ver las apuestas</p>
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

          {!loadingApuestas && !errorApuestas && partidos.length > 0 && (
            <>
              {/* Agrupar partidos por fecha si no hay fecha seleccionada */}
              {fechaApuestas === 'todas' ? (
                // Mostrar agrupado por fecha
                (() => {
                  const partidosPorFecha = partidos.reduce((acc, partido) => {
                    const fecha = partido.NUMERO_JORNADA || 'Sin fecha';
                    if (!acc[fecha]) acc[fecha] = [];
                    acc[fecha].push(partido);
                    return acc;
                  }, {});

                  return Object.keys(partidosPorFecha)
                    .sort((a, b) => {
                      if (a === 'Sin fecha') return 1;
                      if (b === 'Sin fecha') return -1;
                      return parseInt(a) - parseInt(b);
                    })
                    .map(fecha => (
                      <div key={fecha} className="grupo-fecha">
                        <h3 className="grupo-fecha-titulo">
                          📅 Fecha {fecha}
                        </h3>
                        <div className="tabla-wrapper">
                          <table className="tabla-apuestas-moderna">
                            <thead>
                              <tr>
                                <th>Partido</th>
                                <th>Fecha/Hora</th>
                                <th>Resultado</th>
                                {!usuarioSeleccionado && <th>Total Apuestas</th>}
                                {usuarioSeleccionado && <th>Apuesta</th>}
                                {usuarioSeleccionado && <th>Estado</th>}
                                {usuarioSeleccionado && <th>Puntos</th>}
                              </tr>
                            </thead>
                            <tbody>
                              {partidosPorFecha[fecha].map((partido) => {
                                if (usuarioSeleccionado) {
                                  const apuestaUsuario = partido.apuestas.find(
                                    a => a.id_usuario === parseInt(usuarioSeleccionado)
                                  );
                                  if (!apuestaUsuario) return null;

                                  return (
                                    <tr key={partido.ID_PARTIDO}>
                                      <td className="col-partido">
                                        <div className="partido-info">
                                          <TeamLogo imagen={partido.imagen_local} nombreEquipo={partido.equipo_local} size="small" />
                                          <span className="vs-text">vs</span>
                                          <TeamLogo imagen={partido.imagen_visita} nombreEquipo={partido.equipo_visita} size="small" />
                                        </div>
                                        <div className="equipos-nombres">
                                          {partido.equipo_local} - {partido.equipo_visita}
                                        </div>
                                      </td>
                                      <td className="col-fecha-hora">
                                        {formatDate(partido.FECHA_PARTIDO)}
                                      </td>
                                      <td className="col-resultado text-center">
                                        {partido.GOLES_LOCAL !== null && partido.GOLES_VISITA !== null ? (
                                          <span className="resultado-marcador">
                                            {partido.GOLES_LOCAL} - {partido.GOLES_VISITA}
                                          </span>
                                        ) : (
                                          <span className="resultado-pendiente">-</span>
                                        )}
                                      </td>
                                      <td className="col-apuesta text-center">
                                        <span className={`badge-apuesta tipo-${apuestaUsuario.tipo_apuesta}`}>
                                          {getTipoApuestaIcon(apuestaUsuario.tipo_apuesta)}
                                          {' '}
                                          {apuestaUsuario.tipo_apuesta === 'local' && partido.equipo_local}
                                          {apuestaUsuario.tipo_apuesta === 'empate' && 'Empate'}
                                          {apuestaUsuario.tipo_apuesta === 'visita' && partido.equipo_visita}
                                        </span>
                                      </td>
                                      <td className={`col-estado text-center`}>
                                        <span className={`badge ${getEstadoBadgeClass(apuestaUsuario.estado)}`}>
                                          {apuestaUsuario.estado === 'ganada' && '✅ Ganada'}
                                          {apuestaUsuario.estado === 'perdida' && '❌ Perdida'}
                                          {apuestaUsuario.estado === 'pendiente' && '⏳ Pendiente'}
                                        </span>
                                      </td>
                                      <td className="col-puntos text-right">
                                        {apuestaUsuario.estado === 'ganada' ? (
                                          <span className="puntos-ganados">
                                            +${parseInt(apuestaUsuario.puntos_ganados || 0).toLocaleString('es-CL')}
                                          </span>
                                        ) : (
                                          <span className="puntos-cero">$0</span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                } else {
                                  // Mostrar todos los usuarios
                                  return (
                                    <tr key={partido.ID_PARTIDO}>
                                      <td className="col-partido">
                                        <div className="partido-info">
                                          <TeamLogo imagen={partido.imagen_local} nombreEquipo={partido.equipo_local} size="small" />
                                          <span className="vs-text">vs</span>
                                          <TeamLogo imagen={partido.imagen_visita} nombreEquipo={partido.equipo_visita} size="small" />
                                        </div>
                                        <div className="equipos-nombres">
                                          {partido.equipo_local} - {partido.equipo_visita}
                                        </div>
                                      </td>
                                      <td className="col-fecha-hora">
                                        {formatDate(partido.FECHA_PARTIDO)}
                                      </td>
                                      <td className="col-resultado text-center">
                                        {partido.GOLES_LOCAL !== null && partido.GOLES_VISITA !== null ? (
                                          <span className="resultado-marcador">
                                            {partido.GOLES_LOCAL} - {partido.GOLES_VISITA}
                                          </span>
                                        ) : (
                                          <span className="resultado-pendiente">-</span>
                                        )}
                                      </td>
                                      <td className="col-total-apuestas text-center">
                                        <div className="conteo-apuestas">
                                          <span className="total-badge">{partido.conteoApuestas?.total || 0} total</span>
                                          <div className="detalle-conteo">
                                            <span className="conteo-local">🏠 {partido.conteoApuestas?.local || 0}</span>
                                            <span className="conteo-empate">🤝 {partido.conteoApuestas?.empate || 0}</span>
                                            <span className="conteo-visita">✈️ {partido.conteoApuestas?.visita || 0}</span>
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                }
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ));
                })()
              ) : (
                // Mostrar para una sola fecha
                <div className="tabla-wrapper">
                  <table className="tabla-apuestas-moderna">
                    <thead>
                      <tr>
                        <th>Partido</th>
                        <th>Fecha/Hora</th>
                        <th>Resultado</th>
                        {!usuarioSeleccionado && <th>Total Apuestas</th>}
                        {usuarioSeleccionado && <th>Apuesta</th>}
                        {usuarioSeleccionado && <th>Estado</th>}
                        {usuarioSeleccionado && <th>Puntos</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {partidos.map((partido) => {
                        if (usuarioSeleccionado) {
                          const apuestaUsuario = partido.apuestas.find(
                            a => a.id_usuario === parseInt(usuarioSeleccionado)
                          );
                          if (!apuestaUsuario) return null;

                          return (
                            <tr key={partido.ID_PARTIDO}>
                              <td className="col-partido">
                                <div className="partido-info">
                                  <TeamLogo imagen={partido.imagen_local} nombreEquipo={partido.equipo_local} size="small" />
                                  <span className="vs-text">vs</span>
                                  <TeamLogo imagen={partido.imagen_visita} nombreEquipo={partido.equipo_visita} size="small" />
                                </div>
                                <div className="equipos-nombres">
                                  {partido.equipo_local} - {partido.equipo_visita}
                                </div>
                              </td>
                              <td className="col-fecha-hora">
                                {formatDate(partido.FECHA_PARTIDO)}
                              </td>
                              <td className="col-resultado text-center">
                                {partido.GOLES_LOCAL !== null && partido.GOLES_VISITA !== null ? (
                                  <span className="resultado-marcador">
                                    {partido.GOLES_LOCAL} - {partido.GOLES_VISITA}
                                  </span>
                                ) : (
                                  <span className="resultado-pendiente">-</span>
                                )}
                              </td>
                              <td className="col-apuesta text-center">
                                <span className={`badge-apuesta tipo-${apuestaUsuario.tipo_apuesta}`}>
                                  {getTipoApuestaIcon(apuestaUsuario.tipo_apuesta)}
                                  {' '}
                                  {apuestaUsuario.tipo_apuesta === 'local' && partido.equipo_local}
                                  {apuestaUsuario.tipo_apuesta === 'empate' && 'Empate'}
                                  {apuestaUsuario.tipo_apuesta === 'visita' && partido.equipo_visita}
                                </span>
                              </td>
                              <td className={`col-estado text-center`}>
                                <span className={`badge ${getEstadoBadgeClass(apuestaUsuario.estado)}`}>
                                  {apuestaUsuario.estado === 'ganada' && '✅ Ganada'}
                                  {apuestaUsuario.estado === 'perdida' && '❌ Perdida'}
                                  {apuestaUsuario.estado === 'pendiente' && '⏳ Pendiente'}
                                </span>
                              </td>
                              <td className="col-puntos text-right">
                                {apuestaUsuario.estado === 'ganada' ? (
                                  <span className="puntos-ganados">
                                    +${parseInt(apuestaUsuario.puntos_ganados || 0).toLocaleString('es-CL')}
                                  </span>
                                ) : (
                                  <span className="puntos-cero">$0</span>
                                )}
                              </td>
                            </tr>
                          );
                        } else {
                          return (
                            <tr key={partido.ID_PARTIDO}>
                              <td className="col-partido">
                                <div className="partido-info">
                                  <TeamLogo imagen={partido.imagen_local} nombreEquipo={partido.equipo_local} size="small" />
                                  <span className="vs-text">vs</span>
                                  <TeamLogo imagen={partido.imagen_visita} nombreEquipo={partido.equipo_visita} size="small" />
                                </div>
                                <div className="equipos-nombres">
                                  {partido.equipo_local} - {partido.equipo_visita}
                                </div>
                              </td>
                              <td className="col-fecha-hora">
                                {formatDate(partido.FECHA_PARTIDO)}
                              </td>
                              <td className="col-resultado text-center">
                                {partido.GOLES_LOCAL !== null && partido.GOLES_VISITA !== null ? (
                                  <span className="resultado-marcador">
                                    {partido.GOLES_LOCAL} - {partido.GOLES_VISITA}
                                  </span>
                                ) : (
                                  <span className="resultado-pendiente">-</span>
                                )}
                              </td>
                              <td className="col-total-apuestas text-center">
                                <div className="conteo-apuestas">
                                  <span className="total-badge">{partido.conteoApuestas?.total || 0} total</span>
                                  <div className="detalle-conteo">
                                    <span className="conteo-local">🏠 {partido.conteoApuestas?.local || 0}</span>
                                    <span className="conteo-empate">🤝 {partido.conteoApuestas?.empate || 0}</span>
                                    <span className="conteo-visita">✈️ {partido.conteoApuestas?.visita || 0}</span>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        }
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Sección de Mensajes de Ganadores por Jornada */}
      {torneoSeleccionado && ganadoresJornadas.length > 0 && (
        <div className="mensajes-ganadores-section">
          <h3 className="mensajes-titulo">💬 Mensajes de Ganadores por Jornada</h3>
          <p className="mensajes-subtitulo">
            El ganador de cada jornada puede dejar un mensaje único que quedará registrado para siempre.
          </p>

          {loadingMensajes ? (
            <div className="loading-mensajes">Cargando mensajes...</div>
          ) : (
            <div className="mensajes-grid">
              {ganadoresJornadas.map((ganador) => {
                const jornada = ganador.numero_jornada;
                const mensajeExistente = mensajesGanadores[jornada];
                const esGanador = user && user.id_usuario === ganador.id_usuario_ganador;
                const puedeEscribir = esGanador && !mensajeExistente;

                return (
                  <div key={jornada} className="mensaje-card">
                    <div className="mensaje-header">
                      <span className="jornada-numero">Jornada {jornada}</span>
                      {ganador.nombre_completo ? (
                        <span className="ganador-nombre">🏆 {ganador.nombre_completo}</span>
                      ) : (
                        <span className="ganador-nombre">🏆 {ganador.username}</span>
                      )}
                      <span className="puntos-ganador">{Math.round(ganador.puntos_jornada)} pts</span>
                    </div>

                    <div className="mensaje-body">
                      {mensajeExistente ? (
                        <div className="mensaje-guardado">
                          <div className="mensaje-icono">💭</div>
                          <div className="mensaje-texto">"{mensajeExistente}"</div>
                        </div>
                      ) : puedeEscribir ? (
                        <MensajeInput
                          jornada={jornada}
                          onGuardar={guardarMensajeGanador}
                        />
                      ) : (
                        <div className="mensaje-vacio">
                          <span className="mensaje-pendiente">
                            {esGanador
                              ? '✍️ Deja tu mensaje aquí'
                              : '⏳ El ganador aún no ha dejado su mensaje'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Componente para ingresar mensaje
const MensajeInput = ({ jornada, onGuardar }) => {
  const [mensaje, setMensaje] = useState('');
  const [guardando, setGuardando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (mensaje.trim().length === 0) {
      alert('El mensaje no puede estar vacío');
      return;
    }

    if (mensaje.length > 100) {
      alert('El mensaje no puede exceder 100 caracteres');
      return;
    }

    setGuardando(true);
    await onGuardar(jornada, mensaje);
    setGuardando(false);
  };

  return (
    <form onSubmit={handleSubmit} className="mensaje-form">
      <input
        type="text"
        value={mensaje}
        onChange={(e) => setMensaje(e.target.value)}
        placeholder="Escribe tu mensaje aquí (máx. 100 caracteres)..."
        maxLength={100}
        disabled={guardando}
        className="mensaje-input"
      />
      <div className="mensaje-actions">
        <span className="caracteres-contador">
          {mensaje.length}/100
        </span>
        <button
          type="submit"
          disabled={guardando || mensaje.trim().length === 0}
          className="btn-guardar-mensaje"
        >
          {guardando ? 'Guardando...' : '💾 Guardar'}
        </button>
      </div>
    </form>
  );
};

export default TablaPosiciones;
