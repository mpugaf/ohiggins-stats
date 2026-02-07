# Documentación: Módulo de Roster de Jugadores

## Descripción General

El módulo **Roster de Jugadores** permite a todos los usuarios autenticados (tanto administradores como usuarios regulares) visualizar los jugadores de cada equipo organizados por torneo y posición.

## Características Principales

### ✅ Funcionalidades Implementadas

1. **Filtro por Torneo**
   - Combo desplegable con todos los torneos disponibles
   - Ordenados por temporada descendente
   - Muestra información completa: Nombre, Temporada y Rueda

2. **Filtro por Equipo**
   - Se activa al seleccionar un torneo
   - Muestra solo equipos participantes en el torneo seleccionado
   - Incluye nombre y apodo del equipo

3. **Checkbox de Torneos del Año Actual**
   - Checkbox visual (deshabilitado) que indica "Torneos del año actual"
   - Actualmente muestra todos los torneos independientemente del año
   - Preparado para futura implementación de filtro por año

4. **Visualización de Jugadores**
   - Agrupados por posición en el siguiente orden:
     - Porteros (GK)
     - Defensas Centrales (DF, CB)
     - Laterales (FB, LB, RB, LWB, RWB)
     - Mediocampistas Defensivos (DM, CDM)
     - Mediocampistas (CM)
     - Mediocampistas Ofensivos (AM, CAM)
     - Extremos (W, LW, RW, LM, RM)
     - Delanteros (FW, ST, CF)

5. **Información Detallada de cada Jugador**
   - Número de camiseta
   - Nombre completo
   - Apodo (si existe)
   - Posiciones que puede jugar
   - Nacionalidad(es)
   - Pie dominante
   - Fecha de nacimiento

6. **Diseño Responsivo**
   - Grid adaptativo que se ajusta a diferentes tamaños de pantalla
   - Cards visuales con información organizada
   - Colores distintivos por sección

## Arquitectura Técnica

### Backend (Ya Existente)

**Endpoint:** `GET /api/torneos/:torneoId/equipos/:equipoId/jugadores`

- Controlador: `torneoController.getJugadoresByTorneoEquipo`
- Ubicación: `/home/mpuga/projects/ohiggins-stats/backend/controllers/torneoController.js:819`
- Devuelve: Array de jugadores con posiciones, nacionalidades y datos completos

**Endpoints Relacionados:**
- `GET /api/torneos/all` - Obtener todos los torneos
- `GET /api/torneos/:torneoId/equipos` - Obtener equipos de un torneo

### Frontend

**Componente Principal:**
- Ubicación: `/home/mpuga/projects/ohiggins-stats/frontend/src/components/consultas/RosterJugadores.js`
- Estilos: `/home/mpuga/projects/ohiggins-stats/frontend/src/styles/RosterJugadores.css`

**Servicios API Utilizados:**
- `torneosService.getAll()` - Obtener torneos
- `torneosService.getEquipos(torneoId)` - Obtener equipos
- `torneosService.getEquipoJugadores(torneoId, equipoId)` - Obtener jugadores

**Lógica de Ordenamiento:**
```javascript
obtenerOrdenPosicion(codigoPosicion) {
  // Asigna un número de orden según la posición
  // 1: Porteros, 2: Defensas, 3: Laterales, etc.
}
```

## Rutas Configuradas

### Para Todos los Usuarios Autenticados
```javascript
<Route
  path="/consultas/roster-jugadores"
  element={
    <ProtectedRoute>
      <RosterJugadores />
    </ProtectedRoute>
  }
/>
```

## Puntos de Acceso en la Interfaz

### Para Administradores

**Dashboard (`/dashboard`):**
- Módulo: "Consultas y Reportes"
- Botón: "📋 Roster de Jugadores"

### Para Usuarios Regulares

**Partidos y Apuestas (`/partidos-apuestas`):**
- Tab en la navegación: "👥 Roster de Jugadores"
- Click redirige a `/consultas/roster-jugadores`

## Flujo de Uso

1. **Usuario accede al módulo**
   - Admin: Dashboard → "Consultas y Reportes" → "Roster de Jugadores"
   - Usuario: Partidos y Apuestas → Tab "Roster de Jugadores"

2. **Selecciona un torneo**
   - Se carga la lista de equipos participantes

3. **Selecciona un equipo**
   - Se cargan los jugadores del equipo en ese torneo
   - Los jugadores se organizan automáticamente por posición

4. **Visualiza información**
   - Header con nombre del equipo y torneo
   - Total de jugadores
   - Jugadores agrupados por posición con badges indicando cantidad

## Base de Datos

### Tablas Involucradas

1. **DIM_TORNEO** - Información de torneos
2. **DIM_EQUIPO** - Información de equipos
3. **DIM_JUGADOR** - Información de jugadores
4. **DIM_TORNEO_JUGADOR** - Relación torneo-jugador-equipo
5. **DIM_JUGADOR_PAIS** - Nacionalidades de jugadores
6. **DIM_PAIS** - Información de países
7. **DIM_JUGADOR_POSICION** - Posiciones de jugadores
8. **DIM_POSICION** - Catálogo de posiciones

### Query Principal (SQL)

```sql
SELECT
  j.ID_JUGADOR,
  j.NOMBRE_COMPLETO,
  j.APODO,
  j.FECHA_NACIMIENTO,
  j.PIE_DOMINANTE,
  tj.NUMERO_CAMISETA,
  e.NOMBRE as nombre_equipo,
  GROUP_CONCAT(DISTINCT p.CODIGO_FIFA) as nacionalidades,
  GROUP_CONCAT(DISTINCT pos.CODIGO_POSICION) as posiciones
FROM DIM_TORNEO_JUGADOR tj
INNER JOIN DIM_JUGADOR j ON tj.ID_JUGADOR = j.ID_JUGADOR
INNER JOIN DIM_EQUIPO e ON tj.ID_EQUIPO = e.ID_EQUIPO
LEFT JOIN DIM_JUGADOR_PAIS jp ON j.ID_JUGADOR = jp.ID_JUGADOR
LEFT JOIN DIM_PAIS p ON jp.ID_PAIS = p.ID_PAIS
LEFT JOIN DIM_JUGADOR_POSICION jpos ON j.ID_JUGADOR = jpos.ID_JUGADOR
LEFT JOIN DIM_POSICION pos ON jpos.ID_POSICION = pos.ID_POSICION
WHERE tj.ID_TORNEO = ? AND tj.ID_EQUIPO = ?
GROUP BY j.ID_JUGADOR
ORDER BY tj.NUMERO_CAMISETA ASC
```

## Diseño Visual

### Paleta de Colores

- **Header Principal:** Gradiente azul (`#0056b3` → `#003d82`)
- **Grupos de Posición:** Gradiente verde (`#28a745` → `#1e7e34`)
- **Cards de Jugadores:** Fondo gris claro (`#f8f9fa`)
- **Números de Camiseta:** Gradiente azul con sombra
- **Badges:** Fondo semi-transparente

### Componentes Visuales

1. **Header**
   - Título grande con emoji
   - Subtítulo explicativo
   - Línea divisora azul

2. **Filtros**
   - Fondo gris claro con borde
   - Labels en negrita
   - Combos con focus azul
   - Checkbox deshabilitado con texto explicativo

3. **Roster Info**
   - Fondo azul con gradiente
   - Texto blanco
   - Total de jugadores destacado

4. **Grupos de Posición**
   - Header verde con gradiente
   - Badge con contador de jugadores
   - Grid responsivo de cards

5. **Jugador Card**
   - Número de camiseta en cuadro azul grande
   - Información en columna a la derecha
   - Hover con elevación y borde azul

## Responsive Design

### Breakpoints

**Desktop (> 768px):**
- Grid con columnas auto-fill de mínimo 320px
- Cards con flex horizontal

**Tablet (768px):**
- Grid de 1 columna
- Tamaños de fuente reducidos

**Mobile (< 480px):**
- Padding reducido
- Números de camiseta más pequeños
- Cards compactas

## Extensiones Futuras

### Posibles Mejoras

1. **Filtro por Año Activo**
   - Activar checkbox para filtrar torneos del año actual
   - Usar `new Date().getFullYear()` para comparar con `TEMPORADA`

2. **Búsqueda de Jugadores**
   - Campo de búsqueda por nombre
   - Filtro en tiempo real

3. **Exportación**
   - Exportar roster a PDF
   - Exportar roster a Excel

4. **Estadísticas**
   - Mostrar estadísticas del jugador en el torneo
   - Goles, asistencias, tarjetas, etc.

5. **Fotos de Jugadores**
   - Agregar campo `URL_FOTO` en las cards
   - Placeholder si no hay foto

6. **Ordenamiento Personalizado**
   - Permitir ordenar por nombre, número, posición
   - Botones de ordenamiento

## Testing

### Casos de Prueba

1. **Sin Torneo Seleccionado**
   - ✅ Muestra mensaje inicial
   - ✅ Combo de equipos deshabilitado
   - ✅ No se muestran jugadores

2. **Con Torneo Seleccionado**
   - ✅ Carga equipos del torneo
   - ✅ Habilita combo de equipos
   - ✅ Limpia selección de equipo anterior

3. **Con Equipo Seleccionado**
   - ✅ Carga jugadores del equipo
   - ✅ Agrupa por posición correctamente
   - ✅ Muestra información completa

4. **Sin Jugadores en Equipo**
   - ✅ Muestra mensaje de "No se encontraron jugadores"

5. **Errores de API**
   - ✅ Muestra alert con mensaje de error
   - ✅ No rompe la aplicación

## Archivos Modificados/Creados

### Nuevos Archivos
1. `/frontend/src/components/consultas/RosterJugadores.js` (10.8 KB)
2. `/frontend/src/styles/RosterJugadores.css` (5.5 KB)
3. `/ROSTER_JUGADORES_DOC.md` (este archivo)

### Archivos Modificados
1. `/frontend/src/App.js`
   - Importación de `RosterJugadores`
   - Ruta `/consultas/roster-jugadores`

2. `/frontend/src/components/Dashboard.js`
   - Nuevo módulo "Consultas y Reportes"
   - Botón "Roster de Jugadores"

3. `/frontend/src/components/apuestas/PartidosApuestasManager.js`
   - Importación de `useNavigate`
   - Handler `handleNavigateToRoster`
   - Nuevo tab "Roster de Jugadores"

## Permisos y Seguridad

### Autenticación Requerida
- ✅ Ruta protegida con `<ProtectedRoute>`
- ✅ Requiere token JWT válido
- ✅ Accesible para usuarios `admin` y `usuario`

### Endpoints Backend
- ✅ Todos los endpoints de torneos requieren autenticación
- ✅ Middleware `authenticateToken` verifica el token
- ✅ No requiere permisos especiales de administrador

## Logs y Debugging

### Console Logs del Componente
```javascript
console.error('Error al cargar torneos:', err);
console.error('Error al cargar equipos:', err);
console.error('Error al cargar jugadores:', err);
```

### Backend Logs
```javascript
console.log('📋 Obteniendo jugadores por torneo y equipo...');
console.log(`✅ Se encontraron ${jugadores.length} jugadores`);
```

## Soporte y Mantenimiento

### Contacto
Para preguntas o mejoras sobre este módulo, contactar al equipo de desarrollo.

### Versión
- **Versión Inicial:** 1.0.0
- **Fecha de Creación:** 2026-02-01
- **Última Actualización:** 2026-02-01

---

**Nota:** Este módulo utiliza servicios API centralizados con autenticación automática. Todos los requests incluyen el token JWT en el header `Authorization: Bearer {token}`.
