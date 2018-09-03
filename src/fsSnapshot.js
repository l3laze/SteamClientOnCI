'use strict'

const { dirname, join, resolve, sep } = require('path')
const { promisify } = require('util')
const afs = {
  readdirAsync: promisify(require('fs').readdir),
  readFileAsync: promisify(require('fs').readFile),
  statAsync: promisify(require('fs').stat)
}
const _whitelist = {}

/*
 * Based on https://gist.github.com/a1a6913944c55843ed3e999b16350b50
 */

async function fileChecksum (str) {
  const crypto = require('crypto')

  return crypto
    .createHash('md5')
    .update(str, 'utf8')
    .digest('hex')
}

async function isWhitelisted (target, whitelist) {
  if (typeof whitelist !== 'object' || whitelist.constructor.name !== 'Object') {
    throw new TypeError('isWhitelisted: whitelist must be an Object.')
  } else if (typeof target !== 'string') {
    throw new TypeError('isWhitelisted: target must be a path as a string.')
  }

  const splitPath = target.split(sep)
  const wkeys = Object.keys(whitelist)
  const wvals = Object.values(whitelist)

  if (! wkeys.includes(splitPath[ 0 ]) || wkeys.includes('*')) {
    return false
  } else if (splitPath.length === 1 || (wkeys.length === 1 && (wkeys[ 0 ] === '*' || wvals[ 0  ] === '*'))) {
      return true
  } else {
    const wl = whitelist[ splitPath[ 0 ]]
    return isWhitelisted(splitPath.slice(1), wl)
  }
}

async function statObj (target) {
  const stats = await afs.statAsync(target)

  return {
    size: stats.size,
    atime: stats.atime,
    ctime: stats.ctime,
    mtime: stats.mtime,
    type: (stats.isDirectory()
      ? 'directory'
      : stats.isFile()
        ? 'file'
        : 'unknown')
  }
}

async function fileSnapshot (file, includeData) {
  const data = await afs.readFileAsync(file)
  const snap = {
    checksum: await fileChecksum(data)
  }

  if (includeData) {
    snap.data = data
  }

  return snap
}

async function entrySnapshot (target) {
  if (isWhitelisted(target, _whitelist)) {
    const snap = {
      stats: await statObj(target),
      path: target
    }
  
    if (snap.stats.type === 'directory') {
      const entries = await afs.readdirAsync(target)
  
      let entry
      for (entry in entries) {
        entries[ entry ] = entrySnapshot(join(target, entries[ entry ]))
      }
  
      snap.children = await Promise.all(entries)
    } else if (snap.stats.type === 'file') {
      snap.data = await fileSnapshot(target, false)
  
      snap.checksum = '' + snap.data.checksum
  
      if (typeof snap.data.data !== 'undefined') {
        snap.data = snap.data.data
      } else {
        delete snap.data
      }
    }

    return snap
  }

  return {}
}

async function snapshot (dir, daWhitelist = {}) {
  dir = resolve(dir)
  const stats = await afs.statAsync(dir)
  const isDir = stats.isDirectory()
  const target = (isDir ? dir : dirname(dir))

  Object.keys(daWhitelist).forEach((k) => {
    _whitelist[ k ] = daWhitelist[ k ]
  })

  const snap = await entrySnapshot(target)

  return snap
}

module.exports = {
  snapshot
}
