#!/usr/bin/env bash
case "$OSTYPE" in
darwin* )
  echo -e "travis_fold:start:install"
  echo "Downloading and installing Steam for macOS..."
  curl -o Steam.dmg -L https://steamcdn-a.akamaihd.net/client/installer/steam.dmg
  yes | hdiutil attach Steam.dmg > /dev/null
  cp -Rf /Volumes/Steam/Steam.app /Applications
  hdiutil unmount /Volumes/Steam
  echo -e "travis_fold:end:installi"

  echo -e "travis_fold:start:update"
  echo "Updating..."
  /Applications/Steam.app/contents/MacOS/steam.sh || echo "Exited with code $?"
  sleep 15 > /dev/null
  sudo killall -9 steam || echo "Steam is not running"
  echo -e "travis_fold:end:update"

  echo -e "travis_fold:start:login"
  echo "Logging in..."
  /Applications/Steam.app/contents/MacOS/steam.sh -login $stu $stp || echo "Exited with code $?"
  sleep 15 > /dev/null
  sudo killall -9 steam || echo "Steam is not running"
  echo -e "travis_fold:end:login"

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