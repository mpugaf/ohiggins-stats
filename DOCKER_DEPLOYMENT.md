# Guía de Deployment con Docker - O'Higgins Stats

## 📋 Índice

1. [Requisitos Previos](#requisitos-previos)
2. [Arquitectura Docker](#arquitectura-docker)
3. [Configuración Inicial](#configuración-inicial)
4. [Deployment Local](#deployment-local)
5. [Deployment en Producción](#deployment-en-producción)
6. [Comandos Útiles](#comandos-útiles)
7. [Troubleshooting](#troubleshooting)
8. [Optimizaciones](#optimizaciones)

---

## 📦 Requisitos Previos

### Software Necesario

- **Docker**: versión 20.10 o superior
- **Docker Compose**: versión 2.0 o superior

### Verificar instalación

```bash
docker --version
docker-compose --version
```

### Instalar Docker (Ubuntu/Debian)

```bash
# Actualizar paquetes
sudo apt-get update

# Instalar dependencias
sudo apt-get install -y ca-certificates curl gnupg lsb-release

# Agregar repositorio de Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Agregar usuario al grupo docker (para ejecutar sin sudo)
sudo usermod -aG docker $USER

# Reiniciar sesión para aplicar cambios
newgrp docker
```

---

## 🏗️ Arquitectura Docker

### Servicios

La aplicación se compone de 3 servicios Docker:

```
┌─────────────────────────────────────────────────┐
│  NGINX (Frontend)                               │
│  Puerto: 80                                     │
│  - React build estático                         │
│  - Compresión gzip                              │
│  - Cache de assets                              │
└─────────────────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────┐
│  Node.js (Backend)                              │
│  Puerto: 3000                                   │
│  - Express API                                  │
│  - JWT Auth                                     │
│  - Business Logic                               │
└─────────────────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────┐
│  MySQL 8.0 (Database)                           │
│  Puerto: 3306                                   │
│  - Datos persistentes                           │
│  - Scripts de inicialización                    │
└─────────────────────────────────────────────────┘
```

### Volúmenes Persistentes

- **mysql_data**: Datos de la base de datos (persistente)
- **logs**: Logs de la aplicación (opcional)

### Red

- **ohiggins-stats-network**: Red bridge interna para comunicación entre contenedores

---

## ⚙️ Configuración Inicial

### 1. Clonar el repositorio

```bash
git clone <repository-url> ohiggins-stats
cd ohiggins-stats
```

### 2. Configurar variables de entorno

```bash
# Copiar archivo de ejemplo
cp .env.docker.example .env.docker

# Editar configuración
nano .env.docker
```

**Valores mínimos a configurar:**

```env
# Seguridad - CAMBIAR EN PRODUCCIÓN
DB_ROOT_PASSWORD=tu_password_root_seguro_aqui
DB_PASSWORD=tu_password_usuario_seguro_aqui
JWT_SECRET=tu_secreto_jwt_minimo_32_caracteres_aqui

# Base de datos
DB_NAME=MP_DATA_DEV
DB_USER=mpuga

# Puertos (cambiar si están ocupados)
DB_PORT=3306
BACKEND_PORT=3000
FRONTEND_PORT=80

# URL del backend (accesible desde el navegador del usuario)
REACT_APP_API_URL=http://localhost:3000  # Cambiar en producción
```

### 3. Preparar scripts de base de datos

Los scripts SQL en `backend/scripts/` se ejecutarán automáticamente en orden alfabético al crear el contenedor de base de datos por primera vez.

**Verificar que existan:**
```bash
ls -1 backend/scripts/*.sql
```

---

## 🚀 Deployment Local

### Opción 1: Build y Start (Recomendado)

```bash
# Build de imágenes
docker-compose --env-file .env.docker build

# Iniciar servicios
docker-compose --env-file .env.docker up -d

# Ver logs
docker-compose --env-file .env.docker logs -f
```

### Opción 2: Build y Start en un solo comando

```bash
docker-compose --env-file .env.docker up -d --build
```

### Verificar servicios

```bash
# Estado de contenedores
docker-compose --env-file .env.docker ps

# Logs de todos los servicios
docker-compose --env-file .env.docker logs

# Logs de un servicio específico
docker-compose --env-file .env.docker logs backend
docker-compose --env-file .env.docker logs frontend
docker-compose --env-file .env.docker logs database
```

### Acceder a la aplicación

- **Frontend**: http://localhost
- **Backend API**: http://localhost:3000/api/health
- **Base de datos**: localhost:3306

### Detener servicios

```bash
# Detener (mantiene volúmenes y datos)
docker-compose --env-file .env.docker down

# Detener y eliminar volúmenes (BORRA DATOS)
docker-compose --env-file .env.docker down -v
```

---

## 🌐 Deployment en Producción

### 1. Servidor con dominio

**Requisitos:**
- Servidor con IP pública
- Dominio apuntando al servidor (ej: `ohiggins-stats.com`)
- Puertos 80 y 443 abiertos

### 2. Configurar variables de producción

```env
# .env.docker
NODE_ENV=production

# URLs de producción
REACT_APP_API_URL=https://api.ohiggins-stats.com

# Contraseñas fuertes
DB_ROOT_PASSWORD=<generar_password_fuerte_64_chars>
DB_PASSWORD=<generar_password_fuerte_64_chars>
JWT_SECRET=<generar_secreto_64_chars>
```

### 3. Configurar HTTPS con Let's Encrypt

**Agregar servicio de proxy reverso con SSL:**

Crear `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  # ... servicios existentes ...

  # Nginx Proxy Manager (para SSL)
  nginx-proxy:
    image: jc21/nginx-proxy-manager:latest
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
      - "81:81"  # Panel de administración
    volumes:
      - nginx-proxy-data:/data
      - nginx-letsencrypt:/etc/letsencrypt
    networks:
      - ohiggins-network

volumes:
  nginx-proxy-data:
  nginx-letsencrypt:
```

**Iniciar:**

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.docker up -d
```

**Configurar certificados:**
1. Acceder a `http://<IP-SERVIDOR>:81`
2. Login: `admin@example.com` / `changeme`
3. Cambiar credenciales
4. Agregar Proxy Host:
   - Domain: `ohiggins-stats.com`
   - Forward to: `frontend:80`
   - SSL: Request Let's Encrypt certificate

### 4. Backups automáticos

Crear script `backup.sh`:

```bash
#!/bin/bash

# Configuración
BACKUP_DIR="/backups/ohiggins-stats"
DATE=$(date +%Y%m%d_%H%M%S)
CONTAINER="ohiggins-stats-db"

# Crear directorio
mkdir -p "$BACKUP_DIR"

# Backup de base de datos
docker exec $CONTAINER mysqldump \
  -u root \
  -p${DB_ROOT_PASSWORD} \
  ${DB_NAME} \
  | gzip > "$BACKUP_DIR/db_backup_$DATE.sql.gz"

# Limpiar backups antiguos (mantener últimos 7 días)
find "$BACKUP_DIR" -name "db_backup_*.sql.gz" -mtime +7 -delete

echo "Backup completado: db_backup_$DATE.sql.gz"
```

**Agregar a crontab:**

```bash
# Backup diario a las 2 AM
0 2 * * * /path/to/backup.sh >> /var/log/ohiggins-backup.log 2>&1
```

---

## 🛠️ Comandos Útiles

### Gestión de contenedores

```bash
# Ver logs en tiempo real
docker-compose --env-file .env.docker logs -f [servicio]

# Reiniciar un servicio
docker-compose --env-file .env.docker restart backend

# Entrar a un contenedor
docker exec -it ohiggins-stats-backend sh
docker exec -it ohiggins-stats-db mysql -u root -p

# Ver estadísticas de recursos
docker stats
```

### Gestión de base de datos

```bash
# Conectar a MySQL
docker exec -it ohiggins-stats-db mysql -u root -p

# Ejecutar script SQL
docker exec -i ohiggins-stats-db mysql -u root -p${DB_ROOT_PASSWORD} ${DB_NAME} < script.sql

# Exportar base de datos
docker exec ohiggins-stats-db mysqldump -u root -p${DB_ROOT_PASSWORD} ${DB_NAME} > backup.sql

# Importar base de datos
docker exec -i ohiggins-stats-db mysql -u root -p${DB_ROOT_PASSWORD} ${DB_NAME} < backup.sql
```

### Limpieza

```bash
# Eliminar contenedores detenidos
docker container prune

# Eliminar imágenes no usadas
docker image prune -a

# Eliminar volúmenes no usados
docker volume prune

# Limpieza completa del sistema Docker
docker system prune -a --volumes
```

---

## 🔧 Troubleshooting

### Error: "Cannot connect to database"

**Síntomas:**
```
Error: connect ECONNREFUSED database:3306
```

**Solución:**
1. Verificar que la base de datos esté corriendo:
   ```bash
   docker-compose --env-file .env.docker ps database
   ```

2. Ver logs de la base de datos:
   ```bash
   docker-compose --env-file .env.docker logs database
   ```

3. Esperar a que la DB esté healthy:
   ```bash
   docker-compose --env-file .env.docker ps
   # La columna Status debe mostrar "healthy"
   ```

### Error: "Port already in use"

**Síntomas:**
```
Error: bind: address already in use
```

**Solución:**
1. Cambiar puertos en `.env.docker`:
   ```env
   FRONTEND_PORT=8080
   BACKEND_PORT=3001
   DB_PORT=3307
   ```

2. O liberar el puerto ocupado:
   ```bash
   # Encontrar proceso usando el puerto
   sudo lsof -i :3000

   # Matar proceso
   sudo kill -9 <PID>
   ```

### Frontend no puede conectar al backend

**Síntomas:**
- Frontend carga pero falla al hacer requests al backend
- Error 401/403 en API calls

**Solución:**
1. Verificar `REACT_APP_API_URL` en `.env.docker`
2. Debe ser la URL **accesible desde el navegador del cliente**
3. En producción: usar dominio público
   ```env
   REACT_APP_API_URL=https://api.tudominio.com
   ```

### Problemas de permisos

**Síntomas:**
```
Permission denied
```

**Solución:**
```bash
# Dar permisos al usuario de Docker
sudo chown -R $USER:$USER /home/mpuga/projects/ohiggins-stats

# Verificar permisos de scripts
chmod +x frontend/docker-entrypoint.sh
```

### Base de datos no se inicializa

**Síntomas:**
- Tablas no existen
- Scripts SQL no se ejecutaron

**Solución:**
1. Los scripts solo se ejecutan en la **primera creación** del volumen
2. Para reinicializar:
   ```bash
   # ADVERTENCIA: Esto BORRA TODOS LOS DATOS
   docker-compose --env-file .env.docker down -v
   docker-compose --env-file .env.docker up -d
   ```

---

## ⚡ Optimizaciones

### 1. Multi-stage Build

Los Dockerfiles ya usan multi-stage builds para:
- **Backend**: Separar dependencias de producción
- **Frontend**: Build de React separado del servidor Nginx

### 2. Caché de Layers

Optimizar orden de COPY para aprovechar caché:

```dockerfile
# ✅ CORRECTO
COPY package*.json ./
RUN npm install
COPY . .

# ❌ INCORRECTO
COPY . .
RUN npm install
```

### 3. Tamaño de Imágenes

**Imágenes actuales:**
- Backend: ~150MB (node:18-alpine)
- Frontend: ~25MB (nginx:alpine)
- Total: ~175MB

**Optimizaciones adicionales:**
- Usar `.dockerignore` (ya implementado)
- Comprimir assets estáticos (ya en nginx.conf)
- Minimizar dependencias de producción

### 4. Health Checks

Todos los servicios tienen health checks configurados:
- Database: `mysqladmin ping`
- Backend: `GET /api/health`
- Frontend: `GET /health`

### 5. Logging

Configurar log rotation:

```yaml
# docker-compose.yml
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### 6. Recursos limitados

Limitar CPU y memoria:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          memory: 256M
```

---

## 📊 Monitoreo

### Docker Stats

```bash
# Ver uso de recursos en tiempo real
docker stats
```

### Logs centralizados

Usar herramientas como:
- **Portainer**: UI para gestionar Docker
- **Grafana + Prometheus**: Métricas y alertas
- **ELK Stack**: Logs centralizados

---

## 🔐 Seguridad

### Checklist de Seguridad

- [ ] Cambiar passwords por defecto
- [ ] JWT_SECRET fuerte (64+ caracteres)
- [ ] Usar HTTPS en producción
- [ ] No exponer puerto 3306 (MySQL) públicamente
- [ ] Actualizar imágenes regularmente
- [ ] Usar secrets de Docker Swarm en producción
- [ ] Configurar firewall (UFW/iptables)
- [ ] Backups automáticos configurados
- [ ] Logs de auditoría habilitados

---

## 📚 Referencias

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [MySQL Docker Image](https://hub.docker.com/_/mysql)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)
- [Nginx Docker Image](https://hub.docker.com/_/nginx)

---

## 🆘 Soporte

Para problemas o preguntas:
1. Revisar esta documentación
2. Verificar logs: `docker-compose logs`
3. Consultar issues del proyecto
4. Contactar al equipo de desarrollo
