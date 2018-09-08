:: Name:     MyScript.cmd
:: Purpose:  Auto-run Steam, including install.
:: Author:   l3l_aze [at] yahoo [dot] com

@ECHO OFF
SETLOCAL ENABLEEXTENSIONS ENABLEDELAYEDEXPANSION

:: variables
set me=%~n0
set parent=%~dp0
set client='C:\Program Files (x86)\Steam\Steam.exe'
set installer="https://steamcdn-a.akamaihd.net/client/installer/SteamSetup.exe"
set setup='SteamSetup.exe'

if not exist "%client%" (
  if not exist "%setup%" (
    echo "Downloading Steam installer"
    curl -fsSL -o "%setup%" "%installer%"
  )

  echo "Running Steam installer"
  cmd /c "%setup%" /S /V /qb
  timeout 5
  taskkill.exe /F /T /IM Steam* || ( cmd /c "exit /b 0" )

  cmd /c "%client%" -silent || ( cmd /c "exit /b 0" )
  cmd /c "%client%" -shutdown
  timeout 15
  taskkill.exe /F /T /IM Steam* || ( cmd /c "exit /b 0" )
)

start "%client%" "-login" "%steamu%" "%steamp%"
timeout 90
cmd /c "%client%" -shutdown
timeout 15
taskkill.exe /F /T /IM Steam* || ( cmd /c "exit /b 0" )

:END
ENDLOCAL
ECHO ON
@EXIT /B 0