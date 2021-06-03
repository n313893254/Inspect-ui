export const UNITS = ['', 'K', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y']
export const FRACTIONAL = ['', 'm', 'u', 'n', 'p', 'f', 'a', 'z', 'y'] // milli micro nano pico femto

export function formatSi(inValue, {
  increment = 1000,
  addSuffix = true,
  suffix = '',
  firstSuffix = null,
  startingExponent = 0,
  minExponent = 0,
  maxExponent = 99,
  maxPrecision = 2
} = {}) {
  let val = inValue
  let exp = startingExponent

  // TODO More to think about re: min > max
  while ( ( val >= increment && exp + 1 < UNITS.length && exp < maxExponent ) || exp < minExponent ) {
    val = val / increment
    exp++
  }

  let out = ''

  if ( val < 10 && maxPrecision >= 2 ) {
    out = `${ Math.round(val * 100) / 100 }`
  } else if ( val < 100 && maxPrecision >= 1) {
    out = `${ Math.round(val * 10) / 10 }`
  } else {
    out = `${ Math.round(val) }`
  }

  if ( addSuffix ) {
    if ( exp === 0 && firstSuffix !== null) {
      out += ` ${ firstSuffix }`
    } else {
      out += ` ${ UNITS[exp] }${ suffix }` || ''
    }
  }

  return out
}

export function exponentNeeded(val, increment = 1000) {
  let exp = 0

  while ( val >= increment ) {
    val = val / increment
    exp++
  }

  return exp
}

export function parseSi(inValue, { increment = null, allowFractional = true } = {}) {
  if ( !inValue || typeof inValue !== 'string' || !inValue.length ) {
    return NaN
  }

  inValue = inValue.replace(/,/g, '')

  // eslint-disable-next-line prefer-const
  let [, valStr, unit, incStr] = inValue.match(/^([0-9.-]+)\s*([^0-9.-]?)([^0-9.-]?)/)
  const val = parseFloat(valStr)

  if ( !unit ) {
    return val
  }

  // micro "mu" symbol -> u
  if ( unit.charCodeAt(0) === 181 ) {
    unit = 'u'
  }

  const divide = FRACTIONAL.includes(unit)
  const multiply = UNITS.includes(unit.toUpperCase())

  if ( increment === null ) {
    // Automatically handle 1 KB = 1000B, 1 KiB = 1024B if no increment set
    if ( (multiply || divide) && incStr === 'i' ) {
      increment = 1024
    } else {
      increment = 1000
    }
  }

  if ( divide && allowFractional ) {
    const exp = FRACTIONAL.indexOf(unit)

    return val / (increment ** exp)
  }

  if ( multiply ) {
    const exp = UNITS.indexOf(unit.toUpperCase())

    return val * (increment ** exp)
  }

  // Unrecognized unit character
  return val
}

export function roundValue(value) {
  if ( value < 1 ) {
    return Math.round(value * 100) / 100
  } else if ( value < 10 ) {
    return Math.round(value * 10) / 10
  } else {
    return Math.round(value)
  }
}

export function formatMib(value) {
  return formatSi(value, {
    increment:    1024,
    addSuffix:    true,
    suffix:       'iB',
    maxPrecision: 2,
    firstSuffix:  'B',
  })
}

export function formatKbps(value) {
  return formatSi(value, 1000, 'bps', 'Bps', 1)
}

export function formatPercent(value, maxPrecision = 2) {
  if ( value < 1 && maxPrecision >= 2 ) {
    return `${ Math.round(value * 100) / 100  }%`
  } else if ( value < 10  && maxPrecision >= 1 ) {
    return `${ Math.round(value * 10) / 10  }%`
  } else {
    return `${ Math.round(value)  }%`
  }
}

export default {
  exponentNeeded,
  formatSi,
  parseSi,
  roundValue,
  formatMib,
  formatKbps,
  formatPercent,
}
