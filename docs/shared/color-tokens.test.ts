import { describe, expect, it } from 'vitest'

import { MORAINE_COLORS } from '../../src/theme/tokens.ts'

import { listDocsColorTokens } from './color-tokens.ts'

describe('listDocsColorTokens', () => {
  it('lists every MORAINE_COLORS entry and variant', () => {
    const tokens = listDocsColorTokens()
    const expectedCount = Object.values(MORAINE_COLORS).reduce(
      (count, schema) => count + (typeof schema === 'string' ? 1 : Object.keys(schema).length),
      0,
    )

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
        'warning-foreground',
        'control',
        'backdrop',
        'ring',
      ]),
    )
  })

  it('keeps the utility value so swatches follow fallbacks', () => {
    const token = listDocsColorTokens().find((item) => item.name === 'danger-foreground')
    expect(token?.value).toBe('var(--danger-foreground, var(--background))')
  })
})
