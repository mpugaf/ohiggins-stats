import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { usuariosService, handleResponse } from '../../services/apiService';
import './NuevoUsuario.css';

const EditarUsuario = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    nombre_completo: '',
    role: 'usuario',
    puede_apostar: true,
    activo: true
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarUsuario();
  }, [id]);

  const cargarUsuario = async () => {
    try {
      setLoading(true);
      const response = await usuariosService.getById(id);
      const data = await handleResponse(response);
      const usuario = data.data || data;

      setFormData({
        username: usuario.username || '',
        email: usuario.email || '',
        password: '', // No mostramos la contraseña actual
        confirmPassword: '',
        nombre_completo: usuario.nombre_completo || '',
        role: usuario.role || 'usuario',
        puede_apostar: usuario.puede_apostar || false,
        activo: usuario.activo !== undefined ? usuario.activo : true
      });
      setError('');
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cargar usuario: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newValue = type === 'checkbox' ? checked : value;

    // Si cambia el rol a admin, desactivar puede_apostar
    if (name === 'role' && value === 'admin') {
      setFormData(prev => ({
        ...prev,
        role: 'admin',
        puede_apostar: false
      }));
    } else if (name === 'role' && value === 'usuario') {
      // Si cambia a usuario, activar puede_apostar por defecto
      setFormData(prev => ({
        ...prev,
        role: 'usuario',
        puede_apostar: true
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: newValue
      }));
    }

    // Limpiar mensajes al escribir
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validaciones
    if (!formData.username.trim()) {
      setError('El nombre de usuario es obligatorio');
      return;
    }

    if (formData.username.length < 3) {
      setError('El nombre de usuario debe tener al menos 3 caracteres');
      return;
    }

    if (!formData.email.trim()) {
      setError('El email es obligatorio');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('El email no es válido');
      return;
    }

    // Validar contraseña solo si se está cambiando
    if (formData.password.trim() !== '') {
      if (formData.password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres');
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Las contraseñas no coinciden');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const { confirmPassword, ...dataToSend } = formData;

      // Si no se cambió la contraseña, no la enviamos
      if (!dataToSend.password || dataToSend.password.trim() === '') {
        delete dataToSend.password;
      }

      const response = await usuariosService.update(id, dataToSend);
      const data = await handleResponse(response);

      setSuccess('Usuario actualizado exitosamente');

      // Redirigir después de 1.5 segundos
      setTimeout(() => {
        navigate('/admin/usuarios');
      }, 1500);

    } catch (err) {
      setError(err.message || 'Error al actualizar el usuario');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando usuario...</p>
      </div>
    );
  }

  return (
    <div className="nuevo-usuario-container">
      <div className="nuevo-usuario-card">
        {/* Back Button */}
        <Link to="/admin/usuarios" className="btn-back">
          ← Volver a lista de usuarios
        </Link>

        {/* Header */}
        <div className="nuevo-usuario-header">
          <h1>
            <span className="header-icon">✏️</span>
            Editar Usuario
          </h1>
          <p>Modifica los datos del usuario del sistema</p>
        </div>

        {/* Success Alert */}
        {success && (
          <div className="alert alert-success">
            <span className="alert-icon">✅</span>
            <span>{success}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="nuevo-usuario-form">
          {/* Sección: Información de Cuenta */}
          <div className="form-section">
            <h2>
              <span className="section-icon">🔐</span>
              Información de Cuenta
            </h2>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="username">
                  Usuario <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="nombre_usuario"
                  autoComplete="off"
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="email">
                  Email <span className="required">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="usuario@ejemplo.com"
                  autoComplete="email"
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            <div className="form-row single">
              <div className="form-field">
                <label htmlFor="nombre_completo">Nombre Completo</label>
                <input
                  type="text"
                  id="nombre_completo"
                  name="nombre_completo"
                  value={formData.nombre_completo}
                  onChange={handleChange}
                  placeholder="Nombre y apellido (opcional)"
                  autoComplete="name"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Sección: Cambiar Contraseña (Opcional) */}
          <div className="form-section">
            <h2>
              <span className="section-icon">🔒</span>
              Cambiar Contraseña (Opcional)
            </h2>
            <p className="section-help">
              Deja estos campos vacíos si NO deseas cambiar la contraseña
            </p>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="password">Nueva Contraseña</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Mínimo 6 caracteres (opcional)"
                  autoComplete="new-password"
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-field">
                <label htmlFor="confirmPassword">Confirmar Nueva Contraseña</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repita la contraseña (opcional)"
                  autoComplete="new-password"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Sección: Rol y Permisos */}
          <div className="form-section">
            <h2>
              <span className="section-icon">⚙️</span>
              Rol y Permisos
            </h2>

            <div className="form-row single">
              <div className="form-field">
                <label htmlFor="role">
                  Rol del Usuario <span className="required">*</span>
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  disabled={isSubmitting}
                >
                  <option value="usuario">Usuario Regular</option>
                  <option value="admin">Administrador</option>
                </select>

                {formData.role === 'admin' && (
                  <div className="role-info">
                    <span className="role-info-icon">ℹ️</span>
                    <span>
                      Los administradores tienen acceso completo al sistema pero NO pueden realizar apuestas.
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Checkbox: Puede Apostar (solo para usuarios) */}
            {formData.role === 'usuario' && (
              <div className="form-row single">
                <div className={`checkbox-field ${formData.role === 'admin' ? 'disabled' : ''}`}>
                  <input
                    type="checkbox"
                    id="puede_apostar"
                    name="puede_apostar"
                    checked={formData.puede_apostar}
                    onChange={handleChange}
                    disabled={isSubmitting || formData.role === 'admin'}
                  />
                  <div className="checkbox-label">
                    <strong>Permitir realizar apuestas</strong>
                    <small>El usuario podrá participar en el sistema de apuestas</small>
                  </div>
                </div>
              </div>
            )}

            {/* Checkbox: Activo */}
            <div className="form-row single">
              <div className="checkbox-field">
                <input
                  type="checkbox"
                  id="activo"
                  name="activo"
                  checked={formData.activo}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
                <div className="checkbox-label">
                  <strong>Usuario activo</strong>
                  <small>Los usuarios inactivos no aparecen en rankings ni pueden iniciar sesión</small>
                </div>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/admin/usuarios')}
              className="btn-cancel"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Actualizando usuario...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditarUsuario;
