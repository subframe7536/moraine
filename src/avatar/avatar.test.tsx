import { fireEvent, render } from '@solidjs/testing-library'
import { describe, expect, test } from 'vitest'

import { Avatar } from './avatar'

describe('Avatar', () => {
  test('renders default root classes', () => {
    const screen = render(() => <Avatar alt="John Doe" />)
    const root = screen.container.querySelector('[data-slot="root"]')

    expect(root).not.toBeNull()
    expect(root?.className).toContain('size-8')
  })

  test('renders image when src is provided', () => {
    const screen = render(() => <Avatar src="https://example.com/a.png" alt="John Doe" />)
    const image = screen.container.querySelector('[data-slot="image"]') as HTMLImageElement | null

    expect(image).not.toBeNull()
    expect(image?.getAttribute('src')).toContain('https://example.com/a.png')
    expect(image?.getAttribute('alt')).toBe('John Doe')
  })

  test('renders fallback text prop', () => {
    const screen = render(() => <Avatar text="+1" />)

    expect(screen.container.querySelector('[data-slot="fallback"]')?.textContent).toBe('+1')
  })

  test('renders initials from alt when no text or icon', () => {
    const screen = render(() => <Avatar alt="John Doe" />)

    expect(screen.container.querySelector('[data-slot="fallback"]')?.textContent).toBe('JD')
  })

  test('renders icon fallback', () => {
    const screen = render(() => <Avatar icon="i-lucide-user" />)
    const icon = screen.container.querySelector('[data-slot="icon"]')

    expect(icon?.className).toContain('i-lucide-user')
  })

  test('falls back when image emits error', async () => {
    const screen = render(() => <Avatar src="https://example.com/a.png" alt="John Doe" />)
    const image = screen.container.querySelector('[data-slot="image"]') as HTMLImageElement | null

    expect(image).not.toBeNull()
    await fireEvent.error(image!)

    expect(screen.container.querySelector('[data-slot="image"]')).toBeNull()
    expect(screen.container.querySelector('[data-slot="fallback"]')?.textContent).toBe('JD')
  })

  test('renders children before icon and fallback', () => {
    const screen = render(() => (
      <Avatar icon="i-lucide-user" alt="John Doe">
        <span data-testid="custom-child">Custom</span>
      </Avatar>
    ))

    expect(screen.getByTestId('custom-child').textContent).toBe('Custom')
  })

  test('supports string as prop on root', () => {
    const screen = render(() => <Avatar as="section" alt="John Doe" />)
    const root = screen.container.querySelector('[data-slot="root"]')

    expect(root?.tagName).toBe('SECTION')
  })

  test('supports object as prop for root and image', () => {
    const screen = render(() => (
      <Avatar as={{ root: 'section', img: 'p' }} src="https://example.com/a.png" alt="John Doe" />
    ))

    const root = screen.container.querySelector('[data-slot="root"]')
    const image = screen.container.querySelector('[data-slot="image"]')

    expect(root?.tagName).toBe('SECTION')
    expect(image?.tagName).toBe('P')
  })

  test('wraps with chip when chip is true', () => {
    const screen = render(() => <Avatar chip alt="John Doe" />)
    const root = screen.container.querySelector('[data-slot="root"]')
    const base = screen.container.querySelector('[data-slot="base"]')

    expect(root?.className).toContain('relative inline-flex')
    expect(base).not.toBeNull()
  })

  test('passes chip object props', () => {
    const screen = render(() => <Avatar chip={{ text: '1', size: 'xs' }} alt="John Doe" />)
    const base = screen.container.querySelector('[data-slot="base"]')

    expect(base?.className).toContain('h-[6px]')
    expect(base?.textContent).toBe('1')
  })

  test('inherits avatar size into chip by default', () => {
    const screen = render(() => <Avatar size="xl" chip alt="John Doe" />)
    const base = screen.container.querySelector('[data-slot="base"]')

    expect(base?.className).toContain('h-[10px]')
  })

  test('applies classes slot overrides', () => {
    const screen = render(() => (
      <Avatar
        src="https://example.com/a.png"
        alt="John Doe"
        classes={{
          root: 'root-override',
          image: 'image-override',
        }}
      />
    ))

    const root = screen.container.querySelector('[data-slot="root"]')
    const image = screen.container.querySelector('[data-slot="image"]')

    expect(root?.className).toContain('root-override')
    expect(image?.className).toContain('image-override')
  })
})
