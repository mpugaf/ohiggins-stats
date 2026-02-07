# Información de Base de Datos - O'Higgins Stats

## Tabla de Usuarios

### Nombre de la Tabla
```sql
usuarios
```

### Esquema de la Tabla

```sql
CREATE TABLE IF NOT EXISTS usuarios (
  id_usuario INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nombre_completo VARCHAR(100),
  role ENUM('admin', 'usuario') DEFAULT 'usuario',
  puede_apostar TINYINT(1) DEFAULT 1,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ultimo_acceso TIMESTAMP NULL,
  activo TINYINT(1) DEFAULT 1,
  INDEX idx_username (username),
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Campos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id_usuario` | INT | ID único del usuario (autoincremental) |
| `username` | VARCHAR(50) | Nombre de usuario (único) |
| `email` | VARCHAR(100) | Correo electrónico (único) |
| `password_hash` | VARCHAR(255) | Hash de la contraseña (bcrypt) |
| `nombre_completo` | VARCHAR(100) | Nombre completo del usuario (opcional) |
| `role` | ENUM | Rol del usuario: 'admin' o 'usuario' |
| `puede_apostar` | TINYINT(1) | Indica si el usuario puede hacer apuestas (1=sí, 0=no) |
| `fecha_creacion` | TIMESTAMP | Fecha de creación de la cuenta |
| `ultimo_acceso` | TIMESTAMP | Fecha del último acceso |
| `activo` | TINYINT(1) | Estado de la cuenta (1=activa, 0=inactiva) |

### Roles de Usuario

- **admin**: Administrador con acceso completo
  - Puede crear/editar/eliminar estadios, equipos, jugadores
  - Puede liquidar apuestas
  - Puede gestionar cuotas

- **usuario**: Usuario regular
  - Puede ver torneos y partidos
  - Puede realizar apuestas
  - Puede ver sus estadísticas

### Consultas Útiles

#### Ver todos los usuarios
```sql
SELECT id_usuario, username, email, nombre_completo, role, activo
FROM usuarios;
```

#### Ver usuarios administradores
```sql
SELECT id_usuario, username, email, nombre_completo
FROM usuarios
WHERE role = 'admin';
```

#### Verificar si un usuario existe
```sql
SELECT id_usuario, username, email
FROM usuarios
WHERE username = 'nombre_usuario' OR email = 'correo@ejemplo.com';
```

#### Ver estadísticas de un usuario
```sql
SELECT * FROM v_resumen_usuarios WHERE id_usuario = 1;
```

### Creación de Usuario Administrador

Para crear un usuario administrador manualmente, ejecuta el script:

```bash
mysql -u mpuga -p MP_DATA_DEV < backend/scripts/02_seed_admin_user.sql
```

O ejecuta directamente:
```sql
INSERT INTO usuarios (username, email, password_hash, nombre_completo, role, puede_apostar)
VALUES ('admin', 'admin@ohiggins.com', '[hash_bcrypt_aquí]', 'Administrador', 'admin', 1);
```

**Nota**: El password debe ser hasheado con bcrypt. El script de seed incluye un usuario admin con password hasheado.

### Seguridad

- Las contraseñas se almacenan hasheadas con bcrypt (10 rounds)
- Username y email deben ser únicos
- El campo `activo` permite deshabilitar cuentas sin eliminarlas
- Los tokens JWT se generan en el backend para autenticación

### Endpoints del Backend

- `POST /api/auth/register` - Registrar nuevo usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/profile` - Obtener perfil del usuario autenticado (requiere token)

### Vista de Resumen

Existe una vista SQL `v_resumen_usuarios` que proporciona estadísticas completas:

```sql
SELECT * FROM v_resumen_usuarios;
```

Esta vista incluye:
- Información básica del usuario
- Total de apuestas realizadas
- Apuestas ganadas/perdidas/pendientes
- Total de puntos acumulados
- Porcentaje de aciertos
- Fechas de creación y último acceso
