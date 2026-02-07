const statsService = require('../services/statsService');

class StatsController {
  // Dimensiones
  async getEquipos(req, res) {
    try {
      const data = await statsService.getEquipos();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getEstadios(req, res) {
    try {
      const data = await statsService.getEstadios();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getJugadores(req, res) {
    try {
      const data = await statsService.getJugadores();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getPaises(req, res) {
    try {
      const data = await statsService.getPaises();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getPosiciones(req, res) {
    try {
      const data = await statsService.getPosiciones();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getJugadorPosiciones(req, res) {
    try {
      const data = await statsService.getJugadorPosiciones();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getTiposEstadistica(req, res) {
    try {
      const data = await statsService.getTiposEstadistica();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getTorneos(req, res) {
    try {
      const data = await statsService.getTorneos();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Métodos para DIM_TORNEO_JUGADOR
  async getTorneoJugadores(req, res) {
    try {
      const torneoJugadores = await statsService.getTorneoJugadores();
      res.json(torneoJugadores);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getTorneoJugadorPorId(req, res) {
    try {
      const { id } = req.params;
      const torneoJugador = await statsService.getTorneoJugadorPorId(id);
      if (torneoJugador) {
        res.json(torneoJugador);
      } else {
        res.status(404).json({ message: 'Torneo jugador no encontrado' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getJugadoresPorTorneo(req, res) {
    try {
      const { torneoId } = req.params;
      const jugadores = await statsService.getJugadoresPorTorneo(torneoId);
      res.json(jugadores);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getJugadoresPorEquipo(req, res) {
    try {
      const { equipoId } = req.params;
      const { torneoId } = req.query;
      const jugadores = await statsService.getJugadoresPorEquipo(equipoId, torneoId);
      res.json(jugadores);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async crearTorneoJugador(req, res) {
    try {
      const result = await statsService.crearTorneoJugador(req.body);
      res.status(201).json({ 
        message: 'Torneo jugador creado exitosamente',
        id: result 
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async actualizarTorneoJugador(req, res) {
    try {
      const { id } = req.params;
      const result = await statsService.actualizarTorneoJugador(id, req.body);
      if (result) {
        res.json({ message: 'Torneo jugador actualizado exitosamente' });
      } else {
        res.status(404).json({ message: 'Torneo jugador no encontrado' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Hechos
  async getEstadisticas(req, res) {
    try {
      const data = await statsService.getEstadisticas();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getGanancias(req, res) {
    try {
      const data = await statsService.getGanancias();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getJugadoresPartido(req, res) {
    try {
      const data = await statsService.getJugadoresPartido();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getModificaciones(req, res) {
    try {
      const data = await statsService.getModificaciones();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getResultados(req, res) {
    try {
      const data = await statsService.getResultados();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

// En statsController.js
async crearJugador(req, res) {
  try {
    console.log('Datos recibidos en controlador:', {
      NOMBRE: req.body.NOMBRE,
      FECHA_NACIMIENTO: req.body.FECHA_NACIMIENTO,
      ID_PAIS: req.body.ID_PAIS,
      ID_POSICION: req.body.ID_POSICION
    });

    // Validar datos
    if (!req.body.NOMBRE || !req.body.FECHA_NACIMIENTO || 
        !req.body.ID_PAIS || !req.body.ID_POSICION) {
      return res.status(400).json({ 
        error: 'Todos los campos son requeridos' 
      });
    }

    const id = await statsService.crearJugador(req.body);
    res.status(201).json({ 
      id, 
      message: 'Jugador creado exitosamente'
    });
  } catch (error) {
    console.error('Error en controlador:', error);
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

async asignarJugadorEquipoTorneo(req, res) {
  try {
    console.log('Datos recibidos:', req.body);
    const result = await statsService.asignarJugadorEquipoTorneo(req.body);
    console.log('Resultado:', result);
    res.status(201).json({ id: result, message: 'Jugador asignado exitosamente' });
  } catch (error) {
    console.error('Error detallado:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
}

async getTorneoJugadoresConDetalles(req, res) {
  try {
    const asignaciones = await statsService.getTorneoJugadoresConDetalles();
    res.json(asignaciones);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

}

module.exports = new StatsController();