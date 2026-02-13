#!/bin/sh

# Script de entrada para inyectar variables de entorno en runtime
# Permite cambiar REACT_APP_API_URL sin rebuild

set -e

# Archivo de configuración JavaScript que se generará
CONFIG_FILE="/usr/share/nginx/html/runtime-config.js"

# Generar archivo de configuración con variables de entorno
cat > "$CONFIG_FILE" <<EOF
window._env_ = {
  REACT_APP_API_URL: '${REACT_APP_API_URL:-http://localhost:3000}'
};
EOF

echo "Runtime config generado:"
cat "$CONFIG_FILE"

# Ejecutar comando original (nginx)
exec "$@"
