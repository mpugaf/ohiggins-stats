import React, { useState, useEffect } from 'react';
import { apuestasService, handleResponse } from '../../services/apiService';
import TeamLogo from '../common/TeamLogo';
import './MisApuestas.css';

function MisApuestas({ filtroInicial = '' }) {
  const [apuestas, setApuestas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState(filtroInicial);
  const [filtroTorneo, setFiltroTorneo] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('');

  // Opciones de filtros
  const [torneos, setTorneos] = useState([]);
  const [fechasPorTorneo, setFechasPorTorneo] = useState({});
  const [fechasDisponibles, setFechasDisponibles] = useState([]);

  useEffect(() => {
    fetchTorneosYFechas();
  }, []);

  useEffect(() => {
    fetchApuestas();
  }, [filtroEstado, filtroTorneo, filtroFecha]);

  // Actualizar fechas disponibles cuando cambia el torneo seleccionado
  useEffect(() => {
    if (filtroTorneo && fechasPorTorneo[filtroTorneo]) {
      setFechasDisponibles(fechasPorTorneo[filtroTorneo]);
    } else {
      setFechasDisponibles([]);
    }
    // Reset fecha cuando cambia el torneo
    setFiltroFecha('');
  }, [filtroTorneo, fechasPorTorneo]);

  const fetchTorneosYFechas = async () => {
    try {
      const response = await apuestasService.getTorneosYFechas();
      const data = await handleResponse(response);

      setTorneos(data.torneos || []);
      setFechasPorTorneo(data.fechasPorTorneo || {});
    } catch (err) {
      console.error('Error al cargar torneos y fechas:', err);
    }
  };

  const fetchApuestas = async () => {
    try {
      setLoading(true);
      setError('');

      // Construir parámetros de filtro
      const params = {};
      if (filtroEstado) params.estado = filtroEstado;
      if (filtroTorneo) params.torneo = filtroTorneo;
      if (filtroFecha) params.fecha = filtroFecha;

      const response = await apuestasService.getMisApuestas(params);
      const data = await handleResponse(response);

      setApuestas(data.apuestas || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const limpiarFiltros = () => {
    setFiltroEstado('');
    setFiltroTorneo('');
    setFiltroFecha('');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEstadoBadge = (estado) => {
    const badges = {
      'pendiente': { label: 'Pendiente', class: 'badge-warning' },
      'ganada': { label: 'Ganada', class: 'badge-success' },
      'perdida': { label: 'Perdida', class: 'badge-danger' },
      'cancelada': { label: 'Cancelada', class: 'badge-secondary' }
    };

    const badge = badges[estado] || { label: estado, class: 'badge-secondary' };

    return (
      <span className={`badge ${badge.class}`}>
        {badge.label}
      </span>
    );
  };

  const getTipoApuestaBadge = (tipo, equipoPredicho) => {
    const tipos = {
      'local': { label: equipoPredicho || 'Local', icon: '🏠' },
      'empate': { label: 'Empate', icon: '🤝' },
      'visita': { label: equipoPredicho || 'Visita', icon: '✈️' }
    };

    const tipoData = tipos[tipo] || { label: tipo, icon: '❓' };

    return (
      <span className="tipo-apuesta">
        <span className="tipo-icon">{tipoData.icon}</span>
        <span className="tipo-label">{tipoData.label}</span>
      </span>
    );
  };

  if (loading) {
    return (
      <div className="apuestas-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="apuestas-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="apuestas-container">
      <div className="apuestas-header">
        <h2 className="apuestas-title">Mis Apuestas</h2>

        <div className="filters-container">
          <div className="filter-group">
            <label htmlFor="filtroEstado">Estado:</label>
            <select
              id="filtroEstado"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="filter-select"
            >
              <option value="">Todas</option>
              <option value="pendiente">Pendientes</option>
              <option value="ganada">Ganadas</option>
              <option value="perdida">Perdidas</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="filtroTorneo">Torneo:</label>
            <select
              id="filtroTorneo"
              value={filtroTorneo}
              onChange={(e) => setFiltroTorneo(e.target.value)}
              className="filter-select"
            >
              <option value="">Todos los torneos</option>
              {torneos.map((torneo) => (
                <option key={torneo.ID_TORNEO} value={torneo.ID_TORNEO}>
                  {torneo.NOMBRE} ({torneo.TEMPORADA})
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="filtroFecha">Fecha:</label>
            <select
              id="filtroFecha"
              value={filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value)}
              className="filter-select"
              disabled={!filtroTorneo || fechasDisponibles.length === 0}
            >
              <option value="">Todas las fechas</option>
              {fechasDisponibles.map((fecha) => (
                <option key={fecha} value={fecha}>
                  Fecha {fecha}
                </option>
              ))}
            </select>
          </div>

          {(filtroEstado || filtroTorneo || filtroFecha) && (
            <button
              className="btn-limpiar-filtros"
              onClick={limpiarFiltros}
              title="Limpiar todos los filtros"
            >
              🔄 Limpiar
            </button>
          )}
        </div>

        {(filtroEstado || filtroTorneo || filtroFecha) && (
          <div className="filtros-activos">
            <span className="filtros-label">Filtros activos:</span>
            {filtroEstado && <span className="filtro-badge">Estado: {filtroEstado}</span>}
            {filtroTorneo && (
              <span className="filtro-badge">
                Torneo: {torneos.find(t => t.ID_TORNEO === parseInt(filtroTorneo))?.NOMBRE}
              </span>
            )}
            {filtroFecha && <span className="filtro-badge">Fecha: {filtroFecha}</span>}
          </div>
        )}
      </div>

      {apuestas.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎲</div>
          <p>
            No se encontraron apuestas
            {filtroEstado && ` ${filtroEstado}s`}
            {filtroTorneo && ` en el torneo seleccionado`}
            {filtroFecha && ` para la fecha ${filtroFecha}`}
          </p>
          <p className="empty-hint">
            {(filtroEstado || filtroTorneo || filtroFecha)
              ? 'Intenta ajustar los filtros para ver más resultados'
              : '¡Comienza a apostar en partidos disponibles!'}
          </p>
        </div>
      ) : (
        <div className="apuestas-list">
          {apuestas.map((apuesta) => (
            <div key={apuesta.id_apuesta} className="apuesta-card">
              <div className="apuesta-header-card">
                <div className="partido-info">
                  <div className="equipos">
                    <div className="equipo-con-logo">
                      <TeamLogo imagen={apuesta.imagen_local} nombreEquipo={apuesta.equipo_local} size="small" />
                      <span className="equipo">{apuesta.equipo_local}</span>
                    </div>
                    <span className="vs">vs</span>
                    <div className="equipo-con-logo">
                      <span className="equipo">{apuesta.equipo_visita}</span>
                      <TeamLogo imagen={apuesta.imagen_visita} nombreEquipo={apuesta.equipo_visita} size="small" />
                    </div>
                  </div>
                  <div className="partido-meta">
                    <span className="torneo">{apuesta.nombre_torneo}</span>
                    <span className="fecha">{formatDate(apuesta.FECHA_PARTIDO)}</span>
                  </div>
                </div>
                <div className="estado-badge">
                  {getEstadoBadge(apuesta.estado)}
                </div>
              </div>

              <div className="apuesta-body">
                <div className="apuesta-detail">
                  <span className="detail-label">Tu predicción:</span>
                  {getTipoApuestaBadge(apuesta.tipo_apuesta, apuesta.equipo_predicho)}
                </div>

                <div className="apuesta-detail">
                  <span className="detail-label">Monto apostado:</span>
                  <span className="detail-value">${parseFloat(apuesta.monto_apuesta).toFixed(2)}</span>
                </div>

                <div className="apuesta-detail">
                  <span className="detail-label">Cuota:</span>
                  <span className="detail-value cuota-value">{parseFloat(apuesta.valor_cuota).toFixed(2)}x</span>
                </div>

                <div className="apuesta-detail">
                  <span className="detail-label">Retorno potencial:</span>
                  <span className="detail-value retorno-value">${parseFloat(apuesta.retorno_potencial).toFixed(2)}</span>
                </div>

                {apuesta.estado === 'ganada' && (
                  <div className="apuesta-detail apuesta-ganada-highlight">
                    <span className="detail-label">Puntos ganados:</span>
                    <span className="detail-value puntos-value">+${parseFloat(apuesta.puntos_ganados).toFixed(2)}</span>
                  </div>
                )}

                {apuesta.estado === 'perdida' && (
                  <div className="apuesta-detail apuesta-perdida-highlight">
                    <span className="detail-label">Puntos ganados:</span>
                    <span className="detail-value puntos-perdida-value">$0.00</span>
                  </div>
                )}

                {apuesta.GOLES_LOCAL !== null && apuesta.GOLES_VISITA !== null && (
                  <div className="resultado-partido">
                    <span className="resultado-label">Resultado:</span>
                    <span className="resultado-value">
                      {apuesta.equipo_local} {apuesta.GOLES_LOCAL} - {apuesta.GOLES_VISITA} {apuesta.equipo_visita}
                    </span>
                  </div>
                )}
              </div>

              <div className="apuesta-footer">
                <span className="fecha-apuesta">Apostado el {formatDate(apuesta.fecha_apuesta)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MisApuestas;
