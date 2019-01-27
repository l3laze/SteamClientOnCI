'use strict'

const { snapshot } = require('./../src/snapshot.js')
const { writeFileSync } = require('fs')
const { join } = require('path')

;

(async function run () {
  try {
    console.info(process.argv)
    const target = process.argv[ 2 ] || 'C:\\Program Files (x86)\\Steam'
    const verbose = /true/.test(process.argv[ 3 ])
    const includeData = /true/.test(process.argv[ 4 ])
    const checksum = /true/.test(process.argv[ 5 ])
    const depth = parseInt(process.argv[ 6 ]) || 0
    const outPath = process.argv[ 7 ] || ''
    const result = await snapshot(target, { checksum, data: includeData, depth, verbose })
    writeFileSync(join(outPath, 'snapshot.json'), JSON.stringify(result, null, 2))
    console.info(result.stats)
  } catch (err) {
    console.error(err.message)
  }
}())
