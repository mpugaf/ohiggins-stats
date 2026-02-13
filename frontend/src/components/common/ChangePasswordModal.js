import React, { useState } from 'react';
import { api, handleResponse } from '../../services/apiService';
import './ChangePasswordModal.css';

function ChangePasswordModal({ isOpen, onClose, username }) {
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNuevo, setPasswordNuevo] = useState('');
  const [passwordConfirmar, setPasswordConfirmar] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validaciones
    if (!passwordActual || !passwordNuevo || !passwordConfirmar) {
      setError('Todos los campos son requeridos');
      return;
    }

    if (passwordNuevo.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (passwordNuevo !== passwordConfirmar) {
      setError('Las contraseñas nuevas no coinciden');
      return;
    }

    if (passwordActual === passwordNuevo) {
      setError('La nueva contraseña debe ser diferente a la actual');
      return;
    }

    try {
      setLoading(true);

      const response = await api.put('/api/auth/cambiar-password', {
        passwordActual,
        passwordNuevo
      });

      const data = await handleResponse(response);

      if (data.success) {
        setSuccess('Contraseña actualizada exitosamente');
        setPasswordActual('');
        setPasswordNuevo('');
        setPasswordConfirmar('');

        // Cerrar modal después de 2 segundos
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (err) {
      setError(err.message || 'Error al cambiar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPasswordActual('');
    setPasswordNuevo('');
    setPasswordConfirmar('');
    setError('');
    setSuccess('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content-password" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Cambiar Contraseña</h2>
          <button className="modal-close-btn" onClick={handleClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M6 18L18 6"/>
            </svg>
          </button>
        </div>

        <div className="modal-user-info">
          <span className="user-label">Usuario:</span>
          <span className="user-value">{username}</span>
        </div>

        <form onSubmit={handleSubmit} className="password-form">
          <div className="form-group">
            <label htmlFor="passwordActual">Contraseña Actual</label>
            <input
              type="password"
              id="passwordActual"
              value={passwordActual}
              onChange={(e) => setPasswordActual(e.target.value)}
              placeholder="Ingresa tu contraseña actual"
              disabled={loading || success}
              autoComplete="current-password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="passwordNuevo">Nueva Contraseña</label>
            <input
              type="password"
              id="passwordNuevo"
              value={passwordNuevo}
              onChange={(e) => setPasswordNuevo(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              disabled={loading || success}
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="passwordConfirmar">Confirmar Nueva Contraseña</label>
            <input
              type="password"
              id="passwordConfirmar"
              value={passwordConfirmar}
              onChange={(e) => setPasswordConfirmar(e.target.value)}
              placeholder="Repite la nueva contraseña"
              disabled={loading || success}
              autoComplete="new-password"
            />
          </div>

          {error && (
            <div className="alert alert-error">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 8v4m0 4h.01"/>
              </svg>
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9 12l2 2 4-4"/>
              </svg>
              {success}
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || success}
            >
              {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ChangePasswordModal;
