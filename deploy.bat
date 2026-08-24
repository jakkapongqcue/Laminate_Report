@echo off
echo ===================================================
echo   Laminate Report Deployment Copy Script
echo ===================================================

:: Define Source Paths (relative to script location)
set "FRONT_SRC=%~dp0frontend\dist"
set "BACK_SRC=%~dp0backend02"

:: Define Target Paths
set "FRONT_DST=D:\WebApp\LaminateReport\Front"
set "BACK_DST=D:\WebApp\LaminateReport\Back"

echo.
echo [1/2] Copying Frontend files...
echo From: %FRONT_SRC%
echo To:   %FRONT_DST%
if not exist "%FRONT_DST%" mkdir "%FRONT_DST%"
:: Using robocopy to copy/mirror the built files
robocopy "%FRONT_SRC%" "%FRONT_DST%" /E /R:3 /W:5
if %ERRORLEVEL% LSS 8 (
    echo Frontend copy completed successfully.
) else (
    echo [ERROR] Frontend copy failed. (Robocopy error level: %ERRORLEVEL%)
)

echo.
echo [2/2] Copying Backend files...
echo From: %BACK_SRC%
echo To:   %BACK_DST%
if not exist "%BACK_DST%" mkdir "%BACK_DST%"

:: Copy .env ONLY if it does not already exist in target (to prevent overwriting database credentials)
if not exist "%BACK_DST%\.env" (
    if exist "%BACK_SRC%\.env" (
        copy "%BACK_SRC%\.env" "%BACK_DST%\.env" >nul
        echo Default .env file copied to target.
    )
) else (
    echo Note: Existing .env in target found. Excluded from overwrite to protect database config.
)

:: Using robocopy to copy backend files, excluding node_modules, scratch, and .git directories, and excluding .env file (handled above)
robocopy "%BACK_SRC%" "%BACK_DST%" /E /XD "node_modules" "scratch" ".git" /XF ".env" /R:3 /W:5
if %ERRORLEVEL% LSS 8 (
    echo Backend copy completed successfully.
) else (
    echo [ERROR] Backend copy failed. (Robocopy error level: %ERRORLEVEL%)
)

echo.
echo ===================================================
echo   Deployment Copy Done!
echo ===================================================
pause
