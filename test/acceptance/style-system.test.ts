// @vitest-environment node

import { globSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, test } from 'vitest'

import * as stylesApi from '../../src/styles'
import * as themeApi from '../../src/theme'
import { defineTheme } from '../../src/theme'
import { getThemeRecipeLayers } from '../../src/theme/create-theme'

const root = resolve(import.meta.dirname, '../..')

describe('Theme architecture', () => {
  test('exposes only the supported Theme builder at runtime', () => {
    expect(Object.keys(themeApi).sort()).toEqual(['defineTheme'])
    expect(Object.keys(defineTheme())).toEqual([])
  })

  test('exports component recipe definitions through the styles entry', () => {
    expect(stylesApi.buttonRecipe.key).toBe('button')
    expect(stylesApi.buttonRecipe.slots).toContain('root')
    expect(stylesApi.dialogRecipe.key).toBe('dialog')
  })

  test('keeps component runtime resolution recipe-symbol based', () => {
    const violations: string[] = []
    for (const file of globSync('src/{elements,forms,navigation,overlays}/**/*.tsx', {
      cwd: root,
    })) {
      if (/\.(test|fixture)\./.test(file)) {
        continue
      }
      const text = readFileSync(resolve(root, file), 'utf8')
      if (/createComponentStyles\(|resolved\.slot\(|dynamicStyles:|groupStyles:/.test(text)) {
        violations.push(file)
      }
    }
    expect(violations).toEqual([])
  })

  test('records partial variant and compound overrides without a default recipe registry', () => {
    const theme = defineTheme({
      button: {
        variants: { size: { sm: { label: 'text-sm' } } },
        compoundVariants: [{ variants: { size: 'sm' }, trailing: 'font-bold' }],
      },
    })
    expect(getThemeRecipeLayers(theme, 'button')).toEqual([
      {
        variants: { size: { sm: { label: 'text-sm' } } },
        compoundVariants: [{ variants: { size: 'sm' }, trailing: 'font-bold' }],
      },
    ])
  })
})
