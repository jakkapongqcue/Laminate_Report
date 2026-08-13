@echo off
REM ====================================================================
REM NSSM Windows Service Installer Script for FastAPI (Laminate Report)
REM Run this script as Administrator on the Target Windows Server
REM ====================================================================

SET SERVICE_NAME=LaminateReportAPI
SET PYTHON_EXE=C:\Python311\python.exe
SET APP_DIR=C:\inetpub\wwwroot\LaminateReport\backend
SET NSSM_EXE=C:\nssm\nssm.exe

echo Installing Service: %SERVICE_NAME% ...

%NSSM_EXE% stop %SERVICE_NAME%
%NSSM_EXE% remove %SERVICE_NAME% confirm

%NSSM_EXE% install %SERVICE_NAME% "%PYTHON_EXE%" "-m uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 4"
%NSSM_EXE% set %SERVICE_NAME% AppDirectory "%APP_DIR%"
%NSSM_EXE% set %SERVICE_NAME% DisplayName "Laminate Report FastAPI Service"
%NSSM_EXE% set %SERVICE_NAME% Description "Backend API for Laminate Checking Report System"
%NSSM_EXE% set %SERVICE_NAME% Start SERVICE_AUTO_START
%NSSM_EXE% set %SERVICE_NAME% AppStdout "%APP_DIR%\logs\stdout.log"
%NSSM_EXE% set %SERVICE_NAME% AppStderr "%APP_DIR%\logs\stderr.log"

echo Starting Service %SERVICE_NAME%...
%NSSM_EXE% start %SERVICE_NAME%

echo Service installation complete! Check status using 'nssm status %SERVICE_NAME%'
pause
