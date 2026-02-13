import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tokensInvitacionService, handleResponse } from '../services/apiService';
import './Register.css';

function Register() {
  const [searchParams] = useSearchParams();
  const invitationToken = searchParams.get('token');

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    nombre_completo: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tokenValidado, setTokenValidado] = useState(false);
  const [validandoToken, setValidandoToken] = useState(!!invitationToken);

  const { register } = useAuth();
  const navigate = useNavigate();

  // Validar token de invitación al cargar el componente
  useEffect(() => {
    const validarToken = async () => {
      if (!invitationToken) {
        setValidandoToken(false);
        return;
      }

      try {
        setValidandoToken(true);
        const response = await tokensInvitacionService.validar(invitationToken);
        const data = await handleResponse(response);

        if (data.valido) {
          setTokenValidado(true);
          console.log('Token de invitación válido');
        } else {
          setError(data.mensaje || 'Token de invitación no válido');
        }
      } catch (err) {
        console.error('Error al validar token:', err);
        setError('Token de invitación no válido o expirado');
      } finally {
        setValidandoToken(false);
      }
    };

    validarToken();
  }, [invitationToken]);

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

    if (formData.username.trim().length < 3) {
      setError('El usuario debe tener al menos 3 caracteres');
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
      const registroData = {
        username: formData.username.trim(),
        password: formData.password,
        nombre_completo: formData.nombre_completo.trim() || formData.username.trim()
        // Email NO se envía - el backend lo manejará como opcional
      };

      // Incluir token de invitación si existe
      if (invitationToken) {
        registroData.invitationToken = invitationToken;
      }

      const user = await register(registroData);

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
    <div className="register-container-modern">
      {/* Fondo animado */}
      <div className="register-background">
        <div className="bg-circle bg-circle-1"></div>
        <div className="bg-circle bg-circle-2"></div>
        <div className="bg-circle bg-circle-3"></div>
      </div>

      {/* Card de Registro */}
      <div className="register-card-modern">
        {/* Header con Insignia de O'Higgins */}
        <div className="register-header-modern">
          <div className="badge-showcase">
            <div className="badge-ring"></div>
            <div className="badge-wrapper">
              <img
                src="/images/equipos/ohiggins.png"
                alt="O'Higgins Badge"
                className="team-badge-register"
              />
            </div>
            <div className="badge-particles">
              <span className="particle-dot particle-dot-1"></span>
              <span className="particle-dot particle-dot-2"></span>
              <span className="particle-dot particle-dot-3"></span>
              <span className="particle-dot particle-dot-4"></span>
            </div>
          </div>

          <h1 className="register-title-modern">
            <span className="title-main">¡Únete al Equipo!</span>
            <span className="title-team">O'HIGGINS STATS</span>
          </h1>

          <p className="register-subtitle-modern">
            {invitationToken ? '¡Has sido invitado! Completa tu registro' : 'Crea tu cuenta y comienza a apostar'}
          </p>
        </div>

        {/* Token de invitación válido */}
        {invitationToken && tokenValidado && (
          <div className="alert-register-success">
            <span className="alert-icon-register">✅</span>
            <span className="alert-text-register">Token de invitación válido. Completa tu registro para comenzar.</span>
          </div>
        )}

        {/* Validando token */}
        {validandoToken && (
          <div className="alert-register-info">
            <span className="alert-icon-register">⏳</span>
            <span className="alert-text-register">Validando token de invitación...</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="alert-register-error">
            <div className="alert-icon-register">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="#ef4444" strokeWidth="2"/>
                <path d="M12 8V12M12 16H12.01" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="alert-text-register">
              {error}
            </div>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="register-form-modern">
          <div className="form-row">
            <div className="form-field-modern">
              <label htmlFor="username" className="form-label-register">
                Usuario
              </label>
              <div className="input-container">
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
                  className="form-input-register"
                />
                <div className="input-border-animation"></div>
              </div>
              <span className="input-helper">Mínimo 3 caracteres</span>
            </div>

            <div className="form-field-modern">
              <label htmlFor="nombre_completo" className="form-label-register">
                Nombre
                <span className="optional-badge">Opcional</span>
              </label>
              <div className="input-container">
                <input
                  type="text"
                  id="nombre_completo"
                  name="nombre_completo"
                  value={formData.nombre_completo}
                  onChange={handleChange}
                  placeholder="Tu nombre completo"
                  autoComplete="name"
                  disabled={isSubmitting}
                  className="form-input-register"
                />
                <div className="input-border-animation"></div>
              </div>
            </div>

            <div className="form-field-modern">
              <label htmlFor="password" className="form-label-register">
                Contraseña
              </label>
              <div className="input-container">
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
                  className="form-input-register"
                />
                <div className="input-border-animation"></div>
              </div>
              <span className="input-helper">Recuérdala!!!</span>
            </div>

            <div className="form-field-modern">
              <label htmlFor="confirmPassword" className="form-label-register">
                Confirmar Contraseña
              </label>
              <div className="input-container">
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
                  className="form-input-register"
                />
                <div className="input-border-animation"></div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="btn-register-modern"
            disabled={isSubmitting}
          >
            <span className="btn-content">
              <span className="btn-text-register">
                {isSubmitting ? 'Creando tu cuenta...' : 'CREAR CUENTA GRATIS'}
              </span>
            </span>
            <div className="btn-glow-effect"></div>
          </button>
        </form>

        {/* Footer */}
        <div className="register-footer-modern">
          <div className="footer-divider"></div>
          <p className="footer-text-register">
            ¿Ya tienes cuenta?
            <Link to="/login" className="login-link-modern">
              <span>Inicia Sesión</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0L6.59 1.41L12.17 7H0V9H12.17L6.59 14.59L8 16L16 8L8 0Z"/>
              </svg>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
