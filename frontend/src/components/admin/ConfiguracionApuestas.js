import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { configApuestasService, handleResponse } from '../../services/apiService';
import './ConfiguracionApuestas.css';

const ConfiguracionApuestas = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [config, setConfig] = useState({
    apuestas_habilitadas: false,
    torneo_activo_id: '',
    fecha_habilitada: ''
  });

  const [torneos, setTorneos] = useState([]);
  const [torneoSeleccionado, setTorneoSeleccionado] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError('');

      // Cargar configuración actual y torneos/fechas en paralelo
      const [configRes, torneosRes] = await Promise.all([
        configApuestasService.getConfig(),
        configApuestasService.getTorneosFechas()
      ]);

      const configData = await handleResponse(configRes);
      const torneosData = await handleResponse(torneosRes);

      setConfig({
        apuestas_habilitadas: configData.config.apuestas_habilitadas === 'true',
        torneo_activo_id: configData.config.torneo_activo_id || '',
        fecha_habilitada: configData.config.fecha_habilitada || ''
      });

      setTorneos(torneosData.torneos || []);

      // Si hay un torneo seleccionado, encontrarlo en la lista
      if (configData.config.torneo_activo_id) {
        const torneo = torneosData.torneos.find(
          t => t.ID_TORNEO.toString() === configData.config.torneo_activo_id
        );
        setTorneoSeleccionado(torneo || null);
      }

    } catch (err) {
      console.error('Error cargando datos:', err);
      setError(err.message || 'Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleTorneoChange = (torneoId) => {
    const torneo = torneos.find(t => t.ID_TORNEO.toString() === torneoId);
    setTorneoSeleccionado(torneo || null);

    setConfig(prev => ({
      ...prev,
      torneo_activo_id: torneoId,
      fecha_habilitada: '' // Resetear fecha al cambiar torneo
    }));
  };

  const handleGuardar = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const response = await configApuestasService.updateConfig(config);
      const data = await handleResponse(response);

      setSuccess(data.message || 'Configuración guardada exitosamente');

      // Recargar datos después de 1 segundo
      setTimeout(() => {
        setSuccess('');
        cargarDatos();
      }, 1500);

    } catch (err) {
      console.error('Error guardando configuración:', err);
      setError(err.message || 'Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="config-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="config-container">
      <div className="config-header">
        <h1>⚙️ Configuración de Apuestas</h1>
        <p className="subtitle">Gestiona el estado y disponibilidad de apuestas</p>
      </div>

      {error && (
        <div className="alert alert-error">
          ❌ {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          ✅ {success}
        </div>
      )}

      <div className="config-card">
        <h2>Estado de Apuestas</h2>

        {/* Toggle Habilitar/Deshabilitar */}
        <div className="config-section">
          <div className="toggle-container">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={config.apuestas_habilitadas}
                onChange={(e) => setConfig({ ...config, apuestas_habilitadas: e.target.checked })}
                className="toggle-checkbox"
              />
              <span className="toggle-slider"></span>
              <span className="toggle-text">
                {config.apuestas_habilitadas ? '✅ Apuestas HABILITADAS' : '❌ Apuestas DESHABILITADAS'}
              </span>
            </label>
          </div>

          <p className="info-text">
            {config.apuestas_habilitadas
              ? 'Los usuarios pueden realizar apuestas en los partidos configurados'
              : 'Las apuestas están cerradas. Los usuarios pueden ver los pronósticos de todos.'}
          </p>
        </div>

        <hr className="divider" />

        <h2>Torneo y Fecha para Apuestas</h2>

        {/* Selección de Torneo */}
        <div className="config-section">
          <div className="form-group">
            <label htmlFor="torneo" className="form-label">
              Torneo Activo
            </label>
            <select
              id="torneo"
              value={config.torneo_activo_id}
              onChange={(e) => handleTorneoChange(e.target.value)}
              className="form-select"
            >
              <option value="">-- Seleccione un torneo --</option>
              {torneos.map(torneo => (
                <option key={torneo.ID_TORNEO} value={torneo.ID_TORNEO}>
                  {torneo.NOMBRE} {torneo.TEMPORADA} - {torneo.RUEDA}
                </option>
              ))}
            </select>
          </div>

          {/* Selección de Fecha */}
          {torneoSeleccionado && torneoSeleccionado.fechas && torneoSeleccionado.fechas.length > 0 && (
            <div className="form-group">
              <label htmlFor="fecha" className="form-label">
                Fecha/Jornada Habilitada
              </label>
              <select
                id="fecha"
                value={config.fecha_habilitada}
                onChange={(e) => setConfig({ ...config, fecha_habilitada: e.target.value })}
                className="form-select"
              >
                <option value="">-- Todas las fechas --</option>
                {torneoSeleccionado.fechas.map(fecha => (
                  <option key={fecha} value={fecha}>
                    Fecha {fecha}
                  </option>
                ))}
              </select>
            </div>
          )}

          {config.torneo_activo_id && config.fecha_habilitada && (
            <div className="alert alert-info">
              ℹ️ Solo los partidos de la <strong>Fecha {config.fecha_habilitada}</strong> del torneo{' '}
              <strong>{torneoSeleccionado?.NOMBRE}</strong> estarán disponibles para apostar.
            </div>
          )}
        </div>

        {/* Resumen de Configuración */}
        <div className="config-summary">
          <h3>Resumen de Configuración</h3>
          <ul>
            <li>
              <strong>Estado:</strong>{' '}
              <span className={config.apuestas_habilitadas ? 'status-enabled' : 'status-disabled'}>
                {config.apuestas_habilitadas ? 'HABILITADAS' : 'DESHABILITADAS'}
              </span>
            </li>
            <li>
              <strong>Torneo:</strong>{' '}
              {config.torneo_activo_id
                ? `${torneoSeleccionado?.NOMBRE} ${torneoSeleccionado?.TEMPORADA}`
                : 'No configurado'}
            </li>
            <li>
              <strong>Fecha:</strong>{' '}
              {config.fecha_habilitada ? `Fecha ${config.fecha_habilitada}` : 'Todas las fechas'}
            </li>
          </ul>
        </div>

        {/* Botones de acción */}
        <div className="config-actions">
          <button
            onClick={handleGuardar}
            className="btn-primary"
            disabled={saving}
          >
            {saving ? 'Guardando...' : 'Guardar Configuración'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfiguracionApuestas;
