import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  torneoJugadorService,
  playersService,
  torneosService,
  equiposService,
  handleResponse
} from '../services/apiService';
import TeamLogo from './common/TeamLogo';
import './AsignacionJugador.css';

// Hook personalizado para debounce
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

const AsignacionJugador = () => {
  const navigate = useNavigate();

  // Estados para listados
  const [asignaciones, setAsignaciones] = useState([]);
  const [jugadores, setJugadores] = useState([]);
  const [torneos, setTorneos] = useState([]);
  const [equipos, setEquipos] = useState([]);

  // Estados del formulario
  const [form, setForm] = useState({
    idJugador: '',
    idTorneo: '',
    idEquipo: '',
    numeroCamiseta: '',
    fechaIncorporacion: '',
    estado: 'ACTIVO'
  });

  // Estados de edición
  const [editando, setEditando] = useState(null);

  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Filtros
  const [searchTerm, setSearchTerm] = useState(''); // Término de búsqueda sin debounce
  const [filtroJugadorTexto, setFiltroJugadorTexto] = useState(''); // Filtro final con debounce
  const [filtroTorneo, setFiltroTorneo] = useState('');

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Estados para copiar asignación anterior
  const [mantenerEquipoActual, setMantenerEquipoActual] = useState(false);
  const [ultimaAsignacion, setUltimaAsignacion] = useState(null);

  // Debounce del searchTerm (espera 300ms después de que usuario deja de escribir)
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Actualizar filtro cuando cambia el debounced search
  useEffect(() => {
    setFiltroJugadorTexto(debouncedSearch);
    setCurrentPage(1); // Reset a página 1 cuando cambia el filtro
  }, [debouncedSearch]);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);

      console.log('🔄 Cargando datos para AsignacionJugador...');

      const [asignacionesRes, jugadoresRes, torneosRes, equiposRes] = await Promise.all([
        torneoJugadorService.getAsignaciones().then(handleResponse),
        playersService.getAll().then(handleResponse),
        torneosService.getAll().then(handleResponse),
        equiposService.getAll().then(handleResponse)
      ]);

      console.log('📊 Datos cargados:', {
        asignaciones: asignacionesRes,
        jugadores: jugadoresRes,
        torneos: torneosRes,
        equipos: equiposRes
      });

      setAsignaciones(asignacionesRes.asignaciones || []);
      setJugadores(jugadoresRes || []);
      setTorneos(torneosRes || []);
      setEquipos(equiposRes || []);

      console.log('✅ Estados actualizados:', {
        totalJugadores: jugadoresRes?.length || 0,
        totalTorneos: torneosRes?.length || 0,
        totalEquipos: equiposRes?.length || 0,
        totalAsignaciones: asignacionesRes?.asignaciones?.length || 0
      });

      // DEBUG: Verificar estructura de torneos
      if (torneosRes && torneosRes.length > 0) {
        console.log('🔍 DEBUG - Primer torneo:', torneosRes[0]);
        console.log('  Tiene ID_TORNEO?', 'ID_TORNEO' in torneosRes[0]);
        console.log('  Tiene id?', 'id' in torneosRes[0]);
        console.log('  Valor de ID_TORNEO:', torneosRes[0].ID_TORNEO);
        console.log('  Valor de id:', torneosRes[0].id);
      }

    } catch (err) {
      console.error('❌ Error cargando datos:', err);
      setError('Error al cargar los datos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const cargarUltimaAsignacion = async (idJugador) => {
    try {
      const response = await torneoJugadorService.getUltimaAsignacion(idJugador);
      const data = await handleResponse(response);
      setUltimaAsignacion(data.asignacion);
      console.log('📋 Última asignación del jugador:', data.asignacion);
    } catch (err) {
      // Si no tiene asignaciones previas, es normal
      console.log('ℹ️ Jugador sin asignaciones previas');
      setUltimaAsignacion(null);
      setMantenerEquipoActual(false);
    }
  };

  const handleJugadorChange = async (e) => {
    const idJugador = e.target.value;
    setForm({ ...form, idJugador });

    // Si seleccionó un jugador, cargar su última asignación
    if (idJugador && !editando) {
      await cargarUltimaAsignacion(idJugador);
    } else {
      setUltimaAsignacion(null);
      setMantenerEquipoActual(false);
    }
  };

  const handleMantenerEquipoChange = async (e) => {
    const checked = e.target.checked;
    setMantenerEquipoActual(checked);

    if (checked && ultimaAsignacion) {
      console.log('📋 Última asignación:', ultimaAsignacion);
      console.log('📋 Torneos disponibles:', torneos);

      // Obtener año actual
      const añoActual = new Date().getFullYear().toString();
      console.log(`📅 Año actual: ${añoActual}`);

      // Buscar torneos del año actual que sean posteriores a la última asignación
      const torneosDisponibles = torneos
        .filter(t => {
          console.log(`Evaluando torneo: ${t.NOMBRE} ${t.TEMPORADA} ${t.RUEDA}`);

          // Si el jugador está asignado a un torneo de año anterior, buscar del año actual
          if (parseInt(ultimaAsignacion.torneo_temporada) < parseInt(añoActual)) {
            const esAñoActual = t.TEMPORADA === añoActual;
            console.log(`  ${esAñoActual ? '✅' : '❌'} Temporada ${t.TEMPORADA} ${esAñoActual ? '==' : '!='} ${añoActual}`);
            return esAñoActual;
          }

          // Si ya está en el año actual, buscar siguiente torneo cronológicamente
          if (t.TEMPORADA > ultimaAsignacion.torneo_temporada) {
            console.log(`  ✅ Temporada posterior: ${t.TEMPORADA} > ${ultimaAsignacion.torneo_temporada}`);
            return true;
          }
          if (t.TEMPORADA === ultimaAsignacion.torneo_temporada) {
            // Si es la misma temporada, comparar por rueda
            const ordenRuedas = { 'PRIMERA': 1, 'SEGUNDA': 2, 'UNICA': 3 };
            const ordenActual = ordenRuedas[ultimaAsignacion.torneo_rueda];
            const ordenNuevo = ordenRuedas[t.RUEDA];
            console.log(`  Misma temporada: comparando ruedas ${t.RUEDA}(${ordenNuevo}) vs ${ultimaAsignacion.torneo_rueda}(${ordenActual})`);
            return ordenNuevo > ordenActual;
          }
          console.log(`  ❌ Temporada anterior: ${t.TEMPORADA} < ${añoActual}`);
          return false;
        })
        .sort((a, b) => {
          // Ordenar por temporada y luego por rueda
          if (a.TEMPORADA !== b.TEMPORADA) return a.TEMPORADA.localeCompare(b.TEMPORADA);
          const ordenRuedas = { 'PRIMERA': 1, 'SEGUNDA': 2, 'UNICA': 3 };
          return ordenRuedas[a.RUEDA] - ordenRuedas[b.RUEDA];
        });

      console.log('🎯 Torneos disponibles filtrados:', torneosDisponibles);

      if (torneosDisponibles.length === 0) {
        setError('No se encontró un torneo siguiente para crear la asignación automática.');
        setMantenerEquipoActual(false);
        return;
      }

      const siguienteTorneo = torneosDisponibles[0];
      console.log('✅ Siguiente torneo seleccionado:', siguienteTorneo);

      // Mostrar mensaje de confirmación
      const confirmar = window.confirm(
        `¿Deseas crear automáticamente la asignación del jugador en "${ultimaAsignacion.equipo_nombre}" para el torneo "${siguienteTorneo.NOMBRE} ${siguienteTorneo.TEMPORADA} - ${siguienteTorneo.RUEDA}"?\n\n` +
        `Se mantendrán:\n` +
        `- Equipo: ${ultimaAsignacion.equipo_nombre}\n` +
        `- Número de camiseta: ${ultimaAsignacion.NUMERO_CAMISETA || 'Sin número'}\n` +
        `- Fecha de incorporación: ${ultimaAsignacion.FECHA_INCORPORACION ? new Date(ultimaAsignacion.FECHA_INCORPORACION).toLocaleDateString('es-CL') : 'Sin fecha'}\n` +
        `- Estado: ${ultimaAsignacion.ESTADO}`
      );

      if (!confirmar) {
        setMantenerEquipoActual(false);
        return;
      }

      // Crear la asignación automáticamente
      try {
        setLoading(true);
        setError('');

        // Obtener ID del torneo (puede venir como 'id' o 'ID_TORNEO')
        const torneoId = siguienteTorneo.ID_TORNEO || siguienteTorneo.id;

        // Validar que siguienteTorneo esté definido y tenga ID
        if (!siguienteTorneo || !torneoId) {
          console.error('❌ Siguiente torneo sin ID:', siguienteTorneo);
          throw new Error('No se pudo obtener el ID del siguiente torneo');
        }

        const data = {
          idJugador: parseInt(form.idJugador, 10),
          idTorneo: parseInt(torneoId, 10),
          idEquipo: parseInt(ultimaAsignacion.ID_EQUIPO, 10),
          numeroCamiseta: ultimaAsignacion.NUMERO_CAMISETA ? parseInt(ultimaAsignacion.NUMERO_CAMISETA, 10) : null,
          fechaIncorporacion: ultimaAsignacion.FECHA_INCORPORACION ?
            ultimaAsignacion.FECHA_INCORPORACION.split('T')[0] : null,
          estado: ultimaAsignacion.ESTADO || 'ACTIVO'
        };

        console.log('🤖 CREACIÓN AUTOMÁTICA - Datos enviados:', data);
        console.log('  - idJugador:', data.idJugador, typeof data.idJugador);
        console.log('  - idTorneo:', data.idTorneo, typeof data.idTorneo);
        console.log('  - idEquipo:', data.idEquipo, typeof data.idEquipo);

        // Validar que todos los IDs sean números válidos
        if (isNaN(data.idJugador) || isNaN(data.idTorneo) || isNaN(data.idEquipo)) {
          throw new Error('Error en la conversión de IDs a números');
        }

        const response = await torneoJugadorService.crearAsignacion(data);
        const result = await handleResponse(response);

        setSuccessMessage(
          `✅ ¡Asignación creada automáticamente!\n` +
          `${ultimaAsignacion.jugador_nombre || 'Jugador'} continúa en ${ultimaAsignacion.equipo_nombre} para ${siguienteTorneo.NOMBRE} ${siguienteTorneo.TEMPORADA}`
        );

        // Recargar datos
        await cargarDatos();

        // Limpiar formulario
        setForm({
          idJugador: '',
          idTorneo: '',
          idEquipo: '',
          numeroCamiseta: '',
          fechaIncorporacion: '',
          estado: 'ACTIVO'
        });
        setMantenerEquipoActual(false);
        setUltimaAsignacion(null);

        setTimeout(() => setSuccessMessage(''), 5000);

      } catch (err) {
        console.error('❌ Error en creación automática:', err);
        setError(err.message || 'Error al crear asignación automática');
        setMantenerEquipoActual(false);
      } finally {
        setLoading(false);
      }

    } else {
      // Desmarcar checkbox - limpiar campos
      setForm({
        ...form,
        idEquipo: '',
        numeroCamiseta: '',
        fechaIncorporacion: '',
        estado: 'ACTIVO',
        idTorneo: ''
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validación mejorada
    if (!form.idJugador || form.idJugador === '') {
      setError('Debe seleccionar un jugador');
      return;
    }

    if (!form.idTorneo || form.idTorneo === '') {
      setError('Debe seleccionar un torneo');
      return;
    }

    if (!form.idEquipo || form.idEquipo === '') {
      setError('Debe seleccionar un equipo');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Log valores del formulario ANTES de parsear
      console.log('🔍 DEBUG - Valores del formulario:');
      console.log('  form.idJugador:', form.idJugador, typeof form.idJugador);
      console.log('  form.idTorneo:', form.idTorneo, typeof form.idTorneo);
      console.log('  form.idEquipo:', form.idEquipo, typeof form.idEquipo);
      console.log('  form.numeroCamiseta:', form.numeroCamiseta, typeof form.numeroCamiseta);
      console.log('  form.fechaIncorporacion:', form.fechaIncorporacion, typeof form.fechaIncorporacion);
      console.log('  form.estado:', form.estado);

      const data = {
        idJugador: parseInt(form.idJugador, 10),
        idTorneo: parseInt(form.idTorneo, 10),
        idEquipo: parseInt(form.idEquipo, 10),
        numeroCamiseta: form.numeroCamiseta ? parseInt(form.numeroCamiseta, 10) : null,
        fechaIncorporacion: form.fechaIncorporacion || null,
        estado: form.estado
      };

      // Verificar que los parseInt fueron exitosos con mensajes específicos
      if (isNaN(data.idJugador)) {
        console.error('❌ ID Jugador no es un número válido:', form.idJugador);
        setError('Error: ID de jugador inválido. Por favor seleccione un jugador.');
        setLoading(false);
        return;
      }

      if (isNaN(data.idTorneo)) {
        console.error('❌ ID Torneo no es un número válido:', form.idTorneo);
        setError('Error: ID de torneo inválido. Por favor seleccione un torneo.');
        setLoading(false);
        return;
      }

      if (isNaN(data.idEquipo)) {
        console.error('❌ ID Equipo no es un número válido:', form.idEquipo);
        setError('Error: ID de equipo inválido. Por favor seleccione un equipo.');
        setLoading(false);
        return;
      }

      console.log('📤 FRONTEND - Enviando datos al backend:');
      console.log('  Jugador ID:', data.idJugador);
      console.log('  Torneo ID:', data.idTorneo);
      console.log('  Equipo ID:', data.idEquipo);
      console.log('  Número Camiseta:', data.numeroCamiseta);
      console.log('  Fecha Incorporación:', data.fechaIncorporacion);
      console.log('  Estado:', data.estado);
      console.log('  Mantener Equipo Actual:', mantenerEquipoActual);
      if (ultimaAsignacion) {
        console.log('  Última Asignación Torneo:', ultimaAsignacion.ID_TORNEO);
        console.log('  Última Asignación Equipo:', ultimaAsignacion.ID_EQUIPO);
      }

      if (editando) {
        await torneoJugadorService.actualizarAsignacion(editando, {
          idEquipo: data.idEquipo,
          numeroCamiseta: data.numeroCamiseta,
          fechaIncorporacion: data.fechaIncorporacion,
          estado: data.estado
        }).then(handleResponse);
        setSuccessMessage('Asignación actualizada exitosamente');
        setEditando(null);
      } else {
        const response = await torneoJugadorService.crearAsignacion(data);
        const result = await handleResponse(response);

        if (result.esReasignacion) {
          setSuccessMessage('⚠️ Jugador reasignado exitosamente al nuevo equipo (se actualizó la asignación existente)');
        } else if (mantenerEquipoActual && ultimaAsignacion) {
          setSuccessMessage(`✅ Asignación creada exitosamente. El jugador continúa en ${ultimaAsignacion.equipo_nombre} para el nuevo torneo.`);
        } else {
          setSuccessMessage('✅ Asignación creada exitosamente');
        }
      }

      // Limpiar formulario y estados adicionales
      setForm({
        idJugador: '',
        idTorneo: '',
        idEquipo: '',
        numeroCamiseta: '',
        fechaIncorporacion: '',
        estado: 'ACTIVO'
      });
      setMantenerEquipoActual(false);
      setUltimaAsignacion(null);

      await cargarDatos();

      setTimeout(() => setSuccessMessage(''), 3000);

    } catch (err) {
      console.error('Error guardando asignación:', err);
      setError(err.message || 'Error al guardar asignación');
    } finally {
      setLoading(false);
    }
  };

  const handleEditar = (asignacion) => {
    setEditando(asignacion.ID_TORNEO_JUGADOR);
    setForm({
      idJugador: asignacion.ID_JUGADOR,
      idTorneo: asignacion.ID_TORNEO,
      idEquipo: asignacion.ID_EQUIPO,
      numeroCamiseta: asignacion.NUMERO_CAMISETA || '',
      fechaIncorporacion: asignacion.FECHA_INCORPORACION ? asignacion.FECHA_INCORPORACION.split('T')[0] : '',
      estado: asignacion.ESTADO || 'ACTIVO'
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar esta asignación?')) {
      return;
    }

    try {
      setLoading(true);
      await torneoJugadorService.eliminarAsignacion(id).then(handleResponse);
      setSuccessMessage('Asignación eliminada exitosamente');
      await cargarDatos();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error eliminando asignación:', err);
      setError(err.message || 'Error al eliminar asignación');
    } finally {
      setLoading(false);
    }
  };

  const cancelarEdicion = () => {
    setEditando(null);
    setMantenerEquipoActual(false);
    setUltimaAsignacion(null);
    setForm({
      idJugador: '',
      idTorneo: '',
      idEquipo: '',
      numeroCamiseta: '',
      fechaIncorporacion: '',
      estado: 'ACTIVO'
    });
  };

  // ✅ OPTIMIZACIÓN: Filtrado con useMemo (solo re-ejecuta si cambian dependencias)
  const asignacionesFiltradas = useMemo(() => {
    console.log('🔍 Filtrando asignaciones...');
    return asignaciones.filter(a => {
      // Filtro por texto de jugador (busca en nombre y apodo)
      const matchJugador = !filtroJugadorTexto ||
        a.jugador_nombre.toLowerCase().includes(filtroJugadorTexto.toLowerCase()) ||
        (a.jugador_apodo && a.jugador_apodo.toLowerCase().includes(filtroJugadorTexto.toLowerCase()));

      const matchTorneo = !filtroTorneo || a.ID_TORNEO === parseInt(filtroTorneo);
      return matchJugador && matchTorneo;
    });
  }, [asignaciones, filtroJugadorTexto, filtroTorneo]);

  // ✅ OPTIMIZACIÓN: Paginación (solo renderiza items de la página actual)
  const asignacionesPaginadas = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return asignacionesFiltradas.slice(startIndex, endIndex);
  }, [asignacionesFiltradas, currentPage]);

  const totalPages = Math.ceil(asignacionesFiltradas.length / itemsPerPage);

  const getNombreJugador = (idJugador) => {
    const jugador = jugadores.find(j => j.ID_JUGADOR === idJugador);
    return jugador ? `${jugador.NOMBRE_COMPLETO}${jugador.APODO ? ` "${jugador.APODO}"` : ''}` : 'Jugador desconocido';
  };

  return (
    <div className="asignacion-jugador-container">
      <div className="page-header">
        <h1>⚽ Asignaciones Jugador-Torneo-Equipo</h1>
        <p>Gestiona en qué equipo juega cada jugador en cada torneo</p>

        <button
          onClick={() => navigate('/asignacion-masiva')}
          style={{
            marginTop: '15px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.3)';
          }}
        >
          ⚡ Asignación Masiva (Varios Torneos)
        </button>
      </div>

      {/* Mensajes */}
      {error && (
        <div className="alert alert-error">
          ❌ {error}
          <button onClick={() => setError('')} className="close-btn">×</button>
        </div>
      )}

      {successMessage && (
        <div className="alert alert-success">
          ✅ {successMessage}
        </div>
      )}

      {/* Formulario de Asignación */}
      <div className="form-card">
        <div className="form-card-header">
          <h2>{editando ? '✏️ Editar Asignación' : '➕ Nueva Asignación'}</h2>
          {editando && (
            <button onClick={cancelarEdicion} className="btn-cancel-edit">
              ❌ Cancelar edición
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="asignacion-form">
          {/* Checkbox para mantener equipo actual - CREACIÓN AUTOMÁTICA */}
          {!editando && ultimaAsignacion && (
            <div className="alert alert-success" style={{ marginBottom: '15px', padding: '15px', background: 'linear-gradient(135deg, #d4edda 0%, #c3f0d4 100%)', border: '2px solid #28a745' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', margin: 0, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={mantenerEquipoActual}
                  onChange={handleMantenerEquipoChange}
                  style={{ width: '20px', height: '20px', cursor: 'pointer', marginTop: '2px' }}
                  disabled={loading}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#155724', marginBottom: '5px' }}>
                    🤖 Crear Asignación Automática al Siguiente Torneo
                  </div>
                  <div style={{ fontSize: '13px', color: '#155724', lineHeight: '1.5' }}>
                    Mantener a <strong>{ultimaAsignacion.jugador_nombre || 'este jugador'}</strong> en <strong>{ultimaAsignacion.equipo_nombre}</strong> con los mismos datos
                    (última asignación: {ultimaAsignacion.torneo_nombre} {ultimaAsignacion.torneo_temporada} - {ultimaAsignacion.torneo_rueda})
                  </div>
                  <div style={{ fontSize: '12px', color: '#0c5028', marginTop: '8px', fontStyle: 'italic' }}>
                    ℹ️ Al marcar esta opción se creará automáticamente la asignación en el siguiente torneo disponible
                  </div>
                </div>
              </label>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>👤 Jugador *</label>
              <select
                value={form.idJugador}
                onChange={handleJugadorChange}
                required
                disabled={loading || editando}
              >
                <option value="">
                  {loading ? 'Cargando jugadores...' :
                   jugadores.length === 0 ? 'No hay jugadores disponibles' :
                   '-- Seleccione un jugador --'}
                </option>
                {jugadores.map(j => (
                  <option key={j.ID_JUGADOR} value={j.ID_JUGADOR}>
                    {j.NOMBRE_COMPLETO} {j.APODO && `"${j.APODO}"`}
                  </option>
                ))}
              </select>
              {jugadores.length === 0 && !loading && (
                <small style={{color: '#dc3545', marginTop: '5px', display: 'block'}}>
                  No se encontraron jugadores en la base de datos
                </small>
              )}
            </div>

            <div className="form-group">
              <label>🏆 Torneo *</label>
              <select
                value={form.idTorneo}
                onChange={(e) => setForm({ ...form, idTorneo: e.target.value })}
                required
                disabled={loading || editando}
              >
                <option value="">-- Seleccione un torneo --</option>
                {torneos.map(t => {
                  const torneoId = t.ID_TORNEO || t.id; // Manejar ambos formatos
                  return (
                    <option key={torneoId} value={torneoId}>
                      {t.NOMBRE} {t.TEMPORADA} - {t.RUEDA}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="form-group">
              <label>⚽ Equipo *</label>
              <select
                value={form.idEquipo}
                onChange={(e) => setForm({ ...form, idEquipo: e.target.value })}
                required
                disabled={loading || mantenerEquipoActual}
              >
                <option value="">-- Seleccione un equipo --</option>
                {equipos.map(e => {
                  const equipoId = e.ID_EQUIPO || e.id; // Manejar ambos formatos
                  return (
                    <option key={equipoId} value={equipoId}>
                      {e.NOMBRE} {e.APODO && `(${e.APODO})`}
                    </option>
                  );
                })}
              </select>
              {mantenerEquipoActual && (
                <small style={{color: '#28a745', marginTop: '5px', display: 'block', fontStyle: 'italic'}}>
                  ✓ Usando equipo actual: {ultimaAsignacion?.equipo_nombre}
                </small>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>👕 Número Camiseta</label>
              <input
                type="number"
                min="1"
                max="99"
                value={form.numeroCamiseta}
                onChange={(e) => setForm({ ...form, numeroCamiseta: e.target.value })}
                placeholder="Ej: 10"
                disabled={loading}
              />
              {mantenerEquipoActual && form.numeroCamiseta && (
                <small style={{color: '#28a745', marginTop: '5px', display: 'block', fontStyle: 'italic'}}>
                  ✓ Número copiado de asignación anterior
                </small>
              )}
            </div>

            <div className="form-group">
              <label>📅 Fecha Incorporación</label>
              <input
                type="date"
                value={form.fechaIncorporacion}
                onChange={(e) => setForm({ ...form, fechaIncorporacion: e.target.value })}
                disabled={loading}
              />
              {mantenerEquipoActual && form.fechaIncorporacion && (
                <small style={{color: '#28a745', marginTop: '5px', display: 'block', fontStyle: 'italic'}}>
                  ✓ Fecha original del jugador en este equipo
                </small>
              )}
            </div>

            <div className="form-group">
              <label>📊 Estado</label>
              <select
                value={form.estado}
                onChange={(e) => setForm({ ...form, estado: e.target.value })}
                disabled={loading}
              >
                <option key="ACTIVO" value="ACTIVO">✅ Activo</option>
                <option key="CEDIDO" value="CEDIDO">🔄 Cedido</option>
                <option key="LESIONADO" value="LESIONADO">🤕 Lesionado</option>
                <option key="SUSPENDIDO" value="SUSPENDIDO">🚫 Suspendido</option>
                <option key="INACTIVO" value="INACTIVO">⭕ Inactivo</option>
              </select>
              {mantenerEquipoActual && (
                <small style={{color: '#28a745', marginTop: '5px', display: 'block', fontStyle: 'italic'}}>
                  ✓ Estado copiado (puede modificar si es necesario)
                </small>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? '⏳ Guardando...' : editando ? '💾 Actualizar Asignación' : '✅ Crear Asignación'}
            </button>
          </div>
        </form>
      </div>

      {/* Filtros */}
      <div className="filters-card">
        <h3>🔍 Filtros</h3>
        <div className="filters-row">
          <div className="filter-group">
            <label>🔎 Buscar Jugador:</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre o apodo..."
            />
            {searchTerm && (
              <small style={{color: '#6c757d', marginTop: '5px', display: 'block', fontStyle: 'italic'}}>
                Mostrando resultados para: "{filtroJugadorTexto}"
              </small>
            )}
          </div>

          <div className="filter-group">
            <label>Torneo:</label>
            <select value={filtroTorneo} onChange={(e) => setFiltroTorneo(e.target.value)}>
              <option value="">Todos los torneos</option>
              {torneos.map(t => (
                <option key={t.ID_TORNEO} value={t.ID_TORNEO}>
                  {t.NOMBRE} {t.TEMPORADA}
                </option>
              ))}
            </select>
          </div>

          {(filtroJugadorTexto || filtroTorneo) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFiltroJugadorTexto('');
                setFiltroTorneo('');
                setCurrentPage(1);
              }}
              className="btn-clear-filters"
            >
              🔄 Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Tabla de Asignaciones */}
      <div className="table-card">
        <div className="table-card-header">
          <h2>📋 Asignaciones Actuales ({asignacionesFiltradas.length})</h2>
          <button onClick={cargarDatos} className="btn-refresh" disabled={loading}>
            🔄 Refrescar
          </button>
        </div>

        {loading && <div className="loading-indicator">⏳ Cargando...</div>}

        {!loading && asignacionesFiltradas.length === 0 && (
          <div className="empty-state">
            <p>No hay asignaciones para mostrar</p>
            {(filtroJugadorTexto || filtroTorneo) && <p className="hint">Intenta ajustar los filtros</p>}
          </div>
        )}

        {!loading && asignacionesFiltradas.length > 0 && (
          <>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Jugador</th>
                    <th>Torneo</th>
                    <th>Equipo</th>
                    <th>Camiseta</th>
                    <th>Incorporación</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {asignacionesPaginadas.map(asignacion => (
                  <tr key={asignacion.ID_TORNEO_JUGADOR}>
                    <td className="jugador-cell">
                      <div className="jugador-info">
                        <strong>{asignacion.jugador_nombre}</strong>
                        {asignacion.jugador_apodo && (
                          <span className="jugador-apodo">"{asignacion.jugador_apodo}"</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="torneo-info">
                        <strong>{asignacion.torneo_nombre}</strong>
                        <span className="torneo-meta">
                          {asignacion.torneo_temporada} - {asignacion.torneo_rueda}
                        </span>
                      </div>
                    </td>
                    <td className="equipo-cell">
                      <div className="equipo-info">
                        <TeamLogo
                          imagen={asignacion.equipo_imagen}
                          nombreEquipo={asignacion.equipo_nombre}
                          size="small"
                        />
                        <div className="equipo-texto">
                          <strong>{asignacion.equipo_nombre}</strong>
                          {asignacion.equipo_apodo && (
                            <span className="equipo-apodo">({asignacion.equipo_apodo})</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="text-center">
                      {asignacion.NUMERO_CAMISETA ? (
                        <span className="camiseta-badge">#{asignacion.NUMERO_CAMISETA}</span>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td>
                      {asignacion.FECHA_INCORPORACION
                        ? new Date(asignacion.FECHA_INCORPORACION).toLocaleDateString('es-CL')
                        : '-'}
                    </td>
                    <td>
                      <span className={`estado-badge estado-${asignacion.ESTADO.toLowerCase()}`}>
                        {asignacion.ESTADO}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <button
                        onClick={() => handleEditar(asignacion)}
                        className="btn-action btn-edit"
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleEliminar(asignacion.ID_TORNEO_JUGADOR)}
                        className="btn-action btn-delete"
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

          {/* Controles de Paginación */}
          {totalPages > 1 && (
            <div className="pagination-controls">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="btn-pagination"
              >
                ← Anterior
              </button>

              <div className="pagination-info">
                <span className="page-numbers">
                  Página {currentPage} de {totalPages}
                </span>
                <span className="results-info">
                  Mostrando {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, asignacionesFiltradas.length)} de {asignacionesFiltradas.length}
                </span>
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="btn-pagination"
              >
                Siguiente →
              </button>
            </div>
          )}
          </>
        )}
      </div>

      {/* Historial por jugador - Solo cuando hay UNA asignación filtrada */}
      {asignacionesFiltradas.length > 0 && asignacionesFiltradas.length <= 5 &&
       (filtroJugadorTexto || filtroTorneo) && (
        <div className="historial-card">
          <h3>📊 Historial Filtrado ({asignacionesFiltradas.length} asignaciones)</h3>
          <div className="historial-timeline">
            {asignacionesFiltradas.map(a => (
              <div key={a.ID_TORNEO_JUGADOR} className="timeline-item">
                <div className="timeline-marker"></div>
                <div className="timeline-content">
                  <div className="timeline-header">
                    <span className="timeline-torneo">{a.torneo_nombre} {a.torneo_temporada}</span>
                    <span className={`estado-badge estado-${a.ESTADO.toLowerCase()}`}>{a.ESTADO}</span>
                  </div>
                  <div className="timeline-equipo">
                    <TeamLogo imagen={a.equipo_imagen} nombreEquipo={a.equipo_nombre} size="small" />
                    <span><strong>{a.equipo_nombre}</strong> {a.equipo_apodo && `(${a.equipo_apodo})`}</span>
                    {a.NUMERO_CAMISETA && <span className="camiseta-badge">#{a.NUMERO_CAMISETA}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AsignacionJugador;
