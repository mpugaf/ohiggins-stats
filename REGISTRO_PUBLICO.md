# Registro Público - Configuración

## 📋 Estado Actual

El registro público está **DESHABILITADO** por defecto. Los usuarios solo pueden ser creados por:
1. **Administradores** desde el panel de administración
2. **Tokens de invitación** (sistema de invitaciones)

## 🔓 Cómo Habilitar el Registro Público

Si deseas permitir que cualquier persona se registre sin invitación, sigue estos pasos:

### 1. Frontend - Habilitar Botón de Registro en Login

**Archivo:** `frontend/src/components/Login.js`

**Líneas 146-164:** Descomentar el bloque del footer de registro:

```javascript
// ANTES (comentado)
{/* <div className="divider-modern">
  <span>o</span>
</div>

<div className="login-footer-modern">
  <p className="footer-text">
    ¿No tienes cuenta?
  </p>
  <Link to="/register" className="register-link-modern">
    <span>Regístrate Gratis</span>
    <span className="link-arrow">→</span>
  </Link>
</div> */}

// DESPUÉS (descomentado)
<div className="divider-modern">
  <span>o</span>
</div>

<div className="login-footer-modern">
  <p className="footer-text">
    ¿No tienes cuenta?
  </p>
  <Link to="/register" className="register-link-modern">
    <span>Regístrate Gratis</span>
    <span className="link-arrow">→</span>
  </Link>
</div>
```

**Líneas 167-178:** Descomentar la imagen de registro (opcional):

```javascript
// ANTES (comentado)
{/* <div className="login-image-container login-image-right">
  <img
    src="/images/site/registro.png"
    alt="Regístrate en O'Higgins Stats"
    className="login-side-image"
  />
</div> */}

// DESPUÉS (descomentado)
<div className="login-image-container login-image-right">
  <img
    src="/images/site/registro.png"
    alt="Regístrate en O'Higgins Stats"
    className="login-side-image"
  />
</div>
```

### 2. Frontend - Habilitar Ruta de Registro

**Archivo:** `frontend/src/App.js`

**Línea ~64-66:** Descomentar la ruta de registro:

```javascript
// ANTES (comentado)
{/* REGISTRO PÚBLICO DESHABILITADO - Descomentar para habilitar */}
{/* <Route path="/register" element={<Register />} /> */}

// DESPUÉS (descomentado)
{/* REGISTRO PÚBLICO HABILITADO */}
<Route path="/register" element={<Register />} />
```

### 3. Verificar que el Backend Permita Registro

**Archivo:** `backend/routes/auth.js`

La ruta `POST /api/auth/register` debe estar **pública** (sin middleware de autenticación):

```javascript
// ✅ CORRECTO - Ruta pública
router.post('/register', authController.register);

// ❌ INCORRECTO - Requiere autenticación
router.post('/register', authenticateToken, authController.register);
```

**Estado actual:** Ya está configurado correctamente como ruta pública.

---

## 🔒 Cómo Deshabilitar el Registro Público

Para volver a deshabilitar el registro público:

### 1. Frontend - Ocultar Botón de Registro

**Archivo:** `frontend/src/components/Login.js`

Comentar las líneas 146-164 (footer de registro) y 167-178 (imagen de registro).

### 2. Frontend - Deshabilitar Ruta de Registro

**Archivo:** `frontend/src/App.js`

Comentar la línea de la ruta `/register`:

```javascript
{/* <Route path="/register" element={<Register />} /> */}
```

---

## 🎯 Alternativas de Registro

### Opción 1: Sistema de Tokens de Invitación (Actual)

**Ventajas:**
- Control total sobre quién se registra
- Tokens de un solo uso
- Panel de administración para generar tokens
- Componente ya implementado: `GestionTokens.js`

**Uso:**
1. Admin genera token desde `/admin/gestion-tokens`
2. Admin comparte URL con token: `/register?token=ABC123`
3. Usuario se registra usando el token
4. Token se invalida automáticamente

### Opción 2: Registro Público con Aprobación Manual

**Modificar:** `backend/controllers/authController.js`

```javascript
// En register():
const nuevoUsuario = await executeQuery(
  `INSERT INTO usuarios (username, password_hash, email, nombre_completo, role, activo)
   VALUES (?, ?, ?, ?, 'usuario', 0)`,  // ← activo = 0 (inactivo)
  [username, hashedPassword, email, nombre_completo]
);

// Admin debe activar manualmente desde panel de usuarios
```

### Opción 3: Registro Público con Verificación de Email

**Requiere implementar:**
- Servicio de envío de emails (Nodemailer)
- Token de verificación de email
- Ruta para confirmar email
- UI para resend verification email

**No implementado actualmente.**

---

## 📊 Estado de los Archivos

### Archivos Modificados (Registro Deshabilitado)

- ✅ `frontend/src/components/Login.js` - Botón e imagen comentados
- ✅ `frontend/src/App.js` - Ruta comentada

### Archivos sin Modificar (Siguen Funcionando)

- ✅ `frontend/src/components/Register.js` - Componente funcional
- ✅ `backend/routes/auth.js` - Ruta pública activa
- ✅ `backend/controllers/authController.js` - Lógica de registro funcional

**Nota:** El componente de registro sigue existiendo y funcional. Solo está oculto de la UI y la ruta está deshabilitada.

---

## 🧪 Testing

### Probar Registro Deshabilitado

1. **Desde Login:**
   - No debería aparecer el botón "Regístrate Gratis"
   - La imagen de registro no debería aparecer

2. **Desde URL directa:**
   ```
   http://localhost:3001/register
   ```
   - Debería mostrar error 404 o redireccionar a login

3. **Desde API:**
   ```bash
   # La API sigue funcionando (ruta pública)
   curl -X POST http://localhost:3000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "username": "test",
       "password": "password123",
       "email": "test@example.com",
       "nombre_completo": "Test User"
     }'
   ```
   **Resultado:** Funcionará (backend no bloqueado)

### Probar Registro Habilitado

Después de descomentar:

1. **Desde Login:**
   - Debería aparecer botón "Regístrate Gratis"
   - Click debería navegar a `/register`

2. **Desde URL directa:**
   ```
   http://localhost:3001/register
   ```
   - Debería cargar el componente Register

3. **Completar Registro:**
   - Llenar formulario
   - Submit debería crear usuario y redireccionar

---

## 🔐 Seguridad

### Consideraciones al Habilitar Registro Público

1. **Rate Limiting:**
   - Implementar límite de registros por IP
   - Prevenir spam y bots

2. **CAPTCHA:**
   - Agregar reCAPTCHA en formulario
   - Prevenir registros automatizados

3. **Validación de Email:**
   - Verificar emails válidos
   - Implementar confirmación por email

4. **Moderación:**
   - Revisar usuarios nuevos
   - Campo `activo` permite desactivar usuarios

5. **Username/Email Únicos:**
   - Ya implementado en backend
   - Validación de duplicados

---

## 📝 Notas

- El sistema de tokens de invitación es la forma recomendada de registrar nuevos usuarios
- El registro público debería usarse solo si se implementan medidas anti-spam
- Los administradores siempre pueden crear usuarios desde el panel de administración
- El campo `puede_apostar` en usuarios permite control granular de permisos

---

## 🆘 Preguntas Frecuentes

**P: ¿Por qué el registro está deshabilitado por defecto?**
R: Para tener control sobre quién accede al sistema de apuestas y evitar spam.

**P: ¿Puedo usar tokens Y registro público simultáneamente?**
R: Sí, ambos sistemas pueden coexistir. El componente Register detecta automáticamente si hay un token en la URL.

**P: ¿Qué pasa con los usuarios que ya se registraron?**
R: No se ven afectados. Esto solo controla nuevos registros.

**P: ¿Se puede eliminar completamente el componente Register?**
R: No recomendado. Es mejor dejarlo comentado para poder reactivarlo fácilmente si se necesita.

**P: ¿El backend bloquea el registro si está deshabilitado en frontend?**
R: No. El backend sigue aceptando registros vía API. Si necesitas bloquearlo completamente, debes modificar el backend también.

---

## 🔄 Historial de Cambios

- **2026-02-13:** Registro público deshabilitado por defecto
  - Comentado botón de registro en Login.js
  - Comentada imagen de registro
  - Comentada ruta /register en App.js
  - Documentación creada

---

**Última actualización:** 2026-02-13
