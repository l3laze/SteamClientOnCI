'use strict'

const { snapshot } = require('./../src/snapshot.js')
const { parse, usage } = require('./../src/commandparser.js')

;

(async function run () {
  const options = {
    target: [ 't', 'path',  false, './', 'Path to take snapshot of.' ],
    depth: [ 'd', 'number', false, -1, 'Depth to traverse; -1 = infinite.' ],
    quiet: [ 'q', 'flag', false, false, 'Just shut up and do it.' ],
    include: [ 'i', 'regex', false, /.*/, 'Pattern to include files/folders.' ],
    exclude: [ 'e', 'regex', false, /.*/, 'Pattern to exclude files/folders.' ],
    checksum: [ 'c', 'boolean',  false, false, 'Make a checksum of each file' ],
    data: [ 'a', 'flag', false, false, 'Include file data in snapshot.' ],
    stats: [ 's', 'flag', false, false, 'Include individual stats.' ],
    format: ['f', 'number', false, 2, 'Output spacing -- number or \\t.' ],
    fullpath: [ 'p', 'flag', false, false, 'Include full path.' ],
    help: [ 'h', 'flag', false, '', 'View this message.' ]
  }

  try {
    const parsed = parse(process.argv.slice(2), options)
    console.info(parsed)

    if (parsed.help) {
      console.info(usage(options))
    } else {
      const result = await snapshot(parsed)
      console.info(JSON.stringify(result, null, parsed.format))
    }
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}())