// frontend/src/components/EditarEquipo.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { equiposService, handleResponse } from '../services/apiService';
import './FormStyles.css';

const EditarEquipo = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    nombre: '',
    apodo: '',
    ciudad: '',
    fechaFundacion: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    cargarEquipo();
  }, [id]);

  const cargarEquipo = async () => {
    try {
      setLoading(true);
      const response = await equiposService.getById(id);
      const equipo = await handleResponse(response);

      // Formatear la fecha para el input date
      const fechaFormateada = equipo.FECHA_FUNDACION
        ? new Date(equipo.FECHA_FUNDACION).toISOString().split('T')[0]
        : '';

      setFormData({
        nombre: equipo.NOMBRE || '',
        apodo: equipo.APODO || '',
        ciudad: equipo.CIUDAD || '',
        fechaFundacion: fechaFormateada
      });
    } catch (error) {
      console.error('Error:', error);
      alert('Error al cargar el equipo: ' + error.message);
      navigate('/lista-equipos');
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
      newErrors.nombre = 'El nombre del equipo es obligatorio';
    } else if (formData.nombre.length < 2) {
      newErrors.nombre = 'El nombre debe tener al menos 2 caracteres';
    }

    if (!formData.ciudad.trim()) {
      newErrors.ciudad = 'La ciudad es obligatoria';
    } else if (formData.ciudad.length < 2) {
      newErrors.ciudad = 'La ciudad debe tener al menos 2 caracteres';
    }

    if (formData.apodo && formData.apodo.length < 2) {
      newErrors.apodo = 'El apodo debe tener al menos 2 caracteres';
    }

    if (formData.fechaFundacion) {
      const fechaFundacion = new Date(formData.fechaFundacion);
      const fechaActual = new Date();
      if (fechaFundacion > fechaActual) {
        newErrors.fechaFundacion = 'La fecha de fundación no puede ser futura';
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

    setSaving(true);

    try {
      const response = await equiposService.update(id, formData);
      await handleResponse(response);

      alert('¡Equipo actualizado exitosamente!');
      navigate('/lista-equipos');

    } catch (error) {
      console.error('Error:', error);

      // Manejar error de equipo duplicado
      if (error.message.includes('ya existe')) {
        setErrors({ nombre: error.message });
      } else {
        alert('Error al actualizar el equipo: ' + error.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/lista-equipos');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando datos del equipo...</p>
      </div>
    );
  }

  return (
    <div className="form-container">
      <div className="form-card">
        <div className="form-header">
          <h2>Editar Equipo</h2>
          <p>Modificar datos del equipo ID: {id}</p>
        </div>

        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label htmlFor="nombre">
              Nombre del Equipo <span className="required">*</span>
            </label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              className={errors.nombre ? 'error' : ''}
              placeholder="Ej: Club Deportivo O'Higgins"
              maxLength="100"
            />
            {errors.nombre && <span className="error-message">{errors.nombre}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="apodo">
              Apodo del Equipo
            </label>
            <input
              type="text"
              id="apodo"
              name="apodo"
              value={formData.apodo}
              onChange={handleChange}
              className={errors.apodo ? 'error' : ''}
              placeholder="Ej: Capo de Provincia"
              maxLength="100"
            />
            {errors.apodo && <span className="error-message">{errors.apodo}</span>}
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
              placeholder="Ej: Rancagua"
              maxLength="100"
            />
            {errors.ciudad && <span className="error-message">{errors.ciudad}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="fechaFundacion">
              Fecha de Fundación
            </label>
            <input
              type="date"
              id="fechaFundacion"
              name="fechaFundacion"
              value={formData.fechaFundacion}
              onChange={handleChange}
              className={errors.fechaFundacion ? 'error' : ''}
              max={new Date().toISOString().split('T')[0]}
            />
            {errors.fechaFundacion && <span className="error-message">{errors.fechaFundacion}</span>}
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
            <li>El nombre del equipo debe ser único en el sistema</li>
            <li>La ciudad es obligatoria para identificar la ubicación</li>
            <li>El apodo es opcional pero ayuda a identificar al equipo</li>
            <li>La fecha de fundación no puede ser futura</li>
            <li>Los campos marcados con (*) son obligatorios</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EditarEquipo;