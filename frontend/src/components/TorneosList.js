// frontend/src/components/TorneosList.js
import React, { useState } from 'react';

const TorneosList = ({ torneos, onEditar, onEliminar, loading }) => {
  const [filtro, setFiltro] = useState('');
  const [ordenPor, setOrdenPor] = useState('TEMPORADA');
  const [direccionOrden, setDireccionOrden] = useState('desc');

  const formatearRueda = (rueda) => {
    const mapeoRuedas = {
      'PRIMERA': 'Primera Rueda',
      'SEGUNDA': 'Segunda Rueda',
      'UNICA': 'Rueda Única'
    };
    return mapeoRuedas[rueda] || rueda;
  };

  // Filtrar torneos
  const torneosFiltrados = torneos.filter(torneo =>
    (torneo.NOMBRE || '').toLowerCase().includes(filtro.toLowerCase()) ||
    (torneo.TEMPORADA || '').toLowerCase().includes(filtro.toLowerCase()) ||
    (torneo.NOMBRE_PAIS || '').toLowerCase().includes(filtro.toLowerCase()) ||
    (torneo.CODIGO_PAIS || '').toLowerCase().includes(filtro.toLowerCase()) ||
    (torneo.RUEDA || '').toLowerCase().includes(filtro.toLowerCase())
  );

  // Ordenar torneos
  const torneosOrdenados = [...torneosFiltrados].sort((a, b) => {
    let valorA, valorB;

    switch (ordenPor) {
      case 'NOMBRE':
        valorA = (a.NOMBRE || '').toLowerCase();
        valorB = (b.NOMBRE || '').toLowerCase();
        break;
      case 'TEMPORADA':
        valorA = a.TEMPORADA || '';
        valorB = b.TEMPORADA || '';
        break;
      case 'NOMBRE_PAIS':
        valorA = (a.NOMBRE_PAIS || '').toLowerCase();
        valorB = (b.NOMBRE_PAIS || '').toLowerCase();
        break;
      case 'RUEDA':
        valorA = a.RUEDA || '';
        valorB = b.RUEDA || '';
        break;
      case 'LEAGUE_ID_FBR':
        valorA = parseInt(a.LEAGUE_ID_FBR) || 0;
        valorB = parseInt(b.LEAGUE_ID_FBR) || 0;
        break;
      default:
        valorA = a.ID_TORNEO;
        valorB = b.ID_TORNEO;
    }

    if (valorA < valorB) return direccionOrden === 'asc' ? -1 : 1;
    if (valorA > valorB) return direccionOrden === 'asc' ? 1 : -1;
    return 0;
  });

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

  if (loading && torneos.length === 0) {
    return (
      <div className="torneos-list loading">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando torneos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="torneos-list">
      {/* Controles de búsqueda y filtros */}
      <div className="list-controls">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Buscar por nombre, temporada, país o rueda..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>
        
        <div className="list-stats">
          <span className="stats-text">
            {torneosFiltrados.length} de {torneos.length} torneos
          </span>
        </div>
      </div>

      {torneosFiltrados.length === 0 ? (
        <div className="no-data">
          {filtro ? (
            <>
              <h3>🔍 No se encontraron torneos</h3>
              <p>No hay torneos que coincidan con "{filtro}"</p>
              <button 
                onClick={() => setFiltro('')} 
                className="btn btn-secondary"
              >
                Limpiar búsqueda
              </button>
            </>
          ) : (
            <>
              <h3>🏆 No hay torneos registrados</h3>
              <p>Comienza agregando tu primer torneo al sistema</p>
            </>
          )}
        </div>
      ) : (
        <div className="table-container">
          <table className="torneos-table">
            <thead>
              <tr>
                <th 
                  onClick={() => handleOrdenar('LEAGUE_ID_FBR')}
                  className="sortable"
                >
                  League ID {getIconoOrden('LEAGUE_ID_FBR')}
                </th>
                <th 
                  onClick={() => handleOrdenar('NOMBRE')}
                  className="sortable"
                >
                  Nombre {getIconoOrden('NOMBRE')}
                </th>
                <th 
                  onClick={() => handleOrdenar('NOMBRE_PAIS')}
                  className="sortable"
                >
                  País Organizador {getIconoOrden('NOMBRE_PAIS')}
                </th>
                <th 
                  onClick={() => handleOrdenar('RUEDA')}
                  className="sortable"
                >
                  Rueda {getIconoOrden('RUEDA')}
                </th>
                <th 
                  onClick={() => handleOrdenar('TEMPORADA')}
                  className="sortable"
                >
                  Temporada {getIconoOrden('TEMPORADA')}
                </th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {torneosOrdenados.map((torneo) => (
                <tr key={torneo.ID_TORNEO} className="torneo-row">
                  <td className="torneo-id">
                    <code>{torneo.LEAGUE_ID_FBR}</code>
                  </td>
                  <td className="torneo-name">
                    <strong>{torneo.NOMBRE}</strong>
                  </td>
                  <td className="torneo-country">
                    <div className="country-info">
                      <span className="country-flag">{torneo.CODIGO_PAIS}</span>
                      <span className="country-name">{torneo.NOMBRE_PAIS}</span>
                    </div>
                  </td>
                  <td className="torneo-rueda">
                    <span className={`rueda-badge ${torneo.RUEDA.toLowerCase()}`}>
                      {formatearRueda(torneo.RUEDA)}
                    </span>
                  </td>
                  <td className="torneo-temporada">
                    <span className="temporada-badge">
                      {torneo.TEMPORADA}
                    </span>
                  </td>
                  <td className="acciones">
                    <button
                      onClick={() => onEditar(torneo)}
                      className="btn btn-edit"
                      title="Editar torneo"
                      disabled={loading}
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => onEliminar(torneo)}
                      className="btn btn-delete"
                      title="Eliminar torneo"
                      disabled={loading}
                    >
                      🗑️
                    </button>
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

export default TorneosList;