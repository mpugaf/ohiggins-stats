// frontend/src/components/ListaEquipos.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { equiposService, handleResponse } from '../services/apiService';
import './TableStyles.css';

const ListaEquipos = () => {
  const navigate = useNavigate();
  const [equipos, setEquipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtro, setFiltro] = useState('');

  useEffect(() => {
    cargarEquipos();
  }, []);

  const cargarEquipos = async () => {
    try {
      setLoading(true);
      const response = await equiposService.getAll();
      const data = await handleResponse(response);
      setEquipos(data);
      setError(null);
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cargar los equipos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (equipo) => {
    if (window.confirm(`¿Está seguro que desea eliminar el equipo "${equipo.NOMBRE}"?`)) {
      try {
        const response = await equiposService.delete(equipo.ID_EQUIPO);
        await handleResponse(response);
        alert('Equipo eliminado exitosamente');
        cargarEquipos(); // Recargar la lista
      } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar el equipo: ' + error.message);
      }
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'No especificada';
    return new Date(fecha).toLocaleDateString('es-CL');
  };

  const equiposFiltrados = equipos.filter(equipo =>
    (equipo.NOMBRE || '').toLowerCase().includes(filtro.toLowerCase()) ||
    (equipo.APODO || '').toLowerCase().includes(filtro.toLowerCase()) ||
    (equipo.CIUDAD || '').toLowerCase().includes(filtro.toLowerCase())
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando equipos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">
          <h3>Error</h3>
          <p>{error}</p>
          <button onClick={cargarEquipos} className="btn-primary">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="table-container">
      <div className="table-header">
        <h2>Equipos Registrados</h2>
        <div className="table-actions">
          <input
            type="text"
            placeholder="Buscar equipos..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="search-input"
          />
          <button 
            onClick={() => navigate('/nuevo-equipo')}
            className="btn-primary"
          >
            + Nuevo Equipo
          </button>
        </div>
      </div>

      {equiposFiltrados.length === 0 ? (
        <div className="empty-state">
          <h3>No se encontraron equipos</h3>
          <p>
            {filtro 
              ? 'No hay equipos que coincidan con la búsqueda'
              : 'No hay equipos registrados en el sistema'
            }
          </p>
          {!filtro && (
            <button 
              onClick={() => navigate('/nuevo-equipo')}
              className="btn-primary"
            >
              Crear primer equipo
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="table-info">
            <p>Mostrando {equiposFiltrados.length} de {equipos.length} equipos</p>
          </div>
          
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Apodo</th>
                  <th>Ciudad</th>
                  <th>Fecha Fundación</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {equiposFiltrados.map((equipo) => (
                  <tr key={equipo.ID_EQUIPO}>
                    <td>{equipo.ID_EQUIPO}</td>
                    <td className="nombre-equipo">{equipo.NOMBRE}</td>
                    <td className="apodo-equipo">
                      {equipo.APODO ? (
                        <span className="apodo-badge">"{equipo.APODO}"</span>
                      ) : (
                        <span className="sin-apodo">Sin apodo</span>
                      )}
                    </td>
                    <td>{equipo.CIUDAD}</td>
                    <td>{formatearFecha(equipo.FECHA_FUNDACION)}</td>
                    <td>
                      <span className="estado-badge activo">
                        Activo
                      </span>
                    </td>
                    <td className="acciones">
                      <button
                        onClick={() => navigate(`/editar-equipo/${equipo.ID_EQUIPO}`)}
                        className="btn-edit"
                        title="Editar equipo"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleEliminar(equipo)}
                        className="btn-delete"
                        title="Eliminar equipo"
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

export default ListaEquipos;