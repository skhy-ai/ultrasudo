@echo off
echo ==========================================
echo Starting Intuitive Simple Apps (Rust Core)
echo ==========================================

REM Check if Cargo is installed (Rust)
where cargo >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [INFO] Rust not found. Launching auto-installer...
    call install_windows.bat
    
    where cargo >nul 2>nul
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Please restart your terminal for Rust to take effect, then run start_windows.bat again.
        pause
        exit /b 1
    )
)

echo Checking System Manager build...
cd system-manager
cargo build --release
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Cargo build failed.
    pause
    exit /b 1
)
cd ..

echo.
echo Launching Skand Browser...
echo.

npm start

pause
