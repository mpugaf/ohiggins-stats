import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usuariosService, handleResponse } from '../../services/apiService';
import '../TableStyles.css';
import './UsuariosStyles.css';

const ListaUsuarios = () => {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtro, setFiltro] = useState('');

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      const response = await usuariosService.getAll();
      const data = await handleResponse(response);
      setUsuarios(data.data || data);
      setError(null);
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cargar los usuarios: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (usuario) => {
    if (window.confirm(`¿Está seguro que desea eliminar el usuario "${usuario.username}"?\n\nEsta acción no se puede deshacer.`)) {
      try {
        const response = await usuariosService.delete(usuario.id_usuario);
        const data = await handleResponse(response);
        alert(data.message || 'Usuario eliminado exitosamente');
        cargarUsuarios();
      } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar el usuario: ' + error.message);
      }
    }
  };

  const handleToggleActivo = async (usuario) => {
    const accion = usuario.activo ? 'desactivar' : 'activar';
    const mensaje = usuario.activo
      ? `¿Está seguro que desea desactivar el usuario "${usuario.username}"?\n\nEl usuario NO aparecerá en la tabla de posiciones/rankings.\nPodrá reactivarlo en cualquier momento.`
      : `¿Está seguro que desea activar el usuario "${usuario.username}"?\n\nEl usuario aparecerá nuevamente en la tabla de posiciones/rankings.`;

    if (window.confirm(mensaje)) {
      try {
        const response = await usuariosService.toggleActivo(usuario.id_usuario);
        const data = await handleResponse(response);
        alert(data.message || `Usuario ${accion}do exitosamente`);
        cargarUsuarios();
      } catch (error) {
        console.error('Error:', error);
        alert(`Error al ${accion} el usuario: ` + error.message);
      }
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const obtenerBadgeRole = (role) => {
    if (role === 'admin') {
      return <span className="badge badge-admin">Administrador</span>;
    }
    return <span className="badge badge-usuario">Usuario</span>;
  };

  const obtenerBadgeEstado = (activo) => {
    if (activo) {
      return <span className="badge badge-activo">Activo</span>;
    }
    return <span className="badge badge-inactivo">Inactivo</span>;
  };

  const usuariosFiltrados = usuarios.filter(usuario =>
    (usuario.username || '').toLowerCase().includes(filtro.toLowerCase()) ||
    (usuario.email || '').toLowerCase().includes(filtro.toLowerCase()) ||
    (usuario.nombre_completo || '').toLowerCase().includes(filtro.toLowerCase()) ||
    (usuario.role || '').toLowerCase().includes(filtro.toLowerCase())
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando usuarios...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">
          <h3>Error</h3>
          <p>{error}</p>
          <button onClick={cargarUsuarios} className="btn-primary">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-content">
          <h1>Gestión de Usuarios</h1>
          <p className="subtitle">Administración de usuarios del sistema</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => navigate('/admin/usuarios/nuevo')}
        >
          + Nuevo Usuario
        </button>
      </div>

      <div className="content-card">
        <div className="filters-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="Buscar por username, email, nombre o rol..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="stats-summary">
            <div className="stat-item">
              <span className="stat-label">Total:</span>
              <span className="stat-value">{usuarios.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Activos:</span>
              <span className="stat-value">{usuarios.filter(u => u.activo).length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Administradores:</span>
              <span className="stat-value">{usuarios.filter(u => u.role === 'admin').length}</span>
            </div>
          </div>
        </div>

        {usuariosFiltrados.length === 0 ? (
          <div className="empty-state">
            <p>No se encontraron usuarios</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table usuarios-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Nombre Completo</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Puede Apostar</th>
                  <th>Fecha Creación</th>
                  <th>Último Acceso</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.map((usuario) => (
                  <tr key={usuario.id_usuario}>
                    <td className="username-cell">
                      <strong>{usuario.username}</strong>
                    </td>
                    <td>{usuario.email}</td>
                    <td>{usuario.nombre_completo || 'N/A'}</td>
                    <td>{obtenerBadgeRole(usuario.role)}</td>
                    <td>{obtenerBadgeEstado(usuario.activo)}</td>
                    <td className="text-center">
                      {usuario.puede_apostar ? (
                        <span className="badge badge-success">Sí</span>
                      ) : (
                        <span className="badge badge-danger">No</span>
                      )}
                    </td>
                    <td>{formatearFecha(usuario.fecha_creacion)}</td>
                    <td>{formatearFecha(usuario.ultimo_acceso)}</td>
                    <td className="actions-cell">
                      <div className="action-buttons">
                        <button
                          onClick={() => handleToggleActivo(usuario)}
                          className={usuario.activo ? "btn-warning btn-sm" : "btn-success btn-sm"}
                          title={usuario.activo
                            ? "Desactivar usuario (no aparecerá en rankings)"
                            : "Activar usuario (aparecerá en rankings)"}
                        >
                          {usuario.activo ? 'Desactivar' : 'Activar'}
                        </button>
                        <button
                          onClick={() => handleEliminar(usuario)}
                          className="btn-danger btn-sm"
                          title="Eliminar usuario permanentemente"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {usuariosFiltrados.length > 0 && (
          <div className="table-footer">
            <p>Mostrando {usuariosFiltrados.length} de {usuarios.length} usuarios</p>
          </div>
        )}
      </div>

      <div className="page-actions">
        <button
          className="btn-secondary"
          onClick={() => navigate('/dashboard')}
        >
          Volver al Panel de Administración
        </button>
      </div>
    </div>
  );
};

export default ListaUsuarios;
