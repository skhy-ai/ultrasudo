@echo off
echo ==========================================================
echo Installing Intuitive Simple Apps Dependencies (Windows)
echo ==========================================================

REM Check if Cargo is installed
where cargo >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [INFO] Rust/Cargo not found. Downloading the Rust installer...
    
    REM Download rustup-init using PowerShell
    powershell -Command "Invoke-WebRequest -Uri https://win.rustup.rs/x86_64 -OutFile rustup-init.exe"
    
    if exist rustup-init.exe (
        echo [INFO] Executing Rustup installer. Please follow the prompts...
        rustup-init.exe -y
        del rustup-init.exe
        echo [SUCCESS] Rust installation complete. 
        echo [WARNING] IMPORTANT: You must RESTART this terminal/command prompt for the changes to take effect before running the app!
    ) else (
        echo [ERROR] Failed to download Rustup. Please install from https://rustup.rs/
    )
) else (
    echo [INFO] Rust/Cargo is already installed!
    
    echo.
    echo [INFO] Building the high-performance Rust System Manager ahead of time...
    cd system-manager
    cargo build --release
    cd ..
)

echo.
echo [INFO] Checking Node.js and NPM...
where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] NPM not found. Skand Browser requires Node.js.
    echo Please install Node.js from https://nodejs.org/ and then re-run this installer.
    pause
    exit /b 1
) else (
    echo [INFO] Installing NPM dependencies for Skand Browser Chromium Layer...
    npm install
)

echo.
echo ==========================================================
echo Installation Scripts Complete.
echo If Rust was just installed, please restart your command prompt, then run start_windows.bat
echo ==========================================================
pause
