'use strict'

const { dirname, join, resolve } = require('path')
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
    atime: stats.atime,
    ctime: stats.ctime,
    mtime: stats.mtime
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
  const entryStat = await afs.statAsync(target)
  const snap = {
    path: target,
    stats: await statObj(target)
  }

  if (entryStat.isDirectory()) {
    const entries = await afs.readdirAsync(target)

    let entry
    for (entry in entries) {
      entries[ entry ] = entrySnapshot(join(target, entries[ entry ]))
    }

    snap.children = await Promise.all(entries)
  } else if (entryStat.isFile()) {
    snap.data = await fileSnapshot(target, false)
  }

  return snap
}

async function snapshot (dir) {
  dir = resolve(dir)
  const stats = await afs.statAsync(dir)
  const isDir = stats.isDirectory()
  const target = (isDir ? dir : dirname(dir))
  const snap = await entrySnapshot(target)

  return snap
}

module.exports = {
  snapshot
}
