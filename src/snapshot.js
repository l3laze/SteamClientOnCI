'use strict'

const { basename, dirname, join, resolve } = require('path')
const { promisify } = require('util')
const crypto = require('crypto')
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
    snap.data = '' + data
  }

  return snap
}

async function entrySnapshot (target, opts, currDepth) {
  const snap = {}
  let stype
  const sstats = await statObj(target)
  stype = sstats.type

  if (opts.quiet === false) {
    console.info(`Adding ${stype} ../${basename(dirname(target))}/${basename(target)} to snapshot.`)
  }

  if (opts.type === true) {
    snap.type = sstats.type
  }

  allStats.size += sstats.size

  if (stype === 'directory') {
    snap.path = opts.fullPath
      ? `../${basename(dirname(target))}/${basename(target)}`
      : basename(target)
    allStats.directories += 1

    if (opts.depth === -1 || currDepth < opts.depth) {
      const entries = (await afs.readdirAsync(target)).filter((e) =>
        (opts.include.indexOf(e) !== -1 ||
        opts.include.indexOf(`${basename(dirname(target))}/${basename(target)}`) !== -1) &&
        (opts.exclude.indexOf(e) === -1 &&
        opts.exclude.indexOf(`${basename(dirname(target))}/${basename(target)}`) === -1))

      // console.info(entries)

      for (let entry = 0; entry < entries.length; entry++) {
        entries[entry] = await entrySnapshot(join(target, entries[entry]), opts, currDepth++)
      }

      snap.contents = entries
    }
  } else if (stype === 'file') {
    allStats.files += 1
    let fdata

    if (opts.checksum === true) {
      fdata = await fileSnapshot(target, opts)
      snap.checksum = fdata.checksum
    }

    if (opts.data === true) {
      if (typeof fdata.data === 'undefined') {
        fdata = await fileSnapshot(target, opts)
      }

      snap.data = fdata.data
    }

    if (opts.stats === true) {
      snap.stats = sstats
    }

    if (opts.fullPath) {
      snap.path = opts.fullPath
      ? `../${basename(dirname(target))}/${basename(target)}`
      : basename(target)
    }
  }

  return snap
}

async function snapshot (options) {
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
    console.info(`Creating snapshot of ${isDir ? 'directory' : 'file'} ${options.target} to a max depth of ${options.depth}, including ${options.include.length} locations, and excluding ${options.exclude.length} locations; ${options.quiet ? 'quietly' : 'verbosely'}, ${options.data ? 'with' : 'without'} data, and with${options.checksum ? ' ' : 'out '}checksum(s).`)
  }

  const snap = await entrySnapshot(options.target, options, 0)

  return {
    root: dirname(options.target),
    filesystem: snap,
    stats: allStats
  }
}

module.exports = {
  snapshot
}
