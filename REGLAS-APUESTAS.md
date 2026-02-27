# ⚡ Reglas de Apuestas - Resumen Ejecutivo

## 🎯 Regla Principal

**Las apuestas se cierran 24 horas antes del primer partido de cada fecha**

---

## ⏰ Ventana de Tiempo

```
Ejemplo: Fecha 10
- Primer partido: Domingo 09/02/2025 20:00
- Fecha límite: Sábado 08/02/2025 20:00 (24h antes)

✅ ABIERTAS: Desde creación hasta Sábado 08/02 20:00
❌ CERRADAS: Desde Sábado 08/02 20:00 hasta fin de fecha
```

---

## 📋 Restricciones

### Por Tiempo
| Estado | Condición | Acción Permitida |
|--------|-----------|------------------|
| ✅ Abierta | Antes de 24h del 1er partido | Usuario puede apostar |
| ❌ Cerrada | Después de 24h del 1er partido | Apuestas rechazadas |
| 🔄 Finalizada | Todos los partidos jugados | Admin puede liquidar |

### Por Usuario
| Rol | Puede Apostar | Puede Gestionar |
|-----|---------------|-----------------|
| **admin** | ❌ NO | ✅ SÍ |
| **usuario** (puede_apostar=1) | ✅ SÍ | ❌ NO |
| **usuario** (puede_apostar=0) | ❌ NO | ❌ NO |

### Por Partido
- ✅ **Una apuesta** por usuario por partido
- ✅ **Monto fijo**: 10.000 pesos
- ✅ **Opciones**: Local, Empate, Visita

---

## 🔄 Ciclo de Vida

```
1. CREACIÓN (Admin)
   ↓
   Partidos creados + Cuotas configuradas
   ↓
2. APUESTAS (Usuarios)
   ↓
   Usuarios apuestan (varios días)
   ↓
3. CIERRE (Automático - 24h antes)
   ↓
   Sistema bloquea nuevas apuestas
   ↓
4. PARTIDOS (Jugados)
   ↓
   Admin actualiza resultados
   ↓
5. LIQUIDACIÓN (Admin manual)
   ↓
   Puntos distribuidos, ranking actualizado
   ↓
6. SIGUIENTE FECHA
```

---

## 💻 Validación Backend

```javascript
// Verificar si puede apostar
const ahora = new Date();
const primerPartido = await obtenerPrimerPartido(idTorneo, fecha);
const fechaLimite = new Date(primerPartido.FECHA_PARTIDO);
fechaLimite.setHours(fechaLimite.getHours() - 24);

if (ahora >= fechaLimite) {
  // RECHAZAR: Apuestas cerradas
  return 400;
}

// ACEPTAR: Crear apuesta
```

---

## 🎨 Vista Frontend

### Estado: ABIERTO
```
⏱️ Cierre en: 23h 45m 12s
[Apostar Local] [Apostar Empate] [Apostar Visita]
```

### Estado: CERRADO
```
⛔ Apuestas cerradas desde Sáb 08/02 20:00
Tu apuesta: Victoria Local ⏳ Pendiente
```

---

## 📊 Liquidación

### Cálculo de Ganadores
```
Resultado real: Local 2-1
Apuestas Local (cuota 2.50): GANAN → 10.000 × 2.50 = 25.000 pts
Apuestas Empate: PIERDEN → 0 pts
Apuestas Visita: PIERDEN → 0 pts
```

### Estados de Apuesta
| Estado | Descripción | Puntos |
|--------|-------------|--------|
| `pendiente` | Partido no jugado | 0 |
| `ganada` | Acertó predicción | monto × cuota |
| `perdida` | No acertó | 0 |

---

## 🚨 Errores Comunes

### Error 400: "Apuestas cerradas"
**Causa:** Ya pasaron las 24h antes del primer partido
**Solución:** Esperar siguiente fecha

### Error 400: "Ya tienes apuesta"
**Causa:** Usuario ya apostó en este partido
**Solución:** Ver/modificar apuesta existente (si está abierta)

### Error 403: "No puede apostar"
**Causa:** `puede_apostar = 0` o role = 'admin'
**Solución:** Admin debe cambiar permisos

---

## 📚 Documentación Completa

- **FLUJO-APUESTAS.md**: Flujo detallado paso a paso
- **CLAUDE.md**: Documentación técnica completa
- **Backend**: `backend/controllers/apuestasController.js`
- **Frontend**: `frontend/src/components/apuestas/`

---

**Última actualización:** 2026-02-22
