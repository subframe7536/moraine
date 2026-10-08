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

function getLocaleNumberSymbols(locale: string | undefined): LocaleNumberSymbols {
  const key = locale || FALLBACK_LOCALE
  const cached = symbolCache.get(key)
  if (cached) {
    return cached
  }

  const formatter = createNumberFormat(key, {
    useGrouping: true,
    signDisplay: 'always',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
  const parts = formatter.formatToParts(-1234567.8)
  const plusParts = createNumberFormat(key, { signDisplay: 'always' }).formatToParts(1)
  const decimal = parts.find((part) => part.type === 'decimal')?.value ?? '.'
  const group = parts.find((part) => part.type === 'group')?.value ?? ''
  const minus = parts.find((part) => part.type === 'minusSign')?.value ?? '-'
  const plus = plusParts.find((part) => part.type === 'plusSign')?.value ?? '+'
  const digits = new Map<string, string>()
  const digitFormatter = createNumberFormat(key, { useGrouping: false })
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
  for (const part of parts) {
    if (part.type === 'literal') {
      ignore.add(part.value)
    }
  }
  ignore.add(' ')
  ignore.add('\u00A0')
  ignore.add('\u202F')
  ignore.add('\u200E')
  ignore.add('\u200F')
  ignore.add('\u061C')

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
    char === '\uFF0D' ||
    char === '\uFF0B'
  )
}

/** True when the string is an in-progress number, such as `-`, `,`, or `12,`. */
export function isPartialNumber(value: string, locale?: string): boolean {
  const trimmed = value.trim().normalize('NFKC')
  if (trimmed === '') {
    return true
  }

  const symbols = getLocaleNumberSymbols(locale)
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
    return parseLocaleNumber(prefix, locale) !== undefined
  }

  return false
}

/** Parses a locale-formatted number using `Intl.NumberFormat` symbols and digits. */
export function parseLocaleNumber(value: string, locale?: string): number | undefined {
  if (value === '' || value.trim() === '') {
    return undefined
  }

  const symbols = getLocaleNumberSymbols(locale)
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

  const parsed = Number(`${sign}${integer || '0'}${fraction ? `.${fraction}` : ''}`)
  return Number.isFinite(parsed) ? parsed : undefined
}

/** Formats a number using locale digits without grouping. */
export function formatLocaleNumber(value: number, locale?: string): string {
  return createNumberFormat(locale, {
    useGrouping: false,
    maximumFractionDigits: 20,
  }).format(value)
}

export function toNumber(
  value: string | number | undefined,
  fallback: number,
  locale?: string,
): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : fallback
  }

  if (typeof value === 'string' && value.trim() !== '') {
    return parseLocaleNumber(value, locale) ?? fallback
  }

  return fallback
}
