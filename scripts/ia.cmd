@echo off
rem ia.cmd — start/stop/status de tu IA local (Tailscale + Ollama + Open WebUI)
rem Uso:  ia start | ia stop | ia status
rem Todo se lanza en SEGUNDO PLANO (oculto) — cerrar terminales no afecta la IA.

if /i "%1"=="start"   goto start
if /i "%1"=="stop"    goto stop
if /i "%1"=="status"  goto status
echo Uso: ia start ^| ia stop ^| ia status
exit /b

:start
echo [1/3] Tailscale...
"%ProgramFiles%\Tailscale\tailscale.exe" up
timeout /t 3 /nobreak >nul
powershell -NoProfile -Command "Start-Process -FilePath '%ProgramFiles%\Tailscale\tailscale-ipn.exe' -WindowStyle Hidden -RedirectStandardOutput '%USERPROFILE%\Documents\IA-Personal\tailscale.log' -RedirectStandardError '%USERPROFILE%\Documents\IA-Personal\tailscale.err'"
echo [2/3] Ollama (fondo)...
netstat -ano | findstr ":11434" | findstr "LISTENING" >nul && echo   ya estaba ON || powershell -NoProfile -Command "Start-Process -FilePath '%LocalAppData%\Programs\Ollama\ollama.exe' -ArgumentList 'serve' -WindowStyle Hidden"
echo [3/3] Open WebUI (fondo oculto)...
netstat -ano | findstr ":8080" | findstr "LISTENING" >nul && echo   ya estaba ON || powershell -NoProfile -Command "Start-Process -FilePath 'open-webui' -ArgumentList 'serve' -WindowStyle Hidden -RedirectStandardOutput '%USERPROFILE%\Documents\IA-Personal\owu.log' -RedirectStandardError '%USERPROFILE%\Documents\IA-Personal\owu.log.err'"
echo.
echo Lista: http://localhost:8080  -  todo corriendo en segundo plano
exit /b

:stop
taskkill /F /IM open-webui.exe >nul 2>&1
taskkill /F /IM ollama.exe >nul 2>&1
"%ProgramFiles%\Tailscale\tailscale.exe" down
taskkill /F /IM tailscale-ipn.exe >nul 2>&1
echo Todo detenido.
exit /b

:status
netstat -ano | findstr ":11434" | findstr "LISTENING" >nul && echo Ollama      : ON || echo Ollama      : OFF
netstat -ano | findstr ":8080"  | findstr "LISTENING" >nul && echo Open WebUI  : ON || echo Open WebUI  : OFF
"%ProgramFiles%\Tailscale\tailscale.exe" status >nul 2>&1 && echo Tailscale   : ON || echo Tailscale   : OFF
exit /b
