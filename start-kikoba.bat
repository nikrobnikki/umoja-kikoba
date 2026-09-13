@echo off
setlocal EnableDelayedExpansion
title UMOJA KIKOBA — Mfumo wa Kikoba
color 1F
cls

echo.
echo  ============================================================
echo    UMOJA KIKOBA — Mfumo wa Kikoba
echo    Toleo la Mtandao — Network Edition
echo  ============================================================
echo.

:: ── Check Node.js ────────────────────────────────────────────────────────────
where node >nul 2>&1
if errorlevel 1 (
    color 4F
    echo  [HITILAFU] Node.js haipatikani kwenye kompyuta hii.
    echo  Pakua Node.js kutoka: https://nodejs.org
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node -v 2^>nul') do set NODE_VER=%%v
echo  Node.js %NODE_VER% imepatikana.

:: ── Paths ────────────────────────────────────────────────────────────────────
set "ROOT=%~dp0"
set "SERVER=%ROOT%server"
set "CLIENT=%ROOT%client"
set "PORT=5000"

:: ── Detect LAN IP automatically ──────────────────────────────────────────────
set "LAN_IP=localhost"
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr /i "IPv4" ^| findstr /v "127.0.0.1" ^| findstr /v "169.254"') do (
    for /f "tokens=1" %%j in ("%%i") do (
        if not defined LAN_IP_SET (
            set "LAN_IP=%%j"
            set "LAN_IP_SET=1"
        )
    )
)

:: ── Kill any previous instances on port 5000 ─────────────────────────────────
echo  Inafunga mifumo ya zamani kwenye port %PORT%...
for /f "tokens=5" %%p in ('netstat -ano 2^>nul ^| findstr ":%PORT% " ^| findstr "LISTENING"') do (
    taskkill /PID %%p /F >nul 2>&1
)
timeout /t 1 /nobreak >nul

:: ── Install dependencies if needed ───────────────────────────────────────────
if not exist "%SERVER%\node_modules" (
    echo  [1/2] Inasakinisha vitegemezi vya seva ^(mara ya kwanza tu^)...
    pushd "%SERVER%"
    call npm install --silent 2>nul
    popd
    echo        Imekamilika.
)
if not exist "%CLIENT%\node_modules" (
    echo  [2/2] Inasakinisha vitegemezi vya programu ^(mara ya kwanza tu^)...
    pushd "%CLIENT%"
    call npm install --silent 2>nul
    popd
    echo        Imekamilika.
)

:: ── Build React production bundle (if dist missing or older than src) ─────────
if not exist "%CLIENT%\dist\index.html" (
    echo  Inajenga programu ya React...
    pushd "%CLIENT%"
    call npx vite build 2>nul
    popd
    echo  Imejengwa.
)

:: ── Update server CORS to allow LAN access ───────────────────────────────────
echo  Inasasisha mipangilio ya mtandao...
set "CORS_LINE=CORS_ORIGIN=http://localhost:%PORT%,http://%LAN_IP%:%PORT%,http://localhost:3000,http://localhost:3001"
set "ENV_FILE=%SERVER%\.env"

:: Rewrite CORS_ORIGIN in .env
powershell -NoProfile -Command ^
  "$f='%ENV_FILE%';" ^
  "$c=Get-Content $f -Raw;" ^
  "$new='%CORS_LINE%';" ^
  "$c=$c -replace 'CORS_ORIGIN=.*',($new.Replace('\','\\'));" ^
  "Set-Content $f $c -Encoding UTF8;"

:: ── Start backend ─────────────────────────────────────────────────────────────
echo.
echo  Inaanzisha seva...
start "Kikoba Server [port %PORT%]" /D "%SERVER%" cmd /k ^
  "color 2F && title Kikoba Server [port %PORT%] && node index.js"

:: Wait for server to be ready
echo  Inasubiri seva ianze...
:WAIT_LOOP
timeout /t 2 /nobreak >nul
curl -s http://localhost:%PORT%/api/health >nul 2>&1
if errorlevel 1 goto WAIT_LOOP
echo  Seva iko hai!

:: ── Auto login and open browser ───────────────────────────────────────────────
echo.
echo  Inafungua kivinjari...
powershell -NoProfile -Command ^
  "$port='%PORT%';" ^
  "$lanip='%LAN_IP%';" ^
  "$r=try{Invoke-RestMethod -Method POST \"http://localhost:$port/api/auth/login\" -ContentType 'application/json' -Body '{\"username\":\"admin\",\"password\":\"admin123\"}' -EA Stop}catch{$null};" ^
  "if($r -and $r.token){" ^
  "  $t=$r.token;$id=$r.user.id;$un=$r.user.username;$role=$r.user.role;" ^
  "  $html=\"<!DOCTYPE html><html><head><meta charset='UTF-8'><title>Kikoba</title><style>*{box-sizing:border-box}body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#111827}.b{text-align:center;padding:32px 40px;border-radius:16px;background:#1e2433;box-shadow:0 8px 32px rgba(0,0,0,.5);max-width:440px;width:90%}.logo{width:80px;height:80px;margin:0 auto 16px;border-radius:50%;background:radial-gradient(circle at 40% 35%,#fff0a0,#c8941c,#7a4e00);display:flex;align-items:center;justify-content:center;font-family:Georgia,serif;font-weight:900;font-size:22px;color:#fff8dc;box-shadow:0 4px 16px rgba(200,148,28,.4)}h2{color:#f1f5f9;margin:0 0 6px;font-size:18px}p{color:#94a3b8;margin:0 0 4px;font-size:13px}.url{margin-top:14px;background:#0f172a;border-radius:8px;padding:10px 14px;font-family:monospace;font-size:12px;color:#fbbf24;border:1px solid #334155}</style></head><body><div class='b'><div class='logo'>KK</div><h2>Inaingia kama $un...</h2><p>Mfumo wa Kikoba unafunguka</p><div class='url'>http://localhost:$port</div></div><script>var u={id:'$id',username:'$un',role:'$role',type:'officer'};localStorage.setItem('kikoba_token','$t');localStorage.setItem('kikoba_user',JSON.stringify(u));localStorage.setItem('kikoba_admin',JSON.stringify(u));setTimeout(function(){location.href='http://localhost:$port'},1000);</script></body></html>\";" ^
  "  $f=[System.IO.Path]::GetTempFileName()+'.html';" ^
  "  [System.IO.File]::WriteAllText($f,$html,[System.Text.Encoding]::UTF8);" ^
  "  Start-Process $f" ^
  "}else{Start-Process \"http://localhost:$port\"}"

:: ── Display connection info ───────────────────────────────────────────────────
echo.
echo  ============================================================
echo   MFUMO UNAENDESHA SASA!
echo.
echo   Kompyuta hii:
echo     http://localhost:%PORT%
echo.
echo   Vifaa vingine kwenye mtandao huo:
echo     http://%LAN_IP%:%PORT%
echo.
echo   Akaunti ya msimamizi:
echo     Jina    : admin
echo     Nenosiri: admin123
echo.
echo   MUHIMU: Vifaa vingine lazima viwe kwenye
echo   mtandao (Wi-Fi) huo huo kama kompyuta hii.
echo.
echo   Funga dirisha hili KUSIMAMISHA seva.
echo  ============================================================
echo.
pause
endlocal
