// frontend/src/components/PartidosList.js - VERSIÓN CON CARDS
import React, { useState } from 'react';
import './PartidosList-new.css';

const PartidosList = ({
  partidos,
  torneos,
  equipos,
  loading,
  filtros,
  onFiltrosChange,
  onEdit,
  onDelete,
  onRefresh
}) => {
  const [paginaActual, setPaginaActual] = useState(1);
  const partidosPorPagina = 8;

  const handleFiltroChange = (campo, valor) => {
    setPaginaActual(1);
    onFiltrosChange({
      ...filtros,
      [campo]: valor
    });
  };

  const limpiarFiltros = () => {
    setPaginaActual(1);
    onFiltrosChange({
      torneo: '',
      equipo: '',
      estado: '',
      numeroJornada: '',
      fechaDesde: '',
      fechaHasta: ''
    });
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    const fechaObj = new Date(fecha);
    return fechaObj.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filtrado frontend (solo numeroJornada)
  let partidosFiltrados = [...partidos];
  if (filtros.numeroJornada) {
    partidosFiltrados = partidosFiltrados.filter(
      p => p.NUMERO_JORNADA === parseInt(filtros.numeroJornada)
    );
  }

  // Paginación
  const totalPartidos = partidosFiltrados.length;
  const totalPaginas = Math.ceil(totalPartidos / partidosPorPagina);
  const indiceInicio = (paginaActual - 1) * partidosPorPagina;
  const indiceFin = indiceInicio + partidosPorPagina;
  const partidosPaginados = partidosFiltrados.slice(indiceInicio, indiceFin);

  // Fechas disponibles
  const getFechasDisponibles = () => {
    if (!filtros.torneo) return [];
    const fechasSet = new Set();
    partidos
      .filter(p => p.ID_TORNEO === parseInt(filtros.torneo))
      .forEach(p => {
        if (p.NUMERO_JORNADA) {
          fechasSet.add(p.NUMERO_JORNADA);
        }
      });
    return Array.from(fechasSet).sort((a, b) => a - b);
  };

  const fechasDisponibles = getFechasDisponibles();
  const hayFiltrosActivos = filtros.torneo || filtros.equipo || filtros.estado || filtros.numeroJornada || filtros.fechaDesde || filtros.fechaHasta;

  return (
    <div className="partidos-list">
      {/* FILTROS */}
      <div className="list-controls">
        <div className="filters-container">
          <div className="filter-item">
            <label htmlFor="filtro-torneo">🏆 Torneo</label>
            <select
              id="filtro-torneo"
              value={filtros.torneo}
              onChange={(e) => handleFiltroChange('torneo', e.target.value)}
              className="filter-select"
            >
              <option value="">Todos los torneos</option>
              {torneos.map(torneo => (
                <option key={torneo.ID_TORNEO} value={torneo.ID_TORNEO}>
                  {torneo.NOMBRE} {torneo.TEMPORADA} - {torneo.RUEDA}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label htmlFor="filtro-equipo">⚽ Equipo</label>
            <select
              id="filtro-equipo"
              value={filtros.equipo}
              onChange={(e) => handleFiltroChange('equipo', e.target.value)}
              className="filter-select"
            >
              <option value="">Todos los equipos</option>
              {equipos.map(equipo => (
                <option key={equipo.ID_EQUIPO} value={equipo.ID_EQUIPO}>
                  {equipo.NOMBRE}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label htmlFor="filtro-estado">📊 Estado</label>
            <select
              id="filtro-estado"
              value={filtros.estado}
              onChange={(e) => handleFiltroChange('estado', e.target.value)}
              className="filter-select"
            >
              <option value="">Todos los estados</option>
              <option value="PROGRAMADO">Programado</option>
              <option value="EN_CURSO">En curso</option>
              <option value="FINALIZADO">Finalizado</option>
              <option value="SUSPENDIDO">Suspendido</option>
              <option value="CANCELADO">Cancelado</option>
            </select>
          </div>

          <div className="filter-item">
            <label htmlFor="numero-jornada">📆 Fecha (Jornada)</label>
            <select
              id="numero-jornada"
              value={filtros.numeroJornada}
              onChange={(e) => handleFiltroChange('numeroJornada', e.target.value)}
              className="filter-select"
              disabled={!filtros.torneo}
            >
              <option value="">Todas las fechas</option>
              {fechasDisponibles.map(fecha => (
                <option key={fecha} value={fecha}>
                  Fecha {fecha}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-actions">
            {hayFiltrosActivos && (
              <button onClick={limpiarFiltros} className="btn btn-clear">
                ✕ Limpiar
              </button>
            )}
            <button onClick={onRefresh} className="btn btn-refresh">
              🔄 Actualizar
            </button>
          </div>
        </div>

        <div className="results-summary">
          <span className="results-count">
            {totalPartidos} de {partidos.length} partidos
            {totalPaginas > 1 && ` • Página ${paginaActual} de ${totalPaginas}`}
          </span>
          {hayFiltrosActivos && <span className="filter-indicator">Filtros activos</span>}
        </div>
      </div>

      {/* CONTENIDO */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando partidos...</p>
        </div>
      ) : partidosFiltrados.length === 0 ? (
        <div className="no-data">
          <h3>No se encontraron partidos</h3>
          <p>Intenta ajustar los filtros de búsqueda</p>
        </div>
      ) : (
        <>
          {/* TARJETAS DE PARTIDOS */}
          <div className="partidos-cards-container">
            {partidosPaginados.map((partido) => (
              <div key={partido.ID_PARTIDO} className="partido-card">
                <div className="partido-card-header">
                  <div className="partido-fecha">
                    <span className="fecha-principal">{formatearFecha(partido.FECHA_PARTIDO)}</span>
                    {partido.NUMERO_JORNADA && (
                      <span className="jornada-tag">Fecha {partido.NUMERO_JORNADA}</span>
                    )}
                  </div>
                  <span className={`estado-badge estado-${partido.ESTADO_PARTIDO.toLowerCase()}`}>
                    {partido.ESTADO_PARTIDO}
                  </span>
                </div>

                <div className="partido-card-body">
                  <div className="partido-enfrentamiento">
                    <div className="equipo-info">
                      <span className="equipo-nombre equipo-local">{partido.NOMBRE_EQUIPO_LOCAL}</span>
                      {partido.GOLES_LOCAL !== null && (
                        <span className="equipo-goles">{partido.GOLES_LOCAL}</span>
                      )}
                    </div>
                    <span className="vs-separator">VS</span>
                    <div className="equipo-info">
                      <span className="equipo-nombre equipo-visita">{partido.NOMBRE_EQUIPO_VISITA}</span>
                      {partido.GOLES_VISITA !== null && (
                        <span className="equipo-goles">{partido.GOLES_VISITA}</span>
                      )}
                    </div>
                  </div>

                  <div className="partido-detalles">
                    <div className="detalle-item">
                      <span className="detalle-label">🏆 Torneo:</span>
                      <span className="detalle-valor">{partido.NOMBRE_TORNEO} - {partido.TEMPORADA}</span>
                    </div>
                    <div className="detalle-item">
                      <span className="detalle-label">🏟️ Estadio:</span>
                      <span className="detalle-valor">{partido.NOMBRE_ESTADIO || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="partido-card-footer">
                  <button
                    onClick={() => onEdit(partido)}
                    className="btn-card btn-editar"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('¿Estás seguro de eliminar este partido?')) {
                        onDelete(partido.ID_PARTIDO);
                      }
                    }}
                    className="btn-card btn-eliminar"
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* PAGINACIÓN */}
          {totalPaginas > 1 && (
            <div className="pagination">
              <button
                onClick={() => setPaginaActual(paginaActual - 1)}
                disabled={paginaActual === 1}
                className="btn-pagination"
              >
                ← Anterior
              </button>

              <span className="pagination-info">
                Página {paginaActual} de {totalPaginas}
              </span>

              <button
                onClick={() => setPaginaActual(paginaActual + 1)}
                disabled={paginaActual === totalPaginas}
                className="btn-pagination"
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PartidosList;
