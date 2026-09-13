@echo off
title Unda Shortcut - Mfumo wa Kikoba
color 1F
cls

echo.
echo  Inaunda shortcut kwenye Desktop...

set "BAT=%~dp0start-kikoba.bat"
set "DESKTOP=%USERPROFILE%\Desktop"
set "SHORTCUT=%DESKTOP%\Mfumo wa Kikoba.lnk"

powershell -NoProfile -Command ^
  "$ws = New-Object -ComObject WScript.Shell;" ^
  "$sc = $ws.CreateShortcut('%SHORTCUT%');" ^
  "$sc.TargetPath = '%BAT%';" ^
  "$sc.WorkingDirectory = '%~dp0';" ^
  "$sc.WindowStyle = 1;" ^
  "$sc.Description = 'Anzisha Mfumo wa Kikoba';" ^
  "$sc.Save();"

if exist "%SHORTCUT%" (
    echo.
    echo  Imefaulu! Shortcut ipo kwenye Desktop yako:
    echo  "%SHORTCUT%"
    echo.
    echo  Bonyeza mara mbili kwenye Desktop kuanzisha mfumo.
) else (
    echo  Imeshindwa kuunda shortcut.
)

echo.
pause
