# 🏈 Football Data Pipeline - Jugadores

Pipeline completo para cargar datos de jugadores desde CSV generado por la API FBR hacia la base de datos MySQL.

## 📋 Descripción del Proyecto

Este pipeline procesa los datos de jugadores del equipo `5049d576` obtenidos mediante la API de FBRef y los carga de manera estructurada en las tablas del modelo de datos.

## 🗂️ Estructura de Archivos

```
📁 proyecto/
├── 01_update_database_schema.sql     # Actualización del esquema de BD
├── 02_players_data_pipeline.py       # Pipeline principal de datos
├── 03_validate_pipeline.py           # Validador del pipeline
├── 04_run_complete_pipeline.py       # Ejecutor completo
├── requirements.txt                  # Dependencias Python
├── README_PIPELINE.md                # Esta documentación
└── team_5049d576_players_*.csv       # Archivo CSV de jugadores
```

## 🗄️ Tablas Afectadas

### Tablas Principales:
- **`DIM_JUGADOR`** - Información personal de jugadores
- **`DIM_PAIS`** - Catálogo de países
- **`DIM_POSICION`** - Catálogo de posiciones de fútbol

### Tablas de Relación:
- **`DIM_JUGADOR_PAIS`** - Relación jugador-nacionalidad
- **`DIM_JUGADOR_POSICION`** - Relación jugador-posiciones

### Modificaciones al Esquema:

#### DIM_JUGADOR (campos agregados):
```sql
- PLAYER_ID_FBR VARCHAR(20) UNIQUE  -- ID de FBRef (clave de integración)
- ALTURA_CM DECIMAL(5,2)            -- Altura en centímetros
- PESO_KG DECIMAL(5,2)              -- Peso en kilogramos
- PIE_DOMINANTE VARCHAR(10)         -- Pie dominante (Left/Right)
- CIUDAD_NACIMIENTO VARCHAR(100)    -- Ciudad de nacimiento
- SALARIO VARCHAR(100)              -- Información salarial
- URL_FOTO TEXT                     -- URL de foto del jugador
```

#### DIM_PAIS (campos agregados):
```sql
- NOMBRE_COMPLETO VARCHAR(100)      -- Nombre completo del país
```

## 🚀 Instalación y Configuración

### 1. Instalar Dependencias
```bash
pip install -r requirements.txt
```

### 2. Actualizar Esquema de Base de Datos
```bash
mysql -u mpuga -p MP_DATA_DEV < 01_update_database_schema.sql
```

### 3. Configurar Credenciales
Editar en `02_players_data_pipeline.py` y archivos relacionados:
```python
DB_CONFIG = {
    'host': 'localhost',
    'port': 3306,
    'user': 'tu_usuario',
    'password': 'tu_password',
    'database': 'MP_DATA_DEV'
}
```

## ⚡ Ejecución del Pipeline

### Opción 1: Ejecución Completa (Recomendada)
```bash
python 04_run_complete_pipeline.py
```

### Opción 2: Ejecución Manual por Pasos

1. **Cargar datos:**
```bash
python 02_players_data_pipeline.py
```

2. **Validar resultados:**
```bash
python 03_validate_pipeline.py
```

## 📊 Datos Procesados

### Desde el CSV se extraen:
- **Información Personal:** Nombre, fecha nacimiento, altura, peso
- **Información Técnica:** Posiciones, pie dominante, foto
- **Información Geográfica:** País y ciudad de nacimiento
- **Información Contractual:** Salario (si disponible)
- **Estadísticas del Roster:** Partidos jugados, como titular

### Mapeo de Campos:

| Campo CSV | Campo BD | Tabla | Descripción |
|-----------|----------|-------|-------------|
| `player_id_fbr` | `PLAYER_ID_FBR` | DIM_JUGADOR | ID único de FBRef |
| `nombre_completo` | `NOMBRE` | DIM_JUGADOR | Nombre (normalizado a mayúsculas) |
| `fecha_nacimiento` | `FECHA_NACIMIENTO` | DIM_JUGADOR | Fecha formato YYYY-MM-DD |
| `nacionalidad_codigo` | `CODIGO_FIFA` | DIM_PAIS | Código de 3 letras del país |
| `posicion_roster` | `NOMBRE` | DIM_POSICION | Posición(es) principales |

## 🔍 Validaciones Incluidas

### Integridad de Datos:
- ✅ Verificación de PLAYER_ID_FBR únicos
- ✅ Validación de fechas de nacimiento
- ✅ Normalización de nombres a mayúsculas
- ✅ Manejo de valores nulos

### Relaciones:
- ✅ Creación automática de países no existentes
- ✅ Creación automática de posiciones no existentes
- ✅ Prevención de duplicados en tablas de relación

### Reportes:
- 📊 Estadísticas por país de origen
- 📊 Distribución por posiciones
- 📊 Jugadores con datos completos vs incompletos

## 📋 Logs y Monitoreo

### Archivos de Log:
- `players_pipeline.log` - Log del pipeline principal
- `pipeline_execution_YYYYMMDD_HHMMSS.log` - Log de ejecución completa

### Niveles de Log:
- **INFO** - Progreso normal del pipeline
- **WARNING** - Datos faltantes o inconsistentes
- **ERROR** - Errores que impiden el procesamiento

## 🛠️ Resolución de Problemas

### Error: "No puedo borrar o actualizar una fila padre"
**Causa:** Violación de restricción de clave foránea
**Solución:** El pipeline usa PLAYER_ID_FBR como clave de relación, manteniendo ID_JUGADOR como autoincremental

### Error: "Duplicate entry for key 'uk_player_id_fbr'"
**Causa:** Intentar insertar jugador que ya existe
**Solución:** El pipeline actualiza automáticamente jugadores existentes

### Error: "Data truncated for column"
**Causa:** Datos muy largos para el campo de BD
**Solución:** Los datos se truncan automáticamente y se registra un warning

### Warning: "Jugador sin PLAYER_ID_FBR"
**Causa:** Registro en CSV sin ID de FBRef
**Solución:** El jugador se omite del procesamiento (se registra en log)

## 🔄 Flujo del Pipeline

```
📁 CSV Input
    ↓
🔍 Validación de Datos
    ↓
👤 Procesar DIM_JUGADOR
    ↓ 
🌍 Procesar DIM_PAIS
    ↓
⚽ Procesar DIM_POSICION
    ↓
🔗 Crear Relaciones
    ↓
✅ Validación Final
    ↓
📊 Reporte de Resultados
```

## 📈 Estadísticas Esperadas

Para el equipo `5049d576` (basado en el CSV analizado):

- **Total Jugadores:** ~28
- **Países Representados:** Argentina, Chile, Colombia, Paraguay
- **Posiciones:** GK, DF, MF, FW, CB, FB, CM, AM
- **Jugadores con datos completos:** ~85-90%

## 🧪 Casos de Prueba

### Test 1: Jugador Completo
```csv
player_id_fbr,nombre_completo,fecha_nacimiento,nacionalidad_codigo,posicion_roster
76c44dcd,Matías Lugo,2001-05-10,ARG,MF
```
**Resultado Esperado:** ✅ Inserción exitosa con todas las relaciones

### Test 2: Jugador Sin Fecha
```csv
player_id_fbr,nombre_completo,fecha_nacimiento,nacionalidad_codigo,posicion_roster
abc123def,Juan Pérez,,CHI,DF
```
**Resultado Esperado:** ⚠️ Warning, inserción con fecha_nacimiento = NULL

### Test 3: Múltiples Posiciones
```csv
player_id_fbr,nombre_completo,posicion_roster,posiciones_detalladas
xyz789ghi,Carlos Silva,"MF,FW","CM, AM"
```
**Resultado Esperado:** ✅ Múltiples relaciones en DIM_JUGADOR_POSICION

## 🔐 Consideraciones de Seguridad

- **Credenciales:** Nunca hardcodear passwords en código
- **SQL Injection:** Uso de parámetros preparados en todas las consultas
- **Permisos:** Usuario de BD debe tener solo permisos necesarios:
  ```sql
  GRANT SELECT, INSERT, UPDATE ON MP_DATA_DEV.* TO 'pipeline_user'@'localhost';
  ```

## 📋 Mantenimiento

### Ejecución Periódica:
```bash
# Cron job para actualización diaria
0 2 * * * /path/to/python /path/to/04_run_complete_pipeline.py
```

### Limpieza de Logs:
```bash
# Mantener solo logs de últimos 30 días
find . -name "pipeline_execution_*.log" -mtime +30 -delete
```

### Backup antes de ejecución:
```bash
mysqldump -u mpuga -p MP_DATA_DEV > backup_before_pipeline.sql
```

## 🆘 Soporte

### Contacto:
- **Desarrollador:** [Tu nombre]
- **Email:** [tu.email@empresa.com]

### Logs Importantes:
Al reportar problemas, incluir:
1. Archivo de log completo
2. Archivo CSV problemático
3. Configuración de base de datos (sin passwords)
4. Versión de Python y librerías

### Comandos de Diagnóstico:
```bash
# Verificar estado de tablas
python -c "
from validate_pipeline import PipelineValidator
import mysql.connector
config = {'host':'localhost','user':'mpuga','password':'***','database':'MP_DATA_DEV'}
validator = PipelineValidator(config)
validator.run_validation()
"

# Verificar CSV
python -c "
import pandas as pd
df = pd.read_csv('team_5049d576_players_*.csv')
print(f'Filas: {len(df)}, Columnas: {len(df.columns)}')
print('Campos:', list(df.columns))
"
```

---

## 📝 Changelog

### v1.0.0 (2025-06-04)
- ✅ Pipeline inicial para carga de jugadores
- ✅ Validación completa de datos
- ✅ Manejo de relaciones entre tablas
- ✅ Sistema de logs detallado
- ✅ Documentación completa

### Próximas Mejoras:
- 🔄 Pipeline incremental (solo cambios)
- 📊 Dashboard de monitoreo
- 🔄 Integración con API en tiempo real
- 📈 Métricas de calidad de datos

---

*Documentación actualizada: 2025-06-04*