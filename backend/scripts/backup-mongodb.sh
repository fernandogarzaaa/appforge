#!/bin/bash

# MongoDB Backup Script (Linux/macOS)
# Usage: ./backup-mongodb.sh

# Configuration
MONGO_URI="${MONGODB_URI:-mongodb://localhost:27017/appforge}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS=7
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="$BACKUP_DIR/$TIMESTAMP"

echo "🔄 Starting MongoDB backup..."
echo "Timestamp: $TIMESTAMP"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Run mongodump
if mongodump --uri="$MONGO_URI" --out="$BACKUP_PATH"; then
    echo "✅ Backup completed successfully!"
    
    # Compress backup
    ZIP_PATH="$BACKUP_PATH.tar.gz"
    tar -czf "$ZIP_PATH" -C "$BACKUP_DIR" "$TIMESTAMP"
    echo "✅ Compressed to: $ZIP_PATH"
    
    # Remove uncompressed backup
    rm -rf "$BACKUP_PATH"
    
    # Calculate size
    SIZE=$(du -h "$ZIP_PATH" | cut -f1)
    echo "📊 Backup size: $SIZE"
else
    echo "❌ Backup failed!"
    exit 1
fi

# Cleanup old backups
echo ""
echo "🧹 Cleaning up old backups (keeping last $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -name "*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete
echo "✅ Cleanup completed!"

echo ""
echo "✅ Backup process completed!"
echo "📁 All backups in: $BACKUP_DIR"
echo "Total backups: $(ls -1 $BACKUP_DIR/*.tar.gz 2>/dev/null | wc -l)"
