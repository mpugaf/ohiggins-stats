// frontend/src/components/admin/GestionTokens.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tokensInvitacionService, handleResponse } from '../../services/apiService';
import './GestionTokens.css';

const GestionTokens = () => {
  const navigate = useNavigate();
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [copiandoToken, setCopiandoToken] = useState(null);

  useEffect(() => {
    cargarTokens();
  }, []);

  const cargarTokens = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await tokensInvitacionService.getAll();
      const data = await handleResponse(response);
      setTokens(data);

    } catch (err) {
      console.error('Error al cargar tokens:', err);
      setError('Error al cargar tokens: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const generarNuevoToken = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');

      const response = await tokensInvitacionService.create();
      const data = await handleResponse(response);

      setSuccessMessage(`✅ Token generado exitosamente`);

      // Copiar automáticamente al portapapeles
      await copiarAlPortapapeles(data.invitationLink, 'nuevo');

      // Recargar lista
      cargarTokens();

      // Limpiar mensaje después de 5 segundos
      setTimeout(() => setSuccessMessage(''), 5000);

    } catch (err) {
      console.error('Error al generar token:', err);
      setError('Error al generar token: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const copiarAlPortapapeles = async (texto, tokenId) => {
    try {
      // Método 1: Intentar usar la API moderna de Clipboard (requiere HTTPS)
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(texto);
        setCopiandoToken(tokenId);
        setTimeout(() => setCopiandoToken(null), 2000);
        return;
      }

      // Método 2: Fallback para HTTP o navegadores antiguos
      const textarea = document.createElement('textarea');
      textarea.value = texto;
      textarea.style.position = 'fixed';
      textarea.style.top = '0';
      textarea.style.left = '0';
      textarea.style.width = '2em';
      textarea.style.height = '2em';
      textarea.style.padding = '0';
      textarea.style.border = 'none';
      textarea.style.outline = 'none';
      textarea.style.boxShadow = 'none';
      textarea.style.background = 'transparent';
      textarea.setAttribute('readonly', '');

      document.body.appendChild(textarea);

      // Para iOS
      if (navigator.userAgent.match(/ipad|iphone/i)) {
        const range = document.createRange();
        range.selectNodeContents(textarea);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        textarea.setSelectionRange(0, 999999);
      } else {
        textarea.select();
      }

      const exitoso = document.execCommand('copy');
      document.body.removeChild(textarea);

      if (exitoso) {
        setCopiandoToken(tokenId);
        setTimeout(() => setCopiandoToken(null), 2000);

        // Mostrar mensaje de éxito
        if (tokenId === 'nuevo') {
          setSuccessMessage('✅ Token generado y copiado al portapapeles');
        }
      } else {
        throw new Error('execCommand falló');
      }

    } catch (err) {
      console.error('Error al copiar:', err);

      // Mostrar el texto en un prompt como último recurso
      const mensaje = `No se pudo copiar automáticamente. Copia manualmente:\n\n${texto}`;

      // Crear modal personalizado en lugar de alert
      mostrarModalCopia(texto);
    }
  };

  const mostrarModalCopia = (texto) => {
    // Crear overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;

    // Crear modal
    const modal = document.createElement('div');
    modal.style.cssText = `
      background: white;
      padding: 30px;
      border-radius: 12px;
      max-width: 600px;
      width: 90%;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    `;

    modal.innerHTML = `
      <h3 style="margin: 0 0 20px 0; color: #1a1a1a;">📋 Copiar Link de Invitación</h3>
      <p style="margin: 0 0 15px 0; color: #666;">Selecciona y copia el link manualmente:</p>
      <textarea
        readonly
        style="
          width: 100%;
          height: 100px;
          padding: 12px;
          border: 2px solid #4A90E2;
          border-radius: 6px;
          font-family: monospace;
          font-size: 13px;
          resize: none;
          background: #f8f9fa;
        "
      >${texto}</textarea>
      <div style="margin-top: 20px; text-align: right;">
        <button
          style="
            padding: 10px 24px;
            background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%);
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
            font-size: 14px;
          "
        >Cerrar</button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Seleccionar el texto automáticamente
    const textarea = modal.querySelector('textarea');
    textarea.focus();
    textarea.select();

    // Cerrar al hacer click en el botón o en el overlay
    const closeBtn = modal.querySelector('button');
    closeBtn.onclick = () => document.body.removeChild(overlay);
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
      }
    };
  };

  const eliminarToken = async (idToken, estado) => {
    // Confirmación diferenciada según el estado del token
    let mensaje = '¿Está seguro de eliminar este token de invitación?';

    if (estado === 'usado') {
      mensaje = '⚠️ Este token ya fue usado para crear un usuario.\n\n' +
                'Eliminar el token NO eliminará al usuario creado.\n' +
                'Solo se eliminará el registro del historial de invitaciones.\n\n' +
                '¿Desea continuar?';
    }

    if (!window.confirm(mensaje)) {
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await tokensInvitacionService.delete(idToken);
      await handleResponse(response);

      setSuccessMessage('✅ Token eliminado exitosamente');

      // Recargar lista
      cargarTokens();

      setTimeout(() => setSuccessMessage(''), 3000);

    } catch (err) {
      console.error('Error al eliminar token:', err);
      setError('Error al eliminar token: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEstadoBadge = (estado) => {
    const clases = {
      'activo': 'badge-activo',
      'usado': 'badge-usado',
      'expirado': 'badge-expirado'
    };

    const textos = {
      'activo': '✅ Activo',
      'usado': '✔️ Usado',
      'expirado': '❌ Expirado'
    };

    return (
      <span className={`estado-badge ${clases[estado]}`}>
        {textos[estado]}
      </span>
    );
  };

  const tokensActivos = tokens.filter(t => t.estado === 'activo').length;
  const tokensUsados = tokens.filter(t => t.estado === 'usado').length;
  const tokensExpirados = tokens.filter(t => t.estado === 'expirado').length;

  return (
    <div className="gestion-tokens">
      <div className="tokens-header">
        <button onClick={() => navigate('/dashboard')} className="back-btn">
          ← Dashboard
        </button>
        <h1>🎟️ Gestión de Tokens de Invitación</h1>
        <p>Crea y gestiona links únicos para registrar nuevos usuarios</p>
      </div>

      {/* Mensajes */}
      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">❌</span>
          <span>{error}</span>
          <button onClick={() => setError('')} className="alert-close">✕</button>
        </div>
      )}

      {successMessage && (
        <div className="alert alert-success">
          <span className="alert-icon">✅</span>
          <span>{successMessage}</span>
        </div>
      )}

      {/* Estadísticas */}
      <div className="tokens-stats">
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <div className="stat-value">{tokensActivos}</div>
            <div className="stat-label">Tokens Activos</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✔️</div>
          <div className="stat-info">
            <div className="stat-value">{tokensUsados}</div>
            <div className="stat-label">Tokens Usados</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">❌</div>
          <div className="stat-info">
            <div className="stat-value">{tokensExpirados}</div>
            <div className="stat-label">Tokens Expirados</div>
          </div>
        </div>
      </div>

      {/* Botón para generar nuevo token */}
      <div className="actions-bar">
        <button
          onClick={generarNuevoToken}
          disabled={loading}
          className="btn btn-primary"
        >
          ➕ Generar Nuevo Token
        </button>
        <button
          onClick={cargarTokens}
          disabled={loading}
          className="btn btn-secondary"
        >
          🔄 Actualizar
        </button>
      </div>

      {/* Tabla de tokens */}
      {loading && tokens.length === 0 ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando tokens...</p>
        </div>
      ) : tokens.length === 0 ? (
        <div className="no-data">
          <h3>No hay tokens de invitación</h3>
          <p>Genera tu primer token para invitar usuarios</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="tokens-table">
            <thead>
              <tr>
                <th>Token</th>
                <th>Estado</th>
                <th>Creado por</th>
                <th>Fecha Creación</th>
                <th>Usuario Creado</th>
                <th>Fecha Uso</th>
                <th>Expira</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tokens.map((token) => (
                <tr key={token.id_token} className={`token-row ${token.estado}`}>
                  <td>
                    <div className="token-cell">
                      <code className="token-code">
                        {token.token.substring(0, 12)}...
                      </code>
                    </div>
                  </td>
                  <td>{getEstadoBadge(token.estado)}</td>
                  <td>
                    <div className="user-info">
                      <div className="username">{token.creado_por_username}</div>
                      <div className="nombre-completo">{token.creado_por_nombre}</div>
                    </div>
                  </td>
                  <td>{formatearFecha(token.fecha_creacion)}</td>
                  <td>
                    {token.usuario_creado_username ? (
                      <div className="user-info">
                        <div className="username">{token.usuario_creado_username}</div>
                        <div className="nombre-completo">{token.usuario_creado_nombre}</div>
                      </div>
                    ) : (
                      <span className="no-data-text">-</span>
                    )}
                  </td>
                  <td>
                    {token.fecha_uso ? formatearFecha(token.fecha_uso) : (
                      <span className="no-data-text">-</span>
                    )}
                  </td>
                  <td>{formatearFecha(token.fecha_expiracion)}</td>
                  <td>
                    <div className="action-buttons">
                      {token.estado === 'activo' && (
                        <button
                          onClick={() => copiarAlPortapapeles(token.invitationLink, token.id_token)}
                          className="btn btn-copy"
                          title="Copiar link de invitación"
                        >
                          {copiandoToken === token.id_token ? '✅' : '📋'}
                        </button>
                      )}
                      <button
                        onClick={() => eliminarToken(token.id_token, token.estado)}
                        className="btn btn-delete"
                        title={token.estado === 'usado' ? 'Eliminar del historial (no elimina al usuario)' : 'Eliminar token'}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default GestionTokens;
