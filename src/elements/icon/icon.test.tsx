import { render } from '@solidjs/testing-library'
import { createComponent, createSignal } from 'solid-js'
import { describe, expect, test } from 'vitest'

import { Icon } from './icon'

describe('Icon', () => {
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
    const icon = screen.container.querySelector('[data-slot="icon"]') as HTMLSpanElement | null

    expect(icon).not.toBeNull()
    expect(icon?.style.fontSize).toBe('18px')
  })

  test('renders element icons without coupling to svg selectors', () => {
    const screen = render(() => <Icon name={<span data-testid="custom-icon">X</span>} />)

    expect(screen.getByTestId('custom-icon').textContent).toBe('X')
  })

  test('evaluates a getter-backed JSX name once', () => {
    let reads = 0
    const screen = render(() =>
      createComponent(Icon, {
        get name() {
          reads += 1
          return <span data-testid="cached-icon">C</span>
        },
      }),
    )

    expect(reads).toBe(1)
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
    const icon = screen.container.querySelector('[data-slot="icon"]') as HTMLSpanElement | null

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

  test('applies classes.root override', () => {
    const screen = render(() => <Icon name="i-lucide-search" class="root-override" />)
    const icon = screen.container.querySelector('[data-slot="icon"]')

    expect(icon?.className).toContain('root-override')
  })
})
