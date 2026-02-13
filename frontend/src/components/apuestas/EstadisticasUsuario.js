import React, { useState, useEffect } from 'react';
import { apuestasService, handleResponse } from '../../services/apiService';
import './EstadisticasUsuario.css';

function EstadisticasUsuario() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEstadisticas();
  }, []);

  const fetchEstadisticas = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await apuestasService.getEstadisticas();
      const data = await handleResponse(response);

      setStats(data.estadisticas);
    } catch (err) {
      console.error('Error al obtener estadísticas:', err);
      setError(err.message || 'Error al cargar estadísticas');

      // Establecer estadísticas vacías en caso de error
      setStats({
        total_apuestas: 0,
        apuestas_ganadas: 0,
        apuestas_perdidas: 0,
        apuestas_pendientes: 0,
        total_puntos: 0,
        porcentaje_aciertos: 0
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="stats-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="stats-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="stats-container">
      <h3 className="stats-title">Mis Estadísticas</h3>

      <div className="stats-compact">
        <div className="stat-item">
          <div className="stat-label">Total</div>
          <div className="stat-value">{stats.total_apuestas || 0}</div>
        </div>

        <div className="stat-item stat-success">
          <div className="stat-label">Ganadas</div>
          <div className="stat-value">{stats.apuestas_ganadas || 0}</div>
        </div>

        <div className="stat-item stat-danger">
          <div className="stat-label">Perdidas</div>
          <div className="stat-value">{stats.apuestas_perdidas || 0}</div>
        </div>

        <div className="stat-item stat-warning">
          <div className="stat-label">Pendientes</div>
          <div className="stat-value">{stats.apuestas_pendientes || 0}</div>
        </div>

        <div className="stat-item stat-points">
          <div className="stat-label">Puntos</div>
          <div className="stat-value">${parseFloat(stats.total_puntos || 0).toLocaleString('es-CL')}</div>
        </div>

        <div className="stat-item stat-percentage">
          <div className="stat-label">Aciertos</div>
          <div className="stat-value">{parseFloat(stats.porcentaje_aciertos || 0).toFixed(1)}%</div>
        </div>
      </div>
    </div>
  );
}

export default EstadisticasUsuario;
