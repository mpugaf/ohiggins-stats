import React, { useState, useEffect } from 'react';
import { partidosHistoricoService, handleResponse } from '../../services/apiService';
import TeamLogo from '../common/TeamLogo';
import './PartidosHistoricos.css';

function PartidosHistoricos() {
  const [loading, setLoading] = useState(true);
  const [torneos, setTorneos] = useState([]);
  const [fechas, setFechas] = useState([]);
  const [partidos, setPartidos] = useState([]);
  const [selectedTorneo, setSelectedTorneo] = useState('');
  const [selectedFecha, setSelectedFecha] = useState('');
  const [error, setError] = useState(null);

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const partidosPorPagina = 8;

  // Cargar torneos con partidos finalizados
  useEffect(() => {
    fetchTorneos();
  }, []);

  // Cargar fechas cuando se selecciona un torneo
  useEffect(() => {
    if (selectedTorneo) {
      fetchFechasPorTorneo(selectedTorneo);
      fetchPartidos();
    }
  }, [selectedTorneo]);

  // Cargar partidos cuando se selecciona una fecha
  useEffect(() => {
    if (selectedTorneo) {
      setPaginaActual(1); // Reset página al cambiar fecha
      fetchPartidos();
    }
  }, [selectedFecha]);

  const fetchTorneos = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await partidosHistoricoService.getTorneos();
      const data = await handleResponse(response);

      console.log('[HISTORICO] Torneos recibidos:', data);

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

  const fetchFechasPorTorneo = async (torneoId) => {
    try {
      const response = await partidosHistoricoService.getFechasPorTorneo(torneoId);
      const data = await handleResponse(response);

      if (data.success) {
        const fechasRecibidas = data.fechas || [];
        setFechas(fechasRecibidas);

        // Establecer la última fecha como default (la fecha más alta)
        if (fechasRecibidas.length > 0) {
          const ultimaFecha = Math.max(...fechasRecibidas.map(f => f.NUMERO_JORNADA));
          setSelectedFecha(ultimaFecha.toString());
        } else {
          setSelectedFecha('');
        }

        // Reset paginación
        setPaginaActual(1);
      }
    } catch (error) {
      console.error('Error al cargar fechas:', error);
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

      if (selectedFecha) {
        params.fecha = selectedFecha;
      }

      const response = await partidosHistoricoService.getPartidosHistoricos(params);
      const data = await handleResponse(response);

      if (data.success) {
        setPartidos(data.partidos || []);
      }
    } catch (error) {
      console.error('Error al cargar partidos históricos:', error);
      setError('Error al cargar partidos históricos');
    } finally {
      setLoading(false);
    }
  };

  const handleTorneoChange = (e) => {
    setSelectedTorneo(e.target.value);
  };

  const handleFechaChange = (e) => {
    setSelectedFecha(e.target.value);
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
        <p className="historico-subtitle">Consulta resultados de partidos finalizados</p>
      </header>

      {/* Filtros */}
      <div className="filtros-section">
        <div className="filtro-group">
          <label htmlFor="torneo-select" className="filtro-label">
            🏆 Torneo:
          </label>
          <select
            id="torneo-select"
            className="filtro-select"
            value={selectedTorneo}
            onChange={handleTorneoChange}
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

        {selectedTorneo && fechas.length > 0 && (
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
              : 'No se encontraron partidos finalizados para este torneo/fecha'}
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
            {selectedFecha ? ` de la Fecha ${selectedFecha}` : ''}
          </p>
        </div>
      )}
    </div>
  );
}

export default PartidosHistoricos;
