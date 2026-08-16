@echo off
rem ia.cmd — start/stop/status de tu IA local (Tailscale + Ollama + Open WebUI)
rem Uso:  ia start | ia stop | ia status

if /i "%1"=="start"   goto start
if /i "%1"=="stop"    goto stop
if /i "%1"=="status"  goto status
echo Uso: ia start ^| ia stop ^| ia status
exit /b

:start
echo [1/3] Tailscale...
"%ProgramFiles%\Tailscale\tailscale.exe" up
if errorlevel 1 echo   ^> Necesitas login la primera vez: abri la URL que imprime arriba
echo [2/3] Ollama...
start "" "%LocalAppData%\Programs\Ollama\ollama app.exe"
echo [3/3] Open WebUI...
start "Open WebUI" open-webui serve
echo.
echo Lista: http://localhost:8080
exit /b

:stop
taskkill /F /IM open-webui.exe >nul 2>&1
taskkill /F /IM "ollama app.exe" >nul 2>&1
taskkill /F /IM ollama.exe >nul 2>&1
"%ProgramFiles%\Tailscale\tailscale.exe" down
echo Todo detenido.
exit /b

:status
netstat -ano | findstr ":11434" | findstr "LISTENING" >nul && echo Ollama      : ON || echo Ollama      : OFF
netstat -ano | findstr ":8080"  | findstr "LISTENING" >nul && echo Open WebUI  : ON || echo Open WebUI  : OFF
"%ProgramFiles%\Tailscale\tailscale.exe" status >nul 2>&1 && echo Tailscale   : ON || echo Tailscale   : OFF
exit /b
