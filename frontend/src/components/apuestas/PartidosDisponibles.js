import React, { useState, useEffect } from 'react';
import { cuotasService, apuestasService, configApuestasService, handleResponse } from '../../services/apiService';
import TeamLogo from '../common/TeamLogo';
import './PartidosDisponibles.css';

function PartidosDisponibles({ onApuestaCreada }) {
  const [partidos, setPartidos] = useState([]);
  const [cuotasMap, setCuotasMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const MONTO_FIJO_APUESTA = 10000; // Monto fijo de 10,000 pesos chilenos
  const [apuestasHabilitadas, setApuestasHabilitadas] = useState(true);
  const [configInfo, setConfigInfo] = useState(null);
  const [apuestasSeleccionadas, setApuestasSeleccionadas] = useState({}); // { idPartido: { tipo, cuota, partido } }
  const [mostrarModalConfirmacion, setMostrarModalConfirmacion] = useState(false);
  const [enviandoApuestas, setEnviandoApuestas] = useState(false);
  const [resultadoEnvio, setResultadoEnvio] = useState(null);

  useEffect(() => {
    fetchConfiguracion();
    fetchPartidosConCuotas();
  }, []);

  const fetchConfiguracion = async () => {
    try {
      const response = await configApuestasService.getConfig();
      const data = await handleResponse(response);

      if (data.success) {
        const config = data.config;
        setApuestasHabilitadas(config.apuestas_habilitadas === 'true');
        setConfigInfo(config);
      }
    } catch (err) {
      console.error('Error al obtener configuración de apuestas:', err);
    }
  };

  const fetchPartidosConCuotas = async () => {
    try {
      setLoading(true);
      setError('');

      // Usar getPartidosSinApostar para filtrar solo partidos donde el usuario NO ha apostado
      const response = await cuotasService.getPartidosSinApostar();
      const data = await handleResponse(response);

      setPartidos(data.partidos || []);

      // Cargar cuotas para cada partido
      if (data.partidos && data.partidos.length > 0) {
        const cuotasPromises = data.partidos.map(partido =>
          fetchCuotasPartido(partido.ID_PARTIDO)
        );

        await Promise.all(cuotasPromises);
      }
    } catch (err) {
      console.error('Error al obtener partidos con cuotas:', err);
      setError(err.message || 'Error al cargar partidos disponibles');
      setPartidos([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCuotasPartido = async (idPartido) => {
    try {
      const response = await cuotasService.getByPartido(idPartido);
      const data = await handleResponse(response);

      setCuotasMap(prev => ({
        ...prev,
        [idPartido]: data.cuotas || []
      }));
    } catch (err) {
      console.error(`Error al obtener cuotas del partido ${idPartido}:`, err);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleSeleccionApuesta = (partido, cuota, tipo) => {
    setApuestasSeleccionadas(prev => {
      const nuevasSelecciones = { ...prev };

      // Si ya está seleccionada esta apuesta, la deseleccionamos
      if (nuevasSelecciones[partido.ID_PARTIDO]?.tipo === tipo) {
        delete nuevasSelecciones[partido.ID_PARTIDO];
      } else {
        // Seleccionamos esta apuesta (reemplaza cualquier otra del mismo partido)
        nuevasSelecciones[partido.ID_PARTIDO] = {
          tipo,
          cuota,
          partido
        };
      }

      return nuevasSelecciones;
    });
  };

  const estaSeleccionada = (idPartido, tipo) => {
    return apuestasSeleccionadas[idPartido]?.tipo === tipo;
  };

  const tieneSeleccion = (idPartido) => {
    return !!apuestasSeleccionadas[idPartido];
  };

  const confirmarApuestas = async () => {
    setEnviandoApuestas(true);
    setResultadoEnvio(null);

    const apuestasArray = Object.values(apuestasSeleccionadas);
    const resultados = {
      exitosas: [],
      fallidas: []
    };

    // Enviar cada apuesta
    for (const apuesta of apuestasArray) {
      try {
        const apuestaData = {
          id_partido: apuesta.partido.ID_PARTIDO,
          tipo_apuesta: apuesta.tipo,
          id_equipo_predicho: apuesta.cuota.id_equipo,
          monto_apuesta: MONTO_FIJO_APUESTA
        };

        const response = await apuestasService.create(apuestaData);
        await handleResponse(response);

        resultados.exitosas.push({
          partido: apuesta.partido,
          tipo: apuesta.tipo
        });

      } catch (err) {
        console.error('Error al crear apuesta:', err);
        resultados.fallidas.push({
          partido: apuesta.partido,
          tipo: apuesta.tipo,
          error: err.message
        });
      }
    }

    setResultadoEnvio(resultados);
    setEnviandoApuestas(false);

    // Si todas fueron exitosas, limpiar selecciones y recargar
    if (resultados.fallidas.length === 0) {
      setTimeout(() => {
        setApuestasSeleccionadas({});
        setMostrarModalConfirmacion(false);
        setResultadoEnvio(null);
        fetchPartidosConCuotas();

        if (onApuestaCreada) {
          onApuestaCreada();
        }
      }, 3000);
    }
  };

  const getCuotasPartido = (idPartido) => {
    return cuotasMap[idPartido] || [];
  };

  const getCuotaPorTipo = (idPartido, tipo) => {
    const cuotas = getCuotasPartido(idPartido);
    return cuotas.find(c => c.tipo_resultado === tipo);
  };

  const calcularRetorno = (cuota) => {
    return (MONTO_FIJO_APUESTA * cuota.cuota_decimal).toFixed(0);
  };

  const totalApuestasSeleccionadas = Object.keys(apuestasSeleccionadas).length;
  const montoTotal = totalApuestasSeleccionadas * MONTO_FIJO_APUESTA;

  if (loading) {
    return (
      <div className="partidos-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="partidos-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="partidos-container">
      <h2 className="partidos-title">Partidos Disponibles para Apostar</h2>

      <div className="info-apuestas">
        <div className="info-item">
          <span className="info-label">Monto por apuesta:</span>
          <span className="info-value">$10.000 CLP</span>
        </div>
        <div className="info-item">
          <span className="info-label">Apuestas seleccionadas:</span>
          <span className="info-value">{totalApuestasSeleccionadas}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Total a apostar:</span>
          <span className="info-value">${montoTotal.toLocaleString('es-CL')}</span>
        </div>
      </div>

      {!apuestasHabilitadas && (
        <div className="info-banner">
          <div className="info-icon">ℹ️</div>
          <div className="info-content">
            <strong>Apuestas temporalmente deshabilitadas</strong>
            <p>El administrador ha deshabilitado las apuestas. Podrás apostar cuando estén habilitadas nuevamente.</p>
          </div>
        </div>
      )}

      {partidos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">⚽</div>
          <p>No hay partidos disponibles para apostar en este momento</p>
          <p className="empty-hint">
            {!apuestasHabilitadas
              ? 'Las apuestas están deshabilitadas por el administrador'
              : 'Vuelve pronto para ver nuevos partidos'}
          </p>
        </div>
      ) : (
        <>
          <div className="partidos-list">
            {partidos.map((partido) => {
              const cuotaLocal = getCuotaPorTipo(partido.ID_PARTIDO, 'local');
              const cuotaEmpate = getCuotaPorTipo(partido.ID_PARTIDO, 'empate');
              const cuotaVisita = getCuotaPorTipo(partido.ID_PARTIDO, 'visita');
              const tieneApuesta = tieneSeleccion(partido.ID_PARTIDO);

              return (
                <div
                  key={partido.ID_PARTIDO}
                  className={`partido-card ${tieneApuesta ? 'partido-seleccionado' : ''}`}
                >
                  <div className="partido-header">
                    <div className="torneo-badge">{partido.nombre_torneo}</div>
                    <div className="fecha-partido">{formatDate(partido.FECHA_PARTIDO)}</div>
                  </div>

                  {tieneApuesta && (
                    <div className="seleccion-badge">
                      ✓ Apuesta seleccionada
                    </div>
                  )}

                  <div className="partido-equipos">
                    <div className="equipo-local">
                      <TeamLogo
                        imagen={partido.imagen_local}
                        nombreEquipo={partido.equipo_local}
                        size="large"
                      />
                      <div className="equipo-info">
                        <span className="equipo-nombre">{partido.equipo_local}</span>
                        <span className="equipo-label">Local</span>
                      </div>
                    </div>
                    <div className="vs-divider">VS</div>
                    <div className="equipo-visita">
                      <TeamLogo
                        imagen={partido.imagen_visita}
                        nombreEquipo={partido.equipo_visita}
                        size="large"
                      />
                      <div className="equipo-info">
                        <span className="equipo-nombre">{partido.equipo_visita}</span>
                        <span className="equipo-label">Visita</span>
                      </div>
                    </div>
                  </div>

                  <div className="cuotas-section">
                    <div className="cuotas-title">Selecciona tu apuesta</div>
                    <div className="cuotas-grid">
                      {cuotaLocal && (
                        <div
                          className={`cuota-card cuota-local ${estaSeleccionada(partido.ID_PARTIDO, 'local') ? 'cuota-seleccionada' : ''}`}
                          onClick={() => apuestasHabilitadas && toggleSeleccionApuesta(partido, cuotaLocal, 'local')}
                        >
                          {estaSeleccionada(partido.ID_PARTIDO, 'local') && (
                            <div className="check-seleccion">✓</div>
                          )}
                          <div className="cuota-tipo">🏠 Local</div>
                          <div className="cuota-equipo">{partido.equipo_local}</div>
                          <div className="cuota-valor">{parseFloat(cuotaLocal.cuota_decimal).toFixed(2)}x</div>
                          <div className="retorno-info">
                            Retorno: ${parseInt(calcularRetorno(cuotaLocal)).toLocaleString('es-CL')}
                          </div>
                        </div>
                      )}

                      {cuotaEmpate && (
                        <div
                          className={`cuota-card cuota-empate ${estaSeleccionada(partido.ID_PARTIDO, 'empate') ? 'cuota-seleccionada' : ''}`}
                          onClick={() => apuestasHabilitadas && toggleSeleccionApuesta(partido, cuotaEmpate, 'empate')}
                        >
                          {estaSeleccionada(partido.ID_PARTIDO, 'empate') && (
                            <div className="check-seleccion">✓</div>
                          )}
                          <div className="cuota-tipo">🤝 Empate</div>
                          <div className="cuota-equipo">-</div>
                          <div className="cuota-valor">{parseFloat(cuotaEmpate.cuota_decimal).toFixed(2)}x</div>
                          <div className="retorno-info">
                            Retorno: ${parseInt(calcularRetorno(cuotaEmpate)).toLocaleString('es-CL')}
                          </div>
                        </div>
                      )}

                      {cuotaVisita && (
                        <div
                          className={`cuota-card cuota-visita ${estaSeleccionada(partido.ID_PARTIDO, 'visita') ? 'cuota-seleccionada' : ''}`}
                          onClick={() => apuestasHabilitadas && toggleSeleccionApuesta(partido, cuotaVisita, 'visita')}
                        >
                          {estaSeleccionada(partido.ID_PARTIDO, 'visita') && (
                            <div className="check-seleccion">✓</div>
                          )}
                          <div className="cuota-tipo">✈️ Visita</div>
                          <div className="cuota-equipo">{partido.equipo_visita}</div>
                          <div className="cuota-valor">{parseFloat(cuotaVisita.cuota_decimal).toFixed(2)}x</div>
                          <div className="retorno-info">
                            Retorno: ${parseInt(calcularRetorno(cuotaVisita)).toLocaleString('es-CL')}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Botón flotante para confirmar apuestas */}
          {totalApuestasSeleccionadas > 0 && (
            <div className="boton-confirmar-container">
              <button
                className="btn-confirmar-apuestas"
                onClick={() => setMostrarModalConfirmacion(true)}
              >
                Confirmar {totalApuestasSeleccionadas} apuesta{totalApuestasSeleccionadas !== 1 ? 's' : ''} - ${montoTotal.toLocaleString('es-CL')}
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal de confirmación */}
      {mostrarModalConfirmacion && (
        <div className="modal-overlay" onClick={() => !enviandoApuestas && setMostrarModalConfirmacion(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⚠️ Confirmar Apuestas</h3>
              <button
                className="btn-close"
                onClick={() => setMostrarModalConfirmacion(false)}
                disabled={enviandoApuestas}
              >
                &times;
              </button>
            </div>

            <div className="modal-body">
              {!resultadoEnvio ? (
                <>
                  <div className="modal-warning">
                    <p><strong>¿Está seguro de confirmar estas apuestas?</strong></p>
                    <p>⚠️ Las apuestas realizadas <strong>NO PODRÁN SER MODIFICADAS</strong> una vez confirmadas.</p>
                  </div>

                  <div className="resumen-apuestas">
                    <h4>Resumen de apuestas:</h4>
                    {Object.values(apuestasSeleccionadas).map((apuesta, index) => (
                      <div key={index} className="resumen-item">
                        <div className="resumen-partido">
                          <strong>{apuesta.partido.equipo_local} vs {apuesta.partido.equipo_visita}</strong>
                        </div>
                        <div className="resumen-prediccion">
                          {apuesta.tipo === 'local' && `🏠 ${apuesta.partido.equipo_local}`}
                          {apuesta.tipo === 'empate' && '🤝 Empate'}
                          {apuesta.tipo === 'visita' && `✈️ ${apuesta.partido.equipo_visita}`}
                        </div>
                        <div className="resumen-cuota">
                          Cuota: {parseFloat(apuesta.cuota.cuota_decimal).toFixed(2)}x
                        </div>
                        <div className="resumen-monto">
                          $10.000 → ${parseInt(calcularRetorno(apuesta.cuota)).toLocaleString('es-CL')}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="resumen-total">
                    <span>Total apuestas: {totalApuestasSeleccionadas}</span>
                    <span>Monto total: ${montoTotal.toLocaleString('es-CL')}</span>
                  </div>
                </>
              ) : (
                <div className="resultado-envio">
                  {resultadoEnvio.exitosas.length > 0 && (
                    <div className="resultado-exitosas">
                      <h4>✅ Apuestas creadas exitosamente ({resultadoEnvio.exitosas.length})</h4>
                      {resultadoEnvio.exitosas.map((item, index) => (
                        <div key={index} className="resultado-item">
                          {item.partido.equipo_local} vs {item.partido.equipo_visita}
                        </div>
                      ))}
                    </div>
                  )}

                  {resultadoEnvio.fallidas.length > 0 && (
                    <div className="resultado-fallidas">
                      <h4>❌ Apuestas fallidas ({resultadoEnvio.fallidas.length})</h4>
                      {resultadoEnvio.fallidas.map((item, index) => (
                        <div key={index} className="resultado-item">
                          <div>{item.partido.equipo_local} vs {item.partido.equipo_visita}</div>
                          <div className="error-texto">{item.error}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer">
              {!resultadoEnvio ? (
                <>
                  <button
                    className="btn-cancelar"
                    onClick={() => setMostrarModalConfirmacion(false)}
                    disabled={enviandoApuestas}
                  >
                    Cancelar
                  </button>
                  <button
                    className="btn-confirmar-modal"
                    onClick={confirmarApuestas}
                    disabled={enviandoApuestas}
                  >
                    {enviandoApuestas ? 'Enviando apuestas...' : 'Sí, confirmar apuestas'}
                  </button>
                </>
              ) : (
                <button
                  className="btn-cerrar-resultado"
                  onClick={() => {
                    setMostrarModalConfirmacion(false);
                    setResultadoEnvio(null);
                    if (resultadoEnvio.fallidas.length === 0) {
                      setApuestasSeleccionadas({});
                      fetchPartidosConCuotas();
                    }
                  }}
                >
                  Cerrar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PartidosDisponibles;
