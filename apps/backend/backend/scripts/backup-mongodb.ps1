# MongoDB Automated Backup Script
# Runs daily backups with rotation

param(
    [string]$MongoUri = $env:MONGODB_URI,
    [string]$BackupDir = ".\backups",
    [int]$RetentionDays = 7
)

$ErrorActionPreference = "Stop"

# Configuration
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupPath = Join-Path $BackupDir $timestamp

Write-Host "🔄 Starting MongoDB backup..." -ForegroundColor Cyan
Write-Host "Timestamp: $timestamp"

# Create backup directory
if (!(Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
    Write-Host "✅ Created backup directory: $BackupDir"
}

# Run mongodump
try {
    if ($MongoUri) {
        Write-Host "📦 Running mongodump with connection string..."
        & mongodump --uri="$MongoUri" --out="$backupPath" 2>&1 | Write-Host
    } else {
        Write-Host "📦 Running mongodump on localhost..."
        & mongodump --out="$backupPath" 2>&1 | Write-Host
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Backup completed successfully!" -ForegroundColor Green
        Write-Host "Location: $backupPath"
        
        # Compress backup
        $zipPath = "$backupPath.zip"
        Compress-Archive -Path $backupPath -DestinationPath $zipPath -Force
        Write-Host "✅ Compressed to: $zipPath"
        
        # Remove uncompressed backup
        Remove-Item -Recurse -Force $backupPath
        
        # Calculate backup size
        $size = (Get-Item $zipPath).Length / 1MB
        Write-Host "📊 Backup size: $([math]::Round($size, 2)) MB"
    } else {
        throw "mongodump failed with exit code $LASTEXITCODE"
    }
} catch {
    Write-Host "❌ Backup failed: $_" -ForegroundColor Red
    exit 1
}

# Cleanup old backups
Write-Host ""
Write-Host "🧹 Cleaning up old backups (keeping last $RetentionDays days)..."
$cutoffDate = (Get-Date).AddDays(-$RetentionDays)
$removed = 0

Get-ChildItem -Path $BackupDir -Filter "*.zip" | ForEach-Object {
    if ($_.LastWriteTime -lt $cutoffDate) {
        Remove-Item $_.FullName -Force
        Write-Host "  🗑️  Removed old backup: $($_.Name)"
        $removed++
    }
}

if ($removed -eq 0) {
    Write-Host "  ✅ No old backups to remove"
} else {
    Write-Host "  ✅ Removed $removed old backup(s)"
}

Write-Host ""
Write-Host "✅ Backup process completed!" -ForegroundColor Green
Write-Host "📁 All backups in: $BackupDir"
Write-Host "Total backups: $((Get-ChildItem -Path $BackupDir -Filter '*.zip').Count)"
