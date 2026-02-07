# O'Higgins Stats

Sistema de estadísticas para O'Higgins con backend, frontend y API para obtener datos.

## Estructura del Proyecto

```
ohiggins-stats/
├── backend/          # Servidor API (Node.js + Express)
├── frontend/         # Aplicación web (React)
├── statsPipeline/    # Pipeline de procesamiento de datos
└── fbr_api_project/  # API externa para datos
```

## Backend

API REST desarrollada con Node.js y Express.

### Tecnologías
- Express.js
- MySQL2 / PostgreSQL
- CORS
- dotenv

### Instalación
```bash
cd backend
npm install
npm start
```

## Frontend

Aplicación web desarrollada con React.

### Tecnologías
- React 18
- React Router DOM
- React Scripts

### Instalación
```bash
cd frontend
npm install
npm start
```

## API para Obtener Datos

El sistema incluye:
- API backend para servir datos procesados
- Pipeline de estadísticas para procesar datos
- Integración con API externa (fbr_api_project)

## Desarrollo

1. Clonar el repositorio
2. Instalar dependencias del backend y frontend
3. Configurar variables de entorno
4. Ejecutar ambos servicios

### Backend
```bash
cd backend && npm install && npm start
```

### Frontend
```bash
cd frontend && npm install && npm start
```