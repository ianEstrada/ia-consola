@echo off
rem ia.cmd - start/stop/status de tu IA local (Tailscale + Ollama + Open WebUI + auto-busqueda)
rem Uso:  ia start | ia stop | ia status
rem Todo se lanza OCULTO y DESACOPLADO de la consola (via launch-hidden.vbs):
rem cerrar la terminal NO afecta a la IA.

if /i "%1"=="start"   goto start
if /i "%1"=="stop"    goto stop
if /i "%1"=="status"  goto status
echo Uso: ia start ^| ia stop ^| ia status
exit /b

:start
echo [1/4] Tailscale...
"%ProgramFiles%\Tailscale\tailscale.exe" up
timeout /t 3 /nobreak >nul
wscript.exe "%~dp0launch-hidden.vbs" "%ProgramFiles%\Tailscale\tailscale-ipn.exe"
echo [2/4] Ollama (fondo)...
netstat -ano | findstr ":11434" | findstr "LISTENING" >nul && echo   ya estaba ON || wscript.exe "%~dp0launch-hidden.vbs" "%LocalAppData%\Programs\Ollama\ollama.exe" "serve"
echo [3/4] Open WebUI (fondo oculto)...
netstat -ano | findstr ":8080" | findstr "LISTENING" >nul && echo   ya estaba ON || wscript.exe "%~dp0launch-hidden.vbs" "open-webui" "serve"
echo [4/4] Auto-busqueda (proxy 9099)...
netstat -ano | findstr ":9099" | findstr "LISTENING" >nul && echo   ya estaba ON || wscript.exe "%~dp0launch-hidden.vbs" "%USERPROFILE%\pipelines-env\Scripts\python.exe" "%USERPROFILE%\pipelines-env\auto_search_proxy.py"
echo.
echo Lista: http://localhost:8080  -  todo en segundo plano (cerrar terminal no lo apaga)
exit /b

:stop
taskkill /F /IM open-webui.exe >nul 2>&1
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0kill-proxy.ps1"
taskkill /F /IM ollama.exe >nul 2>&1
"%ProgramFiles%\Tailscale\tailscale.exe" down
taskkill /F /IM tailscale-ipn.exe >nul 2>&1
echo Todo detenido.
exit /b

:status
netstat -ano | findstr ":11434" | findstr "LISTENING" >nul && echo Ollama         : ON || echo Ollama         : OFF
netstat -ano | findstr ":8080"  | findstr "LISTENING" >nul && echo Open WebUI     : ON || echo Open WebUI     : OFF
netstat -ano | findstr ":9099"  | findstr "LISTENING" >nul && echo Auto-busqueda  : ON || echo Auto-busqueda  : OFF
"%ProgramFiles%\Tailscale\tailscale.exe" status >nul 2>&1 && echo Tailscale      : ON || echo Tailscale      : OFF
exit /b
