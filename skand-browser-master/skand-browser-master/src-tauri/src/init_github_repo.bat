@echo off
setlocal enabledelayedexpansion

:: Function to check if a command exists
:check_command
where %1 >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: %1 is not installed or not in PATH
    echo %2
    echo.
    pause
    exit /b 1
)
exit /b 0

:: Check prerequisites
echo Checking prerequisites...
call :check_command git "Please install Git from https://git-scm.com/downloads"
call :check_command gh "Please install GitHub CLI from https://cli.github.com/"

:: Verify GitHub authentication
gh auth status >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo You need to authenticate with GitHub first.
    echo Please run: gh auth login
    echo.
    pause
    exit /b 1
)

:: Get repository name from directory
for %%i in (.) do set "repo_name=%%~nxi"

:: Initialize git repository
git init

:: Create .gitignore with common exclusions
(
  echo # Python
  echo __pycache__/
  echo *.py[cod]
  echo *$py.class
  echo *.so
  echo .Python
  echo env/
  echo venv/
  echo .env
  echo .venv
  echo 
  echo # Node
  echo node_modules/
  echo npm-debug.log
  echo .npm
  echo 
  echo # IDE
  echo .vscode/
  echo .idea/
  echo *.swp
  echo *.swo
  echo 
  echo # OS generated files
  echo .DS_Store
  echo .DS_Store?
  echo ._*
  echo .Spotlight-V100
  echo .Trashes
  echo ehthumbs.db
  echo Thumbs.db
) > .gitignore

:: Add all files and make initial commit
git add .
git commit -m "Initial commit"

:: Rename default branch to main
git branch -M main

:: Get GitHub username
for /f "tokens=*" %%a in ('gh api user --jq .login') do set "github_username=%%a"

:: Create repository on GitHub
echo Creating repository on GitHub...
gh repo create "%repo_name%" --public --source=. --remote=origin

:: Push to GitHub
echo Pushing to GitHub...
git push -u origin main

:: Show success message
echo.
echo ===========================================
echo Repository successfully created and pushed!
echo.
echo Web URL: https://github.com/%github_username%/%repo_name%
echo Git URL: https://github.com/%github_username%/%repo_name%.git
echo ===========================================
echo.

pause