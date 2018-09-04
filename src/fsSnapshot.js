'use strict'

const { basename, dirname, join, resolve } = require('path')
const { promisify } = require('util')
const afs = {
  readdirAsync: promisify(require('fs').readdir),
  readFileAsync: promisify(require('fs').readFile),
  statAsync: promisify(require('fs').stat)
}
let whitelist = null

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

async function isWhitelisted (target) {
  if (typeof target !== 'string') {
    throw new TypeError('isWhitelisted: target must be a path as a string, but got a %s.', target.constructor.name)
  }

  if ((whitelist.constructor.name === 'RegExp' && whitelist.test(target) === true) ||
    (whitelist.constructor.name === 'Array' && whitelist.includes(basename(target))) ||
    (typeof whitelist === 'string' && whitelist === '*')
  ) {
    return true
  } else {
    return false
  }
}

async function statObj (target) {
  const stats = await afs.statAsync(target)

  return {
    size: stats.size,
    atime: stats.atime,
    ctime: stats.ctime,
    mtime: stats.mtime,
    type: (await stats.isDirectory()
      ? 'directory'
      : await stats.isFile()
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
  if (await isWhitelisted(target)) {
    const snap = {
      stats: await statObj(target),
      path: target
    }

    if (snap.stats.type === 'directory') {
      const entries = await afs.readdirAsync(target)
      snap.children = []

      let entry
      for (entry in entries) {
        snap.children.push(await entrySnapshot(join(target, entries[ entry ])))
      }

      // snap.children = await Promise.all(entries)
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

async function snapshot (dir, daWhitelist = null) {
  dir = resolve(dir)
  const stats = await afs.statAsync(dir)
  const isDir = stats.isDirectory()
  const target = (isDir ? dir : dirname(dir))

  if (daWhitelist === null) {
    whitelist = '*'
  } else if (typeof daWhitelist === 'string') {
    whitelist = RegExp(daWhitelist)
  } else if (typeof daWhitelist === 'object' && (daWhitelist.constructor.name === 'RegExp' || daWhitelist.constructor.name === 'Array')) {
    whitelist = daWhitelist
  } else {
    throw new Error('Whitelist must be a RegExp, a RegExp as a string or an array of file names, but got a %s.', daWhitelist.constructor.name)
  }

  const snap = await entrySnapshot(target)

  return snap
}

module.exports = {
  snapshot
}
