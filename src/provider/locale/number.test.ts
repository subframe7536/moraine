import { describe, expect, test } from 'vitest'

import { formatLocaleNumber, isPartialNumber, parseLocaleNumber, toNumber } from './number'

describe('locale number', () => {
  test('parses and formats Intl separators', () => {
    expect(parseLocaleNumber('12,5', 'de-DE')).toBe(12.5)
    expect(parseLocaleNumber('99,99', 'fr-FR')).toBe(99.99)
    expect(parseLocaleNumber('12.5', 'en-US')).toBe(12.5)
    expect(formatLocaleNumber(12.5, 'de-DE')).toBe('12,5')
    expect(formatLocaleNumber(12.5, 'en-US')).toBe('12.5')
  })

  test('parses numbering-system digits from Intl.NumberFormat', () => {
    expect(parseLocaleNumber('۱۲٫۳۴', 'fa-IR')).toBe(12.34)
    expect(parseLocaleNumber('١٢٬٣٤٥٫٦', 'ar-EG')).toBe(12345.6)
    expect(parseLocaleNumber('１２，３４５．６', 'ja-JP-u-nu-fullwide')).toBe(12345.6)
  })

  test('treats trailing locale decimals as partial input', () => {
    expect(isPartialNumber(',', 'de-DE')).toBe(true)
    expect(isPartialNumber('12,', 'de-DE')).toBe(true)
    expect(isPartialNumber('-', 'en-US')).toBe(true)
    expect(isPartialNumber('12.5', 'en-US')).toBe(false)
    expect(isPartialNumber('abc.', 'en-US')).toBe(false)
    expect(isPartialNumber('12.3.', 'en-US')).toBe(false)
    expect(isPartialNumber('12..', 'en-US')).toBe(false)
  })

  test('parses unicode minus signs', () => {
    expect(parseLocaleNumber('\u221212.5', 'en-US')).toBe(-12.5)
    expect(parseLocaleNumber('\uFF0D12.5', 'en-US')).toBe(-12.5)
    expect(isPartialNumber('\u2212', 'en-US')).toBe(true)
    expect(isPartialNumber('\u2212.', 'en-US')).toBe(true)
  })

  test('falls back for empty and invalid strings', () => {
    expect(parseLocaleNumber('', 'en-US')).toBeUndefined()
    expect(parseLocaleNumber('abc', 'en-US')).toBeUndefined()
    expect(toNumber('12,5', 0, 'de-DE')).toBe(12.5)
    expect(toNumber(undefined, 3, 'en-US')).toBe(3)
  })
})
