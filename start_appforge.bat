@echo off
REM AppForge Launcher
REM Starts both backend and frontend

echo.
echo ========================================
echo   AppForge Launcher
echo ========================================
echo.

REM Check Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found. Please install Node.js 22+
    pause
    exit /b 1
)

echo [1/3] Starting Backend server...
start "AppForge Backend" cmd /c "cd /d D:\appforge-main\appforge\backend && node server.js"

timeout /t 3 /nobreak >nul

echo [2/3] Starting Frontend dev server...
start "AppForge Frontend" cmd /c "cd /d D:\appforge-main\appforge && npm run dev"

timeout /t 5 /nobreak >nul

echo [3/3] Building for production...
echo.
echo ========================================
echo   AppForge Ready!
echo ========================================
echo.
echo URLs:
echo   Frontend: http://localhost:5173
echo   Backend:   http://localhost:3000
echo.
echo To deploy to appforge.fun:
echo   1. Run: npm run build
echo   2. Deploy dist/ folder to hosting
echo.
pause
