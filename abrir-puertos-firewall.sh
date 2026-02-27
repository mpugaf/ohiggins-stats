#!/bin/bash
# Script para abrir puertos en el firewall de Ubuntu

echo "=== Abriendo puertos en el firewall ==="

# Verificar estado actual del firewall
echo "1. Estado actual del firewall:"
sudo ufw status verbose

echo ""
echo "2. Abriendo puerto 3000 (Backend)..."
sudo ufw allow 3000/tcp comment 'Backend Node.js'

echo ""
echo "3. Abriendo puerto 3001 (Frontend)..."
sudo ufw allow 3001/tcp comment 'Frontend React'

echo ""
echo "4. Verificando que el puerto 2222 (SSH) esté abierto..."
sudo ufw allow 2222/tcp comment 'SSH'

echo ""
echo "5. Recargar firewall..."
sudo ufw reload

echo ""
echo "6. Estado final del firewall:"
sudo ufw status verbose

echo ""
echo "=== ¡Puertos abiertos! ==="
echo "Ahora intenta acceder desde Windows a:"
echo "  - Frontend: http://192.168.100.16:3001/"
echo "  - Backend:  http://192.168.100.16:3000/api/health"
