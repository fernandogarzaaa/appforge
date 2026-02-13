@echo off
TITLE AppForge Sovereign Swarm - V3 Unified Dashboard
color 0B

echo.
echo ════════════════════════════════════════════════════════════════════════
echo    🛡️ SOVEREIGN AI ECOSYSTEM - V3 UNIFIED DEPLOYMENT
echo ════════════════════════════════════════════════════════════════════════
echo.
echo 1. Launch Ecosystem (PM2)
echo 2. Enter Maintenance Mode (Warm-Restart)
echo 3. Exit Maintenance Mode (Resume)
echo 4. Monitor Ecosystem (PM2 Monit)
echo 5. Admin Command Center (Local Web)
echo 6. Sovereign Desktop App (Native)
echo 7. iPhone Remote Access (Mobile Tunnel)
echo 8. Stop All Processes
echo 9. Exit
echo.

set /p choice="Selection: "

if "%choice%"=="1" goto launch
if "%choice%"=="2" goto maint_on
if "%choice%"=="3" goto maint_off
if "%choice%"=="4" goto monitor
if "%choice%"=="5" goto scc_local
if "%choice%"=="6" goto scc_desktop
if "%choice%"=="7" goto scc_mobile
if "%choice%"=="8" goto stop_all
if "%choice%"=="9" exit

:launch
echo.
echo 🚀 Launching Sovereign Ecosystem...
npx tsx scripts/maintenance_mode.ts off
pm2 start ecosystem.sovereign.config.cjs
echo.
echo ✅ Deployment sequence initiated.
pause
goto :launch_menu

:maint_on
echo.
echo 🛑 Activating Maintenance Mode...
npx tsx scripts/maintenance_mode.ts on
echo.
echo 💡 Agents will perform a 'warm-restart' logout.
pause
goto :launch_menu

:maint_off
echo.
echo ✅ Deactivating Maintenance Mode...
npx tsx scripts/maintenance_mode.ts off
echo.
echo 🚀 Resuming autonomous operations...
pm2 restart all
pause
goto :launch_menu

:monitor
echo.
echo 📊 Opening PM2 Monitor...
pm2 monit
goto :launch_menu

:scc_local
echo.
echo 🖥️ Opening Local Command Center...
start http://localhost:5173/admin/sovereign
pause
goto :launch_menu

:scc_desktop
echo.
echo 🖥️ Launching Sovereign Desktop App...
npm run app:desktop
pause
goto :launch_menu

:scc_mobile
echo.
echo 📱 Preparing iPhone Remote Access...
echo.
echo 💡 INSTRUCTIONS:
echo 1. Keep this terminal open.
echo 2. Scan the QR code or visit the URL on your iPhone.
echo 3. Save to Home Screen for the full Sovereign experience.
echo.
echo 🚀 Starting Secure Tunnel...
npx localtunnel --port 5173
pause
goto :launch_menu

:stop_all
echo.
echo 🛑 Stopping all Sovereign processes...
pm2 stop ecosystem.sovereign.config.cjs
echo.
pause
goto :launch_menu

:launch_menu
cls
goto :eof
