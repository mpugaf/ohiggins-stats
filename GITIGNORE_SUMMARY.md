# .gitignore - Resumen de Optimización

## 📊 Análisis del Proyecto

### Archivos Ignorados y Espacio Ahorrado

Este documento resume los archivos que están siendo ignorados por `.gitignore` y el espacio que esto ahorra en el repositorio de GitHub.

## 🔴 Archivos Críticos de Seguridad (NUNCA subir)

### Credenciales y API Keys
```
backend/.env                          # Credenciales de BD + JWT_SECRET
frontend/.env                         # URL de API (puede tener tokens)
fbr_api_project/api_key.json         # API Key de FBRef

✅ PLANTILLAS DISPONIBLES:
backend/.env.example
frontend/.env.example
fbr_api_project/api_key.json.example
```

**Riesgo si se expone:**
- Acceso no autorizado a la base de datos
- Robo de datos de usuarios
- Uso indebido de API de terceros (costos)
- Compromiso de sesiones de usuario (JWT)

## 💾 Archivos que Ahorran Espacio

### 1. node_modules/ (Dependencias de Node.js)
```
backend/node_modules/          ~150-300 MB
frontend/node_modules/         ~300-500 MB

Total estimado: ~500 MB
```
**Por qué no subirlo:**
- Se reinstala con `npm install`
- Varía según plataforma/OS
- Ocupa cientos de MB innecesariamente

**Cómo instalar:**
```bash
cd backend && npm install
cd frontend && npm install
```

### 2. frontend/build/ (Build de Producción)
```
frontend/build/                ~3.2 MB
```
**Por qué no subirlo:**
- Se genera con `npm run build`
- Cambia en cada build
- Es el resultado de compilar el código fuente

**Cómo generar:**
```bash
cd frontend && npm run build
```

### 3. Archivos de Log
```
backend/backend.log
fbr_api_project/logs/*.log
statsPipeline/*.log

Total estimado: ~5-10 MB
```
**Por qué no subirlo:**
- Se regeneran en cada ejecución
- Contienen información de debugging local
- Pueden incluir datos sensibles (queries SQL, errores)

### 4. Python Cache (__pycache__, *.pyc)
```
**/__pycache__/
*.pyc, *.pyo, *.pyd

Total estimado: ~2-5 MB
```
**Por qué no subirlo:**
- Archivos compilados de Python
- Se regeneran automáticamente
- Específicos de la versión de Python

### 5. Archivos CSV Generados
```
fbr_api_project/fbr_get_all_players/**/*.csv
statsPipeline/*.csv

Total estimado: ~5-10 MB
```
**Por qué no subirlo:**
- Datos descargados de API de FBRef
- Se regeneran con los scripts de pipeline
- Pueden contener datos temporales o de prueba

**Cómo regenerar:**
```bash
cd statsPipeline
python 04_run_complete_pipeline.py
```

## ✅ Archivos que SÍ deben estar en el Repositorio

### Código Fuente
```
✅ backend/**/*.js              # Código del servidor
✅ frontend/src/**/*.js(x)      # Código de React
✅ statsPipeline/**/*.py        # Scripts de ETL
✅ fbr_api_project/**/*.py      # Scripts de API
```

### Configuración del Proyecto
```
✅ backend/package.json         # Dependencias de backend
✅ backend/package-lock.json    # Lock file para reproducibilidad
✅ frontend/package.json        # Dependencias de frontend
✅ frontend/package-lock.json   # Lock file para reproducibilidad
✅ statsPipeline/requirements.txt  # Dependencias de Python
```

### Scripts de Base de Datos
```
✅ backend/scripts/*.sql        # Scripts de schema y seeds
✅ statsPipeline/*.sql          # Scripts de migración
✅ ufc_analytics.sql            # Schema completo (64 KB - tamaño razonable)
```

### Documentación
```
✅ README.md                    # Documentación principal
✅ CLAUDE.md                    # Instrucciones para Claude Code
✅ DATABASE_INFO.md             # Información de BD
✅ DEPLOYMENT_GUIDE.md          # Guía de despliegue
✅ SECURITY_SETUP.md            # Guía de seguridad
✅ *.md                         # Toda la documentación
```

### Archivos Estáticos Necesarios
```
✅ frontend/public/logo*.png    # Logos de la aplicación
✅ frontend/public/favicon.ico  # Favicon
✅ frontend/public/manifest.json # PWA manifest
```

### Archivos de Configuración de Desarrollo
```
✅ .gitignore                   # Este archivo
✅ backend/.env.example         # Plantilla de configuración
✅ frontend/.env.example        # Plantilla de configuración
```

## ❌ Archivos Temporales que NO deben estar

### Screenshots de Ejemplo
```
❌ ejemploresultados.png        # Screenshot temporal
❌ gestionpartidos.png          # Screenshot temporal
```
**Recomendación:** Si necesitas screenshots en la documentación, crea una carpeta `docs/images/` y documenta qué screenshots son necesarios vs temporales.

### PDFs Temporales
```
⚠️  backend/Fixture-Liga-de-Primera-2026.pdf
```
**Decisión necesaria:**
- Si es documentación necesaria → Mover a `docs/` y versionarla
- Si es archivo temporal → Agregarlo a `.gitignore`

### Archivos de Sistema/IDE
```
❌ .DS_Store (macOS)
❌ Thumbs.db (Windows)
❌ .vscode/ (VSCode settings)
❌ .idea/ (IntelliJ/WebStorm)
```

## 📈 Impacto del .gitignore

### Espacio Ahorrado (Estimación)
```
node_modules/           ~500 MB
frontend/build/         ~3.2 MB
Archivos .log           ~5-10 MB
Archivos .csv           ~5-10 MB
__pycache__             ~2-5 MB
-----------------------------------------
TOTAL AHORRADO:         ~520-530 MB
```

### Tamaño del Repositorio Limpio
```
Código fuente (.js, .jsx, .py)     ~5-10 MB
package.json + package-lock.json   ~500 KB
Scripts SQL                        ~100 KB
Documentación (.md)                ~200 KB
Imágenes necesarias                ~50 KB
-----------------------------------------
TOTAL REPOSITORIO:                 ~6-11 MB
```

**Reducción:** De ~530 MB a ~10 MB = **98% de reducción**

## 🔍 Comandos de Verificación

### Verificar qué archivos están siendo ignorados
```bash
git status --ignored
```

### Verificar archivos específicos
```bash
git check-ignore -v backend/.env
git check-ignore -v fbr_api_project/api_key.json
git check-ignore -v frontend/build/
```

### Ver tamaño del repositorio actual
```bash
# Tamaño total del working directory
du -sh .

# Tamaño del repositorio git (sin archivos ignorados)
du -sh .git
```

### Limpiar archivos ignorados localmente
```bash
# ⚠️  CUIDADO: Esto elimina todos los archivos ignorados
git clean -Xfd

# Para ver qué se eliminaría (sin eliminar):
git clean -Xfdn
```

## 📝 Mantenimiento del .gitignore

### Cuando agregar nuevas reglas

1. **Nuevo tipo de archivo generado**
   ```bash
   # Si agregas un nuevo build system que genera archivos .map
   echo "*.map" >> .gitignore
   ```

2. **Nueva dependencia o herramienta**
   ```bash
   # Si agregas Docker
   echo "docker-compose.override.yml" >> .gitignore
   ```

3. **Nuevos archivos sensibles**
   ```bash
   # Si agregas OAuth
   echo "oauth_credentials.json" >> .gitignore
   ```

### Revisar periódicamente
- Archivos grandes en el repositorio: `git ls-files --long`
- Archivos sensibles accidentalmente commiteados
- Nuevos patrones de archivos temporales

## 🎯 Mejores Prácticas

### Antes de cada commit
```bash
# 1. Ver qué archivos vas a subir
git status

# 2. Ver el contenido exacto
git diff --cached

# 3. Verificar que no hay archivos sensibles
git diff --cached --name-only | grep -E "(\.env$|api_key|password|secret)"
```

### Al clonar el repositorio (para nuevos desarrolladores)
```bash
# 1. Clonar
git clone <repository-url>
cd ohiggins-stats

# 2. Configurar ambiente backend
cp backend/.env.example backend/.env
nano backend/.env  # Agregar credenciales

# 3. Configurar ambiente frontend
cp frontend/.env.example frontend/.env
nano frontend/.env  # Ajustar URL del API

# 4. Configurar API de FBRef
cp fbr_api_project/api_key.json.example fbr_api_project/api_key.json
nano fbr_api_project/api_key.json  # Agregar API key

# 5. Instalar dependencias
cd backend && npm install
cd ../frontend && npm install
cd ../statsPipeline && pip install -r requirements.txt
```

## 📚 Documentación Relacionada

- **SECURITY_SETUP.md**: Guía completa de seguridad
- **DEPLOYMENT_GUIDE.md**: Guía de despliegue
- **CLAUDE.md**: Instrucciones para desarrollo
- **.gitignore**: Archivo de configuración de Git

## 🔄 Historial de Cambios

- **2026-02-07**: Creación del .gitignore completo
  - Agregadas secciones de seguridad, dependencias, builds
  - Agregadas reglas para Python, Node.js, logs, CSV
  - Creados archivos .env.example y api_key.json.example

---

**Mantenedor:** Equipo O'Higgins Stats
**Última actualización:** 2026-02-07
