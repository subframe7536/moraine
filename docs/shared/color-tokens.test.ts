import { describe, expect, it } from 'vitest'

import { DEFAULT_THEME_COLORS } from '../../src/theme/defaults'
import { DEFAULT_MIX_PERCENT, MORAINE_COLORS, THEME_COLOR_ROLES } from '../../src/theme/tokens'

import { formatDocsColorTokenDefault, listDocsColorTokens } from './color-tokens'

function findToken(name: string) {
  const token = listDocsColorTokens().find((item) => item.name === name)
  expect(token, name).toBeDefined()
  return token!
}

describe('listDocsColorTokens', () => {
  it('lists every public theme color role and variant', () => {
    const tokens = listDocsColorTokens()
    const expectedCount = THEME_COLOR_ROLES.reduce((count, color) => {
      const schema = MORAINE_COLORS[color]
      return count + (typeof schema === 'string' ? 1 : Object.keys(schema).length)
    }, 0)

    expect(tokens).toHaveLength(expectedCount)
    expect(new Set(tokens.map((token) => token.name)).size).toBe(expectedCount)
    for (const token of tokens) {
      expect(token.cssVariable).toBe(`--${token.name}`)
    }
    expect(tokens.map((token) => token.name)).toEqual(
      expect.arrayContaining([
        'background',
        'background-hover',
        'foreground',
        'primary',
        'primary-foreground',
        'primary-hover',
        'primary-active',
        'primary-ink',
        'accent-hover',
        'accent-active',
        'warning-foreground',
        'warning-hover',
        'warning-active',
        'control',
        'backdrop',
        'ring',
      ]),
    )
  })

  it('keeps the utility value so swatches follow fallbacks', () => {
    expect(findToken('danger-foreground').value).toBe('var(--danger-foreground, var(--background))')
  })

  it('reads light and dark defaults from the preset palette', () => {
    expect(findToken('primary').defaults).toEqual({
      light: { type: 'value', value: DEFAULT_THEME_COLORS.light.primary.base },
      dark: { type: 'value', value: DEFAULT_THEME_COLORS.dark.primary.base },
    })
    expect(findToken('muted-foreground').defaults.dark).toEqual({
      type: 'value',
      value: DEFAULT_THEME_COLORS.dark.muted.foreground,
    })
    expect(findToken('foreground').defaults.light).toEqual({
      type: 'value',
      value: DEFAULT_THEME_COLORS.light.foreground,
    })
    expect(findToken('backdrop').defaults.dark).toEqual({
      type: 'value',
      value: DEFAULT_THEME_COLORS.dark.backdrop,
    })
  })

  it('describes derived defaults for state and status foreground rows', () => {
    expect(findToken('accent-hover').defaults.light).toEqual({
      type: 'auto',
      percent: DEFAULT_MIX_PERCENT.hover,
    })
    expect(findToken('background-active').defaults.dark).toEqual({
      type: 'auto',
      percent: DEFAULT_MIX_PERCENT.active,
    })
    expect(findToken('primary-hover').defaults.light).toEqual({
      type: 'auto',
      percent: DEFAULT_MIX_PERCENT.hover,
    })
    expect(findToken('warning-active').defaults.dark).toEqual({
      type: 'auto',
      percent: DEFAULT_MIX_PERCENT.active,
    })
    expect(findToken('primary-ink').defaults.light).toEqual({
      type: 'auto',
      percent: DEFAULT_MIX_PERCENT.ink,
    })
    expect(findToken('primary-soft').defaults.light).toEqual({
      type: 'auto',
      percent: DEFAULT_MIX_PERCENT.soft,
    })
    expect(findToken('primary-border').defaults.light).toEqual({
      type: 'auto',
      percent: DEFAULT_MIX_PERCENT.border,
    })
    expect(findToken('warning-foreground').defaults).toEqual({
      light: { type: 'fallback', variable: '--background' },
      dark: { type: 'fallback', variable: '--background' },
    })
    for (const token of listDocsColorTokens()) {
      expect(token.defaults.light.type, token.name).not.toBe('none')
      expect(token.defaults.dark.type, token.name).not.toBe('none')
    }
  })
})

describe('formatDocsColorTokenDefault', () => {
  it('formats values as inline code and derived defaults as short text', () => {
    expect(formatDocsColorTokenDefault({ type: 'value', value: 'rgb(0, 0, 0)' })).toBe(
      '`rgb(0, 0, 0)`',
    )
    expect(formatDocsColorTokenDefault({ type: 'auto', percent: 8 })).toBe('auto (color-mix, 8%)')
    expect(formatDocsColorTokenDefault({ type: 'fallback', variable: '--background' })).toBe(
      'falls back to `--background`',
    )
  })
})
