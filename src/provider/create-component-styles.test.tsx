import { render } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { describe, expect, test } from 'vitest'

import { buttonRecipe } from '../element/button/button.recipe'
import type { ButtonT } from '../element/button/button.types'
import { tooltipRecipe } from '../overlay/tooltip/tooltip.recipe'
import { defineTheme } from '../theme/create-theme'
import type { MoraineTheme } from '../theme/types'

import { createStyles } from './create-styles'
import { MoraineProvider } from './moraine-provider'

describe('createStyles', () => {
  test('keeps undefined-only precedence reactive and preserves node identity', () => {
    const base = defineTheme({
      button: {
        base: { root: 'p-2' },
        variants: {
          size: { sm: { root: 'text-sm' }, lg: { root: 'text-lg' } },
        },
        defaultVariants: { size: 'sm' },
      },
    })
    const [theme, setTheme] = createSignal(base)
    const [size, setSize] = createSignal<ButtonT.Variant['size']>()
    const [inherited, setInherited] = createSignal<ButtonT.Variant['size']>()
    function Fixture() {
      const styles = createStyles(
        buttonRecipe,
        {
          get size() {
            return size()
          },
        },
        {
          inheritedVariants: () => ({ size: inherited() }),
        },
      )
      return <button {...styles.styles.root}>Save</button>
    }
    const screen = render(() => (
      <MoraineProvider theme={theme()}>
        <Fixture />
      </MoraineProvider>
    ))
    const button = screen.getByRole('button')
    expect(button.className).toContain('p-2')
    expect(button.className).toContain('text-sm')
    setTheme(
      defineTheme({
        extends: base,
        button: { base: { root: 'p-4' }, defaultVariants: { size: 'lg' } },
      }),
    )
    expect(button.className).toContain('text-lg')
    expect(button.className).toContain('p-4')
    setInherited('sm')
    expect(button.className).toContain('text-sm')
    expect(button.className).toContain('p-4')
    setSize('lg')
    expect(button.className).toContain('text-lg')
    expect(button.className).toContain('p-4')
    setSize(undefined)
    expect(button.className).toContain('text-sm')
    expect(button.className).toContain('p-4')
    expect(screen.getByRole('button')).toBe(button)
  })

  test('merges inherited, instance, and root bindings', () => {
    const [classes, setClasses] = createSignal<ButtonT.Classes>({ root: 'p-3', label: 'text-lg' })
    const [slotStyles, setSlotStyles] = createSignal<ButtonT.Styles>({ root: { color: 'blue' } })
    function Fixture() {
      const styles = createStyles(
        buttonRecipe,
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
          inheritedStyles: () => ({
            classes: { root: 'p-2' },
            styles: { root: { color: 'green', width: '20px' } },
          }),
        },
      )
      return (
        <button {...styles.styles.root}>
          <span {...styles.styles.label}>Save</span>
        </button>
      )
    }
    const screen = render(() => <Fixture />)
    const button = screen.getByRole('button')
    expect(button.className).toContain('p-4')
    expect(button.style.color).toBe('red')
    expect(button.style.width).toBe('20px')
    const label = screen.getByText('Save')
    expect(label.className).toContain('text-lg')
    expect(label.style.color).toBe('')
    setClasses({ root: 'p-5', label: 'text-sm' })
    setSlotStyles({ root: { width: '30px' }, label: { color: 'purple' } })
    expect(button.className).toContain('p-4')
    expect(button.style.color).toBe('red')
    expect(button.style.width).toBe('30px')
    expect(label.className).toContain('text-sm')
    expect(label.style.color).toBe('purple')
    expect(screen.getByText('Save')).toBe(label)
  })

  test('preserves false over inherited and theme defaults', () => {
    const theme = defineTheme({
      tooltip: {
        defaultVariants: { invert: true },
        variants: {
          invert: {
            true: { content: 'inverted' },
            false: { content: 'plain' },
          },
        },
      },
    })
    const [invert, setInvert] = createSignal<boolean | undefined>(false)
    function Fixture() {
      const styles = createStyles(
        tooltipRecipe,
        {
          get invert() {
            return invert()
          },
        },
        { rootSlot: 'content', inheritedVariants: () => ({ invert: true }) },
      )
      return <div data-testid="select" {...styles.styles.content} />
    }
    const screen = render(() => (
      <MoraineProvider theme={theme}>
        <Fixture />
      </MoraineProvider>
    ))
    const root = screen.getByTestId('select')
    expect(root.className).toContain('plain')
    setInvert(undefined)
    expect(root.className).toContain('inverted')
  })
})

test('inherits theme variables and removes stale values without replacing nodes', () => {
  const parent = defineTheme({
    button: {
      defaultVariants: { size: 'sm' },
      base: { '--shared': 'parent' },
      variants: {
        size: {
          sm: { '--size': '8px' },
          lg: { '--size': '16px', '--large': 'yes' },
        },
      },
    },
  })
  const child = defineTheme({
    extends: parent,
    button: {
      defaultVariants: { size: 'lg' },
      base: { '--shared': 'child' },
    },
  })
  const [theme, setTheme] = createSignal<MoraineTheme | null>(child)
  const [size, setSize] = createSignal<ButtonT.Variant['size']>()
  const [inherited, setInherited] = createSignal<ButtonT.Variant['size']>()
  function Fixture() {
    const styles = createStyles(
      buttonRecipe,
      {
        get size() {
          return size()
        },
      },
      {
        inheritedVariants: () => ({ size: inherited() }),
      },
    )
    return (
      <button {...styles.styles.root}>
        <span {...styles.styles.label}>Save</span>
      </button>
    )
  }
  const screen = render(() => (
    <MoraineProvider theme={theme()}>
      <Fixture />
    </MoraineProvider>
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
  setSize(undefined)
  expect(button.style.getPropertyValue('--size')).toBe('8px')
  setTheme(null)
  expect(button.style.cssText).toBe('')
  expect(screen.getByRole('button')).toBe(button)
})

test('layers theme variables before dynamic, group, slot, and root styles', () => {
  const theme = defineTheme({
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
    const styles = createStyles(
      buttonRecipe,
      {
        styles: { root: { '--slot': 'slot', '--root': 'slot' } },
        style: { '--root': 'root' },
      },
      {
        inheritedStyles: () => ({
          styles: { root: { '--group': 'group', '--slot': 'group', '--root': 'group' } },
        }),
      },
    )
    return <button {...styles.styles.root}>Save</button>
  }
  const screen = render(() => (
    <MoraineProvider theme={theme}>
      <Fixture />
    </MoraineProvider>
  ))
  for (const name of ['theme', 'group', 'slot', 'root']) {
    expect(screen.getByRole('button').style.getPropertyValue(`--${name}`)).toBe(name)
  }
})
