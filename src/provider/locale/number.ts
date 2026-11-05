import { FALLBACK_LOCALE } from './default-locale'

interface LocaleNumberSymbols {
  decimal: string
  group: string
  minus: string
  plus: string
  digits: Map<string, string>
  ignore: Set<string>
}

const symbolCache = new Map<string, LocaleNumberSymbols>()

const PERCENT_RE = /[%٪％﹪]/
const PERMILLE_RE = /[‰؉]/

function createNumberFormat(
  locale: string | undefined,
  options?: Intl.NumberFormatOptions,
): Intl.NumberFormat {
  try {
    return new Intl.NumberFormat(locale || undefined, options)
  } catch {
    return new Intl.NumberFormat(FALLBACK_LOCALE, options)
  }
}

function getLocaleNumberSymbols(
  locale: string | undefined,
  options?: Intl.NumberFormatOptions,
): LocaleNumberSymbols {
  const key = `${locale || FALLBACK_LOCALE}:${options ? JSON.stringify(options) : ''}`
  const cached = symbolCache.get(key)
  if (cached) {
    return cached
  }

  // Force sign/group/fraction emission so symbol detection works regardless of
  // the caller's display options, then add styled parts (currency, unit,
  // percent, literals) to the ignored set.
  const formatter = createNumberFormat(locale, {
    ...options,
    useGrouping: true,
    signDisplay: 'always',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
  const parts = formatter.formatToParts(-1234567.8)
  const plusParts = createNumberFormat(locale, {
    ...options,
    signDisplay: 'always',
  }).formatToParts(1)
  const decimal = parts.find((part) => part.type === 'decimal')?.value ?? '.'
  const group = parts.find((part) => part.type === 'group')?.value ?? ''
  const minus = parts.find((part) => part.type === 'minusSign')?.value ?? '-'
  const plus = plusParts.find((part) => part.type === 'plusSign')?.value ?? '+'
  const digits = new Map<string, string>()
  // Scaling styles (percent) change the emitted digits, so probe them with a plain format.
  const digitFormatter = createNumberFormat(locale, {
    numberingSystem: options?.numberingSystem,
    useGrouping: false,
  })
  for (let digit = 0; digit <= 9; digit += 1) {
    const localized =
      digitFormatter.formatToParts(digit).find((part) => part.type === 'integer')?.value ??
      String(digit)
    digits.set(localized, String(digit))
    digits.set(String(digit), String(digit))
  }

  const ignore = new Set<string>()
  if (group) {
    ignore.add(group)
  }
  for (const part of [...parts, ...plusParts]) {
    if (
      part.type !== 'integer' &&
      part.type !== 'decimal' &&
      part.type !== 'fraction' &&
      part.type !== 'minusSign' &&
      part.type !== 'plusSign'
    ) {
      for (const char of part.value) {
        ignore.add(char)
      }
    }
  }
  ignore.add(' ')
  ignore.add('\u00A0')
  ignore.add('\u202F')
  ignore.add('\u200E')
  ignore.add('\u200F')
  ignore.add('\u061C')
  ignore.add('%')
  ignore.add('\u066A')
  ignore.add('\uFF05')
  ignore.add('\uFE6A')
  ignore.add('\u2030')
  ignore.add('\u0609')

  const symbols = { decimal, group, minus, plus, digits, ignore }
  symbolCache.set(key, symbols)
  return symbols
}

function isSign(char: string, symbols: LocaleNumberSymbols): boolean {
  return (
    char === symbols.minus ||
    char === symbols.plus ||
    char === '-' ||
    char === '+' ||
    char === '\u2212' ||
    char === '\uFF0B' ||
    char === '\uFF0D'
  )
}

/** True when the string is an in-progress number, such as `-`, `,`, or `12,`. */
export function isPartialNumber(
  value: string,
  locale?: string,
  options?: Intl.NumberFormatOptions,
): boolean {
  const trimmed = value.trim().normalize('NFKC')
  if (trimmed === '') {
    return true
  }

  const symbols = getLocaleNumberSymbols(locale, options)
  if (isSign(trimmed, symbols)) {
    return true
  }

  const signedDecimal = [
    symbols.minus,
    '-',
    '\u2212',
    '\uFF0D',
    symbols.plus,
    '+',
    '\uFF0B',
    '',
  ].some((sign) => trimmed === `${sign}${symbols.decimal}`)
  if (signedDecimal) {
    return true
  }

  if (trimmed.endsWith(symbols.decimal)) {
    const prefix = trimmed.slice(0, -symbols.decimal.length)
    if (prefix.includes(symbols.decimal)) {
      return false
    }
    return parseLocaleNumber(prefix, locale, options) !== undefined
  }

  return false
}

function shiftDecimal(value: number, exponentDelta: number): number {
  const [coefficient, exponent = '0'] = String(value).split('e')
  return Number(`${coefficient}e${Number(exponent) + exponentDelta}`)
}

/** Parses a locale-formatted number using `Intl.NumberFormat` symbols and digits. */
export function parseLocaleNumber(
  value: string,
  locale?: string,
  options?: Intl.NumberFormatOptions,
): number | undefined {
  if (value === '' || value.trim() === '') {
    return undefined
  }

  const symbols = getLocaleNumberSymbols(locale, options)
  let sign = ''
  let integer = ''
  let fraction = ''
  let seenDecimal = false
  let seenDigit = false

  for (const char of value.trim().normalize('NFKC')) {
    if (symbols.ignore.has(char)) {
      continue
    }

    const digit = symbols.digits.get(char)
    if (digit !== undefined) {
      seenDigit = true
      if (seenDecimal) {
        fraction += digit
      } else {
        integer += digit
      }
      continue
    }

    if (char === symbols.decimal) {
      if (seenDecimal) {
        return undefined
      }
      seenDecimal = true
      continue
    }

    if (!seenDigit && sign === '' && isSign(char, symbols)) {
      sign = char === symbols.plus || char === '+' || char === '\uFF0B' ? '' : '-'
      continue
    }

    return undefined
  }

  if (!seenDigit) {
    return undefined
  }

  let parsed = Number(`${sign}${integer || '0'}${fraction ? `.${fraction}` : ''}`)
  if (!Number.isFinite(parsed)) {
    return undefined
  }

  // `style: 'percent'` always scales; `unit: 'percent'` keeps the raw value;
  // a bare percent or permille sign scales the parsed digits.
  const isUnitPercent = options?.style === 'unit' && options?.unit === 'percent'
  if (PERMILLE_RE.test(value)) {
    parsed = shiftDecimal(parsed, -3)
  } else if (!isUnitPercent && (options?.style === 'percent' || PERCENT_RE.test(value))) {
    parsed = shiftDecimal(parsed, -2)
  }

  return parsed
}

const plainFormatCache = new Map<string, Intl.NumberFormat>()

/** Formats a number using locale digits without grouping. */
export function formatLocaleNumber(
  value: number,
  locale?: string,
  options?: Intl.NumberFormatOptions,
): string {
  const key = `${locale || ''}:${options ? JSON.stringify(options) : ''}`
  let formatter = plainFormatCache.get(key)
  if (!formatter) {
    formatter = options
      ? createNumberFormat(locale, options)
      : createNumberFormat(locale, {
          useGrouping: false,
          maximumFractionDigits: 20,
        })
    plainFormatCache.set(key, formatter)
  }
  return formatter.format(value)
}

export function toNumber(
  value: string | number | undefined,
  fallback: number,
  locale?: string,
  options?: Intl.NumberFormatOptions,
): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : fallback
  }

  if (typeof value === 'string' && value.trim() !== '') {
    return parseLocaleNumber(value, locale, options) ?? fallback
  }

  return fallback
}
