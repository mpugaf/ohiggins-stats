import React from 'react';
import './TeamLogo.css';

/**
 * Componente para mostrar la insignia de un equipo
 * @param {string} imagen - Nombre del archivo de imagen o ruta
 * @param {string} nombreEquipo - Nombre del equipo (para alt text)
 * @param {string} size - Tamaño: 'small' | 'medium' | 'large' | 'xlarge'
 * @param {string} className - Clases CSS adicionales
 */
function TeamLogo({ imagen, nombreEquipo, size = 'medium', className = '' }) {
  // Construir ruta de la imagen
  const imagePath = imagen && imagen !== 'default-team.png'
    ? `/images/equipos/${imagen}`
    : '/images/equipos/default-team.png';

  return (
    <div className={`team-logo team-logo-${size} ${className}`}>
      <img
        src={imagePath}
        alt={`Insignia de ${nombreEquipo}`}
        title={nombreEquipo}
        onError={(e) => {
          // Si falla la carga, usar imagen por defecto
          e.target.src = '/images/equipos/default-team.png';
        }}
      />
    </div>
  );
}

export default TeamLogo;
