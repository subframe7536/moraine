import { render } from '@solidjs/testing-library'
import { describe, expect, test } from 'vitest'

import { Icon } from './icon'

describe('Icon', () => {
  test('renders a css icon class for string names', () => {
    const screen = render(() => <Icon name="i-lucide-search" />)
    const icon = screen.container.querySelector('[data-slot="icon"]')

    expect(icon).not.toBeNull()
    expect(icon?.className).toContain('i-lucide-search')
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

  test('applies classes.root override', () => {
    const screen = render(() => <Icon name="i-lucide-search" class="root-override" />)
    const icon = screen.container.querySelector('[data-slot="icon"]')

    expect(icon?.className).toContain('root-override')
  })
})
