import { describe, expect, test } from 'vitest'

import { getThemeRecipeLayers, getThemeLayers, defineTheme } from './create-theme'

describe('defineTheme', () => {
  test('creates opaque immutable themes and records only supplied overrides', () => {
    const theme = defineTheme({ button: { base: { root: 'p-2' } } })
    expect(Object.isFrozen(theme)).toBe(true)
    expect(Object.keys(theme)).toEqual([])
    expect(getThemeRecipeLayers(theme, 'button')).toEqual([{ base: { root: 'p-2' } }])
    expect(getThemeRecipeLayers(theme, 'input')).toEqual([])
  })

  test('preserves ordered extends layers without mutating parent input', () => {
    const config = { button: { base: { root: 'p-2' }, defaultVariants: { size: 'sm' } } } as const
    const parent = defineTheme(config)
    const child = defineTheme({
      extends: parent,
      button: { base: { label: 'font-bold' }, defaultVariants: { size: 'lg' } },
    })
    expect(getThemeRecipeLayers(child, 'button')).toEqual([
      { base: { root: 'p-2' }, defaultVariants: { size: 'sm' } },
      { base: { label: 'font-bold' }, defaultVariants: { size: 'lg' } },
    ])
    expect(Object.isFrozen(config.button)).toBe(false)
    expect(config.button.defaultVariants.size).toBe('sm')
  })

  test('retains replacement markers and later additive layers', () => {
    const base = defineTheme({ button: { base: { root: 'base' } } })
    const replaced = defineTheme({
      extends: base,
      button: {
        replace: true,
        base: { root: 'replacement', loading: '', leading: '', label: '', trailing: '' },
      },
    })
    const child = defineTheme({ extends: replaced, button: { base: { root: 'child' } } })
    expect(getThemeRecipeLayers(child, 'button')).toEqual([
      { base: { root: 'base' } },
      {
        replace: true,
        base: { root: 'replacement', loading: '', leading: '', label: '', trailing: '' },
      },
      { base: { root: 'child' } },
    ])
    expect(getThemeLayers(child)).toHaveLength(3)
  })
})
