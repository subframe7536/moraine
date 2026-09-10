import { describe, expect, test } from 'vitest'

import { cn } from '../shared/utils'

import { createTheme } from './create-theme'

describe('createTheme', () => {
  test('supports empty themes and components without variants', () => {
    expect(createTheme()).toEqual({})
    const theme = createTheme({
      collapsible: { base: { content: 'overflow-hidden' } },
      button: undefined,
    })
    expect(theme.collapsible?.recipes.flatMap((recipe) => recipe().content)).toEqual([
      'overflow-hidden',
    ])
    expect(theme.button).toBeUndefined()
  })

  test('preserves untouched components and parent inputs when extending', () => {
    const config = {
      button: { base: { root: 'p-2' }, defaults: { size: 'sm' } },
      input: { base: { root: 'input-class' } },
    } as const
    const parent = createTheme(config)
    const child = createTheme({
      extends: parent,
      button: { base: { label: 'font-bold' }, defaults: { size: 'lg' } },
    })
    expect(child.input?.recipes.flatMap((recipe) => recipe().root)).toEqual(['input-class'])
    expect(child.button?.defaults?.size).toBe('lg')
    expect(parent.button?.defaults?.size).toBe('sm')
    expect(parent.button?.recipes.flatMap((recipe) => recipe().label).filter(Boolean)).toEqual([])
    expect(config.button.defaults.size).toBe('sm')
    expect(Object.isFrozen(config.button)).toBe(false)
    expect(createTheme({ extends: child }).button?.defaults?.size).toBe('lg')
  })

  test('keeps non-undefined defaults and lets child defaults drive every recipe in order', () => {
    const parent = createTheme({
      button: {
        defaults: { size: 'sm', variant: 'outline' },
        variants: {
          size: { sm: { root: 'p-2', label: 'text-sm' }, lg: { root: 'p-3', label: 'text-lg' } },
        },
        compoundVariants: [{ size: 'lg', variant: 'outline', class: { label: 'font-bold' } }],
      },
    })
    const child = createTheme({
      extends: parent,
      button: {
        defaults: { size: 'lg', variant: undefined },
        base: { root: 'p-4', label: 'font-normal' },
        variants: { size: { lg: { label: 'italic' } } },
        compoundVariants: [{ size: 'lg', class: { label: 'font-medium' } }],
      },
    })
    const entry = child.button!
    const outputs = entry.recipes.map((recipe) => recipe(entry.defaults))
    expect(entry.defaults).toEqual({ size: 'lg', variant: 'outline' })
    expect(cn(...outputs.map((output) => output.root))).toBe('p-4')
    expect(cn(...outputs.map((output) => output.label))).toBe('text-lg italic font-medium')
    const small = createTheme({ extends: parent, button: { base: { root: 'p-4' } } }).button!
    expect(cn(...small.recipes.map((recipe) => recipe(small.defaults).root))).toBe('p-4')
  })
})
