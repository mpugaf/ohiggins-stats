# ================================
# BACKEND DOCKERFILE - O'Higgins Stats
# Node.js + Express API
# ================================

FROM node:18-alpine AS base

# Instalar dependencias del sistema
RUN apk add --no-cache \
    mysql-client \
    tzdata

# Establecer zona horaria
ENV TZ=America/Santiago

# Crear directorio de la aplicación
WORKDIR /app

# ================================
# STAGE 1: Dependencias
# ================================
FROM base AS dependencies

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias de producción
RUN npm ci --only=production && \
    npm cache clean --force

# ================================
# STAGE 2: Producción
# ================================
FROM base AS production

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copiar dependencias instaladas
COPY --from=dependencies --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copiar código fuente
COPY --chown=nodejs:nodejs . .

# Exponer puerto
EXPOSE 3000

# Cambiar a usuario no-root
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Comando de inicio
CMD ["node", "app.js"]
