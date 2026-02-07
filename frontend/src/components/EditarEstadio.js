// frontend/src/components/EditarEstadio.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { estadiosService, handleResponse } from '../services/apiService';
import './FormStyles.css';

const EditarEstadio = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    nombre: '',
    capacidad: '',
    ciudad: '',
    fechaInauguracion: '',
    superficie: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const superficiesDisponibles = [
    'CESPED NATURAL',
    'CESPED ARTIFICIAL',
    'CESPED HIBRIDO',
    'OTRO'
  ];

  useEffect(() => {
    cargarEstadio();
  }, [id]);

  const cargarEstadio = async () => {
    try {
      setLoading(true);
      const response = await estadiosService.getById(id);
      const estadio = await handleResponse(response);

      // Formatear la fecha para el input date
      const fechaFormateada = estadio.FECHA_INAUGURACION
        ? new Date(estadio.FECHA_INAUGURACION).toISOString().split('T')[0]
        : '';

      setFormData({
        nombre: estadio.NOMBRE || '',
        capacidad: estadio.CAPACIDAD || '',
        ciudad: estadio.CIUDAD || '',
        fechaInauguracion: fechaFormateada,
        superficie: estadio.SUPERFICIE || ''
      });
    } catch (error) {
      console.error('Error:', error);
      alert('Error al cargar el estadio: ' + error.message);
      navigate('/lista-estadios');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
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

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre del estadio es obligatorio';
    } else if (formData.nombre.length < 3) {
      newErrors.nombre = 'El nombre debe tener al menos 3 caracteres';
    }

    if (!formData.capacidad) {
      newErrors.capacidad = 'La capacidad es obligatoria';
    } else if (isNaN(formData.capacidad) || parseInt(formData.capacidad) <= 0) {
      newErrors.capacidad = 'La capacidad debe ser un número mayor a 0';
    } else if (parseInt(formData.capacidad) > 200000) {
      newErrors.capacidad = 'La capacidad no puede ser mayor a 200,000';
    }

    if (!formData.ciudad.trim()) {
      newErrors.ciudad = 'La ciudad es obligatoria';
    } else if (formData.ciudad.length < 2) {
      newErrors.ciudad = 'La ciudad debe tener al menos 2 caracteres';
    }

    if (!formData.fechaInauguracion) {
      newErrors.fechaInauguracion = 'La fecha de inauguración es obligatoria';
    } else {
      const fechaInauguracion = new Date(formData.fechaInauguracion);
      const fechaActual = new Date();
      if (fechaInauguracion > fechaActual) {
        newErrors.fechaInauguracion = 'La fecha de inauguración no puede ser futura';
      }
    }

    if (!formData.superficie) {
      newErrors.superficie = 'El tipo de superficie es obligatorio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      const response = await estadiosService.update(id, formData);
      await handleResponse(response);

      alert('¡Estadio actualizado exitosamente!');
      navigate('/lista-estadios');

    } catch (error) {
      console.error('Error:', error);

      // Manejar error de estadio duplicado
      if (error.message.includes('ya existe')) {
        setErrors({ nombre: error.message });
      } else {
        alert('Error al actualizar el estadio: ' + error.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/lista-estadios');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando datos del estadio...</p>
      </div>
    );
  }

  return (
    <div className="form-container">
      <div className="form-card">
        <div className="form-header">
          <h2>Editar Estadio</h2>
          <p>Modificar datos del estadio ID: {id}</p>
        </div>

        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label htmlFor="nombre">
              Nombre del Estadio <span className="required">*</span>
            </label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              className={errors.nombre ? 'error' : ''}
              placeholder="Ej: Estadio Nacional"
              maxLength="100"
            />
            {errors.nombre && <span className="error-message">{errors.nombre}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="capacidad">
              Capacidad <span className="required">*</span>
            </label>
            <input
              type="number"
              id="capacidad"
              name="capacidad"
              value={formData.capacidad}
              onChange={handleChange}
              className={errors.capacidad ? 'error' : ''}
              placeholder="Ej: 45000"
              min="1"
              max="200000"
            />
            {errors.capacidad && <span className="error-message">{errors.capacidad}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="ciudad">
              Ciudad <span className="required">*</span>
            </label>
            <input
              type="text"
              id="ciudad"
              name="ciudad"
              value={formData.ciudad}
              onChange={handleChange}
              className={errors.ciudad ? 'error' : ''}
              placeholder="Ej: Santiago"
              maxLength="100"
            />
            {errors.ciudad && <span className="error-message">{errors.ciudad}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="fechaInauguracion">
              Fecha de Inauguración <span className="required">*</span>
            </label>
            <input
              type="date"
              id="fechaInauguracion"
              name="fechaInauguracion"
              value={formData.fechaInauguracion}
              onChange={handleChange}
              className={errors.fechaInauguracion ? 'error' : ''}
              max={new Date().toISOString().split('T')[0]}
            />
            {errors.fechaInauguracion && <span className="error-message">{errors.fechaInauguracion}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="superficie">
              Tipo de Superficie <span className="required">*</span>
            </label>
            <select
              id="superficie"
              name="superficie"
              value={formData.superficie}
              onChange={handleChange}
              className={errors.superficie ? 'error' : ''}
            >
              <option value="">Seleccionar tipo de superficie</option>
              {superficiesDisponibles.map((superficie) => (
                <option key={superficie} value={superficie}>
                  {superficie}
                </option>
              ))}
            </select>
            {errors.superficie && <span className="error-message">{errors.superficie}</span>}
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={handleCancel}
              className="btn-secondary"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={saving}
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>

        <div className="form-info">
          <h4>Información importante:</h4>
          <ul>
            <li>El nombre del estadio debe ser único en el sistema</li>
            <li>La capacidad debe ser un número entero positivo</li>
            <li>La fecha de inauguración no puede ser futura</li>
            <li>Todos los campos marcados con (*) son obligatorios</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EditarEstadio;