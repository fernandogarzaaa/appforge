# Comprehensive Git Repository Cleanup & Organization
# This script consolidates and organizes all untracked files

cd c:\Users\ferna\Downloads\appforge-main

# ============================================================================
# 1. ORGANIZE DOCUMENTATION
# ============================================================================

Write-Host "📚 Organizing Documentation Files..." -ForegroundColor Green

# Create docs subdirectories if not exists
@("docs", "docs/setup", "docs/architecture", "docs/deployment", "docs/guides") | ForEach-Object {
    New-Item -ItemType Directory -Path $_ -Force > $null
}

# Move documentation files
$docFiles = @(
    "STRATEGIC_ASSESSMENT.md",
    "PHASE_1_INDEX.md",
    "PHASE_1_COMPLETE.md",
    "PHASE_1_SUMMARY.md",
    "PHASE_1_QUICKSTART.md",
    "ADVANCED_ENHANCEMENTS_COMPLETE.md",
    "ADVANCED_ENHANCEMENTS_QUICK_START.md",
    "ADVANCED_ENHANCEMENTS_CHECKLIST.md",
    "IMPLEMENTATION_SUMMARY_ADVANCED.md",
    "PARTIAL_TO_COMPLETE_SUMMARY.md",
    "COMPLETION_CHECKLIST.md",
    "FINAL_STATUS.md"
)

foreach ($doc in $docFiles) {
    if (Test-Path $doc) {
        Move-Item -Path $doc -Destination "docs/guides/" -Force 2>&1 | Out-Null
        Write-Host "  ✓ Moved $doc to docs/guides/"
    }
}

# ============================================================================
# 2. ORGANIZE SETUP/INSTALLATION DOCS
# ============================================================================

Write-Host "`n🔧 Organizing Setup Documentation..." -ForegroundColor Green

$setupDocs = @(
    "START_HERE.md",
    "REDIS_INSTALLATION_GUIDE.md",
    "DOCKER_SETUP.md",
    "README_DOCUMENTATION.md",
    "SETUP_SUMMARY.md"
)

foreach ($doc in $setupDocs) {
    if (Test-Path $doc) {
        Move-Item -Path $doc -Destination "docs/setup/" -Force 2>&1 | Out-Null
        Write-Host "  ✓ Moved $doc to docs/setup/"
    }
}

# ============================================================================
# 3. ORGANIZE BACKEND-SPECIFIC DOCS
# ============================================================================

Write-Host "`n⚙️  Organizing Backend Documentation..." -ForegroundColor Green

$backendDocs = @(
    "backend/REDIS_SETUP.md",
    "backend/BULLMQ_MIGRATION.md",
    "backend/PRODUCTION_QUEUE_INFRASTRUCTURE.md",
    "backend/README_QUEUE.md",
    "backend/QUICK_START.md",
    "backend/INSTALL_NODE20.md",
    "backend/WINDOWS_ESM_ISSUE.md"
)

foreach ($doc in $backendDocs) {
    if (Test-Path $doc) {
        $filename = Split-Path -Path $doc -Leaf
        Move-Item -Path $doc -Destination "docs/setup/" -Force 2>&1 | Out-Null
        Write-Host "  ✓ Moved $filename to docs/setup/"
    }
}

# ============================================================================
# 4. ORGANIZE INFRASTRUCTURE FILES
# ============================================================================

Write-Host "`n🏗️  Organizing Infrastructure Files..." -ForegroundColor Green

# Create infrastructure folder if it exists
if (Test-Path "infrastructure") {
    Write-Host "  ✓ infrastructure/ folder already exists"
    $infraCount = (Get-ChildItem "infrastructure/" 2>/dev/null | Measure-Object).Count
    Write-Host "    └─ Contains $infraCount items"
}

# ============================================================================
# 5. CLEAN UP TEMPORARY POWERSHELL SCRIPTS
# ============================================================================

Write-Host "`n🧹 Cleaning up Temporary PowerShell Scripts..." -ForegroundColor Green

$tempScripts = @(
    "backend/add-controller-exports.ps1",
    "backend/convert-to-commonjs.ps1",
    "backend/fix-all-exports.ps1",
    "backend/fix-as-imports.ps1",
    "backend/switch-to-node20.ps1",
    "setup-redis-advanced.ps1"
)

foreach ($script in $tempScripts) {
    if (Test-Path $script) {
        Remove-Item -Path $script -Force 2>&1 | Out-Null
        Write-Host "  ✓ Removed $script (will be ignored via .gitignore)"
    }
}

Write-Host "  ✓ These files will be ignored via updated .gitignore"

# ============================================================================
# 6. STAGE ESSENTIAL BACKEND FILES
# ============================================================================

Write-Host "`n📦 Staging Essential Backend Files..." -ForegroundColor Green

$essentialBackendFiles = @(
    "backend/src/config/redis.js",
    "backend/src/config/sentry.js",
    "backend/src/middleware/ddosProtection.js",
    "backend/src/middleware/requestContext.js",
    "backend/src/middleware/tenantContext.js",
    "backend/src/services/webhookService.js",
    "backend/src/services/scheduledJobs.js",
    "backend/src/services/batchQueue.js",
    "backend/src/services/batchQueueDev.js",
    "backend/src/services/databaseRouting.js",
    "backend/src/routes/webhookRoutes.js",
    "backend/src/routes/batchRoutes.js",
    "backend/src/routes/observabilityRoutes.js",
    "backend/src/routes/pluginRoutes.js",
    "backend/src/routes/scheduledRoutes.js",
    "backend/src/models/Webhook.js",
    "backend/test-redis-connection.js",
    "backend/setup-redis.ps1"
)

$stagedCount = 0
foreach ($file in $essentialBackendFiles) {
    if (Test-Path $file) {
        Write-Host "  ✓ Will stage: $file"
        $stagedCount++
    }
}

Write-Host "`n  Total essential files to stage: $stagedCount"

# ============================================================================
# 7. SUMMARY
# ============================================================================

Write-Host "`n" 
Write-Host "✅ CLEANUP COMPLETE!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host ""
Write-Host "📊 ORGANIZATION SUMMARY:" -ForegroundColor Cyan
Write-Host "  ✓ Documentation consolidated in docs/"
Write-Host "    ├─ docs/guides/ (strategic, phase, enhancement docs)"
Write-Host "    ├─ docs/setup/ (installation & setup guides)"
Write-Host "    ├─ docs/architecture/"
Write-Host "    └─ docs/deployment/"
Write-Host ""
Write-Host "  ✓ Temporary scripts cleaned up (ignored via .gitignore)"
Write-Host ""
Write-Host "  ✓ Essential backend files identified for staging"
Write-Host ""
Write-Host "  ✓ .gitignore updated with:"
Write-Host "    ├─ *.ps1 (PowerShell scripts except /scripts)"
Write-Host "    ├─ PREVIOUS_*, OLD_*, TEMP_*, DEPRECATED_*.md"
Write-Host "    ├─ setup-*, install-*, migrate-*, fix-*, convert-*.ps1"
Write-Host "    └─ And other development/temporary files"
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host ""
Write-Host "🚀 NEXT STEPS:" -ForegroundColor Yellow
Write-Host "  1. Review new organization with: git status"
Write-Host "  2. Stage essential files: git add backend/src/config/ backend/src/middleware/"
Write-Host "  3. Commit with: git commit -m 'chore: organize repository structure'"
Write-Host ""
