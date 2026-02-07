// frontend/src/components/FormEstadio.jsx
import React, { useState, useEffect } from 'react';
import './FormEstadio.css';

const FormEstadio = ({ estadioParaEditar, onSubmit, onCancel, isLoading = false }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    capacidad: '',
    ciudad: '',
    fechaInauguracion: '',
    superficie: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Opciones predefinidas para superficie
  const opcionesSuperficie = [
    'CÉSPED NATURAL',
    'CÉSPED SINTÉTICO',
    'CÉSPED HÍBRIDO',
    'TIERRA',
    'ARCILLA',
    'ASFALTO',
    'CEMENTO',
    'OTRO'
  ];

  // Efecto para cargar datos si es edición
  useEffect(() => {
    if (estadioParaEditar) {
      setFormData({
        nombre: estadioParaEditar.NOMBRE || '',
        capacidad: estadioParaEditar.CAPACIDAD || '',
        ciudad: estadioParaEditar.CIUDAD || '',
        fechaInauguracion: estadioParaEditar.FECHA_INAUGURACION || '',
        superficie: estadioParaEditar.SUPERFICIE || ''
      });
    }
  }, [estadioParaEditar]);

  // Manejar cambios en los inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Validar formulario
  const validateForm = () => {
    const newErrors = {};

    // Validar nombre
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre del estadio es obligatorio';
    } else if (formData.nombre.length > 100) {
      newErrors.nombre = 'El nombre no puede exceder 100 caracteres';
    }

    // Validar capacidad
    if (!formData.capacidad) {
      newErrors.capacidad = 'La capacidad es obligatoria';
    } else if (isNaN(formData.capacidad) || parseInt(formData.capacidad) <= 0) {
      newErrors.capacidad = 'La capacidad debe ser un número positivo';
    } else if (parseInt(formData.capacidad) > 200000) {
      newErrors.capacidad = 'La capacidad no puede exceder 200,000 espectadores';
    }

    // Validar ciudad
    if (!formData.ciudad.trim()) {
      newErrors.ciudad = 'La ciudad es obligatoria';
    } else if (formData.ciudad.length > 100) {
      newErrors.ciudad = 'El nombre de la ciudad no puede exceder 100 caracteres';
    }

    // Validar fecha de inauguración
    if (!formData.fechaInauguracion) {
      newErrors.fechaInauguracion = 'La fecha de inauguración es obligatoria';
    } else {
      const fechaInauguracion = new Date(formData.fechaInauguracion);
      const fechaActual = new Date();
      
      if (fechaInauguracion > fechaActual) {
        newErrors.fechaInauguracion = 'La fecha de inauguración no puede ser futura';
      }
      
      // Validar que no sea muy antigua (ej: antes de 1800)
      if (fechaInauguracion.getFullYear() < 1800) {
        newErrors.fechaInauguracion = 'La fecha de inauguración debe ser posterior a 1800';
      }
    }

    // Validar superficie
    if (!formData.superficie.trim()) {
      newErrors.superficie = 'El tipo de superficie es obligatorio';
    } else if (formData.superficie.length > 50) {
      newErrors.superficie = 'El tipo de superficie no puede exceder 50 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Preparar datos para envío
      const dataToSubmit = {
        nombre: formData.nombre.trim(),
        capacidad: parseInt(formData.capacidad),
        ciudad: formData.ciudad.trim(),
        fechaInauguracion: formData.fechaInauguracion,
        superficie: formData.superficie.trim()
      };

      await onSubmit(dataToSubmit);
      
      // Limpiar formulario si es creación exitosa
      if (!estadioParaEditar) {
        resetForm();
      }
    } catch (error) {
      console.error('Error al enviar formulario:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      nombre: '',
      capacidad: '',
      ciudad: '',
      fechaInauguracion: '',
      superficie: ''
    });
    setErrors({});
  };

  // Manejar cancelación
  const handleCancel = () => {
    resetForm();
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className="form-estadio-container">
      <form onSubmit={handleSubmit} className="form-estadio">
        <div className="form-header">
          <h2>
            {estadioParaEditar ? 'Editar Estadio' : 'Nuevo Estadio'}
          </h2>
        </div>

        <div className="form-body">
          {/* Campo Nombre */}
          <div className="form-group">
            <label htmlFor="nombre" className="form-label required">
              Nombre del Estadio
            </label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              className={`form-input ${errors.nombre ? 'error' : ''}`}
              placeholder="Ej: Estadio Nacional"
              maxLength="100"
              disabled={isSubmitting || isLoading}
            />
            {errors.nombre && (
              <span className="error-message">{errors.nombre}</span>
            )}
          </div>

          {/* Campo Capacidad */}
          <div className="form-group">
            <label htmlFor="capacidad" className="form-label required">
              Capacidad
            </label>
            <input
              type="number"
              id="capacidad"
              name="capacidad"
              value={formData.capacidad}
              onChange={handleInputChange}
              className={`form-input ${errors.capacidad ? 'error' : ''}`}
              placeholder="Ej: 45000"
              min="1"
              max="200000"
              disabled={isSubmitting || isLoading}
            />
            {errors.capacidad && (
              <span className="error-message">{errors.capacidad}</span>
            )}
          </div>

          {/* Campo Ciudad */}
          <div className="form-group">
            <label htmlFor="ciudad" className="form-label required">
              Ciudad
            </label>
            <input
              type="text"
              id="ciudad"
              name="ciudad"
              value={formData.ciudad}
              onChange={handleInputChange}
              className={`form-input ${errors.ciudad ? 'error' : ''}`}
              placeholder="Ej: Santiago"
              maxLength="100"
              disabled={isSubmitting || isLoading}
            />
            {errors.ciudad && (
              <span className="error-message">{errors.ciudad}</span>
            )}
          </div>

          {/* Campo Fecha de Inauguración */}
          <div className="form-group">
            <label htmlFor="fechaInauguracion" className="form-label required">
              Fecha de Inauguración
            </label>
            <input
              type="date"
              id="fechaInauguracion"
              name="fechaInauguracion"
              value={formData.fechaInauguracion}
              onChange={handleInputChange}
              className={`form-input ${errors.fechaInauguracion ? 'error' : ''}`}
              max={new Date().toISOString().split('T')[0]}
              min="1800-01-01"
              disabled={isSubmitting || isLoading}
            />
            {errors.fechaInauguracion && (
              <span className="error-message">{errors.fechaInauguracion}</span>
            )}
          </div>

          {/* Campo Superficie */}
          <div className="form-group">
            <label htmlFor="superficie" className="form-label required">
              Tipo de Superficie
            </label>
            <select
              id="superficie"
              name="superficie"
              value={formData.superficie}
              onChange={handleInputChange}
              className={`form-input ${errors.superficie ? 'error' : ''}`}
              disabled={isSubmitting || isLoading}
            >
              <option value="">Seleccionar superficie...</option>
              {opcionesSuperficie.map((opcion) => (
                <option key={opcion} value={opcion}>
                  {opcion}
                </option>
              ))}
            </select>
            {errors.superficie && (
              <span className="error-message">{errors.superficie}</span>
            )}
          </div>
        </div>

        <div className="form-footer">
          <button
            type="button"
            onClick={handleCancel}
            className="btn btn-secondary"
            disabled={isSubmitting || isLoading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting || isLoading}
          >
            {isSubmitting || isLoading ? (
              <>
                <span className="loading-spinner"></span>
                {estadioParaEditar ? 'Actualizando...' : 'Creando...'}
              </>
            ) : (
              estadioParaEditar ? 'Actualizar Estadio' : 'Crear Estadio'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormEstadio;