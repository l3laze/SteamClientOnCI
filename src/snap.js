'use strict'

const { basename, join } = require('path')
const { promisify } = require('util')
const afs = {
  readdirAsync: promisify(require('fs').readdir),
  readFileAsync: promisify(require('fs').readFile),
  statAsync: promisify(require('fs').stat)
}

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

async function statObj (target) {
  const stats = await afs.statAsync(target)

  return {
    size: stats.size,
    accessTime: stats.atime,
    changeTime: stats.ctime,
    modifiedTime: stats.mtime,
    birthTime: stats.birthtime,
    type: (await stats.isDirectory()
      ? 'directory'
      : await stats.isFile()
        ? 'file'
        : 'unknown')
  }
}

async function fileSnapshot (file, options) {
  const entry = join(options.target, file)

  
}

async function entrySnapshot (options) {
  const stats = await statAsync(options.target)

  if (stats.isDir()) {
    const entries = await readdirAsync(options.target)
    let stats

    for (let i = 0; i < entries.length; i++) {
      entry = join(options.target, entries[ i ])
      stats = await statAsync(entry)

      if (stats.isDir()) {
        options.target = entry
        entries[ i ] = entrySnapshot(options)
      } else if (stats.isFile() && options.include.test(entries[ i ])) {
        entries [ i ] = fileSnapshot(entry, options)
      }
    }

    return entries
  } else {
    throw new Error('Target must be a directory.')
  }
}