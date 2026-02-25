@echo off
title CHIMERA QUANTUM LLM
cd /d D:\appforge-main\infrastructure\clawd-hybrid-rtx
echo ========================================
echo   CHIMERA QUANTUM LLM v1.0
echo ========================================
echo.
echo Starting server on port 7860...
echo Press Ctrl+C to stop
echo.
python -m src
pause