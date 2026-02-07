// frontend/src/config/api.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://192.168.100.16:3000';

export const API_ENDPOINTS = {
  estadios: `${API_BASE_URL}/api/estadios`,
  jugadores: `${API_BASE_URL}/api/jugadores`,
  equipos: `${API_BASE_URL}/api/equipos`,
  torneos: `${API_BASE_URL}/api/torneos`
};

export default API_BASE_URL;