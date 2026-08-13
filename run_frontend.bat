@echo off
title Laminate Report - Vue 3 Frontend
echo ===================================================
echo Starting Vue 3 Frontend Dev Server...
echo ===================================================
cd /d "%~dp0frontend"

if not exist node_modules (
    echo [INFO] Installing npm packages...
    npm install
)

echo [INFO] Starting Vite dev server on http://localhost:3000 ...
npm run dev
pause
