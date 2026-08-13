@echo off
title Laminate Checking Report Launcher
echo ===================================================
echo   LAMINATE CHECKING REPORT - SYSTEM LAUNCHER
echo ===================================================
echo.
echo [1/3] Launching Backend Service (FastAPI)...
start "Laminate Report Backend" cmd /k "%~dp0run_backend.bat"

echo [2/3] Waiting for Backend initialization...
timeout /t 3 /nobreak >nul

echo [3/3] Launching Frontend Server (Vue 3 Vite)...
start "Laminate Report Frontend" cmd /k "%~dp0run_frontend.bat"

echo.
echo Waiting for services to become ready...
timeout /t 3 /nobreak >nul

echo.
echo Opening Web Application in Default Browser...
start http://localhost:3000

echo ===================================================
echo System started successfully!
echo Close the opened command windows to stop the servers.
echo ===================================================
pause
