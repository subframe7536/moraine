import { render } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { describe, expect, test } from 'vitest'

import type { ButtonT } from '../../elements/button/button.types'
import { createTheme } from '../../theme/create-theme'
import { emptyTheme } from '../../theme/types.ts'

import { createComponentStyles } from './create-component-styles'
import { MoraineThemeContext } from './theme-context'

describe('createComponentStyles', () => {
  test('keeps undefined-only precedence reactive and preserves node identity', () => {
    const base = createTheme({
      button: {
        base: { root: 'p-2' },
        variants: {
          size: { sm: { root: 'text-sm' }, lg: { root: 'text-lg' } },
        },
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
      <MoraineThemeContext.Provider value={theme}>
        <Fixture />
      </MoraineThemeContext.Provider>
    ))
    const button = screen.getByRole('button')
    expect(button.className).toBe('p-2 text-sm')
    setTheme(
      createTheme({
        extends: base,
        button: { base: { root: 'p-4' }, defaults: { size: 'lg' } },
      }),
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
    const [classes, setClasses] = createSignal<ButtonT.Classes>({ root: 'p-3', label: 'text-lg' })
    const [slotStyles, setSlotStyles] = createSignal<ButtonT.Styles>({ root: { color: 'blue' } })
    function Fixture() {
      const styles = createComponentStyles(
        'button',
        {
          class: 'p-4',
          get classes() {
            return classes()
          },
          style: { color: 'red' },
          get styles() {
            return slotStyles()
          },
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
    const label = screen.getByText('Save')
    expect(label.className).toBe('text-lg')
    expect(label.style.color).toBe('')
    setClasses({ root: 'p-5', label: 'text-sm' })
    setSlotStyles({ root: { width: '30px' }, label: { color: 'purple' } })
    expect(button.className).toBe('p-4')
    expect(button.style.color).toBe('red')
    expect(button.style.width).toBe('30px')
    expect(label.className).toBe('text-sm')
    expect(label.style.color).toBe('purple')
    expect(screen.getByText('Save')).toBe(label)
  })

  test('preserves false over inherited and theme defaults', () => {
    const theme = createTheme({
      select: {
        defaults: { search: true },
        variants: {
          search: {
            true: { root: 'searchable' },
            false: { root: 'plain' },
          },
        },
      },
    })
    const [search, setSearch] = createSignal<boolean | null | undefined>(false)
    function Fixture() {
      const styles = createComponentStyles(
        'select',
        {
          get search() {
            return search()
          },
        },
        { inheritedVariants: () => ({ search: true }) },
      )
      return <div data-testid="select" {...styles.root} />
    }
    const screen = render(() => (
      <MoraineThemeContext.Provider value={() => theme}>
        <Fixture />
      </MoraineThemeContext.Provider>
    ))
    const root = screen.getByTestId('select')
    expect(root.className).toBe('plain')
    setSearch(null)
    expect(root.className).toBe('')
    setSearch(undefined)
    expect(root.className).toBe('searchable')
  })
})

test('inherits theme variables and removes stale values without replacing nodes', () => {
  const parent = createTheme({
    button: {
      defaults: { size: 'sm' },
      base: { '--shared': 'parent' },
      variants: {
        size: {
          sm: { '--size': '8px' },
          lg: { '--size': '16px', '--large': 'yes' },
        },
      },
    },
  })
  const child = createTheme({
    extends: parent,
    button: {
      defaults: { size: 'lg' },
      base: { '--shared': 'child' },
    },
  })
  const [theme, setTheme] = createSignal(child)
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
        rootSlot: 'label',
        inheritedVariants: () => ({ size: inherited() }),
      },
    )
    return (
      <button {...styles.root}>
        <span {...styles.slot('root')}>Save</span>
      </button>
    )
  }
  const screen = render(() => (
    <MoraineThemeContext.Provider value={theme}>
      <Fixture />
    </MoraineThemeContext.Provider>
  ))
  const button = screen.getByRole('button')
  expect(button.style.getPropertyValue('--size')).toBe('16px')
  expect(button.style.getPropertyValue('--shared')).toBe('child')
  expect(button.firstElementChild?.getAttribute('style')).toBeNull()
  setInherited('sm')
  expect(button.style.getPropertyValue('--size')).toBe('8px')
  expect(button.style.getPropertyValue('--large')).toBe('')
  setSize('lg')
  expect(button.style.getPropertyValue('--size')).toBe('16px')
  setSize(null)
  expect(button.style.getPropertyValue('--size')).toBe('')
  setSize(undefined)
  expect(button.style.getPropertyValue('--size')).toBe('8px')
  setTheme(emptyTheme)
  expect(button.style.cssText).toBe('')
  expect(screen.getByRole('button')).toBe(button)
})

test('layers theme variables before dynamic, group, slot, and root styles', () => {
  const theme = createTheme({
    button: {
      base: {
        '--theme': 'theme',
        '--dynamic': 'theme',
        '--group': 'theme',
        '--slot': 'theme',
        '--root': 'theme',
      },
    },
  })
  function Fixture() {
    const styles = createComponentStyles(
      'button',
      {
        styles: { root: { '--slot': 'slot', '--root': 'slot' } },
        style: { '--root': 'root' },
      },
      {
        dynamicStyles: () => ({
          root: {
            '--dynamic': 'dynamic',
            '--group': 'dynamic',
            '--slot': 'dynamic',
            '--root': 'dynamic',
          },
        }),
        groupStyles: () => ({
          styles: { root: { '--group': 'group', '--slot': 'group', '--root': 'group' } },
        }),
      },
    )
    return <button {...styles.root}>Save</button>
  }
  const screen = render(() => (
    <MoraineThemeContext.Provider value={() => theme}>
      <Fixture />
    </MoraineThemeContext.Provider>
  ))
  for (const name of ['theme', 'dynamic', 'group', 'slot', 'root']) {
    expect(screen.getByRole('button').style.getPropertyValue(`--${name}`)).toBe(name)
  }
})
