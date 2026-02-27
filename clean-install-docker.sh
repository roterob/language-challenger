#!/bin/bash
# =============================================================================
# Script para LIMPIAR completamente Docker y re-instalar
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
echo "  LIMPIEZA COMPLETA DE DOCKER"
echo "=========================================="

# Parar Docker si está corriendo
systemctl stop docker 2>/dev/null || true
systemctl stop containerd 2>/dev/null || true

# Desinstalar Docker si está instalado
apt-get remove -y docker docker-engine docker.io containerd runc docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin 2>/dev/null || true
apt-get autoremove -y 2>/dev/null || true

# Eliminar TODOS los repositorios de Docker
rm -f /etc/apt/sources.list.d/docker.list
rm -f /etc/apt/sources.list.d/docker.list.save
rm -rf /etc/apt/keyrings/docker.gpg*

# Limpiar cache de apt
apt-get clean
rm -rf /var/lib/apt/lists/*
apt-get update

echo "✅ Limpieza completada"

echo ""
echo "=========================================="
echo "  ACTUALIZAR CÓDIGO"
echo "=========================================="
cd /root/language-challenger
git fetch origin
git reset --hard origin/master
git pull origin master
echo "✅ Código actualizado"

echo ""
echo "=========================================="
echo "  INSTALAR DEPENDENCIAS ADICIONALES"
echo "=========================================="
apt-get update
apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    software-properties-common

echo ""
echo "=========================================="
echo "  INSTALAR DOCKER MANUALMENTE"
echo "=========================================="

# Detectar OS
. /etc/os-release
OS=$ID
echo "Sistema operativo detectado: $OS"

# Crear directorio para keyrings
install -m 0755 -d /etc/apt/keyrings

if [ "$OS" = "debian" ]; then
    echo "Configurando repositorio Docker para Debian..."
    curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
      $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
else
    echo "❌ Sistema no soportado: $OS"
    exit 1
fi

# Actualizar e instalar Docker
echo "Instalando Docker Engine..."
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Iniciar y habilitar Docker
systemctl start docker
systemctl enable docker

echo "✅ Docker instalado"

echo ""
echo "=========================================="
echo "  VERIFICAR INSTALACIÓN"
echo "=========================================="
docker --version
docker compose version
systemctl status docker --no-pager | head -5

echo ""
echo "=========================================="
echo "  CREAR USUARIO Y DIRECTORIOS"
echo "=========================================="

# Crear usuario appuser si no existe
if ! id "appuser" &>/dev/null; then
    useradd -m -s /bin/bash appuser
    usermod -aG docker appuser
    echo "✅ Usuario appuser creado"
else
    echo "Usuario appuser ya existe"
fi

# Crear directorios
APP_DIR="/opt/language-challenger"
mkdir -p $APP_DIR
mkdir -p $APP_DIR/data
mkdir -p $APP_DIR/backups
mkdir -p $APP_DIR/logs

chown -R appuser:appuser $APP_DIR
echo "✅ Directorios creados en $APP_DIR"

echo ""
echo "=========================================="
echo "  ✅ INSTALACIÓN COMPLETADA"
echo "=========================================="
echo ""
echo "Docker version: $(docker --version)"
echo "Docker Compose version: $(docker compose version)"
echo "Usuario appuser: ✅ Creado"
echo "Directorios: ✅ Creados en $APP_DIR"
ENDSSH

if [ $? -eq 0 ]; then
    log_success "Setup completado exitosamente!"
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
