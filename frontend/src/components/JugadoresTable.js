// Componente actualizado para mostrar jugadores con correcciones
// frontend/src/components/JugadoresTable.js

import React from 'react';

const JugadoresTable = ({ jugadores, onEdit, onDelete, loading }) => {
  
  // Función para formatear fecha
  const formatearFecha = (fecha) => {
    if (!fecha) return 'No especificada';
    return new Date(fecha).toLocaleDateString('es-ES');
  };

  // Función para mostrar posiciones completas
  const mostrarPosiciones = (posiciones) => {
    if (!posiciones || posiciones.length === 0) {
      return <span className="sin-posiciones">Sin posiciones</span>;
    }
    
    return (
      <div className="posiciones-cell">
        {posiciones.map((posicion, index) => (
          <span key={index} className="posicion-badge">
            {/* ✅ CORRECCIÓN: Mostrar nombre completo en lugar de código */}
            {posicion.nombre}
          </span>
        ))}
      </div>
    );
  };

  // Función para mostrar número de camiseta
  const mostrarNumeroCamiseta = (numero) => {
    if (!numero) {
      return <span className="sin-numero">S/N</span>;
    }
    
    return (
      <span className="numero-camiseta-cell">
        {/* ✅ CORRECCIÓN: Mostrar número de camiseta de forma destacada */}
        #{numero}
      </span>
    );
  };

  // Función para mostrar nacionalidades
  const mostrarNacionalidades = (nacionalidades) => {
    if (!nacionalidades || nacionalidades.length === 0) {
      return <span className="sin-nacionalidades">No especificada</span>;
    }
    
    return (
      <div className="nacionalidades-cell">
        {nacionalidades.map((nacionalidad, index) => (
          <span key={index} className="nacionalidad-badge">
            {nacionalidad.codigo}
          </span>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando jugadores...</p>
      </div>
    );
  }

  if (!jugadores || jugadores.length === 0) {
    return (
      <div className="no-data">
        <p>No hay jugadores registrados en este torneo y equipo.</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="players-table">
        <thead>
          <tr>
            <th>Número</th> {/* ✅ NUEVA COLUMNA para número de camiseta */}
            <th>Nombre Completo</th>
            <th>Apodo</th>
            <th>Posiciones</th> {/* ✅ CORREGIDA para mostrar nombres completos */}
            <th>Nacionalidades</th>
            <th>Fecha Nacimiento</th>
            <th>Pie Dominante</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {jugadores.map((jugador) => (
            <tr key={jugador.PLAYER_ID_FBR}>
              {/* ✅ NUEVA CELDA: Número de camiseta */}
              <td>
                {mostrarNumeroCamiseta(jugador.numero_camiseta)}
              </td>
              
              <td className="nombre-completo">
                {jugador.NOMBRE_COMPLETO}
              </td>
              
              <td className="apodo">
                {jugador.APODO || <span className="sin-apodo">Sin apodo</span>}
              </td>
              
              {/* ✅ CORREGIDA: Posiciones con nombres completos */}
              <td>
                {mostrarPosiciones(jugador.posiciones)}
              </td>
              
              <td>
                {mostrarNacionalidades(jugador.nacionalidades)}
              </td>
              
              <td>
                {formatearFecha(jugador.FECHA_NACIMIENTO)}
              </td>
              
              <td className="pie-dominante">
                {jugador.PIE_DOMINANTE || 'No especificado'}
              </td>
              
              <td>
                <span className={`estado-badge ${jugador.estado?.toLowerCase() || 'activo'}`}>
                  {jugador.estado || 'ACTIVO'}
                </span>
              </td>
              
              <td className="acciones">
                <button
                  onClick={() => onEdit(jugador)}
                  className="btn-edit"
                  title="Editar jugador"
                >
                  ✏️
                </button>
                <button
                  onClick={() => onDelete(jugador)}
                  className="btn-delete"
                  title="Eliminar jugador"
                >
                  🗑️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <div className="table-footer">
        <p className="results-count">
          Total: {jugadores.length} jugador{jugadores.length !== 1 ? 'es' : ''}
        </p>
      </div>
    </div>
  );
};

export default JugadoresTable;