'use strict'

const { snapshot } = require('./../src/snapshot.js')
const { resolve, join } = require('path')

;

(async function testSnapshot () {
  const dir = resolve(join(__dirname, '..', 'src'))

  // Made with help from https://regexr.com
  const regex = /.*src(?!.cache).*$/
  console.info('RegExp "%s" = %s', regex, JSON.stringify((await snapshot(dir, regex)).data, null, 2))

  const list = [ 'src', 'snapshot.js', 'index.js' ]
  console.info('List %O = %s', list, JSON.stringify((await snapshot(dir, list)).data, null, 2))

  const result = await snapshot(dir)
  console.info('Default (everything) = %s', JSON.stringify(result.data, null, 2))
  console.info('Stats: %j', result.stats)
}()).catch((err) => {
  console.error(err)
})

// Hi
