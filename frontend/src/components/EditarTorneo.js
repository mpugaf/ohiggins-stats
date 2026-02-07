// frontend/src/components/EditarTorneo.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { torneosService, handleResponse } from '../services/apiService';
import './FormStyles.css';

const EditarTorneo = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  console.log('🎯 EDITAR_TORNEO - ID capturado desde URL:', id);
  console.log('🎯 EDITAR_TORNEO - Tipo de ID:', typeof id);
  console.log('🎯 EDITAR_TORNEO - useParams completo:', useParams());

  const [formData, setFormData] = useState({
    nombre: '',
    paisOrganizador: '',
    rueda: '',
    temporada: ''
  });
  const [torneoOriginal, setTorneoOriginal] = useState(null);
  const [paises, setPaises] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, [id]);

  const cargarDatos = async () => {
    try {
      setLoadingData(true);

      // Validar que el ID existe
      if (!id) {
        throw new Error('ID de torneo no proporcionado');
      }

      // Cargar torneo y países en paralelo con autenticación
      const [torneoResponse, paisesResponse] = await Promise.all([
        torneosService.getById(id),
        torneosService.getPaises()
      ]);

      const torneoData = await handleResponse(torneoResponse);
      const paisesData = await handleResponse(paisesResponse);

      setTorneoOriginal(torneoData);
      setFormData({
        nombre: torneoData.NOMBRE || '',
        paisOrganizador: torneoData.PAIS_ORGANIZADOR?.toString() || '',
        rueda: torneoData.RUEDA || '',
        temporada: torneoData.TEMPORADA?.toString() || ''
      });
      setPaises(paisesData);

    } catch (error) {
      console.error('Error al cargar datos:', error);
      setErrors({
        general: 'Error al cargar los datos del torneo: ' + error.message
      });
    } finally {
      setLoadingData(false);
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
      const response = await torneosService.update(id, {
        nombre: formData.nombre.trim(),
        paisOrganizador: parseInt(formData.paisOrganizador),
        rueda: formData.rueda,
        temporada: parseInt(formData.temporada)
      });

      const result = await handleResponse(response);
      console.log('Torneo actualizado:', result);

      alert('¡Torneo actualizado exitosamente!');
      navigate('/torneos');

    } catch (error) {
      console.error('Error:', error);
      if (error.message.includes('Ya existe otro torneo')) {
        setErrors({
          general: 'Ya existe otro torneo con esas características (mismo nombre, país, rueda y temporada)'
        });
      } else {
        setErrors({
          general: 'Error al actualizar el torneo: ' + error.message
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/torneos');
  };

  const formatearRueda = (rueda) => {
    const ruedas = {
      'PRIMERA': 'Primera Rueda',
      'SEGUNDA': 'Segunda Rueda',
      'UNICA': 'Rueda Única'
    };
    return ruedas[rueda] || rueda;
  };

  if (loadingData) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando datos del torneo...</p>
      </div>
    );
  }

  if (errors.general && !torneoOriginal) {
    return (
      <div className="error-container">
        <div className="error-message">
          <h3>Error</h3>
          <p>{errors.general}</p>
          <button onClick={() => navigate('/torneos')} className="btn-primary">
            Volver a Torneos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="form-container">
      <div className="form-card">
        <div className="form-header">
          <h2>✏️ Editar Torneo</h2>
          <p>Modificar los datos del torneo: <strong>{torneoOriginal?.NOMBRE}</strong></p>
          {torneoOriginal && (
            <div className="torneo-info">
              <span className="info-badge">
                League ID: {torneoOriginal.LEAGUE_ID_FBR}
              </span>
            </div>
          )}
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
              Actualmente: {formatearRueda(torneoOriginal?.RUEDA || '')}
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
            <h4>📋 Información del Torneo</h4>
            <ul>
              <li><strong>ID del Torneo:</strong> {torneoOriginal?.ID_TORNEO}</li>
              <li><strong>League ID FBR:</strong> {torneoOriginal?.LEAGUE_ID_FBR}</li>
              <li><strong>País Actual:</strong> {torneoOriginal?.NOMBRE_PAIS} ({torneoOriginal?.CODIGO_PAIS})</li>
              <li><strong>Configuración Actual:</strong> {formatearRueda(torneoOriginal?.RUEDA || '')} - {torneoOriginal?.TEMPORADA}</li>
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
              {loading ? 'Actualizando...' : 'Actualizar Torneo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditarTorneo;