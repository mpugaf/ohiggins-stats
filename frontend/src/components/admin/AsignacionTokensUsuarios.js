import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { tokensInvitacionService, handleResponse } from '../../services/apiService';
import './AsignacionTokensUsuarios.css';

const AsignacionTokensUsuarios = () => {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(null); // id_usuario en proceso
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      const res = await tokensInvitacionService.getUsuariosConPermiso();
      const data = await handleResponse(res);
      setUsuarios(data);
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message || 'Error al cargar usuarios' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const handleToggle = async (usuario) => {
    const nuevoEstado = !usuario.habilitado;
    setToggling(usuario.id_usuario);
    setMensaje({ tipo: '', texto: '' });

    try {
      const res = await tokensInvitacionService.togglePermiso(usuario.id_usuario, nuevoEstado);
      await handleResponse(res);

      // Actualizar estado local sin recargar toda la lista
      setUsuarios(prev =>
        prev.map(u =>
          u.id_usuario === usuario.id_usuario
            ? { ...u, habilitado: nuevoEstado ? 1 : 0 }
            : u
        )
      );

      setMensaje({
        tipo: 'success',
        texto: nuevoEstado
          ? `Token de invitacion habilitado para ${usuario.username}`
          : `Token de invitacion revocado a ${usuario.username}`
      });
      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message || 'Error al actualizar permiso' });
    } finally {
      setToggling(null);
    }
  };

  const tieneTokenActivo = (u) =>
    u.habilitado && u.token && !u.usado &&
    u.fecha_expiracion && new Date(u.fecha_expiracion) > new Date();

  return (
    <div className="atu-container">
      <div className="atu-header">
        <button className="atu-back-btn" onClick={() => navigate('/dashboard')}>
          Volver al Dashboard
        </button>
        <h1 className="atu-title">Permisos de Invitacion</h1>
        <p className="atu-subtitle">
          Habilita o revoca el token de invitacion de cada usuario.
          Los usuarios habilitados podran ver su link personal para invitar a un nuevo participante.
          El orden es por puntos acumulados.
        </p>
      </div>

      {mensaje.texto && (
        <div className={`atu-alert atu-alert-${mensaje.tipo}`}>
          <span>{mensaje.tipo === 'success' ? '✓' : '!'}</span>
          {mensaje.texto}
        </div>
      )}

      {loading ? (
        <div className="atu-loading">
          <div className="atu-spinner"></div>
          <p>Cargando usuarios...</p>
        </div>
      ) : usuarios.length === 0 ? (
        <div className="atu-empty">
          <p>No hay usuarios registrados en el sistema.</p>
        </div>
      ) : (
        <div className="atu-table-wrapper">
          <table className="atu-table">
            <thead>
              <tr>
                <th className="atu-th-rank">Pos.</th>
                <th className="atu-th-user">Usuario</th>
                <th className="atu-th-pts">Puntos</th>
                <th className="atu-th-estado">Estado Token</th>
                <th className="atu-th-toggle">Habilitar</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u, idx) => {
                const activo = tieneTokenActivo(u);
                const enProceso = toggling === u.id_usuario;

                return (
                  <tr
                    key={u.id_usuario}
                    className={`atu-row ${activo ? 'atu-row-activo' : ''}`}
                  >
                    {/* Posición */}
                    <td className="atu-td-rank">
                      <span className={`atu-rank ${idx < 3 ? `atu-rank-top${idx + 1}` : ''}`}>
                        {idx + 1}
                      </span>
                    </td>

                    {/* Usuario */}
                    <td className="atu-td-user">
                      <div className="atu-avatar">
                        {(u.nombre_completo || u.username).charAt(0).toUpperCase()}
                      </div>
                      <div className="atu-user-info">
                        <span className="atu-username">{u.username}</span>
                        {u.nombre_completo && u.nombre_completo !== u.username && (
                          <span className="atu-nombre">{u.nombre_completo}</span>
                        )}
                      </div>
                    </td>

                    {/* Puntos */}
                    <td className="atu-td-pts">
                      <span className="atu-pts-badge">
                        {parseFloat(u.total_puntos || 0).toLocaleString('es-CL', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        })} pts
                      </span>
                    </td>

                    {/* Estado token */}
                    <td className="atu-td-estado">
                      {!u.id_token ? (
                        <span className="atu-badge atu-badge-sin">Sin token</span>
                      ) : activo ? (
                        <span className="atu-badge atu-badge-activo">Activo</span>
                      ) : u.usado ? (
                        <span className="atu-badge atu-badge-usado">Usado</span>
                      ) : (
                        <span className="atu-badge atu-badge-revocado">Revocado</span>
                      )}
                    </td>

                    {/* Toggle */}
                    <td className="atu-td-toggle">
                      <label className="atu-toggle-label">
                        <input
                          type="checkbox"
                          className="atu-toggle-input"
                          checked={!!u.habilitado}
                          disabled={enProceso}
                          onChange={() => handleToggle(u)}
                        />
                        <span className={`atu-toggle-slider ${enProceso ? 'atu-toggle-loading' : ''}`}></span>
                      </label>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AsignacionTokensUsuarios;
