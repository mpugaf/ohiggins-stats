import React, { useState, useEffect } from 'react';
import { programasService, handleResponse } from '../../services/apiService';
import './GestionProgramas.css';

const GestionProgramas = () => {
  const [programas, setProgramas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editando, setEditando] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    tipo: 'podcast',
    url: '',
    logo_url: ''
  });

  useEffect(() => {
    cargarProgramas();
  }, []);

  const cargarProgramas = async () => {
    try {
      setLoading(true);
      const response = await programasService.getAll();
      const data = await handleResponse(response);
      setProgramas(data.data || []);
    } catch (err) {
      setError('Error al cargar programas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (editando) {
        await programasService.update(editando, formData);
      } else {
        await programasService.create(formData);
      }

      await cargarProgramas();
      resetForm();
      alert(editando ? 'Programa actualizado' : 'Programa creado');
    } catch (err) {
      setError('Error al guardar programa');
      console.error(err);
    }
  };

  const handleEditar = (programa) => {
    setEditando(programa.id_programa);
    setFormData({
      nombre: programa.nombre,
      descripcion: programa.descripcion || '',
      tipo: programa.tipo || 'podcast',
      url: programa.url || '',
      logo_url: programa.logo_url || ''
    });
  };

  const handleEliminar = async (id, nombre) => {
    if (id === 1) {
      alert('No se puede eliminar "Sin Programa"');
      return;
    }

    if (!window.confirm(`¿Eliminar programa "${nombre}"?`)) return;

    try {
      await programasService.delete(id);
      await cargarProgramas();
      alert('Programa eliminado');
    } catch (err) {
      setError('Error al eliminar programa');
      console.error(err);
    }
  };

  const resetForm = () => {
    setEditando(null);
    setFormData({
      nombre: '',
      descripcion: '',
      tipo: 'podcast',
      url: '',
      logo_url: ''
    });
  };

  if (loading) return <div className="loading">Cargando programas...</div>;

  return (
    <div className="gestion-programas">
      <div className="header">
        <h1>🎙️ Gestión de Programas</h1>
        <p>Administra podcasts, radios y medios de O'Higgins</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="content-grid">
        {/* Formulario */}
        <div className="form-section">
          <h2>{editando ? 'Editar Programa' : 'Nuevo Programa'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nombre *</label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                required
                placeholder="Ej: Podcast Capo de Provincia"
              />
            </div>

            <div className="form-group">
              <label>Tipo</label>
              <select
                value={formData.tipo}
                onChange={(e) => setFormData({...formData, tipo: e.target.value})}
              >
                <option value="podcast">Podcast</option>
                <option value="radio">Radio</option>
                <option value="blog">Blog</option>
                <option value="youtube">YouTube</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div className="form-group">
              <label>Descripción</label>
              <textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                placeholder="Descripción del programa..."
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>URL</label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({...formData, url: e.target.value})}
                placeholder="https://..."
              />
            </div>

            <div className="form-group">
              <label>URL del Logo</label>
              <input
                type="url"
                value={formData.logo_url}
                onChange={(e) => setFormData({...formData, logo_url: e.target.value})}
                placeholder="https://..."
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">
                {editando ? 'Actualizar' : 'Crear'}
              </button>
              {editando && (
                <button type="button" onClick={resetForm} className="btn-secondary">
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Lista */}
        <div className="list-section">
          <h2>Programas Registrados ({programas.length})</h2>
          <div className="programas-list">
            {programas.map(programa => (
              <div key={programa.id_programa} className="programa-card">
                <div className="programa-info">
                  <h3>{programa.nombre}</h3>
                  <span className="programa-tipo">{programa.tipo}</span>
                  {programa.descripcion && <p>{programa.descripcion}</p>}
                  {programa.url && (
                    <a href={programa.url} target="_blank" rel="noopener noreferrer">
                      🔗 Ver sitio
                    </a>
                  )}
                </div>
                <div className="programa-actions">
                  <button onClick={() => handleEditar(programa)} className="btn-edit">
                    ✏️
                  </button>
                  {programa.id_programa !== 1 && (
                    <button
                      onClick={() => handleEliminar(programa.id_programa, programa.nombre)}
                      className="btn-delete"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GestionProgramas;
