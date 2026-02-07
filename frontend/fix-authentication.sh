#!/bin/bash

# Script para agregar autenticación a componentes React
# Este script agrega el import de useAuth y reemplaza fetch() por authenticatedFetch()

echo "🔧 Iniciando corrección de autenticación en componentes..."

# Lista de archivos a actualizar (excluyendo los de autenticación)
files=(
  "src/components/NuevoTorneo.js"
  "src/components/ListaTorneos.js"
  "src/components/ListaEstadios.js"
  "src/components/NuevoEstadio.js"
  "src/components/EditarEstadio.js"
  "src/components/NuevoEquipo.js"
  "src/components/ListaEquipos.js"
  "src/components/EditarEquipo.js"
  "src/components/AsignacionJugador.js"
  "src/components/ListadoJugadores.js"
  "src/components/PlayersManager.js"
  "src/components/PartidosManager.js"
  "src/components/RegistrarSustitucion.js"
  "src/components/TorneosManager.js"
  "src/components/TorneoManager.js"
  "src/components/EditarTorneo.js"
  "src/components/admin/GestionCuotas.js"
  "src/components/admin/LiquidarApuestas.js"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "📝 Procesando: $file"

    # Verificar si ya tiene useAuth importado
    if ! grep -q "import.*useAuth" "$file"; then
      echo "  ➕ Agregando import de useAuth..."

      # Buscar la última línea de import y agregar useAuth después
      sed -i "/^import.*from/a import { useAuth } from '../context/AuthContext';" "$file" 2>/dev/null || \
      sed -i "/^import.*from/a import { useAuth } from '../../context/AuthContext';" "$file" 2>/dev/null
    fi

    # Verificar si el componente ya usa authenticatedFetch
    if ! grep -q "authenticatedFetch" "$file"; then
      echo "  🔄 El componente necesita usar authenticatedFetch manualmente"
      echo "     Agrega: const { authenticatedFetch } = useAuth();"
      echo "     Reemplaza: await fetch( por: await authenticatedFetch("
    fi

  else
    echo "⚠️  Archivo no encontrado: $file"
  fi
done

echo ""
echo "✅ Proceso completado."
echo ""
echo "⚠️  IMPORTANTE: Este script solo agrega los imports."
echo "   Debes editar manualmente cada componente para:"
echo "   1. Agregar: const { authenticatedFetch } = useAuth();"
echo "   2. Reemplazar todos los: await fetch( por: await authenticatedFetch("
echo ""
echo "📋 Lista de componentes que requieren actualización manual:"
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "   - $file"
  fi
done
