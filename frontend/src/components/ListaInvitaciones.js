import React, { useState, useEffect } from 'react';
import { tokensInvitacionService, handleResponse } from '../services/apiService';
import './ListaInvitaciones.css';

const TEXTOS_INVITACION = [
  '¡Quiero unirme a O\'Higgins Stats!',
  '¡Acepto el desafio Celeste!',
  '¡Soy del Capo de Provincia!',
  '¡A jugar con el Rancagüino!',
  '¡Me uno al Club de los Expertos!',
  '¡Entro a la Academia Celeste!',
  '¡Quiero ser parte del Celeste!',
  '¡Registro como fiel Celeste!',
  '¡Inicio mi aventura en el Capo!',
  '¡Me sumo al equipo de ases!',
];

const ListaInvitaciones = () => {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const cargar = async () => {
      try {
        const response = await tokensInvitacionService.getPublico();
        const data = await handleResponse(response);
        setTokens(data);
      } catch (err) {
        setError('No se pudieron cargar las invitaciones disponibles.');
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  const abrirRegistro = (invitationLink) => {
    window.open(invitationLink, '_blank', 'noopener,noreferrer');
  };

  const getTexto = (index) => {
    return TEXTOS_INVITACION[index % TEXTOS_INVITACION.length];
  };

  return (
    <div className="lista-invitaciones-page">
      <div className="invitaciones-background">
        <div className="inv-bg-circle inv-bg-circle-1"></div>
        <div className="inv-bg-circle inv-bg-circle-2"></div>
        <div className="inv-bg-circle inv-bg-circle-3"></div>
      </div>

      <div className="invitaciones-container">
        <div className="invitaciones-header">
          <div className="inv-logo-wrapper">
            <img
              src="/images/equipos/ohiggins.png"
              alt="O'Higgins"
              className="inv-logo"
            />
          </div>
          <h1 className="invitaciones-titulo">O'Higgins Stats</h1>
          <p className="invitaciones-subtitulo">
            Selecciona tu invitacion personal para registrarte en la plataforma
          </p>
        </div>

        <div className="invitaciones-body">
          {loading && (
            <div className="inv-loading">
              <div className="inv-spinner"></div>
              <p>Cargando invitaciones...</p>
            </div>
          )}

          {error && (
            <div className="inv-error">
              <span className="inv-error-icon">!</span>
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && tokens.length === 0 && (
            <div className="inv-empty">
              <div className="inv-empty-icon">X</div>
              <h3>Sin invitaciones disponibles</h3>
              <p>Por el momento no hay invitaciones activas. Contacta al administrador.</p>
            </div>
          )}

          {!loading && !error && tokens.length > 0 && (
            <div className="invitaciones-grid">
              {tokens.map((token, index) => (
                <button
                  key={token.id_token}
                  className="inv-card"
                  onClick={() => abrirRegistro(token.invitationLink)}
                >
                  <div className="inv-card-numero">#{token.numero}</div>
                  <div className="inv-card-icono">
                    <img
                      src="/images/equipos/ohiggins.png"
                      alt="Escudo"
                      className="inv-card-escudo"
                    />
                  </div>
                  <div className="inv-card-texto">{getTexto(index)}</div>
                  <div className="inv-card-accion">
                    Abrir formulario de registro
                    <span className="inv-arrow">→</span>
                  </div>
                  <div className="inv-card-glow"></div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="invitaciones-footer">
          <p>
            ¿Ya tienes cuenta?{' '}
            <a href="/login" className="inv-login-link">Inicia sesion aqui</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ListaInvitaciones;
