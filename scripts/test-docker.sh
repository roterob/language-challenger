#!/bin/bash
# =============================================================================
# Language Challenger - Local Docker Test
# =============================================================================
# This script tests the Docker build and deployment locally before production
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

log_info "Testing Docker build locally..."

# Check if .env exists
if [ ! -f .env ]; then
    log_warning ".env not found, creating from template..."
    cp .env.example .env
    JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|CHANGE_ME_TO_A_STRONG_RANDOM_SECRET|$JWT_SECRET|g" .env
    else
        sed -i "s|CHANGE_ME_TO_A_STRONG_RANDOM_SECRET|$JWT_SECRET|g" .env
    fi
    log_success ".env created"
fi

# Stop any running containers
log_info "Stopping any running containers..."
docker compose down 2>/dev/null || true

# Build
log_info "Building Docker images (this may take a few minutes)..."
docker compose build

# Start
log_info "Starting containers..."
docker compose up -d

# Wait for health check
log_info "Waiting for application to be healthy..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
        log_success "Application is healthy!"
        break
    fi
    
    attempt=$((attempt + 1))
    echo -n "."
    sleep 2
done

echo ""

if [ $attempt -eq $max_attempts ]; then
    log_error "Application did not become healthy"
    log_info "Showing logs:"
    docker compose logs --tail=50
    exit 1
fi

# Test endpoints
log_info "Testing endpoints..."

# Health check
HEALTH=$(curl -s http://localhost:3001/api/health)
if echo "$HEALTH" | grep -q "ok"; then
    log_success "✓ Health check passed"
else
    log_error "✗ Health check failed"
    exit 1
fi

# Login test
LOGIN=$(curl -s -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"secret"}')

if echo "$LOGIN" | grep -q "token"; then
    log_success "✓ Login test passed"
else
    log_error "✗ Login test failed"
    echo "$LOGIN"
    exit 1
fi

# Container status
log_info "Container status:"
docker compose ps

echo ""
log_success "=============================================="
log_success "Local Docker Test Completed Successfully!"
log_success "=============================================="
echo ""
log_info "Application is running at:"
echo "  - http://localhost:3001"
echo "  - http://localhost:3001/api/health"
echo ""
log_info "Test credentials:"
echo "  Username: admin"
echo "  Password: secret"
echo ""
log_info "Useful commands:"
echo "  View logs:    docker compose logs -f"
echo "  Stop:         docker compose down"
echo "  Shell:        docker compose exec app sh"
echo ""
log_warning "To stop the test environment, run:"
echo "  docker compose down"
echo ""
