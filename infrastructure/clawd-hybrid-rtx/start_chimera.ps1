# CHIMERA QUANTUM Auto-Start Script
# Run this to start CHIMERA QUANTUM with auto-restart on crash

$ErrorActionPreference = "Continue"
$ProjectDir = "D:\appforge-main\infrastructure\clawd-hybrid-rtx"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CHIMERA QUANTUM LLM - Auto-Restart" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Set-Location $ProjectDir

while ($true) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    # Check and kill any process using port 7860
    $portInUse = Get-NetTCPConnection -LocalPort 7860 -ErrorAction SilentlyContinue
    if ($portInUse) {
        $processIds = $portInUse | Select-Object -ExpandProperty OwningProcess | Sort-Object -Unique
        foreach ($procId in $processIds) {
            if ($procId -and $procId -ne $null) {
                try {
                    Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
                } catch {}
            }
        }
        Write-Host "[$timestamp] Cleared port 7860 (killed process(es): $($processIds -join ', '))." -ForegroundColor Magenta
        Start-Sleep -Seconds 2
    }
    Write-Host "[$timestamp] Starting CHIMERA QUANTUM..." -ForegroundColor Green
    $process = Start-Process -FilePath "python" -ArgumentList "-m", "src" -NoNewWindow -PassThru
    # Wait for process to exit
    $process.WaitForExit()
    $exitCode = $process.ExitCode
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    if ($exitCode -eq 0) {
        Write-Host "[$timestamp] CHIMERA QUANTUM stopped gracefully. Restarting in 3 seconds..." -ForegroundColor Yellow
    } else {
        Write-Host "[$timestamp] CHIMERA QUANTUM crashed (exit code: $exitCode). Restarting in 5 seconds..." -ForegroundColor Red
        Start-Sleep -Seconds 5
    }
    Start-Sleep -Seconds 3
}