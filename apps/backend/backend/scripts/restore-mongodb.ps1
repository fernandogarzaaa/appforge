# MongoDB Restore Script
# Restore from a backup archive

param(
    [Parameter(Mandatory=$true)]
    [string]$BackupFile,
    [string]$MongoUri = $env:MONGODB_URI,
    [switch]$Drop
)

$ErrorActionPreference = "Stop"

Write-Host "🔄 Starting MongoDB restore..." -ForegroundColor Cyan

# Verify backup file exists
if (!(Test-Path $BackupFile)) {
    Write-Host "❌ Backup file not found: $BackupFile" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Backup file: $BackupFile"
Write-Host "📊 File size: $([math]::Round((Get-Item $BackupFile).Length / 1MB, 2)) MB"

# Extract backup
$tempDir = Join-Path $env:TEMP "mongodb_restore_$(Get-Date -Format 'yyyyMMddHHmmss')"
Write-Host "📂 Extracting to temporary directory..."
Expand-Archive -Path $BackupFile -DestinationPath $tempDir -Force

# Find the backup directory
$backupDir = Get-ChildItem -Path $tempDir -Directory | Select-Object -First 1

if (!$backupDir) {
    Write-Host "❌ No backup directory found in archive" -ForegroundColor Red
    Remove-Item -Recurse -Force $tempDir
    exit 1
}

# Restore
try {
    $restoreArgs = @("--dir=`"$($backupDir.FullName)`"")
    
    if ($MongoUri) {
        $restoreArgs += "--uri=`"$MongoUri`""
    }
    
    if ($Drop) {
        $restoreArgs += "--drop"
        Write-Host "⚠️  DROP mode: Existing collections will be dropped!" -ForegroundColor Yellow
    }
    
    Write-Host "🔄 Running mongorestore..."
    $cmd = "mongorestore $($restoreArgs -join ' ')"
    Invoke-Expression $cmd
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Restore completed successfully!" -ForegroundColor Green
    } else {
        throw "mongorestore failed with exit code $LASTEXITCODE"
    }
} catch {
    Write-Host "❌ Restore failed: $_" -ForegroundColor Red
    exit 1
} finally {
    # Cleanup
    Write-Host "🧹 Cleaning up temporary files..."
    Remove-Item -Recurse -Force $tempDir
}

Write-Host ""
Write-Host "✅ Restore process completed!" -ForegroundColor Green
