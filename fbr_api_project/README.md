# Pipeline de Datos - O'Higgins FC ⚽

Sistema completo de gestión de datos de jugadores para el Club Deportivo O'Higgins.

## 📋 Características

- **Base de datos completa** con modelo dimensional
- **Pipeline automatizado** para carga de jugadores
- **Validación de datos** y limpieza automática
- **Relaciones normalizadas** (jugador-país, jugador-posición)
- **Logging detallado** del proceso
- **Manejo de errores** robusto

## 🏗️ Arquitectura de la Base de Datos

### Tablas Principales
- `DIM_JUGADOR` - Información principal de jugadores
- `DIM_PAIS` - Catálogo de países
- `DIM_POSICION` - Catálogo de posiciones
- `DIM_EQUIPO` - Información de equipos

### Tablas de Relación
- `DIM_JUGADOR_PAIS` - Nacionalidad de jugadores
- `DIM_JUGADOR_POSICION` - Posiciones de jugadores

### Clave Principal de Relaciones
- **`PLAYER_ID_FBR`**: ID único de FBRef usado para todas las relaciones
- **`ID_JUGADOR`**: ID autoincremental interno para referencia

## 📦 Prerrequisitos

### Software Requerido
```bash
# Python 3.7+
python --version

# MySQL 5.7+ o MariaDB 10.3+
mysql --version
```

### Dependencias Python
```bash
pip install pandas mysql-connector-python
```

## 🚀 Instalación y Configuración

### 1. Preparar Archivos
```bash
# Descargar todos los archivos del pipeline
- setupDatabase.py
- dataPipelineJugadores.py  
- runPipeline.py
- team_5049d576_players_20250603_040149.csv
```

### 2. Configurar MySQL
```sql
-- Crear usuario (opcional)
CREATE USER 'ohiggins_user'@'localhost' IDENTIFIED BY 'tu_password';
GRANT ALL PRIVILEGES ON OHIGGINS_STATS_DB.* TO 'ohiggins_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Configurar Variables de Entorno (Opcional)
```bash
export DB_HOST=localhost
export DB_NAME=OHIGGINS_STATS_DB
export DB_USER=root
export DB_PASSWORD=tu_password
export DB_PORT=3306
```

## 🎯 Uso del Pipeline

### Ejecución Completa (Recomendado)
```bash
# Pipeline completo desde cero
python runPipeline.py

# Con archivo CSV específico
python runPipeline.py --csv mi_archivo_jugadores.csv
```

### Ejecuciones Específicas

#### Solo configurar base de datos
```bash
python setupDatabase.py
```

#### Solo cargar jugadores (BD ya configurada)
```bash
python runPipeline.py --no-setup
```

#### Sin validaciones finales
```bash
python runPipeline.py --no-validate
```

#### Con archivo de configuración personalizado
```bash
# Crear config.json
{
    "host": "localhost",
    "database": "OHIGGINS_STATS_DB", 
    "user": "ohiggins_user",
    "password": "mi_password",
    "port": 3306
}

# Ejecutar con configuración
python runPipeline.py --config config.json
```

## 📊 Estructura de Datos de Entrada

### Formato CSV Requerido
El archivo CSV debe contener las siguientes columnas:

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `player_id_fbr` | string | ✅ | ID único de FBRef |
| `nombre_completo` | string | ✅ | Nombre completo del jugador |
| `nombre_roster` | string | ⚠️ | Nombre en roster (fallback si no hay completo) |
| `fecha_nacimiento` | date | ❌ | Formato: YYYY-MM-DD |
| `nacionalidad_codigo` | string(3) | ❌ | Código FIFA del país |
| `posicion_roster` | string | ❌ | Código de posición (GK, DF, MF, FW) |
| `altura_cm` | decimal | ❌ | Altura en centímetros |
| `peso_kg` | decimal | ❌ | Peso en kilogramos |
| `pie_dominante` | string | ❌ | LEFT, RIGHT, BOTH |
| `ciudad_nacimiento` | string | ❌ | Ciudad de nacimiento |
| `salario` | string | ❌ | Información salarial |
| `url_foto` | string | ❌ | URL de la foto del jugador |

### Ejemplo de Registro
```csv
player_id_fbr,nombre_completo,nacionalidad_codigo,posicion_roster,fecha_nacimiento,altura_cm
4806ec67,JORDAN PICKFORD,ENG,GK,1994-03-07,185.0
```

## 🔍 Validaciones Automáticas

### Limpieza de Datos
- ✅ Normalización de texto a MAYÚSCULAS
- ✅ Validación de fechas (formato YYYY-MM-DD)
- ✅ Conversión de valores numéricos
- ✅ Normalización de códigos de país
- ✅ Mapeo de pie dominante

### Validaciones de Integridad
- ✅ Verificación de `player_id_fbr` único
- ✅ Validación de códigos de país existentes
- ✅ Verificación de posiciones en catálogo
- ✅ Control de duplicados

## 📈 Monitoreo y Logs

### Archivos de Log
```
logs/
├── pipeline_YYYYMMDD_HHMMSS.log  # Log principal
├── setup_database.log            # Log de configuración DB
└── pipeline_jugadores.log        # Log específico de jugadores
```

### Estadísticas de Procesamiento
El pipeline reporta:
- 👨‍💼 Jugadores procesados/insertados/actualizados
- 🌍 Países nuevos agregados
- ⚽ Posiciones procesadas
- ❌ Errores encontrados

## 🔧 Solución de Problemas

### Error: "No se puede conectar a MySQL"
```bash
# Verificar que MySQL está ejecutándose
sudo systemctl status mysql

# Verificar credenciales
mysql -u root -p
```

### Error: "Archivo CSV no encontrado"
```bash
# Verificar ruta del archivo
ls -la team_5049d576_players_20250603_040149.csv

# Especificar ruta completa
python runPipeline.py --csv /ruta/completa/al/archivo.csv
```

### Error: "Foreign key constraint fails"
```bash
# Limpiar base de datos y recrear
python setupDatabase.py
```

### Error: "Encoding issues"
```bash
# Verificar encoding del CSV
file -bi tu_archivo.csv

# Convertir si es necesario
iconv -f ISO-8859-1 -t UTF-8 archivo.csv > archivo_utf8.csv
```

## 📚 Consultas Útiles

### Verificar Datos Cargados
```sql
-- Resumen general
SELECT 
    (SELECT COUNT(*) FROM DIM_JUGADOR) as jugadores,
    (SELECT COUNT(*) FROM DIM_PAIS) as paises,
    (SELECT COUNT(*) FROM DIM_JUGADOR_PAIS) as relaciones_pais,
    (SELECT COUNT(*) FROM DIM_JUGADOR_POSICION) as relaciones_posicion;

-- Jugadores por nacionalidad
SELECT p.NOMBRE, COUNT(*) as cantidad
FROM DIM_JUGADOR_PAIS jp
JOIN DIM_PAIS p ON jp.ID_PAIS = p.ID_PAIS
GROUP BY p.NOMBRE
ORDER BY cantidad DESC;

-- Jugadores por posición
SELECT pos.NOMBRE, COUNT(*) as cantidad
FROM DIM_JUGADOR_POSICION jp
JOIN DIM_POSICION pos ON jp.ID_POSICION = pos.ID_POSICION
GROUP BY pos.NOMBRE
ORDER BY cantidad DESC;
```

### Buscar Jugadores Específicos
```sql
-- Por nombre
SELECT * FROM DIM_JUGADOR 
WHERE NOMBRE_COMPLETO LIKE '%NOMBRE%';

-- Por nacionalidad
SELECT j.NOMBRE_COMPLETO, j.PLAYER_ID_FBR, p.NOMBRE as PAIS
FROM DIM_JUGADOR j
JOIN DIM_JUGADOR_PAIS jp ON j.PLAYER_ID_FBR = jp.PLAYER_ID_FBR
JOIN DIM_PAIS p ON jp.ID_PAIS = p.ID_PAIS
WHERE p.CODIGO_FIFA = 'CHI';

-- Jugadores sin datos completos
SELECT NOMBRE_COMPLETO, PLAYER_ID_FBR
FROM DIM_JUGADOR 
WHERE FECHA_NACIMIENTO IS NULL 
   OR ALTURA_CM IS NULL;
```

## 🔄 Mantenimiento

### Actualizar Datos de Jugadores
```bash
# Obtener nuevo CSV con datos actualizados
# Ejecutar pipeline (actualizará automáticamente)
python runPipeline.py --no-setup --csv nuevo_archivo.csv
```

### Agregar Nuevos Países/Posiciones
```sql
-- Agregar nuevo país
INSERT INTO DIM_PAIS (CODIGO_FIFA, NOMBRE, CONTINENTE) 
VALUES ('NOR', 'NORUEGA', 'EUROPA');

-- Agregar nueva posición
INSERT INTO DIM_POSICION (CODIGO_POSICION, NOMBRE, DESCRIPCION, LINEA_CAMPO)
VALUES ('WB', 'WING-BACK', 'Lateral con proyección ofensiva', 'DEFENSA');
```

### Backup de Datos
```bash
# Backup completo
mysqldump -u root -p OHIGGINS_STATS_DB > backup_ohiggins.sql

# Backup solo estructura
mysqldump -u root -p --no-data OHIGGINS_STATS_DB > estructura_ohiggins.sql

# Backup solo datos
mysqldump -u root -p --no-create-info OHIGGINS_STATS_DB > datos_ohiggins.sql
```

## 🤝 Contribuir

### Agregar Nuevas Funcionalidades
1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

### Reportar Bugs
- Usar GitHub Issues
- Incluir logs completos
- Especificar versión de Python y MySQL
- Proporcionar archivo CSV de prueba (sin datos sensibles)

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver archivo [LICENSE](LICENSE) para detalles.

## 👥 Autores

- **Equipo de Desarrollo O'Higgins FC** - *Desarrollo inicial*

## 🙏 Agradecimientos

- FBRef por proporcionar la API de datos
- Comunidad de O'Higgins FC
- Colaboradores del proyecto

---

**🏆 ¡Vamos O'Higgins!** ⚽

Para soporte técnico: [support@ohiggins.cl](mailto:support@ohiggins.cl)