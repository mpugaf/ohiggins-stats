# O'Higgins Stats v2.0 - Deployment & Testing Guide
## JWT Authentication & Betting System

🎉 **Implementation Status: 100% Complete**

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Database Setup](#database-setup)
3. [Backend Setup](#backend-setup)
4. [Frontend Setup](#frontend-setup)
5. [Testing Guide](#testing-guide)
6. [User Flows](#user-flows)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have:

- ✅ Node.js v16+ installed
- ✅ MySQL/MariaDB running
- ✅ Database `MP_DATA_DEV` exists
- ✅ Database user `mpuga` with proper permissions
- ✅ Git repository cloned

---

## Database Setup

### Step 1: Create Authentication & Betting Tables

```bash
cd /home/mpuga/projects/ohiggins-stats/backend/scripts

# Execute schema creation
mysql -u mpuga -p MP_DATA_DEV < 01_create_auth_betting_tables.sql

# Seed initial users (admin and test user)
mysql -u mpuga -p MP_DATA_DEV < 02_seed_admin_user.sql
```

### Step 2: Verify Tables Created

```bash
mysql -u mpuga -p MP_DATA_DEV -e "SHOW TABLES LIKE '%usuario%' OR LIKE '%cuota%' OR LIKE '%apuesta%';"
```

Expected output:
```
+---------------------------+
| Tables_in_MP_DATA_DEV     |
+---------------------------+
| apuestas_usuarios         |
| config_apuestas           |
| cuotas_partidos           |
| historial_puntos          |
| usuarios                  |
+---------------------------+
```

### Step 3: Verify Seed Users

```bash
mysql -u mpuga -p MP_DATA_DEV -e "SELECT id_usuario, username, email, role, puede_apostar, activo FROM usuarios;"
```

Expected output:
```
+------------+-------------+---------------------------+--------+---------------+--------+
| id_usuario | username    | email                     | role   | puede_apostar | activo |
+------------+-------------+---------------------------+--------+---------------+--------+
|          1 | admin       | admin@ohiggins-stats.com  | admin  |             0 |      1 |
|          2 | usuario_test| test@ohiggins-stats.com   | usuario|             1 |      1 |
+------------+-------------+---------------------------+--------+---------------+--------+
```

**Default Credentials:**
- Admin: `admin` / `password`
- Test User: `usuario_test` / `password`

⚠️ **IMPORTANT: Change these passwords in production!**

---

## Backend Setup

### Step 1: Configure Environment Variables

Create or update `backend/.env`:

```bash
cd /home/mpuga/projects/ohiggins-stats/backend

cat > .env << 'EOF'
# Database Configuration
DB_HOST=192.168.100.16
DB_USER=mpuga
DB_PASSWORD=your_password_here
DB_NAME=MP_DATA_DEV
DB_PORT=3306

# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=ohiggins-stats-secret-key-prod-2026
JWT_EXPIRES_IN=7d
EOF
```

⚠️ **Replace `your_password_here` with your actual database password**

### Step 2: Install Dependencies

```bash
cd /home/mpuga/projects/ohiggins-stats/backend

# Install all dependencies (including new ones)
npm install
```

Verify new packages are installed:
```bash
npm list jsonwebtoken bcryptjs express-validator
```

### Step 3: Start Backend Server

```bash
npm start
```

Expected output:
```
🚀 Iniciando servidor...
🔧 Variables de entorno cargadas
✅ Rutas de autenticación cargadas exitosamente
✅ Rutas de cuotas cargadas exitosamente
✅ Rutas de apuestas cargadas exitosamente
...
🚀 Servidor corriendo en puerto 3000
📍 URL: http://192.168.100.16:3000

==================== ENDPOINTS ====================
🏥 Health check: http://192.168.100.16:3000/api/health

🔓 PÚBLICAS:
🔐 Auth API: http://192.168.100.16:3000/api/auth

🔒 AUTENTICADAS:
🏆 Torneos API: http://192.168.100.16:3000/api/torneos
🎯 Partidos API: http://192.168.100.16:3000/api/partidos
💰 Cuotas API: http://192.168.100.16:3000/api/cuotas
🎲 Apuestas API: http://192.168.100.16:3000/api/apuestas

👑 SOLO ADMINISTRADORES:
🏟️ Estadios API: http://192.168.100.16:3000/api/estadios
⚽ Equipos API: http://192.168.100.16:3000/api/equipos
👤 Jugadores API: http://192.168.100.16:3000/api/players
===================================================
```

### Step 4: Test Backend Health

```bash
curl http://192.168.100.16:3000/api/health
```

Expected response:
```json
{
  "status": "OK",
  "message": "Servidor funcionando",
  "timestamp": "2026-01-21T..."
}
```

---

## Frontend Setup

### Step 1: Install Dependencies

```bash
cd /home/mpuga/projects/ohiggins-stats/frontend

npm install
```

### Step 2: Configure Environment Variables

Create `frontend/.env`:

```bash
cat > .env << 'EOF'
REACT_APP_API_URL=http://192.168.100.16:3000
EOF
```

### Step 3: Start Frontend Development Server

```bash
npm start
```

Expected output:
```
Compiled successfully!

You can now view frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.100.16:3001
```

The app will automatically open in your browser at `http://localhost:3000`.

---

## Testing Guide

### Manual Testing Checklist

#### 1. Authentication Flow

**Test User Registration:**
1. Navigate to http://localhost:3000/register
2. Fill in form:
   - Username: `testuser1`
   - Email: `testuser1@example.com`
   - Password: `password123`
   - Confirm Password: `password123`
3. Click "Registrarse"
4. ✅ Should redirect to betting interface

**Test User Login:**
1. Navigate to http://localhost:3000/login
2. Login as test user:
   - Username: `usuario_test`
   - Password: `password`
3. Click "Ingresar"
4. ✅ Should redirect to `/partidos-apuestas`

**Test Admin Login:**
1. Navigate to http://localhost:3000/login
2. Login as admin:
   - Username: `admin`
   - Password: `password`
3. Click "Ingresar"
4. ✅ Should redirect to `/dashboard`

#### 2. Route Protection

**Test Unauthenticated Access:**
1. Open incognito window
2. Try to access http://localhost:3000/partidos-apuestas
3. ✅ Should redirect to `/login`

**Test User Access to Admin Routes:**
1. Login as regular user (`usuario_test`)
2. Try to access http://localhost:3000/gestion-cuotas
3. ✅ Should redirect to `/partidos-apuestas`

**Test Admin Access:**
1. Login as admin
2. Access http://localhost:3000/gestion-cuotas
3. ✅ Should load successfully

#### 3. Betting System (User)

**Test View Available Matches:**
1. Login as regular user
2. Navigate to "Partidos Disponibles" tab
3. ✅ Should see list of scheduled matches with odds

**Test Create Bet:**
1. On available matches, click "Apostar" on any option
2. Modal should open
3. Enter amount (e.g., 100)
4. Click "Confirmar Apuesta"
5. ✅ Should show success message
6. ✅ Match should disappear from available list

**Test View My Bets:**
1. Navigate to "Historial Completo" tab
2. ✅ Should see your created bet with "Pendiente" status

**Test User Statistics:**
1. Check statistics cards at top
2. ✅ Should show updated counts

**Test Duplicate Bet Prevention:**
1. Try to bet on the same match again
2. ✅ Should show error: "Ya has apostado en este partido"

#### 4. Odds Management (Admin)

**Test Create Odds:**
1. Login as admin
2. Navigate to http://localhost:3000/gestion-cuotas
3. Select a scheduled match from list
4. Enter odds:
   - Local: 2.50
   - Empate: 3.50
   - Visita: 3.00
5. Click "Guardar Cuotas"
6. ✅ Should show success message

**Test Update Odds:**
1. Select same match again
2. ✅ Should load existing odds
3. Change values
4. Save
5. ✅ Should update successfully

#### 5. Bet Settlement (Admin)

**Test Settlement Flow:**
1. Login as admin
2. Navigate to http://localhost:3000/liquidar-apuestas
3. Find a finished match
4. Click "Liquidar Apuestas"
5. Confirm in modal
6. ✅ Should show success with counts

**Test User Points Update:**
1. Logout
2. Login as user who had bets on settled match
3. Check "Historial" tab
4. ✅ Bet status should be "Ganada" or "Perdida"
5. ✅ If won, points should appear
6. ✅ Statistics should update

### API Testing with curl

**Test Registration:**
```bash
curl -X POST http://192.168.100.16:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "apitest",
    "email": "apitest@example.com",
    "password": "test123"
  }'
```

**Test Login:**
```bash
curl -X POST http://192.168.100.16:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "usuario_test",
    "password": "password"
  }'
```

Save the token from response.

**Test Protected Endpoint:**
```bash
# Replace YOUR_TOKEN with actual token
curl http://192.168.100.16:3000/api/cuotas/partidos \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Test Create Bet:**
```bash
curl -X POST http://192.168.100.16:3000/api/apuestas \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id_partido": 1,
    "tipo_apuesta": "local",
    "id_equipo_predicho": 1,
    "monto_apuesta": 100
  }'
```

---

## User Flows

### Regular User Flow

1. **Register/Login** → Redirects to `/partidos-apuestas`
2. **View Statistics** → See personal betting stats
3. **Browse Available Matches** → Tab "Partidos Disponibles"
4. **Place Bet** → Click "Apostar", confirm in modal
5. **View Pending Bets** → Tab "Apuestas Pendientes"
6. **Check History** → Tab "Historial Completo"
7. **Logout** → Button in header

### Admin Flow

1. **Login** → Redirects to `/dashboard`
2. **Manage Odds** → Navigate to `/gestion-cuotas`
   - Select match
   - Enter 3 odds (local, draw, visitor)
   - Save
3. **Settle Bets** → Navigate to `/liquidar-apuestas`
   - View finished matches
   - Click "Liquidar Apuestas"
   - Confirm settlement
4. **Manage Data** → Access original admin panels
   - Teams, stadiums, players, tournaments, matches
5. **Logout**

---

## Troubleshooting

### Database Connection Errors

**Error:** `ER_ACCESS_DENIED_ERROR`
```bash
# Check database credentials in backend/.env
# Verify user permissions
mysql -u mpuga -p -e "SHOW GRANTS FOR 'mpuga'@'%';"
```

### JWT Token Errors

**Error:** `Token inválido o expirado`
```bash
# Check JWT_SECRET in backend/.env matches
# Clear localStorage in browser: localStorage.clear()
```

### CORS Errors

**Error:** `blocked by CORS policy`
```bash
# Verify CORS origins in backend/app.js:
# origin: ['http://192.168.100.16:3001', 'http://localhost:3001']
```

### Port Already in Use

**Error:** `EADDRINUSE: address already in use :::3000`
```bash
# Backend
lsof -ti:3000 | xargs kill -9

# Frontend
lsof -ti:3001 | xargs kill -9
```

### Missing Dependencies

**Error:** `Cannot find module 'jsonwebtoken'`
```bash
cd backend
npm install
```

### Database Tables Not Found

**Error:** `Table 'MP_DATA_DEV.usuarios' doesn't exist`
```bash
# Re-run schema creation
mysql -u mpuga -p MP_DATA_DEV < backend/scripts/01_create_auth_betting_tables.sql
```

---

## Production Deployment

### Security Checklist

- [ ] Change default admin password
- [ ] Change default test user password
- [ ] Set strong JWT_SECRET (minimum 32 characters)
- [ ] Enable HTTPS
- [ ] Restrict CORS origins to production domains
- [ ] Set NODE_ENV=production
- [ ] Enable database SSL connections
- [ ] Set up proper firewall rules
- [ ] Enable rate limiting on auth endpoints
- [ ] Set up logging and monitoring
- [ ] Regular database backups

### Environment Variables for Production

```bash
# backend/.env (Production)
DB_HOST=your-prod-db-host
DB_USER=prod_user
DB_PASSWORD=strong_secure_password
DB_NAME=ohiggins_stats_prod
DB_PORT=3306

PORT=3000
NODE_ENV=production

JWT_SECRET=your-very-long-random-secret-key-here-minimum-32-chars
JWT_EXPIRES_IN=7d
```

### Build Frontend for Production

```bash
cd frontend
npm run build

# Serve with nginx, Apache, or static hosting
```

---

## Support

For issues or questions:
- Check `/home/mpuga/projects/ohiggins-stats/IMPLEMENTATION_STATUS.md`
- Review API documentation at `http://192.168.100.16:3000/`
- Check backend logs in terminal

---

**Last Updated:** 2026-01-21
**Version:** 2.0.0
**System:** O'Higgins Stats - JWT Authentication & Betting System
