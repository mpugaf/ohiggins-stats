// frontend/src/components/PlayersList.js
import React, { useState, useEffect, useMemo } from 'react';

// Hook personalizado para debounce
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

const PlayersList = ({ jugadores, onEditar, onEliminar, loading }) => {
  const [searchTerm, setSearchTerm] = useState(''); // Término inmediato
  const [filtro, setFiltro] = useState(''); // Filtro con debounce
  const [ordenPor, setOrdenPor] = useState('nombre_completo');
  const [direccionOrden, setDireccionOrden] = useState('asc');

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Debounce del searchTerm (espera 300ms)
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Actualizar filtro cuando cambia el debounced search
  useEffect(() => {
    setFiltro(debouncedSearch);
    setCurrentPage(1); // Reset a página 1
  }, [debouncedSearch]);

  const formatearFecha = (fecha) => {
    if (!fecha) return 'No especificada';
    return new Date(fecha).toLocaleDateString('es-CL');
  };

  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return 'N/A';
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const diferenciaMeses = hoy.getMonth() - nacimiento.getMonth();
    
    if (diferenciaMeses < 0 || (diferenciaMeses === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    
    return edad;
  };

  // ✅ OPTIMIZACIÓN: Filtrar jugadores con useMemo
  const jugadoresFiltrados = useMemo(() => {
    console.log('🔍 Filtrando jugadores...');
    return jugadores.filter(jugador =>
      (jugador.NOMBRE_COMPLETO || '').toLowerCase().includes(filtro.toLowerCase()) ||
      (jugador.PLAYER_ID_FBR || '').toLowerCase().includes(filtro.toLowerCase()) ||
      (jugador.APODO || '').toLowerCase().includes(filtro.toLowerCase()) ||
      (jugador.nacionalidades || []).some(n => n.nombre.toLowerCase().includes(filtro.toLowerCase())) ||
      (jugador.posiciones || []).some(p => p.nombre.toLowerCase().includes(filtro.toLowerCase()))
    );
  }, [jugadores, filtro]);

  // ✅ OPTIMIZACIÓN: Ordenar jugadores con useMemo
  const jugadoresOrdenados = useMemo(() => {
    console.log('📊 Ordenando jugadores...');
    return [...jugadoresFiltrados].sort((a, b) => {
      let valorA, valorB;

      switch (ordenPor) {
        case 'nombre_completo':
          valorA = (a.NOMBRE_COMPLETO || '').toLowerCase();
          valorB = (b.NOMBRE_COMPLETO || '').toLowerCase();
          break;
        case 'player_id_fbr':
          valorA = a.PLAYER_ID_FBR || '';
          valorB = b.PLAYER_ID_FBR || '';
          break;
        case 'fecha_nacimiento':
          valorA = new Date(a.FECHA_NACIMIENTO || '1900-01-01');
          valorB = new Date(b.FECHA_NACIMIENTO || '1900-01-01');
          break;
        case 'apodo':
          valorA = (a.APODO || '').toLowerCase();
          valorB = (b.APODO || '').toLowerCase();
          break;
        default:
          valorA = a.ID_JUGADOR;
          valorB = b.ID_JUGADOR;
      }

      if (valorA < valorB) return direccionOrden === 'asc' ? -1 : 1;
      if (valorA > valorB) return direccionOrden === 'asc' ? 1 : -1;
      return 0;
    });
  }, [jugadoresFiltrados, ordenPor, direccionOrden]);

  // ✅ OPTIMIZACIÓN: Paginación
  const jugadoresPaginados = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return jugadoresOrdenados.slice(startIndex, endIndex);
  }, [jugadoresOrdenados, currentPage]);

  const totalPages = Math.ceil(jugadoresOrdenados.length / itemsPerPage);

  const handleOrdenar = (campo) => {
    if (ordenPor === campo) {
      setDireccionOrden(direccionOrden === 'asc' ? 'desc' : 'asc');
    } else {
      setOrdenPor(campo);
      setDireccionOrden('asc');
    }
  };

  const getIconoOrden = (campo) => {
    if (ordenPor !== campo) return '↕️';
    return direccionOrden === 'asc' ? '↑' : '↓';
  };

  if (loading && jugadores.length === 0) {
    return (
      <div className="players-list loading">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando jugadores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="players-list">
      {/* Controles de búsqueda y filtros */}
      <div className="list-controls">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Buscar por nombre, ID, apodo, nacionalidad o posición..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>
        
        <div className="list-stats">
          <span className="stats-text">
            {jugadoresFiltrados.length} de {jugadores.length} jugadores
          </span>
        </div>
      </div>

      {jugadoresFiltrados.length === 0 ? (
        <div className="no-data">
          {filtro ? (
            <>
              <h3>🔍 No se encontraron jugadores</h3>
              <p>No hay jugadores que coincidan con "{filtro}"</p>
              <button 
                onClick={() => setFiltro('')} 
                className="btn btn-secondary"
              >
                Limpiar búsqueda
              </button>
            </>
          ) : (
            <>
              <h3>👥 No hay jugadores registrados</h3>
              <p>Comienza agregando tu primer jugador al sistema</p>
            </>
          )}
        </div>
      ) : (
        <div className="table-container">
          <table className="players-table">
            <thead>
              <tr>
                <th 
                  onClick={() => handleOrdenar('player_id_fbr')}
                  className="sortable"
                >
                  Player ID FBR {getIconoOrden('player_id_fbr')}
                </th>
                <th 
                  onClick={() => handleOrdenar('nombre_completo')}
                  className="sortable"
                >
                  Nombre {getIconoOrden('nombre_completo')}
                </th>
                <th 
                  onClick={() => handleOrdenar('apodo')}
                  className="sortable"
                >
                  Apodo {getIconoOrden('apodo')}
                </th>
                <th 
                  onClick={() => handleOrdenar('fecha_nacimiento')}
                  className="sortable"
                >
                  Edad {getIconoOrden('fecha_nacimiento')}
                </th>
                <th>Pie Dominante</th>
                <th>Nacionalidades</th>
                <th>Posiciones</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {jugadoresPaginados.map((jugador) => (
                <tr key={jugador.ID_JUGADOR} className="player-row">
                  <td className="player-id">
                    <code>{jugador.PLAYER_ID_FBR}</code>
                  </td>
                  <td className="player-name">
                    <strong>{jugador.NOMBRE_COMPLETO}</strong>
                  </td>
                  <td className="player-nickname">
                    {jugador.APODO ? (
                      <span className="apodo-badge">"{jugador.APODO}"</span>
                    ) : (
                      <span className="sin-apodo">-</span>
                    )}
                  </td>
                  <td className="player-age">
                    <div className="age-info">
                      <span className="age-number">{calcularEdad(jugador.FECHA_NACIMIENTO)}</span>
                      {jugador.FECHA_NACIMIENTO && (
                        <span className="birth-date">{formatearFecha(jugador.FECHA_NACIMIENTO)}</span>
                      )}
                    </div>
                  </td>
                  <td className="player-foot">
                    {jugador.PIE_DOMINANTE ? (
                      <span className={`foot-badge ${jugador.PIE_DOMINANTE.toLowerCase()}`}>
                        {jugador.PIE_DOMINANTE === 'RIGHT' && '🦶➡️ Derecho'}
                        {jugador.PIE_DOMINANTE === 'LEFT' && '⬅️🦶 Izquierdo'}
                        {jugador.PIE_DOMINANTE === 'BOTH' && '🦶↔️ Ambidiestro'}
                      </span>
                    ) : (
                      <span className="sin-dato">No especificado</span>
                    )}
                  </td>
                  <td className="player-countries">
                    {jugador.nacionalidades && jugador.nacionalidades.length > 0 ? (
                      <div className="tags">
                        {jugador.nacionalidades.map((nac, index) => (
                          <span key={index} className="tag country-tag" title={nac.nombre}>
                            {nac.codigo}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="sin-dato">Sin nacionalidad</span>
                    )}
                  </td>
                  <td className="player-positions">
                    {jugador.posiciones && jugador.posiciones.length > 0 ? (
                      <div className="tags">
                        {jugador.posiciones.map((pos, index) => (
                          <span key={index} className="tag position-tag" title={pos.nombre}>
                            {pos.codigo}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="sin-dato">Sin posición</span>
                    )}
                  </td>
                  <td className="acciones">
                    <button
                      onClick={() => onEditar(jugador)}
                      className="btn btn-edit"
                      title="Editar jugador"
                      disabled={loading}
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => onEliminar(jugador)}
                      className="btn btn-delete"
                      title="Eliminar jugador"
                      disabled={loading}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Controles de paginación */}
          {totalPages > 1 && (
            <div className="pagination-controls">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="btn btn-pagination"
              >
                ← Anterior
              </button>

              <div className="pagination-info">
                <span>
                  Página {currentPage} de {totalPages}
                </span>
                <span className="pagination-details">
                  ({((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, jugadoresOrdenados.length)} de {jugadoresOrdenados.length})
                </span>
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="btn btn-pagination"
              >
                Siguiente →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PlayersList;