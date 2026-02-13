# ================================
# FRONTEND DOCKERFILE - O'Higgins Stats
# React 18 + Build Multi-stage
# ================================

# ================================
# STAGE 1: Build
# ================================
FROM node:18-alpine AS build

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci --silent && \
    npm cache clean --force

# Copiar código fuente
COPY . .

# ARG para configuración de build
ARG REACT_APP_API_URL=http://localhost:3000
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# Build de producción optimizado
RUN npm run build

# ================================
# STAGE 2: Producción con Nginx
# ================================
FROM nginx:1.25-alpine AS production

# Copiar configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar build de React desde stage anterior
COPY --from=build /app/build /usr/share/nginx/html

# Copiar script de inicio para inyectar variables de entorno
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Exponer puerto
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Usar script de entrada personalizado
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
