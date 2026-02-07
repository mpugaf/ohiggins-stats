import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import './LiquidarApuestas.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://192.168.100.16:3000';

function LiquidarApuestas() {
  const { token } = useAuth();
  const [partidos, setPartidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liquidando, setLiquidando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [partidoSeleccionado, setPartidoSeleccionado] = useState(null);

  useEffect(() => {
    fetchPartidosFinalizados();
  }, []);

  const fetchPartidosFinalizados = async () => {
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
      // Filtrar partidos finalizados con resultado
      const partidosFinalizados = data.partidos?.filter(
        p => p.ESTADO_PARTIDO !== 'PROGRAMADO' &&
             p.GOLES_LOCAL !== null &&
             p.GOLES_VISITA !== null
      ) || [];
      setPartidos(partidosFinalizados);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getResultado = (partido) => {
    if (partido.GOLES_LOCAL > partido.GOLES_VISITA) {
      return { texto: 'Victoria Local', tipo: 'local', icon: '🏠' };
    } else if (partido.GOLES_LOCAL < partido.GOLES_VISITA) {
      return { texto: 'Victoria Visita', tipo: 'visita', icon: '✈️' };
    } else {
      return { texto: 'Empate', tipo: 'empate', icon: '🤝' };
    }
  };

  const handleLiquidar = (partido) => {
    setPartidoSeleccionado(partido);
  };

  const confirmarLiquidacion = async () => {
    if (!partidoSeleccionado) return;

    setLiquidando(true);
    setError('');
    setMensaje('');

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/apuestas/liquidar/${partidoSeleccionado.ID_PARTIDO}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al liquidar apuestas');
      }

      setMensaje(
        `✅ Liquidación exitosa: ${data.apuestas_ganadas} apuestas ganadas, ${data.apuestas_perdidas} apuestas perdidas`
      );

      // Recargar lista de partidos
      fetchPartidosFinalizados();

      // Cerrar modal
      setTimeout(() => {
        setPartidoSeleccionado(null);
        setMensaje('');
      }, 3000);

    } catch (err) {
      setError(err.message);
    } finally {
      setLiquidando(false);
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
      <div className="liquidar-apuestas-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="liquidar-apuestas-container">
      <h1 className="page-title">Liquidación de Apuestas</h1>
      <p className="page-subtitle">Liquida apuestas de partidos finalizados</p>

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

      {partidos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✅</div>
          <p>No hay partidos finalizados pendientes de liquidación</p>
        </div>
      ) : (
        <div className="partidos-grid">
          {partidos.map(partido => {
            const resultado = getResultado(partido);

            return (
              <div key={partido.ID_PARTIDO} className="partido-card-liquidar">
                <div className="card-header">
                  <span className="torneo-badge">{partido.TORNEO}</span>
                  <span className="fecha-badge">{formatDate(partido.FECHA_PARTIDO)}</span>
                </div>

                <div className="card-body">
                  <div className="equipos-resultado">
                    <div className="equipo-row">
                      <span className="equipo-nombre">{partido.EQUIPO_LOCAL}</span>
                      <span className="equipo-goles">{partido.GOLES_LOCAL}</span>
                    </div>
                    <div className="vs-divider">-</div>
                    <div className="equipo-row">
                      <span className="equipo-nombre">{partido.EQUIPO_VISITA}</span>
                      <span className="equipo-goles">{partido.GOLES_VISITA}</span>
                    </div>
                  </div>

                  <div className={`resultado-badge resultado-${resultado.tipo}`}>
                    <span className="resultado-icon">{resultado.icon}</span>
                    <span className="resultado-texto">{resultado.texto}</span>
                  </div>
                </div>

                <div className="card-footer">
                  <button
                    className="btn-liquidar"
                    onClick={() => handleLiquidar(partido)}
                  >
                    Liquidar Apuestas
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de confirmación */}
      {partidoSeleccionado && (
        <div className="modal-overlay" onClick={() => !liquidando && setPartidoSeleccionado(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirmar Liquidación</h3>
              <button
                className="btn-close"
                onClick={() => setPartidoSeleccionado(null)}
                disabled={liquidando}
              >
                &times;
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-partido">
                <div className="modal-equipos">
                  <div className="modal-equipo-row">
                    <span>{partidoSeleccionado.EQUIPO_LOCAL}</span>
                    <span className="modal-goles">{partidoSeleccionado.GOLES_LOCAL}</span>
                  </div>
                  <div className="modal-divider">-</div>
                  <div className="modal-equipo-row">
                    <span>{partidoSeleccionado.EQUIPO_VISITA}</span>
                    <span className="modal-goles">{partidoSeleccionado.GOLES_VISITA}</span>
                  </div>
                </div>

                <div className="modal-resultado">
                  {(() => {
                    const resultado = getResultado(partidoSeleccionado);
                    return (
                      <div className={`resultado-tag resultado-${resultado.tipo}`}>
                        {resultado.icon} {resultado.texto}
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="modal-warning">
                <p>⚠️ Esta acción liquidará todas las apuestas pendientes de este partido.</p>
                <p>Las apuestas ganadoras recibirán sus puntos automáticamente.</p>
                <p><strong>Esta acción no se puede deshacer.</strong></p>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-cancelar"
                onClick={() => setPartidoSeleccionado(null)}
                disabled={liquidando}
              >
                Cancelar
              </button>
              <button
                className="btn-confirmar-liquidar"
                onClick={confirmarLiquidacion}
                disabled={liquidando}
              >
                {liquidando ? 'Liquidando...' : 'Confirmar Liquidación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LiquidarApuestas;
