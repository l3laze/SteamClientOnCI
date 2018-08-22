'use strict'

const { writeFileSync, readdirSync, existsSync, mkdirSync, lstatSync } = require('fs')
const { join: pjoin, dirname } = require('path')
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

function afterInstall () {
  console.log(readdirSync(
    plat === 'win32'
      ? platforms[ plat ].location[ arch ]
      : platforms[ plat ].location
  ))
}

async function doInstall () {
  const filePath = await getInstaller()
  const spawnSync = require('child_process').spawnSync
  const execAsync = require('util').promisify(require('child_process').exec)
  let child1
  let child2

  switch (plat) {
    case 'linux':
    case 'android':
      /*
      child1 = await execAsync(
        `dpkg --instdir $HOME -i ${filePath} && apt-get install -f`
      )
      */
      break

    case 'darwin':
      /*
      child1 = await execAsync(
        `yes qy | hdiutil attach ${filePath} ;` +
        `cp -Rf /Volumes/Steam/Steam.app /Applications ;` +
        'open -a Steam.app --args -silent'
      )
      */
      break

    case 'win32':
      child1 = spawnSync(`${filePath}`, [ '/S' ])
      child2 = await spawnAsync(`"${pjoin(platforms[ plat ].location[ arch ], platforms[ plat ].executable)}"`) // , [ '--silent' ])
      child2.setEncoding('utf8')
      break
  }

  console.log(child1.pid + ' is garbage!')
  child2 && console.log(child2.pid + ' is garbage!')
  afterInstall()
}

module.exports = {
  doInstall
}
