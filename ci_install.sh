#!/usr/bin/env bash
case "$OSTYPE" in
darwin* )
  echo "Downloading and installing Steam for macOS..."
  curl -o Steam.dmg -L https://cdn.cloudflare.steamstatic.com/client/installer/steam.dmg
  yes | hdiutil attach Steam.dmg > /dev/null
  cp -Rf /Volumes/Steam/Steam.app /Applications
  hdiutil unmount /Volumes/Steam
  echo "Updating and logging in..."
  tries=0
  while [ ! -f  ~/Library/'Application Support'/Steam/config/loginusers.vdf -a $tries != 5 ]
  do
    tries=$((tries + 1))
    /Applications/Steam.app/contents/MacOS/steam.sh -login "$stu" "$stp"
    sleep 45 > /dev/null
    /Applications/Steam.app/contents/MacOS/steam.sh -shutdown
    sleep 15 > /dev/null
    sudo killall -9 steam || echo "Steam is not running"
  done

  echo -e "\nSteam folder.."
  ls -a ~/Library/Application\ Support/Steam
  echo -e "\nconfig folder.."
  ls -a ~/Library/Application\ Support/Steam/config 
;;
* )
  echo "Unsupported OS $OSTYPE"
  exit 1
;;
esac
