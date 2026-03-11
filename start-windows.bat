@echo off
cd /d "%~dp0"

echo ========================================
echo   Lesson Record Analysis Tool
echo ========================================
echo.
echo Working Directory: %CD%
echo.

node -v >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed.
    echo Please install from https://nodejs.org/
    pause
    exit /b
)

echo Node.js version:
node -v
echo.

if not exist "node_modules\" (
    echo Installing dependencies...
    echo Please wait...
    echo.
    call npm install
    echo.
)

echo Starting server...
echo Open http://localhost:3000 in your browser
echo Press Ctrl+C to stop the server
echo.
echo ----------------------------------------

call npm run dev

pause
