// @vitest-environment node

import { globSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, test } from 'vitest'

import { createTheme } from '../../src/theme.ts'
import * as themeApi from '../../src/theme.ts'
import { defaultTheme } from '../../src/theme/default-theme.ts'
import { THEME_LAYERS } from '../../src/theme/types.ts'

const root = resolve(import.meta.dirname, '../..')

describe('Theme architecture', () => {
  test('keeps the public authoring API separate from the official presentation', () => {
    expect(Object.keys(themeApi).sort()).toEqual(['atomicRecipe', 'createTheme', 'slotRecipe'])
    expect(createTheme()[THEME_LAYERS]).toHaveLength(0)
    expect(defaultTheme[THEME_LAYERS]).toHaveLength(1)
    expect(defaultTheme[THEME_LAYERS][0]?.button?.recipe({ size: 'sm' }).root).toContain('h-7')
  })

  test('keeps component imports independent of official Recipe modules', () => {
    const violations = []
    for (const file of globSync('src/{elements,forms,navigation,overlays}/**/*.tsx', {
      cwd: root,
    })) {
      if (/\.(test|fixture)\./.test(file)) {
        continue
      }
      const text = readFileSync(resolve(root, file), 'utf8')
      if (/from ['"][^'"]*(?:\.class(?:\.ts)?|default-theme)['"]/.test(text)) {
        violations.push(file)
      }
    }
    expect(violations).toEqual([])
  })

  test('compiles a variant-only slot and matching compound without a base inventory', () => {
    const theme = createTheme({
      button: {
        variants: { size: { sm: { label: 'text-sm' } } },
        compoundVariants: [{ size: 'sm', class: { trailing: 'font-bold' } }],
      },
    })
    const recipe = theme[THEME_LAYERS][0].button!.recipe
    expect(recipe({ size: 'sm' })).toEqual({ label: 'text-sm', trailing: 'font-bold' })
    expect(recipe({ size: null })).toEqual({})
  })
})
