'use strict'

const { writeFileSync, existsSync, mkdirSync, lstatSync } = require('fs')
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
const { snapshot } = require('./snapshot.js')

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

async function afterInstall () {
  const dir = (plat === 'win32'
    ? platforms[ plat ].location[ arch ]
    : platforms[ plat ].location)

  // console.log(readdirSync(dir))

  const snap = await snapshot(dir)

  console.info('snapshot stats: %j', snap.stats)

  writeFileSync(pjoin(__dirname, 'snapshot.json'), JSON.stringify(snap, null, 2))
}

async function doInstall (u, n) {
  const filePath = await getInstaller()
  const spawnSync = require('child_process').spawnSync
  // const spawnAsync = require('util').promisify(require('child_process').spawn)
  let child1
  let child2
  let child3

  switch (plat) {
    case 'linux':
    case 'android':
      child1 = spawnSync(
        `dpkg --instdir $HOME -i ${filePath} && apt-get install -f && steam`
      )
      break

    case 'darwin':
      child1 = spawnSync(
        `yes qy | hdiutil attach ${filePath} &&` +
        `cp -Rf /Volumes/Steam/Steam.app /Applications &&` +
        'open -a Steam.app --args'
      )
      break

    case 'win32':
      child1 = spawnSync(`${filePath}`, [ '/S' ])
      child2 = spawnSync(pjoin(platforms[ plat ].location[ arch ], platforms[ plat ].executable), [], {
        cwd: platforms[ plat ].location[ arch ]
      })
      child3 = spawnSync(pjoin(platforms[ plat ].location[ arch ], platforms[ plat ].executable), [ '-login ' + u + ' ' + n ], {
        cwd: platforms[ plat ].location[ arch ]
      })

      console.info('child1: %s', child1.stdout)
      console.info('child2: %s', child2.stdout)
      console.info('child3: %s', child3.stdout)
      break
  }

  await afterInstall()
}

module.exports = {
  doInstall
}
