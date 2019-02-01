:: Name:     ci_install.bat/cmd
:: Purpose:  Auto-run Steam, including install & login.
:: Author:   l3l_aze [at] yahoo [dot] com
 
@ECHO OFF
SETLOCAL ENABLEEXTENSIONS ENABLEDELAYEDEXPANSION
 
:: variables
set me=%~n0
set parent=%~dp0
set retried=0

if exist "C:\\Program Files (x86)\\Steam\\config\\loginusers.vdf" (
  echo "loginusers.vdf exists."
) else (
  echo "loginusers.vdf does not exist."
)

echo "Downloading Steam installer"
curl -fSL -o SteamSetup.exe "https://steamcdn-a.akamaihd.net/client/installer/SteamSetup.exe"
 
echo "Running Steam installer"
SteamSetup.exe /S /V /qb
timeout 5
taskkill.exe /F /T /IM Steam* || ( cmd /c "exit /b 0" )

echo "Updating"
"C:\\Program Files (x86)\\Steam\\Steam.exe"
timeout 9
"C:\\Program Files (x86)\\Steam\\Steam.exe" "-shutdown"
timeout 9
taskkill.exe /F /T /IM Steam* || ( cmd /c "exit /b 0" )

:LOGIN

if exist "C:\\Program Files (x86)\\Steam\\config\\loginusers.vdf" (
  echo "loginusers.vdf exists."
  "C:\\Program Files (x86)\\Steam\\Steam.exe" -shutdown
) else (
  echo "Logging in"
  start "" "C:\\Program Files (x86)\\Steam\\Steam.exe" "%steamu%" "%steamp%"
  timeout 27
  "C:\\Program Files (x86)\\Steam\\Steam.exe" -shutdown
  echo "Exiting.."
  timeout 9
  taskkill.exe /F /T /IM Steam* || ( cmd /c "exit /b 0" )
)

echo "Steam Folder"
dir /a "C:\\Program Files (x86)\\Steam" /b
echo ""

goto END
 
:END
ENDLOCAL
ECHO ON
@EXIT /B 0