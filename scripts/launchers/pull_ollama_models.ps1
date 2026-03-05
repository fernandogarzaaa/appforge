#!/usr/bin/env pwsh
# ========================================================================
# 🔮 PULL OLLAMA MODELS FOR TRUE AI INDEPENDENCE (PowerShell)
# ========================================================================
#
# This script pulls all required models for True AI Independence.
# Run this after running the migration script.
#
# Models:
# - llama3:70b-instruct-q4_0 (40GB) - Reasoning
# - deepseek-coder:33b-instruct-q4_0 (20GB) - Code
# - phi3:mini-4k-instruct-q4_0 (4GB) - Fast
# - nomic-embed-text (500MB) - Embeddings
#
# Total: ~65GB storage required
# ========================================================================

$ErrorActionPreference = "Continue"

Write-Host "`n═══════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🔮 PULLING OLLAMA MODELS FOR TRUE AI INDEPENDENCE" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Host "📦 Total storage required: ~65GB`n" -ForegroundColor Yellow

# Find Ollama executable
$ollamaPaths = @(
    "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe",
    "$env:ProgramFiles\Ollama\ollama.exe",
    "$env:ProgramFiles (x86)\Ollama\ollama.exe",
    "$env:USERPROFILE\.ollama\ollama.exe"
)

$ollamaExe = $null
foreach ($path in $ollamaPaths) {
    if (Test-Path $path) {
        $ollamaExe = $path
        Write-Host "✅ Found Ollama at: $path" -ForegroundColor Green
        break
    }
}

if (-not $ollamaExe) {
    Write-Host "⚠️  Ollama executable not found. Trying direct curl commands..." -ForegroundColor Yellow
    $useCurl = $true
} else {
    $useCurl = $false
}

function Pull-Model {
    param([string]$ModelName, [string]$Size, [string]$Purpose)
    
    Write-Host "[$($script:counter)/4] Pulling $ModelName ($Size)..." -ForegroundColor Cyan
    Write-Host "   Purpose: $Purpose" -ForegroundColor Gray
    
    if ($useCurl) {
        # Pull using curl to Ollama API
        $body = @{name = $ModelName} | ConvertTo-Json
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:11434/api/pull" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 300
            Write-Host "   ✅ $ModelName pulled successfully!" -ForegroundColor Green
        } catch {
            Write-Host "   ⚠️  $ModelName pull failed. Is Ollama running?" -ForegroundColor Red
            Write-Host "      Error: $($_.Exception.Message)" -ForegroundColor Gray
        }
    } else {
        & $ollamaExe pull $ModelName
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ $ModelName pulled successfully!" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  $ModelName pull failed." -ForegroundColor Red
        }
    }
    $script:counter++
}

$script:counter = 1

# Pull models in order (smallest first)
Pull-Model -ModelName "phi3:mini-4k-instruct-q4_0" -Size "4GB" -Purpose "Fast validation and lightweight tasks"
Write-Host ""

Pull-Model -ModelName "nomic-embed-text" -Size "500MB" -Purpose "Local embeddings for semantic search"
Write-Host ""

Pull-Model -ModelName "deepseek-coder:33b-instruct-q4_0" -Size "20GB" -Purpose "Code analysis and generation"
Write-Host ""

Pull-Model -ModelName "llama3:70b-instruct-q4_0" -Size "40GB" -Purpose "General orchestration and reasoning"
Write-Host ""

Write-Host "`n═══════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ DOWNLOAD COMPLETE" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Host "📋 Next steps:" -ForegroundColor White
Write-Host "   1. Verify models: curl -s http://localhost:11434/api/tags" -ForegroundColor Gray
Write-Host "   2. Test independence: npx tsx scripts/test_true_ai_independence.ts" -ForegroundColor Gray
Write-Host "   3. Start production: npx tsx swarm/core/loop.ts --production --continuous" -ForegroundColor Gray
Write-Host ""
