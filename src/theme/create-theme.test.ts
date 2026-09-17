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
    expect(Object.isFrozen(config.button.base)).toBe(false)
    expect(Object.isFrozen(config.button.defaultVariants)).toBe(false)
    expect(config.button.defaultVariants.size).toBe('sm')
  })

  test('does not freeze caller input objects or nested references', () => {
    const base = { root: 'p-2' }
    const variants = { size: { sm: { root: 'p-1' } } }
    const compoundVariants = [{ variants: { size: 'sm' as const }, root: 'font-bold' }]
    const defaultVariants = { size: 'sm' as const }
    const config = {
      button: {
        base,
        variants,
        compoundVariants,
        defaultVariants,
      },
    }

    defineTheme(config)

    expect(Object.isFrozen(config)).toBe(false)
    expect(Object.isFrozen(config.button)).toBe(false)
    expect(Object.isFrozen(base)).toBe(false)
    expect(Object.isFrozen(variants)).toBe(false)
    expect(Object.isFrozen(variants.size)).toBe(false)
    expect(Object.isFrozen(variants.size.sm)).toBe(false)
    expect(Object.isFrozen(compoundVariants)).toBe(false)
    expect(Object.isFrozen(compoundVariants[0])).toBe(false)
    expect(Object.isFrozen(compoundVariants[0]!.variants)).toBe(false)
    expect(Object.isFrozen(defaultVariants)).toBe(false)
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
