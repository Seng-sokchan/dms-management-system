@echo off
setlocal

set "ROOT=%~dp0"

start "DMS Backend" cmd /k "cd /d \"%ROOT%backend\" && if not exist node_modules (npm install) && npm run dev"
start "DMS Frontend" cmd /k "cd /d \"%ROOT%frontend\" && if not exist node_modules (npm install) && npm run dev"

echo Backend and frontend are starting in separate windows.

endlocal
