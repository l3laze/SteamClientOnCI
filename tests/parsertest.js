'use strict'

const { parse } = require('./../src/commandparser.js')

let opargs = parse([ '-h' ], {
  hello: [ 'h', 'string', false, 'World' ]
})
console.info(opargs)

opargs = parse([ '--hello' ], {
  hello: [ 'h', 'string', false, 'World' ]
})
console.info(opargs)

opargs = parse([ '-h', 'whirled' ], {
  hello: [ 'h', 'string', false, 'World' ]
})
console.info(opargs)

opargs = parse([ '-n', '8675309' ], {
  num: [ 'n', 'number', false, 0 ]
})
console.info(opargs)

opargs = parse([ '--num' ], {
  num: [ 'n', 'number', false, 0 ]
})
console.info(opargs)

opargs = parse([ '-b', 'true' ], {
  bool: [ 'b', 'boolean', false, false ]
})
console.info(opargs)

opargs = parse([ '--bool' ], {
  bool: [ 'b', 'boolean', false, false ]
})
console.info(opargs)

opargs = parse([], {
  flag: [ 'f', 'flag' ]
})
console.info(opargs)

opargs = parse([ '-n', '8675309', '-s', 'whirled', '-b', 'true', '-fat' ], {
  num: [ 'n', 'number', false, 0 ],
  bool: [ 'b', 'boolean', false, false ],
  string: [ 's', 'string', false, 'Hi' ],
  flag: [ 'f', 'flag' ],
  another: [ 'a', 'flag' ],
  third: [ 't', 'flag' ]
})
console.info(opargs)