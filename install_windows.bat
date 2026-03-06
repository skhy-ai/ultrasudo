@echo off
setlocal EnableExtensions DisableDelayedExpansion

echo ==========================================================
echo Installing Skand Browser Dependencies (Windows)
echo ==========================================================

echo.
echo [STEP 0] Running cleanup to ensure a fresh build environment...
powershell -NoProfile -ExecutionPolicy Bypass -Command "& { taskkill /f /im cargo.exe 2>$null; taskkill /f /im rustc.exe 2>$null; taskkill /f /im rust-analyzer.exe 2>$null; taskkill /f /im link.exe 2>$null; if (Test-Path 'src-tauri\target') { Remove-Item -Recurse -Force 'src-tauri\target' -ErrorAction SilentlyContinue }; if (Test-Path 'system-manager\target') { Remove-Item -Recurse -Force 'system-manager\target' -ErrorAction SilentlyContinue }; if (Test-Path 'dist') { Remove-Item -Recurse -Force 'dist' -ErrorAction SilentlyContinue }; Write-Host '[OK] Cleanup complete.' }"
if %ERRORLEVEL% neq 0 echo [WARN] Cleanup had warnings (safe to continue)

REM ---- Check Cargo ----
echo.
set CARGO_BIN=%USERPROFILE%\.cargo\bin\cargo.exe
cargo --version >nul 2>&1
if %ERRORLEVEL% equ 0 goto cargo_found
if exist "%CARGO_BIN%" goto cargo_in_profile

echo [INFO] Rust/Cargo not found. Downloading...
powershell -Command "Invoke-WebRequest -Uri https://win.rustup.rs/x86_64 -OutFile rustup-init.exe"
if not exist rustup-init.exe goto cargo_fail
rustup-init.exe -y
del rustup-init.exe
set "PATH=%USERPROFILE%\.cargo\bin;%PATH%"
echo [SUCCESS] Rust installed.
goto cargo_found

:cargo_in_profile
set "PATH=%USERPROFILE%\.cargo\bin;%PATH%"

:cargo_found
echo [INFO] Rust/Cargo is available.
goto msvc_check

:cargo_fail
echo [ERROR] Failed to download Rustup. Please install from https://rustup.rs/
exit /b 1

REM ---- Check MSVC ----
:msvc_check
echo.
echo [INFO] Checking for C++ Build Tools (MSVC)...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0check_msvc.ps1" > msvc_result.txt
set /p MSVC_STATUS=<msvc_result.txt
del msvc_result.txt >nul 2>&1

if /i "%MSVC_STATUS%"=="found" goto msvc_ok
echo [INFO] C++ Build Tools not found. Downloading (this may take a while)...
powershell -Command "Invoke-WebRequest -Uri https://aka.ms/vs/17/release/vs_BuildTools.exe -OutFile vs_BuildTools.exe"
if not exist vs_BuildTools.exe goto msvc_fail
start /wait "" vs_BuildTools.exe --quiet --wait --norestart --nocache --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended
del vs_BuildTools.exe
echo [SUCCESS] C++ Build Tools installed.
goto msvc_ok

:msvc_fail
echo [ERROR] Failed to download Visual Studio Build Tools.

:msvc_ok
echo [INFO] C++ Build Tools are installed.

REM ---- Check Node/NPM ----
:node_check
echo.
echo [INFO] Checking for Node.js / NPM...
where npm >nul 2>nul
if %ERRORLEVEL% equ 0 goto npm_found

if exist "C:\Program Files\nodejs\npm.cmd" (
    set "PATH=C:\Program Files\nodejs;%PATH%"
    goto npm_found
)

echo [INFO] Node.js not found. Downloading Node.js MSI...
powershell -Command "Invoke-WebRequest -Uri https://nodejs.org/dist/v20.11.1/node-v20.11.1-x64.msi -OutFile node-install.msi"
if not exist node-install.msi goto node_fail

echo [INFO] Installing Node.js silently (Please wait for the installer to finish)...
start /wait msiexec /i node-install.msi /qn
del node-install.msi
set "PATH=C:\Program Files\nodejs;%PATH%"

where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    if not exist "C:\Program Files\nodejs\npm.cmd" goto node_fail
)
echo [SUCCESS] Node.js installed.

:npm_found
echo [INFO] Installing NPM dependencies...
call npm install
echo [INFO] NPM dependencies installed successfully.

echo.
echo ==========================================================
echo Building Skand Browser with Incremental Compilation Disabled...
echo ==========================================================
set CARGO_INCREMENTAL=0
call npm.cmd run tauri:build
echo.
echo ==========================================================
echo [SUCCESS] Build completed. Check release/bundle folder!
echo ==========================================================
endlocal
goto :eof

:node_fail
echo [ERROR] Failed to install Node.js automatically.
echo Please manually install Node.js from https://nodejs.org/
endlocal
pause
exit /b 1


