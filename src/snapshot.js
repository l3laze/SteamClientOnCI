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
  if (opts.verbose === true) {
    console.info(`Adding ../${basename(dirname(target))}/${basename(target)} to snapshot.`)
  }

  const snap = {
    stats: await statObj(target),
    path: target
  }

  allStats.size += snap.stats.size

  if (snap.stats.type === 'directory') {
    allStats.directories += 1

    if (opts.depth === -1 || currDepth < opts.depth) {
      // console.info('depth: ', opts.depth, currDepth)

      const entries = await afs.readdirAsync(target)
      const locOps = opts

      snap.children = []
      currDepth++

      for (let entry = 0; entry < entries.length; entry++) {
        snap.children.push(await entrySnapshot(join(target, entries[ entry ]), locOps, currDepth))
      }

      snap.children = entries
    }
  } else if (snap.stats.type === 'file') {
    allStats.files += 1
    snap.data = await fileSnapshot(target, opts)

    snap.checksum = '' + snap.data.checksum

    if (opts.data === true && typeof snap.data.data !== 'undefined') {
      snap.data = snap.data.data
    } else {
      delete snap.data
    }
  }

  return snap
}

async function snapshot (dir, options = { checksum: false, data: false, depth: -1, verbose: false }) {
  dir = resolve(dir)
  const stats = await afs.statAsync(dir)
  const isDir = stats.isDirectory()
  const target = (isDir ? dir : dirname(dir))
  const tmp = parseInt(options.depth)

  allStats.directories = 0
  allStats.files = 0
  allStats.size = 0

  console.info(`Creating snapshot of ${isDir ? 'directory' : 'file'} ${target} to a max depth of ${isNaN(tmp) ? 0 : tmp}, ${options.verbose ? '' : 'non-'}verbosely, ${options.data ? 'with' : 'without'} data, and with${options.checksum ? ' ' : 'out '}checksum(s).`)

  const ops = {
    checksum: options.checksum,
    data: options.data,
    depth: isNaN(tmp) ? 0 : tmp,
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
