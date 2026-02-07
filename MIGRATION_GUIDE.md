# Guía de Migración - Autenticación Centralizada

## Resumen del Problema

Los componentes del frontend estaban haciendo peticiones HTTP usando `fetch()` directo sin incluir el token JWT de autenticación en los headers. Esto causaba errores **401 Unauthorized** en todos los endpoints protegidos.

## Solución Implementada

Se creó un servicio centralizado de API (`frontend/src/services/apiService.js`) que:

✅ Incluye automáticamente el token JWT en todas las peticiones
✅ Maneja errores 401/403 y redirige a login cuando el token expira
✅ Provee métodos convenientes para operaciones CRUD
✅ Incluye servicios específicos para cada recurso del backend

## Componentes Ya Actualizados

- ✅ **Dashboard.js** - Ejemplo de implementación con `Promise.all` para carga paralela

## Componentes que Requieren Migración

### Alta Prioridad (Administración de Datos)
- [ ] **PlayersManager.js** - CRUD de jugadores
- [ ] **TorneosManager.js** - CRUD de torneos
- [ ] **PartidosManager.js** - CRUD de partidos
- [ ] **NuevoEstadio.js, ListaEstadios.js, EditarEstadio.js** - CRUD de estadios
- [ ] **NuevoEquipo.js, ListaEquipos.js, EditarEquipo.js** - CRUD de equipos
- [ ] **NuevoTorneo.js, ListaTorneos.js, EditarTorneo.js** - Torneos

### Media Prioridad (Asignaciones)
- [ ] **AsignacionJugador.js** - Asignar jugadores a torneos/equipos
- [ ] **ListadoJugadores.js** - Ver asignaciones
- [ ] **TorneoManager.js** - Gestión de torneos
- [ ] **RegistrarSustitucion.js** - Sustituciones

### Baja Prioridad (Sistema de Apuestas)
- [ ] **admin/GestionCuotas.js** - Gestión de cuotas (admin)
- [ ] **admin/LiquidarApuestas.js** - Liquidar apuestas (admin)
- [ ] **apuestas/MisApuestas.js** - Ver mis apuestas
- [ ] **apuestas/EstadisticasUsuario.js** - Estadísticas de apuestas
- [ ] **apuestas/PartidosDisponibles.js** - Partidos disponibles para apostar

## Patrón de Migración

### Ejemplo: PlayersManager.js

**ANTES:**
```javascript
import React, { useState, useEffect } from 'react';

const PlayersManager = () => {
  const [players, setPlayers] = useState([]);

  const cargarJugadores = async () => {
    try {
      // ❌ Sin autenticación
      const response = await fetch('http://192.168.100.16:3000/api/players');
      const data = await response.json();
      setPlayers(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const crearJugador = async (jugadorData) => {
    try {
      // ❌ Sin autenticación
      const response = await fetch('http://192.168.100.16:3000/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jugadorData)
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    cargarJugadores();
  }, []);

  return <div>...</div>;
};
```

**DESPUÉS:**
```javascript
import React, { useState, useEffect } from 'react';
import { playersService, handleResponse } from '../services/apiService';

const PlayersManager = () => {
  const [players, setPlayers] = useState([]);

  const cargarJugadores = async () => {
    try {
      // ✅ Con autenticación automática
      const response = await playersService.getAll();
      const data = await handleResponse(response);
      setPlayers(data);
    } catch (error) {
      console.error('Error:', error.message);
      // Si token expiró, apiService redirige automáticamente a login
    }
  };

  const crearJugador = async (jugadorData) => {
    try {
      // ✅ Con autenticación automática
      const response = await playersService.create(jugadorData);
      const data = await handleResponse(response);
      return data;
    } catch (error) {
      console.error('Error:', error.message);
      throw error;
    }
  };

  useEffect(() => {
    cargarJugadores();
  }, []);

  return <div>...</div>;
};
```

## Cambios Paso a Paso

1. **Agregar import del servicio:**
   ```javascript
   import { playersService, handleResponse } from '../services/apiService';
   ```

2. **Reemplazar `fetch()` por el servicio específico:**
   - `fetch('/api/players')` → `playersService.getAll()`
   - `fetch('/api/players', { method: 'POST', ... })` → `playersService.create(data)`
   - `fetch('/api/players/123', { method: 'PUT', ... })` → `playersService.update(123, data)`
   - `fetch('/api/players/123', { method: 'DELETE' })` → `playersService.delete(123)`

3. **Usar `handleResponse()` para procesar respuestas:**
   ```javascript
   const response = await playersService.getAll();
   const data = await handleResponse(response);
   ```

4. **Eliminar construcción manual de URLs:**
   - ❌ `'http://192.168.100.16:3000/api/players'`
   - ✅ `playersService.getAll()` (URL ya incluida en el servicio)

5. **Eliminar headers manuales:**
   - ❌ `{ headers: { 'Content-Type': 'application/json', 'Authorization': ... } }`
   - ✅ El servicio los maneja automáticamente

## Servicios Disponibles

### estadiosService
```javascript
import { estadiosService, handleResponse } from '../services/apiService';

// GET /api/estadios
const response = await estadiosService.getAll();
const estadios = await handleResponse(response);

// GET /api/estadios/:id
const response = await estadiosService.getById(id);
const estadio = await handleResponse(response);

// POST /api/estadios
const response = await estadiosService.create(data);
const nuevoEstadio = await handleResponse(response);

// PUT /api/estadios/:id
const response = await estadiosService.update(id, data);
const estadioActualizado = await handleResponse(response);

// DELETE /api/estadios/:id
await estadiosService.delete(id);
```

### equiposService
```javascript
// Mismos métodos que estadiosService
equiposService.getAll()
equiposService.getById(id)
equiposService.create(data)
equiposService.update(id, data)
equiposService.delete(id)
```

### playersService
```javascript
// CRUD básico
playersService.getAll()
playersService.getById(id)
playersService.create(data)
playersService.update(id, data)
playersService.delete(id)

// Métodos adicionales
playersService.getCountries()  // GET /api/players/data/countries
playersService.getPositions()  // GET /api/players/data/positions
playersService.getTeams()      // GET /api/players/data/teams
```

### torneosService
```javascript
// CRUD básico
torneosService.getAll()        // GET /api/torneos/all
torneosService.getById(id)
torneosService.create(data)
torneosService.update(id, data)
torneosService.delete(id)

// Métodos específicos
torneosService.getPaises()                              // GET /api/torneos/data/paises
torneosService.getJugadores(torneoId)                   // GET /api/torneos/:id/jugadores
torneosService.getEquipos(torneoId)                     // GET /api/torneos/:id/equipos
torneosService.getEquipoJugadores(torneoId, equipoId)   // GET /api/torneos/:id/equipos/:id/jugadores
torneosService.createAsignacion(data)                   // POST /api/torneos/asignaciones
torneosService.deleteAsignacion(torneoId, equipoId, jugadorId)  // DELETE
torneosService.updateAsignacion(torneoId, equipoId, jugadorId, data)  // PUT
```

### partidosService
```javascript
// CRUD básico con parámetros opcionales
partidosService.getAll()                    // GET /api/partidos
partidosService.getAll({ torneo: 1 })       // GET /api/partidos?torneo=1
partidosService.getById(id)
partidosService.create(data)
partidosService.update(id, data)
partidosService.delete(id)

// Métodos específicos
partidosService.getEquipos(partidoId)      // GET /api/partidos/:id/equipos
```

### cuotasService
```javascript
cuotasService.getPartidos()                 // GET /api/cuotas/partidos
cuotasService.getByPartido(idPartido)       // GET /api/cuotas/partido/:id
cuotasService.create(data)                  // POST /api/cuotas
cuotasService.update(idCuota, data)         // PUT /api/cuotas/:id
```

### apuestasService
```javascript
apuestasService.getMisApuestas()            // GET /api/apuestas/mis-apuestas
apuestasService.getEstadisticas()           // GET /api/apuestas/estadisticas
apuestasService.create(data)                // POST /api/apuestas
apuestasService.liquidar(idPartido)         // POST /api/apuestas/liquidar/:id
```

## API Genérica

Si necesitas un endpoint que no tiene servicio específico:

```javascript
import { api, handleResponse } from '../services/apiService';

// GET request
const response = await api.get('/api/custom-endpoint');
const data = await handleResponse(response);

// POST request
const response = await api.post('/api/custom-endpoint', { field: 'value' });
const data = await handleResponse(response);

// PUT request
const response = await api.put('/api/custom-endpoint/123', { updated: 'value' });
const data = await handleResponse(response);

// DELETE request
await api.delete('/api/custom-endpoint/123');
```

## Manejo de Errores

El servicio maneja automáticamente:

1. **Token Expirado (401/403):**
   - Elimina token de localStorage
   - Redirige a `/login`
   - Lanza excepción con mensaje descriptivo

2. **Errores de Red:**
   - Lanza excepción con mensaje de error
   - Debe ser capturado con try/catch

```javascript
try {
  const response = await estadiosService.getAll();
  const data = await handleResponse(response);
  // Procesar datos exitosamente
} catch (error) {
  console.error('Error:', error.message);
  // Mostrar mensaje al usuario
  alert(`Error: ${error.message}`);
}
```

## Testing

Después de migrar un componente:

1. ✅ Hacer login con usuario admin
2. ✅ Navegar al componente migrado
3. ✅ Verificar que carga datos correctamente
4. ✅ Probar operaciones CRUD (crear, editar, eliminar)
5. ✅ Verificar que no hay errores 401 en consola
6. ✅ Probar con token expirado (esperar 24h o modificar JWT_EXPIRES_IN)

## Notas Importantes

- ⚠️ El token JWT expira en 24 horas (configurable en `backend/.env` con `JWT_EXPIRES_IN`)
- ⚠️ Después de logout, todas las peticiones fallarán con 401 (comportamiento esperado)
- ⚠️ Si cambias `JWT_SECRET`, todos los tokens existentes quedarán inválidos
- ✅ Los servicios ya incluyen `Content-Type: application/json` automáticamente
- ✅ No necesitas construir URLs manualmente
- ✅ El manejo de errores es consistente en toda la aplicación

## Progreso de Migración

**Completado:** 1/30 componentes (3.3%)

**Dashboard.js** - ✅ Migrado y funcionando correctamente

**Pendientes:** 29 componentes

---

**Última actualización:** 2026-01-22
