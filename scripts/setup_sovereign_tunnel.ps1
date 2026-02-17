# SOVEREIGN TUNNEL AUTOMATION (SAFE MODE)
Write-Host "Starting Sovereign Tunnel Setup..." -ForegroundColor Cyan

# 1. Find cloudflared
$cloudflared = Get-Command "cloudflared" -ErrorAction SilentlyContinue
if (-not $cloudflared) {
    Write-Host "Cloudflared not found in PATH. Checking common locations..."
    if (Test-Path "C:\Program Files (x86)\cloudflared\cloudflared.exe") {
        $cloudflared = "C:\Program Files (x86)\cloudflared\cloudflared.exe"
    } elseif (Test-Path "C:\Program Files\cloudflared\cloudflared.exe") {
        $cloudflared = "C:\Program Files\cloudflared\cloudflared.exe"
    }
}

if (-not $cloudflared) {
    Write-Host "Installing cloudflared via Winget..." -ForegroundColor Yellow
    winget install Cloudflare.cloudflared
    Write-Host "Please restart your terminal after this script finishes if it fails next."
    $cloudflared = "cloudflared"
}

# 2. Install Deps
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing NPM dependencies..." -ForegroundColor Cyan
    cmd /c "npm install"
}

# 3. Start Bridge
Write-Host "Starting Neural Bridge..." -ForegroundColor Cyan
$p = Start-Process -FilePath "cmd.exe" -ArgumentList "/c npx tsx swarm/core/neural_bridge.ts" -PassThru -NoNewWindow
Start-Sleep -Seconds 5

# 4. Start Tunnel
Write-Host "Starting Tunnel..." -ForegroundColor Cyan
Write-Host "********************************************************"
Write-Host "COPY THE URL BELOW AND SET AS CHIMERA_CLOUD_URL"
Write-Host "********************************************************"

try {
    if ($cloudflared -eq $null) { $cloudflared = "cloudflared" }
    & $cloudflared tunnel --url http://localhost:8000
} finally {
    if ($p) { Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue }
}
