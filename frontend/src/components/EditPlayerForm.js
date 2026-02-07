// Componente de formulario de edición mejorado
// frontend/src/components/EditPlayerForm.js

import React, { useState, useEffect } from 'react';

const EditPlayerForm = ({ 
  jugador, 
  posiciones, 
  nacionalidades, 
  onSave, 
  onCancel, 
  loading = false 
}) => {
  const [formData, setFormData] = useState({
    numero_camiseta: '',
    fecha_incorporacion: '',
    estado: 'ACTIVO',
    posiciones_seleccionadas: []
  });

  const [errors, setErrors] = useState({});

  // Cargar datos del jugador cuando se monta el componente
  useEffect(() => {
    if (jugador) {
      setFormData({
        numero_camiseta: jugador.numero_camiseta || '',
        fecha_incorporacion: jugador.fecha_incorporacion ? 
          jugador.fecha_incorporacion.split('T')[0] : '',
        estado: jugador.estado || 'ACTIVO',
        posiciones_seleccionadas: jugador.posiciones?.map(p => p.codigo) || []
      });
    }
  }, [jugador]);

  // Manejar cambios en inputs simples
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error si existe
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Manejar selección múltiple de posiciones
  const handlePosicionChange = (codigoPosicion) => {
    setFormData(prev => {
      const posicionesActuales = prev.posiciones_seleccionadas;
      let nuevasPosiciones;

      if (posicionesActuales.includes(codigoPosicion)) {
        // Remover posición si ya está seleccionada
        nuevasPosiciones = posicionesActuales.filter(p => p !== codigoPosicion);
      } else {
        // Agregar posición si no está seleccionada
        nuevasPosiciones = [...posicionesActuales, codigoPosicion];
      }

      return {
        ...prev,
        posiciones_seleccionadas: nuevasPosiciones
      };
    });

    // Limpiar error de posiciones si existe
    if (errors.posiciones_seleccionadas) {
      setErrors(prev => ({
        ...prev,
        posiciones_seleccionadas: ''
      }));
    }
  };

  // Validar formulario
  const validateForm = () => {
    const newErrors = {};

    // Validar número de camiseta
    if (formData.numero_camiseta) {
      const numero = parseInt(formData.numero_camiseta);
      if (numero < 1 || numero > 99) {
        newErrors.numero_camiseta = 'El número debe estar entre 1 y 99';
      }
    }

    // Validar que al menos tenga una posición
    if (formData.posiciones_seleccionadas.length === 0) {
      newErrors.posiciones_seleccionadas = 'Debe seleccionar al menos una posición';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Preparar datos para envío
    const datosParaEnvio = {
      ...formData,
      player_id_fbr: jugador.PLAYER_ID_FBR,
      // Convertir códigos de posición a IDs si es necesario
      posiciones_ids: formData.posiciones_seleccionadas.map(codigo => {
        const posicion = posiciones.find(p => p.codigo_posicion === codigo);
        return posicion?.posicion_id || posicion?.id;
      }).filter(Boolean)
    };

    onSave(datosParaEnvio);
  };

  return (
    <div className="edit-player-form">
      <div className="form-header">
        <h2>Editar Jugador</h2>
        <p className="form-subtitle">
          {jugador?.NOMBRE_COMPLETO}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="form">
        <div className="form-grid">
          
          {/* Información básica */}
          <div className="form-section">
            <h3>Información del Torneo</h3>
            
            <div className="form-group">
              <label htmlFor="numero_camiseta">
                Número de Camiseta
              </label>
              <input
                type="number"
                id="numero_camiseta"
                name="numero_camiseta"
                value={formData.numero_camiseta}
                onChange={handleInputChange}
                min="1"
                max="99"
                className={`numero-camiseta-input ${errors.numero_camiseta ? 'error' : ''}`}
                placeholder="Ej: 10"
                style={{
                  color: '#000000 !important',
                  backgroundColor: '#ffffff !important'
                }}
              />
              {errors.numero_camiseta && (
                <span className="error-message">{errors.numero_camiseta}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="fecha_incorporacion">
                Fecha de Incorporación
              </label>
              <input
                type="date"
                id="fecha_incorporacion"
                name="fecha_incorporacion"
                value={formData.fecha_incorporacion}
                onChange={handleInputChange}
                style={{
                  color: '#000000 !important',
                  backgroundColor: '#ffffff !important'
                }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="estado">
                Estado
              </label>
              <select
                id="estado"
                name="estado"
                value={formData.estado}
                onChange={handleInputChange}
                style={{
                  color: '#000000 !important',
                  backgroundColor: '#ffffff !important'
                }}
              >
                <option value="ACTIVO">Activo</option>
                <option value="INACTIVO">Inactivo</option>
                <option value="LESIONADO">Lesionado</option>
                <option value="SUSPENDIDO">Suspendido</option>
              </select>
            </div>
          </div>

          {/* ✅ NUEVA SECCIÓN: Posiciones múltiples */}
          <div className="form-section">
            <h3>Posiciones</h3>
            <p className="section-description">
              Selecciona todas las posiciones que puede jugar el jugador
            </p>
            
            <div className="multi-select-container" style={{ backgroundColor: '#ffffff !important' }}>
              {posiciones?.map(posicion => (
                <div key={posicion.codigo_posicion} className="checkbox-item">
                  <input
                    type="checkbox"
                    id={`posicion-${posicion.codigo_posicion}`}
                    checked={formData.posiciones_seleccionadas.includes(posicion.codigo_posicion)}
                    onChange={() => handlePosicionChange(posicion.codigo_posicion)}
                  />
                  <label 
                    htmlFor={`posicion-${posicion.codigo_posicion}`}
                    style={{ color: '#000000 !important' }}
                  >
                    <span className="position-code">{posicion.codigo_posicion}</span>
                    <span className="position-name" style={{ color: '#000000 !important' }}>
                      {posicion.nombre_posicion}
                    </span>
                  </label>
                </div>
              ))}
            </div>

            {errors.posiciones_seleccionadas && (
              <span className="error-message">{errors.posiciones_seleccionadas}</span>
            )}

            {/* Mostrar posiciones seleccionadas */}
            {formData.posiciones_seleccionadas.length > 0 && (
              <div className="selected-items">
                <strong>Posiciones seleccionadas:</strong>
                <div className="tags">
                  {formData.posiciones_seleccionadas.map(codigo => {
                    const posicion = posiciones?.find(p => p.codigo_posicion === codigo);
                    return (
                      <span key={codigo} className="tag position-tag">
                        {codigo} - {posicion?.nombre_posicion}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Información del jugador (solo lectura) */}
          <div className="form-section">
            <h3>Información del Jugador</h3>
            <div className="readonly-info">
              <p><strong>Nombre:</strong> {jugador?.NOMBRE_COMPLETO}</p>
              <p><strong>Apodo:</strong> {jugador?.APODO || 'Sin apodo'}</p>
              <p><strong>Pie dominante:</strong> {jugador?.PIE_DOMINANTE || 'No especificado'}</p>
              
              {/* Mostrar nacionalidades */}
              {jugador?.nacionalidades && jugador.nacionalidades.length > 0 && (
                <div>
                  <strong>Nacionalidades:</strong>
                  <div className="nacionalidades-readonly">
                    {jugador.nacionalidades.map((nac, index) => (
                      <span key={index} className="nacionalidad-badge">
                        {nac.codigo} - {nac.nombre}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-small"></span>
                Guardando...
              </>
            ) : (
              'Guardar Cambios'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditPlayerForm;