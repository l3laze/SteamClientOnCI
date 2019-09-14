'use strict'

function getArg(type, val, def) {
  type = type.toLowerCase()

  if (typeof val === type || (typeof val === 'string' && type === 'path')) {
    return val
  } else if (type === 'boolean') {
    return /true/.test(val)
  } else if (type === 'regex') {
    try {
      return new RegExp(val)
    } catch (err) {
      throw new Error('Invalid pattern: ' + val)
    }
  } else if (type === 'number') {
    if (val !== 'undefined' && typeof val !== 'undefined') {
      val = parseInt(val)
      if (isNaN(val)) {
        throw new Error('"' + val + '" is not a number.')
      }
      return val
    }
  }

  return def
}

function parse (args, options) {
  const longKeys = {} 
  const shortKeys = {}
  const parsed = {}
  let i = 0
  let op = ''

  Object.keys(options).forEach((k) => {
    longKeys[ k ] = options[ k ][ 0 ]
    shortKeys[options[ k ][ 0 ]] = k
  })

  for(i = 0; i < args.length; i++) {
    op = args[ i ].replace(/^\-{1,2}/, '')

    if (/^\-(?!\-)/.test(args[ i ]) && (typeof shortKeys[ op ] === 'undefined' && typeof longKeys[ op ] === 'undefined')) {
      const flags = op.split('')

      for (let f = 0; f < flags.length; f++) {
        if (typeof shortKeys[flags[ f ]] !== 'undefined') {
          // console.info('Found short flag: ' + flags[ f ])
          parsed[shortKeys[flags[ f ]]] = true
        } else {
          throw new Error('Unknown or misnamed flag, or combination of flags: "' + flags[ f ] + '".')
        }
      }
    } else {
      if (typeof longKeys[ op ] !== 'undefined') {
        // console.info('Found long option: ' + op)
        parsed[ op ] = (options[ op ][ 1 ] === 'flag'
          ? true
          : getArg(options[ op ][ 1 ], args[ ++i ], options[ op ][ 3 ]))
      } else if (typeof shortKeys[ op ] !== 'undefined') {
        // console.info('Found short option: ' + op)
        parsed[shortKeys[ op ]] = (options[shortKeys[ op ]][ 1 ] === 'flag'
          ? true
          : getArg(options[shortKeys[ op ]][ 1 ], args[ ++i ], options[shortKeys[ op ]][ 3 ]))
      } else {
        throw new Error('Unknown option: "' + op + '".')
      }
    }
  }

  let keys = Object.keys(longKeys)

  for (i = 0; i < keys.length; i++) {
    if (typeof parsed[keys[ i ]] === 'undefined') {
      // console.info('Found undefined option: ' + keys[ i ])
  
      options[keys [ i ]][ 1 ] === 'flag'
        ?  parsed[keys[ i ]]  = false
        : parsed[keys[ i ]] = options[keys[ i ]][ 3 ]
    }
  }

  return parsed
}

function usage (options) {
  return '# Usage\n  ' +  (options.name || process.argv[1]) + Object.keys(options).map((o) => '\n-' + options[ o ][ 0 ] + ' | -' + o + (' '.repeat(8 - o.length)) + ' - ' + options[ o ][ 4 ]).join('')
}

module.exports = {
  parse,
  usage
}