# Sistema de Insignias de Equipos

## Resumen de cambios implementados

Se ha agregado soporte completo para mostrar insignias/logos de equipos en toda la aplicación.

---

## 📂 Archivos Creados

### Backend
- **`backend/scripts/03_add_team_images.sql`** - Script SQL para agregar campo IMAGEN a DIM_EQUIPO

### Frontend
- **`frontend/src/components/common/TeamLogo.js`** - Componente React para mostrar insignias
- **`frontend/src/components/common/TeamLogo.css`** - Estilos del componente TeamLogo
- **`frontend/public/images/equipos/`** - Directorio para almacenar imágenes
- **`frontend/public/images/equipos/default-team.png`** - Imagen SVG por defecto
- **`frontend/public/images/equipos/README.md`** - Documentación del directorio

---

## 🗄️ Cambios en Base de Datos

### Paso 1: Ejecutar script SQL

```bash
mysql -h 192.168.100.16 -u mpuga -p MP_DATA_DEV < backend/scripts/03_add_team_images.sql
```

Esto agregará el campo `IMAGEN VARCHAR(255) DEFAULT 'default-team.png'` a la tabla `DIM_EQUIPO`.

### Paso 2: Verificar

```sql
DESCRIBE DIM_EQUIPO;
SELECT ID_EQUIPO, NOMBRE, IMAGEN FROM DIM_EQUIPO LIMIT 10;
```

---

## 🎨 Componente TeamLogo

### Uso básico

```jsx
import TeamLogo from '../common/TeamLogo';

<TeamLogo
  imagen="ohiggins.png"
  nombreEquipo="O'Higgins"
  size="medium"
/>
```

### Tamaños disponibles
- `small` - 32x32px
- `medium` - 48x48px (por defecto)
- `large` - 64x64px
- `xlarge` - 96x96px

### Características
- ✅ Carga automática de imagen por defecto si falla
- ✅ Efecto hover con zoom
- ✅ Formato circular con sombra
- ✅ Alt text descriptivo para accesibilidad

---

## 📝 Archivos Modificados

### Backend
- **`backend/controllers/cuotasController.js`**
  - Líneas 141-146: Agregados campos `imagen_local` e `imagen_visita` en query de partidos

### Frontend
- **`frontend/src/components/apuestas/PartidosDisponibles.js`**
  - Línea 3: Import de componente TeamLogo
  - Líneas 260-280: Uso de TeamLogo en tarjetas de partidos

- **`frontend/src/components/apuestas/PartidosDisponibles.css`**
  - Líneas 168-189: Actualización de estilos para acomodar insignias

---

## 🖼️ Agregar Insignias de Equipos

### Método 1: Subir archivo PNG/SVG

```bash
# 1. Copiar imagen al directorio
cp mi-insignia.png frontend/public/images/equipos/nombre-equipo.png

# 2. Actualizar base de datos
mysql -h 192.168.100.16 -u mpuga -p MP_DATA_DEV -e "
UPDATE DIM_EQUIPO SET IMAGEN = 'nombre-equipo.png'
WHERE ID_EQUIPO = 1;"
```

### Método 2: Desde URL

```bash
# 1. Descargar desde URL
wget https://example.com/logo.png -O frontend/public/images/equipos/nombre-equipo.png

# 2. Actualizar base de datos (igual que método 1)
```

### Método 3: Asignación masiva

```sql
-- Ejemplo: Asignar insignias a múltiples equipos
UPDATE DIM_EQUIPO SET IMAGEN = 'ohiggins.png' WHERE NOMBRE LIKE '%O''Higgins%';
UPDATE DIM_EQUIPO SET IMAGEN = 'colo-colo.png' WHERE NOMBRE LIKE '%Colo Colo%';
UPDATE DIM_EQUIPO SET IMAGEN = 'u-chile.png' WHERE NOMBRE LIKE '%Universidad de Chile%';
```

---

## 🎯 Dónde se Muestran las Insignias

Las insignias aparecen automáticamente en:

1. **Partidos Disponibles para Apostar**
   - Tarjetas de partidos
   - Junto al nombre de cada equipo
   - Tamaño: `large` (64x64px)

2. **Mis Apuestas** (futuro)
   - Listado de apuestas del usuario
   - Tamaño: `small` (32x32px)

3. **Gestión de Equipos** (futuro)
   - Listado de equipos en admin
   - Formularios de edición
   - Tamaño: `medium` (48x48px)

---

## 🔧 Solución de Problemas

### La insignia no se muestra

**Problema**: Se muestra la imagen por defecto en lugar de la insignia del equipo.

**Solución**:
1. Verificar que el archivo existe en `frontend/public/images/equipos/`
2. Verificar que el nombre del archivo coincide exactamente con el campo IMAGEN en la BD
3. Verificar permisos del archivo (debe ser legible)
4. Verificar la consola del navegador para errores 404

```bash
# Verificar que el archivo existe
ls -la frontend/public/images/equipos/

# Verificar base de datos
mysql -h 192.168.100.16 -u mpuga -p MP_DATA_DEV -e "
SELECT NOMBRE, IMAGEN FROM DIM_EQUIPO WHERE IMAGEN != 'default-team.png';"
```

### Formato de imagen incorrecto

**Problema**: La imagen se ve pixelada o deformada.

**Solución**:
- Usar formato PNG con fondo transparente
- Dimensiones recomendadas: 200x200px
- Ratio 1:1 (cuadrado)
- Máximo 100KB por archivo

### Cache del navegador

**Problema**: Los cambios no se reflejan después de actualizar la imagen.

**Solución**:
1. Limpiar cache del navegador (Ctrl+Shift+R)
2. Renombrar el archivo si es necesario
3. Verificar que el servidor de desarrollo esté corriendo

---

## 📊 Verificación Final

### Checklist

- [ ] Script SQL ejecutado correctamente
- [ ] Campo IMAGEN agregado a DIM_EQUIPO
- [ ] Directorio `/frontend/public/images/equipos/` creado
- [ ] Imagen `default-team.png` presente
- [ ] Componente TeamLogo funciona correctamente
- [ ] Insignias se muestran en partidos disponibles
- [ ] Fallback a imagen por defecto funciona

### Comando de verificación rápida

```bash
# Verificar estructura de archivos
ls -la frontend/public/images/equipos/
ls -la frontend/src/components/common/TeamLogo*

# Verificar base de datos
mysql -h 192.168.100.16 -u mpuga -p MP_DATA_DEV -e "
SELECT COUNT(*) as total_equipos,
       COUNT(IMAGEN) as con_imagen,
       SUM(CASE WHEN IMAGEN = 'default-team.png' THEN 1 ELSE 0 END) as con_default
FROM DIM_EQUIPO;"
```

---

## 🎓 Próximos Pasos

1. **Agregar insignias reales**
   - Descargar logos oficiales de equipos
   - Optimizar imágenes (tamaño y calidad)
   - Actualizar base de datos

2. **Extender uso**
   - Agregar TeamLogo en componente MisApuestas
   - Agregar en TablaPosiciones
   - Agregar en gestión de equipos (admin)

3. **Optimizaciones**
   - Implementar lazy loading para imágenes
   - Agregar opción de upload de insignias desde admin
   - Crear API endpoint para gestionar imágenes

---

## 📚 Referencias

- Componente: `frontend/src/components/common/TeamLogo.js`
- Estilos: `frontend/src/components/common/TeamLogo.css`
- Directorio imágenes: `frontend/public/images/equipos/`
- Script SQL: `backend/scripts/03_add_team_images.sql`
- Documentación: `frontend/public/images/equipos/README.md`
