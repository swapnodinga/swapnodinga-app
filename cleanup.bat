@echo off
cd /d "d:\Swapno-Dinga"
echo === CLEANING UNTRACKED FILES ===
del rollback-clean.bat
del rollback-to-green.bat
del step1-check-status.bat
echo.
echo === GIT STATUS CLEAN ===
git status
pause
