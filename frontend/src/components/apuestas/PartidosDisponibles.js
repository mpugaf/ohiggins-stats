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
  const [torneoActivoInfo, setTorneoActivoInfo] = useState(null);
  const [apuestasSeleccionadas, setApuestasSeleccionadas] = useState({}); // { idPartido: { tipo, cuota, partido } }
  const [mostrarModalConfirmacion, setMostrarModalConfirmacion] = useState(false);
  const [enviandoApuestas, setEnviandoApuestas] = useState(false);
  const [resultadoEnvio, setResultadoEnvio] = useState(null);

  useEffect(() => {
    // Cargar configuración y partidos inmediatamente
    fetchConfiguracion();
    fetchPartidosConCuotas();

    // Polling cada 30 segundos para sincronizar con cambios del admin
    const intervalId = setInterval(() => {
      fetchConfiguracion();
      fetchPartidosConCuotas();
    }, 30000); // 30 segundos

    // Cleanup
    return () => {
      clearInterval(intervalId);
    };
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

      // Guardar información del torneo activo
      if (data.torneo_activo_nombre) {
        setTorneoActivoInfo({
          id: data.torneo_activo_id,
          nombre: data.torneo_activo_nombre,
          fecha: data.fecha_activa
        });
      }

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

      {/* Banner informativo del torneo/fecha vigente */}
      {torneoActivoInfo && (
        <div className="info-banner" style={{ backgroundColor: '#e3f2fd', borderLeft: '4px solid #2196f3' }}>
          <div className="info-icon">🏆</div>
          <div className="info-content">
            <strong>Torneo Vigente para Apuestas:</strong>
            <p>
              {torneoActivoInfo.nombre}
              {torneoActivoInfo.fecha && ` - Fecha ${torneoActivoInfo.fecha}`}
            </p>
            <p style={{ fontSize: '0.9em', marginTop: '4px', color: '#555' }}>
              Solo puedes apostar en partidos de este torneo y fecha configurados por el administrador.
            </p>
          </div>
        </div>
      )}

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
        <div className="info-banner" style={{ backgroundColor: '#fff3cd', borderLeft: '4px solid #ffc107' }}>
          <div className="info-icon">⚠️</div>
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
            {partidos.map((partido, index) => {
              const cuotaLocal = getCuotaPorTipo(partido.ID_PARTIDO, 'local');
              const cuotaEmpate = getCuotaPorTipo(partido.ID_PARTIDO, 'empate');
              const cuotaVisita = getCuotaPorTipo(partido.ID_PARTIDO, 'visita');
              const tieneApuesta = tieneSeleccion(partido.ID_PARTIDO);
              const isEven = index % 2 === 0;

              return (
                <div
                  key={partido.ID_PARTIDO}
                  className={`partido-row ${isEven ? 'row-dark' : 'row-light'} ${tieneApuesta ? 'row-selected' : ''}`}
                >
                  {/* Info del partido (torneo y fecha) */}
                  <div className="partido-info-header">
                    <span className="torneo-nombre">{partido.nombre_torneo}</span>
                    <span className="partido-fecha">{formatDate(partido.FECHA_PARTIDO)}</span>
                  </div>

                  {/* Fila principal de apuestas */}
                  <div className="partido-row-content">
                    {/* Equipo Local - CON LOGO */}
                    <div className="equipo-cell equipo-local-cell">
                      <TeamLogo
                        imagen={partido.imagen_local}
                        nombreEquipo={partido.equipo_local}
                        size="small"
                      />
                      <span className="equipo-nombre">{partido.equipo_local}</span>
                    </div>

                    {/* Cuota Local */}
                    {cuotaLocal && (
                      <div
                        className={`cuota-cell ${estaSeleccionada(partido.ID_PARTIDO, 'local') ? 'cuota-selected' : ''}`}
                        onClick={() => apuestasHabilitadas && toggleSeleccionApuesta(partido, cuotaLocal, 'local')}
                      >
                        <div className="cuota-value">{parseFloat(cuotaLocal.cuota_decimal).toFixed(2)}</div>
                      </div>
                    )}

                    {/* Cuota Empate */}
                    {cuotaEmpate && (
                      <div
                        className={`cuota-cell ${estaSeleccionada(partido.ID_PARTIDO, 'empate') ? 'cuota-selected' : ''}`}
                        onClick={() => apuestasHabilitadas && toggleSeleccionApuesta(partido, cuotaEmpate, 'empate')}
                      >
                        <div className="cuota-value">{parseFloat(cuotaEmpate.cuota_decimal).toFixed(2)}</div>
                      </div>
                    )}

                    {/* Cuota Visita */}
                    {cuotaVisita && (
                      <div
                        className={`cuota-cell ${estaSeleccionada(partido.ID_PARTIDO, 'visita') ? 'cuota-selected' : ''}`}
                        onClick={() => apuestasHabilitadas && toggleSeleccionApuesta(partido, cuotaVisita, 'visita')}
                      >
                        <div className="cuota-value">{parseFloat(cuotaVisita.cuota_decimal).toFixed(2)}</div>
                      </div>
                    )}

                    {/* Equipo Visita - CON LOGO */}
                    <div className="equipo-cell equipo-visita-cell">
                      <span className="equipo-nombre">{partido.equipo_visita}</span>
                      <TeamLogo
                        imagen={partido.imagen_visita}
                        nombreEquipo={partido.equipo_visita}
                        size="small"
                      />
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
