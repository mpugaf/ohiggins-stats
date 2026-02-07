# Guía de Debugging - Roster de Jugadores

## Estado Actual

✅ **Backend funciona correctamente**
- La consulta SQL devuelve resultados correctos
- Torneo ID 11 "Liga Primera división (2026)" tiene 16 equipos con jugadores
- Ejemplo: O'Higgins (ID: 13) tiene 28 jugadores asignados
- Script de prueba confirma que la consulta funciona: `node backend/scripts/testQuery.js`

✅ **Datos en la base de datos**
- 849 asignaciones totales en DIM_TORNEO_JUGADOR
- Torneo 11 (2026): 419 jugadores
- Torneo 1 (2025): 430 jugadores

✅ **Frontend carga torneos y equipos correctamente**
- Los combos se muestran
- Los datos llegan en formato correcto

❌ **Problema**: No se muestran jugadores al seleccionar torneo + equipo

## Logs Agregados para Debugging

### Backend (`backend/controllers/torneoController.js`)

Función `getJugadoresByTorneoEquipo` ahora incluye:
```javascript
console.log(`🔍 Parámetros recibidos: torneoId=${torneoId}, equipoId=${equipoId}`);
console.log(`✅ Se encontraron ${jugadores.length} jugadores`);
// Si no hay jugadores, verifica la tabla DIM_TORNEO_JUGADOR
```

### Frontend (`frontend/src/components/consultas/RosterJugadores.js`)

**Al seleccionar torneo:**
```javascript
console.log('🏆 Torneo seleccionado:', torneoId, 'Tipo:', typeof torneoId);
```

**Al seleccionar equipo:**
```javascript
console.log('⚽ Equipo seleccionado:', equipoId, 'Tipo:', typeof equipoId);
console.log('🏆 Torneo actual:', torneoSeleccionado, 'Tipo:', typeof torneoSeleccionado);
console.log(`🔍 Llamando cargarJugadores(${torneoSeleccionado}, ${equipoId})`);
```

**Al cargar jugadores:**
```javascript
console.log('🔄 Iniciando carga de jugadores - Torneo: X, Equipo: Y');
console.log('📦 Response completo:', response);
console.log('📦 Response status:', response.status);
console.log('📦 Response ok:', response.ok);
console.log('⚽ Jugadores cargados:', data);
console.log('⚽ Total jugadores:', data?.length);
```

## Pasos para Debugging

### 1. Abrir DevTools del Navegador

1. Presiona **F12** o **Ctrl+Shift+I**
2. Ve a la pestaña **Console**
3. Limpia la consola (botón 🚫 o Ctrl+L)

### 2. Probar la Funcionalidad

1. Actualiza la página (F5)
2. Selecciona el torneo **"Liga Primera división (2026)"** (ID: 11)
3. Observa los logs en la consola:
   ```
   🏆 Torneo seleccionado: 11 Tipo: string
   📊 Equipos cargados: [Array]
   ```

4. Selecciona el equipo **"O'HIGGINS"** (ID: 13)
5. Observa los logs en la consola:
   ```
   ⚽ Equipo seleccionado: 13 Tipo: string
   🏆 Torneo actual: 11 Tipo: string
   🔍 Llamando cargarJugadores(11, 13)
   🔄 Iniciando carga de jugadores - Torneo: 11, Equipo: 13
   📦 Response completo: Response { ... }
   📦 Response status: 200
   📦 Response ok: true
   ⚽ Jugadores cargados: [Array(28)]
   ⚽ Total jugadores: 28
   ```

### 3. Verificar Logs del Backend

En la terminal donde corre el backend (`npm run dev`), deberías ver:

```
🏆 Torneos API: GET /11/equipos
📋 Obteniendo equipos por torneo...
✅ [ESTRATEGIA 1] Se encontraron 16 equipos con partidos en el torneo 11

🏆 Torneos API: GET /11/equipos/13/jugadores
GET /torneos/11/equipos/13/jugadores
📋 Obteniendo jugadores por torneo y equipo...
🔍 Parámetros recibidos: torneoId=11, equipoId=13
✅ Se encontraron 28 jugadores en torneo 11 equipo 13
```

## Posibles Problemas y Soluciones

### Problema 1: Response 401 Unauthorized

**Síntoma:** `Response status: 401`

**Causa:** Token JWT expiró o no está presente

**Solución:**
```bash
# Cerrar sesión y volver a iniciar sesión
# O refrescar el token
```

### Problema 2: Response 404 Not Found

**Síntoma:** `Response status: 404`

**Causa:** La ruta no existe o los parámetros son incorrectos

**Solución:**
```javascript
// Verificar que la URL sea exactamente:
// http://192.168.100.16:3000/api/torneos/11/equipos/13/jugadores
```

### Problema 3: Response 200 pero data = []

**Síntoma:** `Response ok: true` pero `Total jugadores: 0`

**Causa:** La consulta SQL no devuelve resultados

**Verificar en Backend:**
```bash
cd backend
node scripts/testQuery.js
# Debería mostrar 28 jugadores
```

**Solución:**
- Verificar que los IDs de torneo y equipo sean correctos
- Verificar que los datos existan en DIM_TORNEO_JUGADOR

### Problema 4: Error en handleResponse

**Síntoma:** `❌ Error al cargar jugadores: ...`

**Causa:** Error al parsear la respuesta JSON

**Solución:**
- Verificar que el backend devuelva JSON válido
- Verificar que no haya errores 500 en el backend

## Scripts de Verificación

### Verificar Asignaciones en DB
```bash
cd backend
node scripts/verificarAsignaciones.js
```

**Salida esperada:**
```
📊 Total de asignaciones en DIM_TORNEO_JUGADOR: 849
🏆 Torneos con asignaciones:
ID: 11 | Liga Primera división (2026) | 16 equipos | 419 jugadores
ID: 1 | Liga primera division Chile (2025) | 16 equipos | 430 jugadores
```

### Probar Consulta SQL
```bash
cd backend
node scripts/testQuery.js
```

**Salida esperada:**
```
✅ Resultados: 28 jugadores encontrados
📊 Primeros 5 jugadores:
1. Omar Carabalí
2. Jorge Peña
3. Cristian Morales
...
```

## Datos de Prueba Confirmados

### Torneo 11: "Liga Primera división (2026)"

**Equipos con jugadores:**
- O'HIGGINS (ID: 13) - 28 jugadores
- COLO COLO (ID: 5) - 25 jugadores
- AUDAX ITALIANO (ID: 2) - 24 jugadores
- UNIVERSIDAD DE CHILE (ID: 15) - 25 jugadores

**Prueba recomendada:**
1. Seleccionar: Torneo ID 11
2. Seleccionar: Equipo ID 13 (O'HIGGINS)
3. Esperado: 28 jugadores organizados por posición

## Siguiente Paso

**Ejecuta los pasos de debugging** y envíame la salida de la consola del navegador. Específicamente necesito ver:

1. ¿Qué logs aparecen cuando seleccionas el torneo?
2. ¿Qué logs aparecen cuando seleccionas el equipo?
3. ¿Cuál es el `Response status`?
4. ¿Cuál es el valor de `Total jugadores`?
5. ¿Hay algún error en rojo?

Con esa información podré identificar exactamente dónde está fallando el flujo.

---

**Comandos Rápidos:**

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm start

# Terminal 3 - Verificar datos
cd backend
node scripts/verificarAsignaciones.js
node scripts/testQuery.js
```

**URLs de Prueba:**
- Frontend: http://192.168.100.16:3001/consultas/roster-jugadores
- API Directa: http://192.168.100.16:3000/api/torneos/11/equipos/13/jugadores
  (Requiere token de autenticación en header)
