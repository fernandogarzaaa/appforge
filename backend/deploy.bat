@echo off
REM AppForge Backend Quick Deploy Script for Windows
REM Wave 1 Build - Production Ready

setlocal enabledelayedexpansion
set "GREEN=[92m"
set "BLUE=[94m"
set "YELLOW=[93m"
set "NC=[0m"

echo.
echo !BLUE!🚀 AppForge Backend Deployment!NC!
echo ================================

REM Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo !YELLOW!❌ Node.js not found. Install Node.js v16+!NC!
    exit /b 1
)

REM Check PostgreSQL
where psql >nul 2>nul
if %errorlevel% neq 0 (
    echo !YELLOW!⚠️ PostgreSQL not found in PATH. Make sure it's running.!NC!
)

echo !BLUE![1/6]!NC! Changing to backend directory...
cd backend || (
    echo !YELLOW!❌ backend directory not found!NC!
    exit /b 1
)

echo !BLUE![2/6]!NC! Setting up environment...
if not exist .env (
    echo Creating .env from .env.example...
    copy .env.example .env >nul
    echo !YELLOW!⚠️ Update .env with your configuration!NC!
    echo   - DATABASE_URL
    echo   - JWT_SECRET
    echo   - OPENAI_API_KEY
)

echo !BLUE![3/6]!NC! Installing dependencies...
call npm install --production >nul 2>nul
if %errorlevel% neq 0 (
    echo !YELLOW!⚠️ npm install encountered issues!NC!
)

echo !BLUE![4/6]!NC! Setting up database...
call npm run migrate >nul 2>nul
if %errorlevel% neq 0 (
    echo !YELLOW!⚠️ Migration may have already run!NC!
)
call npm run seed >nul 2>nul
if %errorlevel% neq 0 (
    echo !YELLOW!⚠️ Database may already be seeded!NC!
)

echo !BLUE![5/6]!NC! Starting server...
start npm start

echo !BLUE![6/6]!NC! Waiting for server startup...
timeout /t 3 /nobreak >nul

echo.
echo ================================
echo !GREEN!✅ DEPLOYMENT STARTED!NC!
echo ================================
echo.
echo 📍 API Server: http://localhost:5000
echo 📖 Documentation: http://localhost:5000/api-docs
echo 💓 Health Check: http://localhost:5000/health
echo.
echo 🔑 Get JWT Token:
echo   curl -X POST http://localhost:5000/api/auth/test-token ^
echo     -H "Content-Type: application/json" ^
echo     -d "{"userId": 1, "email": "test@appforge.fun"}"
echo.
echo 🧪 Test AI Endpoint:
echo   curl -X POST http://localhost:5000/api/ai/generate-code ^
echo     -H "Content-Type: application/json" ^
echo     -H "Authorization: Bearer YOUR_TOKEN" ^
echo     -d "{"description": "Hello world", "language": "javascript"}"
echo.
echo Server is running in a new window.
echo.
pause
