// frontend/src/components/ListaTorneos.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { torneosService, handleResponse } from '../services/apiService';
import './TableStyles.css';

const ListaTorneos = () => {
  const navigate = useNavigate();
  const [torneos, setTorneos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtro, setFiltro] = useState('');

  useEffect(() => {
    cargarTorneos();
  }, []);

  const cargarTorneos = async () => {
    try {
      setLoading(true);
      const response = await torneosService.getAll();
      const data = await handleResponse(response);
      console.log('📋 Torneos recibidos del backend:', data);
      if (data.length > 0) {
        console.log('📋 Primer torneo (ejemplo):', data[0]);
      }
      setTorneos(data);
      setError(null);
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cargar los torneos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (torneo) => {
    if (window.confirm(`¿Está seguro que desea eliminar el torneo "${torneo.NOMBRE}"?`)) {
      try {
        const torneoId = torneo.ID_TORNEO || torneo.id;
        const response = await torneosService.delete(torneoId);
        await handleResponse(response);
        alert('Torneo eliminado exitosamente');
        cargarTorneos(); // Recargar la lista
      } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar el torneo: ' + error.message);
      }
    }
  };

  const handleEditar = (torneo) => {
    const torneoId = torneo.ID_TORNEO || torneo.id;
    console.log('🔍 EDITAR - Torneo completo:', torneo);
    console.log('🔍 EDITAR - ID del torneo:', torneoId);
    console.log('🔍 EDITAR - Navegando a:', `/editar-torneo/${torneoId}`);
    navigate(`/editar-torneo/${torneoId}`);
  };

  const formatearRueda = (rueda) => {
    const ruedas = {
      'PRIMERA': '1ª Rueda',
      'SEGUNDA': '2ª Rueda',
      'UNICA': 'Rueda Única'
    };
    return ruedas[rueda] || rueda;
  };

  const torneosFiltrados = torneos.filter(torneo =>
    (torneo.NOMBRE || '').toLowerCase().includes(filtro.toLowerCase()) ||
    (torneo.NOMBRE_PAIS || '').toLowerCase().includes(filtro.toLowerCase()) ||
    (torneo.TEMPORADA || '').toString().includes(filtro.toLowerCase()) ||
    (torneo.RUEDA || '').toLowerCase().includes(filtro.toLowerCase())
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando torneos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">
          <h3>Error</h3>
          <p>{error}</p>
          <button onClick={cargarTorneos} className="btn-primary">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="table-container">
      <div className="table-header">
        <h2>🏆 Torneos Registrados</h2>
        <div className="table-actions">
          <input
            type="text"
            placeholder="Buscar torneos..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="search-input"
          />
          <button 
            onClick={() => navigate('/nuevo-torneo')}
            className="btn-primary"
          >
            ➕ Nuevo Torneo
          </button>
        </div>
      </div>

      {torneosFiltrados.length === 0 ? (
        <div className="empty-state">
          <h3>No se encontraron torneos</h3>
          <p>
            {filtro 
              ? 'No hay torneos que coincidan con la búsqueda'
              : 'No hay torneos registrados en el sistema'
            }
          </p>
          {!filtro && (
            <button 
              onClick={() => navigate('/nuevo-torneo')}
              className="btn-primary"
            >
              Crear primer torneo
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="table-info">
            <p>Mostrando {torneosFiltrados.length} de {torneos.length} torneos</p>
          </div>
          
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>País Organizador</th>
                  <th>Temporada</th>
                  <th>Formato</th>
                  <th>Rueda/Fases</th>
                  <th>League ID FBR</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {torneosFiltrados.map((torneo) => (
                  <tr key={torneo.ID_TORNEO || torneo.id}>
                    <td>{torneo.ID_TORNEO || torneo.id}</td>
                    <td className="nombre-torneo">{torneo.NOMBRE}</td>
                    <td className="pais-organizador">
                      {(torneo.CODIGO_PAIS || torneo.CODIGO_FIFA) && torneo.NOMBRE_PAIS ? (
                        <span className="pais-badge">
                          {torneo.CODIGO_PAIS || torneo.CODIGO_FIFA} - {torneo.NOMBRE_PAIS}
                        </span>
                      ) : (
                        <span className="pais-badge" style={{ opacity: 0.5 }}>
                          Sin país
                        </span>
                      )}
                    </td>
                    <td className="temporada">{torneo.TEMPORADA}</td>
                    <td className="formato">
                      <span className={`formato-badge ${torneo.FORMATO_TORNEO?.toLowerCase() || 'ruedas'}`}>
                        {torneo.FORMATO_TORNEO === 'FASES' ? '🏆 Fases' : '⚽ Ruedas'}
                      </span>
                    </td>
                    <td className="rueda">
                      {torneo.RUEDA ? (
                        <span className={`rueda-badge ${torneo.RUEDA.toLowerCase()}`}>
                          {formatearRueda(torneo.RUEDA)}
                        </span>
                      ) : torneo.FORMATO_TORNEO === 'FASES' && torneo.FASES && torneo.FASES.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {torneo.FASES.slice(0, 3).map((fase, idx) => (
                            <span key={idx} className="rueda-badge" style={{ opacity: 0.8, fontSize: '0.8em' }}>
                              {fase.NOMBRE_FASE}
                            </span>
                          ))}
                          {torneo.FASES.length > 3 && (
                            <span className="rueda-badge" style={{ opacity: 0.5, fontSize: '0.75em' }}>
                              +{torneo.FASES.length - 3} más
                            </span>
                          )}
                        </div>
                      ) : torneo.FORMATO_TORNEO === 'FASES' ? (
                        <span className="rueda-badge" style={{ opacity: 0.5, fontSize: '0.85em' }}>
                          Sin fases
                        </span>
                      ) : (
                        <span className="rueda-badge" style={{ opacity: 0.5 }}>
                          -
                        </span>
                      )}
                    </td>
                    <td className="league-id">
                      <code>{torneo.LEAGUE_ID_FBR}</code>
                    </td>
                    <td className="acciones">
                      <button
                        onClick={() => handleEditar(torneo)}
                        className="btn-edit"
                        title="Editar torneo"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleEliminar(torneo)}
                        className="btn-delete"
                        title="Eliminar torneo"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default ListaTorneos;