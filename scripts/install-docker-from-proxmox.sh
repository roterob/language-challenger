#!/bin/bash
# =============================================================================
# Script para instalar Docker en LXC usando PTC desde Proxmox
# Ejecuta este script EN EL HOST DE PROXMOX (no local)
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

log_info "Instalando Docker en container ${CT_ID}..."

# Limpiar Docker previo
log_info "Limpiando instalaciones previas..."
pct exec ${CT_ID} -- bash -c "systemctl stop docker 2>/dev/null || true"
pct exec ${CT_ID} -- bash -c "systemctl stop containerd 2>/dev/null || true"
pct exec ${CT_ID} -- bash -c "apt-get remove -y docker docker-engine docker.io containerd runc docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin 2>/dev/null || true"
pct exec ${CT_ID} -- bash -c "apt-get autoremove -y 2>/dev/null || true"
pct exec ${CT_ID} -- bash -c "rm -f /etc/apt/sources.list.d/docker.list*"
pct exec ${CT_ID} -- bash -c "rm -rf /etc/apt/keyrings/docker.gpg*"
pct exec ${CT_ID} -- bash -c "apt-get clean && rm -rf /var/lib/apt/lists/*"
log_success "Limpieza completada"

# Actualizar código
log_info "Actualizando código del repositorio..."
pct exec ${CT_ID} -- bash -c "cd /root/language-challenger && git fetch origin && git reset --hard origin/master && git pull origin master"
log_success "Código actualizado"

# Instalar dependencias
log_info "Instalando dependencias..."
pct exec ${CT_ID} -- bash -c "apt-get update"
pct exec ${CT_ID} -- bash -c "apt-get install -y ca-certificates curl gnupg lsb-release software-properties-common"

# Instalar Docker para Debian
log_info "Instalando Docker Engine..."
pct exec ${CT_ID} -- bash -c "
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    echo 'deb [arch=amd64 signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian bookworm stable' > /etc/apt/sources.list.d/docker.list
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    systemctl start docker
    systemctl enable docker
"
log_success "Docker instalado"

# Verificar instalación
log_info "Verificando instalación..."
pct exec ${CT_ID} -- docker --version
pct exec ${CT_ID} -- docker compose version

# Crear usuario appuser
log_info "Creando usuario appuser..."
pct exec ${CT_ID} -- bash -c "
    if ! id appuser &>/dev/null; then
        useradd -m -s /bin/bash appuser
        usermod -aG docker appuser
        echo 'Usuario appuser creado'
    else
        echo 'Usuario appuser ya existe'
    fi
"

# Crear directorios
log_info "Creando directorios de aplicación..."
pct exec ${CT_ID} -- bash -c "
    mkdir -p /opt/language-challenger/{data,backups,logs}
    chown -R appuser:appuser /opt/language-challenger
"

log_success "=================================="
log_success "  INSTALACIÓN COMPLETADA"
log_success "=================================="
echo ""
echo "Próximos pasos:"
echo "  1. pct enter ${CT_ID}"
echo "  2. su - appuser"
echo "  3. cd /opt/language-challenger"
echo "  4. git clone https://github.com/roterob/language-challenger.git ."
echo "  5. ./scripts/deploy.sh --init"
