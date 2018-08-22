'use strict'

const scd = require('./../src/index.js')

;

(async function run () {
  try {
    await scd.doInstall()
  } catch (err) {
    console.error(err.message)
  }
}())
