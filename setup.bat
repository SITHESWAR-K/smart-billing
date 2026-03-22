@echo off
echo ========================================
echo Smart Billing Frontend Setup
echo ========================================

cd /d "%~dp0"

echo.
echo Running setup scripts...
echo.

node run_setup.js

if %errorlevel% neq 0 (
    echo.
    echo Error running setup. Make sure Node.js is installed.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Installing dependencies...
echo ========================================

cd frontend
call npm install

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo To start the development server, run:
echo   cd frontend
echo   npm run dev
echo.
pause
