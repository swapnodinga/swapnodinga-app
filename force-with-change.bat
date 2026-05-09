@echo off
cd /d "d:\Swapno-Dinga"
echo === ADDING FAKE CHANGE ===
echo. >> .gitignore
echo # Force push trigger >> .gitignore
echo.
echo === COMMITTING CHANGE ===
git add .gitignore
git commit -m "Force push trigger"
echo.
echo === PUSHING TO GITHUB ===
git push origin main
echo.
echo === DONE ===
pause
