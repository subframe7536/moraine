import { render } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { describe, expect, test } from 'vitest'

import type { ButtonT } from '../../elements/button/button.types.ts'
import { createTheme } from '../../theme/create-theme.ts'
import { THEME_LAYERS } from '../../theme/types.ts'

import { createComponentStyles } from './create-component-styles.ts'
import { MoraineThemeContext } from './theme-context.tsx'

describe('createComponentStyles', () => {
  test('keeps undefined-only precedence reactive and preserves node identity', () => {
    const base = createTheme({
      button: {
        base: { root: 'p-2' },
        variants: { size: { sm: { root: 'text-sm' }, lg: { root: 'text-lg' } } },
        defaults: { size: 'sm' },
      },
    })
    const [theme, setTheme] = createSignal(base)
    const [size, setSize] = createSignal<ButtonT.Variant['size']>()
    const [inherited, setInherited] = createSignal<ButtonT.Variant['size']>()
    function Fixture() {
      const styles = createComponentStyles(
        'button',
        {
          get size() {
            return size()
          },
        },
        {
          inheritedVariants: () => ({ size: inherited() }),
        },
      )
      return <button {...styles.root}>Save</button>
    }
    const screen = render(() => (
      <MoraineThemeContext.Provider value={() => theme()[THEME_LAYERS]}>
        <Fixture />
      </MoraineThemeContext.Provider>
    ))
    const button = screen.getByRole('button')
    expect(button.className).toBe('p-2 text-sm')
    setTheme(
      createTheme({ extends: base, button: { base: { root: 'p-4' }, defaults: { size: 'lg' } } }),
    )
    expect(button.className).toBe('text-lg p-4')
    setInherited('sm')
    expect(button.className).toBe('text-sm p-4')
    setSize('lg')
    expect(button.className).toBe('text-lg p-4')
    setSize(null)
    expect(button.className).toBe('p-4')
    setSize(undefined)
    expect(button.className).toBe('text-sm p-4')
    expect(screen.getByRole('button')).toBe(button)
  })

  test('merges group, instance, and root bindings after dynamic styles', () => {
    function Fixture() {
      const styles = createComponentStyles(
        'button',
        {
          class: 'p-4',
          classes: { root: 'p-3', label: 'text-lg' },
          style: { color: 'red' },
          styles: { root: { color: 'blue' } },
        },
        {
          groupStyles: () => ({ classes: { root: 'p-2' }, styles: { root: { color: 'green' } } }),
          dynamicStyles: () => ({ root: { color: 'black', width: '20px' } }),
        },
      )
      return (
        <button {...styles.root}>
          <span {...styles.slot('label')}>Save</span>
        </button>
      )
    }
    const screen = render(() => <Fixture />)
    const button = screen.getByRole('button')
    expect(button.className).toBe('p-4')
    expect(button.style.color).toBe('red')
    expect(button.style.width).toBe('20px')
    expect(screen.getByText('Save').className).toBe('text-lg')
  })
})
