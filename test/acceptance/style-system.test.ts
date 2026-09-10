// @vitest-environment node

import { globSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, test } from 'vitest'

import { createTheme, defaultTheme, emptyTheme } from '../../src/theme.ts'
import * as themeApi from '../../src/theme.ts'

const root = resolve(import.meta.dirname, '../..')

describe('Theme architecture', () => {
  test('exports empty and official presentation through the theme entry', () => {
    expect(Object.keys(themeApi).sort()).toEqual([
      'atomicRecipe',
      'createTheme',
      'defaultTheme',
      'emptyTheme',
      'slotRecipe',
    ])
    expect(createTheme()).toEqual(emptyTheme)
    expect(
      defaultTheme.button?.recipes.map((recipe) => recipe({ size: 'sm' }).root).join(' '),
    ).toContain('h-7')
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

  test('leaves component transition timing to the host utility framework', () => {
    const violations = []
    for (const file of globSync('src/{elements,forms,navigation,overlays}/**/*.class.ts', {
      cwd: root,
    })) {
      const text = readFileSync(resolve(root, file), 'utf8')
      if (/\b(?:duration|ease)-/.test(text)) {
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
    expect(theme.button?.recipes.map((recipe) => recipe({ size: 'sm' }))).toEqual([
      { label: 'text-sm', trailing: 'font-bold' },
    ])
    expect(theme.button?.recipes.map((recipe) => recipe({ size: null }))).toEqual([{}])
  })
})
