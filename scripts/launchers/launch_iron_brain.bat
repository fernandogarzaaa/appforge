@echo off
TITLE Iron Brain — Local Inference Server
color 0B

echo.
echo ════════════════════════════════════════════════════════════════════════
echo    🧠 IRON BRAIN — LOCAL INFERENCE SERVER
echo ════════════════════════════════════════════════════════════════════════
echo.

:: Robust Root Detection
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"
cd ..\..
set "PROJECT_ROOT=%CD%"
cd /d "%PROJECT_ROOT%"

:: Enhancing PATH for DLL stability (Rustup + MSVC + MinGW/MSYS2)
set "MSVC_PATH=C:\Program Files\Microsoft Visual Studio\2022\BuildTools\VC\Tools\MSVC\14.42.34433\bin\Hostx64\x64"
set "RUSTUP_PATH=%USERPROFILE%\.cargo\bin"
set "PATH=%RUSTUP_PATH%;%MSVC_PATH%;%PATH%;C:\msys64\mingw64\bin;C:\msys64\usr\bin"

echo Starting AppForge-v1 on local hardware (RTX 2060)
echo Zero API costs. Zero network lag. Total sovereignty.
echo.

:: Model Configuration - IRON BRAIN PIVOT STRATEGY
:: Due to GGUF conversion tool incompatibilities, we are running the Base Model.
:: The DPO Adapter is saved at: swarm\factory\models\appforge-v1-dpo-lora
:: To enable fine-tuning, convert the adapter to GGUF and add: --lora swarm\factory\models\appforge-v1-dpo-lora.gguf

set "MODEL_PATH=swarm\factory\models\base\Llama-3.2-3B-Instruct-Q4_K_M.gguf"
set "PORT=8080"
set "N_GPU_LAYERS=35"
set "CTX_SIZE=8192"
set "THREADS=6"

:: Check if model exists
if not exist "%MODEL_PATH%" (
    echo.
    echo [ERROR] Model file not found: %MODEL_PATH%
    echo Please ensure the Base GGUF was downloaded successfully.
    echo.
    pause
    exit /b 1
)

REM Check for llama-server
where llama-server >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  llama-server not found in PATH.
    echo.
    echo Install llama.cpp:
    echo   Option A: Download from https://github.com/ggerganov/llama.cpp/releases
    echo   Option B: Build from source:
    echo     git clone https://github.com/ggerganov/llama.cpp
    echo     cd llama.cpp
    echo     cmake -B build -DGGML_CUDA=ON
    echo     cmake --build build --config Release
    echo.
    echo Then add the build directory to your PATH.
    pause
    exit /b 1
)

REM Find the GGUF model file
SET "GGUF_FILE=%MODEL_PATH%"

echo 🔧 Configuration:
echo    Model:    %GGUF_FILE%
echo    Port:     %PORT%
echo    GPU:      %N_GPU_LAYERS% layers offloaded
echo    Context:  %CTX_SIZE% tokens
echo    Threads:  %THREADS%
echo.

REM Kill any existing server on the port
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :%PORT% ^| findstr LISTENING') do (
    echo    Killing existing process on port %PORT% (PID: %%a)
    taskkill /F /PID %%a >nul 2>&1
)

echo ════════════════════════════════════════════════════════════════════════
echo    🚀 LAUNCHING IRON BRAIN...
echo ════════════════════════════════════════════════════════════════════════
echo.

REM Start llama-server with OpenAI-compatible API
llama-server ^
    -m "%GGUF_FILE%" ^
    --port %PORT% ^
    -ngl %N_GPU_LAYERS% ^
    -c %CTX_SIZE% ^
    -t %THREADS% ^
    --host 0.0.0.0 ^
    --log-disable

echo.
echo Iron Brain server stopped.
pause
