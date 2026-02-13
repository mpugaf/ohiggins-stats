# Limpieza del Repositorio O'Higgins Stats

## ✅ Cambios Aplicados al .gitignore

Se han actualizado las reglas del `.gitignore` para excluir:

### 1. Archivos SQL de Diagnóstico/Temporales
- `consulta_*.sql` - Queries de diagnóstico
- `diagnostico_*.sql` - Scripts de diagnóstico
- `verificar_*.sql` - Scripts de verificación
- `corregir_*.sql` - Scripts de corrección
- `prueba_*.sql` - Scripts de prueba
- `agregar_*.sql` - Scripts temporales de agregación
- `asignar_*.sql` - Scripts temporales de asignación

**Nota:** Los archivos en `backend/scripts/` SÍ se versionan porque son migraciones de schema oficiales.

### 2. Documentación Temporal
- `CAMBIOS_*.md`
- `CONFIRMACION_*.md`
- `CORRECCIONES_*.md`
- `DIAGNOSTICO_*.md`
- `IMPLEMENTACION_*.md`
- `INSTRUCCIONES_*.md`
- `SISTEMA_*.md`
- `SOLUCION_*.md`
- `SUGERENCIAS_*.md`

### 3. Imágenes Temporales
- `botonesmorados.png`
- `tablapartidos.png`
- `*.screenshot.png`
- `*.temp.png`
- `*.debug.png`

### 4. Datos Temporales de API
- `fbr_api_project/match_data/` - Datos JSON/CSV generados por API

## 🗑️ Archivos que Pueden Eliminarse del Historial de Git

Los siguientes archivos ya están en el repositorio pero no deberían estarlo:

### Datos de API (540KB aproximadamente)
```bash
fbr_api_project/match_data/*/
```
**Acción:** Eliminar del historial de git con `git rm -r --cached`

### Fixture PDF (120KB)
```bash
backend/Fixture-Liga-de-Primera-2026.pdf
```
**Acción:** Mover a `/docs/references/` o eliminar si es temporal

## 📦 Archivos Nuevos que SÍ Deben Commitearse

Los siguientes archivos son código fuente nuevo y DEBEN agregarse al repositorio:

### Backend
- `backend/controllers/mensajesGanadoresController.js`
- `backend/controllers/tokensInvitacionController.js`
- `backend/routes/mensajesGanadores.js`
- `backend/routes/tokensInvitacion.js`
- `backend/scripts/03_make_email_optional.sql`
- `backend/scripts/04_add_tournament_phases_support.sql`
- `backend/scripts/05_create_invitation_tokens.sql`
- `backend/scripts/06_add_bahia_players.sql`
- `backend/scripts/07_add_activo_index_usuarios.sql`
- `backend/scripts/08_create_mensajes_ganadores_jornada.sql`

### Frontend
- `frontend/src/components/ClonarAsignaciones.{js,css}`
- `frontend/src/components/PartidosManagerPlus.{js,css}`
- `frontend/src/components/admin/GestionTokens.{js,css}`
- `frontend/src/components/admin/LimpiarResultados.{js,css}`
- `frontend/src/components/apuestas/MensajesGanadores.css`
- `frontend/src/components/apuestas/PartidosHistoricosNew.js`
- `frontend/src/components/apuestas/PartidosHistoricosPlus.{js,css}`
- `frontend/src/components/common/ChangePasswordModal.{js,css}`
- `frontend/public/images/equipos/bahia.png`
- `frontend/public/images/site/` (directorio completo)

## 🧹 Comandos de Limpieza

### 1. Eliminar archivos temporales de git (pero mantenerlos localmente)
```bash
cd /home/mpuga/projects/ohiggins-stats

# Eliminar datos de API del historial
git rm -r --cached fbr_api_project/match_data/

# Si decides no versionar el PDF:
# git rm --cached backend/Fixture-Liga-de-Primera-2026.pdf
```

### 2. Agregar archivos nuevos al staging
```bash
# Backend
git add backend/controllers/mensajesGanadoresController.js
git add backend/controllers/tokensInvitacionController.js
git add backend/routes/mensajesGanadores.js
git add backend/routes/tokensInvitacion.js
git add backend/scripts/03_make_email_optional.sql
git add backend/scripts/04_add_tournament_phases_support.sql
git add backend/scripts/05_create_invitation_tokens.sql
git add backend/scripts/06_add_bahia_players.sql
git add backend/scripts/07_add_activo_index_usuarios.sql
git add backend/scripts/08_create_mensajes_ganadores_jornada.sql

# Frontend
git add frontend/src/components/ClonarAsignaciones.*
git add frontend/src/components/PartidosManagerPlus.*
git add frontend/src/components/admin/GestionTokens.*
git add frontend/src/components/admin/LimpiarResultados.*
git add frontend/src/components/apuestas/MensajesGanadores.css
git add frontend/src/components/apuestas/PartidosHistoricosNew.js
git add frontend/src/components/apuestas/PartidosHistoricosPlus.*
git add frontend/src/components/common/ChangePasswordModal.*
git add frontend/public/images/equipos/bahia.png
git add frontend/public/images/site/

# Gitignore actualizado
git add .gitignore
```

### 3. Commit de cambios
```bash
git commit -m "chore: Limpieza de repositorio y nuevas features

- Actualiza .gitignore para excluir archivos temporales
- Elimina datos de API del historial
- Agrega nuevas features: mensajes ganadores, tokens invitación, clonación
- Agrega scripts de migración de schema
- Agrega componentes de UI nuevos"
```

## 📊 Resumen de Tamaño

**Antes de limpieza:**
- Archivos temporales SQL: ~50 archivos (~200KB)
- Datos JSON de API: ~540KB
- Imágenes temporales: ~50KB

**Total estimado a excluir:** ~790KB

**Archivos a agregar (código fuente nuevo):**
- Backend: ~80KB
- Frontend: ~120KB
- Imágenes necesarias: ~100KB

**Total código nuevo:** ~300KB

## 🎯 Resultado Final

El repositorio quedará con:
- ✅ Solo código fuente necesario
- ✅ Scripts de migración de schema versionados
- ✅ Recursos estáticos necesarios (imágenes de equipos)
- ✅ Archivos de configuración ejemplo (.env.example)
- ✅ Documentación permanente (README.md, CLAUDE.md)
- ❌ Sin archivos SQL de diagnóstico temporal
- ❌ Sin datos de API temporal
- ❌ Sin documentación de implementación temporal
- ❌ Sin imágenes de debug

## 📝 Notas Importantes

1. **Scripts SQL:** Solo los archivos en `backend/scripts/` se versionan (migraciones oficiales)
2. **Archivos .env:** NUNCA deben subirse. Usar `.env.example` como plantilla
3. **node_modules:** Siempre ignorados, se regeneran con `npm install`
4. **Datos de API:** Se regeneran ejecutando los scripts de pipeline
5. **Builds:** `frontend/build/` se genera en deployment, no se versiona
