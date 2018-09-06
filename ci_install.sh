#!/usr/bin/env bash
case "$OSTYPE" in
linux* )
  sudo apt update && sudo apt -y upgrade > ~/log.txt
  sudo dpkg --add-architecture i386 >> ~/log.txt
  sudo apt -y install python python-apt xz-utils zenity >> ~/log.txt
  curl -o steam.deb -L http://steamcdn-a.akamaihd.net/client/installer/steam.deb >> ~/log.txt
  sudo dpkg -i ./steam.deb >> ~/log.txt && sudo apt -y --fix-broken install >> ~/log.txt && yes | steam >> ~/log.txt
;;
darwin* )
  curl -o Steam.dmg -L http://steamcdn-a.akamaihd.net/client/installer/Steam.dmg
  yes qy | hdiutil attach Steam.dmg
  cp -Rf /Volumes/Steam/Steam.app /Applications
  open -a Steam.app
;;
* )
  echo "Unsupported OS $OSTYPE"
  exit 1
;;
esac