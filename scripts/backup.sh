#!/bin/bash
# =============================================================================
# Language Challenger - Backup Script
# =============================================================================
# This script creates backups of the SQLite database
# Usage:
#   ./scripts/backup.sh              # Create backup
#   ./scripts/backup.sh --restore    # Restore from latest backup
#   ./scripts/backup.sh --restore <file> # Restore from specific backup
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
BACKUP_DIR="$APP_DIR/backups"
DATA_DIR="$APP_DIR/data"
DB_FILE="$DATA_DIR/database.sqlite"

# Backup retention (days)
RETENTION_DAYS=30

# Parse arguments
RESTORE_MODE=false
RESTORE_FILE=""

for arg in "$@"; do
    case $arg in
        --restore)
            RESTORE_MODE=true
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS] [FILE]"
            echo ""
            echo "Options:"
            echo "  --restore [FILE]  Restore database from backup (latest if no file specified)"
            echo "  --help            Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                                      # Create new backup"
            echo "  $0 --restore                            # Restore from latest backup"
            echo "  $0 --restore database.20240101_120000.sqlite  # Restore from specific backup"
            exit 0
            ;;
        *)
            if [ "$RESTORE_MODE" = true ] && [ -z "$RESTORE_FILE" ]; then
                RESTORE_FILE="$arg"
            fi
            ;;
    esac
done

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# =============================================================================
# RESTORE MODE
# =============================================================================
if [ "$RESTORE_MODE" = true ]; then
    log_info "Starting database restore..."
    
    # If no file specified, use the latest backup
    if [ -z "$RESTORE_FILE" ]; then
        RESTORE_FILE=$(ls -t "$BACKUP_DIR"/database.*.sqlite 2>/dev/null | head -n1)
        
        if [ -z "$RESTORE_FILE" ]; then
            log_error "No backup files found in $BACKUP_DIR"
            exit 1
        fi
        
        log_info "No backup file specified, using latest: $(basename "$RESTORE_FILE")"
    else
        # Check if file exists (try with and without path)
        if [ ! -f "$RESTORE_FILE" ]; then
            if [ -f "$BACKUP_DIR/$RESTORE_FILE" ]; then
                RESTORE_FILE="$BACKUP_DIR/$RESTORE_FILE"
            else
                log_error "Backup file not found: $RESTORE_FILE"
                exit 1
            fi
        fi
    fi
    
    # Confirm restore
    log_warning "This will replace the current database with: $(basename "$RESTORE_FILE")"
    read -p "Are you sure you want to continue? (yes/no): " -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        log_info "Restore cancelled"
        exit 0
    fi
    
    # Create a backup of current database before restoring
    if [ -f "$DB_FILE" ]; then
        SAFETY_BACKUP="$BACKUP_DIR/database.pre-restore.$(date +%Y%m%d_%H%M%S).sqlite"
        cp "$DB_FILE" "$SAFETY_BACKUP"
        log_info "Current database backed up to: $(basename "$SAFETY_BACKUP")"
    fi
    
    # Stop the application
    log_info "Stopping application..."
    cd "$APP_DIR"
    docker compose -f docker-compose.yml -f docker-compose.prod.yml down
    
    # Restore the database
    log_info "Restoring database..."
    cp "$RESTORE_FILE" "$DB_FILE"
    
    # Start the application
    log_info "Starting application..."
    docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
    
    log_success "Database restored successfully from: $(basename "$RESTORE_FILE")"
    log_info "Application is starting..."
    
    exit 0
fi

# =============================================================================
# BACKUP MODE
# =============================================================================
log_info "Starting database backup..."

# Check if database exists
if [ ! -f "$DB_FILE" ]; then
    log_error "Database file not found: $DB_FILE"
    exit 1
fi

# Get database size
DB_SIZE=$(du -h "$DB_FILE" | cut -f1)
log_info "Database size: $DB_SIZE"

# Create backup filename with timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/database.$TIMESTAMP.sqlite"

# Create backup
log_info "Creating backup: $(basename "$BACKUP_FILE")"
cp "$DB_FILE" "$BACKUP_FILE"

# Verify backup
if [ -f "$BACKUP_FILE" ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log_success "Backup created successfully: $BACKUP_FILE"
    log_info "Backup size: $BACKUP_SIZE"
else
    log_error "Failed to create backup"
    exit 1
fi

# Create a compressed copy for long-term storage
log_info "Compressing backup..."
gzip -c "$BACKUP_FILE" > "$BACKUP_FILE.gz"
COMPRESSED_SIZE=$(du -h "$BACKUP_FILE.gz" | cut -f1)
log_success "Compressed backup created: $BACKUP_FILE.gz"
log_info "Compressed size: $COMPRESSED_SIZE"

# =============================================================================
# Cleanup Old Backups
# =============================================================================
log_info "Cleaning up backups older than $RETENTION_DAYS days..."

# Find and delete old backups
DELETED_COUNT=0
while IFS= read -r old_backup; do
    if [ -f "$old_backup" ]; then
        rm "$old_backup"
        log_info "Deleted old backup: $(basename "$old_backup")"
        DELETED_COUNT=$((DELETED_COUNT + 1))
    fi
done < <(find "$BACKUP_DIR" -name "database.*.sqlite*" -type f -mtime +$RETENTION_DAYS)

if [ $DELETED_COUNT -eq 0 ]; then
    log_info "No old backups to delete"
else
    log_success "Deleted $DELETED_COUNT old backup(s)"
fi

# =============================================================================
# Summary
# =============================================================================
echo ""
log_success "=============================================="
log_success "Backup Completed Successfully!"
log_success "=============================================="
echo ""
log_info "Backup details:"
echo "  - Original size:   $DB_SIZE"
echo "  - Backup size:     $BACKUP_SIZE"
echo "  - Compressed size: $COMPRESSED_SIZE"
echo "  - Location:        $BACKUP_FILE"
echo ""
log_info "Total backups in $BACKUP_DIR:"
TOTAL_BACKUPS=$(find "$BACKUP_DIR" -name "database.*.sqlite" -type f | wc -l)
TOTAL_COMPRESSED=$(find "$BACKUP_DIR" -name "database.*.sqlite.gz" -type f | wc -l)
echo "  - Uncompressed: $TOTAL_BACKUPS"
echo "  - Compressed:   $TOTAL_COMPRESSED"
echo ""

# Calculate total backup size
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
log_info "Total backup directory size: $TOTAL_SIZE"

echo ""
log_info "To restore this backup, run:"
echo "  ./scripts/backup.sh --restore $(basename "$BACKUP_FILE")"
echo ""
