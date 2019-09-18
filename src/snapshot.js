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
  sizeInBytes: 0
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

async function statObj (target, millisecond) {
  const stats = await afs.statAsync(target)

  const val = {
    sizeInBytes: stats.size,
    type: (await stats.isDirectory()
      ? 'directory'
      : await stats.isFile()
        ? 'file'
        : 'unknown')
  }

  if (millisecond) {
    val.accessTime = stats.atimeMs
    val.changeTime = stats.ctimeMs
    val.modifiedTime = stats.mtimeMs
    val.birthTime = stats.birthtimeMs
  } else {
    val.accessTime = stats.atime
    val.changeTime = stats.ctime
    val.modifiedTime = stats.mtime
    val.birthTime = stats.birthtime
  }

  return val
}

async function fileSnapshot (file, opts) {
  const data = await afs.readFileAsync(file)
  const snap = {
    md5Hex: opts.checksum ? await fileChecksum(data) : ''
  }

  if (opts.contents) {
    snap.contents = '' + data
  }

  return snap
}

async function entrySnapshot (target, opts, currDepth) {
  const snap = {}
  let stype
  const sstats = await statObj(target, opts.millisecond)
  stype = sstats.type
  delete sstats.type

  if (opts.quiet === false) {
    console.info(`Adding ${stype} ../${basename(dirname(target))}/${basename(target)} to snapshot.`)
  }

  allStats.sizeInBytes += sstats.sizeInBytes

  if (stype === 'directory') {
    if (opts.absolute) {
      snap.path = target
    } else {
      snap.path = basename(target)
    }

    if (opts.type === true) {
      snap.type = stype
    }

    allStats.directories += 1

    if (opts.recursive && (opts.depth === -1 || currDepth <= opts.depth) && opts.exclude.indexOf(basename(target)) === -1) {
      const entries = (await afs.readdirAsync(target)).filter((e) =>
        /*((opts.include.indexOf(e) !== -1 ||
        opts.include.indexOf(`${basename(dirname(target))}/${basename(target)}`) !== -1))) || */
        (opts.recursive &&
          (opts.depth === -1 || currDepth <= opts.depth) &&
          opts.exclude.indexOf(e) === -1 &&
          opts.exclude.indexOf(`${basename(dirname(target))}/${basename(target)}`) === -1))

      // console.info(entries)

      for (let entry = 0; entry < entries.length; entry++) {
        entries[entry] = await entrySnapshot(join(target, entries[entry]), opts, currDepth++)
      }

      snap.contents = entries
    }
  } else if (stype === 'file') {
    allStats.files += 1
    let fdata = {}

    if (opts.absolute) {
      snap.path = target
    } else {
      snap.path = basename(target)
    }

    if (opts.type === true) {
      snap.type = stype
    }

    if (opts.checksum === true) {
      fdata = await fileSnapshot(target, opts)
      snap.md5Hex = fdata.md5Hex
    }

    if (opts.stats === true) {
      snap.stats = sstats
    }

    if (opts.contents === true) {
      if (typeof fdata.contents === 'undefined') {
        fdata = await fileSnapshot(target, opts)
      }

      snap.contents = fdata.contents
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

  if (options.quiet === false) {
    console.info(`Creating snapshot of ${isDir ? 'directory' : 'file'} ${options.target} to a max depth of ${options.depth}, including excluding ${options.exclude.length} locations; ${options.quiet ? 'quietly' : 'verbosely'}, ${options.data ? 'with' : 'without'} data, and with${options.checksum ? ' ' : 'out '}checksum(s).`)
  }

  const snap = await entrySnapshot(options.target, options, 0)

  return {
    root: options.target,
    filesystem: snap,
    stats: allStats
  }
}

module.exports = {
  snapshot
}
