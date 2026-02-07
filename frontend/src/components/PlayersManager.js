// frontend/src/components/PlayersManager.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { playersService, handleResponse } from '../services/apiService';
import PlayerForm from './PlayerForm';
import PlayersList from './PlayersList';
import './Players.css';

const PlayersManager = () => {
  const navigate = useNavigate();
  
  // Estados principales
  const [modoFormulario, setModoFormulario] = useState('lista'); // 'lista', 'nuevo', 'editar'
  const [jugadores, setJugadores] = useState([]);
  const [jugadorSeleccionado, setJugadorSeleccionado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estados para datos auxiliares
  const [countries, setCountries] = useState([]);
  const [positions, setPositions] = useState([]);
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  const cargarDatosIniciales = async () => {
    try {
      setLoading(true);
      
      // Cargar datos en paralelo
      await Promise.all([
        cargarJugadores(),
        cargarCountries(),
        cargarPositions(),
        cargarTeams()
      ]);
      
    } catch (error) {
      console.error('❌ Error cargando datos iniciales:', error);
      setError('Error al cargar los datos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const cargarJugadores = async () => {
    try {
      console.log('📥 Cargando jugadores...');
      const response = await playersService.getAll();
      const data = await handleResponse(response);
      setJugadores(data);
      console.log(`✅ ${data.length} jugadores cargados`);
    } catch (error) {
      console.error('❌ Error al cargar jugadores:', error);
      throw error;
    }
  };

  const cargarCountries = async () => {
    try {
      const response = await playersService.getCountries();
      const data = await handleResponse(response);
      setCountries(data);
      console.log(`✅ ${data.length} países cargados`);
    } catch (error) {
      console.error('❌ Error al cargar países:', error);
    }
  };

  const cargarPositions = async () => {
    try {
      const response = await playersService.getPositions();
      const data = await handleResponse(response);
      setPositions(data);
      console.log(`✅ ${data.length} posiciones cargadas`);
    } catch (error) {
      console.error('❌ Error al cargar posiciones:', error);
    }
  };

  const cargarTeams = async () => {
    try {
      const response = await playersService.getTeams();
      const data = await handleResponse(response);
      setTeams(data);
      console.log(`✅ ${data.length} equipos cargados`);
    } catch (error) {
      console.error('❌ Error al cargar equipos:', error);
    }
  };

  // Función para manejar creación de jugadores
  const manejarCreacion = async (submitData) => {
    try {
      setLoading(true);

      console.log('📝 Creando nuevo jugador:', submitData);

      const response = await playersService.create(submitData);
      const newPlayer = await handleResponse(response);
      console.log('✅ Jugador creado:', newPlayer);

      // CORRECCIÓN: Detener loading ANTES del alert
      setLoading(false);

      await cargarJugadores();
      setModoFormulario('lista');
      alert('¡Jugador creado exitosamente!');

    } catch (error) {
      console.error('❌ Error al crear jugador:', error);
      setLoading(false); // También detener loading en caso de error
      alert('Error: ' + error.message);
    }
  };

  // Función para manejar actualización de jugadores
  const manejarActualizacion = async (playerId, submitData) => {
    try {
      // NO usamos setLoading para evitar animaciones
      console.log('📝 Actualizando jugador ID:', playerId, 'con datos:', submitData);

      const response = await playersService.update(playerId, submitData);
      const updatedPlayer = await handleResponse(response); // ✅ handleResponse ya lee y parsea el body

      console.log('✅ Jugador actualizado:', updatedPlayer);

      await cargarJugadores();
      setModoFormulario('lista');
      setJugadorSeleccionado(null);
      alert('¡Jugador actualizado exitosamente!');

    } catch (error) {
      console.error('❌ Error al actualizar jugador:', error);
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

  const manejarEdicion = async (jugador) => {
    try {
      setLoading(true);
      console.log('📝 Cargando jugador para edición:', jugador.ID_JUGADOR);

      // Cargar datos completos del jugador
      const response = await playersService.getById(jugador.ID_JUGADOR);
      const jugadorCompleto = await handleResponse(response);
      console.log('✅ Datos del jugador cargados:', jugadorCompleto);

      // CORRECCIÓN: Detener loading ANTES de cambiar de vista
      setLoading(false);

      setJugadorSeleccionado(jugadorCompleto);
      setModoFormulario('editar');

    } catch (error) {
      console.error('❌ Error al cargar jugador:', error);
      setLoading(false); // También detener loading en caso de error
      alert('Error al cargar los datos del jugador: ' + error.message);
    }
  };

  const manejarEliminacion = async (jugador) => {
    if (!window.confirm(`¿Está seguro que desea eliminar al jugador "${jugador.NOMBRE_COMPLETO}"?`)) {
      return;
    }

    try {
      setLoading(true);
      console.log('🗑️ Eliminando jugador:', jugador.ID_JUGADOR);

      const response = await playersService.delete(jugador.ID_JUGADOR);
      await handleResponse(response);

      console.log('✅ Jugador eliminado exitosamente');

      // CORRECCIÓN: Detener loading ANTES del alert
      setLoading(false);

      await cargarJugadores();
      alert('Jugador eliminado exitosamente');

    } catch (error) {
      console.error('❌ Error al eliminar jugador:', error);
      setLoading(false); // También detener loading en caso de error
      alert('Error al eliminar el jugador: ' + error.message);
    }
  };

  const handleVolver = () => {
    setModoFormulario('lista');
    setJugadorSeleccionado(null);
    setError(null);
  };

  const handleNuevoJugador = () => {
    setJugadorSeleccionado(null);
    setModoFormulario('nuevo');
  };

  if (loading && jugadores.length === 0) {
    return (
      <div className="players-manager">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando sistema de jugadores...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="players-manager">
        <div className="error-container">
          <h2>❌ Error</h2>
          <p>{error}</p>
          <button onClick={cargarDatosIniciales} className="btn btn-primary">
            Reintentar
          </button>
          <button onClick={cargarDatosIniciales} className="btn btn-primary">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="players-manager">
      {/* Header */}
      <div className="players-header">
        <div className="header-content">
          <button onClick={() => navigate('/dashboard')} className="btn-back">
            ← Dashboard
          </button>
          <div className="header-title">
            <h1>👥 Gestión de Jugadores</h1>
            <p>
              {modoFormulario === 'lista' && `${jugadores.length} jugadores registrados`}
              {modoFormulario === 'nuevo' && 'Registrar nuevo jugador'}
              {modoFormulario === 'editar' && 'Editar información del jugador'}
            </p>
          </div>
          {modoFormulario === 'lista' && (
            <button onClick={handleNuevoJugador} className="btn btn-primary">
              + Nuevo Jugador
            </button>
          )}
        </div>
      </div>

      {/* Contenido principal */}
      <div className="players-content">
        {modoFormulario === 'lista' && (
          <PlayersList
            jugadores={jugadores}
            onEditar={manejarEdicion}
            onEliminar={manejarEliminacion}
            loading={loading}
          />
        )}

        {(modoFormulario === 'nuevo' || modoFormulario === 'editar') && (
          <PlayerForm
            player={jugadorSeleccionado}
            countries={countries}
            positions={positions}
            teams={teams}
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

export default PlayersManager;