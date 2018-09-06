'use strict'

const scd = require('./../src/index.js')

;

(async function run () {
  try {
    await scd.doInstall(process.argv.slice(2))
  } catch (err) {
    console.error(err.message)
  }
}())
