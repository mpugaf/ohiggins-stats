// frontend/src/services/apiService.js
// Servicio centralizado de API con autenticación automática

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://192.168.100.16:3000';

/**
 * Obtiene el token de autenticación del localStorage
 */
const getAuthToken = () => {
  return localStorage.getItem('token');
};

/**
 * Función helper para hacer peticiones HTTP con autenticación automática
 * @param {string} endpoint - Endpoint de la API (ej: '/api/estadios')
 * @param {object} options - Opciones de fetch (method, body, headers, etc.)
 * @returns {Promise<Response>}
 */
export const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();

  // Preparar headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  // Agregar token si existe
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Construir URL completa
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    // Si recibimos 401 o 403, el token puede haber expirado
    if (response.status === 401 || response.status === 403) {
      console.warn('Token inválido o expirado. Redirigiendo a login...');
      localStorage.removeItem('token');
      window.location.href = '/login';
      throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
    }

    return response;
  } catch (error) {
    console.error('Error en apiRequest:', error);
    throw error;
  }
};

/**
 * Métodos convenientes para operaciones CRUD
 */
export const api = {
  /**
   * GET request
   */
  get: async (endpoint, options = {}) => {
    return apiRequest(endpoint, {
      ...options,
      method: 'GET'
    });
  },

  /**
   * POST request
   */
  post: async (endpoint, data, options = {}) => {
    return apiRequest(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  /**
   * PUT request
   */
  put: async (endpoint, data, options = {}) => {
    return apiRequest(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  /**
   * DELETE request
   */
  delete: async (endpoint, options = {}) => {
    return apiRequest(endpoint, {
      ...options,
      method: 'DELETE'
    });
  }
};

/**
 * Helper para manejar respuestas JSON
 */
export const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error desconocido' }));
    throw new Error(error.error || error.message || 'Error en la petición');
  }
  return response.json();
};

/**
 * Servicios específicos por recurso
 */
export const estadiosService = {
  getAll: () => api.get('/api/estadios'),
  getById: (id) => api.get(`/api/estadios/${id}`),
  create: (data) => api.post('/api/estadios', data),
  update: (id, data) => api.put(`/api/estadios/${id}`, data),
  delete: (id) => api.delete(`/api/estadios/${id}`)
};

export const equiposService = {
  getAll: () => api.get('/api/equipos'),
  getById: (id) => api.get(`/api/equipos/${id}`),
  create: (data) => api.post('/api/equipos', data),
  update: (id, data) => api.put(`/api/equipos/${id}`, data),
  delete: (id) => api.delete(`/api/equipos/${id}`)
};

export const playersService = {
  getAll: () => api.get('/api/players'),
  getById: (id) => api.get(`/api/players/${id}`),
  create: (data) => api.post('/api/players', data),
  update: (id, data) => api.put(`/api/players/${id}`, data),
  delete: (id) => api.delete(`/api/players/${id}`),
  getCountries: () => api.get('/api/players/data/countries'),
  getPositions: () => api.get('/api/players/data/positions'),
  getTeams: () => api.get('/api/equipos') // ✅ CORREGIDO: usar endpoint correcto
};

export const torneosService = {
  getAll: () => api.get('/api/torneos/all'),
  getById: (id) => api.get(`/api/torneos/${id}`),
  create: (data) => api.post('/api/torneos', data),
  update: (id, data) => api.put(`/api/torneos/${id}`, data),
  delete: (id) => api.delete(`/api/torneos/${id}`),
  getPaises: () => api.get('/api/torneos/data/paises'),
  getPositions: () => api.get('/api/torneos/data/positions'),
  getJugadores: (torneoId) => api.get(`/api/torneos/${torneoId}/jugadores`),
  getEquipos: (torneoId) => api.get(`/api/torneos/${torneoId}/equipos`),
  getEquipoJugadores: (torneoId, equipoId) => api.get(`/api/torneos/${torneoId}/equipos/${equipoId}/jugadores`),
  createAsignacion: (data) => api.post('/api/torneos/asignaciones', data),
  deleteAsignacion: (torneoId, equipoId, jugadorId) =>
    api.delete(`/api/torneos/${torneoId}/equipos/${equipoId}/jugadores/${jugadorId}`),
  updateAsignacion: (torneoId, equipoId, jugadorId, data) =>
    api.put(`/api/torneos/${torneoId}/equipos/${equipoId}/jugadores/${jugadorId}`, data)
};

export const partidosService = {
  getAll: (params) => {
    const queryString = params ? `?${new URLSearchParams(params)}` : '';
    return api.get(`/api/partidos${queryString}`);
  },
  getById: (id) => api.get(`/api/partidos/${id}`),
  create: (data) => api.post('/api/partidos', data),
  update: (id, data) => api.put(`/api/partidos/${id}`, data),
  delete: (id) => api.delete(`/api/partidos/${id}`),
  getEquipos: (partidoId) => api.get(`/api/partidos/${partidoId}/equipos`),
  getTorneos: () => api.get('/api/partidos/data/torneos'),
  getEquiposData: () => api.get('/api/partidos/data/equipos'),
  getEstadios: () => api.get('/api/partidos/data/estadios')
};

export const cuotasService = {
  getPartidos: () => api.get('/api/cuotas/partidos'),
  getPartidosSinApostar: () => api.get('/api/cuotas/partidos-sin-apostar'),
  getByPartido: (idPartido) => api.get(`/api/cuotas/partido/${idPartido}`),
  create: (data) => api.post('/api/cuotas', data),
  update: (idCuota, data) => api.put(`/api/cuotas/${idCuota}`, data)
};

export const apuestasService = {
  getMisApuestas: (params) => {
    const queryString = params ? `?${new URLSearchParams(params)}` : '';
    return api.get(`/api/apuestas/mis-apuestas${queryString}`);
  },
  getEstadisticas: () => api.get('/api/apuestas/estadisticas'),
  getTorneosYFechas: () => api.get('/api/apuestas/torneos-fechas'),
  create: (data) => api.post('/api/apuestas', data),
  liquidar: (idPartido) => api.post(`/api/apuestas/liquidar/${idPartido}`),
  getUsuariosConApuestas: (idTorneo) => api.get(`/api/apuestas/admin/usuarios-torneo/${idTorneo}`),
  limpiarApuestasUsuario: (idUsuario, idTorneo) => api.delete(`/api/apuestas/admin/limpiar/${idUsuario}/${idTorneo}`)
};

export const usuariosService = {
  getAll: () => api.get('/api/usuarios'),
  getById: (id) => api.get(`/api/usuarios/${id}`),
  create: (data) => api.post('/api/usuarios', data),
  delete: (id) => api.delete(`/api/usuarios/${id}`),
  toggleActivo: (id) => apiRequest(`/api/usuarios/${id}/toggle-activo`, { method: 'PATCH' })
};

export const configApuestasService = {
  getConfig: () => api.get('/api/config-apuestas'),
  updateConfig: (data) => api.put('/api/config-apuestas', data),
  getTorneosFechas: () => api.get('/api/config-apuestas/torneos-fechas')
};

export const pronosticosService = {
  getTodos: () => api.get('/api/pronosticos'),
  getTablaPosiciones: () => api.get('/api/pronosticos/tabla-posiciones'),
  getApuestasPorPartido: () => api.get('/api/pronosticos/apuestas-por-partido')
};

export const partidosHistoricoService = {
  getPartidosHistoricos: (params) => {
    const queryString = params ? `?${new URLSearchParams(params)}` : '';
    return api.get(`/api/partidos-historico${queryString}`);
  },
  getTorneos: () => api.get('/api/partidos-historico/torneos'),
  getFechasPorTorneo: (torneoId) => api.get(`/api/partidos-historico/torneos/${torneoId}/fechas`)
};

export const torneoJugadorService = {
  getAsignaciones: () => api.get('/api/torneo-jugador'),
  getAsignacionesPorJugador: (idJugador) => api.get(`/api/torneo-jugador/jugador/${idJugador}`),
  getUltimaAsignacion: (idJugador) => api.get(`/api/torneo-jugador/jugador/${idJugador}/ultima`),
  crearAsignacion: (data) => api.post('/api/torneo-jugador', data),
  actualizarAsignacion: (id, data) => api.put(`/api/torneo-jugador/${id}`, data),
  eliminarAsignacion: (id) => api.delete(`/api/torneo-jugador/${id}`),
  // Asignación masiva
  crearAsignacionMasiva: (data) => api.post('/api/torneo-jugador/asignacion-masiva', data),
  actualizarCamisetaTemporada: (data) => api.put('/api/torneo-jugador/actualizar-camiseta-temporada', data)
};

export default api;
