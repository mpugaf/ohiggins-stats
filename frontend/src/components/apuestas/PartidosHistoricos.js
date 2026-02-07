import React, { useState, useEffect } from 'react';
import { partidosHistoricoService, handleResponse } from '../../services/apiService';
import './PartidosHistoricos.css';

function PartidosHistoricos() {
  const [loading, setLoading] = useState(true);
  const [torneos, setTorneos] = useState([]);
  const [fechas, setFechas] = useState([]);
  const [partidos, setPartidos] = useState([]);
  const [selectedTorneo, setSelectedTorneo] = useState('');
  const [selectedFecha, setSelectedFecha] = useState('');
  const [error, setError] = useState(null);

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
    if (selectedFecha) {
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
        setFechas(data.fechas || []);
        setSelectedFecha(''); // Reset fecha selection
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
        <div className="partidos-grid">
          {partidos.map((partido) => (
            <div key={partido.ID_PARTIDO} className="partido-card">
              {/* Header del partido */}
              <div className="partido-card-header">
                <div className="partido-fecha">{formatFecha(partido.FECHA_PARTIDO)}</div>
                <span className={`estado-badge ${getEstadoBadgeClass(partido.ESTADO_PARTIDO)}`}>
                  {partido.ESTADO_PARTIDO}
                </span>
              </div>

              {/* Información del torneo */}
              <div className="partido-torneo-info">
                <span className="torneo-nombre">{partido.nombre_torneo}</span>
                {partido.NUMERO_JORNADA && (
                  <span className="jornada-badge">Fecha {partido.NUMERO_JORNADA}</span>
                )}
              </div>

              {/* Resultado del partido */}
              <div className="resultado-section">
                <div className="equipo equipo-local">
                  <span className="equipo-nombre">{partido.equipo_local}</span>
                  <span className="goles">{partido.GOLES_LOCAL ?? 0}</span>
                </div>

                <div className="separador">-</div>

                <div className="equipo equipo-visita">
                  <span className="goles">{partido.GOLES_VISITA ?? 0}</span>
                  <span className="equipo-nombre">{partido.equipo_visita}</span>
                </div>
              </div>

              {/* Estadio */}
              {partido.nombre_estadio && (
                <div className="estadio-info">
                  🏟️ {partido.nombre_estadio}
                </div>
              )}

              {/* Estadísticas de apuestas */}
              {partido.total_apuestas > 0 && (
                <div className="apuestas-stats">
                  <div className="stat-item">
                    <span className="stat-label">Total Apuestas:</span>
                    <span className="stat-value">{partido.total_apuestas}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label stat-ganadas">Ganadas:</span>
                    <span className="stat-value stat-ganadas">{partido.apuestas_ganadoras}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label stat-perdidas">Perdidas:</span>
                    <span className="stat-value stat-perdidas">{partido.apuestas_perdedoras}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
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
