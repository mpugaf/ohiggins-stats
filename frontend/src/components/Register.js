import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Register.css';

function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    nombre_completo: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Limpiar error al escribir
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (!formData.username.trim()) {
      setError('El nombre de usuario es obligatorio');
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

    if (!formData.password.trim()) {
      setError('La contraseña es obligatoria');
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setIsSubmitting(true);

    try {
      const user = await register({
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        nombre_completo: formData.nombre_completo.trim() || formData.username.trim()
      });

      // Redirigir según rol (aunque siempre será usuario)
      if (user.role === 'admin') {
        navigate('/dashboard');
      } else {
        navigate('/partidos-apuestas');
      }

    } catch (err) {
      setError(err.message || 'Error al crear la cuenta');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        {/* Header */}
        <div className="register-header">
          <div className="logo-circle">
            <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
              <circle cx="30" cy="30" r="28" fill="url(#gradient)" stroke="#00BFFF" strokeWidth="2"/>
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{stopColor: '#00BFFF', stopOpacity: 1}} />
                  <stop offset="100%" style={{stopColor: '#0099CC', stopOpacity: 1}} />
                </linearGradient>
              </defs>
              <text x="30" y="38" fontSize="24" fontWeight="bold" fill="white" textAnchor="middle">O</text>
            </svg>
          </div>
          <h1>Crear Cuenta</h1>
          <p className="subtitle">Únete a O'Higgins Stats</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert-error">
            <span className="alert-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-field">
            <label htmlFor="username">Usuario</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Tu nombre de usuario"
              autoComplete="username"
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="tu@email.com"
              autoComplete="email"
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="nombre_completo">Nombre Completo (opcional)</label>
            <input
              type="text"
              id="nombre_completo"
              name="nombre_completo"
              value={formData.nombre_completo}
              onChange={handleChange}
              placeholder="Tu nombre completo"
              autoComplete="name"
              disabled={isSubmitting}
            />
          </div>

          <div className="form-field">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Mínimo 6 caracteres"
              autoComplete="new-password"
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="confirmPassword">Confirmar Contraseña</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Repite tu contraseña"
              autoComplete="new-password"
              disabled={isSubmitting}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creando cuenta...' : 'Crear Cuenta'}
          </button>
        </form>

        {/* Footer */}
        <div className="register-footer">
          <p>¿Ya tienes una cuenta? <Link to="/login">Inicia Sesión</Link></p>
        </div>
      </div>
    </div>
  );
}

export default Register;
