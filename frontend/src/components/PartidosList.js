// frontend/src/components/PartidosList.js
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
  const [ordenPor, setOrdenPor] = useState('fecha');
  const [ordenDir, setOrdenDir] = useState('asc');

  const handleFiltroChange = (campo, valor) => {
    onFiltrosChange({
      ...filtros,
      [campo]: valor
    });
  };

  const handleSort = (campo) => {
    if (ordenPor === campo) {
      setOrdenDir(ordenDir === 'asc' ? 'desc' : 'asc');
    } else {
      setOrdenPor(campo);
      setOrdenDir('asc');
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    const fechaObj = new Date(fecha);
    return fechaObj.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatearResultado = (golesLocal, golesVisita, estado) => {
    // Si no hay resultados registrados (ambos son null), mostrar "vs"
    if (golesLocal === null && golesVisita === null) {
      return <span className="resultado programado">vs</span>;
    }

    // Si hay resultados (incluyendo 0-0), mostrarlos
    const gLocal = golesLocal !== null && golesLocal !== undefined ? golesLocal : 0;
    const gVisita = golesVisita !== null && golesVisita !== undefined ? golesVisita : 0;

    const colorClase = gLocal > gVisita ? 'victoria-local' :
                     gLocal < gVisita ? 'victoria-visita' : 'empate';

    return (
      <span className={`resultado ${colorClase}`}>
        {gLocal} - {gVisita}
      </span>
    );
  };

  const getEstadoBadge = (estado) => {
    const clases = {
      'PROGRAMADO': 'estado-programado',
      'EN_CURSO': 'estado-en-curso',
      'FINALIZADO': 'estado-finalizado',
      'SUSPENDIDO': 'estado-suspendido',
      'CANCELADO': 'estado-cancelado'
    };

    return (
      <span className={`estado-badge ${clases[estado] || 'estado-programado'}`}>
        {estado}
      </span>
    );
  };

  const limpiarFiltros = () => {
    onFiltrosChange({
      torneo: '',
      equipo: '',
      estado: '',
      numeroJornada: '',
      fechaDesde: '',
      fechaHasta: ''
    });
  };

  // Obtener fechas únicas disponibles en los partidos del torneo seleccionado
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

  const partidosFiltrados = partidos
    .filter(partido => {
      // Filtrar por fecha local (adicional al filtro del servidor)
      let cumpleFecha = true;
      if (filtros.fechaDesde || filtros.fechaHasta) {
        const fechaPartido = new Date(partido.FECHA_PARTIDO);
        if (filtros.fechaDesde) {
          const fechaDesde = new Date(filtros.fechaDesde);
          cumpleFecha = cumpleFecha && fechaPartido >= fechaDesde;
        }
        if (filtros.fechaHasta) {
          const fechaHasta = new Date(filtros.fechaHasta);
          fechaHasta.setHours(23, 59, 59, 999); // Incluir todo el día
          cumpleFecha = cumpleFecha && fechaPartido <= fechaHasta;
        }
      }

      return cumpleFecha;
    })
    .sort((a, b) => {
      let valorA, valorB;

      switch (ordenPor) {
        case 'fecha':
          valorA = new Date(a.FECHA_PARTIDO);
          valorB = new Date(b.FECHA_PARTIDO);
          break;
        case 'equipos':
          valorA = `${a.NOMBRE_EQUIPO_LOCAL} vs ${a.NOMBRE_EQUIPO_VISITA}`;
          valorB = `${b.NOMBRE_EQUIPO_LOCAL} vs ${b.NOMBRE_EQUIPO_VISITA}`;
          break;
        case 'torneo':
          valorA = a.NOMBRE_TORNEO;
          valorB = b.NOMBRE_TORNEO;
          break;
        default:
          valorA = a[ordenPor];
          valorB = b[ordenPor];
      }

      if (valorA < valorB) return ordenDir === 'asc' ? -1 : 1;
      if (valorA > valorB) return ordenDir === 'asc' ? 1 : -1;
      return 0;
    });

  const hayFiltrosActivos = filtros.torneo || filtros.equipo || filtros.estado || filtros.numeroJornada || filtros.fechaDesde || filtros.fechaHasta;

  return (
    <div className="partidos-list">
      {/* Controles de filtros */}
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
            <label htmlFor="numero-jornada">
              📆 Fecha (Jornada)
              {filtros.numeroJornada && <span className="filter-active-indicator">✓</span>}
            </label>
            <select
              id="numero-jornada"
              value={filtros.numeroJornada}
              onChange={(e) => handleFiltroChange('numeroJornada', e.target.value)}
              className="filter-select"
              disabled={!filtros.torneo || (filtros.fechaDesde || filtros.fechaHasta)}
              title={
                !filtros.torneo
                  ? 'Primero selecciona un torneo'
                  : (filtros.fechaDesde || filtros.fechaHasta)
                  ? 'Deshabilitado cuando se usa rango de fechas'
                  : 'Selecciona una fecha del torneo'
              }
            >
              <option value="">Todas las fechas</option>
              {fechasDisponibles.map(fecha => (
                <option key={fecha} value={fecha}>
                  Fecha {fecha}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label htmlFor="fecha-desde">
              📅 Fecha desde
              {filtros.fechaDesde && <span className="filter-active-indicator">✓</span>}
            </label>
            <input
              id="fecha-desde"
              type="date"
              value={filtros.fechaDesde || ''}
              onChange={(e) => handleFiltroChange('fechaDesde', e.target.value)}
              className="filter-date"
              disabled={!!filtros.numeroJornada}
              title={filtros.numeroJornada ? 'Deshabilitado cuando se selecciona una fecha específica' : ''}
            />
          </div>

          <div className="filter-item">
            <label htmlFor="fecha-hasta">
              📅 Fecha hasta
              {filtros.fechaHasta && <span className="filter-active-indicator">✓</span>}
            </label>
            <input
              id="fecha-hasta"
              type="date"
              value={filtros.fechaHasta || ''}
              onChange={(e) => handleFiltroChange('fechaHasta', e.target.value)}
              className="filter-date"
              disabled={!!filtros.numeroJornada}
              title={filtros.numeroJornada ? 'Deshabilitado cuando se selecciona una fecha específica' : ''}
            />
          </div>

          <div className="filter-actions">
            {hayFiltrosActivos && (
              <button onClick={limpiarFiltros} className="btn btn-clear" title="Limpiar filtros">
                ✕ Limpiar
              </button>
            )}
            <button onClick={onRefresh} className="btn btn-refresh" title="Actualizar lista">
              🔄 Actualizar
            </button>
          </div>
        </div>

        <div className="results-summary">
          <span className="results-count">{partidosFiltrados.length} de {partidos.length} partidos</span>
          {hayFiltrosActivos && <span className="filter-indicator">Filtros activos</span>}
        </div>
      </div>

      {/* Contenido principal */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando partidos...</p>
        </div>
      ) : partidosFiltrados.length === 0 ? (
        <div className="no-data">
          {partidos.length === 0 ? (
            <>
              <h3>No hay partidos registrados</h3>
              <p>Comienza creando tu primer partido</p>
            </>
          ) : (
            <>
              <h3>No se encontraron partidos</h3>
              <p>Intenta ajustar los filtros de búsqueda</p>
            </>
          )}
        </div>
      ) : (
        <div className="table-container">
          <table className="partidos-table">
            <thead>
              <tr>
                <th
                  className="sortable"
                  onClick={() => handleSort('fecha')}
                >
                  📅 Fecha y Hora
                  {ordenPor === 'fecha' && (
                    <span className="sort-indicator">
                      {ordenDir === 'asc' ? ' ↑' : ' ↓'}
                    </span>
                  )}
                </th>
                <th
                  className="sortable"
                  onClick={() => handleSort('torneo')}
                >
                  🏆 Torneo
                  {ordenPor === 'torneo' && (
                    <span className="sort-indicator">
                      {ordenDir === 'asc' ? ' ↑' : ' ↓'}
                    </span>
                  )}
                </th>
                <th className="text-center">📅 Jornada</th>
                <th
                  className="sortable"
                  onClick={() => handleSort('equipos')}
                >
                  ⚽ Enfrentamiento
                  {ordenPor === 'equipos' && (
                    <span className="sort-indicator">
                      {ordenDir === 'asc' ? ' ↑' : ' ↓'}
                    </span>
                  )}
                </th>
                <th className="text-center">Resultado</th>
                <th>🏟️ Estadio</th>
                <th className="text-center">Estado</th>
                <th className="text-center">⚙️</th>
              </tr>
            </thead>
            <tbody>
              {partidosFiltrados.map((partido) => (
                <tr
                  key={partido.ID_PARTIDO}
                  className="partido-row clickable"
                  onClick={(e) => {
                    // No editar si se hizo click en los botones de acción
                    if (!e.target.closest('.action-buttons')) {
                      onEdit(partido);
                    }
                  }}
                  title="Clic para editar"
                >
                  <td className="fecha-col">
                    <div className="fecha-info">
                      <div className="fecha-dia">{formatearFecha(partido.FECHA_PARTIDO)}</div>
                    </div>
                  </td>

                  <td className="torneo-col">
                    <div className="torneo-info">
                      <div className="nombre-torneo">{partido.NOMBRE_TORNEO}</div>
                      <div className="temporada-rueda">
                        {partido.TEMPORADA} - {partido.RUEDA}
                      </div>
                    </div>
                  </td>

                  <td className="jornada-col text-center">
                    {partido.NUMERO_JORNADA ? (
                      <span className="jornada-badge">
                        Fecha {partido.NUMERO_JORNADA}
                      </span>
                    ) : (
                      <span className="jornada-empty">-</span>
                    )}
                  </td>

                  <td className="enfrentamiento-col">
                    <div className="enfrentamiento-horizontal">
                      <span className="equipo-nombre local">{partido.NOMBRE_EQUIPO_LOCAL}</span>
                      <span className="vs-separator">vs</span>
                      <span className="equipo-nombre visita">{partido.NOMBRE_EQUIPO_VISITA}</span>
                    </div>
                  </td>

                  <td className="resultado-col text-center">
                    {formatearResultado(
                      partido.GOLES_LOCAL,
                      partido.GOLES_VISITA,
                      partido.ESTADO_PARTIDO
                    )}
                  </td>

                  <td className="estadio-col">
                    <div className="estadio-info">
                      <div className="nombre-estadio">{partido.NOMBRE_ESTADIO}</div>
                      {partido.CIUDAD_ESTADIO && (
                        <div className="ciudad">{partido.CIUDAD_ESTADIO}</div>
                      )}
                    </div>
                  </td>

                  <td className="estado-col text-center">
                    {getEstadoBadge(partido.ESTADO_PARTIDO)}
                  </td>

                  <td className="acciones-col text-center">
                    <div className="action-buttons">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(partido.ID_PARTIDO);
                        }}
                        className="btn btn-delete"
                        title="Eliminar partido"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PartidosList;