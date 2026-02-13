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
    formatoTorneo: 'RUEDAS', // Por defecto RUEDAS
    rueda: '',
    temporada: new Date().getFullYear().toString()
  });
  const [fases, setFases] = useState([]);
  const [paises, setPaises] = useState([]);
  const [plantillasFases, setPlantillasFases] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      // Cargar países
      const responsePaises = await torneosService.getPaises();
      const dataPaises = await handleResponse(responsePaises);
      setPaises(dataPaises);

      // Cargar plantillas de fases
      const responsePlantillas = await fetch('http://192.168.100.16:3000/api/torneos/data/plantillas-fases');
      if (responsePlantillas.ok) {
        const dataPlantillas = await responsePlantillas.json();
        setPlantillasFases(dataPlantillas);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
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

    // Si cambia el formato, limpiar campos relacionados
    if (name === 'formatoTorneo') {
      if (value === 'RUEDAS') {
        setFases([]);
        setFormData(prev => ({ ...prev, rueda: '' }));
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

    // Validar nombre
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre del torneo es obligatorio';
    } else if (formData.nombre.trim().length < 3) {
      newErrors.nombre = 'El nombre debe tener al menos 3 caracteres';
    }

    // Validar formato
    if (!formData.formatoTorneo) {
      newErrors.formatoTorneo = 'Debe seleccionar el formato de torneo';
    }

    // Si es RUEDAS, validar rueda
    if (formData.formatoTorneo === 'RUEDAS' && !formData.rueda) {
      newErrors.rueda = 'Debe seleccionar el tipo de rueda';
    }

    // Si es FASES, validar que haya al menos una fase
    if (formData.formatoTorneo === 'FASES' && fases.length === 0) {
      newErrors.fases = 'Debe agregar al menos una fase para torneos con formato de fases';
    }

    // Validar que todas las fases tengan nombre
    if (formData.formatoTorneo === 'FASES' && fases.length > 0) {
      const fasesInvalidas = fases.some(f => !f.nombre.trim());
      if (fasesInvalidas) {
        newErrors.fases = 'Todas las fases deben tener un nombre';
      }
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
      const payload = {
        nombre: formData.nombre.trim(),
        temporada: parseInt(formData.temporada),
        formatoTorneo: formData.formatoTorneo
      };

      // Agregar país organizador solo si se seleccionó
      if (formData.paisOrganizador) {
        payload.paisOrganizador = parseInt(formData.paisOrganizador);
      }

      // Si es RUEDAS, agregar la rueda
      if (formData.formatoTorneo === 'RUEDAS') {
        payload.rueda = formData.rueda;
      }

      // Si es FASES, agregar las fases
      if (formData.formatoTorneo === 'FASES') {
        payload.fases = fases;
      }

      const response = await torneosService.create(payload);
      const result = await handleResponse(response);
      console.log('Torneo creado:', result);

      alert('¡Torneo creado exitosamente!');
      navigate('/torneos');

    } catch (error) {
      console.error('Error:', error);
      if (error.message.includes('Ya existe un torneo')) {
        setErrors({
          general: 'Ya existe un torneo con esas características'
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
            <small className="field-help">
              Año de la temporada del torneo
            </small>
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
            <small className="field-help">
              • <strong>Ruedas</strong>: Para ligas nacionales con primera y segunda rueda<br/>
              • <strong>Fases</strong>: Para copas internacionales con fase de grupos, octavos, etc.
            </small>
          </div>

          {/* Si formato es RUEDAS, mostrar selector de rueda */}
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

          {/* Si formato es FASES, mostrar gestión de fases */}
          {formData.formatoTorneo === 'FASES' && (
            <div className="form-group">
              <label>
                Fases del Torneo <span className="required">*</span>
              </label>

              {/* Botones para cargar plantillas */}
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

              {/* Lista de fases */}
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

          <div className="form-info">
            <h4>📋 Información Adicional</h4>
            <ul>
              <li><strong>League ID FBR:</strong> Se generará automáticamente</li>
              <li><strong>Formato de nombre:</strong> Se convertirá automáticamente a mayúsculas</li>
              {formData.formatoTorneo === 'FASES' && (
                <li><strong>Fases:</strong> Las fases se ordenarán automáticamente según el orden agregado</li>
              )}
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
