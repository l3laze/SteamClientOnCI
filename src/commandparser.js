'use strict'

function getArg (type, val, def) {
  type = type.toLowerCase()


  // eslint-disable-next-line valid-typeof
  if (typeof val === '' + type || (typeof val === 'string' && type === 'path')) {
    return val
  } else if (type === 'boolean') {
    return /true/.test(val)
  } else if (type === 'number') {
    if (val !== 'undefined' && typeof val !== 'undefined') {
      val = parseInt(val)
      if (isNaN(val)) {
        throw new Error('"' + val + '" is not a number.')
      }
      return val
    }
  } else if (type === 'multiple') {
    val = [ val ]
  }

  return def
}

function parse (args, options) {
  const longKeys = {}
  const shortKeys = {}
  const parsed = {}
  let i = 0
  let op = ''
  let val

  Object.keys(options).forEach((k) => {
    longKeys[k] = options[k][0]
    shortKeys[options[k][0]] = k
  })

  for (i = 0; i < args.length; i++) {
    op = args[i].replace(/^-{1,2}/, '')

    if (/^-(?!-)/.test(args[i]) && (typeof shortKeys[op] === 'undefined' && typeof longKeys[op] === 'undefined')) {
      const flags = op.split('')

      for (let f = 0; f < flags.length; f++) {
        if (typeof shortKeys[flags[f]] !== 'undefined') {
          // console.info('Found short flag: ' + flags[ f ])
          parsed[shortKeys[flags[f]]] = true
        } else {
          throw new Error('Unknown or misnamed flag, or combination of flags: "' + flags[f] + '".')
        }
      }
    } else {
      if (typeof longKeys[op] !== 'undefined') {
        // console.info('Found long option: ' + op)
        if (options[op][1] === 'flag') {
          parsed[op] = true
        } else if (/multiple/.test(options[op][1]) === false) {
          parsed[op]  = getArg(options[op][1], args[++i], options[op][3])
        } else {
          if (typeof parsed[op] === 'undefined') {
            parsed[op] = []
          }

          val = getArg(options[op][1].split('/')[1], args[++i], options[op][3])
          parsed[op].push(val)
        }
      } else if (typeof shortKeys[op] !== 'undefined') {
        // console.info('Found short option: ' + op)
        if (options[shortKeys[op]][1] === 'flag') {
          parsed[shortKeys[op]] = true
        } else if (/multiple/.test(options[shortKeys[op]][1]) === false) {
          parsed[shortKeys[op]]  = getArg(options[shortKeys[op]][1], args[++i], options[shortKeys[op]][3])
        } else {
          if (typeof parsed[shortKeys[op]] === 'undefined') {
            parsed[shortKeys[op]] = []
          }

          val = getArg(options[shortKeys[op]][1].split('/')[1], args[++i], options[shortKeys[op]][3])
          parsed[shortKeys[op]].push(val)
        }
      } else {
        throw new Error('Unknown option: "' + op + '".')
      }
    }
  }

  const keys = Object.keys(longKeys)

  for (i = 0; i < keys.length; i++) {
    if (typeof parsed[keys[i]] === 'undefined') {
      // console.info('Found undefined option: ' + keys[ i ])

      options[keys[i]][1] === 'flag'
        ? parsed[keys[i]] = false
        : parsed[keys[i]] = options[keys[i]][3]
    }
  }

  return parsed
}

function usage (options) {
  let pad = 0

  return '# Usage\n ' +
    (options.name || process.argv[1]) +
    Object.keys(options).map((o) => {
      pad = 12 - o.length
      return '\n-' +
      options[o][0] +
      ' | -' + o +
      (' '.repeat(pad > 0 ? pad : 1)) +
      ' - ' +
      options[o][4]
    }).join('')
}

module.exports = {
  parse,
  usage
}
