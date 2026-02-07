# Insignias de Equipos

Este directorio contiene las insignias/logos de los equipos de fútbol.

## Estructura

- **Ubicación**: `/frontend/public/images/equipos/`
- **Formato recomendado**: PNG o SVG
- **Tamaño recomendado**: 200x200 píxeles
- **Nomenclatura**: Nombre simple, sin espacios (ej: `ohiggins.png`, `cobreloa.png`)

## Imagen por defecto

`default-team.png` - Se usa automáticamente cuando un equipo no tiene insignia asignada.

## Cómo agregar una nueva insignia

### 1. Preparar la imagen

- Formato: PNG o SVG (preferiblemente PNG con fondo transparente)
- Dimensiones: 200x200 píxeles (o proporcional)
- Nombre: Sin espacios, minúsculas, guiones para separar palabras
  - ✅ Correcto: `ohiggins.png`, `colo-colo.png`, `universidad-de-chile.png`
  - ❌ Incorrecto: `O'Higgins.png`, `Colo Colo.png`, `U de Chile.png`

### 2. Subir la imagen

Copiar el archivo a este directorio:
```bash
cp mi-insignia.png /home/mpuga/projects/ohiggins-stats/frontend/public/images/equipos/
```

### 3. Actualizar base de datos

Ejecutar query SQL para asignar la imagen al equipo:

```sql
UPDATE DIM_EQUIPO
SET IMAGEN = 'nombre-archivo.png'
WHERE ID_EQUIPO = <id_del_equipo>;

-- Ejemplo:
UPDATE DIM_EQUIPO
SET IMAGEN = 'ohiggins.png'
WHERE NOMBRE = 'O''Higgins';
```

### 4. Verificar

La insignia aparecerá automáticamente en:
- Partidos disponibles para apostar
- Listado de partidos
- Detalles de equipos
- Cualquier lugar donde se muestre el equipo

## Comandos útiles

### Ver equipos y sus imágenes actuales:
```sql
SELECT ID_EQUIPO, NOMBRE, IMAGEN FROM DIM_EQUIPO ORDER BY NOMBRE;
```

### Listar equipos sin insignia:
```sql
SELECT ID_EQUIPO, NOMBRE FROM DIM_EQUIPO
WHERE IMAGEN IS NULL OR IMAGEN = 'default-team.png';
```

### Asignar imagen por defecto a todos los equipos:
```sql
UPDATE DIM_EQUIPO SET IMAGEN = 'default-team.png' WHERE IMAGEN IS NULL;
```

## Ejemplo completo

```bash
# 1. Descargar insignia de O'Higgins
wget https://example.com/ohiggins-logo.png -O ohiggins.png

# 2. Copiar a directorio
cp ohiggins.png /home/mpuga/projects/ohiggins-stats/frontend/public/images/equipos/

# 3. Actualizar base de datos
mysql -h 192.168.100.16 -u mpuga -p MP_DATA_DEV -e "UPDATE DIM_EQUIPO SET IMAGEN = 'ohiggins.png' WHERE NOMBRE = 'O''Higgins';"
```

## Notas técnicas

- El componente `TeamLogo` maneja automáticamente errores de carga
- Si una imagen falla al cargar, se usa `default-team.png`
- Las imágenes se sirven desde `/public/images/equipos/`
- No requiere reiniciar el servidor para ver cambios
- Formato de URL: `/images/equipos/nombre-archivo.png`
