import { render } from '@solidjs/testing-library'
import { createSignal, onCleanup } from 'solid-js'
import { describe, expect, test } from 'vitest'

import { MoraineProvider } from '../../provider'
import { defineTheme } from '../../theme'

import { Icon } from './icon'
import type { IconProps } from './icon.types.ts'

describe('Icon', () => {
  test('uses the default recipe when provider is absent and applies theme overrides when provided', () => {
    const customDesign = defineTheme({
      icon: { base: { root: 'design-icon' } },
    })
    const defaultScreen = render(() => <Icon name="i-lucide-search" />)
    const defaultIcon = defaultScreen.container.querySelector('[data-slot="icon"]')
    expect(defaultIcon?.className).not.toContain('design-icon')

    const styledScreen = render(() => (
      <MoraineProvider theme={customDesign}>
        <Icon name="i-lucide-search" />
      </MoraineProvider>
    ))
    const styledIcon = styledScreen.container.querySelector('[data-slot="icon"]')
    expect(styledIcon?.className).toContain('design-icon')
  })

  test('renders a css icon class for string names', () => {
    const screen = render(() => <Icon name="i-lucide-search" />)
    const icon = screen.container.querySelector('[data-slot="icon"]')

    expect(icon).not.toBeNull()
    expect(icon?.className).toContain('i-lucide-search')
  })

  test('applies numeric size as font-size in px', () => {
    const screen = render(() => <Icon name="i-lucide-search" size={18} />)
    const icon = screen.container.querySelector<HTMLElement>('[data-slot="icon"]')

    expect(icon).not.toBeNull()
    expect(icon?.style.fontSize).toBe('18px')
  })

  test('inherits font size when size is omitted', () => {
    const screen = render(() => (
      <div style={{ 'font-size': '18px' }}>
        <Icon name="i-lucide-search" />
      </div>
    ))
    const icon = screen.container.querySelector<HTMLElement>('[data-slot="icon"]')

    expect(icon).not.toBeNull()
    expect(icon?.style.fontSize).toBe('')
    expect(getComputedStyle(icon!).fontSize).toBe('18px')
  })

  test('allows style to override an explicit size', () => {
    const screen = render(() => (
      <Icon name="i-lucide-search" size={18} style={{ 'font-size': '20px' }} />
    ))
    const icon = screen.container.querySelector<HTMLElement>('[data-slot="icon"]')

    expect(icon?.style.fontSize).toBe('20px')
  })

  test('renders element icons inside an attribute-owning wrapper', () => {
    const screen = render(() => <Icon name={<span data-testid="custom-icon">X</span>} />)

    expect(screen.getByTestId('custom-icon').textContent).toBe('X')
    expect(screen.getByTestId('custom-icon').parentElement?.dataset.slot).toBe('icon')
  })

  test('renders JSX names in the icon slot', () => {
    const screen = render(() => <Icon name={<span data-testid="cached-icon">C</span>} />)

    expect(screen.getByTestId('cached-icon').textContent).toBe('C')
  })

  test('supports component/render-function icons', () => {
    const screen = render(() => <Icon name={() => <span data-testid="fn-icon">R</span>} />)

    expect(screen.getByTestId('fn-icon').textContent).toBe('R')
  })

  test('preserves a zero-argument renderer and its cleanup while its JSX updates', () => {
    const [label, setLabel] = createSignal('Before')
    let mounts = 0
    let cleanups = 0
    const Glyph = () => {
      mounts += 1
      onCleanup(() => {
        cleanups += 1
      })
      return <span>{label()}</span>
    }
    const screen = render(() => <Icon name={Glyph} />)
    const glyph = screen.getByText('Before')
    setLabel('After')
    expect(screen.getByText('After')).toBe(glyph)
    expect([mounts, cleanups]).toEqual([1, 0])
    screen.unmount()
    expect(cleanups).toBe(1)
  })

  test('forwards reactive attributes to renderers with default parameters', () => {
    const [label, setLabel] = createSignal('Before')
    const Glyph = (props: Omit<IconProps, 'name'> = {}) => (
      <svg aria-hidden={props['aria-hidden']} aria-label={props['aria-label']} role={props.role} />
    )
    const screen = render(() => <Icon name={Glyph} aria-label={label()} />)
    const glyph = screen.getByRole('img', { name: 'Before' })
    expect(glyph.getAttribute('aria-label')).toBe('Before')
    setLabel('After')
    expect(glyph.getAttribute('aria-label')).toBe('After')
    expect(screen.getByRole('img', { name: 'After' })).toBe(glyph)
  })

  test('passes through HTML attributes to the span element', () => {
    const screen = render(() => (
      <Icon name="i-lucide-search" id="my-icon" data-testid="icon-el" title="Search icon" />
    ))
    const icon = screen.container.querySelector<HTMLElement>('[data-slot="icon"]')

    expect(icon).not.toBeNull()
    expect(icon?.id).toBe('my-icon')
    expect(icon?.getAttribute('data-testid')).toBe('icon-el')
    expect(icon?.title).toBe('Search icon')
  })

  test('hides decorative string and raw JSX icons from the accessibility tree', () => {
    const screen1 = render(() => <Icon name="i-lucide-search" />)
    const icon1 = screen1.container.querySelector('[data-slot="icon"]')
    expect(icon1?.getAttribute('aria-hidden')).toBe('true')

    const screen2 = render(() => (
      <Icon
        name={
          <svg aria-label="Raw search glyph">
            <title>Raw search glyph</title>
          </svg>
        }
      />
    ))
    const icon2 = screen2.container.querySelector('[data-slot="icon"]')
    expect(icon2?.getAttribute('aria-hidden')).toBe('true')
    expect(screen2.queryByRole('img', { name: 'Raw search glyph' })).toBeNull()
  })

  test('exposes labelled string and raw JSX icons as images', () => {
    const stringScreen = render(() => <Icon name="i-lucide-search" aria-label="Search" />)
    const stringIcon = stringScreen.getByRole('img', { name: 'Search' })
    expect(stringIcon.dataset.slot).toBe('icon')
    expect(stringIcon.hasAttribute('aria-hidden')).toBe(false)

    const rawScreen = render(() => (
      <Icon
        name={
          <svg data-testid="raw-svg">
            <title>Unrelated SVG title</title>
            <path d="M0 0h1" />
          </svg>
        }
        aria-label="Search"
      />
    ))
    const rawIcon = rawScreen.getByRole('img', { name: 'Search' })
    expect(rawIcon.dataset.slot).toBe('icon')
    expect(rawScreen.getByTestId('raw-svg').parentElement).toBe(rawIcon)

    const labelledByScreen = render(() => (
      <>
        <span id="icon-label">Labelled search</span>
        <Icon name="i-lucide-search" aria-labelledby="icon-label" />
      </>
    ))
    expect(labelledByScreen.getByRole('img', { name: 'Labelled search' }).dataset.slot).toBe('icon')
  })

  test('keeps aria-hidden in sync with a reactive aria-label', () => {
    const [label, setLabel] = createSignal<string | undefined>()
    const screen = render(() => <Icon name="i-lucide-search" aria-label={label()} />)
    const icon = screen.container.querySelector('[data-slot="icon"]')!

    expect(icon.getAttribute('aria-hidden')).toBe('true')

    setLabel('Search')
    expect(icon.hasAttribute('aria-hidden')).toBe(false)

    setLabel(undefined)
    expect(icon.getAttribute('aria-hidden')).toBe('true')
  })

  test('allows an explicit aria-hidden override', () => {
    const screen = render(() => <Icon name="i-lucide-search" aria-hidden={false} />)
    const icon = screen.container.querySelector('[data-slot="icon"]')

    expect(icon?.getAttribute('aria-hidden')).toBe('false')
  })

  test('preserves caller-supplied roles and raw SVG labels when explicitly exposed', () => {
    const roleScreen = render(() => (
      <Icon name="i-lucide-search" aria-label="Search" role="status" />
    ))
    expect(roleScreen.getByRole('status').getAttribute('aria-label')).toBe('Search')

    const svgScreen = render(() => (
      <Icon
        name={
          <svg aria-label="Custom SVG label" role="img">
            <path d="M0 0h1" />
          </svg>
        }
        aria-hidden={false}
      />
    ))
    expect(svgScreen.getByRole('img', { name: 'Custom SVG label' })).not.toBeNull()
    expect(
      svgScreen.container.querySelector('[data-slot="icon"]')?.getAttribute('aria-hidden'),
    ).toBe('false')
  })

  test('applies direct root class overrides', () => {
    const screen = render(() => <Icon name="i-lucide-search" class="root-override" />)
    const icon = screen.container.querySelector('[data-slot="icon"]')

    expect(icon?.className).toContain('root-override')
  })

  test('applies slot overrides without leaking style props to the DOM', () => {
    const screen = render(() => (
      <Icon
        name="i-lucide-search"
        classes={{ root: 'slot-class' }}
        styles={{ root: { height: '18px', color: 'blue' } }}
        class="native-class"
        style={{ width: '20px', color: 'red' }}
      />
    ))
    const icon = screen.container.querySelector<HTMLElement>('[data-slot="icon"]')!

    expect(icon.className).toContain('slot-class')
    expect(icon.className).toContain('native-class')
    expect(icon.style.height).toBe('18px')
    expect(icon.style.width).toBe('20px')
    expect(icon.style.color).toBe('red')
    expect(icon.hasAttribute('classes')).toBe(false)
    expect(icon.hasAttribute('styles')).toBe(false)
  })

  test('replaces Design root styling without remounting the icon', () => {
    const [design, setDesign] = createSignal(defineTheme({ icon: { base: { root: 'p-2' } } }))
    const screen = render(() => (
      <MoraineProvider theme={design()}>
        <Icon name="i-lucide-search" />
      </MoraineProvider>
    ))
    const icon = screen.container.querySelector<HTMLElement>('[data-slot="icon"]')!

    expect(icon.className).toContain('p-2')

    setDesign(defineTheme({ icon: { base: { root: 'p-4' } } }))

    expect(screen.container.querySelector('[data-slot="icon"]')).toBe(icon)
    expect(icon.className).toContain('p-4')
    expect(icon.className).not.toContain('p-2')
  })
})
