#!/bin/bash
# =============================================================================
# Language Challenger - LXC Setup Script for Proxmox
# =============================================================================
# This script prepares a fresh LXC container for deployment
# Run this script ONCE on a new LXC container
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   log_error "This script must be run as root (or with sudo)"
   exit 1
fi

log_info "Starting Language Challenger LXC setup..."

# =============================================================================
# 1. System Update
# =============================================================================
log_info "Updating system packages..."
apt-get update
apt-get upgrade -y
log_success "System updated"

# =============================================================================
# 2. Install Essential Tools
# =============================================================================
log_info "Installing essential tools..."
apt-get install -y \
    curl \
    wget \
    git \
    vim \
    htop \
    net-tools \
    ca-certificates \
    gnupg \
    lsb-release \
    software-properties-common
log_success "Essential tools installed"

# =============================================================================
# 3. Install Docker
# =============================================================================
log_info "Installing Docker..."

# Remove old versions if any
apt-get remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true

# Add Docker's official GPG key
install -m 0755 -d /etc/apt/keyrings

# Detect OS (Ubuntu or Debian)
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
else
    OS="unknown"
fi

if [ "$OS" = "debian" ]; then
    curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
      $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
elif [ "$OS" = "ubuntu" ]; then
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
else
    log_error "Sistema operativo no soportado: $OS"
    exit 1
fi

# Install Docker Engine
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Start and enable Docker
systemctl start docker
systemctl enable docker

log_success "Docker installed and enabled"

# =============================================================================
# 4. Configure Docker
# =============================================================================
log_info "Configuring Docker..."

# Create Docker daemon config for better logging
mkdir -p /etc/docker
cat > /etc/docker/daemon.json <<EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF

systemctl restart docker
log_success "Docker configured"

# =============================================================================
# 5. Create Application User
# =============================================================================
log_info "Creating application user 'appuser'..."

if id "appuser" &>/dev/null; then
    log_warning "User 'appuser' already exists, skipping..."
else
    useradd -m -s /bin/bash appuser
    usermod -aG docker appuser
    log_success "User 'appuser' created and added to docker group"
fi

# =============================================================================
# 6. Create Application Directories
# =============================================================================
log_info "Creating application directories..."

APP_DIR="/opt/language-challenger"
mkdir -p $APP_DIR
mkdir -p $APP_DIR/data
mkdir -p $APP_DIR/backups
mkdir -p $APP_DIR/logs

chown -R appuser:appuser $APP_DIR
log_success "Application directories created at $APP_DIR"

# =============================================================================
# 7. Install Monitoring Tools (optional)
# =============================================================================
log_info "Installing monitoring tools..."
apt-get install -y htop iotop ncdu
log_success "Monitoring tools installed"

# =============================================================================
# 8. Configure Firewall (UFW) - Optional
# =============================================================================
read -p "Do you want to configure UFW firewall? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_info "Configuring UFW firewall..."
    apt-get install -y ufw
    
    # Allow SSH
    ufw allow 22/tcp
    
    # Allow application port
    ufw allow 3001/tcp
    
    # Enable UFW
    ufw --force enable
    
    log_success "Firewall configured (ports 22, 3001 allowed)"
else
    log_info "Skipping firewall configuration"
fi

# =============================================================================
# 9. Setup Automatic Security Updates (optional)
# =============================================================================
read -p "Do you want to enable automatic security updates? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_info "Setting up automatic security updates..."
    apt-get install -y unattended-upgrades
    dpkg-reconfigure -plow unattended-upgrades
    log_success "Automatic security updates enabled"
else
    log_info "Skipping automatic security updates"
fi

# =============================================================================
# 10. Setup Backup Cron Job Placeholder
# =============================================================================
log_info "Setting up cron job for daily backups..."

# Create cron job for daily backup at 2 AM
(crontab -u appuser -l 2>/dev/null; echo "0 2 * * * cd $APP_DIR && ./scripts/backup.sh >> $APP_DIR/logs/backup.log 2>&1") | crontab -u appuser -

log_success "Backup cron job created (runs daily at 2 AM)"

# =============================================================================
# 11. Display Summary
# =============================================================================
echo ""
log_success "=============================================="
log_success "LXC Setup Complete!"
log_success "=============================================="
echo ""
log_info "Summary of installed components:"
echo "  - Docker Engine: $(docker --version)"
echo "  - Docker Compose: $(docker compose version)"
echo "  - Application directory: $APP_DIR"
echo "  - Application user: appuser"
echo ""
log_info "Next steps:"
echo "  1. Switch to appuser: sudo su - appuser"
echo "  2. Clone your repository to $APP_DIR"
echo "  3. Run the deployment script: ./scripts/deploy.sh --init"
echo ""
log_warning "Important reminders:"
echo "  - Configure your domain in Nginx Proxy Manager to point to this LXC IP:3001"
echo "  - Generate a strong JWT_SECRET before first deployment"
echo "  - Make sure to run database seed after first deployment"
echo ""
log_success "Setup script finished successfully!"
