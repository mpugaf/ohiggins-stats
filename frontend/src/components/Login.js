import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Usuario y contraseña son requeridos');
      return;
    }

    setIsSubmitting(true);

    try {
      const user = await login(username, password);

      // Redirigir según rol
      if (user.role === 'admin') {
        navigate('/dashboard');
      } else {
        navigate('/partidos-apuestas');
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-container-modern">
      {/* Fondo animado con partículas */}
      <div className="background-animation">
        <div className="particle particle-1"></div>
        <div className="particle particle-2"></div>
        <div className="particle particle-3"></div>
        <div className="particle particle-4"></div>
        <div className="particle particle-5"></div>
      </div>

      {/* Layout principal con 3 columnas */}
      <div className="login-layout">
        {/* Imagen Izquierda - Bienvenido */}
        <div className="login-image-container login-image-left">
          <img
            src="/images/site/bienvenido.png"
            alt="Bienvenido a O'Higgins Stats"
            className="login-side-image"
          />
        </div>

        {/* Card de Login - Centro */}
        <div className="login-card-modern">
        {/* Header con Insignia de O'Higgins */}
        <div className="login-header-modern">
          <div className="badge-container">
            <img
              src="/images/equipos/ohiggins.png"
              alt="O'Higgins Badge"
              className="team-badge"
            />
            <div className="badge-glow"></div>
          </div>
          <h1 className="login-title">
            <span className="title-ohiggins">O'HIGGINS BETS</span>
            <span className="title-subtitle">Plataforma para celestes</span>
          </h1>
          <div className="title-underline"></div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="login-form-modern">
          <h2 className="form-title">Iniciar Sesión</h2>

          {error && (
            <div className="alert-modern alert-error-modern">
              <div className="alert-icon-modern">⚠️</div>
              <div className="alert-content">
                <span className="alert-text">{error}</span>
              </div>
            </div>
          )}

          <div className="form-group-modern">
            <label htmlFor="username" className="form-label-modern">
              Usuario
            </label>
            <div className="input-wrapper">
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ingresa tu usuario"
                autoComplete="username"
                disabled={isSubmitting}
                className="form-input-modern"
              />
              <div className="input-highlight"></div>
            </div>
          </div>

          <div className="form-group-modern">
            <label htmlFor="password" className="form-label-modern">
              Contraseña
            </label>
            <div className="input-wrapper">
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu contraseña"
                autoComplete="current-password"
                disabled={isSubmitting}
                className="form-input-modern"
              />
              <div className="input-highlight"></div>
            </div>
          </div>

          <button
            type="submit"
            className="btn-login-modern"
            disabled={isSubmitting}
          >
            <span className="btn-text">
              {isSubmitting ? 'Ingresando...' : 'INGRESAR'}
            </span>
            <div className="btn-shine"></div>
          </button>

          <div className="divider-modern">
            <span>o</span>
          </div>

          <div className="login-footer-modern">
            {/* <p className="footer-text">
              ¿No tienes cuenta?
            </p>
            <Link to="/register" className="register-link-modern">
              <span>Regístrate Gratis</span>
              <span className="link-arrow">→</span>
            </Link> */}
          </div>
        </form>

          {/* Footer decorativo */}
          <div className="card-footer-decoration">
            <div className="decoration-line"></div>
          </div>
        </div>

        {/* Imagen Derecha - Registro */}
        <div className="login-image-container login-image-right">
          <img
            src="/images/site/registro.png"
            alt="Regístrate en O'Higgins Stats"
            className="login-side-image"
          />
        </div>
      </div>

      {/* Elementos decorativos de fondo */}
      <div className="bg-decoration bg-decoration-1"></div>
      <div className="bg-decoration bg-decoration-2"></div>
    </div>
  );
}

export default Login;
