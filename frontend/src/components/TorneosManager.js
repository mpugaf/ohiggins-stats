// frontend/src/components/TorneosManager.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TorneoForm from './TorneoForm';
import TorneosList from './TorneosList';
import './Torneos.css';

const TorneosManager = () => {
  const navigate = useNavigate();
  
  // Estados principales
  const [modoFormulario, setModoFormulario] = useState('lista'); // 'lista', 'nuevo', 'editar'
  const [torneos, setTorneos] = useState([]);
  const [torneoSeleccionado, setTorneoSeleccionado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estados para datos auxiliares
  const [paises, setPaises] = useState([]);

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  const cargarDatosIniciales = async () => {
    try {
      setLoading(true);
      
      // Cargar datos en paralelo
      await Promise.all([
        cargarTorneos(),
        cargarPaises()
      ]);
      
    } catch (error) {
      console.error('❌ Error cargando datos iniciales:', error);
      setError('Error al cargar los datos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const cargarTorneos = async () => {
    try {
      console.log('📥 Cargando torneos...');
      const response = await fetch('http://192.168.100.16:3000/api/torneos');
      
      if (!response.ok) {
        throw new Error('Error al cargar los torneos');
      }
      
      const data = await response.json();
      setTorneos(data);
      console.log(`✅ ${data.length} torneos cargados`);
      
    } catch (error) {
      console.error('❌ Error al cargar torneos:', error);
      throw error;
    }
  };

  const cargarPaises = async () => {
    try {
      const response = await fetch('http://192.168.100.16:3000/api/torneos/data/paises');
      if (response.ok) {
        const data = await response.json();
        setPaises(data);
        console.log(`✅ ${data.length} países cargados`);
      }
    } catch (error) {
      console.error('❌ Error al cargar países:', error);
    }
  };

  // Función para manejar creación de torneos
  const manejarCreacion = async (submitData) => {
    try {
      console.log('📝 Creando nuevo torneo:', submitData);
      
      const response = await fetch('http://192.168.100.16:3000/api/torneos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear el torneo');
      }
      
      const newTorneo = await response.json();
      console.log('✅ Torneo creado:', newTorneo);
      
      await cargarTorneos();
      setModoFormulario('lista');
      alert('¡Torneo creado exitosamente!');
      
    } catch (error) {
      console.error('❌ Error al crear torneo:', error);
      alert('Error: ' + error.message);
    }
  };

  // Función para manejar actualización de torneos
  const manejarActualizacion = async (torneoId, submitData) => {
    try {
      console.log('📝 Actualizando torneo ID:', torneoId, 'con datos:', submitData);
      
      const response = await fetch(`http://192.168.100.16:3000/api/torneos/${torneoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar el torneo');
      }
      
      const updatedTorneo = await response.json();
      console.log('✅ Torneo actualizado:', updatedTorneo);
      
      await cargarTorneos();
      setModoFormulario('lista');
      setTorneoSeleccionado(null);
      alert('¡Torneo actualizado exitosamente!');
      
    } catch (error) {
      console.error('❌ Error al actualizar torneo:', error);
      alert('Error: ' + error.message);
    }
  };

  // Función unificada para el formulario
  const manejarSubmit = async (idOrData, data = null) => {
    if (data !== null) {
      // Caso de actualización: primer parámetro es ID, segundo es data
      await manejarActualizacion(idOrData, data);
    } else {
      // Caso de creación: primer parámetro es data
      await manejarCreacion(idOrData);
    }
  };

  const manejarEdicion = async (torneo) => {
    try {
      console.log('📝 Cargando torneo para edición:', torneo.ID_TORNEO);
      
      // Cargar datos completos del torneo
      const response = await fetch(`http://192.168.100.16:3000/api/torneos/${torneo.ID_TORNEO}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar los datos del torneo');
      }
      
      const torneoCompleto = await response.json();
      console.log('✅ Datos del torneo cargados:', torneoCompleto);
      
      setTorneoSeleccionado(torneoCompleto);
      setModoFormulario('editar');
      
    } catch (error) {
      console.error('❌ Error al cargar torneo:', error);
      alert('Error al cargar los datos del torneo: ' + error.message);
    }
  };

  const manejarEliminacion = async (torneo) => {
    if (!window.confirm(`¿Está seguro que desea eliminar el torneo "${torneo.NOMBRE}"?`)) {
      return;
    }

    try {
      console.log('🗑️ Eliminando torneo:', torneo.ID_TORNEO);
      
      const response = await fetch(`http://192.168.100.16:3000/api/torneos/${torneo.ID_TORNEO}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar el torneo');
      }
      
      console.log('✅ Torneo eliminado exitosamente');
      await cargarTorneos();
      alert('Torneo eliminado exitosamente');
      
    } catch (error) {
      console.error('❌ Error al eliminar torneo:', error);
      alert('Error al eliminar el torneo: ' + error.message);
    }
  };

  const handleVolver = () => {
    setModoFormulario('lista');
    setTorneoSeleccionado(null);
    setError(null);
  };

  const handleNuevoTorneo = () => {
    setTorneoSeleccionado(null);
    setModoFormulario('nuevo');
  };

  if (loading && torneos.length === 0) {
    return (
      <div className="torneos-manager">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando sistema de torneos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="torneos-manager">
        <div className="error-container">
          <h2>❌ Error</h2>
          <p>{error}</p>
          <button onClick={cargarDatosIniciales} className="btn btn-primary">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="torneos-manager">
      {/* Header */}
      <div className="torneos-header">
        <div className="header-content">
          <button onClick={() => navigate('/dashboard')} className="btn-back">
            ← Dashboard
          </button>
          <div className="header-title">
            <h1>🏆 Gestión de Torneos</h1>
            <p>
              {modoFormulario === 'lista' && `${torneos.length} torneos registrados`}
              {modoFormulario === 'nuevo' && 'Registrar nuevo torneo'}
              {modoFormulario === 'editar' && 'Editar información del torneo'}
            </p>
          </div>
          {modoFormulario === 'lista' && (
            <button onClick={handleNuevoTorneo} className="btn btn-primary">
              + Nuevo Torneo
            </button>
          )}
        </div>
      </div>

      {/* Contenido principal */}
      <div className="torneos-content">
        {modoFormulario === 'lista' && (
          <TorneosList
            torneos={torneos}
            onEditar={manejarEdicion}
            onEliminar={manejarEliminacion}
            loading={loading}
          />
        )}

        {(modoFormulario === 'nuevo' || modoFormulario === 'editar') && (
          <TorneoForm
            torneo={torneoSeleccionado}
            paises={paises}
            onSubmit={manejarSubmit}
            onCancel={handleVolver}
          />
        )}
      </div>

      {/* Loading overlay - Solo para operaciones de carga inicial */}
      {loading && modoFormulario === 'lista' && (
        <div className="loading-overlay">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Procesando...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TorneosManager;