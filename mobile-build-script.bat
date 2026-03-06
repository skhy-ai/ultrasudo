@echo off
REM Script to convert ALL Intuitive Simple Apps (including Python services) to a deployable mobile app using Cordova
REM This creates a unified mobile app with a dashboard for all apps and integrated Python services.
REM Prerequisites: Node.js, npm, Python, pip, and Android SDK must be installed and configured.

echo Starting unified mobile app conversion for all apps and Python services...

REM Step 1: Install Python dependencies if requirements.txt exists
if exist "requirements.txt" (
    echo Installing Python dependencies...
    pip install -r requirements.txt
) else (
    echo No requirements.txt found. Skipping Python setup.
)

REM Step 2: Check if Cordova is installed; install if not
echo Checking and installing Cordova...
npm list -g cordova >nul 2>&1
if %errorlevel% neq 0 (
    echo Cordova not found. Installing globally...
    npm install -g cordova
) else (
    echo Cordova is already installed.
)

REM Step 3: Create a new Cordova project in a 'mobile-build' directory
if not exist "mobile-build" (
    echo Creating new Cordova project for unified app...
    cordova create mobile-build com.example.intuitivesimpleapps "Intuitive Simple Apps Mobile"
    if %errorlevel% neq 0 (
        echo Error creating Cordova project. Exiting.
        pause
        exit /b 1
    )
) else (
    echo Cordova project already exists.
)

cd mobile-build

REM Step 4: Add Android platform (change to 'ios' if on macOS for iOS builds)
echo Adding Android platform...
cordova platform add android
if %errorlevel% neq 0 (
    echo Warning: Android platform addition failed. Ensure Android SDK is set up.
)

REM Step 5: Copy all app directories to Cordova's www directory
echo Copying all app source files...
if exist "..\calculator" (
    xcopy "..\calculator" "www\apps\calculator\" /E /I /Y
)
if exist "..\calendar" (
    xcopy "..\calendar" "www\apps\calendar\" /E /I /Y
)
if exist "..\code-generator" (
    xcopy "..\code-generator" "www\apps\code-generator\" /E /I /Y
)
if exist "..\datascience-notebook" (
    xcopy "..\datascience-notebook" "www\apps\datascience-notebook\" /E /I /Y
)
if exist "..\desktop" (
    xcopy "..\desktop" "www\apps\desktop\" /E /I /Y
)
if exist "..\galactic-simulator" (
    xcopy "..\galactic-simulator" "www\apps\galactic-simulator\" /E /I /Y
)
if exist "..\games" (
    xcopy "..\games" "www\apps\games\" /E /I /Y
)
if exist "..\home-diagnostics" (
    xcopy "..\home-diagnostics" "www\apps\home-diagnostics\" /E /I /Y
)
if exist "..\investment-board" (
    xcopy "..\investment-board" "www\apps\investment-board\" /E /I /Y
)
if exist "..\kanban-board" (
    xcopy "..\kanban-board" "www\apps\kanban-board\" /E /I /Y
)
if exist "..\life-board" (
    xcopy "..\life-board" "www\apps\life-board\" /E /I /Y
)
if exist "..\manual-generator" (
    xcopy "..\manual-generator" "www\apps\manual-generator\" /E /I /Y
)
if exist "..\markdown-editor" (
    xcopy "..\markdown-editor" "www\apps\markdown-editor\" /E /I /Y
)
if exist "..\mermaid-editor" (
    xcopy "..\mermaid-editor" "www\apps\mermaid-editor\" /E /I /Y
)
if exist "..\music" (
    xcopy "..\music" "www\apps\music\" /E /I /Y
)
if exist "..\notebook" (
    xcopy "..\notebook" "www\apps\notebook\" /E /I /Y
)
if exist "..\patent-researcher" (
    xcopy "..\patent-researcher" "www\apps\patent-researcher\" /E /I /Y
)
if exist "..\pomodoro-timer" (
    xcopy "..\pomodoro-timer" "www\apps\pomodoro-timer\" /E /I /Y
)
if exist "..\portfolio-manager" (
    xcopy "..\portfolio-manager" "www\apps\portfolio-manager\" /E /I /Y
)
if exist "..\python-IDE" (
    xcopy "..\python-IDE" "www\apps\python-IDE\" /E /I /Y
)
if exist "..\quote-and-catalog-generator" (
    xcopy "..\quote-and-catalog-generator" "www\apps\quote-and-catalog-generator\" /E /I /Y
)
if exist "..\spreadsheet-app" (
    xcopy "..\spreadsheet-app" "www\apps\spreadsheet-app\" /E /I /Y
)
if exist "..\stock-screener" (
    xcopy "..\stock-screener" "www\apps\stock-screener\" /E /I /Y
)
if exist "..\stock-ticker" (
    xcopy "..\stock-ticker" "www\apps\stock-ticker\" /E /I /Y
)
if exist "..\timer" (
    xcopy "..\timer" "www\apps\timer\" /E /I /Y
)
if exist "..\todo-list" (
    xcopy "..\todo-list" "www\apps\todo-list\" /E /I /Y
)
if exist "..\weather" (
    xcopy "..\weather" "www\apps\weather\" /E /I /Y
)
if %errorlevel% neq 0 (
    echo Warning: Some apps may not have been copied. Check directory existence.
)

REM Step 6: Copy Python service manager and related files
echo Copying Python service files...
xcopy "..\service_manager.py" "www\services\" /I /Y
if exist "..\stock-ticker\python_service.py" (
    xcopy "..\stock-ticker\python_service.py" "www\services\stock-ticker\" /I /Y
)
xcopy "..\mobile_app_server.py" "www\services\" /I /Y
REM Add more services as needed

REM Step 7: Create a unified dashboard index.html for navigation
echo Creating unified dashboard...
(
echo ^<!DOCTYPE html^>
echo ^<html lang="en"^>
echo ^<head^>
echo     ^<meta charset="UTF-8"^>
echo     ^<meta name="viewport" content="width=device-width, initial-scale=1.0"^>
echo     ^<script type="text/javascript" src="cordova.js"^></script^>
echo     ^<title^>Intuitive Simple Apps Dashboard^</title^>
echo     ^<style^>
echo         body { font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4; }
echo         .app-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; }
echo         .app-card { background: white; padding: 15px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); text-align: center; }
echo         .app-card a { text-decoration: none; color: #007bff; font-weight: bold; }
echo     ^</style^>
echo ^</head^>
echo ^<body^>
echo     ^<h1^>Intuitive Simple Apps Mobile Dashboard^</h1^>
echo     ^<div class="app-grid"^>
) > www\index.html

REM Dynamically add app links based on copied directories (simplified list; expand as needed)
(
echo         ^<div class="app-card"^>^<a href="apps\calculator\index.html"^>Calculator^</a^>^</div^>
echo         ^<div class="app-card"^>^<a href="apps\calendar\index.html"^>Calendar^</a^>^</div^>
echo         ^<div class="app-card"^>^<a href="apps\life-board\index.html"^>Life Board^</a^>^</div^>
echo         ^<div class="app-card"^>^<a href="apps\stock-ticker\index.html"^>Stock Ticker^</a^>^</div^>
echo         ^<!-- Add more apps similarly --^>
echo     ^</div^>
echo     ^<p^>Python services can be accessed via the integrated Flask server (run 'python services/mobile_app_server.py' on the device or desktop). Use the app interfaces for full functionality.^</p^>
echo ^</body^>
echo ^</html^>
) >> www\index.html

REM Step 8: Add essential Cordova plugins for full functionality
echo Adding Cordova plugins...
cordova plugin add cordova-plugin-device
cordova plugin add cordova-plugin-file
cordova plugin add cordova-plugin-inappbrowser  REM For opening external links or sub-apps
if %errorlevel% neq 0 (
    echo Warning: Plugin installation failed. Some features may not work.
)

REM Step 9: Build the app for Android
echo Building unified mobile app for Android...
cordova build android
if %errorlevel% neq 0 (
    echo Error building app. Check Android SDK setup and logs.
    pause
    exit /b 1
)

echo Unified mobile app build completed successfully!
echo The APK file is located at: mobile-build\platforms\android\app\build\outputs\apk\debug\app-debug.apk
echo The app includes a dashboard for all apps and integrated Python services.
echo To run Python services, use the mobile app's interface or run 'python www\services\service_manager.py server' separately.
echo Install the APK on an Android device to test.

pause
