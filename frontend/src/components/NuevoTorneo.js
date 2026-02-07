// frontend/src/components/NuevoTorneo.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { torneosService, handleResponse } from '../services/apiService';
import './FormStyles.css';

const NuevoTorneo = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre: '',
    paisOrganizador: '',
    rueda: '',
    temporada: new Date().getFullYear().toString()
  });
  const [paises, setPaises] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarPaises();
  }, []);

  const cargarPaises = async () => {
    try {
      const response = await torneosService.getPaises();
      const data = await handleResponse(response);
      setPaises(data);
    } catch (error) {
      console.error('Error al cargar países:', error);
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

    // Validar nombre
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre del torneo es obligatorio';
    } else if (formData.nombre.trim().length < 3) {
      newErrors.nombre = 'El nombre debe tener al menos 3 caracteres';
    }

    // Validar país organizador
    if (!formData.paisOrganizador) {
      newErrors.paisOrganizador = 'Debe seleccionar un país organizador';
    }

    // Validar rueda
    if (!formData.rueda) {
      newErrors.rueda = 'Debe seleccionar el tipo de rueda';
    }

    // Validar temporada
    if (!formData.temporada) {
      newErrors.temporada = 'La temporada es obligatoria';
    } else {
      const año = parseInt(formData.temporada);
      const añoActual = new Date().getFullYear();
      if (isNaN(año) || año < 1900 || año > añoActual + 10) {
        newErrors.temporada = `La temporada debe ser un año entre 1900 y ${añoActual + 10}`;
      }
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await torneosService.create({
        nombre: formData.nombre.trim(),
        paisOrganizador: parseInt(formData.paisOrganizador),
        rueda: formData.rueda,
        temporada: parseInt(formData.temporada)
      });
      const result = await handleResponse(response);
      console.log('Torneo creado:', result);
      
      alert('¡Torneo creado exitosamente!');
      navigate('/torneos');

    } catch (error) {
      console.error('Error:', error);
      if (error.message.includes('Ya existe un torneo')) {
        setErrors({
          general: 'Ya existe un torneo con esas características (mismo nombre, país, rueda y temporada)'
        });
      } else {
        setErrors({
          general: 'Error al crear el torneo: ' + error.message
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/torneos');
  };

  return (
    <div className="form-container">
      <div className="form-card">
        <div className="form-header">
          <h2>🏆 Nuevo Torneo</h2>
          <p>Registrar un nuevo torneo en el sistema</p>
        </div>

        <form onSubmit={handleSubmit} className="form">
          {errors.general && (
            <div className="error-message general-error">
              {errors.general}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="nombre">
              Nombre del Torneo <span className="required">*</span>
            </label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              className={errors.nombre ? 'error' : ''}
              placeholder="Ej: Copa América Femenina 2025"
              maxLength="100"
              disabled={loading}
            />
            {errors.nombre && <span className="error-message">{errors.nombre}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="paisOrganizador">
              País Organizador <span className="required">*</span>
            </label>
            <select
              id="paisOrganizador"
              name="paisOrganizador"
              value={formData.paisOrganizador}
              onChange={handleChange}
              className={errors.paisOrganizador ? 'error' : ''}
              disabled={loading}
            >
              <option value="">-- Seleccione un país --</option>
              {paises.map(pais => (
                <option key={pais.ID_PAIS} value={pais.ID_PAIS}>
                  {pais.CODIGO_FIFA} - {pais.NOMBRE}
                </option>
              ))}
            </select>
            {errors.paisOrganizador && <span className="error-message">{errors.paisOrganizador}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="rueda">
              Tipo de Rueda <span className="required">*</span>
            </label>
            <select
              id="rueda"
              name="rueda"
              value={formData.rueda}
              onChange={handleChange}
              className={errors.rueda ? 'error' : ''}
              disabled={loading}
            >
              <option value="">-- Seleccione el tipo de rueda --</option>
              <option value="PRIMERA">Primera Rueda</option>
              <option value="SEGUNDA">Segunda Rueda</option>
              <option value="UNICA">Rueda Única</option>
            </select>
            {errors.rueda && <span className="error-message">{errors.rueda}</span>}
            <small className="field-help">
              • Primera/Segunda Rueda: Para torneos con múltiples fases<br/>
              • Rueda Única: Para torneos de una sola fase
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="temporada">
              Temporada <span className="required">*</span>
            </label>
            <input
              type="number"
              id="temporada"
              name="temporada"
              value={formData.temporada}
              onChange={handleChange}
              className={errors.temporada ? 'error' : ''}
              placeholder="2025"
              min="1900"
              max={new Date().getFullYear() + 10}
              disabled={loading}
            />
            {errors.temporada && <span className="error-message">{errors.temporada}</span>}
            <small className="field-help">
              Año de la temporada del torneo
            </small>
          </div>

          <div className="form-info">
            <h4>📋 Información Adicional</h4>
            <ul>
              <li><strong>League ID FBR:</strong> Se generará automáticamente</li>
              <li><strong>Unicidad:</strong> No puede existir otro torneo con el mismo nombre, país, rueda y temporada</li>
              <li><strong>Formato de nombre:</strong> Se convertirá automáticamente a mayúsculas</li>
            </ul>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={handleCancel}
              className="btn-secondary"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Creando...' : 'Crear Torneo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NuevoTorneo;