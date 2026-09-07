import { render } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { describe, expect, test } from 'vitest'

import { createDesign } from '../../design.ts'
import { MoraineProvider } from '../../shared/provider/index.ts'

import { Icon } from './icon'

describe('Icon', () => {
  test('renders unstyled when provider is absent', () => {
    const customDesign = createDesign({
      icon: { base: { root: 'design-icon' } },
    })
    const unstyledScreen = render(() => <Icon name="i-lucide-search" />)
    const unstyledIcon = unstyledScreen.container.querySelector('[data-slot="icon"]')
    expect(unstyledIcon?.className).not.toContain('design-icon')

    const styledScreen = render(() => (
      <MoraineProvider design={customDesign}>
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

  test('keeps the structural root when an arbitrary component prop is passed', () => {
    const screen = render(() => <Icon name="i-lucide-search" component="span" />)
    const icon = screen.container.querySelector('[data-slot="icon"]')

    expect(icon?.tagName).toBe('DIV')
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

  test('renders element icons without coupling to svg selectors', () => {
    const screen = render(() => <Icon name={<span data-testid="custom-icon">X</span>} />)

    expect(screen.getByTestId('custom-icon').textContent).toBe('X')
  })

  test('renders JSX names in the icon slot', () => {
    const screen = render(() => <Icon name={<span data-testid="cached-icon">C</span>} />)

    expect(screen.getByTestId('cached-icon').textContent).toBe('C')
  })

  test('supports component/render-function icons', () => {
    const screen = render(() => <Icon name={() => <span data-testid="fn-icon">R</span>} />)

    expect(screen.getByTestId('fn-icon').textContent).toBe('R')
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

  test('sets aria-hidden by default and respects aria-label', () => {
    const screen1 = render(() => <Icon name="i-lucide-search" />)
    const icon1 = screen1.container.querySelector('[data-slot="icon"]')
    expect(icon1?.getAttribute('aria-hidden')).toBe('true')

    const screen2 = render(() => <Icon name="i-lucide-search" aria-label="Search" />)
    const icon2 = screen2.container.querySelector('[data-slot="icon"]')
    expect(icon2?.hasAttribute('aria-hidden')).toBe(false)
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

  test('applies direct root class overrides', () => {
    const screen = render(() => <Icon name="i-lucide-search" class="root-override" />)
    const icon = screen.container.querySelector('[data-slot="icon"]')

    expect(icon?.className).toContain('root-override')
  })

  test('keeps direct root styling while ignoring legacy slot maps', () => {
    const screen = render(() => (
      <Icon
        name="i-lucide-search"
        class="custom-root"
        style={{ color: 'rgb(0, 0, 255)' }}
        classes={{ root: 'ignored-root' }}
        styles={{ root: { color: 'rgb(255, 0, 0)' } }}
      />
    ))
    const icon = screen.container.querySelector<HTMLElement>('[data-slot="icon"]')

    expect(icon?.className).toContain('custom-root')
    expect(icon?.className).not.toContain('ignored-root')
    expect(icon?.style.color).toBe('rgb(0, 0, 255)')
    expect(icon?.hasAttribute('classes')).toBe(false)
    expect(icon?.hasAttribute('styles')).toBe(false)
  })

  test('replaces Design root styling without remounting the icon', () => {
    const [design, setDesign] = createSignal(
      createDesign({ preset: false, icon: { base: { root: 'p-2' } } }),
    )
    const screen = render(() => (
      <MoraineProvider design={design()}>
        <Icon name="i-lucide-search" />
      </MoraineProvider>
    ))
    const icon = screen.container.querySelector<HTMLElement>('[data-slot="icon"]')!

    expect(icon.className).toContain('p-2')

    setDesign(createDesign({ preset: false, icon: { base: { root: 'p-4' } } }))

    expect(screen.container.querySelector('[data-slot="icon"]')).toBe(icon)
    expect(icon.className).toContain('p-4')
    expect(icon.className).not.toContain('p-2')
  })
})
