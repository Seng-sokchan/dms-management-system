@echo off
setlocal

cd /d "%~dp0frontend"
if errorlevel 1 (
  echo Failed to locate frontend directory.
  exit /b 1
)

if not exist "node_modules" (
  echo Installing frontend dependencies...
  call npm install
  if errorlevel 1 exit /b 1
)

echo Starting frontend dev server...
call npm run dev

endlocal
