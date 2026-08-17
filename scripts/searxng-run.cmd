@echo off
rem searxng-run.cmd - lanza SearXNG OCULTO y DESACOPLADO de la consola (via launch-hidden.vbs).
rem Log a %USERPROFILE%\searxng\logs\searxng.log - bind 127.0.0.1:8888 (settings.yml).
set "SEARXNG_SETTINGS_PATH=%USERPROFILE%\searxng\settings.yml"
cd /d "%USERPROFILE%\searxng"
if not exist "%USERPROFILE%\searxng\logs" mkdir "%USERPROFILE%\searxng\logs"
"%USERPROFILE%\searxng\.venv\Scripts\python.exe" -m searx.webapp >> "%USERPROFILE%\searxng\logs\searxng.log" 2>&1