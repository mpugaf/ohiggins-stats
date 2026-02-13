#!/bin/bash

# ================================
# QUICK START SCRIPT - O'Higgins Stats
# Script para iniciar rápidamente la aplicación con Docker
# ================================

set -e

echo "🏆 O'Higgins Stats - Quick Start"
echo "================================"
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Verificar que Docker esté instalado
if ! command -v docker &> /dev/null; then
    print_error "Docker no está instalado"
    echo "Por favor instala Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose no está instalado"
    echo "Por favor instala Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

print_success "Docker instalado correctamente"

# Verificar que estamos en el directorio correcto
if [ ! -f "docker-compose.yml" ]; then
    print_error "No se encontró docker-compose.yml"
    echo "Por favor ejecuta este script desde el directorio raíz del proyecto"
    exit 1
fi

# Verificar si existe .env.docker
if [ ! -f ".env.docker" ]; then
    print_warning "Archivo .env.docker no encontrado"
    echo "Creando desde plantilla..."

    if [ ! -f ".env.docker.example" ]; then
        print_error ".env.docker.example no encontrado"
        exit 1
    fi

    cp .env.docker.example .env.docker
    print_success "Archivo .env.docker creado"

    echo ""
    print_warning "IMPORTANTE: Edita .env.docker antes de continuar"
    echo "Debes cambiar los siguientes valores:"
    echo "  - DB_ROOT_PASSWORD"
    echo "  - DB_PASSWORD"
    echo "  - JWT_SECRET"
    echo ""
    read -p "¿Deseas editar .env.docker ahora? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ${EDITOR:-nano} .env.docker
    else
        print_warning "Recuerda editar .env.docker antes de usar en producción"
    fi
fi

print_success "Configuración verificada"

# Preguntar modo de ejecución
echo ""
echo "Selecciona el modo de ejecución:"
echo "1) Development (con logs visibles)"
echo "2) Production (en background)"
echo "3) Build solamente (sin iniciar)"
echo "4) Stop servicios"
echo "5) Clean (eliminar contenedores y volúmenes)"
read -p "Opción [1-5]: " option

case $option in
    1)
        print_success "Iniciando en modo desarrollo..."
        docker-compose --env-file .env.docker up --build
        ;;
    2)
        print_success "Iniciando en modo producción..."
        docker-compose --env-file .env.docker up -d --build

        echo ""
        print_success "Servicios iniciados exitosamente"
        echo ""
        echo "Accede a:"
        echo "  Frontend: http://localhost"
        echo "  Backend:  http://localhost:3000/api/health"
        echo ""
        echo "Para ver logs:"
        echo "  docker-compose --env-file .env.docker logs -f"
        ;;
    3)
        print_success "Building imágenes..."
        docker-compose --env-file .env.docker build
        print_success "Build completado"
        ;;
    4)
        print_success "Deteniendo servicios..."
        docker-compose --env-file .env.docker down
        print_success "Servicios detenidos"
        ;;
    5)
        print_warning "ADVERTENCIA: Esto eliminará TODOS los datos"
        read -p "¿Estás seguro? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker-compose --env-file .env.docker down -v
            print_success "Limpieza completada"
        else
            print_warning "Operación cancelada"
        fi
        ;;
    *)
        print_error "Opción inválida"
        exit 1
        ;;
esac

exit 0
