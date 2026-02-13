// frontend/src/components/PartidosManager.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { partidosService, handleResponse } from '../services/apiService';
import PartidosList from './PartidosList';
import PartidoForm from './PartidoForm';
import './Partidos.css';

const PartidosManager = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('list');
  const [partidos, setPartidos] = useState([]);
  const [torneos, setTorneos] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [estadios, setEstadios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [partidoEditando, setPartidoEditando] = useState(null);

  const [filtros, setFiltros] = useState({
    torneo: '',
    equipo: '',
    estado: '',
    numeroJornada: '',
    fechaDesde: '',
    fechaHasta: ''
  });

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    if (activeTab === 'list') {
      cargarPartidos();
    }
  }, [activeTab, filtros]);

  const cargarDatosIniciales = async () => {
    try {
      setLoading(true);

      // Cargar datos auxiliares en paralelo
      const [torneosRes, equiposRes, estadiosRes] = await Promise.all([
        partidosService.getTorneos(),
        partidosService.getEquiposData(),
        partidosService.getEstadios()
      ]);

      const torneosData = await handleResponse(torneosRes);
      const equiposData = await handleResponse(equiposRes);
      const estadiosData = await handleResponse(estadiosRes);

      setTorneos(torneosData);
      setEquipos(equiposData);
      setEstadios(estadiosData);

    } catch (err) {
      console.error('Error al cargar datos iniciales:', err);
      setError('Error al cargar datos iniciales: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const cargarPartidos = async () => {
    try {
      setLoading(true);

      // Construir parámetros de consulta
      const params = {};
      if (filtros.torneo) params.torneoId = filtros.torneo;
      if (filtros.equipo) params.equipoId = filtros.equipo;
      if (filtros.estado) params.estado = filtros.estado;
      // NO enviar numeroJornada al backend - se filtra solo en frontend
      // Esto permite que el combo de fechas muestre todas las opciones disponibles
      // if (filtros.numeroJornada) params.numeroJornada = filtros.numeroJornada;
      if (filtros.fechaDesde) params.fechaDesde = filtros.fechaDesde;
      if (filtros.fechaHasta) params.fechaHasta = filtros.fechaHasta;
      params.limit = '100';

      const response = await partidosService.getAll(params);
      const data = await handleResponse(response);
      setPartidos(data);
      setError('');
    } catch (err) {
      console.error('Error al cargar partidos:', err);
      setError('Error al cargar partidos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePartido = async (partidoData) => {
    try {
      setLoading(true);

      const response = await partidosService.create(partidoData);
      await handleResponse(response);

      setSuccessMessage('¡Partido creado exitosamente!');
      setActiveTab('list');

      // Recargar la lista de partidos para mostrar el nuevo partido
      cargarPartidos();

      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setSuccessMessage(''), 3000);

    } catch (err) {
      console.error('Error al crear partido:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePartido = async (id, partidoData) => {
    try {
      setLoading(true);

      const response = await partidosService.update(id, partidoData);
      await handleResponse(response);

      setSuccessMessage('¡Partido actualizado exitosamente!');
      setPartidoEditando(null);
      setActiveTab('list');

      // Recargar la lista de partidos para reflejar los cambios
      cargarPartidos();

      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setSuccessMessage(''), 3000);

    } catch (err) {
      console.error('Error al actualizar partido:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePartido = async (id) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este partido?')) {
      return;
    }

    try {
      setLoading(true);

      const response = await partidosService.delete(id);
      await handleResponse(response);

      setSuccessMessage('Partido eliminado exitosamente');
      cargarPartidos();
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (err) {
      console.error('Error al eliminar partido:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditPartido = (partido) => {
    setPartidoEditando(partido);
    setActiveTab('form');
  };

  const handleCancelEdit = () => {
    setPartidoEditando(null);
    setActiveTab('list');
  };

  const handleFiltrosChange = (nuevosFiltros) => {
    setFiltros(nuevosFiltros);
  };

  const clearMessages = () => {
    setError('');
    setSuccessMessage('');
  };

  return (
    <div className="partidos-manager">
      <div className="partidos-header">
        <button onClick={() => navigate('/dashboard')} className="back-btn">
          ← Dashboard
        </button>
        <h1>🏆 Gestión de Partidos</h1>
        <p>Administra partidos, resultados y estadísticas de encuentros deportivos</p>

        <div className="tab-navigation">
          <button
            className={`tab-button ${activeTab === 'list' ? 'active' : ''}`}
            onClick={() => setActiveTab('list')}
          >
            📋 Lista de Partidos
          </button>
          <button
            className={`tab-button ${activeTab === 'form' ? 'active' : ''}`}
            onClick={() => {
              setPartidoEditando(null);
              setActiveTab('form');
            }}
          >
            ➕ Nuevo Partido
          </button>
        </div>
      </div>

      {/* Mensajes de estado */}
      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">❌</span>
          <span>{error}</span>
          <button onClick={clearMessages} className="alert-close">✕</button>
        </div>
      )}

      {successMessage && (
        <div className="alert alert-success">
          <span className="alert-icon">✅</span>
          <span>{successMessage}</span>
        </div>
      )}

      {/* Contenido de las pestañas */}
      <div className="tab-content">
        {activeTab === 'list' && (
          <PartidosList
            partidos={partidos}
            torneos={torneos}
            equipos={equipos}
            loading={loading}
            filtros={filtros}
            onFiltrosChange={handleFiltrosChange}
            onEdit={handleEditPartido}
            onDelete={handleDeletePartido}
            onRefresh={cargarPartidos}
          />
        )}

        {activeTab === 'form' && (
          <PartidoForm
            partido={partidoEditando}
            torneos={torneos}
            equipos={equipos}
            estadios={estadios}
            loading={loading}
            onSubmit={partidoEditando ? handleUpdatePartido : handleCreatePartido}
            onCancel={handleCancelEdit}
          />
        )}
      </div>
    </div>
  );
};

export default PartidosManager;