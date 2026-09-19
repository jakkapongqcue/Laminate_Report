@echo off
title Laminate Report - Node.js Express Backend
echo ===================================================
echo Starting Node.js Express Backend Service...
echo ===================================================
cd /d "%~dp0backend"

:: Check for node command availability
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not recognized in system PATH!
    echo Please install Node.js and try again.
    pause
    exit /b 1
)

if not exist node_modules (
    echo [INFO] Installing npm packages...
    call npm install
)

echo [INFO] Starting Node.js API server on http://localhost:8000 ...
call npm start
pause