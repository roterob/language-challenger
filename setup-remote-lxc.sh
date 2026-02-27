#!/bin/bash
# =============================================================================
# Script para LIMPIAR y RE-EJECUTAR setup con el script corregido
# =============================================================================

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuración
LXC_IP="192.168.1.105"
LXC_USER="root"

log_info "Conectando a LXC container en ${LXC_IP}..."

# Ejecutar comandos remotamente
ssh ${LXC_USER}@${LXC_IP} 'bash -s' << 'ENDSSH'
set -e

echo "=========================================="
echo "  LIMPIANDO REPOSITORIO DOCKER INCORRECTO"
echo "=========================================="

# Remover el repositorio de Docker incorrecto
if [ -f /etc/apt/sources.list.d/docker.list ]; then
    rm -f /etc/apt/sources.list.d/docker.list
    echo "✅ Repositorio Docker incorrecto eliminado"
fi

# Remover GPG key incorrecta
if [ -f /etc/apt/keyrings/docker.gpg ]; then
    rm -f /etc/apt/keyrings/docker.gpg
    echo "✅ GPG key eliminada"
fi

echo ""
echo "=========================================="
echo "  ACTUALIZANDO REPOSITORIO"
echo "=========================================="
cd /root/language-challenger
git pull origin master

echo ""
echo "=========================================="
echo "  RE-EJECUTANDO SETUP CON SCRIPT CORREGIDO"
echo "=========================================="
chmod +x deploy/setup-lxc.sh

# Ejecutar con respuestas automáticas (y, y)
echo -e "y\ny" | ./deploy/setup-lxc.sh

echo ""
echo "=========================================="
echo "  VERIFICANDO INSTALACIÓN"
echo "=========================================="
docker --version
docker compose version
systemctl status docker --no-pager | head -5

echo ""
echo "=========================================="
echo "  ✅ SETUP COMPLETADO CORRECTAMENTE"
echo "=========================================="
ENDSSH

if [ $? -eq 0 ]; then
    log_success "Setup completado exitosamente en el LXC!"
    echo ""
    log_info "Próximos pasos:"
    echo "  1. ssh root@${LXC_IP}"
    echo "  2. su - appuser"
    echo "  3. cd /opt/language-challenger"
    echo "  4. git clone https://github.com/roterob/language-challenger.git ."
    echo "  5. ./scripts/deploy.sh --init"
else
    log_error "Hubo un error durante el setup"
    exit 1
fi
