#!/bin/bash
set -e

# MongoDB Backup Script
# Run daily via cron: 0 2 * * * /path/to/backup-mongodb.sh

BACKUP_DIR="/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="$BACKUP_DIR/backup_$DATE"

echo "Starting MongoDB backup..."

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Run mongodump
docker exec appforge-mongodb mongodump --out /backup/dump_$DATE

# Copy from container to host
docker cp appforge-mongodb:/backup/dump_$DATE "$BACKUP_PATH"

# Compress backup
tar -czf "$BACKUP_PATH.tar.gz" -C "$BACKUP_DIR" "backup_$DATE"
rm -rf "$BACKUP_PATH"

# Remove backups older than 30 days
find "$BACKUP_DIR" -name "backup_*.tar.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_PATH.tar.gz"
