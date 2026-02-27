# 🚀 Guía de Deployment - O'Higgins Stats

## Tier 1 — Gratis o Casi Gratis (0–5 USD/mes)

---

## 📊 Análisis de la Aplicación Actual

**Stack Tecnológico:**
- **Backend**: Node.js + Express (puerto 3000)
- **Frontend**: React 18 (puerto 3001, Create React App)
- **Base de Datos**: MySQL 5.7+ (MP_DATA_DEV)
- **Dependencias Backend**: bcryptjs, jsonwebtoken, mysql2, express, cors, dotenv
- **Dependencias Frontend**: react-router-dom, axios (implícito en apiService)

**Requisitos de Recursos:**
- Node.js backend: ~100-200 MB RAM en idle, ~300-500 MB bajo carga
- React frontend (compilado): ~50 MB de archivos estáticos
- MySQL: ~500 MB - 1 GB RAM (depende de datos)
- Espacio en disco: ~500 MB - 2 GB (incluyendo DB)

**Características Críticas:**
- ✅ Autenticación JWT con usuarios y roles
- ✅ Sistema de apuestas en tiempo real
- ✅ Base de datos relacional con ~20 tablas
- ✅ CORS configurado para dominios específicos
- ⚠️ No tiene WebSockets (no requiere conexiones persistentes)
- ⚠️ Cold starts aceptables (no es tiempo real crítico)

---

## 🏆 Comparativa de Opciones - Tier 1

| Plataforma | Precio Mensual | RAM | DB Incluida | Cold Start | Ranking |
|-----------|---------------|-----|-------------|-----------|---------|
| **Railway** | $0 - $5 | 512 MB - 1 GB | MySQL/PostgreSQL | ~2-5s | ⭐⭐⭐⭐⭐ |
| **Render** | $0 - $7 | 512 MB | PostgreSQL | ~30-60s | ⭐⭐⭐⭐ |
| **Fly.io** | $0 - $5 | 256 MB - 1 GB | PostgreSQL | ~5-10s | ⭐⭐⭐⭐ |
| **PlanetScale + Vercel** | $0 | 256 MB (Vercel) | MySQL (5 GB) | ~1-3s | ⭐⭐⭐ |

---

## 🥇 Opción #1: Railway (RECOMENDADO)

### ✅ Por qué Railway es ideal para O'Higgins Stats

**Ventajas específicas para tu app:**
- ✅ **MySQL nativo** (no necesitas migrar a PostgreSQL)
- ✅ **Deploy desde Git** en 5 minutos
- ✅ **Variables de entorno** fáciles de configurar
- ✅ **Cold starts rápidos** (~2-5 segundos)
- ✅ **Railway CLI** para desarrollo local
- ✅ **Logs en tiempo real** y métricas
- ✅ **SSL/HTTPS automático** con certificados gratis
- ✅ **Pricing predecible**: $5/mes para hobby projects

**Desventajas:**
- ❌ Tier gratuito limitado a $5 de crédito mensual (suficiente para testing, no producción)
- ❌ No tiene CDN global (latencia desde Chile puede ser 100-200ms)
- ❌ Requiere tarjeta de crédito para tier pago

### 📋 Pricing Detallado - Railway

```
Plan Hobby ($5/mes):
- 8 GB RAM compartida
- 8 GB disco
- MySQL incluido
- SSL automático
- Deploys ilimitados
- 1 proyecto

Plan Developer ($10/mes):
- 32 GB RAM compartida
- 100 GB disco
- Múltiples bases de datos
- 5 proyectos
```

**Estimación para O'Higgins Stats:** $5-7/mes

---

## 🛠️ GUÍA DE IMPLEMENTACIÓN PASO A PASO - RAILWAY

### Paso 1: Preparar el Código para Producción

#### 1.1 Crear archivo de configuración de Railway

```bash
cd /home/mpuga/projects/ohiggins-stats
```

**Crear `railway.json` en la raíz:**

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

#### 1.2 Modificar Backend para Producción

**Editar `backend/package.json` - Agregar scripts de producción:**

```json
{
  "scripts": {
    "start": "node app.js",
    "dev": "nodemon app.js",
    "build": "echo 'No build needed for backend'"
  }
}
```

**Crear `backend/Procfile` (opcional, Railway lo detecta automáticamente):**

```
web: node app.js
```

#### 1.3 Modificar Frontend para Producción

**Editar `frontend/package.json` - Verificar scripts:**

```json
{
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "serve": "serve -s build -l $PORT"
  },
  "dependencies": {
    // ... existentes
    "serve": "^14.2.0"
  }
}
```

**Instalar `serve` para servir el build de producción:**

```bash
cd frontend
npm install serve --save
```

#### 1.4 Crear Variables de Entorno de Producción

**Crear `backend/.env.example`:**

```env
# Backend - Production Environment Variables
PORT=3000
NODE_ENV=production

# Database (Railway MySQL)
DB_HOST=${MYSQLHOST}
DB_USER=${MYSQLUSER}
DB_PASSWORD=${MYSQLPASSWORD}
DB_NAME=${MYSQLDATABASE}
DB_PORT=${MYSQLPORT}

# JWT
JWT_SECRET=${JWT_SECRET}
```

**Crear `frontend/.env.production`:**

```env
REACT_APP_API_URL=${RAILWAY_BACKEND_URL}
```

#### 1.5 Actualizar CORS en Backend

**Editar `backend/app.js` - Línea 16:**

```javascript
app.use(cors({
  origin: [
    'http://192.168.100.16:3001',
    'http://localhost:3001',
    process.env.FRONTEND_URL, // Agregar dominio de Railway/Vercel
    /\.railway\.app$/, // Permitir subdominios de Railway
    /\.vercel\.app$/ // Si usas Vercel para frontend
  ],
  credentials: true
}));
```

---

### Paso 2: Crear Cuenta en Railway

1. **Ir a:** https://railway.app
2. **Sign Up con GitHub** (recomendado para auto-deploy)
3. **Conectar repositorio** o subir código manualmente
4. **Agregar tarjeta de crédito** para plan Hobby

---

### Paso 3: Deploy del Backend en Railway

#### 3.1 Crear Nuevo Proyecto

```bash
# Opción A: Desde la Web UI
1. Click "New Project"
2. Seleccionar "Deploy from GitHub repo"
3. Seleccionar repositorio ohiggins-stats
4. Railway detectará Node.js automáticamente

# Opción B: Desde Railway CLI
npm install -g @railway/cli
railway login
cd /home/mpuga/projects/ohiggins-stats/backend
railway init
railway up
```

#### 3.2 Configurar MySQL Database

```bash
# En Railway Dashboard:
1. Click "+ New" → "Database" → "MySQL"
2. Railway creará automáticamente:
   - MYSQLHOST
   - MYSQLPORT
   - MYSQLUSER
   - MYSQLPASSWORD
   - MYSQLDATABASE
   - MYSQL_URL (connection string)
```

#### 3.3 Importar Schema y Datos

**Opción A - Desde Railway CLI:**

```bash
# Conectarse a Railway MySQL
railway connect MySQL

# En el shell MySQL:
SOURCE /ruta/a/tu/schema.sql;
SOURCE /ruta/a/tu/data.sql;
```

**Opción B - Desde local con MySQL client:**

```bash
# Obtener credenciales de Railway Dashboard
railway variables

# Conectar desde local
mysql -h <MYSQLHOST> -P <MYSQLPORT> -u <MYSQLUSER> -p<MYSQLPASSWORD> <MYSQLDATABASE>

# Importar
SOURCE backend/scripts/01_create_auth_betting_tables.sql;
SOURCE backend/scripts/02_seed_admin_user.sql;
# ... otros scripts
```

#### 3.4 Configurar Variables de Entorno del Backend

```bash
# En Railway Dashboard → Backend Service → Variables:

PORT=3000
NODE_ENV=production

# Database (auto-generadas, verificar)
MYSQLHOST=${{MySQL.MYSQLHOST}}
MYSQLPORT=${{MySQL.MYSQLPORT}}
MYSQLUSER=${{MySQL.MYSQLUSER}}
MYSQLPASSWORD=${{MySQL.MYSQLPASSWORD}}
MYSQLDATABASE=${{MySQL.MYSQLDATABASE}}

# JWT (generar nuevo secret)
JWT_SECRET=tu_secret_super_seguro_min_32_caracteres_produccion

# Frontend URL (configurar después del deploy de frontend)
FRONTEND_URL=https://tu-app.vercel.app
```

**Generar JWT_SECRET seguro:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### 3.5 Deploy Backend

```bash
# Railway auto-deploya al hacer push a GitHub
git add .
git commit -m "Configure for Railway deployment"
git push origin main

# O manualmente con CLI
railway up
```

**Railway te dará una URL tipo:** `https://ohiggins-stats-backend.railway.app`

---

### Paso 4: Deploy del Frontend

#### Opción A: Frontend en Vercel (RECOMENDADO)

**Por qué Vercel para frontend:**
- ✅ Gratis para proyectos personales
- ✅ CDN global (baja latencia desde Chile)
- ✅ Build optimizado de React automático
- ✅ Deploy en cada push a GitHub
- ✅ Preview deployments para PRs

**Pasos:**

1. **Ir a:** https://vercel.com
2. **Sign Up con GitHub**
3. **Import Project** → Seleccionar repositorio
4. **Configurar:**
   ```
   Framework Preset: Create React App
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: build
   Install Command: npm install
   ```

5. **Variables de Entorno en Vercel:**
   ```
   REACT_APP_API_URL=https://ohiggins-stats-backend.railway.app
   ```

6. **Deploy** → Vercel te da URL: `https://ohiggins-stats.vercel.app`

7. **Actualizar CORS en Backend Railway:**
   Agregar en variables: `FRONTEND_URL=https://ohiggins-stats.vercel.app`

#### Opción B: Frontend en Railway

**Si prefieres todo en Railway:**

```bash
# Crear nuevo servicio en Railway
railway init --name ohiggins-stats-frontend

# Configurar variables
REACT_APP_API_URL=https://ohiggins-stats-backend.railway.app
PORT=3000

# Deploy
railway up
```

**Configurar build:**
- Build command: `npm run build`
- Start command: `npm run serve`

---

### Paso 5: Configurar Dominio Personalizado (Opcional)

#### En Railway:

```bash
# Settings → Domains → Generate Domain
# Obtendrás: ohiggins-stats.up.railway.app

# O conectar dominio custom:
# Settings → Domains → Custom Domain
# Agregar: api.ohiggins-stats.com
# Configurar CNAME en tu registrador de dominio
```

#### En Vercel:

```bash
# Settings → Domains
# Agregar: ohiggins-stats.com
# Configurar DNS:
#   A record: 76.76.21.21
#   CNAME www: cname.vercel-dns.com
```

---

### Paso 6: Testing en Producción

#### 6.1 Health Check

```bash
# Backend
curl https://ohiggins-stats-backend.railway.app/api/health

# Esperado:
{
  "status": "OK",
  "message": "Servidor funcionando",
  "timestamp": "2026-02-13T20:00:00.000Z"
}
```

#### 6.2 Test de Login

```bash
curl -X POST https://ohiggins-stats-backend.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'
```

#### 6.3 Verificar Frontend

```bash
# Abrir en navegador
https://ohiggins-stats.vercel.app

# Verificar:
- Login funciona
- Dashboard carga
- Apuestas se muestran
- No hay errores de CORS en consola
```

---

### Paso 7: Monitoreo y Mantenimiento

#### Railway Dashboard:

```bash
# Ver logs en tiempo real
railway logs

# Ver métricas
railway status

# Ver variables
railway variables
```

#### Configurar Alertas:

1. Railway Dashboard → Project Settings → Integrations
2. Conectar con Discord/Slack para notificaciones de errores
3. Configurar límites de recursos

---

## 💰 Cálculo de Costos Mensual - Railway + Vercel

```
Railway Hobby Plan:
- Backend service: $3-4/mes
- MySQL database: $2-3/mes
- TOTAL Railway: ~$5-7/mes

Vercel Free Plan:
- Frontend hosting: $0/mes
- Build minutes: Gratis (100GB bandwidth/mes)
- TOTAL Vercel: $0/mes

COSTO TOTAL: $5-7 USD/mes
```

---

## 🥈 Opción #2: Render.com

### ✅ Ventajas

- ✅ Tier gratuito generoso (750 horas/mes)
- ✅ PostgreSQL gratis incluido (90 días, luego $7/mes)
- ✅ SSL automático
- ✅ Zero config para Node.js + React
- ✅ Deploy automático desde Git

### ❌ Desventajas

- ❌ **Cold starts muy largos** (~30-60 segundos en tier gratuito)
- ❌ **No tiene MySQL** (requiere migrar a PostgreSQL)
- ❌ Servicios se duermen después de 15 min de inactividad (tier gratuito)
- ❌ PostgreSQL gratis solo 90 días

### 📋 Pricing Render

```
Free Tier:
- 750 horas/mes por servicio
- 512 MB RAM
- Cold starts de 30-60s
- Servicios se duermen

Starter Plan ($7/mes por servicio):
- 512 MB RAM
- Sin cold starts
- Servicios siempre activos

PostgreSQL:
- Free: 90 días, luego $7/mes
- 1 GB almacenamiento
```

**Estimación para O'Higgins Stats:** $14-21/mes (backend + frontend + DB)

### 🛠️ Pasos Rápidos - Render

**1. Migrar MySQL a PostgreSQL:**

```bash
# Instalar herramienta de conversión
npm install -g mysql-to-postgresql

# Convertir schema
mysql-to-postgresql \
  --source-host=192.168.100.16 \
  --source-database=MP_DATA_DEV \
  --target-host=<render-postgres-host> \
  --target-database=ohiggins_db
```

**2. Actualizar Backend:**

```bash
# Cambiar driver en package.json
npm uninstall mysql2
npm install pg

# Actualizar config/database.js para usar PostgreSQL
```

**3. Deploy:**

1. Ir a https://render.com
2. New → Web Service
3. Conectar GitHub repo
4. Configurar:
   ```
   Build Command: npm install
   Start Command: npm start
   Environment: Node
   ```
5. Agregar PostgreSQL Database
6. Configurar variables de entorno

---

## 🥉 Opción #3: Fly.io

### ✅ Ventajas

- ✅ **Edge deployment** (servidores cerca de usuarios)
- ✅ Soporte para PostgreSQL y MySQL (via Planetscale)
- ✅ Excelente para apps globales
- ✅ Dockerfile flexible
- ✅ Cold starts rápidos (~5-10s)

### ❌ Desventajas

- ❌ Requiere Dockerfile (más complejo)
- ❌ CLI obligatorio para deploy
- ❌ Pricing complejo (por hora de CPU/RAM)
- ❌ Curva de aprendizaje más alta

### 📋 Pricing Fly.io

```
Free Tier (Allowances):
- 3 VMs compartidas (256 MB RAM cada una)
- 160 GB bandwidth
- Suficiente para hobby projects

Paid (después de free allowances):
- $0.0000008/s por CPU (~$2/mes por VM pequeña)
- $0.0000002/s por MB RAM
- $0.02/GB outbound bandwidth
```

**Estimación para O'Higgins Stats:** $3-5/mes

### 🛠️ Pasos Rápidos - Fly.io

**1. Instalar Fly CLI:**

```bash
curl -L https://fly.io/install.sh | sh
flyctl auth signup
```

**2. Crear Dockerfiles:**

**Backend Dockerfile:**

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "app.js"]
```

**3. Deploy:**

```bash
cd backend
flyctl launch
flyctl deploy

# Configurar MySQL via Planetscale (gratis)
flyctl secrets set DATABASE_URL=<planetscale-url>
```

---

## 🏅 Opción #4: PlanetScale (MySQL) + Vercel (Frontend) + Railway/Render (Backend)

### Stack Híbrido para Optimización de Costos

**Arquitectura:**
- **Base de Datos**: PlanetScale (MySQL gratis, 5 GB)
- **Backend**: Railway Hobby ($5/mes) o Render Free
- **Frontend**: Vercel (gratis)

### ✅ Ventajas

- ✅ **MySQL gratis** con PlanetScale (5 GB, 1 billón de lecturas)
- ✅ **Branching de DB** (como Git para tu base de datos)
- ✅ **Zero downtime migrations**
- ✅ **Frontend ultra rápido** con Vercel CDN
- ✅ **Costo total**: $5/mes (solo backend)

### ❌ Desventajas

- ❌ Más componentes que gestionar
- ❌ PlanetScale requiere cambios en queries (no soporta FK)
- ❌ Más complejidad en configuración inicial

### 📋 Pricing

```
PlanetScale Hobby (gratis):
- 5 GB almacenamiento
- 1 billón lecturas/mes
- 10 millones escrituras/mes
- Sin foreign keys (usar en app layer)

Railway Hobby: $5/mes
Vercel: $0/mes

TOTAL: $5/mes
```

### 🛠️ Pasos - PlanetScale Setup

**1. Crear cuenta en PlanetScale:**

```bash
# Ir a https://planetscale.com
# Sign up gratis

# Crear database
pscale database create ohiggins-stats --region us-east
```

**2. Modificar Schema (remover FKs):**

```sql
-- PlanetScale no soporta FOREIGN KEY constraints
-- Removerlas del schema:

-- ANTES:
ALTER TABLE usuarios
  ADD CONSTRAINT fk_usuario_programa
    FOREIGN KEY (id_programa) REFERENCES programas(id_programa)
    ON DELETE SET NULL;

-- DESPUÉS (comentar o remover):
-- Foreign keys manejados en la aplicación
```

**3. Importar datos:**

```bash
pscale connect ohiggins-stats main --port 3309
mysql -h 127.0.0.1 -P 3309 < schema.sql
```

**4. Obtener connection string:**

```bash
pscale password create ohiggins-stats main ohiggins-backend

# Usar en Railway/Render:
DATABASE_URL=mysql://<user>:<password>@<host>/<database>?ssl={"rejectUnauthorized":true}
```

---

## 📊 Comparativa Final - Tabla Decisión

| Criterio | Railway | Render | Fly.io | Híbrido (PS+Vercel) |
|----------|---------|--------|--------|---------------------|
| **Precio/mes** | $5-7 | $14-21 | $3-5 | $5 |
| **Complejidad Setup** | ⭐⭐ Fácil | ⭐⭐ Fácil | ⭐⭐⭐⭐ Difícil | ⭐⭐⭐ Media |
| **Cold Start** | 2-5s | 30-60s | 5-10s | 1-3s |
| **MySQL Nativo** | ✅ Sí | ❌ No | ⚠️ Vía PS | ✅ Sí (PS) |
| **Escalabilidad** | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Uptime SLA** | 99% | 99% | 99.95% | 99.9% |
| **Soporte** | Discord | Email | Foro | Email |
| **Deploy Auto** | ✅ | ✅ | ❌ | ✅ |

---

## 🎯 Recomendación Final para O'Higgins Stats

### Para Producción Inicial (0-100 usuarios):

**Stack Recomendado:**
```
✅ Backend: Railway Hobby ($5/mes)
✅ Base de Datos: Railway MySQL (incluido)
✅ Frontend: Vercel Free

TOTAL: $5/mes
```

**Por qué:**
- ✅ Setup en 30 minutos
- ✅ MySQL nativo (sin migración)
- ✅ Auto-deploy desde Git
- ✅ SSL automático
- ✅ Logs y métricas incluidos
- ✅ Precio predecible

### Plan de Escalado (100-1000 usuarios):

```
Mes 1-3: Railway Hobby ($5/mes)
Mes 4-6: Railway Developer ($10/mes) + Vercel Pro ($20/mes)
Mes 7+: Considerar DigitalOcean/AWS (VPS dedicado)
```

---

## 🔧 Troubleshooting Común

### Error: "Cannot connect to database"

```bash
# Verificar variables de entorno
railway variables

# Verificar conexión MySQL
railway run mysql -h $MYSQLHOST -u $MYSQLUSER -p
```

### Error: "CORS policy blocked"

```javascript
// Verificar FRONTEND_URL en backend
console.log('CORS origins:', process.env.FRONTEND_URL)

// Actualizar app.js
app.use(cors({
  origin: [process.env.FRONTEND_URL, /\.railway\.app$/],
  credentials: true
}));
```

### Error: Frontend no encuentra API

```bash
# Verificar .env.production en Vercel
REACT_APP_API_URL=https://tu-backend.railway.app

# Rebuild en Vercel
vercel --prod
```

---

## 📚 Recursos Adicionales

**Railway:**
- Docs: https://docs.railway.app
- Templates: https://railway.app/templates
- Discord: https://discord.gg/railway

**Vercel:**
- Docs: https://vercel.com/docs
- Deploy Guide: https://vercel.com/docs/deployments/overview

**PlanetScale:**
- Docs: https://planetscale.com/docs
- Migration Guide: https://planetscale.com/docs/tutorials/planetscale-quick-start-guide

---

## ✅ Checklist de Deployment

```
Backend:
[ ] Scripts de build configurados
[ ] Variables de entorno definidas
[ ] CORS actualizado con dominios de producción
[ ] JWT_SECRET generado seguro
[ ] Health check endpoint funcional
[ ] Logs configurados

Frontend:
[ ] REACT_APP_API_URL configurado
[ ] Build de producción optimizado
[ ] Service Worker deshabilitado (si no se usa)
[ ] Analytics configurado (opcional)

Base de Datos:
[ ] Schema importado
[ ] Datos iniciales (admin user) creados
[ ] Backups configurados
[ ] Índices optimizados

Seguridad:
[ ] Secrets rotados (diferentes de local)
[ ] HTTPS habilitado
[ ] Rate limiting configurado (opcional)
[ ] Helmet.js instalado (backend)

Testing:
[ ] Login funciona
[ ] Registro funciona
[ ] Apuestas se crean correctamente
[ ] Admin dashboard accesible
[ ] Mobile responsive verificado
```

---

## 🎉 Próximos Pasos Después del Deploy

1. **Configurar dominio personalizado**
2. **Habilitar analytics** (Google Analytics / Plausible)
3. **Configurar backups automáticos de DB**
4. **Implementar logging avanzado** (Sentry / LogRocket)
5. **Monitoreo de uptime** (UptimeRobot gratis)
6. **Optimizar performance** (lazy loading, code splitting)
7. **SEO básico** (meta tags, sitemap)

---

**Última actualización:** Febrero 2026
**Mantenedor:** O'Higgins Stats Team
**Versión del documento:** 1.0
