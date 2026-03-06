@echo off
echo ==========================================================
echo Skand Browser - Build Cleanup / Repair Tool
echo ==========================================================
echo.

echo [STEP 1] Killing any zombie cargo/rust-analyzer processes...
taskkill /f /im cargo.exe >nul 2>&1
taskkill /f /im rustc.exe >nul 2>&1
taskkill /f /im rust-analyzer.exe >nul 2>&1
taskkill /f /im link.exe >nul 2>&1
echo [OK] Processes terminated (or were not running).

echo.
echo [STEP 2] Removing src-tauri build artifacts...
if exist "src-tauri\target" (
    powershell -Command "Remove-Item -Recurse -Force 'src-tauri\target' -ErrorAction SilentlyContinue"
    echo [OK] src-tauri\target removed.
) else (
    echo [SKIP] src-tauri\target does not exist.
)

echo.
echo [STEP 3] Removing system-manager build artifacts...
if exist "system-manager\target" (
    powershell -Command "Remove-Item -Recurse -Force 'system-manager\target' -ErrorAction SilentlyContinue"
    echo [OK] system-manager\target removed.
) else (
    echo [SKIP] system-manager\target does not exist.
)

echo.
echo [STEP 4] Removing frontend dist artifacts...
if exist "dist" (
    powershell -Command "Remove-Item -Recurse -Force 'dist' -ErrorAction SilentlyContinue"
    echo [OK] dist\ removed.
) else (
    echo [SKIP] dist\ does not exist.
)

echo.
echo ==========================================================
echo Cleanup complete. You can now run .\install_windows.bat
echo ==========================================================
if /i "%1"=="nopause" goto :eof
pause
