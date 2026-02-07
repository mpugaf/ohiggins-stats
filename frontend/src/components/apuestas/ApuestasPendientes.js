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

  if (loading) {
    return (
      <div className="partidos-disponibles-container">
        <div className="loading-spinner"></div>
        <p>Cargando partidos pendientes de apostar...</p>
      </div>
    );
  }

  return (
    <div className="partidos-disponibles-container">
      <div className="section-header">
        <h2 className="section-title">⏳ Apuestas Pendientes</h2>
        <p className="section-subtitle">
          Partidos del torneo/fecha activa donde aún no has apostado
        </p>
      </div>

      {error && (
        <div className="error-alert">
          <span className="alert-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {resultado && (
        <div className="resultado-apuestas">
          {resultado.exitosas.length > 0 && (
            <div className="resultado-exitosas">
              <h3>✅ Apuestas realizadas exitosamente ({resultado.exitosas.length})</h3>
              <ul>
                {resultado.exitosas.map((r, idx) => (
                  <li key={idx}>
                    {r.equipoLocal} vs {r.equipoVisita} - Apostaste: {r.tipoApuesta}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {resultado.fallidas.length > 0 && (
            <div className="resultado-fallidas">
              <h3>❌ Apuestas fallidas ({resultado.fallidas.length})</h3>
              <ul>
                {resultado.fallidas.map((r, idx) => (
                  <li key={idx}>
                    {r.equipoLocal} vs {r.equipoVisita} - Error: {r.error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {partidos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎉</div>
          <p className="empty-message">¡Excelente!</p>
          <p className="empty-hint">
            Ya has apostado en todos los partidos disponibles del torneo/fecha activa
          </p>
        </div>
      ) : (
        <>
          <div className="partidos-grid">
            {partidos.map((partido) => {
              const cuotas = getCuotasPorTipo(partido.ID_PARTIDO);
              const apuestaSeleccionada = apuestasSeleccionadas[partido.ID_PARTIDO];

              return (
                <div
                  key={partido.ID_PARTIDO}
                  className={`partido-card ${apuestaSeleccionada ? 'partido-seleccionado' : ''}`}
                >
                  <div className="partido-header">
                    <span className="partido-torneo">{partido.nombre_torneo}</span>
                    <span className="partido-fecha">{formatFecha(partido.FECHA_PARTIDO)}</span>
                  </div>

                  <div className="partido-equipos">
                    <div className="equipo">
                      <TeamLogo
                        imagen={partido.imagen_local}
                        nombreEquipo={partido.equipo_local}
                        size="large"
                      />
                      <span className="equipo-nombre">{partido.equipo_local}</span>
                    </div>

                    <div className="vs-separator">VS</div>

                    <div className="equipo">
                      <TeamLogo
                        imagen={partido.imagen_visita}
                        nombreEquipo={partido.equipo_visita}
                        size="large"
                      />
                      <span className="equipo-nombre">{partido.equipo_visita}</span>
                    </div>
                  </div>

                  <div className="cuotas-section">
                    <h4 className="cuotas-titulo">Selecciona tu apuesta:</h4>

                    <div className="cuotas-grid">
                      {cuotas.local && (
                        <button
                          className={`cuota-btn ${apuestaSeleccionada?.tipo === 'local' ? 'seleccionada' : ''}`}
                          onClick={() => toggleSeleccionApuesta(partido, cuotas.local, 'local')}
                          disabled={isSubmitting}
                        >
                          <span className="cuota-label">Local</span>
                          <span className="cuota-equipo">{partido.equipo_local}</span>
                          <span className="cuota-valor">{parseFloat(cuotas.local.cuota_decimal).toFixed(2)}x</span>
                        </button>
                      )}

                      {cuotas.empate && (
                        <button
                          className={`cuota-btn ${apuestaSeleccionada?.tipo === 'empate' ? 'seleccionada' : ''}`}
                          onClick={() => toggleSeleccionApuesta(partido, cuotas.empate, 'empate')}
                          disabled={isSubmitting}
                        >
                          <span className="cuota-label">Empate</span>
                          <span className="cuota-equipo">🤝</span>
                          <span className="cuota-valor">{parseFloat(cuotas.empate.cuota_decimal).toFixed(2)}x</span>
                        </button>
                      )}

                      {cuotas.visita && (
                        <button
                          className={`cuota-btn ${apuestaSeleccionada?.tipo === 'visita' ? 'seleccionada' : ''}`}
                          onClick={() => toggleSeleccionApuesta(partido, cuotas.visita, 'visita')}
                          disabled={isSubmitting}
                        >
                          <span className="cuota-label">Visita</span>
                          <span className="cuota-equipo">{partido.equipo_visita}</span>
                          <span className="cuota-valor">{parseFloat(cuotas.visita.cuota_decimal).toFixed(2)}x</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {Object.keys(apuestasSeleccionadas).length > 0 && (
            <div className="submit-section">
              <div className="submit-info">
                <span className="submit-count">
                  {Object.keys(apuestasSeleccionadas).length} apuesta(s) seleccionada(s)
                </span>
                <span className="submit-total">
                  Total a apostar: $10,000 CLP x {Object.keys(apuestasSeleccionadas).length} = ${(10000 * Object.keys(apuestasSeleccionadas).length).toLocaleString('es-CL')} CLP
                </span>
              </div>
              <button
                className="btn-confirmar-apuestas"
                onClick={abrirConfirmacion}
                disabled={isSubmitting}
              >
                Confirmar Apuestas
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
              <h3>⚠️ Confirmar Apuestas</h3>
            </div>
            <div className="modal-body">
              <p className="modal-warning">
                Estás a punto de realizar {Object.keys(apuestasSeleccionadas).length} apuesta(s).
                <strong> Una vez confirmadas, no podrás modificarlas.</strong>
              </p>

              <div className="modal-apuestas-lista">
                <h4>Resumen de apuestas:</h4>
                {Object.values(apuestasSeleccionadas).map((apuesta, idx) => (
                  <div key={idx} className="modal-apuesta-item">
                    <span className="modal-partido">
                      {apuesta.partidoInfo.equipoLocal} vs {apuesta.partidoInfo.equipoVisita}
                    </span>
                    <span className="modal-prediccion">
                      Predicción: <strong>{apuesta.tipo.toUpperCase()}</strong>
                    </span>
                    <span className="modal-cuota">Cuota: {apuesta.cuota}x</span>
                  </div>
                ))}
              </div>

              <p className="modal-total">
                <strong>Total a apostar: ${(10000 * Object.keys(apuestasSeleccionadas).length).toLocaleString('es-CL')} CLP</strong>
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="btn-modal-cancelar"
                onClick={() => setShowConfirmModal(false)}
              >
                Cancelar
              </button>
              <button
                className="btn-modal-confirmar"
                onClick={confirmarApuestas}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Procesando...' : 'Sí, confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ApuestasPendientes;
