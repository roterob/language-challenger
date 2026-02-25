#!/bin/bash
# =============================================================================
# Language Challenger - Deployment Script
# =============================================================================
# This script handles building and deploying the application
# Usage:
#   ./scripts/deploy.sh --init    # First time deployment (creates .env, seeds DB)
#   ./scripts/deploy.sh           # Regular deployment (pull, build, restart)
#   ./scripts/deploy.sh --build   # Force rebuild without cache
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

# Configuration
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$APP_DIR/.env"
BACKUP_DIR="$APP_DIR/backups"
DATA_DIR="$APP_DIR/data"

# Parse arguments
INIT_MODE=false
FORCE_BUILD=false

for arg in "$@"; do
    case $arg in
        --init)
            INIT_MODE=true
            shift
            ;;
        --build)
            FORCE_BUILD=true
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --init    First time deployment (creates .env, seeds database)"
            echo "  --build   Force rebuild Docker images without cache"
            echo "  --help    Show this help message"
            exit 0
            ;;
    esac
done

cd "$APP_DIR"

log_info "Starting deployment process..."
log_info "Working directory: $APP_DIR"

# =============================================================================
# 1. Initial Setup (only on --init)
# =============================================================================
if [ "$INIT_MODE" = true ]; then
    log_info "Running initial setup..."
    
    # Create .env if it doesn't exist
    if [ ! -f "$ENV_FILE" ]; then
        log_info "Creating .env file from template..."
        cp .env.example .env
        
        # Generate JWT secret
        JWT_SECRET=$(openssl rand -base64 32)
        
        # Handle macOS vs Linux sed differences
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|CHANGE_ME_TO_A_STRONG_RANDOM_SECRET|$JWT_SECRET|g" .env
        else
            sed -i "s|CHANGE_ME_TO_A_STRONG_RANDOM_SECRET|$JWT_SECRET|g" .env
        fi
        
        log_success ".env file created with generated JWT_SECRET"
        log_warning "Please review and customize $ENV_FILE if needed"
        
        read -p "Press Enter to continue or Ctrl+C to abort and edit .env..."
    else
        log_warning ".env file already exists, skipping creation"
    fi
    
    # Create required directories
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$DATA_DIR"
    mkdir -p "$APP_DIR/logs"
    
    log_success "Required directories created"
fi

# =============================================================================
# 2. Pull Latest Code (if git repository)
# =============================================================================
if [ -d .git ]; then
    log_info "Pulling latest changes from git..."
    
    # Stash any local changes
    if ! git diff-index --quiet HEAD --; then
        log_warning "Local changes detected, stashing them..."
        git stash
    fi
    
    git pull origin $(git branch --show-current)
    log_success "Code updated from git"
else
    log_warning "Not a git repository, skipping git pull"
fi

# =============================================================================
# 3. Backup Database (if exists and not initial deployment)
# =============================================================================
if [ "$INIT_MODE" = false ] && [ -f "$DATA_DIR/database.sqlite" ]; then
    log_info "Creating database backup before deployment..."
    
    BACKUP_FILE="$BACKUP_DIR/database.$(date +%Y%m%d_%H%M%S).sqlite"
    cp "$DATA_DIR/database.sqlite" "$BACKUP_FILE"
    
    log_success "Database backed up to $BACKUP_FILE"
fi

# =============================================================================
# 4. Build Docker Images
# =============================================================================
log_info "Building Docker images..."

if [ "$FORCE_BUILD" = true ]; then
    log_info "Force rebuild requested (--build flag), building without cache..."
    docker compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache
else
    docker compose -f docker-compose.yml -f docker-compose.prod.yml build
fi

log_success "Docker images built successfully"

# =============================================================================
# 5. Stop Running Containers (graceful shutdown)
# =============================================================================
if docker compose ps | grep -q "language-challenger"; then
    log_info "Stopping running containers..."
    docker compose -f docker-compose.yml -f docker-compose.prod.yml down --timeout 30
    log_success "Containers stopped"
else
    log_info "No running containers found"
fi

# =============================================================================
# 6. Start Containers
# =============================================================================
log_info "Starting containers..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Wait for container to be healthy
log_info "Waiting for application to be healthy..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if docker compose ps | grep -q "healthy"; then
        log_success "Application is healthy!"
        break
    fi
    
    attempt=$((attempt + 1))
    echo -n "."
    sleep 2
done

echo ""

if [ $attempt -eq $max_attempts ]; then
    log_error "Application did not become healthy after $max_attempts attempts"
    log_info "Check logs with: docker compose logs -f"
    exit 1
fi

# =============================================================================
# 7. Run Migrations (always)
# =============================================================================
log_info "Running database migrations..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T -u node app \
    server/node_modules/.bin/tsx server/src/db/migrate.ts
log_success "Migrations completed"

# =============================================================================
# 8. Seed Database (only on --init)
# =============================================================================
if [ "$INIT_MODE" = true ]; then
    log_info "Seeding database with initial data..."
    
    docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T -u node app \
        server/node_modules/.bin/tsx server/src/db/seed.ts
    
    log_success "Database seeded successfully"
    log_info "Default credentials:"
    echo "  Username: admin"
    echo "  Password: secret"
fi

# =============================================================================
# 9. Cleanup Old Images
# =============================================================================
log_info "Cleaning up old Docker images..."
docker image prune -f
log_success "Cleanup completed"

# =============================================================================
# 10. Display Status
# =============================================================================
echo ""
log_success "=============================================="
log_success "Deployment Completed Successfully!"
log_success "=============================================="
echo ""
log_info "Container status:"
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
echo ""
log_info "Application URLs:"
echo "  - Internal: http://localhost:3001"
echo "  - Health check: http://localhost:3001/api/health"
echo ""
log_info "Useful commands:"
echo "  View logs:       docker compose logs -f"
echo "  Stop app:        docker compose down"
echo "  Restart app:     docker compose restart"
echo "  Shell access:    docker compose exec app sh"
echo ""
log_success "Deployment finished!"

# =============================================================================
# 11. Show Next Steps (only on --init)
# =============================================================================
if [ "$INIT_MODE" = true ]; then
    echo ""
    log_warning "IMPORTANT: Next steps for production deployment:"
    echo "  1. Configure Nginx Proxy Manager:"
    echo "     - Add Proxy Host pointing to this LXC IP:3001"
    echo "     - Enable SSL with Let's Encrypt"
    echo "     - Configure your domain name"
    echo ""
    echo "  2. Test the application:"
    echo "     - Visit your domain in a browser"
    echo "     - Login with admin/secret"
    echo "     - Change the admin password immediately!"
    echo ""
    echo "  3. Setup monitoring (optional):"
    echo "     - Configure log aggregation"
    echo "     - Setup health check monitoring"
    echo "     - Configure backup verification"
    echo ""
fi
