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
      <h2 className="stats-title">Mis Estadísticas</h2>

      <div className="stats-grid">
        <div className="stat-card stat-primary">
          <div className="stat-icon">🎲</div>
          <div className="stat-content">
            <div className="stat-value">{stats.total_apuestas || 0}</div>
            <div className="stat-label">Apuestas Totales</div>
          </div>
        </div>

        <div className="stat-card stat-success">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{stats.apuestas_ganadas || 0}</div>
            <div className="stat-label">Apuestas Ganadas</div>
          </div>
        </div>

        <div className="stat-card stat-danger">
          <div className="stat-icon">❌</div>
          <div className="stat-content">
            <div className="stat-value">{stats.apuestas_perdidas || 0}</div>
            <div className="stat-label">Apuestas Perdidas</div>
          </div>
        </div>

        <div className="stat-card stat-warning">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <div className="stat-value">{stats.apuestas_pendientes || 0}</div>
            <div className="stat-label">Apuestas Pendientes</div>
          </div>
        </div>

        <div className="stat-card stat-points">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-value">{parseFloat(stats.total_puntos || 0).toFixed(2)}</div>
            <div className="stat-label">Puntos Totales</div>
          </div>
        </div>

        <div className="stat-card stat-percentage">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">{parseFloat(stats.porcentaje_aciertos || 0).toFixed(1)}%</div>
            <div className="stat-label">Porcentaje de Aciertos</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EstadisticasUsuario;
