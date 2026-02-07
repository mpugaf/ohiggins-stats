# Guía de Configuración de Seguridad

## 🔴 ANTES DE HACER PUSH A GITHUB

**VERIFICACIÓN OBLIGATORIA**: Asegúrate de que los siguientes archivos sensibles NO están en staging:

```bash
# Verificar que archivos sensibles están ignorados
git status --ignored | grep -E "(api_key|\.env)"

# Verificar que no hay archivos sensibles en staging
git status | grep -E "(api_key|\.env)"
```

Si encuentras archivos sensibles en staging, **NO HAGAS PUSH** y sigue los pasos de limpieza abajo.

## 🔒 Archivos Sensibles que NUNCA deben subirse

### 1. Credenciales de Base de Datos
- `backend/.env` - Contiene DB_PASSWORD y JWT_SECRET
- `frontend/.env` - Contiene URLs de API (puede tener tokens en producción)

**Configuración correcta:**
```bash
# 1. Copiar plantilla
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 2. Editar y agregar tus credenciales reales
nano backend/.env  # Cambiar DB_PASSWORD y JWT_SECRET
nano frontend/.env # Verificar REACT_APP_API_URL
```

### 2. API Keys de FBRef
- `fbr_api_project/api_key.json` - Clave de API de Football Reference

**Configuración correcta:**
```bash
# 1. Copiar plantilla
cp fbr_api_project/api_key.json.example fbr_api_project/api_key.json

# 2. Editar y agregar tu API key real
nano fbr_api_project/api_key.json
# Agregar tu clave de FBRef API
```

**Cómo obtener una API Key de FBRef:**
1. Visitar https://www.football-reference.com/api/
2. Registrarse y solicitar acceso
3. Copiar la API key generada

### 3. Archivos de Log
- `backend/backend.log`
- `fbr_api_project/logs/*.log`
- `statsPipeline/*.log`

**Estos archivos se regeneran automáticamente** en cada ejecución y no deben versionarse.

## 📋 Checklist de Seguridad para Nuevos Desarrolladores

Antes de comenzar a trabajar en el proyecto:

- [ ] Copiar `backend/.env.example` a `backend/.env`
- [ ] Configurar credenciales de base de datos en `backend/.env`
- [ ] Generar JWT_SECRET aleatorio (mínimo 32 caracteres)
- [ ] Copiar `frontend/.env.example` a `frontend/.env`
- [ ] Verificar URL del backend en `frontend/.env`
- [ ] Copiar `fbr_api_project/api_key.json.example` a `fbr_api_project/api_key.json`
- [ ] Agregar tu API key de FBRef
- [ ] Verificar que `.gitignore` está actualizado
- [ ] Ejecutar `git status --ignored` para confirmar que archivos sensibles están ignorados

## 🧹 Limpieza si Accidentalmente Añadiste Archivos Sensibles

### Si los archivos están en staging pero NO has hecho push:

```bash
# Remover del staging (mantiene el archivo local)
git reset HEAD backend/.env
git reset HEAD frontend/.env
git reset HEAD fbr_api_project/api_key.json

# Verificar que están ignorados ahora
git status
```

### Si YA hiciste push con archivos sensibles:

**⚠️ ACCIÓN INMEDIATA REQUERIDA:**

1. **Revocar credenciales comprometidas INMEDIATAMENTE:**
   - Cambiar contraseña de base de datos
   - Regenerar JWT_SECRET
   - Regenerar API key de FBRef

2. **Limpiar historial de Git:**
   ```bash
   # ADVERTENCIA: Esto reescribe el historial y requiere force push
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch backend/.env frontend/.env fbr_api_project/api_key.json" \
     --prune-empty --tag-name-filter cat -- --all

   # Limpiar referencias
   git for-each-ref --format="delete %(refname)" refs/original | git update-ref --stdin
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive

   # Force push (coordinar con el equipo)
   git push origin --force --all
   ```

3. **Alternativa más segura (recomendada):**
   - Crear un nuevo repositorio desde cero
   - Copiar el código limpio (sin archivos sensibles)
   - Migrar el equipo al nuevo repositorio

## 🔐 Generación de JWT_SECRET Seguro

```bash
# En Linux/Mac:
openssl rand -base64 32

# En Node.js:
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# En Python:
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

Copiar el resultado en `backend/.env`:
```env
JWT_SECRET=tu_clave_generada_aqui
```

## 📊 Archivos que SÍ deben versionarse

Estos archivos son seguros y necesarios en el repositorio:

### Configuración
- ✅ `backend/.env.example` - Plantilla sin credenciales reales
- ✅ `frontend/.env.example` - Plantilla sin credenciales reales
- ✅ `fbr_api_project/api_key.json.example` - Plantilla sin API key real
- ✅ `package.json` (backend y frontend)
- ✅ `requirements.txt` (Python)

### Código Fuente
- ✅ Todos los archivos `.js`, `.jsx`, `.py`
- ✅ Archivos de configuración del proyecto
- ✅ Scripts SQL de schema (`backend/scripts/*.sql`)

### Documentación
- ✅ Todos los archivos `.md`
- ✅ `CLAUDE.md` (instrucciones para Claude Code)
- ✅ README, guías, documentación técnica

### Archivos Estáticos
- ✅ `frontend/public/` (logos, favicon, manifest.json)
- ✅ Assets necesarios para la aplicación

## 🚫 Archivos que NUNCA deben versionarse

### Credenciales
- ❌ `.env`, `.env.local`, `.env.production`
- ❌ `api_key.json`
- ❌ Cualquier archivo con contraseñas o tokens

### Dependencias
- ❌ `node_modules/` (se instala con `npm install`)
- ❌ `__pycache__/`, `*.pyc` (se genera al ejecutar Python)

### Archivos Generados
- ❌ `frontend/build/` (se genera con `npm run build`)
- ❌ Archivos `.log`
- ❌ Archivos `.csv` generados por pipelines

### Temporales
- ❌ Screenshots de ejemplo (`ejemploresultados.png`, etc.)
- ❌ Archivos con timestamps en el nombre
- ❌ Carpetas de coverage de tests

## 🔍 Verificación Final antes de Push

```bash
# 1. Ver qué archivos van a subirse
git status

# 2. Ver archivos ignorados (verificar que incluye .env, api_key.json, etc.)
git status --ignored

# 3. Verificar que archivos sensibles específicos están ignorados
git check-ignore -v backend/.env frontend/.env fbr_api_project/api_key.json

# 4. Ver el diff completo de lo que vas a subir
git diff --cached

# 5. Si todo se ve bien, hacer commit y push
git add .
git commit -m "Your commit message"
git push origin main
```

## 📞 Contacto en Caso de Incidente de Seguridad

Si accidentalmente expusiste credenciales:

1. **NO ENTRAR EN PÁNICO** - es solucionable
2. Seguir los pasos de "Limpieza" arriba
3. Revocar/cambiar credenciales comprometidas INMEDIATAMENTE
4. Notificar al equipo si es un repositorio compartido
5. Considerar rotar todas las credenciales del proyecto

## 🎓 Buenas Prácticas Adicionales

### Durante el Desarrollo
- Nunca hardcodear credenciales en el código
- Usar siempre variables de entorno para configuración sensible
- Revisar `git diff` antes de cada commit
- Usar `git add <archivo>` específico en lugar de `git add .` cuando agregues archivos nuevos

### En Producción
- Usar variables de entorno del sistema o servicios como AWS Secrets Manager
- Rotar credenciales regularmente
- Implementar logging que NO registre información sensible
- Usar HTTPS para todas las comunicaciones

### Para el Equipo
- Documentar todas las variables de entorno necesarias en `.env.example`
- Mantener `.gitignore` actualizado cuando se agreguen nuevos tipos de archivos
- Hacer code reviews que incluyan verificación de seguridad
- Automatizar verificaciones de seguridad con pre-commit hooks

## 🛡️ Configuración de Git Hooks (Opcional pero Recomendado)

Crear un pre-commit hook para prevenir commits accidentales de archivos sensibles:

```bash
# Crear archivo .git/hooks/pre-commit
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash

# Lista de archivos sensibles que no deben committearse
SENSITIVE_FILES=("backend/.env" "frontend/.env" "fbr_api_project/api_key.json")

for file in "${SENSITIVE_FILES[@]}"; do
  if git diff --cached --name-only | grep -q "^$file$"; then
    echo "❌ ERROR: Intentaste commitear un archivo sensible: $file"
    echo "Este archivo contiene credenciales y NO debe subirse a GitHub"
    echo "Ejecuta: git reset HEAD $file"
    exit 1
  fi
done

# Verificar que no hay claves API hardcodeadas en código
if git diff --cached | grep -iE "(api_key|password|secret|token)\s*=\s*['\"][^'\"]+['\"]"; then
  echo "⚠️  ADVERTENCIA: Posible credencial hardcodeada detectada en el código"
  echo "Revisa los cambios y asegúrate de usar variables de entorno"
  read -p "¿Continuar de todas formas? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

exit 0
EOF

# Hacer el hook ejecutable
chmod +x .git/hooks/pre-commit
```

Este hook:
- Previene commits de `.env` y `api_key.json`
- Advierte si detecta credenciales hardcodeadas en el código
- Da la opción de cancelar el commit antes de que sea tarde

---

**Última actualización:** 2026-02-07
**Mantenedor:** Equipo O'Higgins Stats
