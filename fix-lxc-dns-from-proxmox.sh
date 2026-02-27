#!/bin/bash
# =============================================================================
# Script para configurar DNS en el LXC DESDE PROXMOX
# Ejecuta este script EN EL HOST DE PROXMOX (no en el LXC)
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
CT_ID=105

log_info "Configurando DNS para container ${CT_ID}..."

# Configurar DNS en el container
pct set ${CT_ID} -nameserver "1.1.1.1 8.8.8.8"

log_success "DNS configurado"

log_info "Reiniciando container..."
pct restart ${CT_ID}

log_info "Esperando que el container arranque..."
sleep 10

log_info "Verificando DNS dentro del container..."
pct exec ${CT_ID} -- cat /etc/resolv.conf

log_info "Probando conectividad..."
pct exec ${CT_ID} -- ping -c 2 1.1.1.1

log_info "Probando resolución DNS..."
pct exec ${CT_ID} -- ping -c 2 deb.debian.org

log_success "¡DNS configurado correctamente!"
echo ""
echo "Ahora puedes ejecutar: ./setup-remote-lxc.sh"
