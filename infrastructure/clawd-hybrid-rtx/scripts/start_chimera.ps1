# CHIMERA QUANTUM LLM - Production Startup Script
# This script ensures clean startup by clearing port 7860 if in use

param(
    [switch]$DevMode,
    [int]$Port = 7860,
    [string]$Host = "0.0.0.0"
)

$ErrorActionPreference = "Stop"

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] [$Level] $Message"
}

function Clear-Port {
    param([int]$PortToClear)
    
    Write-Log "Checking if port $PortToClear is in use..."
    
    try {
        $connections = Get-NetTCPConnection -LocalPort $PortToClear -ErrorAction SilentlyContinue
        if ($connections) {
            Write-Log "Port $PortToClear is occupied. Clearing..." "WARN"
            foreach ($conn in $connections) {
                try {
                    $process = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
                    if ($process) {
                        Write-Log "Stopping process: $($process.ProcessName) (PID: $($process.Id))" "WARN"
                        Stop-Process -Id $process.Id -Force
                    }
                } catch {
                    Write-Log "Could not stop process $($conn.OwningProcess): $_" "ERROR"
                }
            }
            Start-Sleep -Seconds 2
            Write-Log "Port $PortToClear cleared"
        } else {
            Write-Log "Port $PortToClear is available"
        }
    } catch {
        Write-Log "Port check completed (may already be available)"
    }
}

function Test-PythonModule {
    param([string]$ModuleName)
    
    try {
        $result = python -c "import $ModuleName; print('OK')" 2>&1
        return $result -eq "OK"
    } catch {
        return $false
    }
}

# Banner
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║          CHIMERA QUANTUM LLM - Production Startup            ║" -ForegroundColor Cyan
Write-Host "║              Quantum-Inspired Multi-Model Intelligence       ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check if running from correct directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$serverDir = Join-Path $scriptDir ".."
Set-Location $serverDir

Write-Log "Working directory: $(Get-Location)"

# Check Python installation
Write-Log "Checking Python installation..."
try {
    $pythonVersion = python --version 2>&1
    Write-Log "Python found: $pythonVersion"
} catch {
    Write-Log "Python not found. Please install Python 3.9+" "ERROR"
    exit 1
}

# Check required modules
Write-Log "Checking required Python modules..."
$requiredModules = @("fastapi", "uvicorn", "httpx", "numpy", "pydantic", "dotenv")
$missingModules = @()

foreach ($module in $requiredModules) {
    if (-not (Test-PythonModule $module)) {
        $missingModules += $module
    }
}

if ($missingModules.Count -gt 0) {
    Write-Log "Missing modules: $($missingModules -join ', ')" "WARN"
    Write-Log "Installing requirements..."
    try {
        pip install -r requirements.txt
        Write-Log "Requirements installed successfully"
    } catch {
        Write-Log "Failed to install requirements: $_" "ERROR"
        exit 1
    }
} else {
    Write-Log "All required modules are installed"
}

# Check environment file
if (-not (Test-Path ".env.clawd")) {
    Write-Log "Environment file .env.clawd not found" "WARN"
    if (Test-Path ".env.clawd.example") {
        Write-Log "Creating from example..."
        Copy-Item ".env.clawd.example" ".env.clawd"
        Write-Log "Please edit .env.clawd with your API keys" "WARN"
    }
}

# Clear port if in use
Clear-Port -PortToClear $Port

# Create data directory if needed
$dataDir = Join-Path $serverDir "data"
if (-not (Test-Path $dataDir)) {
    New-Item -ItemType Directory -Path $dataDir | Out-Null
    Write-Log "Created data directory"
}

# Create logs directory if needed
$logsDir = Join-Path $serverDir "logs"
if (-not (Test-Path $logsDir)) {
    New-Item -ItemType Directory -Path $logsDir | Out-Null
    Write-Log "Created logs directory"
}

# Start the server
Write-Log "Starting CHIMERA QUANTUM LLM server..."
Write-Log "Host: $Host, Port: $Port"
Write-Log "Mode: $(if ($DevMode) { 'Development' } else { 'Production' })"
Write-Host ""

$uvicornArgs = @(
    "-m", "uvicorn",
    "src.chimera_server:app",
    "--host", $Host,
    "--port", $Port
)

if ($DevMode) {
    $uvicornArgs += "--reload"
    Write-Log "Development mode: Auto-reload enabled"
}

try {
    Write-Log "Server starting... Press Ctrl+C to stop"
    Write-Host ""
    & python @uvicornArgs
} catch {
    Write-Log "Server error: $_" "ERROR"
    exit 1
}
