import { render } from '@solidjs/testing-library'
import { describe, expect, test } from 'vitest'

import { Chip } from './chip'

describe('Chip', () => {
  test('renders base slot by default', () => {
    const screen = render(() => <Chip />)

    expect(screen.container.querySelector('[data-slot="base"]')).not.toBeNull()
  })

  test('renders text content', () => {
    const screen = render(() => <Chip text="7" />)

    const base = screen.container.querySelector('[data-slot="base"]')
    expect(base?.textContent).toBe('7')
  })

  test('renders content prop before text', () => {
    const screen = render(() => <Chip text="7" content={<span data-testid="content">C</span>} />)

    expect(screen.getByTestId('content').textContent).toBe('C')
    expect(screen.container.querySelector('[data-slot="base"]')?.textContent).toBe('C')
  })

  test('does not render base when show is false', () => {
    const screen = render(() => <Chip show={false} text="7" />)

    expect(screen.container.querySelector('[data-slot="base"]')).toBeNull()
  })

  test('applies standalone absolute behavior classes', () => {
    const nonStandalone = render(() => <Chip />)
    const standalone = render(() => <Chip standalone />)

    expect(nonStandalone.container.querySelector('[data-slot="base"]')?.className).toContain(
      'absolute',
    )
    expect(standalone.container.querySelector('[data-slot="base"]')?.className).not.toContain(
      'absolute',
    )
  })

  test('applies position classes', () => {
    const screen = render(() => (
      <>
        <Chip position="top-left" />
        <Chip position="bottom-right" />
      </>
    ))

    const bases = screen.container.querySelectorAll('[data-slot="base"]')
    expect(bases[0]?.className).toContain('top-0 left-0')
    expect(bases[1]?.className).toContain('bottom-0 right-0')
  })

  test('applies compound translate class when inset is false', () => {
    const screen = render(() => <Chip position="top-right" inset={false} />)
    const base = screen.container.querySelector('[data-slot="base"]')

    expect(base?.className).toContain('-translate-y-1/2')
    expect(base?.className).toContain('translate-x-1/2')
  })

  test('applies neutral color variant class', () => {
    const screen = render(() => <Chip color="neutral" />)
    const base = screen.container.querySelector('[data-slot="base"]')

    expect(base?.className).toContain('bg-foreground')
  })

  test('applies size variant classes', () => {
    const screen = render(() => <Chip size="xl" />)
    const base = screen.container.querySelector('[data-slot="base"]')

    expect(base?.className).toContain('h-[10px]')
  })

  test('renders children on root', () => {
    const screen = render(() => (
      <Chip>
        <span data-testid="child">X</span>
      </Chip>
    ))

    expect(screen.getByTestId('child').textContent).toBe('X')
  })
})
