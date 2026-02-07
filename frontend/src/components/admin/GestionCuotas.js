import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import './GestionCuotas.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://192.168.100.16:3000';

function GestionCuotas() {
  const { token } = useAuth();
  const [partidos, setPartidos] = useState([]);
  const [partidoSeleccionado, setPartidoSeleccionado] = useState(null);
  const [cuotas, setCuotas] = useState({
    local: '',
    empate: '',
    visita: ''
  });
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    fetchPartidos();
  }, []);

  const fetchPartidos = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/partidos`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al obtener partidos');
      }

      const data = await response.json();
      // Filtrar solo partidos programados
      const partidosProgramados = data.partidos?.filter(
        p => p.ESTADO_PARTIDO === 'PROGRAMADO'
      ) || [];
      setPartidos(partidosProgramados);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSeleccionarPartido = async (partido) => {
    setPartidoSeleccionado(partido);
    setMensaje('');
    setError('');

    // Intentar cargar cuotas existentes
    try {
      const response = await fetch(`${API_BASE_URL}/api/cuotas/partido/${partido.ID_PARTIDO}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const cuotasExistentes = data.cuotas || [];

        const nuevasCuotas = {
          local: '',
          empate: '',
          visita: ''
        };

        cuotasExistentes.forEach(c => {
          nuevasCuotas[c.tipo_resultado] = c.cuota_decimal;
        });

        setCuotas(nuevasCuotas);
      } else {
        // No hay cuotas, iniciar en blanco
        setCuotas({ local: '', empate: '', visita: '' });
      }
    } catch (err) {
      console.error('Error al cargar cuotas:', err);
      setCuotas({ local: '', empate: '', visita: '' });
    }
  };

  const handleChangeCuota = (tipo, valor) => {
    setCuotas(prev => ({
      ...prev,
      [tipo]: valor
    }));
  };

  const handleGuardarCuotas = async () => {
    if (!partidoSeleccionado) {
      setError('Debes seleccionar un partido');
      return;
    }

    // Validar que todas las cuotas estén completas
    if (!cuotas.local || !cuotas.empate || !cuotas.visita) {
      setError('Debes ingresar las 3 cuotas (local, empate, visita)');
      return;
    }

    // Validar que las cuotas sean números válidos mayores a 1
    const cuotaLocal = parseFloat(cuotas.local);
    const cuotaEmpate = parseFloat(cuotas.empate);
    const cuotaVisita = parseFloat(cuotas.visita);

    if (isNaN(cuotaLocal) || isNaN(cuotaEmpate) || isNaN(cuotaVisita)) {
      setError('Las cuotas deben ser números válidos');
      return;
    }

    if (cuotaLocal < 1 || cuotaEmpate < 1 || cuotaVisita < 1) {
      setError('Las cuotas deben ser mayores o iguales a 1.00');
      return;
    }

    setGuardando(true);
    setError('');
    setMensaje('');

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/cuotas/partido/${partidoSeleccionado.ID_PARTIDO}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            cuotas: [
              {
                tipo_resultado: 'local',
                id_equipo: partidoSeleccionado.ID_EQUIPO_LOCAL,
                cuota_decimal: cuotaLocal
              },
              {
                tipo_resultado: 'empate',
                id_equipo: null,
                cuota_decimal: cuotaEmpate
              },
              {
                tipo_resultado: 'visita',
                id_equipo: partidoSeleccionado.ID_EQUIPO_VISITA,
                cuota_decimal: cuotaVisita
              }
            ]
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al guardar cuotas');
      }

      setMensaje('✅ Cuotas guardadas exitosamente');
      // Limpiar selección después de 2 segundos
      setTimeout(() => {
        setPartidoSeleccionado(null);
        setCuotas({ local: '', empate: '', visita: '' });
        setMensaje('');
      }, 2000);

    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="gestion-cuotas-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="gestion-cuotas-container">
      <h1 className="page-title">Gestión de Cuotas</h1>
      <p className="page-subtitle">Administra las cuotas de apuestas para partidos programados</p>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {mensaje && (
        <div className="alert alert-success">
          {mensaje}
        </div>
      )}

      <div className="gestion-layout">
        {/* Lista de partidos */}
        <div className="partidos-panel">
          <h2 className="panel-title">Partidos Programados</h2>

          {partidos.length === 0 ? (
            <div className="empty-state">
              <p>No hay partidos programados</p>
            </div>
          ) : (
            <div className="partidos-list-admin">
              {partidos.map(partido => (
                <div
                  key={partido.ID_PARTIDO}
                  className={`partido-item ${partidoSeleccionado?.ID_PARTIDO === partido.ID_PARTIDO ? 'selected' : ''}`}
                  onClick={() => handleSeleccionarPartido(partido)}
                >
                  <div className="partido-equipos-admin">
                    <span className="equipo">{partido.EQUIPO_LOCAL}</span>
                    <span className="vs">vs</span>
                    <span className="equipo">{partido.EQUIPO_VISITA}</span>
                  </div>
                  <div className="partido-meta-admin">
                    <span className="torneo">{partido.TORNEO}</span>
                    <span className="fecha">{formatDate(partido.FECHA_PARTIDO)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panel de edición de cuotas */}
        <div className="cuotas-panel">
          <h2 className="panel-title">Configurar Cuotas</h2>

          {!partidoSeleccionado ? (
            <div className="empty-state">
              <p>👈 Selecciona un partido de la lista</p>
            </div>
          ) : (
            <div className="cuotas-form">
              <div className="partido-seleccionado">
                <h3>{partidoSeleccionado.EQUIPO_LOCAL} vs {partidoSeleccionado.EQUIPO_VISITA}</h3>
                <p>{partidoSeleccionado.TORNEO} - {formatDate(partidoSeleccionado.FECHA_PARTIDO)}</p>
              </div>

              <div className="cuotas-inputs">
                <div className="cuota-input-group">
                  <label htmlFor="cuotaLocal">
                    <span className="label-icon">🏠</span>
                    <span className="label-text">Cuota Local</span>
                    <span className="label-equipo">{partidoSeleccionado.EQUIPO_LOCAL}</span>
                  </label>
                  <input
                    type="number"
                    id="cuotaLocal"
                    value={cuotas.local}
                    onChange={(e) => handleChangeCuota('local', e.target.value)}
                    placeholder="Ej: 2.50"
                    step="0.01"
                    min="1.00"
                    className="cuota-input"
                  />
                </div>

                <div className="cuota-input-group">
                  <label htmlFor="cuotaEmpate">
                    <span className="label-icon">🤝</span>
                    <span className="label-text">Cuota Empate</span>
                    <span className="label-equipo">-</span>
                  </label>
                  <input
                    type="number"
                    id="cuotaEmpate"
                    value={cuotas.empate}
                    onChange={(e) => handleChangeCuota('empate', e.target.value)}
                    placeholder="Ej: 3.50"
                    step="0.01"
                    min="1.00"
                    className="cuota-input"
                  />
                </div>

                <div className="cuota-input-group">
                  <label htmlFor="cuotaVisita">
                    <span className="label-icon">✈️</span>
                    <span className="label-text">Cuota Visita</span>
                    <span className="label-equipo">{partidoSeleccionado.EQUIPO_VISITA}</span>
                  </label>
                  <input
                    type="number"
                    id="cuotaVisita"
                    value={cuotas.visita}
                    onChange={(e) => handleChangeCuota('visita', e.target.value)}
                    placeholder="Ej: 3.00"
                    step="0.01"
                    min="1.00"
                    className="cuota-input"
                  />
                </div>
              </div>

              {cuotas.local && cuotas.empate && cuotas.visita && (
                <div className="cuotas-preview">
                  <h4>Vista Previa:</h4>
                  <div className="preview-grid">
                    <div className="preview-item preview-local">
                      <div className="preview-tipo">🏠 Local</div>
                      <div className="preview-cuota">{parseFloat(cuotas.local).toFixed(2)}x</div>
                    </div>
                    <div className="preview-item preview-empate">
                      <div className="preview-tipo">🤝 Empate</div>
                      <div className="preview-cuota">{parseFloat(cuotas.empate).toFixed(2)}x</div>
                    </div>
                    <div className="preview-item preview-visita">
                      <div className="preview-tipo">✈️ Visita</div>
                      <div className="preview-cuota">{parseFloat(cuotas.visita).toFixed(2)}x</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="form-actions">
                <button
                  className="btn-cancelar"
                  onClick={() => {
                    setPartidoSeleccionado(null);
                    setCuotas({ local: '', empate: '', visita: '' });
                    setError('');
                    setMensaje('');
                  }}
                  disabled={guardando}
                >
                  Cancelar
                </button>
                <button
                  className="btn-guardar"
                  onClick={handleGuardarCuotas}
                  disabled={guardando || !cuotas.local || !cuotas.empate || !cuotas.visita}
                >
                  {guardando ? 'Guardando...' : 'Guardar Cuotas'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GestionCuotas;
