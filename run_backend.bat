@echo off
title Laminate Report - FastAPI Backend
echo ===================================================
echo Starting FastAPI Backend Service...
echo ===================================================
cd /d "%~dp0backend"

:: Check for python or py command availability
set PYTHON_CMD=python
where python >nul 2>nul
if %errorlevel% neq 0 (
    where py >nul 2>nul
    if %errorlevel% equ 0 (
        set PYTHON_CMD=py
    ) else (
        echo [ERROR] Python is not recognized in system PATH!
        echo Please install Python and check "Add Python to PATH".
        pause
        exit /b 1
    )
)

if not exist venv (
    echo [INFO] Creating Python virtual environment using %PYTHON_CMD%...
    %PYTHON_CMD% -m venv venv
    if %errorlevel% neq 0 (
        echo [WARNING] venv creation failed. Running with global Python...
    )
)

if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
    echo [INFO] Virtual Environment activated successfully.
)

echo [INFO] Installing/Checking Python dependencies...
pip install -q -r requirements.txt

echo [INFO] Starting Uvicorn API server on http://localhost:8000 ...
%PYTHON_CMD% -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause
