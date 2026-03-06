@echo off
echo Git Update Script
echo =================

REM Check if we're in a Git repository
git status >nul 2>&1
if errorlevel 1 (
    echo Error: Not in a valid Git repository. Please ensure you're in the project root.
    pause
    exit /b 1
)

REM Ask for commit comment
set /p "commit_message=Enter commit message: "

REM Ask for branch name
set /p "branch_name=Enter branch name: "

REM Check if there are any changes to add
git diff --quiet HEAD
if not errorlevel 1 (
    git diff --cached --quiet
    if not errorlevel 1 (
        echo No changes to commit.
        goto push
    )
)

REM Add all files
echo Adding files...
git add *.html *.js *.json *.css *.py *.md *.txt *.bat *.sh *.jpeg  .gitignore

REM Commit with the provided message
if "%commit_message%"=="" (
    echo No commit message provided. Exiting.
    pause
    exit /b 1
)
git commit -m "%commit_message%"
if errorlevel 1 (
    echo Commit failed. Check for errors.
    pause
    exit /b 1
)

:push
REM Push to origin/branch_name
if "%branch_name%"=="" (
    echo No branch name provided. Exiting.
    pause
    exit /b 1
)
echo Pushing to origin/%branch_name%...
git push origin %branch_name%
if errorlevel 1 (
    echo Push failed. Check your branch and remote.
    pause
    exit /b 1
)

echo Git update completed successfully!
pause
