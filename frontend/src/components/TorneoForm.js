// frontend/src/components/TorneoForm.js
import React, { useState, useEffect } from 'react';

const TorneoForm = ({ torneo, paises, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    paisOrganizador: '',
    rueda: '',
    temporada: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar datos del torneo cuando se está editando
  useEffect(() => {
    if (torneo) {
      console.log('🔍 Cargando datos del torneo para edición:', torneo);
      
      setFormData({
        nombre: torneo.NOMBRE || '',
        paisOrganizador: torneo.PAIS_ORGANIZADOR || '',
        rueda: torneo.RUEDA || '',
        temporada: torneo.TEMPORADA || ''
      });
    } else {
      // Resetear formulario para nuevo torneo
      setFormData({
        nombre: '',
        paisOrganizador: '',
        rueda: '',
        temporada: ''
      });
    }
    setErrors({});
  }, [torneo]);

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

  const validateForm = () => {
    const newErrors = {};

    // Validaciones obligatorias
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre del torneo es obligatorio';
    }

    if (!formData.paisOrganizador) {
      newErrors.paisOrganizador = 'El país organizador es obligatorio';
    }

    if (!formData.rueda) {
      newErrors.rueda = 'La rueda es obligatoria';
    }

    if (!formData.temporada.trim()) {
      newErrors.temporada = 'La temporada es obligatoria';
    } else {
      // Validar formato de temporada (año o rango de años)
      const temporadaRegex = /^(\d{4}|\d{4}-\d{4})$/;
      if (!temporadaRegex.test(formData.temporada)) {
        newErrors.temporada = 'La temporada debe ser un año (ej: 2024) o rango (ej: 2024-2025)';
      } else {
        // Validar que los años sean válidos
        const años = formData.temporada.split('-').map(año => parseInt(año));
        const añoActual = new Date().getFullYear();
        
        if (años.some(año => año < 1900 || año > añoActual + 10)) {
          newErrors.temporada = `Los años deben estar entre 1900 y ${añoActual + 10}`;
        }
        
        if (años.length === 2 && años[0] >= años[1]) {
          newErrors.temporada = 'En un rango, el primer año debe ser menor que el segundo';
        }
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
    const esActualizacion = !!torneo;
    if (!esActualizacion) {
      setIsSubmitting(true);
    }

    try {
      // Preparar datos para enviar
      const submitData = {
        nombre: formData.nombre.trim(),
        paisOrganizador: parseInt(formData.paisOrganizador),
        rueda: formData.rueda,
        temporada: formData.temporada.trim()
      };

      console.log('📝 Enviando datos del formulario:', submitData);

      if (torneo) {
        // Para actualización: pasar ID y datos separadamente (SIN spinner)
        await onSubmit(torneo.ID_TORNEO, submitData);
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
    <div className="torneo-form">
      <div className="form-header">
        <h2>{torneo ? 'Editar Torneo' : 'Nuevo Torneo'}</h2>
        <p className="form-subtitle">
          {torneo ? 'Modifica la información del torneo' : 'Completa los datos del nuevo torneo'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="form">
        <div className="form-grid">
          {/* Información básica */}
          <div className="form-section">
            <h3>Información Básica</h3>
            <p className="section-description">
              Datos principales del torneo
            </p>
            
            <div className="form-group">
              <label htmlFor="nombre" className="required">
                Nombre del Torneo
              </label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                className={errors.nombre ? 'error' : ''}
                placeholder="Ej: Copa América, Liga Nacional, etc."
                maxLength="100"
              />
              {errors.nombre && (
                <span className="error-message">{errors.nombre}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="temporada" className="required">
                Temporada
              </label>
              <input
                type="text"
                id="temporada"
                name="temporada"
                value={formData.temporada}
                onChange={handleInputChange}
                className={errors.temporada ? 'error' : ''}
                placeholder="Ej: 2024 o 2024-2025"
                maxLength="9"
              />
              {errors.temporada && (
                <span className="error-message">{errors.temporada}</span>
              )}
              <small className="field-help">
                Formato: año individual (2024) o rango (2024-2025)
              </small>
            </div>
          </div>

          {/* Organización */}
          <div className="form-section">
            <h3>Organización</h3>
            <p className="section-description">
              Detalles sobre la organización del torneo
            </p>

            <div className="form-group">
              <label htmlFor="paisOrganizador" className="required">
                País Organizador
              </label>
              <select
                id="paisOrganizador"
                name="paisOrganizador"
                value={formData.paisOrganizador}
                onChange={handleInputChange}
                className={errors.paisOrganizador ? 'error' : ''}
              >
                <option value="">Seleccionar país organizador</option>
                {paises.map((pais) => (
                  <option key={pais.ID_PAIS} value={pais.ID_PAIS}>
                    {pais.CODIGO_FIFA} - {pais.NOMBRE}
                  </option>
                ))}
              </select>
              {errors.paisOrganizador && (
                <span className="error-message">{errors.paisOrganizador}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="rueda" className="required">
                Tipo de Rueda
              </label>
              <select
                id="rueda"
                name="rueda"
                value={formData.rueda}
                onChange={handleInputChange}
                className={errors.rueda ? 'error' : ''}
              >
                <option value="">Seleccionar tipo de rueda</option>
                <option value="PRIMERA">Primera Rueda</option>
                <option value="SEGUNDA">Segunda Rueda</option>
                <option value="UNICA">Rueda Única</option>
              </select>
              {errors.rueda && (
                <span className="error-message">{errors.rueda}</span>
              )}
              <small className="field-help">
                Primera/Segunda rueda para torneos largos, Única para copas
              </small>
            </div>
          </div>

          {/* Información técnica */}
          <div className="form-section">
            <h3>Información Técnica</h3>
            <p className="section-description">
              Datos técnicos del sistema
            </p>

            {torneo && (
              <div className="form-group readonly">
                <label>League ID FBR</label>
                <input
                  type="text"
                  value={torneo.LEAGUE_ID_FBR || ''}
                  disabled
                  className="readonly-field"
                />
                <small className="field-help">
                  ID único generado automáticamente para identificación en APIs
                </small>
              </div>
            )}

            <div className="info-box">
              <div className="info-icon">ℹ️</div>
              <div className="info-content">
                <h4>Sobre el League ID FBR:</h4>
                <p>
                  {torneo 
                    ? 'Este ID se generó automáticamente y no puede modificarse.'
                    : 'Se generará automáticamente un ID único comenzando desde 1000000.'
                  }
                </p>
              </div>
            </div>
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
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting && !torneo ? (
              <>
                <span className="spinner-small"></span>
                Creando...
              </>
            ) : (
              torneo ? 'Actualizar Torneo' : 'Crear Torneo'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TorneoForm;