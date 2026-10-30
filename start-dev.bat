@echo off
rem start-dev.bat: starts the backend + Expo for local testing.
rem   double-click for the menu, or skip it: start-dev web | wifi | usb | emulator | api | check
rem   add "clear" to wipe Expo's cache first: start-dev web clear
rem backend uses backend\.env, which points at the real Supabase DB, so test with test accounts.

setlocal EnableExtensions
set "ROOT=%~dp0"
set "API=http://localhost:3000"
cd /d "%ROOT%"

rem ---------- checks ----------
where node >nul 2>&1 || (echo [x] Node.js isn't installed or isn't on PATH. & goto :fail)
if not exist "backend\.env" (
  echo [x] backend\.env is missing. Copy backend\.env.example to backend\.env and fill it in.
  goto :fail
)
if not exist "backend\node_modules" (echo [..] Installing backend packages... & pushd backend & call npm install & popd)
if not exist "frontend\node_modules" (echo [..] Installing frontend packages... & pushd frontend & call npm install & popd)

rem ---------- pick a mode ----------
set "MODE=%~1"
set "CLEAR="
if /i "%~1"=="clear" (set "MODE=" & set "CLEAR=1")
if /i "%~2"=="clear" set "CLEAR=1"
if defined MODE goto :mode_set

echo.
echo  NYIT Club Center - local dev
echo  ----------------------------
echo   1  Web browser (fastest)
echo   2  Phone on the same Wi-Fi (Expo Go, scan the QR code)
echo   3  Android phone over USB (any network)
echo   4  Android emulator
echo   5  Backend only
echo   6  Quick checks (type-check, no servers)
echo.
choice /c 123456 /n /m "Pick 1-6: "
set "PICK=%errorlevel%"
if "%PICK%"=="1" set "MODE=web"
if "%PICK%"=="2" set "MODE=wifi"
if "%PICK%"=="3" set "MODE=usb"
if "%PICK%"=="4" set "MODE=emulator"
if "%PICK%"=="5" set "MODE=api"
if "%PICK%"=="6" set "MODE=check"
if "%MODE%"=="check" goto :mode_set
if "%MODE%"=="api" goto :mode_set
choice /c yn /n /m "Clear Expo's cache first? Only needed if changes aren't showing up (y/n): "
if "%errorlevel%"=="1" set "CLEAR=1"

:mode_set
for %%m in (web wifi usb emulator api check) do if /i "%MODE%"=="%%m" goto :mode_ok
echo [x] Unknown mode "%MODE%". Use: web, wifi, usb, emulator, api, or check.
goto :fail
:mode_ok

if /i "%MODE%"=="check" goto :check

rem ---------- backend ----------
curl -sf "%API%/health" >nul 2>&1
if not errorlevel 1 (
  echo [ok] Backend is already running at %API%.
) else (
  echo [..] Starting the backend in a new window...
  start "NYIT backend (port 3000)" cmd /k "cd /d "%ROOT%backend" && npm run dev"
  call :wait_api
)
if /i "%MODE%"=="api" goto :done

rem ---------- Expo ----------
set "EXPO_ARGS="
if defined CLEAR set "EXPO_ARGS=--clear"

if /i "%MODE%"=="web" set "CMD=npx expo start --web %EXPO_ARGS%"
if /i "%MODE%"=="wifi" set "CMD=npx expo start %EXPO_ARGS%"
if /i "%MODE%"=="emulator" set "CMD=npx expo start --android %EXPO_ARGS%"
if /i "%MODE%"=="usb" (
  where adb >nul 2>&1 || (echo [x] adb isn't on PATH. Install Android platform-tools first. & goto :fail)
  adb get-state >nul 2>&1 || (echo [x] No Android device found. Plug in the phone and allow USB debugging. & goto :fail)
  set "CMD=adb reverse tcp:8081 tcp:8081 && adb reverse tcp:3000 tcp:3000 && npx expo start --localhost --android %EXPO_ARGS%"
)

echo [..] Starting Expo (%MODE%) in a new window...
start "NYIT Expo (%MODE%)" cmd /k "cd /d "%ROOT%frontend" && %CMD%"

if /i "%MODE%"=="wifi" (
  echo.
  echo  Scan the QR code in the Expo window with Expo Go. If the phone can't connect
  echo  ^(Public network or campus Wi-Fi^), use option 3 ^(USB^) instead.
)
goto :done

rem ---------- quick checks ----------
:check
echo [..] Type-checking the app (npx tsc --noEmit)...
pushd frontend
call npx tsc --noEmit
if errorlevel 1 (popd & echo [x] Type errors above. If they name unknown routes, run Expo once to refresh them. & goto :fail)
popd
echo [ok] Type-check passed.
endlocal
exit /b 0

rem ---------- helpers ----------
:wait_api
set /a TRIES=0
:wait_loop
curl -sf "%API%/health" >nul 2>&1 && (echo [ok] Backend is up at %API%. & exit /b 0)
set /a TRIES+=1
if %TRIES% geq 30 (
  echo [!] Backend didn't answer %API%/health within 30 seconds. Check its window
  echo     ^(a 500 there usually means backend\.env's DATABASE_URL is wrong^). Continuing anyway.
  exit /b 0
)
timeout /t 1 /nobreak >nul
goto :wait_loop

:done
echo.
echo  Close the server windows ^(or press Ctrl+C in them^) to stop.
endlocal
exit /b 0

:fail
echo.
pause
endlocal
exit /b 1
