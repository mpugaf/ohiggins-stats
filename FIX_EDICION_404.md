# Fix Error 404 al Editar Jugador

## Problema

```
PUT /api/torneos/11/equipos/13/jugadores/6c535d18/completo
Error 404: Ruta no encontrada
```

## Causa

La ruta `/completo` no existía en el backend. Solo existía la ruta base que actualizaba campos básicos de DIM_TORNEO_JUGADOR pero NO actualizaba las posiciones.

## Solución Implementada

### 1. Backend - Nueva Función

**Archivo:** `backend/controllers/torneoController.js`

**Función agregada:** `actualizarAsignacionCompleta`

**Características:**
- ✅ Actualiza campos de DIM_TORNEO_JUGADOR:
  - Número de camiseta
  - Fecha de incorporación
  - Fecha de salida
  - Estado

- ✅ Actualiza posiciones en DIM_JUGADOR_POSICION:
  - Elimina posiciones antiguas
  - Inserta nuevas posiciones seleccionadas

- ✅ Validaciones:
  - Verifica que el jugador existe
  - Verifica que la asignación existe
  - Verifica que el número de camiseta no esté ocupado
  - Transacción completa (rollback si hay error)

### 2. Backend - Nueva Ruta

**Archivo:** `backend/routes/torneos.js`

**Ruta agregada:**
```javascript
PUT /api/torneos/:torneoId/equipos/:equipoId/jugadores/:jugadorId/completo
```

**Handler:**
```javascript
torneoController.actualizarAsignacionCompleta
```

### 3. Orden de Rutas

**IMPORTANTE:** La ruta `/completo` debe ir **ANTES** de la ruta base para que Express la matchee correctamente:

```javascript
// 1. PRIMERO: Ruta específica /completo
router.put('/:torneoId/equipos/:equipoId/jugadores/:jugadorId/completo', ...);

// 2. DESPUÉS: Ruta base
router.put('/:torneoId/equipos/:equipoId/jugadores/:jugadorId', ...);
```

## Estructura de la Petición

### Request

**URL:**
```
PUT /api/torneos/11/equipos/13/jugadores/6c535d18/completo
```

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "numero_camiseta": 10,
  "fecha_incorporacion": "2026-01-01",
  "fecha_salida": null,
  "estado": "ACTIVO",
  "posiciones_ids": [1, 5, 8]
}
```

### Response (Success)

**Status:** 200 OK

**Body:**
```json
{
  "message": "Asignación actualizada exitosamente",
  "jugador_id": 215,
  "player_id_fbr": "6c535d18"
}
```

### Response (Error)

**Jugador no encontrado:**
```json
{
  "error": "Jugador no encontrado"
}
```

**Asignación no encontrada:**
```json
{
  "error": "No se encontró la asignación del jugador"
}
```

**Número de camiseta ocupado:**
```json
{
  "error": "El número de camiseta 10 ya está ocupado"
}
```

## Flujo de Actualización

```
1. Usuario hace click en fila de jugador
   ↓
2. Modal se abre con datos precargados
   ↓
3. Usuario modifica campos
   ↓
4. Usuario hace click en "Guardar Cambios"
   ↓
5. Frontend envía PUT request a /completo
   ↓
6. Backend valida datos
   ↓
7. Backend inicia transacción
   ↓
8. Backend actualiza DIM_TORNEO_JUGADOR
   ↓
9. Backend elimina posiciones viejas (DIM_JUGADOR_POSICION)
   ↓
10. Backend inserta nuevas posiciones
   ↓
11. Backend hace commit de transacción
   ↓
12. Backend retorna success
   ↓
13. Frontend recarga tabla
   ↓
14. Modal se cierra
   ↓
15. Usuario ve cambios reflejados
```

## Archivos Modificados

1. ✅ `backend/controllers/torneoController.js`
   - Agregada función `actualizarAsignacionCompleta` (línea ~1282)
   - Agregada al `module.exports`

2. ✅ `backend/routes/torneos.js`
   - Agregada ruta PUT `/:torneoId/equipos/:equipoId/jugadores/:jugadorId/completo`
   - Reordenadas rutas (específica antes que genérica)

## Pasos para Probar

### 1. Reiniciar Backend

**IMPORTANTE:** Debes reiniciar el servidor backend para que cargue la nueva ruta.

```bash
# Si está corriendo con npm run dev (nodemon), se reiniciará automáticamente
# Si está corriendo con npm start, presiona Ctrl+C y ejecuta:
cd backend && npm run dev
```

### 2. Verificar que el servidor cargó la ruta

En los logs del backend deberías ver:
```
✅ Rutas de torneos configuradas correctamente
📋 Rutas disponibles:
   - PUT /torneos/:torneoId/equipos/:equipoId/jugadores/:jugadorId/completo
```

### 3. Probar la Edición

1. Accede a: http://192.168.100.16:3001/consultas/roster-jugadores
2. Selecciona: Torneo "Liga Primera división (2026)" + Equipo "O'HIGGINS"
3. Click en cualquier fila de jugador
4. Modifica campos:
   - Cambia número de camiseta
   - Cambia estado
   - Selecciona/deselecciona posiciones
5. Click en "Guardar Cambios"
6. Verificar:
   - ✅ Modal se cierra
   - ✅ Tabla se recarga
   - ✅ Cambios se reflejan
   - ✅ No hay error 404

### 4. Verificar en Logs del Backend

Al hacer la edición deberías ver:
```
PUT /torneos/:torneoId/equipos/:equipoId/jugadores/:jugadorId/completo
📝 Actualizando asignación completa: { numero_camiseta: 10, ... }
✅ Asignación completa actualizada exitosamente
```

## Diferencias entre Endpoints

### PUT .../jugadores/:jugadorId (Básico)

**Actualiza:**
- ✅ Número de camiseta
- ✅ Fecha incorporación
- ✅ Fecha salida
- ✅ Estado
- ❌ NO actualiza posiciones

**Usado por:**
- ListadoJugadores.js (antes)

### PUT .../jugadores/:jugadorId/completo (Completo)

**Actualiza:**
- ✅ Número de camiseta
- ✅ Fecha incorporación
- ✅ Fecha salida
- ✅ Estado
- ✅ Posiciones (elimina viejas e inserta nuevas)

**Usado por:**
- RosterJugadores.js (nuevo módulo tabla Excel)

## Validaciones Implementadas

### 1. Jugador Existe
```sql
SELECT ID_JUGADOR FROM DIM_JUGADOR WHERE PLAYER_ID_FBR = ?
```

### 2. Asignación Existe
```sql
SELECT * FROM DIM_TORNEO_JUGADOR tj
INNER JOIN DIM_JUGADOR j ON tj.ID_JUGADOR = j.ID_JUGADOR
WHERE tj.ID_TORNEO = ? AND tj.ID_EQUIPO = ? AND j.PLAYER_ID_FBR = ?
```

### 3. Número de Camiseta No Ocupado
```sql
SELECT * FROM DIM_TORNEO_JUGADOR tj
INNER JOIN DIM_JUGADOR j ON tj.ID_JUGADOR = j.ID_JUGADOR
WHERE tj.ID_TORNEO = ? AND tj.ID_EQUIPO = ?
  AND tj.NUMERO_CAMISETA = ?
  AND j.PLAYER_ID_FBR != ?
```

## Transacciones

La actualización usa transacciones MySQL para garantizar consistencia:

```javascript
await connection.beginTransaction();

try {
  // 1. Actualizar DIM_TORNEO_JUGADOR
  // 2. Eliminar DIM_JUGADOR_POSICION
  // 3. Insertar nuevas posiciones

  await connection.commit();
} catch (error) {
  await connection.rollback();
  throw error;
}
```

Si **CUALQUIER** operación falla:
- ✅ Se hace rollback completo
- ✅ Base de datos queda en estado consistente
- ✅ No hay cambios parciales

---

**Estado:** ✅ IMPLEMENTADO
**Próximo paso:** **Reiniciar servidor backend** y probar la edición
