@echo off
REM ========================================================================
REM 🔮 PULL OLLAMA MODELS FOR TRUE AI INDEPENDENCE
REM ========================================================================
REM 
REM This script pulls all required models for the True AI Independence
REM configuration. Run this after the migration script.
REM 
REM Models to pull:
REM - llama3:70b-instruct-q4_0 (40GB) - General reasoning
REM - deepseek-coder:33b-instruct-q4_0 (20GB) - Code generation
REM - phi3:mini-4k-instruct-q4_0 (4GB) - Fast validation
REM - nomic-embed-text (500MB) - Local embeddings
REM 
REM Total: ~65GB storage required
REM ========================================================================

echo.
echo ╔══════════════════════════════════════════════════════════════════════╗
echo ║     🔮 PULLING OLLAMA MODELS FOR TRUE AI INDEPENDENCE                ║
echo ╚══════════════════════════════════════════════════════════════════════╝
echo.

echo 📦 Starting model downloads...
echo    Total storage required: ~65GB
echo.

REM Check if Ollama is running
echo ℹ️  Checking Ollama status...
timeout /t 2 /nobreak >nul

echo.
echo ⏳ Pulling models (this may take several minutes per model)...
echo.

REM Pull phi3 (smallest - 4GB)
echo [1/4] Pulling phi3:mini-4k-instruct-q4_0 (4GB)...
echo    Purpose: Fast validation and lightweight tasks
ollama pull phi3:mini-4k-instruct-q4_0
if %errorlevel% equ 0 (
    echo    ✅ phi3 pulled successfully!
) else (
    echo    ⚠️  phi3 pull failed - check Ollama is running
)

echo.

REM Pull nomic-embed-text (smallest - 500MB)
echo [2/4] Pulling nomic-embed-text (500MB)...
echo    Purpose: Local embeddings for semantic search
ollama pull nomic-embed-text
if %errorlevel% equ 0 (
    echo    ✅ nomic-embed-text pulled successfully!
) else (
    echo    ⚠️  nomic-embed-text pull failed
)

echo.

REM Pull deepseek-coder (medium - 20GB)
echo [3/4] Pulling deepseek-coder:33b-instruct-q4_0 (20GB)...
echo    Purpose: Code analysis and generation
ollama pull deepseek-coder:33b-instruct-q4_0
if %errorlevel% equ 0 (
    echo    ✅ deepseek-coder pulled successfully!
) else (
    echo    ⚠️  deepseek-coder pull failed
)

echo.

REM Pull llama3 (largest - 40GB)
echo [4/4] Pulling llama3:70b-instruct-q4_0 (40GB)...
echo    Purpose: General orchestration and reasoning
ollama pull llama3:70b-instruct-q4_0
if %errorlevel% equ 0 (
    echo    ✅ llama3 pulled successfully!
) else (
    echo    ⚠️  llama3 pull failed
)

echo.
echo ╔══════════════════════════════════════════════════════════════════════╗
echo ║                      DOWNLOAD COMPLETE                                 ║
echo ╚══════════════════════════════════════════════════════════════════════╝
echo.
echo ℹ️  Verify models are available:
echo    curl -s http://localhost:11434/api/tags
echo.
echo 🚀 Next steps:
echo    1. Run: npx tsx scripts/test_true_ai_independence.ts
echo    2. Start production: npx tsx swarm/core/loop.ts --production --continuous
echo.
pause
