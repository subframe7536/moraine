import { describe, expect, test } from 'vitest'

import { createTheme } from './create-theme.ts'
import { THEME_LAYERS } from './types.ts'

describe('createTheme', () => {
  test('allocates no component entries for an empty Theme', () => {
    const theme = createTheme()
    expect(theme[THEME_LAYERS]).toEqual([])
    expect(Object.isFrozen(theme)).toBe(true)
    expect(Object.isFrozen(theme[THEME_LAYERS])).toBe(true)
  })

  test('retains parent layers and compiles only supplied entries', () => {
    const parent = createTheme({ button: { base: { root: 'p-2' }, defaults: { size: 'sm' } } })
    const config = { button: { base: { label: 'font-bold' } } } as const
    const child = createTheme({ extends: parent, ...config })
    const layers = child[THEME_LAYERS]
    expect(layers).toHaveLength(2)
    expect(layers[0]).toBe(parent[THEME_LAYERS][0])
    expect(Object.keys(layers[1]!)).toEqual(['button'])
    expect(layers[1]?.button?.recipe()).toEqual({ label: 'font-bold' })
    expect(layers[1]?.button?.recipe.options).toBe(config.button)
    expect(Object.isFrozen(layers[1])).toBe(true)
    expect(createTheme({ extends: child })[THEME_LAYERS]).toEqual(layers)
  })
})
