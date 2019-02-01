'use strict'

const { snapshot } = require('./../src/snapshot.js')
const { writeFileSync } = require('fs')
const { join } = require('path')

;

(async function run () {
  try {
    const target = process.argv[ 2 ] || 'C:\\Program Files (x86)\\Steam'
    const verbose = /true/.test(process.argv[ 3 ])
    const includeData = /true/.test(process.argv[ 4 ])
    const checksum = /true/.test(process.argv[ 5 ])
    const stats = /true/.test(process.argv[ 6 ])
    const blacklist = process.argv[ 7 ].indexOf(',') > -1
      ? process.argv[ 7 ].split(',')
      : process.argv[ 7 ]
    const whitelist = process.argv[ 8 ].indexOf(',') > -1
      ? process.argv[ 8 ].split(',')
      : process.argv[ 8 ]
    const depth = parseInt(process.argv[ 9 ]) || 0
    const outPath = process.argv[ 10 ] || ''

    const result = await snapshot(target, { blacklist, checksum, data: includeData, depth, verbose, whitelist})

    writeFileSync(join(outPath, 'snapshot.json'), JSON.stringify(result, null, 2))
    console.info(result.stats)
  } catch (err) {
    console.error(err.message)
  }
}())
