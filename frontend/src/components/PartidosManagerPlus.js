import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { partidosService, apuestasService, handleResponse } from '../services/apiService';
import TeamLogo from './common/TeamLogo';
import './PartidosManagerPlus.css';

const PartidosManagerPlus = () => {
  const navigate = useNavigate();
  const [partidos, setPartidos] = useState([]);
  const [todosLosPartidos, setTodosLosPartidos] = useState([]); // sin filtro de jornada, para el combo
  const [torneos, setTorneos] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [estadios, setEstadios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Valores por defecto para filtros
  const [torneoActivo, setTorneoActivo] = useState(null);
  const [jornadaActiva, setJornadaActiva] = useState(null);
  const [defaultsCargados, setDefaultsCargados] = useState(false);

  // Filtros
  const [filtros, setFiltros] = useState({
    torneo: '',
    equipo: '',
    estado: '',
    numeroJornada: '',
    fechaDesde: '',
    fechaHasta: ''
  });

  // Modal de edición/creación
  const [showModal, setShowModal] = useState(false);
  const [partidoEditando, setPartidoEditando] = useState(null);
  const [modoRapido, setModoRapido] = useState(false);
  const [formData, setFormData] = useState({
    ID_TORNEO: '',
    ID_EQUIPO_LOCAL: '',
    ID_EQUIPO_VISITA: '',
    ID_ESTADIO: '',
    FECHA_PARTIDO: '',
    NUMERO_JORNADA: '',
    GOLES_LOCAL: 0,
    GOLES_VISITA: 0,
    ESTADO_PARTIDO: 'PROGRAMADO'
  });

  // Confirmación de eliminación
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [partidoAEliminar, setPartidoAEliminar] = useState(null);

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const partidosPorPagina = 15;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    cargarPartidos();
  }, [filtros]);

  const cargarDatosIniciales = async () => {
    try {
      setLoading(true);

      const [torneosRes, equiposRes, estadiosRes, torneosApuestasRes] = await Promise.all([
        partidosService.getTorneos(),
        partidosService.getEquiposData(),
        partidosService.getEstadios(),
        apuestasService.getTorneosYFechas()
      ]);

      const torneosData = await handleResponse(torneosRes);
      const equiposData = await handleResponse(equiposRes);
      const estadiosData = await handleResponse(estadiosRes);
      const torneosApuestasData = await handleResponse(torneosApuestasRes);

      setTorneos(torneosData);
      setEquipos(equiposData);
      setEstadios(estadiosData);

      // Establecer torneo activo por defecto
      const torneoActivoId = torneosApuestasData.torneoActivo;
      if (torneoActivoId && !defaultsCargados) {
        setTorneoActivo(torneoActivoId);

        // Obtener jornada activa/última del torneo
        const partidosTorneoRes = await partidosService.getAll({ torneoId: torneoActivoId, limit: '200' });
        const partidosTorneo = await handleResponse(partidosTorneoRes);

        if (partidosTorneo && partidosTorneo.length > 0) {
          // Buscar jornada con partidos PROGRAMADO o EN_CURSO
          const jornadaPendiente = partidosTorneo.find(p =>
            p.ESTADO_PARTIDO === 'PROGRAMADO' || p.ESTADO_PARTIDO === 'EN_CURSO'
          );

          let jornada;
          if (jornadaPendiente) {
            jornada = jornadaPendiente.NUMERO_JORNADA;
          } else {
            // Si no hay partidos pendientes, usar la jornada más reciente
            const jornadas = [...new Set(partidosTorneo.map(p => p.NUMERO_JORNADA))];
            jornada = Math.max(...jornadas);
          }

          setJornadaActiva(jornada);

          // Establecer filtros por defecto
          setFiltros(prev => ({
            ...prev,
            torneo: String(torneoActivoId),
            numeroJornada: String(jornada)
          }));

          setDefaultsCargados(true);
        }
      }

    } catch (err) {
      console.error('Error al cargar datos iniciales:', err);
      showError('Error al cargar datos iniciales: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const cargarPartidos = async () => {
    try {
      setLoading(true);

      const params = {};
      if (filtros.torneo) params.torneoId = filtros.torneo;
      if (filtros.equipo) params.equipoId = filtros.equipo;
      if (filtros.estado) params.estado = filtros.estado;
      if (filtros.fechaDesde) params.fechaDesde = filtros.fechaDesde;
      if (filtros.fechaHasta) params.fechaHasta = filtros.fechaHasta;
      params.limit = '200';

      const response = await partidosService.getAll(params);
      let data = await handleResponse(response);

      // Guardar todos los partidos del torneo antes del filtro de jornada
      // (necesario para que el combo muestre todas las jornadas disponibles)
      setTodosLosPartidos(data);

      // Filtrar por número de jornada en frontend si está seleccionado
      if (filtros.numeroJornada) {
        data = data.filter(p => p.NUMERO_JORNADA === parseInt(filtros.numeroJornada));
      }

      setPartidos(data);
      setError('');
    } catch (err) {
      console.error('Error al cargar partidos:', err);
      showError('Error al cargar partidos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
    setPaginaActual(1);
  };

  const limpiarFiltros = () => {
    setFiltros({
      torneo: torneoActivo ? String(torneoActivo) : '',
      equipo: '',
      estado: '',
      numeroJornada: jornadaActiva ? String(jornadaActiva) : '',
      fechaDesde: '',
      fechaHasta: ''
    });
  };

  const abrirModalNuevo = () => {
    setPartidoEditando(null);
    setModoRapido(false);
    setFormData({
      ID_TORNEO: '',
      ID_EQUIPO_LOCAL: '',
      ID_EQUIPO_VISITA: '',
      ID_ESTADIO: '',
      FECHA_PARTIDO: '',
      NUMERO_JORNADA: '',
      GOLES_LOCAL: 0,
      GOLES_VISITA: 0,
      ESTADO_PARTIDO: 'PROGRAMADO'
    });
    setShowModal(true);
  };

  const abrirModalEditar = (partido) => {
    setPartidoEditando(partido);
    setModoRapido(true);

    // Formatear fecha para input datetime-local en hora Chile (GMT-3)
    const fechaFormateada = new Date(partido.FECHA_PARTIDO)
      .toLocaleString('sv-SE', { timeZone: 'America/Santiago' })
      .slice(0, 16)
      .replace(' ', 'T');

    setFormData({
      ID_TORNEO: partido.ID_TORNEO || '',
      ID_EQUIPO_LOCAL: partido.ID_EQUIPO_LOCAL || '',
      ID_EQUIPO_VISITA: partido.ID_EQUIPO_VISITA || '',
      ID_ESTADIO: partido.ID_ESTADIO || '',
      FECHA_PARTIDO: fechaFormateada,
      NUMERO_JORNADA: partido.NUMERO_JORNADA || '',
      GOLES_LOCAL: partido.GOLES_LOCAL || 0,
      GOLES_VISITA: partido.GOLES_VISITA || 0,
      ESTADO_PARTIDO: partido.ESTADO_PARTIDO || 'PROGRAMADO'
    });
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setPartidoEditando(null);
    setModoRapido(false);
  };

  const handleFormChange = (campo, valor) => {
    setFormData(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      // Transformar datos del formulario al formato esperado por el backend (camelCase)
      const dataParaBackend = {
        matchIdFbr: partidoEditando ? partidoEditando.MATCH_ID_FBR : `MATCH_${Date.now()}`,
        idTorneo: parseInt(formData.ID_TORNEO),
        fechaPartido: formData.FECHA_PARTIDO,
        idEquipoLocal: parseInt(formData.ID_EQUIPO_LOCAL),
        idEquipoVisita: parseInt(formData.ID_EQUIPO_VISITA),
        idEstadio: parseInt(formData.ID_ESTADIO),
        numeroJornada: formData.NUMERO_JORNADA ? parseInt(formData.NUMERO_JORNADA) : null,
        golesLocal: formData.GOLES_LOCAL === '' || formData.GOLES_LOCAL === null ? 0 : parseInt(formData.GOLES_LOCAL),
        golesVisita: formData.GOLES_VISITA === '' || formData.GOLES_VISITA === null ? 0 : parseInt(formData.GOLES_VISITA),
        // En modo rápido, forzar estado FINALIZADO
        estadoPartido: modoRapido ? 'FINALIZADO' : (formData.ESTADO_PARTIDO || 'PROGRAMADO'),
        esCampoNeutro: false,
        arbitro: null,
        asistencia: null,
        clima: null
      };

      console.log('📤 Enviando datos al backend:', dataParaBackend);

      if (partidoEditando) {
        const response = await partidosService.update(partidoEditando.ID_PARTIDO, dataParaBackend);
        await handleResponse(response);
        showSuccess('¡Partido actualizado exitosamente!');
      } else {
        const response = await partidosService.create(dataParaBackend);
        await handleResponse(response);
        showSuccess('¡Partido creado exitosamente!');
      }

      cerrarModal();
      cargarPartidos();

    } catch (err) {
      console.error('Error al guardar partido:', err);
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmarEliminacion = (partido) => {
    setPartidoAEliminar(partido);
    setShowDeleteConfirm(true);
  };

  const cancelarEliminacion = () => {
    setPartidoAEliminar(null);
    setShowDeleteConfirm(false);
  };

  const eliminarPartido = async () => {
    if (!partidoAEliminar) return;

    try {
      setLoading(true);

      const response = await partidosService.delete(partidoAEliminar.ID_PARTIDO);
      await handleResponse(response);

      showSuccess('Partido eliminado exitosamente');
      cancelarEliminacion();
      cargarPartidos();

    } catch (err) {
      console.error('Error al eliminar partido:', err);
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const showError = (message) => {
    setError(message);
    setTimeout(() => setError(''), 5000);
  };

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const formatFecha = (fechaStr) => {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Santiago'
    });
  };

  const getEstadoClass = (estado) => {
    const clases = {
      'PROGRAMADO': 'estado-programado',
      'EN_CURSO': 'estado-en-curso',
      'FINALIZADO': 'estado-finalizado',
      'SUSPENDIDO': 'estado-suspendido',
      'CANCELADO': 'estado-cancelado'
    };
    return clases[estado] || '';
  };

  // Paginación
  const totalPaginas = Math.ceil(partidos.length / partidosPorPagina);
  const indiceInicio = (paginaActual - 1) * partidosPorPagina;
  const indiceFin = indiceInicio + partidosPorPagina;
  const partidosPaginados = partidos.slice(indiceInicio, indiceFin);

  const cambiarPagina = (num) => {
    setPaginaActual(num);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Obtener jornadas únicas del torneo seleccionado desde el estado SIN filtro de jornada
  // (si se usara 'partidos' filtrado, el combo solo mostraría la jornada activa)
  const jornadasDisponibles = [...new Set(
    todosLosPartidos
      .filter(p => !filtros.torneo || p.ID_TORNEO === parseInt(filtros.torneo))
      .map(p => p.NUMERO_JORNADA)
      .filter(j => j !== null && j !== undefined)
  )].sort((a, b) => a - b);

  return (
    <div className="partidos-manager-plus">
      {/* Header */}
      <header className="header-manager-plus">
        <button onClick={() => navigate('/dashboard')} className="back-btn-plus">
          ← Dashboard
        </button>
        <div className="header-content-manager">
          <h1 className="title-manager-plus">⚽ Gestión de Partidos +</h1>
          <p className="subtitle-manager-plus">Administrador moderno de partidos con tabla intuitiva</p>
        </div>
        <button onClick={abrirModalNuevo} className="btn-nuevo-plus">
          ➕ Nuevo Partido
        </button>
      </header>

      {/* Mensajes */}
      {error && (
        <div className="alert-plus alert-error-plus">
          <span className="alert-icon">⚠️</span>
          <span>{error}</span>
          <button onClick={() => setError('')} className="alert-close-plus">✕</button>
        </div>
      )}

      {successMessage && (
        <div className="alert-plus alert-success-plus">
          <span className="alert-icon">✅</span>
          <span>{successMessage}</span>
        </div>
      )}

      {/* Panel de Filtros */}
      <div className="filtros-panel-manager-plus">
        <div className="filtros-grid">
          <div className="filtro-group-plus">
            <label>🏆 Torneo</label>
            <select
              value={filtros.torneo}
              onChange={(e) => handleFiltroChange('torneo', e.target.value)}
              className="filtro-input-plus"
            >
              <option value="">Todos los torneos</option>
              {torneos.map(t => (
                <option key={t.ID_TORNEO} value={t.ID_TORNEO}>
                  {t.NOMBRE} - {t.TEMPORADA}
                  {t.RUEDA && ` - ${t.RUEDA === 'PRIMERA' ? '1ª' : t.RUEDA === 'SEGUNDA' ? '2ª' : ''} Rueda`}
                  {t.ID_TORNEO === torneoActivo && ' ⭐'}
                </option>
              ))}
            </select>
          </div>

          <div className="filtro-group-plus">
            <label>⚽ Equipo</label>
            <select
              value={filtros.equipo}
              onChange={(e) => handleFiltroChange('equipo', e.target.value)}
              className="filtro-input-plus"
            >
              <option value="">Todos los equipos</option>
              {equipos.map(e => (
                <option key={e.ID_EQUIPO} value={e.ID_EQUIPO}>
                  {e.NOMBRE}
                </option>
              ))}
            </select>
          </div>

          <div className="filtro-group-plus">
            <label>📊 Estado</label>
            <select
              value={filtros.estado}
              onChange={(e) => handleFiltroChange('estado', e.target.value)}
              className="filtro-input-plus"
            >
              <option value="">Todos los estados</option>
              <option value="PROGRAMADO">PROGRAMADO</option>
              <option value="EN_CURSO">EN CURSO</option>
              <option value="FINALIZADO">FINALIZADO</option>
              <option value="SUSPENDIDO">SUSPENDIDO</option>
              <option value="CANCELADO">CANCELADO</option>
            </select>
          </div>

          {filtros.torneo && jornadasDisponibles.length > 0 && (
            <div className="filtro-group-plus">
              <label>📅 Jornada</label>
              <select
                value={filtros.numeroJornada}
                onChange={(e) => handleFiltroChange('numeroJornada', e.target.value)}
                className="filtro-input-plus"
              >
                <option value="">Todas las jornadas</option>
                {jornadasDisponibles.map(j => (
                  <option key={j} value={j}>Fecha {j}</option>
                ))}
              </select>
            </div>
          )}

          <div className="filtro-group-plus">
            <label>📅 Desde</label>
            <input
              type="date"
              value={filtros.fechaDesde}
              onChange={(e) => handleFiltroChange('fechaDesde', e.target.value)}
              className="filtro-input-plus"
            />
          </div>

          <div className="filtro-group-plus">
            <label>📅 Hasta</label>
            <input
              type="date"
              value={filtros.fechaHasta}
              onChange={(e) => handleFiltroChange('fechaHasta', e.target.value)}
              className="filtro-input-plus"
            />
          </div>
        </div>

        <div className="filtros-actions">
          <button onClick={limpiarFiltros} className="btn-limpiar-plus">
            🔄 Limpiar Filtros
          </button>
          <div className="filtros-info">
            Mostrando {partidos.length} partido{partidos.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Tabla de Partidos */}
      {loading ? (
        <div className="loading-state-plus">
          <div className="spinner-plus"></div>
          <p>Cargando partidos...</p>
        </div>
      ) : partidos.length === 0 ? (
        <div className="empty-state-manager-plus">
          <div className="empty-icon-manager">⚽</div>
          <p>No hay partidos registrados</p>
          <button onClick={abrirModalNuevo} className="btn-nuevo-empty">
            ➕ Crear Primer Partido
          </button>
        </div>
      ) : (
        <>
          <div className="tabla-container-plus">
            <table className="tabla-partidos-manager-plus">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Jornada</th>
                  <th>Torneo</th>
                  <th>Equipo Local</th>
                  <th>Resultado</th>
                  <th>Equipo Visita</th>
                  <th>Estadio</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {partidosPaginados.map((partido) => (
                  <tr key={partido.ID_PARTIDO}>
                    <td className="td-fecha-plus">
                      {formatFecha(partido.FECHA_PARTIDO)}
                    </td>
                    <td className="td-jornada-plus">
                      {partido.NUMERO_JORNADA ? (
                        <span className="jornada-badge-manager">J{partido.NUMERO_JORNADA}</span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="td-torneo-plus">
                      <div className="torneo-info-plus">
                        <span className="torneo-nombre">{partido.NOMBRE_TORNEO}</span>
                        <span className="torneo-temp">{partido.TEMPORADA}</span>
                      </div>
                    </td>
                    <td className="td-equipo-plus">
                      <div className="equipo-cell-plus">
                        <TeamLogo
                          imagen={partido.IMAGEN_EQUIPO_LOCAL}
                          nombreEquipo={partido.NOMBRE_EQUIPO_LOCAL}
                          size="small"
                        />
                        <span>{partido.NOMBRE_EQUIPO_LOCAL}</span>
                      </div>
                    </td>
                    <td className="td-resultado-plus">
                      <div className="resultado-manager-plus">
                        <span className="gol">{partido.GOLES_LOCAL ?? 0}</span>
                        <span className="vs">-</span>
                        <span className="gol">{partido.GOLES_VISITA ?? 0}</span>
                      </div>
                    </td>
                    <td className="td-equipo-plus">
                      <div className="equipo-cell-plus">
                        <span>{partido.NOMBRE_EQUIPO_VISITA}</span>
                        <TeamLogo
                          imagen={partido.IMAGEN_EQUIPO_VISITA}
                          nombreEquipo={partido.NOMBRE_EQUIPO_VISITA}
                          size="small"
                        />
                      </div>
                    </td>
                    <td className="td-estadio-plus">
                      {partido.NOMBRE_ESTADIO || '-'}
                    </td>
                    <td className="td-estado-plus">
                      <span className={`estado-badge-manager ${getEstadoClass(partido.ESTADO_PARTIDO)}`}>
                        {partido.ESTADO_PARTIDO}
                      </span>
                    </td>
                    <td className="td-acciones-plus">
                      <button
                        onClick={() => abrirModalEditar(partido)}
                        className="btn-accion-plus btn-editar-plus"
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => confirmarEliminacion(partido)}
                        className="btn-accion-plus btn-eliminar-plus"
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="paginacion-manager-plus">
              <button
                onClick={() => cambiarPagina(paginaActual - 1)}
                disabled={paginaActual === 1}
                className="btn-pag-manager"
              >
                ← Anterior
              </button>

              <div className="paginas-numeros-manager">
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(num => (
                  <button
                    key={num}
                    onClick={() => cambiarPagina(num)}
                    className={`btn-pag-num-manager ${paginaActual === num ? 'activo' : ''}`}
                  >
                    {num}
                  </button>
                ))}
              </div>

              <button
                onClick={() => cambiarPagina(paginaActual + 1)}
                disabled={paginaActual === totalPaginas}
                className="btn-pag-manager"
              >
                Siguiente →
              </button>

              <div className="pag-info-manager">
                Página {paginaActual} de {totalPaginas}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal de Edición/Creación */}
      {showModal && (
        <div className="modal-overlay-plus" onClick={cerrarModal}>
          <div className="modal-content-plus" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-plus">
              <h2>{partidoEditando ? '✏️ Editar Partido' : '➕ Nuevo Partido'}</h2>
              <button onClick={cerrarModal} className="modal-close-plus">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form-plus">
              {/* Checkbox Modo Rápido - Solo en edición */}
              {partidoEditando && (
                <div className="modo-rapido-container">
                  <label className="modo-rapido-label">
                    <input
                      type="checkbox"
                      checked={modoRapido}
                      onChange={(e) => setModoRapido(e.target.checked)}
                      className="modo-rapido-checkbox"
                    />
                    <span className="modo-rapido-text">
                      ⚡ <strong>Modo Rápido:</strong> Solo actualizar resultado (deshabilita otros campos y marca como FINALIZADO)
                    </span>
                  </label>
                </div>
              )}

              <div className="form-grid-plus">
                <div className="form-group-plus">
                  <label>Torneo *</label>
                  <select
                    value={formData.ID_TORNEO}
                    onChange={(e) => handleFormChange('ID_TORNEO', e.target.value)}
                    required
                    disabled={modoRapido}
                    className="form-input-plus"
                  >
                    <option value="">Seleccionar...</option>
                    {torneos.map(t => (
                      <option key={t.ID_TORNEO} value={t.ID_TORNEO}>
                        {t.NOMBRE} - {t.TEMPORADA}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group-plus">
                  <label>Jornada</label>
                  <input
                    type="number"
                    value={formData.NUMERO_JORNADA}
                    onChange={(e) => handleFormChange('NUMERO_JORNADA', e.target.value)}
                    disabled={modoRapido}
                    className="form-input-plus"
                    min="1"
                  />
                </div>

                <div className="form-group-plus">
                  <label>Equipo Local *</label>
                  <select
                    value={formData.ID_EQUIPO_LOCAL}
                    onChange={(e) => handleFormChange('ID_EQUIPO_LOCAL', e.target.value)}
                    required
                    disabled={modoRapido}
                    className="form-input-plus"
                  >
                    <option value="">Seleccionar...</option>
                    {equipos.map(e => (
                      <option key={e.ID_EQUIPO} value={e.ID_EQUIPO}>
                        {e.NOMBRE}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group-plus">
                  <label>Equipo Visita *</label>
                  <select
                    value={formData.ID_EQUIPO_VISITA}
                    onChange={(e) => handleFormChange('ID_EQUIPO_VISITA', e.target.value)}
                    required
                    disabled={modoRapido}
                    className="form-input-plus"
                  >
                    <option value="">Seleccionar...</option>
                    {equipos.map(e => (
                      <option key={e.ID_EQUIPO} value={e.ID_EQUIPO}>
                        {e.NOMBRE}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group-plus">
                  <label>Estadio</label>
                  <select
                    value={formData.ID_ESTADIO}
                    onChange={(e) => handleFormChange('ID_ESTADIO', e.target.value)}
                    disabled={modoRapido}
                    className="form-input-plus"
                  >
                    <option value="">Seleccionar...</option>
                    {estadios.map(e => (
                      <option key={e.ID_ESTADIO} value={e.ID_ESTADIO}>
                        {e.NOMBRE}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group-plus">
                  <label>Fecha y Hora *</label>
                  <input
                    type="datetime-local"
                    value={formData.FECHA_PARTIDO}
                    onChange={(e) => handleFormChange('FECHA_PARTIDO', e.target.value)}
                    required
                    disabled={modoRapido}
                    className="form-input-plus"
                  />
                </div>

                <div className="form-group-plus">
                  <label>Goles Local</label>
                  <input
                    type="number"
                    value={formData.GOLES_LOCAL}
                    onChange={(e) => handleFormChange('GOLES_LOCAL', e.target.value)}
                    min="0"
                    className="form-input-plus"
                  />
                </div>

                <div className="form-group-plus">
                  <label>Goles Visita</label>
                  <input
                    type="number"
                    value={formData.GOLES_VISITA}
                    onChange={(e) => handleFormChange('GOLES_VISITA', e.target.value)}
                    min="0"
                    className="form-input-plus"
                  />
                </div>

                <div className="form-group-plus">
                  <label>Estado *</label>
                  <select
                    value={modoRapido ? 'FINALIZADO' : formData.ESTADO_PARTIDO}
                    onChange={(e) => handleFormChange('ESTADO_PARTIDO', e.target.value)}
                    required
                    disabled={modoRapido}
                    className="form-input-plus"
                  >
                    <option value="PROGRAMADO">PROGRAMADO</option>
                    <option value="EN_CURSO">EN CURSO</option>
                    <option value="FINALIZADO">FINALIZADO</option>
                    <option value="SUSPENDIDO">SUSPENDIDO</option>
                    <option value="CANCELADO">CANCELADO</option>
                  </select>
                  {modoRapido && (
                    <small className="modo-rapido-hint">
                      ⚡ Se marcará automáticamente como FINALIZADO
                    </small>
                  )}
                </div>
              </div>

              <div className="modal-footer-plus">
                <button type="button" onClick={cerrarModal} className="btn-cancelar-plus">
                  Cancelar
                </button>
                <button type="submit" className="btn-guardar-plus" disabled={loading}>
                  {loading ? 'Guardando...' : (partidoEditando ? 'Actualizar' : 'Crear')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      {showDeleteConfirm && (
        <div className="modal-overlay-plus" onClick={cancelarEliminacion}>
          <div className="modal-confirm-plus" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon-plus">⚠️</div>
            <h3>¿Eliminar Partido?</h3>
            <p>
              ¿Está seguro de que desea eliminar el partido entre{' '}
              <strong>{partidoAEliminar?.NOMBRE_EQUIPO_LOCAL}</strong> vs{' '}
              <strong>{partidoAEliminar?.NOMBRE_EQUIPO_VISITA}</strong>?
            </p>
            <p className="confirm-warning">Esta acción no se puede deshacer.</p>
            <div className="confirm-actions-plus">
              <button onClick={cancelarEliminacion} className="btn-cancelar-plus">
                Cancelar
              </button>
              <button onClick={eliminarPartido} className="btn-eliminar-confirm-plus" disabled={loading}>
                {loading ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartidosManagerPlus;
