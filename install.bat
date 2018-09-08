:: Name:     MyScript.cmd
:: Purpose:  Auto-run Steam, including install.
:: Author:   l3l_aze [at] yahoo [dot] com

@ECHO OFF
SETLOCAL ENABLEEXTENSIONS ENABLEDELAYEDEXPANSION

:: variables
set me=%~n0
set parent=%~dp0

if not exist "C:\\Program Files (x86)\\Steam" (
  cd "%temp%"

  if not exist "SteamSetup.exe" (
    echo "Downloading Steam installer"
    curl -fSL -o SteamSetup.exe "https://steamcdn-a.akamaihd.net/client/installer/SteamSetup.exe"
  )

  echo "Running Steam installer"
  start "" SteamSetup.exe /S /V /qb
  timeout 10
  taskkill.exe /F /T /IM Steam* || ( cmd /c "exit /b 0" )
)

cd "C:\\Program Files (x86)\\Steam"
echo "Updating"
Steam.exe
timeout 45
start "" Steam.exe "-shutdown"
timeout 15
taskkill.exe /F /T /IM Steam* || ( cmd /c "exit /b 0" )

echo "Logging in"
start "" Steam.exe "-login" "%steamu%" "%steamp%"
timeout 45
start "" Steam.exe "-shutdown"
echo "Exiting.."
timeout 15
taskkill.exe /F /T /IM Steam* || ( cmd /c "exit /b 0" )
goto END

:END
ENDLOCAL
ECHO ON
@EXIT /B 0