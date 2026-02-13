import React, { useState, useEffect } from 'react';
import { partidosHistoricoService, handleResponse } from '../../services/apiService';
import TeamLogo from '../common/TeamLogo';
import './PartidosHistoricos.css';

function PartidosHistoricosNew() {
  const [loading, setLoading] = useState(true);
  const [torneos, setTorneos] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [fechas, setFechas] = useState([]);
  const [partidos, setPartidos] = useState([]);

  // Filtros
  const [selectedTorneo, setSelectedTorneo] = useState('');
  const [selectedEquipo, setSelectedEquipo] = useState('');
  const [selectedFecha, setSelectedFecha] = useState('');
  const [usarRangoFechas, setUsarRangoFechas] = useState(false);
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  const [error, setError] = useState(null);

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const partidosPorPagina = 8;

  // Cargar torneos al iniciar
  useEffect(() => {
    fetchTorneos();
  }, []);

  // Cargar equipos y fechas cuando se selecciona un torneo
  useEffect(() => {
    if (selectedTorneo) {
      fetchEquiposPorTorneo(selectedTorneo);
      fetchFechasPorTorneo(selectedTorneo);
      // Auto-cargar partidos
      fetchPartidos();
    } else {
      setEquipos([]);
      setFechas([]);
      setPartidos([]);
    }
  }, [selectedTorneo]);

  // Cargar partidos cuando cambian los filtros
  useEffect(() => {
    if (selectedTorneo && !usarRangoFechas) {
      setPaginaActual(1);
      fetchPartidos();
    }
  }, [selectedEquipo, selectedFecha]);

  // Cargar partidos cuando se usa rango de fechas
  useEffect(() => {
    if (selectedTorneo && usarRangoFechas && fechaDesde && fechaHasta) {
      setPaginaActual(1);
      fetchPartidos();
    }
  }, [fechaDesde, fechaHasta]);

  const fetchTorneos = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await partidosHistoricoService.getTorneos();
      const data = await handleResponse(response);

      if (data.success) {
        const torneosRecibidos = data.torneos || [];
        setTorneos(torneosRecibidos);

        if (torneosRecibidos.length > 0) {
          // Seleccionar automáticamente el primer torneo
          setSelectedTorneo(torneosRecibidos[0].ID_TORNEO.toString());
        } else {
          setError('No hay torneos con partidos finalizados disponibles');
        }
      } else {
        setError(data.error || 'Error al obtener torneos');
      }
    } catch (error) {
      console.error('[HISTORICO] Error al cargar torneos:', error);
      setError(`Error al cargar torneos: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchEquiposPorTorneo = async (torneoId) => {
    try {
      const response = await partidosHistoricoService.getEquiposPorTorneo(torneoId);
      const data = await handleResponse(response);

      if (data.success) {
        setEquipos(data.equipos || []);
        setSelectedEquipo(''); // Reset selección de equipo
      }
    } catch (error) {
      console.error('[HISTORICO] Error al cargar equipos:', error);
      setError('Error al cargar equipos del torneo');
    }
  };

  const fetchFechasPorTorneo = async (torneoId) => {
    try {
      const response = await partidosHistoricoService.getFechasPorTorneo(torneoId);
      const data = await handleResponse(response);

      if (data.success) {
        setFechas(data.fechas || []);
        setSelectedFecha(''); // Reset selección de fecha
      }
    } catch (error) {
      console.error('[HISTORICO] Error al cargar fechas:', error);
      setError('Error al cargar fechas del torneo');
    }
  };

  const fetchPartidos = async () => {
    try {
      setLoading(true);
      const params = {};

      if (selectedTorneo) {
        params.torneoId = selectedTorneo;
      }

      if (usarRangoFechas) {
        // Si se usa rango de fechas, solo enviar rango
        if (fechaDesde && fechaHasta) {
          params.fechaDesde = fechaDesde;
          params.fechaHasta = fechaHasta;
        } else {
          setLoading(false);
          return; // No buscar si el rango está incompleto
        }
      } else {
        // Si no se usa rango, usar filtros de fecha/equipo
        if (selectedFecha) {
          params.fecha = selectedFecha;
        }

        if (selectedEquipo) {
          params.equipoId = selectedEquipo;
        }
      }

      const response = await partidosHistoricoService.getPartidosHistoricos(params);
      const data = await handleResponse(response);

      if (data.success) {
        setPartidos(data.partidos || []);
      }
    } catch (error) {
      console.error('[HISTORICO] Error al cargar partidos históricos:', error);
      setError('Error al cargar partidos históricos');
    } finally {
      setLoading(false);
    }
  };

  const handleTorneoChange = (e) => {
    setSelectedTorneo(e.target.value);
    setUsarRangoFechas(false); // Reset rango de fechas
    setFechaDesde('');
    setFechaHasta('');
  };

  const handleEquipoChange = (e) => {
    setSelectedEquipo(e.target.value);
  };

  const handleFechaChange = (e) => {
    setSelectedFecha(e.target.value);
  };

  const handleToggleRangoFechas = (e) => {
    const usar = e.target.checked;
    setUsarRangoFechas(usar);

    if (usar) {
      // Si se activa el rango, limpiar filtros de fecha/equipo
      setSelectedFecha('');
      setSelectedEquipo('');
    } else {
      // Si se desactiva, limpiar el rango
      setFechaDesde('');
      setFechaHasta('');
    }
  };

  const formatFecha = (fechaStr) => {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEstadoBadgeClass = (estado) => {
    switch (estado) {
      case 'FINALIZADO':
        return 'badge-finalizado';
      case 'SUSPENDIDO':
        return 'badge-suspendido';
      case 'CANCELADO':
        return 'badge-cancelado';
      default:
        return '';
    }
  };

  // Calcular paginación
  const totalPaginas = Math.ceil(partidos.length / partidosPorPagina);
  const indiceInicio = (paginaActual - 1) * partidosPorPagina;
  const indiceFin = indiceInicio + partidosPorPagina;
  const partidosPaginados = partidos.slice(indiceInicio, indiceFin);

  const cambiarPagina = (numeroPagina) => {
    setPaginaActual(numeroPagina);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading && torneos.length === 0) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando torneos históricos...</p>
      </div>
    );
  }

  if (!loading && torneos.length === 0 && !error) {
    return (
      <div className="historico-container">
        <header className="historico-header">
          <h2 className="historico-title">📋 Partidos Históricos</h2>
          <p className="historico-subtitle">Consulta resultados de partidos finalizados</p>
        </header>
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <p>No hay torneos con partidos finalizados</p>
          <p className="empty-hint">
            Los partidos aparecerán aquí una vez que se marquen como finalizados
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="historico-container">
      {/* Header */}
      <header className="historico-header">
        <h2 className="historico-title">📋 Partidos Históricos</h2>
        <p className="historico-subtitle">Consulta resultados de partidos finalizados con filtros avanzados</p>
      </header>

      {/* Filtros */}
      <div className="filtros-section">
        {/* Torneo (Obligatorio) */}
        <div className="filtro-group">
          <label htmlFor="torneo-select" className="filtro-label">
            🏆 Torneo: <span className="required">*</span>
          </label>
          <select
            id="torneo-select"
            className="filtro-select"
            value={selectedTorneo}
            onChange={handleTorneoChange}
            required
          >
            <option value="">Seleccionar torneo...</option>
            {torneos.map((torneo) => (
              <option key={torneo.ID_TORNEO} value={torneo.ID_TORNEO}>
                {torneo.NOMBRE} - {torneo.TEMPORADA} {torneo.RUEDA && `(${torneo.RUEDA})`}
                ({torneo.total_partidos} partidos)
              </option>
            ))}
          </select>
        </div>

        {/* Opciones de filtrado */}
        {selectedTorneo && (
          <>
            <div className="filtro-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={usarRangoFechas}
                  onChange={handleToggleRangoFechas}
                />
                📅 Usar rango de fechas personalizado (esto deshabilitará los filtros de equipo y fecha)
              </label>
            </div>

            {usarRangoFechas ? (
              // Filtros de rango de fechas
              <div className="filtro-rango-fechas">
                <div className="filtro-group">
                  <label htmlFor="fecha-desde" className="filtro-label">
                    Desde:
                  </label>
                  <input
                    type="date"
                    id="fecha-desde"
                    className="filtro-input"
                    value={fechaDesde}
                    onChange={(e) => setFechaDesde(e.target.value)}
                  />
                </div>
                <div className="filtro-group">
                  <label htmlFor="fecha-hasta" className="filtro-label">
                    Hasta:
                  </label>
                  <input
                    type="date"
                    id="fecha-hasta"
                    className="filtro-input"
                    value={fechaHasta}
                    onChange={(e) => setFechaHasta(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              // Filtros normales de equipo y fecha
              <>
                {equipos.length > 0 && (
                  <div className="filtro-group">
                    <label htmlFor="equipo-select" className="filtro-label">
                      ⚽ Equipo:
                    </label>
                    <select
                      id="equipo-select"
                      className="filtro-select"
                      value={selectedEquipo}
                      onChange={handleEquipoChange}
                    >
                      <option value="">Todos los equipos</option>
                      {equipos.map((equipo) => (
                        <option key={equipo.ID_EQUIPO} value={equipo.ID_EQUIPO}>
                          {equipo.NOMBRE} ({equipo.total_partidos} partidos)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {fechas.length > 0 && (
                  <div className="filtro-group">
                    <label htmlFor="fecha-select" className="filtro-label">
                      📅 Fecha/Jornada:
                    </label>
                    <select
                      id="fecha-select"
                      className="filtro-select"
                      value={selectedFecha}
                      onChange={handleFechaChange}
                    >
                      <option value="">Todas las fechas</option>
                      {fechas.map((fecha) => (
                        <option key={fecha.NUMERO_JORNADA} value={fecha.NUMERO_JORNADA}>
                          Fecha {fecha.NUMERO_JORNADA} ({fecha.total_partidos} partidos)
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Partidos */}
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando partidos...</p>
        </div>
      ) : partidos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">⚽</div>
          <p>No hay partidos históricos</p>
          <p className="empty-hint">
            {!selectedTorneo
              ? 'Selecciona un torneo para ver los partidos finalizados'
              : 'No se encontraron partidos con los filtros seleccionados'}
          </p>
        </div>
      ) : (
        <>
          <div className="partidos-list">
            {partidosPaginados.map((partido, index) => {
            const isEven = index % 2 === 0;
            return (
              <div
                key={partido.ID_PARTIDO}
                className={`partido-row ${isEven ? 'row-dark' : 'row-light'}`}
              >
                {/* Info del partido (torneo, fecha y estado) */}
                <div className="partido-info-header">
                  <span className="torneo-nombre">{partido.nombre_torneo}</span>
                  {partido.NUMERO_JORNADA && (
                    <span className="jornada-badge">Fecha {partido.NUMERO_JORNADA}</span>
                  )}
                  <span className="partido-fecha">{formatFecha(partido.FECHA_PARTIDO)}</span>
                  <span className={`estado-badge ${getEstadoBadgeClass(partido.ESTADO_PARTIDO)}`}>
                    {partido.ESTADO_PARTIDO}
                  </span>
                </div>

                {/* Fila principal con resultado */}
                <div className="partido-row-content">
                  {/* Equipo Local - CON LOGO */}
                  <div className="equipo-cell equipo-local-cell">
                    <TeamLogo
                      imagen={partido.imagen_local}
                      nombreEquipo={partido.equipo_local}
                      size="small"
                    />
                    <span className="equipo-nombre">{partido.equipo_local}</span>
                  </div>

                  {/* Goles Local */}
                  <div className="goles-cell">
                    <div className="goles-value">{partido.GOLES_LOCAL ?? 0}</div>
                  </div>

                  {/* Separador */}
                  <div className="separador-cell">
                    <span className="separador">VS</span>
                  </div>

                  {/* Goles Visita */}
                  <div className="goles-cell">
                    <div className="goles-value">{partido.GOLES_VISITA ?? 0}</div>
                  </div>

                  {/* Equipo Visita - CON LOGO */}
                  <div className="equipo-cell equipo-visita-cell">
                    <span className="equipo-nombre">{partido.equipo_visita}</span>
                    <TeamLogo
                      imagen={partido.imagen_visita}
                      nombreEquipo={partido.equipo_visita}
                      size="small"
                    />
                  </div>
                </div>

                {/* Estadio (opcional) */}
                {partido.nombre_estadio && (
                  <div className="estadio-info">
                    🏟️ {partido.nombre_estadio}
                  </div>
                )}

                {/* Estadísticas de apuestas (si hay) */}
                {partido.total_apuestas > 0 && (
                  <div className="apuestas-stats">
                    📊 {partido.total_apuestas} apuestas
                    ({partido.apuestas_ganadoras} ✅ / {partido.apuestas_perdedoras} ❌)
                  </div>
                )}
              </div>
            );
            })}
          </div>

          {/* Controles de Paginación */}
          {totalPaginas > 1 && (
            <div className="paginacion-container">
              <button
                className="btn-pagina"
                onClick={() => cambiarPagina(paginaActual - 1)}
                disabled={paginaActual === 1}
              >
                ← Anterior
              </button>

              <div className="paginas-numeros">
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => (
                  <button
                    key={num}
                    className={`btn-numero ${paginaActual === num ? 'activo' : ''}`}
                    onClick={() => cambiarPagina(num)}
                  >
                    {num}
                  </button>
                ))}
              </div>

              <button
                className="btn-pagina"
                onClick={() => cambiarPagina(paginaActual + 1)}
                disabled={paginaActual === totalPaginas}
              >
                Siguiente →
              </button>

              <div className="info-paginacion">
                Mostrando {indiceInicio + 1}-{Math.min(indiceFin, partidos.length)} de {partidos.length} partidos
              </div>
            </div>
          )}
        </>
      )}

      {/* Footer Info */}
      {partidos.length > 0 && (
        <div className="historico-footer">
          <p className="footer-info">
            Mostrando {partidos.length} partido{partidos.length !== 1 ? 's' : ''}
            {usarRangoFechas && fechaDesde && fechaHasta && (
              <> del {fechaDesde} al {fechaHasta}</>
            )}
            {!usarRangoFechas && selectedFecha && (
              <> de la Fecha {selectedFecha}</>
            )}
            {!usarRangoFechas && selectedEquipo && (
              <>
                {' '}- Equipo: {equipos.find(e => e.ID_EQUIPO.toString() === selectedEquipo)?.NOMBRE}
              </>
            )}
          </p>
        </div>
      )}
    </div>
  );
}

export default PartidosHistoricosNew;
