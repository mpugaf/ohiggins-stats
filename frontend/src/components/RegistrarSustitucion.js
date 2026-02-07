import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const RegistrarSustitucion = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    partido_id: '',
    equipo_id: '',
    jugador_entra_id: '',
    jugador_sale_id: '',
    minuto: ''
  });
  
  const [partidos, setPartidos] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [jugadoresDisponibles, setJugadoresDisponibles] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPartidos = async () => {
      try {
        const response = await fetch('http://192.168.100.16:3000/api/partidos');
        if (!response.ok) {
          throw new Error('Error al cargar partidos');
        }
        const data = await response.json();
        setPartidos(data);
      } catch (error) {
        setError('Error cargando partidos');
      }
    };

    fetchPartidos();
  }, []);

  useEffect(() => {
    const fetchEquipos = async () => {
      if (!formData.partido_id) return;
      
      try {
        const response = await fetch(`http://192.168.100.16:3000/api/partidos/${formData.partido_id}/equipos`);
        if (!response.ok) {
          throw new Error('Error al cargar equipos');
        }
        const data = await response.json();
        setEquipos(data);
        // Reiniciar selección de equipo y jugadores
        setFormData(prev => ({
          ...prev,
          equipo_id: '',
          jugador_entra_id: '',
          jugador_sale_id: ''
        }));
      } catch (error) {
        setError('Error cargando equipos del partido');
      }
    };

    fetchEquipos();
  }, [formData.partido_id]);

  useEffect(() => {
    const fetchJugadores = async () => {
      if (!formData.equipo_id || !formData.partido_id) return;
      
      try {
        const response = await fetch(
          `http://192.168.100.16:3000/api/partidos/${formData.partido_id}/equipos/${formData.equipo_id}/jugadores`
        );
        if (!response.ok) {
          throw new Error('Error al cargar jugadores');
        }
        const data = await response.json();
        setJugadoresDisponibles(data);
      } catch (error) {
        setError('Error cargando jugadores');
      }
    };

    fetchJugadores();
  }, [formData.equipo_id, formData.partido_id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validarSustitucion = () => {
    if (formData.jugador_entra_id === formData.jugador_sale_id) {
      setError('El jugador que entra no puede ser el mismo que sale');
      return false;
    }
    
    if (!formData.partido_id || !formData.equipo_id || !formData.jugador_entra_id || 
        !formData.jugador_sale_id || !formData.minuto) {
      setError('Todos los campos son obligatorios');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validarSustitucion()) return;
    
    try {
      const response = await fetch('http://192.168.100.16:3000/api/sustituciones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          partido_id: parseInt(formData.partido_id),
          equipo_id: parseInt(formData.equipo_id),
          jugador_entra_id: parseInt(formData.jugador_entra_id),
          jugador_sale_id: parseInt(formData.jugador_sale_id),
          minuto: parseInt(formData.minuto)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.mensaje || 'Error al registrar sustitución');
      }

      navigate('/dashboard');
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="form-container">
      <h2>Registrar Sustitución</h2>
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Partido:</label>
          <select
            name="partido_id"
            value={formData.partido_id}
            onChange={handleChange}
            required
          >
            <option value="">Seleccione Partido</option>
            {partidos.map(partido => (
              <option key={partido.ID} value={partido.ID}>
                {`${partido.EQUIPO_LOCAL} vs ${partido.EQUIPO_VISITANTE} - ${partido.FECHA}`}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Equipo:</label>
          <select
            name="equipo_id"
            value={formData.equipo_id}
            onChange={handleChange}
            required
            disabled={!formData.partido_id}
          >
            <option value="">Seleccione Equipo</option>
            {equipos.map(equipo => (
              <option key={equipo.ID} value={equipo.ID}>
                {equipo.NOMBRE}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Jugador que Sale:</label>
          <select
            name="jugador_sale_id"
            value={formData.jugador_sale_id}
            onChange={handleChange}
            required
            disabled={!formData.equipo_id}
          >
            <option value="">Seleccione Jugador</option>
            {jugadoresDisponibles.map(jugador => (
              <option key={jugador.ID} value={jugador.ID}>
                {`${jugador.NOMBRE} ${jugador.APELLIDO} - ${jugador.NUMERO}`}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Jugador que Entra:</label>
          <select
            name="jugador_entra_id"
            value={formData.jugador_entra_id}
            onChange={handleChange}
            required
            disabled={!formData.equipo_id}
          >
            <option value="">Seleccione Jugador</option>
            {jugadoresDisponibles.map(jugador => (
              <option key={jugador.ID} value={jugador.ID}>
                {`${jugador.NOMBRE} ${jugador.APELLIDO} - ${jugador.NUMERO}`}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Minuto:</label>
          <input
            type="number"
            name="minuto"
            value={formData.minuto}
            onChange={handleChange}
            min="1"
            max="120"
            required
          />
        </div>

        <div className="button-group">
          <button type="submit">Guardar</button>
          <button type="button" onClick={() => navigate('/')}>Cancelar</button>
        </div>
      </form>
    </div>
  );
};

export default RegistrarSustitucion;