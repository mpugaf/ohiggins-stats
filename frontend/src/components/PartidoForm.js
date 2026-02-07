// frontend/src/components/PartidoForm.js
import React, { useState, useEffect } from 'react';

const PartidoForm = ({ partido, torneos, equipos, estadios, loading, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    matchIdFbr: '',
    idTorneo: '',
    fechaPartido: '',
    numeroJornada: '',
    idEquipoLocal: '',
    idEquipoVisita: '',
    idEstadio: '',
    golesLocal: '',
    golesVisita: '',
    esCampoNeutro: false,
    arbitro: '',
    asistencia: '',
    clima: '',
    estadoPartido: 'PROGRAMADO'
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar datos del partido cuando se está editando
  useEffect(() => {
    if (partido) {
      setFormData({
        matchIdFbr: partido.MATCH_ID_FBR || '',
        idTorneo: partido.ID_TORNEO || '',
        fechaPartido: partido.FECHA_PARTIDO ?
          new Date(partido.FECHA_PARTIDO).toISOString().slice(0, 16) : '',
        numeroJornada: partido.NUMERO_JORNADA || '',
        idEquipoLocal: partido.ID_EQUIPO_LOCAL || '',
        idEquipoVisita: partido.ID_EQUIPO_VISITA || '',
        idEstadio: partido.ID_ESTADIO || '',
        golesLocal: partido.GOLES_LOCAL || '',
        golesVisita: partido.GOLES_VISITA || '',
        esCampoNeutro: partido.ES_CAMPO_NEUTRO === 1,
        arbitro: partido.ARBITRO || '',
        asistencia: partido.ASISTENCIA || '',
        clima: partido.CLIMA || '',
        estadoPartido: partido.ESTADO_PARTIDO || 'PROGRAMADO'
      });
    } else {
      // Resetear formulario para nuevo partido
      setFormData({
        matchIdFbr: '',
        idTorneo: '',
        fechaPartido: '',
        numeroJornada: '',
        idEquipoLocal: '',
        idEquipoVisita: '',
        idEstadio: '',
        golesLocal: '',
        golesVisita: '',
        esCampoNeutro: false,
        arbitro: '',
        asistencia: '',
        clima: '',
        estadoPartido: 'PROGRAMADO'
      });
    }
    setErrors({});
  }, [partido]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validaciones obligatorias
    if (!formData.matchIdFbr.trim()) {
      newErrors.matchIdFbr = 'El ID del partido es obligatorio';
    }

    if (!formData.idTorneo) {
      newErrors.idTorneo = 'Debe seleccionar un torneo';
    }

    if (!formData.fechaPartido) {
      newErrors.fechaPartido = 'La fecha del partido es obligatoria';
    }

    if (!formData.idEquipoLocal) {
      newErrors.idEquipoLocal = 'Debe seleccionar el equipo local';
    }

    if (!formData.idEquipoVisita) {
      newErrors.idEquipoVisita = 'Debe seleccionar el equipo visitante';
    }

    if (formData.idEquipoLocal === formData.idEquipoVisita) {
      newErrors.idEquipoVisita = 'El equipo local y visitante deben ser diferentes';
    }

    if (!formData.idEstadio) {
      newErrors.idEstadio = 'Debe seleccionar un estadio';
    }

    // Validar fecha no sea en el futuro muy lejano
    if (formData.fechaPartido) {
      const fechaPartido = new Date(formData.fechaPartido);
      const fechaLimite = new Date();
      fechaLimite.setFullYear(fechaLimite.getFullYear() + 2);
      
      if (fechaPartido > fechaLimite) {
        newErrors.fechaPartido = 'La fecha no puede ser muy lejana en el futuro';
      }
    }

    // Validar goles basado en el estado del partido
    if (formData.estadoPartido === 'FINALIZADO') {
      // Si el partido está FINALIZADO, los goles son obligatorios
      if (formData.golesLocal === '' || formData.golesLocal === null || formData.golesLocal === undefined) {
        newErrors.golesLocal = 'Los goles del equipo local son obligatorios para un partido finalizado';
      }
      if (formData.golesVisita === '' || formData.golesVisita === null || formData.golesVisita === undefined) {
        newErrors.golesVisita = 'Los goles del equipo visitante son obligatorios para un partido finalizado';
      }
    }

    // Validar que los goles sean números positivos si se proporcionan
    if (formData.golesLocal !== '' && formData.golesLocal !== null && formData.golesLocal !== undefined) {
      if (isNaN(formData.golesLocal) || parseInt(formData.golesLocal) < 0) {
        newErrors.golesLocal = 'Los goles deben ser un número positivo (0 o mayor)';
      }
    }

    if (formData.golesVisita !== '' && formData.golesVisita !== null && formData.golesVisita !== undefined) {
      if (isNaN(formData.golesVisita) || parseInt(formData.golesVisita) < 0) {
        newErrors.golesVisita = 'Los goles deben ser un número positivo (0 o mayor)';
      }
    }

    // Validar asistencia si se proporciona
    if (formData.asistencia && (isNaN(formData.asistencia) || parseInt(formData.asistencia) < 0)) {
      newErrors.asistencia = 'La asistencia debe ser un número positivo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Procesar goles: null si está vacío, 0 si es "0", o el valor numérico
      const procesarGoles = (valor) => {
        if (valor === '' || valor === null || valor === undefined) {
          return null;
        }
        const num = parseInt(valor);
        return isNaN(num) ? null : num;
      };

      const golesLocal = procesarGoles(formData.golesLocal);
      const golesVisita = procesarGoles(formData.golesVisita);

      // Respetar el estado seleccionado por el usuario
      // La validación ya se hizo antes (FINALIZADO requiere goles)
      const estadoFinal = formData.estadoPartido;

      // Preparar datos para enviar - enviar SOLO los campos que el backend espera
      const submitData = {
        matchIdFbr: formData.matchIdFbr,
        idTorneo: formData.idTorneo,
        fechaPartido: formData.fechaPartido,
        numeroJornada: formData.numeroJornada || null,
        idEquipoLocal: formData.idEquipoLocal,
        idEquipoVisita: formData.idEquipoVisita,
        idEstadio: formData.idEstadio,
        golesLocal,
        golesVisita,
        esCampoNeutro: formData.esCampoNeutro,
        arbitro: formData.arbitro || null,
        asistencia: formData.asistencia ? parseInt(formData.asistencia) : null,
        clima: formData.clima || null,
        estadoPartido: estadoFinal
      };

      console.log('📤 Enviando datos del partido:', submitData);

      if (partido) {
        await onSubmit(partido.ID_PARTIDO, submitData);
      } else {
        await onSubmit(submitData);
      }
    } catch (error) {
      console.error('Error en el formulario:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const obtenerNombreEquipo = (equipoId) => {
    const equipo = equipos.find(e => e.ID_EQUIPO === parseInt(equipoId));
    return equipo ? `${equipo.NOMBRE} ${equipo.APODO ? '(' + equipo.APODO + ')' : ''}` : '';
  };

  const obtenerNombreEstadio = (estadioId) => {
    const estadio = estadios.find(e => e.ID_ESTADIO === parseInt(estadioId));
    return estadio ? `${estadio.NOMBRE} - ${estadio.CIUDAD}` : '';
  };

  return (
    <div className="partido-form">
      <div className="form-header">
        <h2>{partido ? 'Editar Partido' : 'Nuevo Partido'}</h2>
        <p className="form-subtitle">
          {partido ? 'Modifica la información del partido' : 'Completa los datos del nuevo partido'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="form">
        <div className="form-grid">
          {/* Información básica del partido */}
          <div className="form-section">
            <h3>📋 Información Básica</h3>
            
            <div className="form-group">
              <label htmlFor="matchIdFbr" className="required">
                ID del Partido
              </label>
              <input
                type="text"
                id="matchIdFbr"
                name="matchIdFbr"
                value={formData.matchIdFbr}
                onChange={handleInputChange}
                className={errors.matchIdFbr ? 'error' : ''}
                placeholder="ID único del partido (ej: match_001)"
                disabled={!!partido} // No editable en modo edición
              />
              {errors.matchIdFbr && (
                <span className="error-message">{errors.matchIdFbr}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="idTorneo" className="required">
                Torneo
              </label>
              <select
                id="idTorneo"
                name="idTorneo"
                value={formData.idTorneo}
                onChange={handleInputChange}
                className={errors.idTorneo ? 'error' : ''}
              >
                <option value="">Seleccionar torneo...</option>
                {torneos.map(torneo => (
                  <option key={torneo.ID_TORNEO} value={torneo.ID_TORNEO}>
                    {torneo.NOMBRE} {torneo.TEMPORADA} - {torneo.RUEDA} rueda
                  </option>
                ))}
              </select>
              {errors.idTorneo && (
                <span className="error-message">{errors.idTorneo}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="fechaPartido" className="required">
                Fecha y Hora del Partido
              </label>
              <input
                type="datetime-local"
                id="fechaPartido"
                name="fechaPartido"
                value={formData.fechaPartido}
                onChange={handleInputChange}
                className={errors.fechaPartido ? 'error' : ''}
              />
              {errors.fechaPartido && (
                <span className="error-message">{errors.fechaPartido}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="numeroJornada">
                Número de Jornada/Fecha
              </label>
              <input
                type="number"
                id="numeroJornada"
                name="numeroJornada"
                value={formData.numeroJornada}
                onChange={handleInputChange}
                className={errors.numeroJornada ? 'error' : ''}
                placeholder="Ej: 1, 2, 3..."
                min="1"
              />
              {errors.numeroJornada && (
                <span className="error-message">{errors.numeroJornada}</span>
              )}
              <small style={{ color: '#6c757d', fontSize: '0.85rem', marginTop: '4px', display: 'block' }}>
                Ejemplo: Para la "Fecha 1" del torneo, ingresa 1
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="estadoPartido">
                Estado del Partido
              </label>
              <select
                id="estadoPartido"
                name="estadoPartido"
                value={formData.estadoPartido}
                onChange={handleInputChange}
              >
                <option value="PROGRAMADO">Programado</option>
                <option value="EN_CURSO">En Curso</option>
                <option value="FINALIZADO">Finalizado</option>
                <option value="SUSPENDIDO">Suspendido</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
              {formData.estadoPartido === 'FINALIZADO' && (
                <small style={{ color: '#007bff', fontSize: '0.85rem', marginTop: '4px', display: 'block' }}>
                  ℹ️ Los partidos finalizados requieren que se ingresen los goles (pueden ser 0)
                </small>
              )}
            </div>
          </div>

          {/* Equipos */}
          <div className="form-section">
            <h3>⚽ Equipos</h3>
            
            <div className="form-group">
              <label htmlFor="idEquipoLocal" className="required">
                Equipo Local
              </label>
              <select
                id="idEquipoLocal"
                name="idEquipoLocal"
                value={formData.idEquipoLocal}
                onChange={handleInputChange}
                className={errors.idEquipoLocal ? 'error' : ''}
              >
                <option value="">Seleccionar equipo local...</option>
                {equipos.map(equipo => (
                  <option key={equipo.ID_EQUIPO} value={equipo.ID_EQUIPO}>
                    {equipo.NOMBRE} {equipo.APODO && `(${equipo.APODO})`}
                  </option>
                ))}
              </select>
              {errors.idEquipoLocal && (
                <span className="error-message">{errors.idEquipoLocal}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="idEquipoVisita" className="required">
                Equipo Visitante
              </label>
              <select
                id="idEquipoVisita"
                name="idEquipoVisita"
                value={formData.idEquipoVisita}
                onChange={handleInputChange}
                className={errors.idEquipoVisita ? 'error' : ''}
              >
                <option value="">Seleccionar equipo visitante...</option>
                {equipos.map(equipo => (
                  <option key={equipo.ID_EQUIPO} value={equipo.ID_EQUIPO}>
                    {equipo.NOMBRE} {equipo.APODO && `(${equipo.APODO})`}
                  </option>
                ))}
              </select>
              {errors.idEquipoVisita && (
                <span className="error-message">{errors.idEquipoVisita}</span>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="golesLocal">
                  Goles Local {formData.estadoPartido === 'FINALIZADO' && <span style={{ color: 'red' }}>*</span>}
                </label>
                <input
                  type="number"
                  id="golesLocal"
                  name="golesLocal"
                  value={formData.golesLocal}
                  onChange={handleInputChange}
                  className={errors.golesLocal ? 'error' : ''}
                  min="0"
                  placeholder="0"
                />
                {errors.golesLocal && (
                  <span className="error-message">{errors.golesLocal}</span>
                )}
                {formData.estadoPartido === 'FINALIZADO' && !errors.golesLocal && (
                  <small style={{ color: '#dc3545', fontSize: '0.85rem', marginTop: '4px', display: 'block' }}>
                    Obligatorio para partidos finalizados (puede ser 0)
                  </small>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="golesVisita">
                  Goles Visitante {formData.estadoPartido === 'FINALIZADO' && <span style={{ color: 'red' }}>*</span>}
                </label>
                <input
                  type="number"
                  id="golesVisita"
                  name="golesVisita"
                  value={formData.golesVisita}
                  onChange={handleInputChange}
                  className={errors.golesVisita ? 'error' : ''}
                  min="0"
                  placeholder="0"
                />
                {errors.golesVisita && (
                  <span className="error-message">{errors.golesVisita}</span>
                )}
                {formData.estadoPartido === 'FINALIZADO' && !errors.golesVisita && (
                  <small style={{ color: '#dc3545', fontSize: '0.85rem', marginTop: '4px', display: 'block' }}>
                    Obligatorio para partidos finalizados (puede ser 0)
                  </small>
                )}
              </div>
            </div>

            <div className="form-group">
              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="esCampoNeutro"
                  name="esCampoNeutro"
                  checked={formData.esCampoNeutro}
                  onChange={handleInputChange}
                />
                <label htmlFor="esCampoNeutro">
                  Campo neutro
                </label>
              </div>
            </div>
          </div>

          {/* Detalles adicionales */}
          <div className="form-section">
            <h3>🏟️ Detalles del Partido</h3>
            
            <div className="form-group">
              <label htmlFor="idEstadio" className="required">
                Estadio
              </label>
              <select
                id="idEstadio"
                name="idEstadio"
                value={formData.idEstadio}
                onChange={handleInputChange}
                className={errors.idEstadio ? 'error' : ''}
              >
                <option value="">Seleccionar estadio...</option>
                {estadios.map(estadio => (
                  <option key={estadio.ID_ESTADIO} value={estadio.ID_ESTADIO}>
                    {estadio.NOMBRE} - {estadio.CIUDAD}
                    {estadio.CAPACIDAD && ` (${estadio.CAPACIDAD.toLocaleString()} personas)`}
                  </option>
                ))}
              </select>
              {errors.idEstadio && (
                <span className="error-message">{errors.idEstadio}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="arbitro">
                Árbitro
              </label>
              <input
                type="text"
                id="arbitro"
                name="arbitro"
                value={formData.arbitro}
                onChange={handleInputChange}
                placeholder="Nombre del árbitro principal"
                maxLength="100"
              />
            </div>

            <div className="form-group">
              <label htmlFor="asistencia">
                Asistencia
              </label>
              <input
                type="number"
                id="asistencia"
                name="asistencia"
                value={formData.asistencia}
                onChange={handleInputChange}
                className={errors.asistencia ? 'error' : ''}
                min="0"
                placeholder="Número de espectadores"
              />
              {errors.asistencia && (
                <span className="error-message">{errors.asistencia}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="clima">
                Clima
              </label>
              <select
                id="clima"
                name="clima"
                value={formData.clima}
                onChange={handleInputChange}
              >
                <option value="">Seleccionar clima...</option>
                <option value="SOLEADO">Soleado</option>
                <option value="NUBLADO">Nublado</option>
                <option value="LLUVIA">Lluvia</option>
                <option value="VIENTO">Viento</option>
                <option value="FRIO">Frío</option>
                <option value="CALOR">Calor</option>
              </select>
            </div>
          </div>
        </div>

        {/* Resumen del partido */}
        {(formData.idEquipoLocal && formData.idEquipoVisita && formData.idEstadio) && (
          <div className="partido-preview">
            <h4>🔍 Vista Previa del Partido</h4>
            <div className="preview-content">
              <div className="preview-enfrentamiento">
                <span className="equipo-local">{obtenerNombreEquipo(formData.idEquipoLocal)}</span>
                <span className="vs">vs</span>
                <span className="equipo-visita">{obtenerNombreEquipo(formData.idEquipoVisita)}</span>
              </div>
              {formData.fechaPartido && (
                <div className="preview-fecha">
                  📅 {new Date(formData.fechaPartido).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              )}
              <div className="preview-estadio">
                🏟️ {obtenerNombreEstadio(formData.idEstadio)}
              </div>
              {(formData.golesLocal !== '' || formData.golesVisita !== '') && (
                <div className="preview-resultado">
                  🏆 Resultado: {formData.golesLocal || 0} - {formData.golesVisita || 0}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting || loading}
          >
            {isSubmitting ? (
              <>
                <span className="spinner-small"></span>
                {partido ? 'Actualizando...' : 'Creando...'}
              </>
            ) : (
              partido ? 'Actualizar Partido' : 'Crear Partido'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PartidoForm;