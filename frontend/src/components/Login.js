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
      setError('Username y contraseña son requeridos');
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
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="logo-section">
            <span className="logo-text">O'Higgins</span>
            <span className="logo-subtext">Stats & Betting</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <h2>Iniciar Sesión</h2>

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="username">Usuario</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ingresa tu usuario"
              autoComplete="username"
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingresa tu contraseña"
              autoComplete="current-password"
              disabled={isSubmitting}
            />
          </div>

          <button
            type="submit"
            className="btn-login"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Ingresando...' : 'Ingresar'}
          </button>

          <div className="login-footer">
            <p>¿No tienes cuenta? <Link to="/register">Regístrate aquí</Link></p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
