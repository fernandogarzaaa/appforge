@echo off
title 🦁🐍🐐 Sovereign Brain Uplink
cd /d "%~dp0"
echo Starting Operation Chimera...
powershell -ExecutionPolicy Bypass -File scripts/setup_sovereign_tunnel.ps1
pause
