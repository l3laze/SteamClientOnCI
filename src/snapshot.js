'use strict'

const { basename, dirname, join, resolve } = require('path')
const { promisify } = require('util')
const afs = {
  readdirAsync: promisify(require('fs').readdir),
  readFileAsync: promisify(require('fs').readFile),
  statAsync: promisify(require('fs').stat)
}
const allStats = {
  directories: 0,
  files: 0,
  size: 0
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

async function fileSnapshot (file, opts) {
  const data = await afs.readFileAsync(file)
  const snap = {
    checksum: opts.checksum ? await fileChecksum(data) : ''
  }

  if (opts.data) {
    snap.data = data
  }

  return snap
}

async function entrySnapshot (target, opts, currDepth) {
  const snap = {
    path: opts.fullpath ? target : basename(target)
  }

  if (opts.quiet === false) {
    console.info(`Adding ../${basename(dirname(target))}/${basename(target)} to snapshot.`)
  }

  const sstats = await statObj(target)

  snap.type = sstats.type
  delete sstats.type

  allStats.size += sstats.size

  if (snap.type === 'directory') {
    allStats.directories += 1

    if (opts.depth === -1 || currDepth < opts.depth) {
      const entries = await afs.readdirAsync(target)

      for (let entry = 0; entry < entries.length; entry++) {
          entries[ entry ] = await entrySnapshot(join(target, entries[ entry ]), opts, currDepth++)
        }

        snap.contents = entries
    }

    if (opts.stats !== true) {
      delete snap.stats
    }
  } else if (snap.type === 'file') {
    allStats.files += 1
    snap.data = await fileSnapshot(target, opts)

    snap.checksum = '' + snap.data.checksum

    if (opts.data === true && typeof snap.data.data !== 'undefined') {
      snap.data = snap.data.data
    } else {
      delete snap.data
    }

    if (opts.checksum === true && snap.data.checksum !== '') {
      snap.checksum = snap.data.checksum
    } else {
      delete snap.checksum
    }

    if (opts.stats === true) {
      snap.stats = sstats
    }
  }

  return snap
}

async function snapshot (options) {
  console.info(options)

  const dir = resolve(options.target)
  const stats = await afs.statAsync(dir)
  const isDir = stats.isDirectory()
  options.target = (isDir ? dir : dirname(dir))
  options.depth = parseInt(options.depth)

  if (isNaN(options.depth)) {
    options.depth = -1
  }

  allStats.directories = 0
  allStats.files = 0
  allStats.size = 0

  if (options.quiet === false) {
    console.info(`Creating snapshot of ${isDir ? 'directory' : 'file'} ${options.target} to a max depth of ${options.depth}, including pattern ${options.include} and excluding pattern ${options.exclude}, and ${options.quiet ? 'quietly' : 'verbosely'}, ${options.data ? 'with' : 'without'} data, and with${options.checksum ? ' ' : 'out '}checksum(s).`)
  }

  const snap = await entrySnapshot(options.target, options, 0)

  return {
    data: snap,
    stats: allStats
  }
}

module.exports = {
  snapshot
}
