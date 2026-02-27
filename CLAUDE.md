# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

O'Higgins Stats is a full-stack statistics system for O'Higgins football team with three main components:
- **Backend**: REST API (Node.js + Express + MySQL/PostgreSQL)
- **Frontend**: Web application (React 18 + React Router)
- **Data Pipeline**: Python ETL processes for importing data from FBRef API

## Comandos Rápidos de Ejecución

Para iniciar la aplicación completa, ejecuta estos comandos en terminales separadas desde la raíz del proyecto:

**Backend (Terminal 1):**
```bash
cd backend && npm run dev
```

**Frontend (Terminal 2):**
```bash
cd frontend && npm start
```

Una vez iniciados:
- **Frontend**: http://192.168.100.16:3001 o http://localhost:3001
- **Backend API**: http://192.168.100.16:3000/api/
- **Health Check**: http://192.168.100.16:3000/api/health

## Quick Start - Running the Application

### Prerequisites
1. Node.js and npm installed
2. MySQL database running on `192.168.100.16:3306`
3. Database `MP_DATA_DEV` created with proper schema

### Start Backend (Terminal 1)
```bash
cd backend
npm install                    # First time only
npm start                      # Production mode
# OR
npm run dev                    # Development mode with auto-reload (nodemon)
```
Backend will start on: **http://192.168.100.16:3000**

### Start Frontend (Terminal 2)
```bash
cd frontend
npm install                    # First time only
npm start                      # Starts dev server
```
Frontend will start on: **http://192.168.100.16:3001**

### Access the Application
Once both servers are running:
- **Frontend UI**: Open browser to `http://192.168.100.16:3001` or `http://localhost:3001`
- **Backend API**: Available at `http://192.168.100.16:3000/api/`
- **Health Check**: `http://192.168.100.16:3000/api/health`

## Development Commands

### Backend

```bash
cd backend
npm install                    # Install dependencies
npm start                      # Start server (production mode)
npm run dev                    # Start server (development mode with nodemon)
node scripts/testConnection.js # Test database connection
```

**Available Scripts:**
- `npm start` - Start backend in production mode (uses node)
- `npm run dev` - Start backend in development mode with auto-reload (uses nodemon)

**Configuration:**
- Copy `backend/.env.example` to `backend/.env` and configure your database credentials
- The backend runs on `http://192.168.100.16:3000` by default (configurable via PORT env var)
- CORS is pre-configured for `http://192.168.100.16:3001` and `http://localhost:3001`

**Environment Variables Required:**
```env
DB_HOST=192.168.100.16
DB_USER=mpuga
DB_PASSWORD=your_password
DB_NAME=MP_DATA_DEV
DB_PORT=3306
PORT=3000
JWT_SECRET=your_jwt_secret_min_32_chars
```

### Frontend

```bash
cd frontend
npm install                  # Install dependencies
npm start                    # Start dev server
npm run build               # Production build
npm test                    # Run tests
npm run eject               # Eject from create-react-app (irreversible)
```

**Available Scripts:**
- `npm start` - Start React development server (opens browser automatically)
- `npm run build` - Create optimized production build
- `npm test` - Run test suite with Jest
- `npm run eject` - Eject from create-react-app configuration (use with caution)

**Configuration:**
- Frontend runs on `http://192.168.100.16:3001` (configurable via PORT env var in .env)
- Backend API URL is configured in `frontend/.env`:
  ```env
  REACT_APP_API_URL=http://192.168.100.16:3000
  PORT=3001
  ```
- The frontend automatically proxies API requests to the backend

**Browser Access:**
- Local: `http://localhost:3001`
- Network: `http://192.168.100.16:3001`

### Data Pipeline

```bash
cd statsPipeline
pip install -r requirements.txt                    # Install Python dependencies
mysql -u mpuga -p MP_DATA_DEV < 01_update_database_schema.sql  # Update DB schema
python 04_run_complete_pipeline.py                 # Run complete pipeline
python 02_players_data_pipeline.py                 # Run players pipeline only
python 03_validate_pipeline.py                     # Validate pipeline results
```

## Architecture

### Backend Structure

The backend follows a classic MVC pattern with Express:

```
backend/
├── app.js                   # Main application entry point with route loading
├── config/database.js       # MySQL connection pool and query utilities
├── routes/                  # Route definitions (equipos, estadios, players, torneos, partidos)
├── controllers/             # Business logic handlers
└── services/                # Data access layer
```

**Key Points:**
- Environment variables are loaded via `dotenv` in `app.js` BEFORE importing routes
- Database configuration supports both MySQL2 and PostgreSQL (pg) drivers
- The `executeQuery()` helper in `config/database.js` provides promise-based query execution
- All routes follow pattern: `/api/{resource}` (e.g., `/api/equipos`, `/api/players`)
- Route loading in `app.js` includes try-catch blocks with detailed error logging
- Database pool is created on module load with connection testing

### Frontend Structure

React SPA with client-side routing:

```
frontend/src/
├── App.js                   # Main router with all application routes
├── components/              # UI components (forms, lists, managers)
├── config/api.js           # API base URL and endpoints configuration
└── services/               # API client services (e.g., estadioService.js)
```

**Key Points:**
- API base URL configured via `REACT_APP_API_URL` environment variable, defaults to `http://192.168.100.16:3000`
- Routes are organized by resource: estadios, equipos, jugadores, torneos, partidos
- Components follow naming pattern: `Nuevo{Resource}`, `Lista{Resources}`, `Editar{Resource}`, `{Resource}Manager`

### Data Pipeline Architecture

Python-based ETL system for importing FBRef API data:

```
statsPipeline/
├── 01_update_database_schema.sql    # Schema updates (DIM_JUGADOR, DIM_PAIS, DIM_POSICION)
├── 02_players_data_pipeline.py      # Main ETL: CSV → Database
├── 03_validate_pipeline.py          # Data validation and integrity checks
└── 04_run_complete_pipeline.py      # Orchestrator for full pipeline execution
```

**Pipeline Flow:**
1. CSV data from FBRef API (team players) → Validation
2. Process `DIM_JUGADOR` (players with PLAYER_ID_FBR as unique key)
3. Process `DIM_PAIS` (countries with FIFA codes)
4. Process `DIM_POSICION` (positions: GK, DF, MF, FW, etc.)
5. Create relationships: `DIM_JUGADOR_PAIS`, `DIM_JUGADOR_POSICION`
6. Validation reports and logging

**Key Points:**
- Uses `PLAYER_ID_FBR` (FBRef ID) as integration key, not `ID_JUGADOR` (autoincrement)
- Handles multiple positions per player and multiple nationalities
- Automatic creation of missing countries/positions
- Comprehensive logging to `players_pipeline.log` and timestamped execution logs
- Prepared statements prevent SQL injection

### Database Configuration

Connection config in `backend/config/database.js`:
- Host: `DB_HOST` (default: `192.168.100.16`)
- User: `DB_USER` (default: `mpuga`)
- Database: `DB_NAME` (default: `MP_DATA_DEV`)
- Port: `DB_PORT` (default: `3306`)
- Connection pool: 10 connections, unlimited queue

Create `.env` file in `backend/` directory with:
```
DB_HOST=192.168.100.16
DB_USER=mpuga
DB_PASSWORD=your_password
DB_NAME=MP_DATA_DEV
DB_PORT=3306
PORT=3000
```

Python pipelines hardcode database config - update in each script's `DB_CONFIG` dictionary.

## API Endpoints

Main resources exposed by backend:

- `GET/POST /api/estadios` - Stadiums
- `GET/POST /api/equipos` - Teams
- `GET/POST /api/players` - Players
- `GET/POST /api/torneos` - Tournaments
- `GET/POST /api/partidos` - Matches
- `GET /api/health` - Health check endpoint

Each resource typically supports:
- `GET /` - List all
- `GET /:id` - Get by ID
- `POST /` - Create new
- `PUT /:id` - Update
- `DELETE /:id` - Delete

## Common Patterns

### Adding a New API Resource

1. Create controller in `backend/controllers/{resource}Controller.js`
2. Create route file in `backend/routes/{resource}.js` following existing pattern (see `equipos.js`)
3. Import and mount route in `backend/app.js` with error handling
4. Update `app.js` root endpoint documentation
5. Add frontend API endpoint in `frontend/src/config/api.js`
6. Create React components: `Nuevo{Resource}`, `Lista{Resources}`, `Editar{Resource}`
7. Add routes in `frontend/src/App.js`

### Database Query Pattern

```javascript
const { executeQuery } = require('../config/database');

// Using promise-based helper
const results = await executeQuery('SELECT * FROM tabla WHERE id = ?', [id]);

// Or using pool directly
const { pool } = require('../config/database');
pool.execute(query, params, (err, results) => { /* ... */ });
```

### Route Definition Pattern

Routes follow this structure (from `backend/routes/equipos.js`):
- Logging middleware for all requests
- Controller method verification
- Route handlers calling controller functions
- Detailed console logging for each operation

## External Dependencies

### fbr_api_project
Contains scripts for fetching data from FBRef (Football Reference) API:
- `getChileanMatchesEnhanced_Modified.py` - Fetch match data
- `fill_dim_torneo.py` - Populate tournament dimension
- Requires `api_key.json` for authentication
- Logs stored in `logs/` directory

This component generates CSV files consumed by the statsPipeline.

## Testing & Validation

- Frontend: Jest + React Testing Library (`npm test`)
- Backend: No test framework currently configured
- Pipeline: `03_validate_pipeline.py` validates data integrity, relationships, and generates statistics reports

## Network Configuration

The application is configured for local network access on `192.168.100.16`:
- Backend serves on `192.168.100.16:3000`
- Frontend expects API at this address
- CORS is configured for both `192.168.100.16:3001` and `localhost:3001`

When developing locally, update these addresses in:
- `frontend/src/config/api.js` (API_BASE_URL)
- `backend/app.js` (CORS origins)
- Environment variables (REACT_APP_API_URL)

## Base de Datos - Estructura y Relaciones

### Información de Conexión

- **Host**: 192.168.100.16:3306
- **Base de Datos**: MP_DATA_DEV
- **Usuario**: mpuga
- **Tipo**: MySQL 5.7+
- **Motor**: InnoDB
- **Charset**: utf8mb4

### Credenciales de Acceso a la Aplicación

**Usuario Administrador:**
- Username: `admin`
- Password: `password`
- Email: admin@ohiggins-stats.com
- Permisos: Administración completa del sistema (no puede apostar)

**Usuario de Prueba:**
- Username: `usuario_test`
- Password: `password`
- Email: test@ohiggins-stats.com
- Permisos: Usuario regular con capacidad de apostar

### Arquitectura de Datos

La base de datos sigue un modelo **Estrella (Star Schema)** con tablas de dimensiones (DIM_*), tablas de hechos (HECHOS_*) y tablas transaccionales (usuarios, apuestas).

#### Tablas de Dimensiones (DIM_*)

**1. DIM_TORNEO** - Torneos y Competiciones
```
ID_TORNEO (PK, autoincrement)
LEAGUE_ID_FBR (clave de integración con FBRef API)
NOMBRE (nombre del torneo, ej: "Primera División Chile")
TEMPORADA (formato: "2024-2025")
PAIS_ORGANIZADOR (código ISO 3 letras)
RUEDA (PRIMERA|SEGUNDA|UNICA)
```

**2. DIM_EQUIPO** - Equipos de Fútbol
```
ID_EQUIPO (PK, autoincrement)
TEAM_ID_FBR (clave única de integración FBRef)
NOMBRE (nombre oficial del equipo)
APODO (apodo o sobrenombre)
CIUDAD (ciudad sede del equipo)
FECHA_FUNDACION (fecha de fundación del club)
```

**3. DIM_ESTADIO** - Estadios
```
ID_ESTADIO (PK, autoincrement)
NOMBRE (nombre del estadio, único)
CAPACIDAD (capacidad de espectadores)
CIUDAD (ciudad donde se ubica)
FECHA_INAUGURACION
SUPERFICIE (tipo de superficie: césped natural, sintético, etc.)
FECHA_CREACION (timestamp)
```

**4. DIM_JUGADOR** - Jugadores
```
ID_JUGADOR (PK, autoincrement)
PLAYER_ID_FBR (clave única de integración FBRef)
NOMBRE_COMPLETO (nombre completo del jugador)
APODO (alias o apodo del jugador)
FECHA_NACIMIENTO
PIE_DOMINANTE (LEFT|RIGHT|BOTH)
ALTURA_CM (decimal)
PESO_KG (decimal)
CIUDAD_NACIMIENTO
SALARIO
URL_FOTO (URL de la foto del jugador)
```

**5. DIM_PAIS** - Países
```
ID_PAIS (PK, autoincrement)
NOMBRE (código ISO 3 letras)
CODIGO_FIFA (código FIFA)
NOMBRE_COMPLETO (nombre completo del país)
```

**6. DIM_POSICION** - Posiciones de Juego
```
ID_POSICION (PK, autoincrement)
NOMBRE (GK, DF, MF, FW, CB, FB, CM, AM, etc.)
DESCRIPCION (descripción de la posición)
```

**7. DIM_TIPO_ESTADISTICA** - Tipos de Estadísticas
```
ID_TIPO_ESTADISTICA (PK)
NOMBRE (nombre de la métrica)
CATEGORIA (categoría de la estadística)
DESCRIPCION
UNIDAD_MEDIDA
```

#### Tablas de Hechos (HECHOS_*)

**1. HECHOS_RESULTADOS** - Resultados de Partidos
```
ID_PARTIDO (PK, autoincrement)
MATCH_ID_FBR (clave única FBRef)
ID_TORNEO (FK → DIM_TORNEO)
FECHA_PARTIDO (datetime)
FECHA_TORNEO (jornada/fecha del torneo)
ID_EQUIPO_LOCAL (FK → DIM_EQUIPO)
ID_EQUIPO_VISITA (FK → DIM_EQUIPO)
ID_ESTADIO (FK → DIM_ESTADIO)
GOLES_LOCAL (default: 0)
GOLES_VISITA (default: 0)
ES_CAMPO_NEUTRO (boolean)
ARBITRO
ASISTENCIA (número de espectadores)
CLIMA
ESTADO_PARTIDO (PROGRAMADO|EN_CURSO|FINALIZADO|SUSPENDIDO|CANCELADO)
FECHA_CREACION (timestamp)
```

**2. HECHOS_JUGADORES_PARTIDO** - Participación de Jugadores en Partidos
```
ID_JUGADOR_PARTIDO (PK)
ID_PARTIDO (FK → HECHOS_RESULTADOS)
ID_JUGADOR (FK → DIM_JUGADOR)
ID_EQUIPO (FK → DIM_EQUIPO)
ES_TITULAR (boolean)
MINUTOS_JUGADOS
GOLES
ASISTENCIAS
TARJETAS_AMARILLAS
TARJETAS_ROJAS
```

**3. HECHOS_ESTADISTICAS** - Estadísticas Generales
```
ID_ESTADISTICA (PK)
ID_TIPO_ESTADISTICA (FK → DIM_TIPO_ESTADISTICA)
ID_JUGADOR (FK → DIM_JUGADOR)
ID_PARTIDO (FK → HECHOS_RESULTADOS)
VALOR_NUMERICO (valor de la métrica)
FECHA_REGISTRO
```

**4. HECHOS_JUGADOR_ROSTER** - Roster de Jugadores por Temporada
```
ID_JUGADOR_ROSTER (PK)
ID_JUGADOR (FK → DIM_JUGADOR)
ID_EQUIPO (FK → DIM_EQUIPO)
ID_TORNEO (FK → DIM_TORNEO)
TEMPORADA
EDAD_ROSTER
PARTIDOS_JUGADOS
PARTIDOS_TITULAR
POSICION_PRINCIPAL
FECHA_REGISTRO
```

#### Tablas de Relaciones (Muchos a Muchos)

**1. DIM_JUGADOR_PAIS** - Nacionalidades de Jugadores
```
ID_JUGADOR_PAIS (PK)
ID_JUGADOR (FK → DIM_JUGADOR)
ID_PAIS (FK → DIM_PAIS)
ES_PAIS_PRIMARIO (boolean)
```

**2. DIM_JUGADOR_POSICION** - Posiciones de Jugadores
```
ID_JUGADOR_POSICION (PK)
ID_JUGADOR (FK → DIM_JUGADOR)
ID_POSICION (FK → DIM_POSICION)
ES_POSICION_PRINCIPAL (boolean)
ES_POSICION_ROSTER (boolean)
TEMPORADA
```

**3. DIM_TORNEO_JUGADOR** - Asignación de Jugadores a Torneos/Equipos
```
ID_TORNEO_JUGADOR (PK)
ID_TORNEO (FK → DIM_TORNEO)
ID_JUGADOR (FK → DIM_JUGADOR)
ID_EQUIPO (FK → DIM_EQUIPO)
FECHA_ASIGNACION
ACTIVO (boolean)
```

#### Sistema de Autenticación y Apuestas

**1. usuarios** - Usuarios del Sistema
```
id_usuario (PK, autoincrement)
username (único, requerido)
email (único, requerido)
password_hash (hash bcrypt)
nombre_completo
role (admin|usuario)
puede_apostar (boolean, default: 1)
fecha_creacion (timestamp)
ultimo_acceso (timestamp)
activo (boolean, default: 1)
```

**2. cuotas_partidos** - Cuotas de Apuestas por Partido
```
id_cuota (PK)
id_partido (FK → HECHOS_RESULTADOS)
tipo_resultado (local|empate|visita)
id_equipo (FK → DIM_EQUIPO, nullable)
cuota_decimal (decimal 5,2)
fecha_actualizacion (timestamp auto-update)
activa (boolean)
```

**3. apuestas_usuarios** - Apuestas Realizadas
```
id_apuesta (PK)
id_usuario (FK → usuarios)
id_partido (FK → HECHOS_RESULTADOS)
id_torneo (FK → DIM_TORNEO)
tipo_apuesta (local|empate|visita)
id_equipo_predicho (FK → DIM_EQUIPO, nullable)
monto_apuesta (decimal 10,2, default: 100.00)
valor_cuota (decimal 5,2)
retorno_potencial (decimal 10,2)
estado (pendiente|ganada|perdida|cancelada)
puntos_ganados (decimal 10,2, default: 0)
fecha_apuesta (timestamp)
UNIQUE: (id_usuario, id_partido) - Un usuario solo puede apostar una vez por partido
```

**4. historial_puntos** - Historial de Puntos Ganados
```
id_punto (PK)
id_usuario (FK → usuarios)
id_apuesta (FK → apuestas_usuarios, único)
id_partido (FK → HECHOS_RESULTADOS)
id_torneo (FK → DIM_TORNEO)
puntos_ganados (decimal 10,2)
fecha_credito (timestamp)
```

**5. config_apuestas** - Configuración Global de Apuestas
```
id_config (PK)
clave (único, varchar 50)
valor (varchar 255)
descripcion (text)
fecha_actualizacion (timestamp auto-update)

Valores iniciales:
- apuestas_habilitadas: 'true'
- monto_apuesta_default: '100.00'
- torneo_activo_id: NULL
```

#### Vistas Materializadas

**1. v_resumen_usuarios** - Resumen de Actividad de Usuarios
```
Columnas:
- id_usuario, username, nombre_completo, email, role
- total_apuestas
- apuestas_ganadas, apuestas_perdidas, apuestas_pendientes
- total_puntos
- porcentaje_aciertos (calculado)
- fecha_creacion, ultimo_acceso
```

**2. VW_TABLA_POSICIONES** - Tabla de Posiciones de Torneos
```
Vista calculada con posiciones, puntos, goles, etc.
```

**3. vw_partidos_procesados** - Partidos Procesados con Información Completa
```
Vista con datos agregados de partidos incluyendo equipos, estadios, etc.
```

### Diagrama de Relaciones Principales

```
DIM_TORNEO
    ↓ (1:N)
    HECHOS_RESULTADOS ← (N:1) → DIM_EQUIPO (local/visita)
    ↓                            ↓
    ↓ (1:N)                      ↓ (N:M via DIM_TORNEO_JUGADOR)
    ↓                            ↓
    HECHOS_JUGADORES_PARTIDO → DIM_JUGADOR
    ↑                            ↓ (N:M)
    ↑ (N:1)                      ↓
    ↑                        DIM_PAIS, DIM_POSICION
    ↓ (N:1)
    DIM_ESTADIO

usuarios → apuestas_usuarios → HECHOS_RESULTADOS
              ↓
        historial_puntos
```

### Claves de Integración con FBRef API

El sistema utiliza claves de integración para sincronizar datos con FBRef (Football Reference):

- **LEAGUE_ID_FBR**: ID único de liga/torneo en FBRef
- **TEAM_ID_FBR**: ID único de equipo en FBRef
- **PLAYER_ID_FBR**: ID único de jugador en FBRef (CLAVE PRINCIPAL para ETL)
- **MATCH_ID_FBR**: ID único de partido en FBRef

**IMPORTANTE**: En el pipeline de datos, `PLAYER_ID_FBR` se usa como clave de integración, no `ID_JUGADOR` (que es autoincrement interno).

### Scripts SQL Disponibles

- `backend/scripts/01_create_auth_betting_tables.sql` - Crea tablas de autenticación y apuestas
- `backend/scripts/02_seed_admin_user.sql` - Inserta usuarios iniciales (admin y usuario_test)
- `statsPipeline/01_update_database_schema.sql` - Actualizaciones de schema para integración FBRef
- `ufc_analytics.sql` - Schema completo original (archivo grande)

### Verificar Estado de la Base de Datos

```bash
# Listar todas las tablas
mysql -h 192.168.100.16 -u mpuga -p MP_DATA_DEV -e "SHOW TABLES;"

# Ver estructura de una tabla
mysql -h 192.168.100.16 -u mpuga -p MP_DATA_DEV -e "DESCRIBE DIM_JUGADOR;"

# Verificar usuarios registrados
mysql -h 192.168.100.16 -u mpuga -p MP_DATA_DEV -e "SELECT id_usuario, username, email, role FROM usuarios;"

# Ver torneos disponibles
mysql -h 192.168.100.16 -u mpuga -p MP_DATA_DEV -e "SELECT * FROM DIM_TORNEO ORDER BY TEMPORADA DESC LIMIT 5;"
```

## Sistema de Autenticación

### Arquitectura de Autenticación

El sistema utiliza **JWT (JSON Web Tokens)** para autenticación y autorización:

**Backend:**
- Middleware `authenticateToken`: Verifica el token JWT en header `Authorization: Bearer {token}`
- Middleware `requireAdmin`: Valida que el usuario tenga rol de administrador
- Middleware `requireBettingPermission`: Verifica permisos para apostar

**Frontend:**
- `AuthContext` (`frontend/src/context/AuthContext.js`): Proveedor de contexto React para autenticación
- Hook `useAuth()`: Hook personalizado para acceder al contexto de autenticación
- Método `authenticatedFetch()`: Helper para hacer peticiones HTTP con token automático

### Protección de Endpoints

**Públicos (sin autenticación):**
- `POST /api/auth/register` - Registro de usuarios
- `POST /api/auth/login` - Login de usuarios
- `GET /api/health` - Health check

**Autenticados (requieren token):**
- `GET /api/auth/profile` - Perfil del usuario
- `/api/torneos/*` - Endpoints de torneos
- `/api/partidos/*` - Endpoints de partidos
- `/api/cuotas/*` - Endpoints de cuotas
- `/api/apuestas/*` - Endpoints de apuestas

**Solo Administradores (requieren token + rol admin):**
- `/api/estadios/*` - CRUD de estadios
- `/api/equipos/*` - CRUD de equipos
- `/api/players/*` - CRUD de jugadores
- `POST /api/apuestas/liquidar/:idPartido` - Liquidar apuestas
- `POST /api/cuotas/partido/:idPartido` - Gestión de cuotas

### Uso Correcto de Autenticación en Frontend

**IMPORTANTE**: Todos los componentes que consumen endpoints protegidos DEBEN usar el servicio `apiService` centralizado.

#### Opción 1: Usar Servicios Específicos (Recomendado)

Disponible en `frontend/src/services/apiService.js`:

```javascript
import {
  estadiosService,
  equiposService,
  playersService,
  torneosService,
  partidosService,
  cuotasService,
  apuestasService,
  handleResponse
} from '../services/apiService';

const MiComponente = () => {
  const cargarEstadios = async () => {
    try {
      // ✅ CORRECTO: Usa servicio específico con autenticación automática
      const response = await estadiosService.getAll();
      const data = await handleResponse(response);
      console.log('Estadios:', data);
    } catch (error) {
      console.error('Error:', error.message);
      // Si token expiró, el servicio redirige automáticamente a login
    }
  };

  const crearEstadio = async (estadioData) => {
    try {
      const response = await estadiosService.create(estadioData);
      const data = await handleResponse(response);
      console.log('Estadio creado:', data);
    } catch (error) {
      console.error('Error:', error.message);
    }
  };

  return <div>...</div>;
};
```

**Servicios disponibles:**
- `estadiosService`: getAll, getById, create, update, delete
- `equiposService`: getAll, getById, create, update, delete
- `playersService`: getAll, getById, create, update, delete, getCountries, getPositions, getTeams
- `torneosService`: getAll, getById, create, update, delete, getPaises, getJugadores, getEquipos, etc.
- `partidosService`: getAll, getById, create, update, delete, getEquipos
- `cuotasService`: getPartidos, getByPartido, create, update
- `apuestasService`: getMisApuestas, getEstadisticas, create, liquidar

#### Opción 2: Usar API genérica

```javascript
import { api, handleResponse } from '../services/apiService';

const MiComponente = () => {
  const cargarDatos = async () => {
    try {
      // GET request
      const response = await api.get('/api/custom-endpoint');
      const data = await handleResponse(response);

      // POST request
      const postResponse = await api.post('/api/custom-endpoint', { data: 'value' });
      const postData = await handleResponse(postResponse);

      // PUT request
      await api.put('/api/custom-endpoint/123', { updated: 'data' });

      // DELETE request
      await api.delete('/api/custom-endpoint/123');
    } catch (error) {
      console.error('Error:', error.message);
    }
  };
};
```

#### Opción 3: AuthContext (Anterior, aún funcional)

```javascript
import { useAuth } from '../context/AuthContext';

const MiComponente = () => {
  const { authenticatedFetch } = useAuth();

  const cargarDatos = async () => {
    try {
      const response = await authenticatedFetch('http://192.168.100.16:3000/api/estadios');
      if (response.ok) {
        const data = await response.json();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };
};
```

**Patrón Incorrecto:**

```javascript
// ❌ INCORRECTO: fetch directo sin token
const response = await fetch('http://192.168.100.16:3000/api/estadios');
// Esto resultará en 401 Unauthorized
```

#### Migración de Componentes Existentes

Para migrar un componente que usa `fetch` directo:

**ANTES:**
```javascript
const response = await fetch('http://192.168.100.16:3000/api/estadios');
const data = await response.json();
```

**DESPUÉS:**
```javascript
import { estadiosService, handleResponse } from '../services/apiService';

const response = await estadiosService.getAll();
const data = await handleResponse(response);
```

### Flujo de Autenticación

1. **Login:**
   - Usuario envía credenciales a `POST /api/auth/login`
   - Backend valida credenciales y genera JWT
   - Frontend recibe token y usuario, los guarda en localStorage y estado
   - AuthContext actualiza estado global de autenticación

2. **Peticiones Autenticadas:**
   - Frontend incluye header `Authorization: Bearer {token}` en cada petición
   - Backend middleware `authenticateToken` valida el token
   - Si token es válido, backend consulta usuario en BD y adjunta a `req.user`
   - Si token es inválido o expiró, backend responde 401/403

3. **Logout:**
   - Frontend elimina token de localStorage
   - AuthContext limpia estado de usuario
   - Usuario es redirigido a página de login

## Sistema de Apuestas - Configuración y Restricciones

### Monto Fijo de Apuesta

**IMPORTANTE**: El monto de apuesta está fijado en **10.000 pesos chilenos** y **NO PUEDE SER MODIFICADO** por los usuarios.

- **Backend**: En `backend/controllers/apuestasController.js` línea ~69, el monto está hardcodeado como constante:
  ```javascript
  const MONTO_FIJO_APUESTA = 10000.00;
  ```
  El backend **ignora completamente** cualquier valor de `monto_apuesta` enviado por el cliente y siempre usa este valor fijo.

- **Frontend**: En `frontend/src/components/apuestas/PartidosDisponibles.js` línea 12, también está definido como constante:
  ```javascript
  const MONTO_FIJO_APUESTA = 10000;
  ```
  La UI muestra este valor como "no modificable" y lo incluye en la información del modal de confirmación.

### Reglas de Habilitación/Deshabilitación de Apuestas

**REGLA CRÍTICA**: Las apuestas tienen ventanas de tiempo específicas basadas en el primer partido de cada fecha.

#### **Ventana de Apuestas:**
- ✅ **HABILITADAS**: Desde el momento de creación del partido hasta **24 horas antes** del primer partido de la fecha
- ❌ **DESHABILITADAS**: Desde 24 horas antes del primer partido hasta que todos los partidos de la fecha finalicen
- 🔄 **REHABILITADAS**: Una vez finalizado el último partido de la fecha, se habilita la siguiente fecha

#### **Lógica de Implementación:**

**Backend** (`backend/controllers/apuestasController.js`):
```javascript
// Verificar si las apuestas están habilitadas
const ahora = new Date();
const primerPartido = await obtenerPrimerPartidoDeFecha(idTorneo, fecha);
const fechaLimite = new Date(primerPartido.FECHA_PARTIDO);
fechaLimite.setHours(fechaLimite.getHours() - 24); // 24 horas antes

if (ahora >= fechaLimite) {
  return res.status(400).json({
    success: false,
    message: 'Las apuestas para esta fecha están cerradas',
    fecha_cierre: fechaLimite,
    primer_partido: primerPartido.FECHA_PARTIDO
  });
}
```

**Frontend** (mostrar estado de apuestas):
- Mostrar mensaje claro: "Apuestas abiertas hasta [fecha]"
- Mostrar countdown: "Cierre de apuestas en: 23h 45m"
- Deshabilitar botones de apuesta si ya pasó el límite
- Mostrar mensaje: "Apuestas cerradas - Primer partido: [fecha]"

#### **Flujo del Proceso de Apuestas:**

**1. Preparación de la Fecha (Admin):**
```
a) Admin crea partidos de la nueva fecha en el torneo
b) Admin configura cuotas para cada partido
   - Local: cuota_decimal (ej: 2.50)
   - Empate: cuota_decimal (ej: 3.20)
   - Visita: cuota_decimal (ej: 2.80)
c) Sistema calcula automáticamente fecha límite (24h antes del 1er partido)
d) Apuestas se HABILITAN automáticamente
```

**2. Periodo de Apuestas (Usuarios):**
```
a) Usuarios acceden a "Partidos Disponibles"
b) Sistema muestra:
   - Partidos de la fecha actual
   - Cuotas para cada resultado
   - Tiempo restante hasta cierre
   - Retorno potencial (cuota × monto)
c) Usuario selecciona resultado y confirma
d) Sistema valida:
   ✓ Fecha límite no alcanzada
   ✓ Usuario no tiene apuesta previa en ese partido
   ✓ Cuota está activa
   ✓ Usuario tiene permisos para apostar
e) Apuesta se registra con estado 'pendiente'
```

**3. Cierre de Apuestas (Automático):**
```
a) Sistema alcanza 24h antes del primer partido
b) Backend rechaza nuevas apuestas para esa fecha
c) Frontend muestra mensaje de cierre
d) Usuarios pueden ver sus apuestas pero no modificarlas
```

**4. Ejecución de Partidos:**
```
a) Partidos se juegan (datos ingresados manualmente o vía API)
b) Admin actualiza resultados:
   - GOLES_LOCAL
   - GOLES_VISITA
   - ESTADO_PARTIDO = 'FINALIZADO'
c) Sistema no liquida automáticamente
```

**5. Liquidación de Apuestas (Admin - Manual):**
```
a) Admin accede a "Liquidar Apuestas"
b) Selecciona el partido finalizado
c) Sistema:
   - Identifica todas las apuestas del partido
   - Compara predicción vs resultado real
   - Calcula ganadores:
     * Ganadores: estado = 'ganada', puntos = monto × cuota
     * Perdedores: estado = 'perdida', puntos = 0
   - Actualiza tabla 'apuestas_usuarios'
   - Registra en 'historial_puntos'
d) Sistema actualiza tabla de posiciones/ranking
```

**6. Consulta de Resultados (Usuarios):**
```
a) Usuarios acceden a "Mis Apuestas"
b) Ven historial:
   - Apuestas ganadas (con puntos obtenidos)
   - Apuestas perdidas
   - Apuestas pendientes (partidos no jugados)
c) Usuarios consultan "Tabla de Posiciones"
   - Ranking por torneo
   - Puntos acumulados
   - Porcentaje de aciertos
```

#### **Sugerencias de Implementación:**

**1. Cron Job / Scheduled Task (Recomendado):**
```javascript
// backend/jobs/cerrarApuestas.js
const cron = require('node-cron');

// Ejecutar cada hora
cron.schedule('0 * * * *', async () => {
  console.log('Verificando fechas límite de apuestas...');

  // Obtener todas las fechas activas
  const fechasActivas = await obtenerFechasConApuestasAbiertas();

  for (const fecha of fechasActivas) {
    const ahora = new Date();
    const primerPartido = await obtenerPrimerPartido(fecha.ID_TORNEO, fecha.FECHA_TORNEO);
    const fechaLimite = new Date(primerPartido.FECHA_PARTIDO);
    fechaLimite.setHours(fechaLimite.getHours() - 24);

    if (ahora >= fechaLimite) {
      // Marcar fecha como cerrada
      await cerrarApuestasFecha(fecha.ID_TORNEO, fecha.FECHA_TORNEO);
      console.log(`✅ Apuestas cerradas para Torneo ${fecha.ID_TORNEO}, Fecha ${fecha.FECHA_TORNEO}`);
    }
  }
});
```

**2. Tabla de Control (Alternativa):**
```sql
CREATE TABLE control_apuestas_fechas (
  id_control INT PRIMARY KEY AUTO_INCREMENT,
  id_torneo INT NOT NULL,
  fecha_torneo INT NOT NULL,
  fecha_apertura DATETIME NOT NULL,
  fecha_cierre DATETIME NOT NULL,
  apuestas_abiertas BOOLEAN DEFAULT TRUE,
  primer_partido_id INT,
  FOREIGN KEY (id_torneo) REFERENCES DIM_TORNEO(ID_TORNEO),
  FOREIGN KEY (primer_partido_id) REFERENCES HECHOS_RESULTADOS(ID_PARTIDO),
  UNIQUE KEY (id_torneo, fecha_torneo)
);
```

**3. Endpoint de Verificación:**
```javascript
// GET /api/apuestas/estado-fecha/:idTorneo/:fecha
app.get('/api/apuestas/estado-fecha/:idTorneo/:fecha', async (req, res) => {
  const { idTorneo, fecha } = req.params;
  const ahora = new Date();

  const primerPartido = await obtenerPrimerPartido(idTorneo, fecha);
  const fechaLimite = new Date(primerPartido.FECHA_PARTIDO);
  fechaLimite.setHours(fechaLimite.getHours() - 24);

  const apuestasAbiertas = ahora < fechaLimite;
  const tiempoRestante = apuestasAbiertas ? fechaLimite - ahora : 0;

  res.json({
    apuestas_abiertas: apuestasAbiertas,
    fecha_cierre: fechaLimite,
    primer_partido: primerPartido.FECHA_PARTIDO,
    tiempo_restante_ms: tiempoRestante,
    mensaje: apuestasAbiertas
      ? `Apuestas abiertas hasta ${fechaLimite.toLocaleString('es-CL')}`
      : `Apuestas cerradas desde ${fechaLimite.toLocaleString('es-CL')}`
  });
});
```

**4. Componente Frontend con Countdown:**
```javascript
// frontend/src/components/apuestas/CountdownCierre.js
const CountdownCierre = ({ fechaCierre }) => {
  const [timeLeft, setTimeLeft] = useState(calcularTiempoRestante());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calcularTiempoRestante());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  function calcularTiempoRestante() {
    const ahora = new Date();
    const cierre = new Date(fechaCierre);
    const diff = cierre - ahora;

    if (diff <= 0) return null;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { hours, minutes, seconds };
  }

  if (!timeLeft) {
    return <div className="alert alert-danger">⛔ Apuestas cerradas</div>;
  }

  return (
    <div className="countdown-box">
      ⏱️ Cierre de apuestas en:
      <strong>{timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s</strong>
    </div>
  );
};
```

### Limpieza de Apuestas por Usuario (Solo Admin)

Los administradores pueden eliminar todas las apuestas de un usuario específico en el torneo activo usando:

**Endpoint Backend:**
- `DELETE /api/apuestas/admin/limpiar/:idUsuario/:idTorneo`
- Requiere autenticación y rol de administrador
- Elimina todas las apuestas del usuario en el torneo especificado
- Elimina también los registros asociados en `historial_puntos`
- Controller: `apuestasController.limpiarApuestasUsuario`

**Interfaz Frontend:**
- Ruta: `/admin/limpiar-apuestas-usuario`
- Componente: `frontend/src/components/admin/LimpiarApuestasUsuario.js`
- Accesible desde el Dashboard de administrador
- Lista todos los usuarios no-admin del sistema
- Permite seleccionar un usuario y confirmar la eliminación de sus apuestas
- Muestra el torneo activo y requiere confirmación explícita

**Uso:**
1. Navegar a Dashboard > "🗑️ Limpiar Apuestas Usuario"
2. Seleccionar el usuario de la tabla
3. Confirmar la limpieza en el modal de confirmación
4. El sistema eliminará todas las apuestas del usuario en el torneo activo

### Configuración JWT

El backend usa la librería `jsonwebtoken` con la siguiente configuración:

```javascript
// backend/config/jwt.js
const JWT_SECRET = process.env.JWT_SECRET; // Mínimo 32 caracteres
const JWT_EXPIRES_IN = '24h'; // Token expira en 24 horas
```

**Variables de entorno requeridas en `.env`:**
```env
JWT_SECRET=your_jwt_secret_min_32_chars
```

### Roles de Usuario

- **admin**: Acceso completo al sistema, no puede apostar
- **usuario**: Acceso a consultas y apuestas (si `puede_apostar = 1`)

### Debugging de Problemas de Autenticación

**Error 401 Unauthorized:**
- Verificar que el token está siendo enviado en el header: `Authorization: Bearer {token}`
- Verificar que el token no ha expirado (24 horas de validez)
- Verificar que el componente está usando `authenticatedFetch` del AuthContext
- Revisar logs del backend para ver errores específicos del middleware

**Error 403 Forbidden:**
- El token es válido pero el usuario no tiene permisos
- Para endpoints de admin, verificar que `user.role === 'admin'`
- Para apuestas, verificar que `user.puede_apostar === 1`

**Componentes que Requieren Actualización:**
Los siguientes componentes actualmente NO usan `authenticatedFetch` y deben ser actualizados:
- NuevoTorneo.js, ListaTorneos.js
- NuevoEstadio.js, ListaEstadios.js, EditarEstadio.js
- NuevoEquipo.js, ListaEquipos.js, EditarEquipo.js
- PlayersManager.js, AsignacionJugador.js, ListadoJugadores.js
- PartidosManager.js, RegistrarSustitucion.js
- TorneosManager.js, TorneoManager.js
- Componentes de admin/apuestas (GestionCuotas.js, LiquidarApuestas.js, etc.)

## Troubleshooting

### Backend Won't Start
1. **Check database connection**: Run `node backend/scripts/testConnection.js`
2. **Verify .env file exists**: Should be at `backend/.env` with all required variables
3. **Check port availability**: Make sure port 3000 is not in use: `lsof -i :3000`
4. **Database credentials**: Verify DB_USER, DB_PASSWORD, DB_HOST in .env file

### Frontend Won't Start
1. **Check if port is in use**: Port 3001 should be available: `lsof -i :3001`
2. **Clear cache**: `cd frontend && rm -rf node_modules package-lock.json && npm install`
3. **Verify .env file**: Should be at `frontend/.env` with REACT_APP_API_URL
4. **Check backend is running**: Frontend needs backend API to be available

### CORS Errors in Browser
1. **Verify backend CORS config** in `backend/app.js` includes your frontend URL
2. **Check frontend is accessing correct API URL** in `frontend/src/config/api.js`
3. **Ensure both servers are running** on expected ports

### Database Connection Errors
1. **Test connection**: `mysql -h 192.168.100.16 -u mpuga -p MP_DATA_DEV`
2. **Check database exists**: `SHOW DATABASES;`
3. **Verify user permissions**: User needs SELECT, INSERT, UPDATE, DELETE on MP_DATA_DEV
4. **Firewall**: Ensure MySQL port 3306 is accessible from your machine

### Can't Access from Browser
1. **Check both services are running**:
   - Backend: `curl http://192.168.100.16:3000/api/health`
   - Frontend: `curl http://192.168.100.16:3001`
2. **Firewall rules**: Ports 3000 and 3001 must be open
3. **Network connectivity**: Verify you can ping 192.168.100.16
4. **Try localhost**: If network access fails, try `http://localhost:3001`

### Module Not Found Errors
1. **Reinstall dependencies**:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```
2. **Check Node version**: Should be v14 or higher: `node --version`
3. **Clear npm cache**: `npm cache clean --force`

### "message channel closed" Error in Browser Console
**Error message**: `Uncaught (in promise) Error: A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received`

**Cause**: This error is caused by browser extensions (password managers like LastPass, Dashlane, etc.) that intercept form submissions. The extension returns `true` indicating an async response but closes the channel before sending it.

**Impact**: This is a **harmless warning** that doesn't affect application functionality. Users can still register and login successfully.

**Solutions**:
1. **Ignore it**: The error doesn't break anything
2. **Disable extensions**: Temporarily disable password manager extensions during development
3. **Use incognito mode**: Test in incognito/private browsing mode without extensions

**Note**: This is a known issue with Chrome extensions and is not caused by application code.
