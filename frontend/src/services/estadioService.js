// frontend/src/services/estadioService.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://192.168.100.16:3000/api';

class EstadioService {
  
  // Configuración base para las peticiones
  static getRequestConfig(method = 'GET', data = null) {
    const config = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (data) {
      config.body = JSON.stringify(data);
    }

    return config;
  }

  // Manejar respuestas de la API
  static async handleResponse(response) {
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `Error HTTP: ${response.status}`);
    }
    
    return data;
  }

  // Obtener todos los estadios
  static async obtenerEstadios() {
    try {
      const response = await fetch(`${API_BASE_URL}/estadios`, this.getRequestConfig());
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error al obtener estadios:', error);
      throw new Error(`Error al obtener estadios: ${error.message}`);
    }
  }

  // Obtener un estadio por ID
  static async obtenerEstadioPorId(id) {
    try {
      if (!id) {
        throw new Error('ID de estadio requerido');
      }

      const response = await fetch(`${API_BASE_URL}/estadios/${id}`, this.getRequestConfig());
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error al obtener estadio:', error);
      throw new Error(`Error al obtener estadio: ${error.message}`);
    }
  }

  // Crear un nuevo estadio
  static async crearEstadio(estadioData) {
    try {
      // Validar datos requeridos
      const camposRequeridos = ['nombre', 'capacidad', 'ciudad', 'fechaInauguracion', 'superficie'];
      const camposFaltantes = camposRequeridos.filter(campo => !estadioData[campo]);
      
      if (camposFaltantes.length > 0) {
        throw new Error(`Campos requeridos faltantes: ${camposFaltantes.join(', ')}`);
      }

      // Validar tipos de datos
      if (isNaN(estadioData.capacidad) || estadioData.capacidad <= 0) {
        throw new Error('La capacidad debe ser un número positivo');
      }

      // Validar formato de fecha
      const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!fechaRegex.test(estadioData.fechaInauguracion)) {
        throw new Error('Formato de fecha inválido. Use YYYY-MM-DD');
      }

      const response = await fetch(
        `${API_BASE_URL}/estadios`, 
        this.getRequestConfig('POST', estadioData)
      );
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error al crear estadio:', error);
      throw new Error(`Error al crear estadio: ${error.message}`);
    }
  }

  // Actualizar un estadio existente
  static async actualizarEstadio(id, estadioData) {
    try {
      if (!id) {
        throw new Error('ID de estadio requerido para actualización');
      }

      // Validar datos requeridos
      const camposRequeridos = ['nombre', 'capacidad', 'ciudad', 'fechaInauguracion', 'superficie'];
      const camposFaltantes = camposRequeridos.filter(campo => !estadioData[campo]);
      
      if (camposFaltantes.length > 0) {
        throw new Error(`Campos requeridos faltantes: ${camposFaltantes.join(', ')}`);
      }

      // Validar tipos de datos
      if (isNaN(estadioData.capacidad) || estadioData.capacidad <= 0) {
        throw new Error('La capacidad debe ser un número positivo');
      }

      const response = await fetch(
        `${API_BASE_URL}/estadios/${id}`, 
        this.getRequestConfig('PUT', estadioData)
      );
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error al actualizar estadio:', error);
      throw new Error(`Error al actualizar estadio: ${error.message}`);
    }
  }

  // Eliminar un estadio
  static async eliminarEstadio(id) {
    try {
      if (!id) {
        throw new Error('ID de estadio requerido para eliminación');
      }

      const response = await fetch(
        `${API_BASE_URL}/estadios/${id}`, 
        this.getRequestConfig('DELETE')
      );
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error al eliminar estadio:', error);
      throw new Error(`Error al eliminar estadio: ${error.message}`);
    }
  }

  // Buscar estadios por nombre o ciudad
  static async buscarEstadios(termino) {
    try {
      const estadios = await this.obtenerEstadios();
      
      if (!termino || termino.trim() === '') {
        return estadios;
      }

      const terminoLowerCase = termino.toLowerCase();
      const estadiosFiltrados = estadios.data.filter(estadio => 
        estadio.NOMBRE.toLowerCase().includes(terminoLowerCase) ||
        estadio.CIUDAD.toLowerCase().includes(terminoLowerCase)
      );

      return {
        ...estadios,
        data: estadiosFiltrados,
        total: estadiosFiltrados.length
      };
    } catch (error) {
      console.error('Error al buscar estadios:', error);
      throw new Error(`Error al buscar estadios: ${error.message}`);
    }
  }

  // Validar si un estadio puede ser eliminado
  static async validarEliminacion(id) {
    try {
      // Esta función podría hacer una petición al backend para verificar
      // si el estadio está siendo usado en partidos antes de permitir la eliminación
      const response = await fetch(
        `${API_BASE_URL}/estadios/${id}/validar-eliminacion`, 
        this.getRequestConfig()
      );
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error al validar eliminación:', error);
      throw new Error(`Error al validar eliminación: ${error.message}`);
    }
  }

  // Obtener estadísticas de uso de un estadio
  static async obtenerEstadisticasEstadio(id) {
    try {
      if (!id) {
        throw new Error('ID de estadio requerido');
      }

      const response = await fetch(
        `${API_BASE_URL}/estadios/${id}/estadisticas`, 
        this.getRequestConfig()
      );
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }
  }
}

export default EstadioService;