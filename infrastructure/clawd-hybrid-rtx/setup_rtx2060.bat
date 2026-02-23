@echo off
REM ============================================================================
REM Clawd Hybrid RTX 2060 Setup Script for Windows
REM Requires: NVIDIA GPU with CUDA support, Docker Desktop with WSL2
REM ============================================================================

setlocal EnableDelayedExpansion

echo.
echo  ╔═══════════════════════════════════════════════════════════════╗
echo  ║         CLAWD HYBRID RTX 2060 - Windows Setup                 ║
echo  ║         CUDA 11.8 Optimized Deployment                         ║
echo  ╚═══════════════════════════════════════════════════════════════╝
echo.

REM ----------------------------------------------------------------------------
REM Check Administrator Privileges
REM ----------------------------------------------------------------------------
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] This script requires Administrator privileges.
    echo Please right-click and select "Run as Administrator"
    pause
    exit /b 1
)

REM ----------------------------------------------------------------------------
REM Set Variables
REM ----------------------------------------------------------------------------
set "INSTALL_DIR=%~dp0"
set "PYTHON_VERSION=3.10.11"
set "CUDA_VERSION=11.8"
set "REQUIRED_VRAM=6144"

REM ----------------------------------------------------------------------------
REM Check Windows Version
REM ----------------------------------------------------------------------------
echo [1/8] Checking Windows version...
for /f "tokens=4-5 delims=. " %%i in ('ver') do set VERSION=%%i.%%j
if "%VERSION%" LSS "10.0" (
    echo [WARNING] Windows 10 or later is recommended for WSL2/Docker
)
echo     ^✓ Windows version check passed
echo.

REM ----------------------------------------------------------------------------
REM Check for NVIDIA GPU
REM ----------------------------------------------------------------------------
echo [2/8] Detecting NVIDIA GPU...
where nvidia-smi >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] nvidia-smi not found. Please install NVIDIA drivers.
    echo Download from: https://www.nvidia.com/Download/index.aspx
    pause
    exit /b 1
)

nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv,noheader > "%TEMP%\gpu_info.txt" 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Failed to query GPU information
    pause
    exit /b 1
)

set /p GPU_INFO=<"%TEMP%\gpu_info.txt"
del "%TEMP%\gpu_info.txt" 2>nul

echo     Detected GPU: %GPU_INFO%

REM Check for RTX 2060 or compatible
echo %GPU_INFO% | findstr /i "RTX 2060" >nul
if %errorlevel% equ 0 (
    echo     ^✓ RTX 2060 detected - Optimal configuration will be applied
) else (
    echo     ^! GPU is not RTX 2060 - Script will continue but may need manual tuning
)

REM Check VRAM
for /f "tokens=2 delims=," %%a in ("%GPU_INFO%") do (
    for /f "tokens=1 delims= " %%b in ("%%a") do set VRAM_MB=%%b
)
if defined VRAM_MB (
    if %VRAM_MB% LSS %REQUIRED_VRAM% (
        echo [WARNING] GPU has less than 6GB VRAM. Performance may be limited.
    ) else (
        echo     ^✓ VRAM sufficient: %VRAM_MB% MB
    )
)
echo.

REM ----------------------------------------------------------------------------
REM Check NVIDIA Driver Version
REM ----------------------------------------------------------------------------
echo [3/8] Checking NVIDIA drivers...
for /f "tokens=3 delims=," %%a in ("%GPU_INFO%") do set DRIVER_VERSION=%%a
for /f "tokens=1 delims=." %%a in ("%DRIVER_VERSION%") do set DRIVER_MAJOR=%%a

if %DRIVER_MAJOR% LSS 520 (
    echo [WARNING] Driver version %DRIVER_VERSION% may be outdated.
    echo Recommended: 520.00 or later for CUDA 11.8
    set /p CONTINUE="Continue anyway? (y/N): "
    if /i not "!CONTINUE!"=="y" exit /b 1
) else (
    echo     ^✓ Driver version: %DRIVER_VERSION%
)
echo.

REM ----------------------------------------------------------------------------
REM Check CUDA Installation
REM ----------------------------------------------------------------------------
echo [4/8] Checking CUDA installation...
where nvcc >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%a in ('nvcc --version ^| findstr "release"') do set CUDA_LINE=%%a
    echo     CUDA found: %CUDA_LINE%
) else (
    echo     CUDA toolkit not in PATH - will use Docker's CUDA runtime
)
echo.

REM ----------------------------------------------------------------------------
REM Check Docker Installation
REM ----------------------------------------------------------------------------
echo [5/8] Checking Docker installation...
where docker >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker not found. Please install Docker Desktop.
    echo Download from: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker daemon is not running
    echo Please start Docker Desktop and try again
    pause
    exit /b 1
)
echo     ^✓ Docker is installed and running

REM Check Docker Compose
docker compose version >nul 2>&1
if %errorlevel% equ 0 (
    echo     ^✓ Docker Compose V2 available
) else (
    docker-compose version >nul 2>&1
    if %errorlevel% neq 0 (
        echo [ERROR] Docker Compose not found
        pause
        exit /b 1
    )
)
echo.

REM ----------------------------------------------------------------------------
REM Check NVIDIA Docker Runtime
REM ----------------------------------------------------------------------------
echo [6/8] Checking NVIDIA Container Toolkit...
docker run --rm --gpus all nvidia/cuda:11.8.0-base-ubuntu22.04 nvidia-smi >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] NVIDIA Container Toolkit may not be configured
    echo Please ensure:
    echo   1. Docker Desktop Settings -^> General -^> "Use the WSL 2 based engine" is enabled
    echo   2. WSL2 integration is enabled for your distro
    echo   3. NVIDIA Container Toolkit is installed in WSL2
    echo.
    echo To install in WSL2:
    echo   wsl -d Ubuntu
    echo   sudo apt-get update
    echo   sudo apt-get install -y nvidia-container-toolkit
    echo   sudo nvidia-ctk runtime configure --runtime=docker
    echo   sudo systemctl restart docker
    echo.
    set /p CONTINUE="Continue anyway? (y/N): "
    if /i not "!CONTINUE!"=="y" exit /b 1
) else (
    echo     ^✓ NVIDIA Container Toolkit is working
)
echo.

REM ----------------------------------------------------------------------------
REM Check / Create Environment File
REM ----------------------------------------------------------------------------
echo [7/8] Checking environment configuration...
if not exist ".env" (
    if exist ".env.example" (
        echo     Creating .env from .env.example...
        copy /Y ".env.example" ".env" >nul
        echo     ^! IMPORTANT: Please edit .env file and add your API keys
    ) else (
        echo [WARNING] .env.example not found - creating minimal .env
        (
            echo # Clawd Hybrid RTX Configuration
            echo OPENAI_API_KEY=your_openai_key_here
            echo ANTHROPIC_API_KEY=your_anthropic_key_here
            echo HUGGINGFACE_TOKEN=your_hf_token_here
            echo GRAFANA_ADMIN_USER=admin
            echo GRAFANA_ADMIN_PASSWORD=admin
        ) > .env
    )
) else (
    echo     ^✓ .env file exists
)
echo.

REM ----------------------------------------------------------------------------
REM Create Required Directories
REM ----------------------------------------------------------------------------
echo [8/8] Creating directory structure...
if not exist "models" mkdir models
if not exist "cache" mkdir cache
if not exist "logs" mkdir logs
if not exist "metrics" mkdir metrics
if not exist "monitoring\prometheus" mkdir monitoring\prometheus
if not exist "monitoring\grafana\dashboards" mkdir monitoring\grafana\dashboards
if not exist "monitoring\grafana\datasources" mkdir monitoring\grafana\datasources
echo     ^✓ Directories created
echo.

REM ----------------------------------------------------------------------------
REM Build and Start
REM ----------------------------------------------------------------------------
echo ═══════════════════════════════════════════════════════════════
echo  BUILDING AND STARTING CLAWD HYBRID RTX 2060
echo ═══════════════════════════════════════════════════════════════
echo.

echo Building Docker images (this may take several minutes)...
docker compose build --no-cache
if %errorlevel% neq 0 (
    echo [ERROR] Docker build failed
    pause
    exit /b 1
)
echo     ^✓ Build completed
echo.

echo Starting services...
docker compose up -d
if %errorlevel% neq 0 (
    echo [ERROR] Failed to start services
    pause
    exit /b 1
)
echo.

REM ----------------------------------------------------------------------------
REM Display Status
REM ----------------------------------------------------------------------------
echo ═══════════════════════════════════════════════════════════════
echo  SETUP COMPLETE!
echo ═══════════════════════════════════════════════════════════════
echo.
echo Services are now running:
echo   - Clawd API:       http://localhost:8000
echo   - Health Check:    http://localhost:8000/health
echo   - Metrics (Prom):  http://localhost:9090
echo   - Dashboard:       http://localhost:3000  (admin/admin)
echo.
echo Useful commands:
echo   - View logs:       docker compose logs -f
echo   - Stop services:   docker compose down
echo   - Restart:         docker compose restart
echo   - GPU status:      docker compose exec clawd-hybrid nvidia-smi
echo.
echo Remember to edit .env file with your actual API keys!
echo.
pause
