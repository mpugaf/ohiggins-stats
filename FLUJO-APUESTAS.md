# 🎲 Sistema de Apuestas - Flujo Completo del Proceso

## 📋 Índice
1. [Reglas Fundamentales](#reglas-fundamentales)
2. [Ventana de Apuestas](#ventana-de-apuestas)
3. [Flujo Paso a Paso](#flujo-paso-a-paso)
4. [Diagrama de Estados](#diagrama-de-estados)
5. [Implementación Técnica](#implementación-técnica)
6. [Casos de Uso](#casos-de-uso)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Reglas Fundamentales

### Monto de Apuesta
- **Fijo**: 10.000 pesos chilenos
- **No modificable** por usuarios
- **Uniforme** para todos los partidos

### Restricciones de Tiempo
- ✅ **Apuestas ABIERTAS**: Desde creación hasta 24h antes del primer partido
- ❌ **Apuestas CERRADAS**: Desde 24h antes del primer partido hasta fin de fecha
- 🔄 **Nueva fecha**: Se habilita cuando finaliza la fecha anterior

### Restricciones por Usuario
- **Admin**: NO puede apostar (solo gestionar)
- **Usuario**: Puede apostar si `puede_apostar = 1`
- **Límite**: Una apuesta por partido por usuario

---

## ⏰ Ventana de Apuestas

### Ejemplo Práctico

**Fecha 10 del Torneo:**
- Partido 1: Lunes 10/02/2025 - 20:00
- Partido 2: Martes 11/02/2025 - 18:00
- Partido 3: Miércoles 12/02/2025 - 21:00

**Cálculo de fecha límite:**
```
Primer partido: Lunes 10/02/2025 20:00
Fecha límite: Domingo 09/02/2025 20:00 (24h antes)

✅ Apuestas ABIERTAS: Hasta Domingo 09/02 20:00
❌ Apuestas CERRADAS: Desde Domingo 09/02 20:00 en adelante
```

### Cronología Visual

```
┌─────────────────────────────────────────────────────────────────┐
│                    LÍNEA DE TIEMPO                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Jueves 05/02               Domingo 09/02      Lunes 10/02     │
│  Partidos creados           20:00              20:00           │
│       │                       │                  │             │
│       │◄──── ABIERTAS ───────►│◄─── CERRADAS ───►│            │
│       │                       │                  │             │
│       │   5 días para         │  Apuestas        │  Partido   │
│       │   apostar             │  bloqueadas      │  inicia    │
│       │                       │                  │             │
│       └───────────────────────┴──────────────────┘             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📝 Flujo Paso a Paso

### FASE 1: Preparación (Administrador)

#### 1.1 Crear Partidos de la Fecha
```
Acción: Admin → Gestión de Partidos → Crear Partido

Datos requeridos:
- Torneo: Primera División 2025
- Fecha: 10
- Equipo Local: O'Higgins
- Equipo Visita: Colo-Colo
- Fecha/Hora: Lunes 10/02/2025 20:00
- Estadio: El Teniente

Backend: POST /api/partidos
```

#### 1.2 Configurar Cuotas
```
Acción: Admin → Gestión de Cuotas → Configurar Partido

Cuotas sugeridas:
- Local: 2.50 (retorno: 25.000)
- Empate: 3.20 (retorno: 32.000)
- Visita: 2.80 (retorno: 28.000)

Backend: POST /api/cuotas/partido/:idPartido
```

#### 1.3 Sistema Calcula Límite
```
Sistema automático:
- Obtiene primer partido de la fecha
- Calcula: fecha_partido - 24 horas
- Almacena fecha límite
- Estado: apuestas_abiertas = TRUE
```

---

### FASE 2: Periodo de Apuestas (Usuarios)

#### 2.1 Usuario Accede a Partidos Disponibles
```
URL: /apuestas/partidos-disponibles

Vista muestra:
┌──────────────────────────────────────────────────┐
│  📅 Fecha 10 - Primera División 2025            │
│  ⏱️ Cierre: Domingo 09/02 20:00 (en 23h 45m)   │
├──────────────────────────────────────────────────┤
│                                                  │
│  🏟️ O'Higgins vs Colo-Colo                     │
│  📍 Estadio El Teniente                         │
│  📅 Lunes 10/02/2025 - 20:00                    │
│                                                  │
│  Cuotas:                                        │
│  [Local 2.50]  [Empate 3.20]  [Visita 2.80]    │
│                                                  │
│  Apuesta: $10.000                               │
│  Retorno potencial: $25.000 / $32.000 / $28.000│
│                                                  │
└──────────────────────────────────────────────────┘
```

#### 2.2 Usuario Selecciona y Confirma
```
Flujo:
1. Usuario click en "Local 2.50"
2. Modal de confirmación:
   ┌────────────────────────────────────┐
   │  Confirmar Apuesta                 │
   ├────────────────────────────────────┤
   │  Partido: O'Higgins vs Colo-Colo  │
   │  Predicción: Victoria Local        │
   │  Cuota: 2.50                       │
   │  Apuesta: $10.000                  │
   │  Retorno potencial: $25.000        │
   │                                    │
   │  [Cancelar]  [Confirmar Apuesta]  │
   └────────────────────────────────────┘
3. Usuario click "Confirmar Apuesta"
4. POST /api/apuestas
```

#### 2.3 Validaciones del Sistema
```javascript
Backend valida:
✓ Usuario autenticado
✓ Usuario tiene puede_apostar = 1
✓ Usuario no tiene apuesta previa en este partido
✓ Cuota existe y está activa
✓ Fecha límite NO alcanzada ← CRÍTICO
✓ Partido no ha iniciado
✓ Partido estado = 'PROGRAMADO'

Si todas pasan:
- INSERT INTO apuestas_usuarios
- estado = 'pendiente'
- monto_apuesta = 10000
- valor_cuota = cuota seleccionada
- retorno_potencial = 10000 × cuota
- puntos_ganados = 0

Response: { success: true, message: 'Apuesta registrada' }
```

---

### FASE 3: Cierre de Apuestas (Automático)

#### 3.1 Sistema Alcanza Fecha Límite
```
Tiempo: Domingo 09/02/2025 20:00

Sistema (cron job o verificación en endpoint):
1. Obtiene fecha/hora actual
2. Compara con fecha límite
3. Si ahora >= fecha_límite:
   - Bloquea nuevas apuestas
   - Frontend muestra "CERRADO"
   - Backend rechaza POST /api/apuestas
```

#### 3.2 Usuario Intenta Apostar (Rechazado)
```
Request: POST /api/apuestas
{
  id_partido: 123,
  tipo_apuesta: 'local',
  ...
}

Response: 400 Bad Request
{
  success: false,
  message: 'Las apuestas para esta fecha están cerradas',
  fecha_cierre: '2025-02-09T20:00:00Z',
  primer_partido: '2025-02-10T20:00:00Z',
  tiempo_cerrado_hace: '2 horas'
}
```

#### 3.3 Vista de Usuario
```
Estado: CERRADO
┌──────────────────────────────────────────────────┐
│  📅 Fecha 10 - Primera División 2025            │
│  ⛔ Apuestas CERRADAS desde Dom 09/02 20:00     │
├──────────────────────────────────────────────────┤
│                                                  │
│  🏟️ O'Higgins vs Colo-Colo                     │
│  📅 Lunes 10/02/2025 - 20:00                    │
│  🔒 Apuestas cerradas                           │
│                                                  │
│  Tu apuesta: Victoria Local (2.50)              │
│  Estado: ⏳ Pendiente                           │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

### FASE 4: Ejecución de Partidos

#### 4.1 Admin Actualiza Resultado
```
Acción: Admin → Gestión de Partidos → Actualizar Resultado

Partido: O'Higgins vs Colo-Colo
Resultado final: 2-1

Datos actualizados:
- GOLES_LOCAL = 2
- GOLES_VISITA = 1
- ESTADO_PARTIDO = 'FINALIZADO'
- FECHA_ACTUALIZACION = NOW()

Backend: PUT /api/partidos/:id
```

---

### FASE 5: Liquidación de Apuestas (Admin - Manual)

#### 5.1 Admin Accede a Liquidación
```
URL: /admin/liquidar-apuestas

Vista:
┌──────────────────────────────────────────────────┐
│  💰 Liquidar Apuestas                           │
├──────────────────────────────────────────────────┤
│  Seleccionar partido finalizado:                │
│                                                  │
│  ☑️ O'Higgins 2-1 Colo-Colo (Finalizado)        │
│     10/02/2025 - 15 apuestas registradas        │
│                                                  │
│  [Liquidar Apuestas]                            │
└──────────────────────────────────────────────────┘
```

#### 5.2 Sistema Procesa Liquidación
```javascript
POST /api/apuestas/liquidar/:idPartido

Proceso:
1. Obtener resultado del partido:
   GOLES_LOCAL = 2, GOLES_VISITA = 1
   Resultado: 'local' (victoria local)

2. Obtener todas las apuestas del partido:
   SELECT * FROM apuestas_usuarios WHERE id_partido = 123

3. Para cada apuesta:
   if (apuesta.tipo_apuesta === resultado_real) {
     // GANADOR
     puntos = apuesta.monto_apuesta × apuesta.valor_cuota
     UPDATE apuestas_usuarios
     SET estado = 'ganada',
         puntos_ganados = puntos
     WHERE id_apuesta = ...

     // Registrar en historial
     INSERT INTO historial_puntos (
       id_usuario, id_apuesta, id_partido,
       puntos_ganados
     )
   } else {
     // PERDEDOR
     UPDATE apuestas_usuarios
     SET estado = 'perdida',
         puntos_ganados = 0
     WHERE id_apuesta = ...
   }

4. Response:
   {
     success: true,
     message: 'Apuestas liquidadas exitosamente',
     ganadores: 8,
     perdedores: 7,
     puntos_distribuidos: 200000
   }
```

---

### FASE 6: Consulta de Resultados (Usuarios)

#### 6.1 Mis Apuestas
```
URL: /apuestas/mis-apuestas

Vista:
┌──────────────────────────────────────────────────┐
│  📊 Mis Apuestas                                │
├──────────────────────────────────────────────────┤
│                                                  │
│  ✅ GANADAS (3)                                 │
│  ├─ O'Higgins vs Colo-Colo | Local | +25.000   │
│  ├─ U. de Chile vs U. Católica | Empate | +32k │
│  └─ Everton vs Huachipato | Visita | +28.000   │
│                                                  │
│  ❌ PERDIDAS (2)                                │
│  ├─ Cobreloa vs Antofagasta | Local | 0        │
│  └─ Cobresal vs Ñublense | Visita | 0          │
│                                                  │
│  ⏳ PENDIENTES (5)                              │
│  └─ [Lista de apuestas en partidos no jugados] │
│                                                  │
│  💰 Total Puntos: 85.000                        │
│  📈 Efectividad: 60% (3/5)                      │
│                                                  │
└──────────────────────────────────────────────────┘
```

#### 6.2 Tabla de Posiciones
```
URL: /apuestas/tabla-posiciones

Vista:
┌──────────────────────────────────────────────────┐
│  🏆 Tabla de Posiciones - Primera División 2025│
│  📅 Fecha 10                                    │
├──────────────────────────────────────────────────┤
│  #  Usuario        Puntos  Apuestas  Aciertos  │
│  1  🥇 juanperez   125.000    15      73% (11) │
│  2  🥈 mariag      118.500    15      67% (10) │
│  3  🥉 pedrito85    95.000    12      75% (9)  │
│  4  carloss        85.000    10      60% (6)   │
│  5  anita_2024     72.000    15      47% (7)   │
│  ...                                            │
│  15 usuario_test   25.000     8      25% (2)   │
│                                                  │
│  Filtros: [Torneo ▼] [Fecha ▼]                 │
└──────────────────────────────────────────────────┘
```

---

## 🔄 Diagrama de Estados

### Estados de una Apuesta

```
                    ┌──────────────┐
                    │  Usuario     │
                    │  hace click  │
                    └──────┬───────┘
                           │
                           ▼
              ┌────────────────────────┐
              │  VALIDACIÓN SISTEMA    │
              │  - Tiempo válido?      │
              │  - Usuario puede?      │
              │  - Ya apostó?          │
              └────────┬───────────────┘
                       │
           ┌───────────┴────────────┐
           │                        │
        ❌ NO                     ✅ SÍ
           │                        │
           ▼                        ▼
    ┌──────────┐            ┌──────────────┐
    │ RECHAZADA│            │  PENDIENTE   │
    │ (400)    │            │ (registrada) │
    └──────────┘            └──────┬───────┘
                                   │
                         ┌─────────┴─────────┐
                         │  Partido jugado   │
                         │  Admin liquida    │
                         └─────────┬─────────┘
                                   │
                     ┌─────────────┴─────────────┐
                     │                           │
                ✅ Acierta                  ❌ Falla
                     │                           │
                     ▼                           ▼
              ┌────────────┐              ┌───────────┐
              │  GANADA    │              │  PERDIDA  │
              │ puntos > 0 │              │ puntos = 0│
              └────────────┘              └───────────┘
```

### Estados de una Fecha

```
  ┌─────────────────┐
  │ CREADA          │  Admin crea partidos
  │ (Apuestas       │
  │  ABIERTAS)      │
  └────────┬────────┘
           │
           │ Usuarios apuestan (días previos)
           │
           ▼
  ┌─────────────────┐
  │ 24h antes       │  Sistema cierra apuestas
  │ (Apuestas       │
  │  CERRADAS)      │
  └────────┬────────┘
           │
           │ Partidos se juegan
           │
           ▼
  ┌─────────────────┐
  │ Partidos        │  Admin actualiza resultados
  │ FINALIZADOS     │
  └────────┬────────┘
           │
           │ Admin liquida apuestas
           │
           ▼
  ┌─────────────────┐
  │ LIQUIDADA       │  Puntos distribuidos
  │ (Ranking        │  Nueva fecha disponible
  │  actualizado)   │
  └─────────────────┘
```

---

## 💻 Implementación Técnica

### Endpoint de Verificación de Estado

```javascript
// backend/routes/apuestas.js

/**
 * GET /api/apuestas/estado-fecha/:idTorneo/:fecha
 * Verifica si las apuestas están abiertas para una fecha
 */
router.get('/estado-fecha/:idTorneo/:fecha', async (req, res) => {
  try {
    const { idTorneo, fecha } = req.params;
    const ahora = new Date();

    // 1. Obtener primer partido de la fecha
    const query = `
      SELECT
        ID_PARTIDO,
        FECHA_PARTIDO,
        ID_EQUIPO_LOCAL,
        ID_EQUIPO_VISITA
      FROM HECHOS_RESULTADOS
      WHERE ID_TORNEO = ?
        AND FECHA_TORNEO = ?
        AND ESTADO_PARTIDO != 'CANCELADO'
      ORDER BY FECHA_PARTIDO ASC
      LIMIT 1
    `;

    const partidos = await executeQuery(query, [idTorneo, fecha]);

    if (partidos.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No hay partidos para esta fecha'
      });
    }

    const primerPartido = partidos[0];
    const fechaPartido = new Date(primerPartido.FECHA_PARTIDO);
    const fechaLimite = new Date(fechaPartido);
    fechaLimite.setHours(fechaLimite.getHours() - 24);

    // 2. Determinar estado
    const apuestasAbiertas = ahora < fechaLimite;
    const tiempoRestante = apuestasAbiertas ? fechaLimite - ahora : 0;

    // 3. Formatear response
    res.json({
      success: true,
      apuestas_abiertas: apuestasAbiertas,
      fecha_cierre: fechaLimite.toISOString(),
      primer_partido: {
        id: primerPartido.ID_PARTIDO,
        fecha: fechaPartido.toISOString(),
        local: primerPartido.ID_EQUIPO_LOCAL,
        visita: primerPartido.ID_EQUIPO_VISITA
      },
      tiempo_restante: {
        milisegundos: tiempoRestante,
        horas: Math.floor(tiempoRestante / (1000 * 60 * 60)),
        minutos: Math.floor((tiempoRestante % (1000 * 60 * 60)) / (1000 * 60))
      },
      mensaje: apuestasAbiertas
        ? `Apuestas abiertas hasta ${fechaLimite.toLocaleString('es-CL')}`
        : `Apuestas cerradas desde ${fechaLimite.toLocaleString('es-CL')}`
    });

  } catch (error) {
    console.error('Error verificando estado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar estado de apuestas'
    });
  }
});
```

### Validación en Crear Apuesta

```javascript
// backend/controllers/apuestasController.js

const crearApuesta = async (req, res) => {
  try {
    const { id_partido, tipo_apuesta, id_equipo_predicho } = req.body;
    const id_usuario = req.user.id_usuario;

    // 1. Obtener info del partido
    const partido = await executeQuery(
      `SELECT
        p.ID_PARTIDO,
        p.ID_TORNEO,
        p.FECHA_TORNEO,
        p.FECHA_PARTIDO,
        p.ESTADO_PARTIDO
      FROM HECHOS_RESULTADOS p
      WHERE p.ID_PARTIDO = ?`,
      [id_partido]
    );

    if (partido.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Partido no encontrado'
      });
    }

    const part = partido[0];

    // 2. VALIDAR VENTANA DE TIEMPO
    const ahora = new Date();
    const fechaPartido = new Date(part.FECHA_PARTIDO);

    // Obtener primer partido de la fecha
    const primerPartido = await executeQuery(
      `SELECT FECHA_PARTIDO
       FROM HECHOS_RESULTADOS
       WHERE ID_TORNEO = ?
         AND FECHA_TORNEO = ?
         AND ESTADO_PARTIDO != 'CANCELADO'
       ORDER BY FECHA_PARTIDO ASC
       LIMIT 1`,
      [part.ID_TORNEO, part.FECHA_TORNEO]
    );

    const fechaPrimerPartido = new Date(primerPartido[0].FECHA_PARTIDO);
    const fechaLimite = new Date(fechaPrimerPartido);
    fechaLimite.setHours(fechaLimite.getHours() - 24);

    // ⚠️ VALIDACIÓN CRÍTICA
    if (ahora >= fechaLimite) {
      return res.status(400).json({
        success: false,
        message: 'Las apuestas para esta fecha están cerradas',
        detalle: {
          fecha_cierre: fechaLimite.toISOString(),
          primer_partido: fechaPrimerPartido.toISOString(),
          tiempo_cerrado_hace: Math.floor((ahora - fechaLimite) / (1000 * 60 * 60)) + ' horas'
        }
      });
    }

    // 3. Validar estado del partido
    if (part.ESTADO_PARTIDO !== 'PROGRAMADO') {
      return res.status(400).json({
        success: false,
        message: 'No se puede apostar en un partido que ya comenzó o finalizó'
      });
    }

    // 4. Verificar apuesta previa
    const apuestaExistente = await executeQuery(
      'SELECT id_apuesta FROM apuestas_usuarios WHERE id_usuario = ? AND id_partido = ?',
      [id_usuario, id_partido]
    );

    if (apuestaExistente.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Ya tienes una apuesta registrada para este partido'
      });
    }

    // 5. Obtener cuota
    const cuotaQuery = await executeQuery(
      `SELECT cuota_decimal, activa
       FROM cuotas_partidos
       WHERE id_partido = ?
         AND tipo_resultado = ?
         AND (id_equipo = ? OR id_equipo IS NULL)
       LIMIT 1`,
      [id_partido, tipo_apuesta, id_equipo_predicho]
    );

    if (cuotaQuery.length === 0 || !cuotaQuery[0].activa) {
      return res.status(400).json({
        success: false,
        message: 'Cuota no disponible para este resultado'
      });
    }

    const cuota = cuotaQuery[0].cuota_decimal;

    // 6. Crear apuesta
    const MONTO_FIJO_APUESTA = 10000.00;
    const retornoPotencial = MONTO_FIJO_APUESTA * cuota;

    const result = await executeQuery(
      `INSERT INTO apuestas_usuarios (
        id_usuario, id_partido, id_torneo,
        tipo_apuesta, id_equipo_predicho,
        monto_apuesta, valor_cuota, retorno_potencial,
        estado, puntos_ganados
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pendiente', 0)`,
      [
        id_usuario, id_partido, part.ID_TORNEO,
        tipo_apuesta, id_equipo_predicho,
        MONTO_FIJO_APUESTA, cuota, retornoPotencial
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Apuesta registrada exitosamente',
      data: {
        id_apuesta: result.insertId,
        monto_apuesta: MONTO_FIJO_APUESTA,
        cuota: cuota,
        retorno_potencial: retornoPotencial,
        fecha_cierre: fechaLimite.toISOString()
      }
    });

  } catch (error) {
    console.error('Error creando apuesta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear apuesta'
    });
  }
};
```

---

## 🎯 Casos de Uso

### Caso 1: Usuario Apuesta a Tiempo
```
Escenario: Usuario apuesta 2 días antes del primer partido
Fecha actual: Viernes 07/02 14:00
Primer partido: Domingo 09/02 20:00
Fecha límite: Sábado 08/02 20:00

✅ Resultado: Apuesta ACEPTADA
   - 30 horas restantes hasta cierre
   - Estado: 'pendiente'
   - Mensaje: "Apuesta registrada. Cierre: Sáb 08/02 20:00"
```

### Caso 2: Usuario Apuesta Tarde
```
Escenario: Usuario intenta apostar después del límite
Fecha actual: Sábado 08/02 21:00
Primer partido: Domingo 09/02 20:00
Fecha límite: Sábado 08/02 20:00

❌ Resultado: Apuesta RECHAZADA (400 Bad Request)
   - 1 hora pasado el límite
   - Mensaje: "Las apuestas para esta fecha están cerradas.
              Cerraron hace 1 hora(s)"
```

### Caso 3: Admin Liquida Partido
```
Escenario: Admin liquida O'Higgins 2-1 Colo-Colo
Apuestas registradas: 15
- Local: 8 apuestas (cuota 2.50)
- Empate: 2 apuestas (cuota 3.20)
- Visita: 5 apuestas (cuota 2.80)

Resultado real: Local (2-1)

✅ Liquidación:
   - Ganadores: 8 usuarios
   - Perdedores: 7 usuarios (2 empate + 5 visita)
   - Puntos distribuidos: 8 × 25.000 = 200.000 puntos
   - Tabla de posiciones actualizada
```

---

## 🔧 Troubleshooting

### Problema: Usuarios reportan que no pueden apostar

**Diagnóstico:**
```bash
# 1. Verificar fecha límite
curl http://192.168.100.16:3000/api/apuestas/estado-fecha/1/10

# Response esperada:
{
  "apuestas_abiertas": false,
  "fecha_cierre": "2025-02-08T20:00:00Z",
  "mensaje": "Apuestas cerradas desde..."
}
```

**Solución:**
- Si `apuestas_abiertas = false`: Es correcto, las apuestas están cerradas
- Si `apuestas_abiertas = true` pero no funciona: Verificar validación en backend
- Revisar zona horaria del servidor vs frontend

### Problema: Apuestas no se cierran automáticamente

**Causa:** No hay cron job o verificación activa

**Solución Temporal (Manual):**
```sql
-- Marcar apuestas como cerradas manualmente
UPDATE config_apuestas
SET apuestas_habilitadas = 'false'
WHERE torneo_activo_id = 1;
```

**Solución Permanente:**
Implementar cron job (ver sección Implementación Técnica en CLAUDE.md)

### Problema: Fecha límite incorrecta

**Causa:** Zona horaria del servidor

**Solución:**
```javascript
// Usar moment-timezone o date-fns-tz
const moment = require('moment-timezone');

const fechaPartido = moment.tz(partido.FECHA_PARTIDO, 'America/Santiago');
const fechaLimite = fechaPartido.clone().subtract(24, 'hours');
```

---

## 📚 Referencias

- **CLAUDE.md**: Documentación técnica completa
- **Backend Controller**: `backend/controllers/apuestasController.js`
- **Frontend Component**: `frontend/src/components/apuestas/PartidosDisponibles.js`
- **Database Schema**: `backend/scripts/01_create_auth_betting_tables.sql`

---

## ✅ Checklist de Implementación

### Backend
- [ ] Endpoint `GET /api/apuestas/estado-fecha/:idTorneo/:fecha`
- [ ] Validación de tiempo en `POST /api/apuestas`
- [ ] Función `obtenerPrimerPartidoDeFecha()`
- [ ] Cron job para cierre automático (opcional)
- [ ] Tests unitarios de validación

### Frontend
- [ ] Componente `CountdownCierre.js`
- [ ] Verificación de estado antes de mostrar botones
- [ ] Mensaje claro de cierre de apuestas
- [ ] Deshabilitar botones cuando está cerrado
- [ ] Mostrar fecha/hora de cierre

### Base de Datos
- [ ] Tabla `control_apuestas_fechas` (opcional)
- [ ] Índices en `HECHOS_RESULTADOS(ID_TORNEO, FECHA_TORNEO, FECHA_PARTIDO)`
- [ ] Índices en `apuestas_usuarios(id_partido, estado)`

### Documentación
- [x] CLAUDE.md actualizado
- [x] FLUJO-APUESTAS.md creado
- [ ] README del proyecto actualizado
- [ ] Diagramas visuales en wiki

---

**Última actualización:** 2026-02-22
**Versión:** 1.0
**Autor:** Sistema O'Higgins Stats
