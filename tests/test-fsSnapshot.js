'use strict'

const { snapshot } = require('./../src/fsSnapshot.js')
const { resolve, join } = require('path')

;

(async function testSnapshot () {
  const dir = resolve(join(__dirname, '..', 'src'))

  console.info(JSON.stringify(await snapshot(dir), null, 2))
}()).catch((err) => {
  console.error(err)
})

// Hi
