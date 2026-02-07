# Setup del Proyecto - Importador de Jugadores

## 📋 Requisitos Previos

1. **Python 3.8+**
2. **MySQL/MariaDB** cualquier versión
3. **Usuario de base de datos** con permisos de lectura/escritura

## 🔧 Instalación

### 1. Instalar dependencias
```bash
pip install -r requirements.txt
```

### 2. Configurar credenciales de base de datos

#### Editar `database_config.py`:
```python
@dataclass
class DatabaseConfig:
    host: str = "localhost"        # Tu servidor MySQL
    port: int = 3306              # Puerto MySQL  
    database: str = "MP_DATA_DEV"  # Nombre de la BD
    user: str = "tu_usuario"       # Tu usuario MySQL
    password: str = "tu_password"  # ⚠️ IMPORTANTE: Configurar tu contraseña
```

### 3. Configurar base de datos automáticamente

#### Ejecutar script de configuración:
```bash
python setup_database.py
```

Este script:
- ✅ Detecta tu versión de MySQL/MariaDB
- ✅ Crea la base de datos con collation compatible
- ✅ Verifica la conexión
- ✅ Muestra troubleshooting si hay errores

### 4. Crear tablas (solo si no existen)
```bash
# Si el script anterior no funciona, crear manualmente:
mysql -u tu_usuario -p MP_DATA_DEV < modeloOhigginsStats.sql
```

## 🚀 Uso

### Importar jugadores de un equipo:
```bash
python team_players_importer.py
```

## 🔧 Solución al Error de Collation

### El error `Unknown collation: 'utf8mb4_0900_ai_ci'` se debe a:

1. **MySQL < 8.0** o **MariaDB** no soportan esta collation
2. **Solución aplicada**: Usar `utf8mb4_general_ci` (compatible con todas las versiones)

### ✅ Cambios implementados:
- Detección automática de versión MySQL/MariaDB
- Uso de collation compatible
- Configuración segura de charset
- Fallback a utf8 si utf8mb4 falla

## 📊 Verificación de Configuración

### Comprobar versión de tu servidor:
```sql
SELECT VERSION();
```

### Verificar charset de la base de datos:
```sql
SELECT DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME 
FROM information_schema.SCHEMATA 
WHERE SCHEMA_NAME = 'MP_DATA_DEV';
```

## 🐛 Troubleshooting Común

### ❌ Error 1273 (Collation):
**Solución**: Ejecutar `python setup_database.py`

### ❌ Error 1045 (Access denied):
```bash
# Verificar credenciales
mysql -u tu_usuario -p

# Si no existe el usuario, crearlo:
mysql -u root -p
CREATE USER 'tu_usuario'@'localhost' IDENTIFIED BY 'tu_password';
GRANT ALL PRIVILEGES ON MP_DATA_DEV.* TO 'tu_usuario'@'localhost';
FLUSH PRIVILEGES;
```

### ❌ Error 2003 (Can't connect):
```bash
# Verificar que MySQL esté ejecutándose
sudo systemctl status mysql
# o
sudo systemctl status mariadb

# Iniciar si está detenido
sudo systemctl start mysql
```

### ❌ Error 1049 (Unknown database):
La base de datos se crea automáticamente con `setup_database.py`

## 📈 Compatibilidad Probada

- ✅ **MySQL 5.7+**
- ✅ **MySQL 8.0+** 
- ✅ **MariaDB 10.0+**
- ✅ **Ubuntu 20.04/22.04**
- ✅ **CentOS/RHEL 7/8**
- ✅ **Windows 10/11**

## ⚡ Quick Start

```bash
# 1. Instalar dependencias
pip install -r requirements.txt

# 2. Configurar password en database_config.py
# DB_CONFIG.password = "tu_password"

# 3. Configurar base de datos
python setup_database.py

# 4. Importar jugadores
python team_players_importer.py
```