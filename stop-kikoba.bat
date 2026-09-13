@echo off
title Simama - Mfumo wa Kikoba
color 4F
cls
echo.
echo  Inasimamisha mfumo wa Kikoba...
for /f "tokens=5" %%p in ('netstat -ano 2^>nul ^| findstr ":5000 " ^| findstr "LISTENING"') do (
    taskkill /PID %%p /F >nul 2>&1
)
taskkill /FI "WINDOWTITLE eq Kikoba Server*" /F >nul 2>&1
echo  Mfumo umesimama.
timeout /t 2 /nobreak >nul
