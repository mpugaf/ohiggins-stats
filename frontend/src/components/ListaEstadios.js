// frontend/src/components/ListaEstadios.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { estadiosService, handleResponse } from '../services/apiService';
import './TableStyles.css';

const ListaEstadios = () => {
  const navigate = useNavigate();
  const [estadios, setEstadios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtro, setFiltro] = useState('');

  useEffect(() => {
    cargarEstadios();
  }, []);

  const cargarEstadios = async () => {
    try {
      setLoading(true);
      const response = await estadiosService.getAll();
      const data = await handleResponse(response);
      setEstadios(data);
      setError(null);
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cargar los estadios: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (estadio) => {
    if (window.confirm(`¿Está seguro que desea eliminar el estadio "${estadio.NOMBRE}"?`)) {
      try {
        const response = await estadiosService.delete(estadio.ID_ESTADIO);
        await handleResponse(response);
        alert('Estadio eliminado exitosamente');
        cargarEstadios(); // Recargar la lista
      } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar el estadio: ' + error.message);
      }
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-CL');
  };

  const formatearCapacidad = (capacidad) => {
    if (!capacidad) return 'N/A';
    return new Intl.NumberFormat('es-CL').format(capacidad);
  };

  const obtenerClaseSuperficie = (superficie) => {
    if (!superficie) return 'superficie-badge';
    
    const superficieLower = superficie.toLowerCase();
    if (superficieLower.includes('césped') || superficieLower.includes('natural')) {
      return 'superficie-badge cesped';
    } else if (superficieLower.includes('artificial') || superficieLower.includes('sintético')) {
      return 'superficie-badge artificial';
    } else if (superficieLower.includes('híbrido')) {
      return 'superficie-badge hibrido';
    }
    return 'superficie-badge';
  };

  const estadiosFiltrados = estadios.filter(estadio =>
    (estadio.NOMBRE || '').toLowerCase().includes(filtro.toLowerCase()) ||
    (estadio.CIUDAD || '').toLowerCase().includes(filtro.toLowerCase()) ||
    (estadio.SUPERFICIE || '').toLowerCase().includes(filtro.toLowerCase())
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando estadios...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">
          <h3>Error</h3>
          <p>{error}</p>
          <button onClick={cargarEstadios} className="btn-primary">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="table-container">
      <div className="table-header">
        <h2>⚽ Estadios Registrados</h2>
        <div className="table-actions">
          <input
            type="text"
            placeholder="🔍 Buscar estadios por nombre, ciudad o superficie..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="search-input"
          />
          <button 
            onClick={() => navigate('/nuevo-estadio')}
            className="btn-primary"
          >
            ➕ Nuevo Estadio
          </button>
        </div>
      </div>

      {estadiosFiltrados.length === 0 ? (
        <div className="empty-state">
          <h3>📍 No se encontraron estadios</h3>
          <p>
            {filtro 
              ? `No hay estadios que coincidan con "${filtro}"`
              : 'No hay estadios registrados en el sistema'
            }
          </p>
          {!filtro && (
            <button 
              onClick={() => navigate('/nuevo-estadio')}
              className="btn-primary"
            >
              🏟️ Crear primer estadio
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="table-info">
            <p>
              📊 Mostrando <strong>{estadiosFiltrados.length}</strong> de <strong>{estadios.length}</strong> estadios
              {filtro && (
                <span> - Filtro: "<em>{filtro}</em>"</span>
              )}
            </p>
          </div>
          
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>🆔 ID</th>
                  <th>🏟️ Nombre</th>
                  <th>👥 Capacidad</th>
                  <th>🌍 Ciudad</th>
                  <th>📅 Inauguración</th>
                  <th>🌱 Superficie</th>
                  <th>⚙️ Acciones</th>
                </tr>
              </thead>
              <tbody>
                {estadiosFiltrados.map((estadio) => (
                  <tr key={estadio.ID_ESTADIO} className="estadio-row">
                    <td>
                      <span className="estadio-id">{estadio.ID_ESTADIO}</span>
                    </td>
                    <td>
                      <div className="nombre-estadio">{estadio.NOMBRE}</div>
                    </td>
                    <td>
                      <span className="capacidad">
                        {formatearCapacidad(estadio.CAPACIDAD)}
                      </span>
                    </td>
                    <td>
                      <span className="ciudad-estadio">
                        📍 {estadio.CIUDAD}
                      </span>
                    </td>
                    <td>
                      <span className="fecha-inauguracion">
                        {formatearFecha(estadio.FECHA_INAUGURACION)}
                      </span>
                    </td>
                    <td>
                      <span className={obtenerClaseSuperficie(estadio.SUPERFICIE)}>
                        {estadio.SUPERFICIE || 'No especificada'}
                      </span>
                    </td>
                    <td className="acciones">
                      <button
                        onClick={() => navigate(`/editar-estadio/${estadio.ID_ESTADIO}`)}
                        className="btn-edit"
                        title={`Editar ${estadio.NOMBRE}`}
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleEliminar(estadio)}
                        className="btn-delete"
                        title={`Eliminar ${estadio.NOMBRE}`}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Estadísticas adicionales */}
          <div className="table-info">
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px' }}>
              <span>
                🏟️ <strong>Total estadios:</strong> {estadios.length}
              </span>
              <span>
                👥 <strong>Capacidad total:</strong> {
                  new Intl.NumberFormat('es-CL').format(
                    estadios.reduce((total, estadio) => total + (estadio.CAPACIDAD || 0), 0)
                  )
                } espectadores
              </span>
              <span>
                🌍 <strong>Ciudades:</strong> {
                  new Set(estadios.map(e => e.CIUDAD).filter(Boolean)).size
                } diferentes
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ListaEstadios;