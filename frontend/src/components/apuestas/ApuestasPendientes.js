import React, { useState, useEffect } from 'react';
import { cuotasService, apuestasService, handleResponse } from '../../services/apiService';
import TeamLogo from '../common/TeamLogo';
import './PartidosDisponibles.css';

function ApuestasPendientes({ onApuestaCreada }) {
  const [partidos, setPartidos] = useState([]);
  const [cuotasMap, setCuotasMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [apuestasSeleccionadas, setApuestasSeleccionadas] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [configInfo, setConfigInfo] = useState(null);

  useEffect(() => {
    fetchPartidosSinApostar();
  }, []);

  const fetchPartidosSinApostar = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await cuotasService.getPartidosSinApostar();
      const data = await handleResponse(response);

      if (data.success) {
        setPartidos(data.partidos || []);

        // Guardar información de configuración
        setConfigInfo({
          torneo_activo_id: data.torneo_activo_id,
          torneo_activo_nombre: data.torneo_activo_nombre,
          fecha_activa: data.fecha_activa
        });

        // Cargar cuotas para cada partido
        const cuotasTemp = {};
        for (const partido of data.partidos || []) {
          try {
            const cuotasResponse = await cuotasService.getByPartido(partido.ID_PARTIDO);
            const cuotasData = await handleResponse(cuotasResponse);
            cuotasTemp[partido.ID_PARTIDO] = cuotasData.cuotas || [];
          } catch (err) {
            console.error(`Error cargando cuotas del partido ${partido.ID_PARTIDO}:`, err);
          }
        }
        setCuotasMap(cuotasTemp);
      }
    } catch (err) {
      setError(err.message || 'Error al cargar partidos pendientes de apostar');
    } finally {
      setLoading(false);
    }
  };

  const toggleSeleccionApuesta = (partido, cuota, tipo) => {
    const key = partido.ID_PARTIDO;

    setApuestasSeleccionadas(prev => {
      // Si ya existe una apuesta para este partido, la eliminamos (toggle)
      if (prev[key]?.tipo === tipo) {
        const { [key]: removed, ...rest } = prev;
        return rest;
      }

      // Si no existe o es diferente, la agregamos/actualizamos
      return {
        ...prev,
        [key]: {
          idPartido: partido.ID_PARTIDO,
          tipo,
          cuota: cuota.cuota_decimal,
          idEquipoPredicho: cuota.id_equipo,
          partidoInfo: {
            equipoLocal: partido.equipo_local,
            equipoVisita: partido.equipo_visita,
            fecha: partido.FECHA_PARTIDO,
            torneo: partido.nombre_torneo
          }
        }
      };
    });
  };

  const abrirConfirmacion = () => {
    if (Object.keys(apuestasSeleccionadas).length === 0) {
      setError('No has seleccionado ninguna apuesta');
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmarApuestas = async () => {
    try {
      setIsSubmitting(true);
      setError('');
      setShowConfirmModal(false);

      const apuestasArray = Object.values(apuestasSeleccionadas);
      const response = await apuestasService.createBatch(apuestasArray);
      const data = await handleResponse(response);

      // Mostrar resultado
      setResultado({
        exitosas: data.exitosas || [],
        fallidas: data.fallidas || []
      });

      // Limpiar selecciones
      setApuestasSeleccionadas({});

      // Recargar partidos sin apostar
      await fetchPartidosSinApostar();

      // Notificar al componente padre
      if (onApuestaCreada) {
        onApuestaCreada();
      }

      // Auto-cerrar resultado después de 5 segundos
      setTimeout(() => {
        setResultado(null);
      }, 5000);

    } catch (err) {
      setError(err.message || 'Error al confirmar apuestas');
    } finally {
      setIsSubmitting(false);
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

  const getCuotasPorTipo = (idPartido) => {
    const cuotas = cuotasMap[idPartido] || [];
    return {
      local: cuotas.find(c => c.tipo_resultado === 'local'),
      empate: cuotas.find(c => c.tipo_resultado === 'empate'),
      visita: cuotas.find(c => c.tipo_resultado === 'visita')
    };
  };

  // Agrupar partidos por torneo
  const partidosAgrupados = React.useMemo(() => {
    const grupos = {};
    partidos.forEach(partido => {
      const torneoKey = partido.nombre_torneo || 'Sin torneo';
      if (!grupos[torneoKey]) {
        grupos[torneoKey] = [];
      }
      grupos[torneoKey].push(partido);
    });
    return grupos;
  }, [partidos]);

  if (loading) {
    return (
      <div className="apuestas-plus-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="apuestas-plus-container">
      <h2 className="apuestas-plus-title">Apuestas Pendientes</h2>

      {/* Información de configuración activa */}
      {configInfo && (configInfo.torneo_activo_id || configInfo.fecha_activa) && (
        <div className="info-banner">
          <div className="info-content">
            <strong>Configuración Activa</strong>
            <p>
              {configInfo.torneo_activo_nombre && `Torneo: ${configInfo.torneo_activo_nombre}`}
              {configInfo.fecha_activa && ` | Fecha: ${configInfo.fecha_activa}`}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="error-alert">
          <span className="alert-icon">⚠</span>
          <span>{error}</span>
        </div>
      )}

      {resultado && (
        <div className="resultado-envio">
          {resultado.exitosas.length > 0 && (
            <div className="resultado-exitosas">
              <h4>Apuestas realizadas exitosamente ({resultado.exitosas.length})</h4>
              {resultado.exitosas.map((r, idx) => (
                <div key={idx} className="resultado-item">
                  {r.equipoLocal} vs {r.equipoVisita} - Apostaste: {r.tipoApuesta}
                </div>
              ))}
            </div>
          )}

          {resultado.fallidas.length > 0 && (
            <div className="resultado-fallidas">
              <h4>Apuestas fallidas ({resultado.fallidas.length})</h4>
              {resultado.fallidas.map((r, idx) => (
                <div key={idx} className="resultado-item">
                  <div>{r.equipoLocal} vs {r.equipoVisita}</div>
                  <div className="error-texto">Error: {r.error}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {partidos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">⚽</div>
          <p>No hay partidos disponibles para apostar</p>
          <p className="empty-hint">
            {!configInfo?.torneo_activo_id
              ? 'El administrador debe configurar un torneo activo antes de que puedas realizar apuestas.'
              : 'Ya has apostado en todos los partidos disponibles del torneo/fecha activa.'}
          </p>
        </div>
      ) : (
        <>
          {/* Renderizar por grupos de torneo */}
          {Object.entries(partidosAgrupados).map(([nombreTorneo, partidosTorneo]) => (
            <div key={nombreTorneo} className="torneo-section">
              {/* Título del torneo */}
              <h3 className="torneo-title">{nombreTorneo}</h3>

              {/* Tabla de partidos */}
              {partidosTorneo.map((partido) => {
                const cuotas = getCuotasPorTipo(partido.ID_PARTIDO);
                const apuestaSeleccionada = apuestasSeleccionadas[partido.ID_PARTIDO];

                return (
                  <div key={partido.ID_PARTIDO} className="partido-tabla">
                    {/* Fecha del partido */}
                    <div className="partido-fecha-header">
                      {formatFecha(partido.FECHA_PARTIDO)}
                    </div>

                    {/* Tabla de 3 columnas: Local | Empate | Visita */}
                    <div className="partido-grid">
                      {/* Columna 1: Equipo Local */}
                      {cuotas.local && (
                        <div
                          className={`opcion-cell opcion-local ${apuestaSeleccionada?.tipo === 'local' ? 'selected' : ''}`}
                          onClick={() => toggleSeleccionApuesta(partido, cuotas.local, 'local')}
                        >
                          <div className="opcion-logo">
                            <TeamLogo
                              imagen={partido.imagen_local}
                              nombreEquipo={partido.equipo_local}
                              size="large"
                            />
                          </div>
                          <div className="opcion-cuota">
                            {parseFloat(cuotas.local.cuota_decimal).toFixed(2)}
                          </div>
                        </div>
                      )}

                      {/* Columna 2: Empate */}
                      {cuotas.empate && (
                        <div
                          className={`opcion-cell opcion-empate ${apuestaSeleccionada?.tipo === 'empate' ? 'selected' : ''}`}
                          onClick={() => toggleSeleccionApuesta(partido, cuotas.empate, 'empate')}
                        >
                          <div className="opcion-label">EMPATE</div>
                          <div className="opcion-cuota">
                            {parseFloat(cuotas.empate.cuota_decimal).toFixed(2)}
                          </div>
                        </div>
                      )}

                      {/* Columna 3: Equipo Visita */}
                      {cuotas.visita && (
                        <div
                          className={`opcion-cell opcion-visita ${apuestaSeleccionada?.tipo === 'visita' ? 'selected' : ''}`}
                          onClick={() => toggleSeleccionApuesta(partido, cuotas.visita, 'visita')}
                        >
                          <div className="opcion-logo">
                            <TeamLogo
                              imagen={partido.imagen_visita}
                              nombreEquipo={partido.equipo_visita}
                              size="large"
                            />
                          </div>
                          <div className="opcion-cuota">
                            {parseFloat(cuotas.visita.cuota_decimal).toFixed(2)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {Object.keys(apuestasSeleccionadas).length > 0 && (
            <div className="boton-confirmar-container">
              <button
                className="btn-confirmar-apuestas"
                onClick={abrirConfirmacion}
                disabled={isSubmitting}
              >
                Confirmar {Object.keys(apuestasSeleccionadas).length} Apuesta(s) - ${(10000 * Object.keys(apuestasSeleccionadas).length).toLocaleString('es-CL')}
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal de Confirmación */}
      {showConfirmModal && (
        <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirmar Apuestas</h3>
              <button className="btn-close" onClick={() => setShowConfirmModal(false)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-warning">
                <strong>¿Está seguro de confirmar estas apuestas?</strong>
                <p>Las apuestas realizadas NO PODRÁN SER MODIFICADAS una vez confirmadas.</p>
              </div>

              <div className="resumen-apuestas">
                <h4>Resumen de apuestas:</h4>
                {Object.values(apuestasSeleccionadas).map((apuesta, idx) => (
                  <div key={idx} className="resumen-item">
                    <div className="resumen-partido">
                      {apuesta.partidoInfo.equipoLocal} vs {apuesta.partidoInfo.equipoVisita}
                    </div>
                    <div className="resumen-prediccion">
                      Predicción: {apuesta.tipo.toUpperCase()}
                    </div>
                    <div className="resumen-cuota">
                      Cuota: {apuesta.cuota}x
                    </div>
                    <div className="resumen-monto">
                      $10,000 → ${(10000 * apuesta.cuota).toLocaleString('es-CL')}
                    </div>
                  </div>
                ))}
              </div>

              <div className="resumen-total">
                <span>Total apuestas: {Object.keys(apuestasSeleccionadas).length}</span>
                <span>Monto total: ${(10000 * Object.keys(apuestasSeleccionadas).length).toLocaleString('es-CL')}</span>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-cancelar"
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                className="btn-confirmar"
                onClick={confirmarApuestas}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Procesando...' : 'Sí, confirmar apuestas'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ApuestasPendientes;
