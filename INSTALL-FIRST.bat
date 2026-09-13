@echo off
title Sakinisha - UMOJA KIKOBA
color 1F
cls

echo.
echo  ============================================================
echo    UMOJA KIKOBA — Usakinishaji wa Kwanza
echo    Hii itafanya kazi MARA YA KWANZA tu.
echo  ============================================================
echo.

:: Check Node.js
where node >nul 2>&1
if errorlevel 1 (
    color 4F
    echo  [HITILAFU] Node.js haipatikani!
    echo.
    echo  Hatua za kusakinisha Node.js:
    echo  1. Nenda: https://nodejs.org
    echo  2. Pakua "LTS" version
    echo  3. Sakinisha na ubonyeze "Next" mara zote
    echo  4. Reboot kompyuta yako
    echo  5. Rudi na uendelee na INSTALL-FIRST.bat tena
    echo.
    start https://nodejs.org
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node -v') do set NODE_VER=%%v
echo  [OK] Node.js %NODE_VER% imepatikana.
echo.

set "ROOT=%~dp0"
set "SERVER=%ROOT%server"
set "CLIENT=%ROOT%client"

echo  [1/3] Inasakinisha vitegemezi vya seva...
pushd "%SERVER%"
call npm install
if errorlevel 1 (
    echo  [HITILAFU] Usakinishaji wa seva umeshindwa!
    pause
    exit /b 1
)
popd
echo  [OK] Seva imekamilika.
echo.

echo  [2/3] Inasakinisha vitegemezi vya programu...
pushd "%CLIENT%"
call npm install
if errorlevel 1 (
    echo  [HITILAFU] Usakinishaji wa programu umeshindwa!
    pause
    exit /b 1
)
popd
echo  [OK] Programu imekamilika.
echo.

echo  [3/3] Inajenga programu ya React...
pushd "%CLIENT%"
call npx vite build
if errorlevel 1 (
    echo  [HITILAFU] Ujenzi wa React umeshindwa!
    pause
    exit /b 1
)
popd
echo  [OK] React imejengwa.
echo.

:: Create Desktop shortcut
set "SHORTCUT=%USERPROFILE%\Desktop\Anza Kikoba.lnk"
powershell -NoProfile -Command ^
  "$ws=New-Object -ComObject WScript.Shell;" ^
  "$sc=$ws.CreateShortcut('%SHORTCUT%');" ^
  "$sc.TargetPath='%ROOT%start-kikoba.bat';" ^
  "$sc.WorkingDirectory='%ROOT%';" ^
  "$sc.WindowStyle=1;" ^
  "$sc.Description='Anza Mfumo wa Kikoba';" ^
  "$sc.Save();"

echo  ============================================================
echo   USAKINISHAJI UMEKAMILIKA!
echo.
echo   Sasa unaweza:
echo   1. Bonyeza "Anza Kikoba" kwenye Desktop
echo      -- au --
echo   2. Endesha start-kikoba.bat moja kwa moja
echo.
echo   Akaunti ya awali:
echo     Jina    : admin
echo     Nenosiri: admin123
echo  ============================================================
echo.
pause
