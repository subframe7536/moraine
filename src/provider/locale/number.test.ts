import { describe, expect, it } from 'vitest'

import { formatLocaleNumber, isPartialNumber, parseLocaleNumber, toNumber } from './number'
describe('locale number', () => {
  it('parses and formats Intl separators', () => {
    expect(parseLocaleNumber('12,5', 'de-DE')).toBe(12.5)
    expect(parseLocaleNumber('99,99', 'fr-FR')).toBe(99.99)
    expect(parseLocaleNumber('12.5', 'en-US')).toBe(12.5)
    expect(formatLocaleNumber(12.5, 'de-DE')).toBe('12,5')
    expect(formatLocaleNumber(12.5, 'en-US')).toBe('12.5')
  })

  it('parses numbering-system digits from Intl.NumberFormat', () => {
    expect(parseLocaleNumber('۱۲٫۳۴', 'fa-IR')).toBe(12.34)
    expect(parseLocaleNumber('١٢٬٣٤٥٫٦', 'ar-EG')).toBe(12_345.6)
    expect(parseLocaleNumber('１２，３４５．６', 'ja-JP-u-nu-fullwide')).toBe(12_345.6)
  })

  it('treats trailing locale decimals as partial input', () => {
    expect(isPartialNumber(',', 'de-DE')).toBe(true)
    expect(isPartialNumber('12,', 'de-DE')).toBe(true)
    expect(isPartialNumber('-', 'en-US')).toBe(true)
    expect(isPartialNumber('12.5', 'en-US')).toBe(false)
    expect(isPartialNumber('abc.', 'en-US')).toBe(false)
    expect(isPartialNumber('12.3.', 'en-US')).toBe(false)
    expect(isPartialNumber('12..', 'en-US')).toBe(false)
  })

  it('parses unicode minus signs', () => {
    expect(parseLocaleNumber('\u221212.5', 'en-US')).toBe(-12.5)
    expect(parseLocaleNumber('\uFF0D12.5', 'en-US')).toBe(-12.5)
    expect(isPartialNumber('\u2212', 'en-US')).toBe(true)
    expect(isPartialNumber('\u2212.', 'en-US')).toBe(true)
  })

  it('round-trips scientific and engineering notation', () => {
    const scientific = { notation: 'scientific' } as const
    const engineering = { notation: 'engineering' } as const
    for (const options of [scientific, engineering]) {
      expect(
        parseLocaleNumber(formatLocaleNumber(1_200_000, 'en-US', options), 'en-US', options),
      ).toBe(1_200_000)
      expect(parseLocaleNumber(formatLocaleNumber(6, 'en-US', options), 'en-US', options)).toBe(6)
      expect(
        parseLocaleNumber(formatLocaleNumber(-0.005, 'en-US', options), 'en-US', options),
      ).toBe(-0.005)
    }
    expect(parseLocaleNumber('1.2E6', 'en-US', scientific)).toBe(1_200_000)
    expect(parseLocaleNumber('1.2e6', 'en-US', scientific)).toBe(1_200_000)
    expect(parseLocaleNumber('1.2E-2', 'en-US', scientific)).toBe(0.012)
    expect(parseLocaleNumber('1.2E', 'en-US', scientific)).toBeUndefined()
    expect(parseLocaleNumber('1.2Ex', 'en-US', scientific)).toBeUndefined()
  })

  it('round-trips compact notation', () => {
    const compact = { notation: 'compact' } as const
    expect(
      parseLocaleNumber(formatLocaleNumber(1_200_000, 'en-US', compact), 'en-US', compact),
    ).toBe(1_200_000)
    expect(parseLocaleNumber(formatLocaleNumber(34_000, 'en-US', compact), 'en-US', compact)).toBe(
      34_000,
    )
    expect(parseLocaleNumber('1.2M', 'en-US', compact)).toBe(1_200_000)
    expect(parseLocaleNumber('1.2X', 'en-US', compact)).toBeUndefined()
    expect(parseLocaleNumber(formatLocaleNumber(12_000, 'zh-CN', compact), 'zh-CN', compact)).toBe(
      12_000,
    )
  })

  it('parses percent and permille signs as scale factors', () => {
    expect(parseLocaleNumber('50%', 'en-US')).toBe(0.5)
    expect(parseLocaleNumber('50‰', 'en-US')).toBe(0.05)
    const percent = { style: 'percent' } as const
    expect(parseLocaleNumber(formatLocaleNumber(0.25, 'en-US', percent), 'en-US', percent)).toBe(
      0.25,
    )
  })

  it('falls back for empty and invalid strings', () => {
    expect(parseLocaleNumber('', 'en-US')).toBeUndefined()
    expect(parseLocaleNumber('abc', 'en-US')).toBeUndefined()
    expect(toNumber('12,5', 0, 'de-DE')).toBe(12.5)
    expect(toNumber(undefined, 3, 'en-US')).toBe(3)
  })
})
