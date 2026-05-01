@echo off
setlocal

cd /d "%~dp0backend"
if errorlevel 1 (
  echo Failed to locate backend directory.
  exit /b 1
)

if not exist "node_modules" (
  echo Installing backend dependencies...
  call npm install
  if errorlevel 1 exit /b 1
)

echo Starting backend dev server...
call npm run dev

endlocal
