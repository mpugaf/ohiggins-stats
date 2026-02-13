import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { configApuestasService, cuotasService, handleResponse } from '../../services/apiService';
import TeamLogo from '../common/TeamLogo';
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
  const [partidos, setPartidos] = useState([]);
  const [loadingPartidos, setLoadingPartidos] = useState(false);

  // Modal de cuotas
  const [showCuotasModal, setShowCuotasModal] = useState(false);
  const [partidoSeleccionado, setPartidoSeleccionado] = useState(null);
  const [cuotasEdicion, setCuotasEdicion] = useState({
    local: '',
    empate: '',
    visita: ''
  });
  const [savingCuotas, setSavingCuotas] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    // Cargar partidos cuando se selecciona torneo/fecha
    if (config.torneo_activo_id) {
      cargarPartidos();
    } else {
      setPartidos([]);
    }
  }, [config.torneo_activo_id, config.fecha_habilitada]);

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

  const cargarPartidos = async () => {
    try {
      setLoadingPartidos(true);
      const response = await configApuestasService.getPartidosPorTorneoFecha(
        config.torneo_activo_id,
        config.fecha_habilitada
      );
      const data = await handleResponse(response);
      setPartidos(data.partidos || []);
    } catch (err) {
      console.error('Error cargando partidos:', err);
      setError(err.message || 'Error al cargar partidos');
    } finally {
      setLoadingPartidos(false);
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

  const abrirModalCuotas = (partido) => {
    setPartidoSeleccionado(partido);

    // Pre-cargar cuotas existentes
    const cuotaLocal = partido.cuotas.find(c => c.tipo_resultado === 'local');
    const cuotaEmpate = partido.cuotas.find(c => c.tipo_resultado === 'empate');
    const cuotaVisita = partido.cuotas.find(c => c.tipo_resultado === 'visita');

    setCuotasEdicion({
      local: cuotaLocal ? cuotaLocal.cuota_decimal : '',
      empate: cuotaEmpate ? cuotaEmpate.cuota_decimal : '',
      visita: cuotaVisita ? cuotaVisita.cuota_decimal : ''
    });

    setShowCuotasModal(true);
  };

  const cerrarModalCuotas = () => {
    setShowCuotasModal(false);
    setPartidoSeleccionado(null);
    setCuotasEdicion({ local: '', empate: '', visita: '' });
  };

  const guardarCuotas = async () => {
    try {
      setSavingCuotas(true);
      setError('');

      // Validar que todas las cuotas estén completadas
      if (!cuotasEdicion.local || !cuotasEdicion.empate || !cuotasEdicion.visita) {
        setError('Debes completar todas las cuotas');
        return;
      }

      // Validar que las cuotas sean números positivos
      const local = parseFloat(cuotasEdicion.local);
      const empate = parseFloat(cuotasEdicion.empate);
      const visita = parseFloat(cuotasEdicion.visita);

      if (isNaN(local) || isNaN(empate) || isNaN(visita) || local <= 0 || empate <= 0 || visita <= 0) {
        setError('Las cuotas deben ser números positivos');
        return;
      }

      // Crear/actualizar cuotas usando upsert
      const cuotasData = {
        cuotas: [
          {
            tipo_resultado: 'local',
            id_equipo: partidoSeleccionado.id_equipo_local,
            cuota_decimal: local
          },
          {
            tipo_resultado: 'empate',
            id_equipo: null,
            cuota_decimal: empate
          },
          {
            tipo_resultado: 'visita',
            id_equipo: partidoSeleccionado.id_equipo_visita,
            cuota_decimal: visita
          }
        ]
      };

      const response = await cuotasService.upsertCuotas(partidoSeleccionado.ID_PARTIDO, cuotasData);
      await handleResponse(response);

      setSuccess('Cuotas guardadas exitosamente');
      cerrarModalCuotas();

      // Recargar partidos
      await cargarPartidos();

      setTimeout(() => setSuccess(''), 2000);

    } catch (err) {
      console.error('Error guardando cuotas:', err);
      setError(err.message || 'Error al guardar cuotas');
    } finally {
      setSavingCuotas(false);
    }
  };

  const formatFecha = (fechaStr) => {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFechaCorta = (fechaStr) => {
    const fecha = new Date(fechaStr);
    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const hora = fecha.getHours().toString().padStart(2, '0');
    const min = fecha.getMinutes().toString().padStart(2, '0');
    return `${dia}/${mes} ${hora}:${min}`;
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

      {/* Tabla de Partidos */}
      {config.torneo_activo_id && (
        <div className="partidos-config-section">
          <h2>📅 Partidos Disponibles</h2>
          <p className="subtitle">
            Click en un partido para configurar las cuotas de apuestas
          </p>

          {loadingPartidos ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Cargando partidos...</p>
            </div>
          ) : partidos.length === 0 ? (
            <div className="empty-state">
              <p>No hay partidos programados para este torneo/fecha</p>
            </div>
          ) : (
            <div className="partidos-table-container">
              <table className="partidos-table-compact">
                <thead>
                  <tr>
                    <th>Fecha/Hora</th>
                    <th>Partido</th>
                    <th>Cuotas</th>
                    <th>Estado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {partidos.map((partido) => {
                    const cuotaLocal = partido.cuotas.find(c => c.tipo_resultado === 'local');
                    const cuotaEmpate = partido.cuotas.find(c => c.tipo_resultado === 'empate');
                    const cuotaVisita = partido.cuotas.find(c => c.tipo_resultado === 'visita');

                    // Determinar clase según estado y cuotas
                    let rowClass = '';
                    if (partido.ESTADO_PARTIDO === 'FINALIZADO') {
                      rowClass = 'partido-finalizado';
                    } else if (partido.tiene_cuotas) {
                      rowClass = 'partido-con-cuotas';
                    } else {
                      rowClass = 'partido-sin-cuotas';
                    }

                    return (
                      <tr
                        key={partido.ID_PARTIDO}
                        className={rowClass}
                      >
                        <td className="fecha-cell-compact">
                          <div className="fecha-text">{formatFechaCorta(partido.FECHA_PARTIDO)}</div>
                          {partido.NUMERO_JORNADA && (
                            <div className="jornada-text">J{partido.NUMERO_JORNADA}</div>
                          )}
                        </td>
                        <td className="partido-cell-compact">
                          <div className="partido-row">
                            <div className="equipo-compact">
                              <TeamLogo
                                imagen={partido.imagen_local}
                                nombreEquipo={partido.equipo_local}
                                size="small"
                              />
                              <span className="equipo-nombre-compact">{partido.equipo_local}</span>
                            </div>
                            <span className="vs-compact">vs</span>
                            <div className="equipo-compact">
                              <TeamLogo
                                imagen={partido.imagen_visita}
                                nombreEquipo={partido.equipo_visita}
                                size="small"
                              />
                              <span className="equipo-nombre-compact">{partido.equipo_visita}</span>
                            </div>
                          </div>
                        </td>
                        <td className="cuotas-cell-compact">
                          {partido.tiene_cuotas ? (
                            <div className="cuotas-row">
                              <span className="cuota-item">
                                L: {cuotaLocal ? parseFloat(cuotaLocal.cuota_decimal).toFixed(2) : '-'}
                              </span>
                              <span className="cuota-item">
                                E: {cuotaEmpate ? parseFloat(cuotaEmpate.cuota_decimal).toFixed(2) : '-'}
                              </span>
                              <span className="cuota-item">
                                V: {cuotaVisita ? parseFloat(cuotaVisita.cuota_decimal).toFixed(2) : '-'}
                              </span>
                            </div>
                          ) : (
                            <span className="sin-cuotas-text">Sin cuotas</span>
                          )}
                        </td>
                        <td className="estado-cell-compact">
                          {partido.ESTADO_PARTIDO === 'FINALIZADO' ? (
                            <span className="badge-compact badge-finalizado">
                              {partido.GOLES_LOCAL}-{partido.GOLES_VISITA}
                            </span>
                          ) : partido.ESTADO_PARTIDO === 'EN_CURSO' ? (
                            <span className="badge-compact badge-en-curso">En vivo</span>
                          ) : (
                            <span className="badge-compact badge-programado">Prog.</span>
                          )}
                        </td>
                        <td className="actions-cell-compact">
                          <button
                            className="btn-editar-compact"
                            onClick={() => abrirModalCuotas(partido)}
                            title={partido.tiene_cuotas ? 'Editar cuotas' : 'Crear cuotas'}
                          >
                            {partido.tiene_cuotas ? '✏️' : '➕'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal de Edición de Cuotas */}
      {showCuotasModal && partidoSeleccionado && (
        <div className="modal-overlay" onClick={cerrarModalCuotas}>
          <div className="modal-cuotas" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🎯 Configurar Cuotas</h3>
              <button className="btn-close-modal" onClick={cerrarModalCuotas}>✖</button>
            </div>

            <div className="modal-body">
              <div className="partido-info-modal">
                <div className="equipo-modal">
                  <TeamLogo
                    imagen={partidoSeleccionado.imagen_local}
                    nombreEquipo={partidoSeleccionado.equipo_local}
                    size="medium"
                  />
                  <span className="equipo-nombre">{partidoSeleccionado.equipo_local}</span>
                </div>
                <span className="vs-modal">VS</span>
                <div className="equipo-modal">
                  <TeamLogo
                    imagen={partidoSeleccionado.imagen_visita}
                    nombreEquipo={partidoSeleccionado.equipo_visita}
                    size="medium"
                  />
                  <span className="equipo-nombre">{partidoSeleccionado.equipo_visita}</span>
                </div>
              </div>

              <p className="fecha-modal">{formatFecha(partidoSeleccionado.FECHA_PARTIDO)}</p>

              <div className="cuotas-form">
                <div className="form-group-cuota">
                  <label htmlFor="cuota-local">
                    Cuota Local ({partidoSeleccionado.equipo_local})
                  </label>
                  <input
                    type="number"
                    id="cuota-local"
                    step="0.01"
                    min="1"
                    value={cuotasEdicion.local}
                    onChange={(e) => setCuotasEdicion({ ...cuotasEdicion, local: e.target.value })}
                    placeholder="Ej: 2.50"
                    className="input-cuota"
                  />
                </div>

                <div className="form-group-cuota">
                  <label htmlFor="cuota-empate">
                    Cuota Empate
                  </label>
                  <input
                    type="number"
                    id="cuota-empate"
                    step="0.01"
                    min="1"
                    value={cuotasEdicion.empate}
                    onChange={(e) => setCuotasEdicion({ ...cuotasEdicion, empate: e.target.value })}
                    placeholder="Ej: 3.00"
                    className="input-cuota"
                  />
                </div>

                <div className="form-group-cuota">
                  <label htmlFor="cuota-visita">
                    Cuota Visita ({partidoSeleccionado.equipo_visita})
                  </label>
                  <input
                    type="number"
                    id="cuota-visita"
                    step="0.01"
                    min="1"
                    value={cuotasEdicion.visita}
                    onChange={(e) => setCuotasEdicion({ ...cuotasEdicion, visita: e.target.value })}
                    placeholder="Ej: 3.50"
                    className="input-cuota"
                  />
                </div>
              </div>

              <p className="info-cuotas">
                💡 Las cuotas representan el multiplicador de ganancia. Ejemplo: Una cuota de 2.50x significa que si apuestas $10,000 y aciertas, ganarás $25,000.
              </p>
            </div>

            <div className="modal-footer">
              <button
                className="btn-modal-cancelar"
                onClick={cerrarModalCuotas}
                disabled={savingCuotas}
              >
                Cancelar
              </button>
              <button
                className="btn-modal-guardar"
                onClick={guardarCuotas}
                disabled={savingCuotas}
              >
                {savingCuotas ? 'Guardando...' : 'Guardar Cuotas'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfiguracionApuestas;
