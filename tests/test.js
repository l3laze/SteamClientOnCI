'use strict'

const { snapshot } = require('./../src/snapshot.js')
const { writeFileSync } = require('fs')
const { join } = require('path')

;

(async function run () {
  try {
    const target = process.argv[ 2 ]
    console.info(target)

    const result = await snapshot(target)
    writeFileSync(join('snapshot.json'), JSON.stringify(result, null, 2))
    console.info(result.stats)
  } catch (err) {
    console.error(err.message)
  }
}())
