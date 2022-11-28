'use strict'

const { snapshot } = require('./../src/snapshot.js')
const { parse, usage } = require('./../src/commandparser.js')

;
(async function run () {
  const options = {
    target: ['t', 'path', false, './', 'Path to take snapshot of.'],
    depth: ['d', 'number', false, -1, 'default=-1=infinite.'],
    exclude: ['e', 'multiple/string', false, [], 'Item to exclude; name or path.'],
    quiet: ['q', 'flag', false, false, 'Quiet mode.'],
    checksum: ['k', 'flag', false, false, 'Checksum each file.'],
    recursive: ['r', 'flag', false, false, 'Recursive mode.'],
    contents: ['c', 'flag', false, false, 'Include file data in snapshot.'],
    stats: ['s', 'flag', false, false, 'Include all filesystem stats.'],
    millisecond: ['l', 'flag', false, false, 'Use ms timestamps for stats.'],
    absolute: ['a', 'flag', false, false, 'Include absolute paths.'],
    type: ['y', 'flag', false, false, 'Include type (file/folder).'],
    help: ['h', 'flag', false, '', 'View this message.']
  }

  try {
    const parsed = parse(process.argv.slice(2), options)
    // console.info(parsed)

    if (parsed.help) {
      console.info(usage(options))
    } else {
      const result = await snapshot(parsed)
      console.info(JSON.stringify(result, null, parsed.format || 2))
    }
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}())
