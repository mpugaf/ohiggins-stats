import React, { useState, useEffect } from 'react';
import { partidosHistoricoService, handleResponse } from '../../services/apiService';
import TeamLogo from '../common/TeamLogo';
import './PartidosHistoricosPlus.css';

function PartidosHistoricosPlus() {
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
  const partidosPorPagina = 10;

  // Expandir detalles
  const [partidoExpandido, setPartidoExpandido] = useState(null);

  // Scroll al inicio cuando se monta el componente
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  // Cargar torneos al iniciar
  useEffect(() => {
    fetchTorneos();
  }, []);

  // Cargar equipos y fechas cuando se selecciona un torneo
  useEffect(() => {
    if (selectedTorneo) {
      fetchEquiposPorTorneo(selectedTorneo);
      fetchFechasPorTorneo(selectedTorneo);
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
          setSelectedTorneo(torneosRecibidos[0].ID_TORNEO.toString());
        } else {
          setError('No hay torneos con partidos finalizados disponibles');
        }
      } else {
        setError(data.error || 'Error al obtener torneos');
      }
    } catch (error) {
      console.error('[HISTORICO+] Error al cargar torneos:', error);
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
        setSelectedEquipo('');
      }
    } catch (error) {
      console.error('[HISTORICO+] Error al cargar equipos:', error);
      setError('Error al cargar equipos del torneo');
    }
  };

  const fetchFechasPorTorneo = async (torneoId) => {
    try {
      const response = await partidosHistoricoService.getFechasPorTorneo(torneoId);
      const data = await handleResponse(response);

      if (data.success) {
        setFechas(data.fechas || []);
        setSelectedFecha('');
      }
    } catch (error) {
      console.error('[HISTORICO+] Error al cargar fechas:', error);
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
        if (fechaDesde && fechaHasta) {
          params.fechaDesde = fechaDesde;
          params.fechaHasta = fechaHasta;
        } else {
          setLoading(false);
          return;
        }
      } else {
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
      console.error('[HISTORICO+] Error al cargar partidos históricos:', error);
      setError('Error al cargar partidos históricos');
    } finally {
      setLoading(false);
    }
  };

  const handleTorneoChange = (e) => {
    setSelectedTorneo(e.target.value);
    setUsarRangoFechas(false);
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
      setSelectedFecha('');
      setSelectedEquipo('');
    } else {
      setFechaDesde('');
      setFechaHasta('');
    }
  };

  const formatFecha = (fechaStr) => {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatHora = (fechaStr) => {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEstadoClass = (estado) => {
    switch (estado) {
      case 'FINALIZADO':
        return 'estado-finalizado';
      case 'SUSPENDIDO':
        return 'estado-suspendido';
      case 'CANCELADO':
        return 'estado-cancelado';
      default:
        return '';
    }
  };

  const toggleDetalles = (partidoId) => {
    setPartidoExpandido(partidoExpandido === partidoId ? null : partidoId);
  };

  // Calcular paginación
  const totalPaginas = Math.ceil(partidos.length / partidosPorPagina);
  const indiceInicio = (paginaActual - 1) * partidosPorPagina;
  const indiceFin = indiceInicio + partidosPorPagina;
  const partidosPaginados = partidos.slice(indiceInicio, indiceFin);

  const cambiarPagina = (numeroPagina) => {
    setPaginaActual(numeroPagina);
    setPartidoExpandido(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading && torneos.length === 0) {
    return (
      <div className="historico-plus-container">
        <div className="loading-state">
          <div className="loading-spinner-plus"></div>
          <p>Cargando torneos históricos...</p>
        </div>
      </div>
    );
  }

  if (!loading && torneos.length === 0 && !error) {
    return (
      <div className="historico-plus-container">
        <header className="header-plus">
          <h1 className="title-plus">📊 Partidos Históricos</h1>
          <p className="subtitle-plus">Vista de resultados finalizados</p>
        </header>
        <div className="empty-state-plus">
          <div className="empty-icon-plus">📭</div>
          <p>No hay torneos con partidos finalizados</p>
        </div>
      </div>
    );
  }

  return (
    <div className="historico-plus-container">
      {/* Header */}
      <header className="header-plus">
        <div className="header-content-plus">
          <h1 className="title-plus">📊 Partidos Históricos</h1>
          <p className="subtitle-plus">Vista de resultados finalizados</p>
        </div>
        <div className="stats-badge-plus">
          <span className="badge-number">{partidos.length}</span>
          <span className="badge-label">Partidos</span>
        </div>
      </header>

      {/* Filtros */}
      <div className="filtros-panel-plus">
        <div className="filtros-row">
          {/* Torneo */}
          <div className="filtro-item-plus">
            <label className="filtro-label-plus">
              <span className="label-icon">🏆</span>
              <span className="label-text">Torneo <span className="required-mark">*</span></span>
            </label>
            <select
              className="filtro-select-plus"
              value={selectedTorneo}
              onChange={handleTorneoChange}
              required
            >
              <option value="">Seleccionar...</option>
              {torneos.map((torneo) => (
                <option key={torneo.ID_TORNEO} value={torneo.ID_TORNEO}>
                  {torneo.NOMBRE} - {torneo.TEMPORADA} {torneo.RUEDA && `(${torneo.RUEDA})`}
                </option>
              ))}
            </select>
          </div>

          {/* Checkbox rango de fechas */}
          {selectedTorneo && (
            <div className="filtro-item-plus checkbox-item">
              <label className="checkbox-label-plus">
                <input
                  type="checkbox"
                  checked={usarRangoFechas}
                  onChange={handleToggleRangoFechas}
                />
                <span className="checkbox-text">Usar rango de fechas</span>
              </label>
            </div>
          )}
        </div>

        {selectedTorneo && (
          <div className="filtros-row">
            {usarRangoFechas ? (
              <>
                <div className="filtro-item-plus">
                  <label className="filtro-label-plus">
                    <span className="label-icon">📅</span>
                    <span className="label-text">Fecha Desde</span>
                  </label>
                  <input
                    type="date"
                    className="filtro-input-plus"
                    value={fechaDesde}
                    onChange={(e) => setFechaDesde(e.target.value)}
                  />
                </div>
                <div className="filtro-item-plus">
                  <label className="filtro-label-plus">
                    <span className="label-icon">📅</span>
                    <span className="label-text">Fecha Hasta</span>
                  </label>
                  <input
                    type="date"
                    className="filtro-input-plus"
                    value={fechaHasta}
                    onChange={(e) => setFechaHasta(e.target.value)}
                  />
                </div>
              </>
            ) : (
              <>
                {equipos.length > 0 && (
                  <div className="filtro-item-plus">
                    <label className="filtro-label-plus">
                      <span className="label-icon">⚽</span>
                      <span className="label-text">Equipo</span>
                    </label>
                    <select
                      className="filtro-select-plus"
                      value={selectedEquipo}
                      onChange={handleEquipoChange}
                    >
                      <option value="">Todos los equipos</option>
                      {equipos.map((equipo) => (
                        <option key={equipo.ID_EQUIPO} value={equipo.ID_EQUIPO}>
                          {equipo.NOMBRE}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {fechas.length > 0 && (
                  <div className="filtro-item-plus">
                    <label className="filtro-label-plus">
                      <span className="label-icon">📋</span>
                      <span className="label-text">Fecha/Jornada</span>
                    </label>
                    <select
                      className="filtro-select-plus"
                      value={selectedFecha}
                      onChange={handleFechaChange}
                    >
                      <option value="">Todas las fechas</option>
                      {fechas.map((fecha) => (
                        <option key={fecha.NUMERO_JORNADA} value={fecha.NUMERO_JORNADA}>
                          Fecha {fecha.NUMERO_JORNADA}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-banner-plus">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Tabla de Partidos */}
      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner-plus"></div>
          <p>Cargando partidos...</p>
        </div>
      ) : partidos.length === 0 ? (
        <div className="empty-state-plus">
          <div className="empty-icon-plus">⚽</div>
          <p>No hay partidos históricos</p>
          <p className="empty-hint-plus">
            {!selectedTorneo
              ? 'Selecciona un torneo para ver los partidos finalizados'
              : 'No se encontraron partidos con los filtros seleccionados'}
          </p>
        </div>
      ) : (
        <>
          <div className="tabla-wrapper-plus">
            <table className="tabla-partidos-plus">
              <thead>
                <tr>
                  <th className="th-fecha">Fecha</th>
                  <th className="th-jornada">Jornada</th>
                  <th className="th-local">Equipo Local</th>
                  <th className="th-resultado">Resultado</th>
                  <th className="th-visita">Equipo Visita</th>
                  <th className="th-estado">Estado</th>
                  <th className="th-acciones">Detalles</th>
                </tr>
              </thead>
              <tbody>
                {partidosPaginados.map((partido) => (
                  <React.Fragment key={partido.ID_PARTIDO}>
                    <tr className="fila-partido-plus">
                      <td className="td-fecha">
                        <div className="fecha-info">
                          <span className="fecha-dia">{formatFecha(partido.FECHA_PARTIDO)}</span>
                          <span className="fecha-hora">{formatHora(partido.FECHA_PARTIDO)}</span>
                        </div>
                      </td>
                      <td className="td-jornada">
                        {partido.NUMERO_JORNADA ? (
                          <span className="jornada-badge-plus">J{partido.NUMERO_JORNADA}</span>
                        ) : (
                          <span className="jornada-vacio">-</span>
                        )}
                      </td>
                      <td className="td-equipo td-local">
                        <div className="equipo-info-plus">
                          <TeamLogo
                            imagen={partido.imagen_local}
                            nombreEquipo={partido.equipo_local}
                            size="small"
                          />
                          <span className="equipo-nombre-plus">{partido.equipo_local}</span>
                        </div>
                      </td>
                      <td className="td-resultado">
                        <div className="resultado-box-plus">
                          <span className="gol-local">{partido.GOLES_LOCAL ?? 0}</span>
                          <span className="separador-gol">-</span>
                          <span className="gol-visita">{partido.GOLES_VISITA ?? 0}</span>
                        </div>
                      </td>
                      <td className="td-equipo td-visita">
                        <div className="equipo-info-plus">
                          <span className="equipo-nombre-plus">{partido.equipo_visita}</span>
                          <TeamLogo
                            imagen={partido.imagen_visita}
                            nombreEquipo={partido.equipo_visita}
                            size="small"
                          />
                        </div>
                      </td>
                      <td className="td-estado">
                        <span className={`estado-badge-plus ${getEstadoClass(partido.ESTADO_PARTIDO)}`}>
                          {partido.ESTADO_PARTIDO}
                        </span>
                      </td>
                      <td className="td-acciones">
                        <button
                          className="btn-detalles-plus"
                          onClick={() => toggleDetalles(partido.ID_PARTIDO)}
                          title="Ver detalles"
                        >
                          {partidoExpandido === partido.ID_PARTIDO ? '▲' : '▼'}
                        </button>
                      </td>
                    </tr>
                    {partidoExpandido === partido.ID_PARTIDO && (
                      <tr className="fila-detalles-plus">
                        <td colSpan="7">
                          <div className="detalles-content-plus">
                            <div className="detalle-item">
                              <span className="detalle-label">🏟️ Estadio:</span>
                              <span className="detalle-value">{partido.nombre_estadio || 'No especificado'}</span>
                            </div>
                            <div className="detalle-item">
                              <span className="detalle-label">🏆 Torneo:</span>
                              <span className="detalle-value">
                                {partido.nombre_torneo} - {partido.TEMPORADA}
                                {partido.RUEDA && ` (${partido.RUEDA})`}
                              </span>
                            </div>
                            {partido.total_apuestas > 0 && (
                              <div className="detalle-item">
                                <span className="detalle-label">📊 Apuestas:</span>
                                <span className="detalle-value">
                                  {partido.total_apuestas} total
                                  ({partido.apuestas_ganadoras} ✅ / {partido.apuestas_perdedoras} ❌)
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="paginacion-plus">
              <button
                className="btn-pag-plus"
                onClick={() => cambiarPagina(paginaActual - 1)}
                disabled={paginaActual === 1}
              >
                ← Anterior
              </button>

              <div className="paginas-lista">
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => (
                  <button
                    key={num}
                    className={`btn-pag-num ${paginaActual === num ? 'activo' : ''}`}
                    onClick={() => cambiarPagina(num)}
                  >
                    {num}
                  </button>
                ))}
              </div>

              <button
                className="btn-pag-plus"
                onClick={() => cambiarPagina(paginaActual + 1)}
                disabled={paginaActual === totalPaginas}
              >
                Siguiente →
              </button>

              <div className="paginacion-info">
                Página {paginaActual} de {totalPaginas} • {partidos.length} partidos totales
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default PartidosHistoricosPlus;
