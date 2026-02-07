# 🚀 Guía Rápida - UFC Predictions Deployment

## 🔗 Servicios a Crear Cuentas

1. **PlanetScale** (Base de Datos)
   - URL: https://planetscale.com
   - Plan: Hobby (Gratis)
   - Límites: 5GB, 1B reads/mes

2. **Render** (Backend API)
   - URL: https://render.com
   - Plan: Free (Gratis)
   - Límites: 750 hrs/mes, 512MB RAM

3. **Vercel** (Frontend)
   - URL: https://vercel.com
   - Plan: Hobby (Gratis)
   - Límites: 100GB bandwidth/mes

4. **GitHub** (Control de versiones)
   - URL: https://github.com
   - Necesitas: 2 repos (backend + frontend)

5. **Cron-job.org** (Keep-alive)
   - URL: https://cron-job.org
   - Plan: Free
   - Ping cada 5 min

## 📦 Archivos Creados

```
/home/claude/
├── backend/
│   ├── package.json
│   ├── server.js
│   ├── render.yaml
│   ├── .env.example
│   └── .gitignore
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── .env.example
│   ├── .gitignore
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── App.css
│       └── index.css
├── ufcdatabase_planetscale.sql
└── DEPLOYMENT_CHECKLIST.md
```

## 🔧 Comandos Importantes

### Instalación Inicial
```bash
# Instalar PlanetScale CLI
curl -fsSL https://planetscale.com/install.sh | bash

# Login PlanetScale
pscale auth login

# Instalar Vercel CLI (opcional)
npm i -g vercel
```

### Backend (Render)
```bash
cd /home/claude/backend

# Inicializar y subir
git init
git add .
git commit -m "Initial backend setup"
git remote add origin https://github.com/TU_USUARIO/ufc-predictions-backend.git
git push -u origin main

# Luego en Render:
# 1. New Web Service
# 2. Connect GitHub repo
# 3. Detecta render.yaml automáticamente
# 4. Agregar DATABASE_URL en Environment
# 5. Deploy
```

### Frontend (Vercel)
```bash
cd /home/claude/frontend

# Inicializar y subir
git init
git add .
git commit -m "Initial frontend setup"
git remote add origin https://github.com/TU_USUARIO/ufc-predictions-frontend.git
git push -u origin main

# Luego en Vercel:
# 1. New Project
# 2. Import GitHub repo
# 3. Framework: Vite
# 4. Agregar VITE_API_URL en Environment
# 5. Deploy
```

### Base de Datos
```bash
# Conectar y migrar
pscale connect ufc-predictions main --port 3309

# En otra terminal:
mysql -h 127.0.0.1 -P 3309 < /home/claude/ufcdatabase_planetscale.sql

# Verificar
pscale shell ufc-predictions main
> SHOW TABLES;
> EXIT;

# Crear password para producción
pscale password create ufc-predictions main production-password
# GUARDA: Username, Password, Host
```

## 🧪 Testing

### Probar Backend Local
```bash
cd /home/claude/backend
npm install
npm start

# En otra terminal:
curl http://localhost:3001/health
curl http://localhost:3001/api/events/upcoming
```

### Probar Frontend Local
```bash
cd /home/claude/frontend
npm install
npm run dev

# Abrir: http://localhost:3000
```

### Probar Producción
```bash
# Health check API
curl https://tu-api.onrender.com/health

# Ver eventos
curl https://tu-api.onrender.com/api/events/upcoming

# Abrir frontend
# https://tu-app.vercel.app
```

## ⚡ Optimizaciones Críticas

### 1. Evitar Cold Starts
```
Cron-job.org:
- URL: https://tu-api.onrender.com/health
- Intervalo: Every 5 minutes
- Método: GET
```

### 2. Monitoreo (Opcional)
```
Better Uptime:
- URL: https://tu-api.onrender.com/health
- Check: Every 3 minutes
- Notificaciones: Email
```

## 🐛 Troubleshooting

### Backend no responde
```bash
# Ver logs en Render dashboard
# Verificar variables de entorno
# Verificar DATABASE_URL está correcto
```

### Frontend no carga eventos
```bash
# Abrir DevTools → Network
# Verificar que VITE_API_URL es correcto
# Verificar CORS en backend
```

### Base de datos no conecta
```bash
# Verificar connection string
# Formato: mysql://user:pass@host/db?ssl={"rejectUnauthorized":true}
# Probar conexión local: pscale connect ufc-predictions main
```

### CORS error
```bash
# En Render, agregar/actualizar:
# FRONTEND_URL=https://tu-app.vercel.app
# Redeploy el backend
```

## 📊 Monitoring Dashboard

Después del deployment, guarda estos URLs:

```
Frontend: https://__________.vercel.app
Backend: https://__________.onrender.com
PlanetScale: https://app.planetscale.com/________/ufc-predictions
GitHub Backend: https://github.com/______/ufc-predictions-backend
GitHub Frontend: https://github.com/______/ufc-predictions-frontend
Cron Job: https://console.cron-job.org
```

## 🎯 Próximos Pasos

1. **Autenticación**
   ```
   - Implementar registro/login
   - JWT tokens
   - Protected routes
   ```

2. **Pronósticos**
   ```
   - Crear pronósticos por pelea
   - Guardar en tabla predictions
   - Validar antes del evento
   ```

3. **Odds**
   ```
   - Agregar manualmente a betting_odds
   - O integrar API (The Odds API)
   ```

4. **Puntos**
   ```
   - Calcular después de evento
   - Actualizar leaderboard
   - Notificar usuarios
   ```

## 💰 Costos Estimados

```
MVP (0-6 meses): $0/mes
- 100 usuarios simultáneos
- Con cron job keep-alive

Crecimiento (500+ usuarios): $36/mes
- Render Pro: $7/mes
- PlanetScale Scaler: $29/mes
- Vercel opcional

Escala (5000+ usuarios): $100-150/mes
- DigitalOcean o AWS
- Managed Database
- CDN
```

## 📞 Soporte

Si algo no funciona:
1. Revisa DEPLOYMENT_CHECKLIST.md
2. Verifica logs en cada servicio
3. Prueba endpoints individualmente
4. Verifica variables de entorno
