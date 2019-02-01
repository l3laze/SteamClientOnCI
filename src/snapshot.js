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
  if (opts.blacklist.includes(basename(target))) {
    console.info(`Skipping blacklisted item: ${target}`)
    return {}
  }

  if (opts.verbose === true) {
    console.info(`Adding ../${basename(dirname(target))}/${basename(target)} to snapshot.`)
  }

  const sstats = await statObj(target)

  const snap = {
    path: target
  }

  snap.type = sstats.type
  delete sstats.type

  allStats.size += sstats.size

  if (snap.type === 'directory') {
    allStats.directories += 1

    if (opts.depth === -1 || currDepth < opts.depth) {
      // console.info('depth: ', opts.depth, currDepth)

      const entries = await afs.readdirAsync(target)
      const locOps = Object.assign({}, opts)

      snap.children = []
      currDepth++

      for (let entry = 0; entry < entries.length; entry++) {
        entries[ entry ] = await entrySnapshot(join(target, entries[ entry ]), locOps, currDepth)
      }

      snap.children = entries
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

async function snapshot (dir, options = { blacklist: [], checksum: false, data: false, depth: -1, stats: false, verbose: false, whitelist: [] }) {
  dir = resolve(dir)
  const stats = await afs.statAsync(dir)
  const isDir = stats.isDirectory()
  const target = (isDir ? dir : dirname(dir))
  const tmp = parseInt(options.depth)

  allStats.directories = 0
  allStats.files = 0
  allStats.size = 0

  console.info(`Creating snapshot of ${isDir ? 'directory' : 'file'} ${target} to a max depth of ${isNaN(tmp) ? 0 : tmp}, using blacklist ${options.blacklist} and whitelist ${whitelist}, ${options.verbose ? '' : 'non-'}verbosely, ${options.data ? 'with' : 'without'} data, and with${options.checksum ? ' ' : 'out '}checksum(s).`)

  const ops = {
    blacklist: options.blacklist,
    checksum: options.checksum,
    data: options.data,
    depth: isNaN(tmp) ? 0 : tmp,
    stats: options.stats,
    verbose: options.verbose
  }

  // console.info('parsed options: ', ops)

  const snap = await entrySnapshot(target, ops, 0)

  return {
    stats: allStats,
    data: snap
  }
}

module.exports = {
  snapshot
}
