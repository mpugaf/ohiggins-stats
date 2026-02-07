// frontend/src/components/PlayerForm.js - CORREGIDO
import React, { useState, useEffect } from 'react';

const PlayerForm = ({ player, countries, positions, teams, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    player_id_fbr: '',
    nombre_completo: '',
    apodo: '',
    fecha_nacimiento: '',
    pie_dominante: '',
    equipo_id: '',
    nacionalidades: [],
    posiciones: []
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Función para mapear valores de BD (inglés) a Frontend (español)
  const mapearPieDominanteParaFormulario = (valorBD) => {
    const mapeo = {
      'LEFT': 'IZQUIERDO',
      'RIGHT': 'DERECHO', 
      'BOTH': 'AMBIDIESTRO'
    };
    return mapeo[valorBD] || '';
  };

  // Función para mapear valores de Frontend (español) a BD (inglés)
  const mapearPieDominanteParaBD = (valorFormulario) => {
    const mapeo = {
      'IZQUIERDO': 'LEFT',
      'DERECHO': 'RIGHT',
      'AMBIDIESTRO': 'BOTH'
    };
    return mapeo[valorFormulario] || null;
  };

  // Cargar datos del jugador cuando se está editando
  useEffect(() => {
    if (player) {
      console.log('🔍 Cargando datos del jugador para edición:', player);
      
      // CORRECCIÓN 1: Mapear pie dominante de BD (inglés) a formulario (español)
      let pieDominante = '';
      if (player.PIE_DOMINANTE) {
        const valorBD = player.PIE_DOMINANTE.toString().trim().toUpperCase();
        pieDominante = mapearPieDominanteParaFormulario(valorBD);
      }

      console.log('👣 Pie dominante BD (inglés):', `"${player.PIE_DOMINANTE}"` || 'null');
      console.log('👣 Pie dominante form (español):', `"${pieDominante}"`);

      setFormData({
        player_id_fbr: player.PLAYER_ID_FBR || '',
        nombre_completo: player.NOMBRE_COMPLETO || '',
        apodo: player.APODO || '',
        fecha_nacimiento: player.FECHA_NACIMIENTO ? player.FECHA_NACIMIENTO.split('T')[0] : '',
        pie_dominante: pieDominante, // ← CORREGIDO: valor mapeado a español
        equipo_id: player.equipo_id || '',
        nacionalidades: player.nacionalidades?.map(n => n.codigo) || [],
        posiciones: player.posiciones?.map(p => p.codigo) || []
      });
    } else {
      // Resetear formulario para nuevo jugador
      setFormData({
        player_id_fbr: '',
        nombre_completo: '',
        apodo: '',
        fecha_nacimiento: '',
        pie_dominante: '',
        equipo_id: '',
        nacionalidades: [],
        posiciones: []
      });
    }
    setErrors({});
  }, [player]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleMultiSelectChange = (name, value) => {
    const currentValues = formData[name];
    let newValues;

    if (currentValues.includes(value)) {
      // Remover si ya está seleccionado
      newValues = currentValues.filter(item => item !== value);
    } else {
      // Agregar si no está seleccionado
      newValues = [...currentValues, value];
    }

    setFormData(prev => ({
      ...prev,
      [name]: newValues
    }));

    // Limpiar error del campo
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
    if (!formData.player_id_fbr.trim()) {
      newErrors.player_id_fbr = 'El Player ID FBR es obligatorio';
    }

    if (!formData.nombre_completo.trim()) {
      newErrors.nombre_completo = 'El nombre completo es obligatorio';
    }

    // Validar fecha de nacimiento
    if (formData.fecha_nacimiento) {
      const birthDate = new Date(formData.fecha_nacimiento);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      if (age < 15 || age > 50) {
        newErrors.fecha_nacimiento = 'La edad debe estar entre 15 y 50 años';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Solo mostrar spinner para creaciones, no para actualizaciones
    const esActualizacion = !!player;
    if (!esActualizacion) {
      setIsSubmitting(true);
    }

    try {
      // CORRECCIÓN 2: Mapear pie dominante de español a inglés antes de enviar
      const pieDominanteParaBD = mapearPieDominanteParaBD(formData.pie_dominante);
      
      // Preparar datos para enviar
      const submitData = {
        ...formData,
        apodo: formData.apodo || null,
        fecha_nacimiento: formData.fecha_nacimiento || null,
        pie_dominante: pieDominanteParaBD, // ← CORREGIDO: valor mapeado a inglés
        equipo_id: formData.equipo_id || null
      };

      console.log('📝 Datos formulario (español):', formData);
      console.log('📝 Datos para BD (inglés):', submitData);
      console.log('👣 Mapeo pie dominante:', `"${formData.pie_dominante}" → "${pieDominanteParaBD}"`);

      if (player) {
        // Para actualización: pasar ID y datos separadamente (SIN spinner)
        await onSubmit(player.ID_JUGADOR, submitData);
      } else {
        // Para creación: pasar solo datos (CON spinner)
        await onSubmit(submitData);
      }

    } catch (error) {
      console.error('❌ Error en el formulario:', error);
      alert('Error al enviar el formulario: ' + error.message);
    } finally {
      // Solo quitar spinner si estaba activo (solo para creaciones)
      if (!esActualizacion) {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="player-form-container">
      <div className="form-header">
        <h2>{player ? '✏️ Editar Jugador' : '➕ Nuevo Jugador'}</h2>
        <p className="form-subtitle">
          {player ? 'Modifica la información del jugador' : 'Completa los datos del nuevo jugador'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="standard-form">
        {/* Información Básica */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="player_id_fbr" className="required">
              Player ID FBR
            </label>
            <input
              type="text"
              id="player_id_fbr"
              name="player_id_fbr"
              value={formData.player_id_fbr}
              onChange={handleInputChange}
              className={errors.player_id_fbr ? 'error' : ''}
              placeholder="ID único del jugador en FBR"
            />
            {errors.player_id_fbr && (
              <span className="error-message">{errors.player_id_fbr}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="nombre_completo" className="required">
              Nombre Completo
            </label>
            <input
              type="text"
              id="nombre_completo"
              name="nombre_completo"
              value={formData.nombre_completo}
              onChange={handleInputChange}
              className={errors.nombre_completo ? 'error' : ''}
              placeholder="Nombre y apellidos del jugador"
            />
            {errors.nombre_completo && (
              <span className="error-message">{errors.nombre_completo}</span>
            )}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="apodo">
              Apodo
            </label>
            <input
              type="text"
              id="apodo"
              name="apodo"
              value={formData.apodo}
              onChange={handleInputChange}
              placeholder="Apodo del jugador (opcional)"
            />
          </div>

          <div className="form-group">
            <label htmlFor="fecha_nacimiento">
              Fecha de Nacimiento
            </label>
            <input
              type="date"
              id="fecha_nacimiento"
              name="fecha_nacimiento"
              value={formData.fecha_nacimiento}
              onChange={handleInputChange}
              className={errors.fecha_nacimiento ? 'error' : ''}
              max={new Date().toISOString().split('T')[0]}
            />
            {errors.fecha_nacimiento && (
              <span className="error-message">{errors.fecha_nacimiento}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="pie_dominante">
              Pie Dominante
            </label>
            <select
              id="pie_dominante"
              name="pie_dominante"
              value={formData.pie_dominante}
              onChange={handleInputChange}
            >
              <option value="">Seleccionar...</option>
              <option value="DERECHO">Derecho</option>
              <option value="IZQUIERDO">Izquierdo</option>
              <option value="AMBIDIESTRO">Ambidiestro</option>
            </select>
          </div>
        </div>

        {/* Nacionalidades - Selector Múltiple Compacto */}
        <div className="form-row">
          <div className="form-group form-group-full">
            <label htmlFor="nacionalidades">
              Nacionalidades
              <small style={{fontWeight: 'normal', marginLeft: '8px', color: '#6c757d'}}>
                (Mantén Ctrl/Cmd para seleccionar múltiples)
              </small>
            </label>
            <select
              id="nacionalidades"
              multiple
              size="6"
              value={formData.nacionalidades}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => option.value);
                setFormData(prev => ({ ...prev, nacionalidades: selected }));
              }}
              style={{
                minHeight: '120px',
                padding: '8px',
                fontSize: '14px'
              }}
            >
              {countries.map((country) => (
                <option key={country.codigo_pais} value={country.codigo_pais}>
                  {country.codigo_pais} - {country.nombre_pais}
                </option>
              ))}
            </select>
            {formData.nacionalidades.length > 0 && (
              <div className="selected-tags" style={{ marginTop: '8px' }}>
                {formData.nacionalidades.map(code => {
                  const country = countries.find(c => c.codigo_pais === code);
                  return (
                    <span key={code} className="tag tag-country">
                      {code} - {country?.nombre_pais}
                      <button
                        type="button"
                        onClick={() => handleMultiSelectChange('nacionalidades', code)}
                        className="tag-remove"
                        title="Eliminar"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Posiciones - Selector Múltiple Compacto */}
        <div className="form-row">
          <div className="form-group form-group-full">
            <label htmlFor="posiciones">
              Posiciones
              <small style={{fontWeight: 'normal', marginLeft: '8px', color: '#6c757d'}}>
                (Mantén Ctrl/Cmd para seleccionar múltiples)
              </small>
            </label>
            <select
              id="posiciones"
              multiple
              size="6"
              value={formData.posiciones}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => option.value);
                setFormData(prev => ({ ...prev, posiciones: selected }));
              }}
              style={{
                minHeight: '120px',
                padding: '8px',
                fontSize: '14px'
              }}
            >
              {positions.map((position) => (
                <option key={position.codigo_posicion} value={position.codigo_posicion}>
                  {position.codigo_posicion} - {position.nombre_posicion}
                </option>
              ))}
            </select>
            {formData.posiciones.length > 0 && (
              <div className="selected-tags" style={{ marginTop: '8px' }}>
                {formData.posiciones.map(code => {
                  const position = positions.find(p => p.codigo_posicion === code);
                  return (
                    <span key={code} className="tag tag-position">
                      {code} - {position?.nombre_posicion}
                      <button
                        type="button"
                        onClick={() => handleMultiSelectChange('posiciones', code)}
                        className="tag-remove"
                        title="Eliminar"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Botones de acción */}
        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
            disabled={isSubmitting}
          >
            ← Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting && !player ? (
              <>
                <span className="spinner-small"></span>
                Creando...
              </>
            ) : (
              player ? '✅ Actualizar Jugador' : '✅ Crear Jugador'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PlayerForm;