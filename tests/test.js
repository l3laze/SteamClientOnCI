'use strict'

const { snapshot } = require('./../src/snapshot.js')
const { writeFileSync } = require('fs')
const { join } = require('path')

;

(async function run () {
  try {
     const target = process.argv[ 2 ] || './'
    
    /*
      const verbose = /true/.test(process.argv[ 3 ])
      const includeData = /true/.test(process.argv[ 4 ])
      const checksum = /true/.test(process.argv[ 5 ])
      const stats = /true/.test(process.argv[ 6 ])
      const blacklist = process.argv[ 7 ] || []
    */
    const depth = parseInt(process.argv[ 3 ]) || -1
    const outPath = process.argv[ 4 ] || './'

    const options = { target,  depth, blacklist: [], checksum: false, data: false, stats: false }
    
    console.info(options)

    const result = await snapshot(options)

    writeFileSync(join(outPath, 'snapshot.json'), JSON.stringify(result))
    console.info(result.stats)
  } catch (err) {
    console.error('There was an error: ' + err.message + '\n' + err.stack)
  }
}())
