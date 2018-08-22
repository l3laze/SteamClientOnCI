'use strict'

const { writeFileSync, readdirSync, existsSync, mkdirSync, lstatSync } = require('fs')
const { join: pjoin, dirname } = require('path')
const { promisify } = require('util')
const plat = require('os').platform()
const arch = require('os').arch()
const home = require('os').homedir()
const base = 'http://steamcdn-a.akamaihd.net/client/installer/'
const platforms = {
  win32: {
    executable: 'Steam.exe',
    file: 'SteamSetup.exe',
    location: {
      'x86': 'C:\\Program Files\\Steam',
      'x64': 'C:\\Program Files (x86)\\Steam'
    }
  },
  android: {
    file: 'steam.deb',
    location: pjoin(home, '.steam')
  },
  linux: {
    file: 'steam.deb',
    location: pjoin(home, '.steam')
  },
  darwin: {
    file: 'Steam.dmg',
    location: pjoin(home, 'Library/Application Support/Steam')
  }
}

async function getInstaller () {
  const fetch = require('node-fetch')

  const filePath = pjoin(__dirname, 'cache', platforms[ plat ].file)
  const fileDir = dirname(filePath)

  if (existsSync(fileDir) === false) {
    mkdirSync(fileDir)
  }

  console.info(base, platforms[ plat ].file)

  const response = await fetch(base + platforms[ plat ].file)

  const result = (await response.buffer())

  writeFileSync(filePath, result, { encoding: 'binary' })

  console.info('Finished downloading %s', platforms[ plat ].file)
  console.info('Exists? %s', existsSync(filePath))
  console.info('Size: %s', lstatSync(filePath).size)

  return filePath
}

async function doInstall () {
  const filePath = await getInstaller()
  const execAsync = promisify(require('child_process').exec)
  let child1
  let child2

  switch (plat) {
    case 'linux':
    case 'android':
      child1 = await execAsync(
        `dpkg --instdir $HOME -i ${filePath} && apt-get install -f`
      )
      break

    case 'darwin':
      child2 = await execAsync(
        `yes qy | hdiutil attach ${filePath} ;` +
        `cp -Rf /Volumes/Steam/Steam.app /Applications ;` +
        'open -a Steam.app --args -silent'
      )
      break

    case 'win32':
      child1 = await execAsync(`${filePath} /S`)
      child2 = await execAsync(`"${pjoin(platforms[ plat ].location[ arch ], platforms[ plat ].executable)}"`)
      break
  }

  console.log(child1.status)
  console.log(child1.stdout)
  console.log(child1.stderr)
  child2 && console.log(child2.status)
  child2 && console.log(child2.stdout)
  child2 && console.log(child2.stderr)
  console.log(readdirSync(
    plat === 'win32'
      ? platforms[ plat ].location[ arch ]
      : platforms[ plat ].location
  ))
}

module.exports = {
  doInstall
}