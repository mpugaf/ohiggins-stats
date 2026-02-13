// frontend/src/components/EditarTorneo.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { torneosService, handleResponse } from '../services/apiService';
import './FormStyles.css';

const EditarTorneo = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    nombre: '',
    paisOrganizador: '',
    formatoTorneo: 'RUEDAS',
    rueda: '',
    temporada: ''
  });
  const [fases, setFases] = useState([]);
  const [torneoOriginal, setTorneoOriginal] = useState(null);
  const [paises, setPaises] = useState([]);
  const [plantillasFases, setPlantillasFases] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, [id]);

  const cargarDatos = async () => {
    try {
      setLoadingData(true);

      if (!id) {
        throw new Error('ID de torneo no proporcionado');
      }

      // Cargar torneo, países y plantillas en paralelo
      const [torneoResponse, paisesResponse, plantillasResponse] = await Promise.all([
        torneosService.getById(id),
        torneosService.getPaises(),
        fetch('http://192.168.100.16:3000/api/torneos/data/plantillas-fases', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
      ]);

      const torneoData = await handleResponse(torneoResponse);
      const paisesData = await handleResponse(paisesResponse);

      console.log('📋 Torneo cargado:', torneoData);

      setTorneoOriginal(torneoData);
      setFormData({
        nombre: torneoData.NOMBRE || '',
        paisOrganizador: torneoData.PAIS_ORGANIZADOR?.toString() || '',
        formatoTorneo: torneoData.FORMATO_TORNEO || 'RUEDAS',
        rueda: torneoData.RUEDA || '',
        temporada: torneoData.TEMPORADA?.toString() || ''
      });

      // Si tiene fases, cargarlas
      if (torneoData.FORMATO_TORNEO === 'FASES' && torneoData.FASES) {
        setFases(torneoData.FASES.map(f => ({
          nombre: f.NOMBRE_FASE,
          descripcion: f.DESCRIPCION || ''
        })));
      }

      setPaises(paisesData);

      if (plantillasResponse.ok) {
        const plantillasData = await plantillasResponse.json();
        setPlantillasFases(plantillasData);
      }

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

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Si cambia el formato, limpiar campos relacionados
    if (name === 'formatoTorneo') {
      if (value === 'RUEDAS') {
        setFases([]);
        setFormData(prev => ({ ...prev, rueda: torneoOriginal?.RUEDA || '' }));
      } else {
        setFormData(prev => ({ ...prev, rueda: '' }));
      }
    }
  };

  const agregarFase = () => {
    setFases([...fases, { nombre: '', descripcion: '' }]);
  };

  const eliminarFase = (index) => {
    const nuevasFases = fases.filter((_, i) => i !== index);
    setFases(nuevasFases);
  };

  const handleFaseChange = (index, field, value) => {
    const nuevasFases = [...fases];
    nuevasFases[index][field] = value;
    setFases(nuevasFases);
  };

  const cargarPlantilla = (tipoPlantilla) => {
    if (plantillasFases[tipoPlantilla]) {
      const nuevasFases = plantillasFases[tipoPlantilla].map(fase => ({
        nombre: fase.NOMBRE_FASE,
        descripcion: fase.DESCRIPCION || ''
      }));
      setFases(nuevasFases);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre del torneo es obligatorio';
    } else if (formData.nombre.trim().length < 3) {
      newErrors.nombre = 'El nombre debe tener al menos 3 caracteres';
    }

    if (!formData.formatoTorneo) {
      newErrors.formatoTorneo = 'Debe seleccionar el formato de torneo';
    }

    if (formData.formatoTorneo === 'RUEDAS' && !formData.rueda) {
      newErrors.rueda = 'Debe seleccionar el tipo de rueda';
    }

    if (formData.formatoTorneo === 'FASES' && fases.length === 0) {
      newErrors.fases = 'Debe agregar al menos una fase para torneos con formato de fases';
    }

    if (formData.formatoTorneo === 'FASES' && fases.length > 0) {
      const fasesInvalidas = fases.some(f => !f.nombre.trim());
      if (fasesInvalidas) {
        newErrors.fases = 'Todas las fases deben tener un nombre';
      }
    }

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
      const payload = {
        nombre: formData.nombre.trim(),
        temporada: parseInt(formData.temporada),
        formatoTorneo: formData.formatoTorneo
      };

      if (formData.paisOrganizador) {
        payload.paisOrganizador = parseInt(formData.paisOrganizador);
      }

      if (formData.formatoTorneo === 'RUEDAS') {
        payload.rueda = formData.rueda;
      }

      if (formData.formatoTorneo === 'FASES') {
        payload.fases = fases;
      }

      const response = await torneosService.update(id, payload);
      const result = await handleResponse(response);
      console.log('Torneo actualizado:', result);

      alert('¡Torneo actualizado exitosamente!');
      navigate('/torneos');

    } catch (error) {
      console.error('Error:', error);
      if (error.message.includes('Ya existe otro torneo')) {
        setErrors({
          general: 'Ya existe otro torneo con esas características'
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
          <p>Modificar: <strong>{torneoOriginal?.NOMBRE}</strong></p>
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
              placeholder="Ej: Copa Libertadores 2025"
              maxLength="100"
              disabled={loading}
            />
            {errors.nombre && <span className="error-message">{errors.nombre}</span>}
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
          </div>

          <div className="form-group">
            <label htmlFor="paisOrganizador">
              País Organizador <span className="optional">(Opcional)</span>
            </label>
            <select
              id="paisOrganizador"
              name="paisOrganizador"
              value={formData.paisOrganizador}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="">-- Sin país específico --</option>
              {paises.map(pais => (
                <option key={pais.ID_PAIS} value={pais.ID_PAIS}>
                  {pais.CODIGO_FIFA} - {pais.NOMBRE}
                </option>
              ))}
            </select>
            <small className="field-help">
              Deja vacío para torneos organizados por confederaciones (CONMEBOL, FIFA, etc.)
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="formatoTorneo">
              Formato del Torneo <span className="required">*</span>
            </label>
            <select
              id="formatoTorneo"
              name="formatoTorneo"
              value={formData.formatoTorneo}
              onChange={handleChange}
              className={errors.formatoTorneo ? 'error' : ''}
              disabled={loading}
            >
              <option value="RUEDAS">Torneo por Ruedas (Liga)</option>
              <option value="FASES">Torneo por Fases (Copa)</option>
            </select>
            {errors.formatoTorneo && <span className="error-message">{errors.formatoTorneo}</span>}
          </div>

          {formData.formatoTorneo === 'RUEDAS' && (
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
            </div>
          )}

          {formData.formatoTorneo === 'FASES' && (
            <div className="form-group">
              <label>
                Fases del Torneo <span className="required">*</span>
              </label>

              <div style={{ marginBottom: '15px' }}>
                <strong>Cargar plantilla:</strong>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '5px' }}>
                  {Object.keys(plantillasFases).map(tipo => (
                    <button
                      key={tipo}
                      type="button"
                      className="btn-secondary"
                      onClick={() => cargarPlantilla(tipo)}
                      style={{ fontSize: '12px', padding: '5px 10px' }}
                    >
                      {tipo.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '10px' }}>
                {fases.map((fase, index) => (
                  <div key={index} style={{
                    border: '1px solid #ddd',
                    padding: '10px',
                    marginBottom: '10px',
                    borderRadius: '4px',
                    backgroundColor: '#f9f9f9'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <strong>Fase {index + 1}</strong>
                      <button
                        type="button"
                        onClick={() => eliminarFase(index)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'red',
                          cursor: 'pointer',
                          fontSize: '18px'
                        }}
                      >
                        ✕
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Nombre de la fase"
                      value={fase.nombre}
                      onChange={(e) => handleFaseChange(index, 'nombre', e.target.value)}
                      style={{ width: '100%', marginBottom: '5px', padding: '8px' }}
                    />
                    <input
                      type="text"
                      placeholder="Descripción (opcional)"
                      value={fase.descripcion}
                      onChange={(e) => handleFaseChange(index, 'descripcion', e.target.value)}
                      style={{ width: '100%', padding: '8px' }}
                    />
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={agregarFase}
                className="btn-secondary"
                style={{ width: '100%' }}
              >
                + Agregar Fase
              </button>

              {errors.fases && <span className="error-message">{errors.fases}</span>}
            </div>
          )}

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
