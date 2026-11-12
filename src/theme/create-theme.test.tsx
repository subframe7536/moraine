import { render } from '@solidjs/testing-library'
import { describe, expect, test } from 'vitest'

import { Button } from '../components/button/button'
import { MoraineProvider } from '../provider/moraine-provider'

import { defineTheme } from './create-theme'

describe('defineTheme', () => {
  test('does not freeze or mutate caller input', () => {
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

    expect(Object.isFrozen(config.button)).toBe(false)
    expect(Object.isFrozen(base)).toBe(false)
    expect(Object.isFrozen(variants.size.sm)).toBe(false)
    expect(Object.isFrozen(compoundVariants[0])).toBe(false)
    expect(defaultVariants).toEqual({ size: 'sm' })
  })

  test('a child theme layers its classes on top of the theme it extends', () => {
    const parent = defineTheme({ button: { base: { root: 'parent-sentinel' } } })
    const child = defineTheme({
      extends: parent,
      button: { base: { root: 'child-sentinel' } },
    })
    const screen = render(() => (
      <MoraineProvider theme={child}>
        <Button>Save</Button>
      </MoraineProvider>
    ))
    const className = screen.getByRole('button').className
    expect(className).toContain('parent-sentinel')
    expect(className).toContain('child-sentinel')
  })

  test('a child default variant replaces the parent default', () => {
    const parent = defineTheme({
      button: {
        defaultVariants: { size: 'sm' },
        variants: {
          size: {
            sm: { root: 'small-sentinel' },
            lg: { root: 'large-sentinel' },
          },
        },
      },
    })
    const child = defineTheme({
      extends: parent,
      button: { defaultVariants: { size: 'lg' } },
    })
    const screen = render(() => (
      <MoraineProvider theme={child}>
        <Button>Save</Button>
      </MoraineProvider>
    ))
    const className = screen.getByRole('button').className
    expect(className).toContain('large-sentinel')
    expect(className).not.toContain('small-sentinel')
  })

  test('keeps the base, middle, and child layers of a multi-level extends chain', () => {
    const base = defineTheme({ button: { base: { root: 'base-sentinel' } } })
    const middle = defineTheme({ extends: base, button: { base: { root: 'middle-sentinel' } } })
    const child = defineTheme({ extends: middle, button: { base: { root: 'child-sentinel' } } })
    const screen = render(() => (
      <MoraineProvider theme={child}>
        <Button>Save</Button>
      </MoraineProvider>
    ))
    const className = screen.getByRole('button').className
    expect(className).toContain('base-sentinel')
    expect(className).toContain('middle-sentinel')
    expect(className).toContain('child-sentinel')
  })
})
