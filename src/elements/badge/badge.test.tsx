import { render } from '@solidjs/testing-library'
import { createComponent } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { MoraineProvider } from '../../shared/provider'
import { defaultTheme } from '../../theme/default-theme'

import { Badge } from './badge'

describe('Badge', () => {
  test('renders unstyled when provider is absent', () => {
    const screen = render(() => (
      <Badge variant="solid" size="lg">
        Solid
      </Badge>
    ))
    const badge = screen.container.querySelector('[data-slot="root"]')
    expect(badge?.className).toBe('')
  })

  test('renders default badge semantics and label', () => {
    const screen = render(() => (
      <MoraineProvider theme={defaultTheme}>
        <Badge>New</Badge>
      </MoraineProvider>
    ))
    const badge = screen.container.querySelector('[data-slot="root"]')
    const label = screen.container.querySelector('[data-slot="label"]')

    expect(badge?.tagName).toBe('SPAN')
    expect(badge?.hasAttribute('data-variant')).toBe(false)
    expect(badge?.hasAttribute('data-size')).toBe(false)
    expect(label?.textContent).toBe('New')
  })

  test('supports hiding decorative badges from the accessibility tree', () => {
    const screen = render(() => <Badge aria-hidden>2</Badge>)
    const badge = screen.container.querySelector('[data-slot="root"]')

    expect(badge?.getAttribute('aria-hidden')).toBe('true')
  })

  test('forwards root attributes and lets callers override generated metadata', () => {
    const screen = render(() => (
      <Badge data-slot="tag" data-variant="custom" aria-label="status">
        Ready
      </Badge>
    ))
    const badge = screen.container.querySelector('[data-slot="tag"]')

    expect(badge?.getAttribute('data-variant')).toBe('custom')
    expect(badge?.getAttribute('aria-label')).toBe('status')
  })

  test('applies the refreshed variants and defaults to subtle', () => {
    const screen = render(() => (
      <MoraineProvider theme={defaultTheme}>
        <div>
          <Badge>Default</Badge>
          <Badge variant="solid">Solid</Badge>
          <Badge variant="subtle">Subtle</Badge>
          <Badge variant="surface">Surface</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      </MoraineProvider>
    ))
    const roots = screen.container.querySelectorAll('[data-slot="root"]')

    expect(roots[0]?.className).toContain('border-transparent')
    expect(roots[0]?.className).toContain('bg-accent')
    expect(roots[1]?.className).toContain('bg-primary')
    expect(roots[2]?.className).toContain('border-transparent')
    expect(roots[3]?.className).toContain('border-border')
    expect(roots[3]?.className).toContain('bg-accent')
    expect(roots[4]?.className).toContain('bg-background')
  })

  test('applies distinct size metrics and size-specific icon dimensions', () => {
    const screen = render(() => (
      <MoraineProvider theme={defaultTheme}>
        <div>
          <Badge size="sm" leading="i-lucide-check">
            Small
          </Badge>
          <Badge size="md" trailing="i-lucide-x">
            Medium
          </Badge>
          <Badge size="lg" leading="i-lucide-check">
            Large
          </Badge>
        </div>
      </MoraineProvider>
    ))
    const roots = screen.container.querySelectorAll('[data-slot="root"]')
    const leading = screen.container.querySelectorAll('[data-slot="leading"]')
    const trailing = screen.container.querySelector('[data-slot="trailing"]')

    expect(roots[0]?.className).toContain('h-4')
    expect(roots[1]?.className).toContain('h-5')
    expect(roots[2]?.className).toContain('h-6')
    expect(leading[0]?.className).toContain('size-3')
    expect(trailing?.className).toContain('size-3.5')
    expect(leading[1]?.className).toContain('size-4')
  })

  test('uses square geometry only for one-icon badges without a label', () => {
    const screen = render(() => (
      <MoraineProvider theme={defaultTheme}>
        <div>
          <Badge size="sm" leading="i-lucide-check" aria-label="Leading only" />
          <Badge trailing="i-lucide-x" aria-label="Trailing only" />
          <Badge leading="i-lucide-check">Label</Badge>
          <Badge leading="i-lucide-check" trailing="i-lucide-x" aria-label="Two icons" />
        </div>
      </MoraineProvider>
    ))
    const roots = screen.container.querySelectorAll('[data-slot="root"]')

    expect(roots[0]?.className).toContain('w-4')
    expect(roots[0]?.className).toContain('px-0')
    expect(roots[1]?.className).toContain('w-5')
    expect(roots[1]?.className).toContain('px-0')
    expect(roots[2]?.className).not.toContain('px-0')
    expect(roots[3]?.className).not.toContain('px-0')
  })

  test('renders leading and trailing icon slots', () => {
    const screen = render(() => (
      <Badge leading="i-lucide-sparkles" trailing="i-lucide-arrow-right">
        Label
      </Badge>
    ))

    const leading = screen.container.querySelector('[data-slot="leading"]')
    const trailing = screen.container.querySelector('[data-slot="trailing"]')

    expect(leading?.className).toContain('i-lucide-sparkles')
    expect(trailing?.className).toContain('i-lucide-arrow-right')
  })

  test('forwards pointer handlers including tuple handlers and composes ancestors', () => {
    const onPointerDown = vi.fn()
    const onAncestorPointerDown = vi.fn()
    const screen = render(() => (
      <div onPointerDown={onAncestorPointerDown}>
        <Badge onPointerDown={[onPointerDown, 'payload']}>Native</Badge>
      </div>
    ))
    const badge = screen.container.querySelector('[data-slot="root"]')!
    const event = new PointerEvent('pointerdown', { bubbles: true, cancelable: true })

    badge.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(false)
    expect(onPointerDown).toHaveBeenCalledTimes(1)
    expect(onPointerDown).toHaveBeenCalledWith('payload', expect.any(PointerEvent))
    expect(onAncestorPointerDown).toHaveBeenCalledTimes(1)
  })

  test('renders zero as label content', () => {
    const screen = render(() => <Badge>{0}</Badge>)

    expect(screen.container.querySelector('[data-slot="label"]')?.textContent).toBe('0')
  })

  test('evaluates getter-backed conditional JSX inputs once', () => {
    const reads = {
      children: 0,
      leading: 0,
      trailing: 0,
    }
    const screen = render(() =>
      createComponent(Badge, {
        get children() {
          reads.children += 1
          return 'Cached'
        },
        get leading() {
          reads.leading += 1
          return 'i-lucide-check'
        },
        get trailing() {
          reads.trailing += 1
          return 'i-lucide-x'
        },
      }),
    )

    expect(screen.container.textContent).toContain('Cached')
    expect(reads).toEqual({
      children: 1,
      leading: 1,
      trailing: 1,
    })
  })

  test('supports slot and attribute overrides used by select tags', () => {
    const screen = render(() => (
      <Badge
        data-slot="tag"
        trailing="i-lucide-x"
        classes={{
          root: 'root-override',
          label: 'label-override',
          trailing: 'trailing-override',
        }}
      >
        Tag
      </Badge>
    ))

    const tag = screen.container.querySelector('[data-slot="tag"]')
    const label = screen.container.querySelector('[data-slot="label"]')
    const remove = screen.container.querySelector('[data-slot="trailing"]')

    expect(tag?.className).toContain('root-override')
    expect(label?.className).toContain('label-override')
    expect(remove?.className).toContain('trailing-override')
  })

  test('supports style overrides', () => {
    const screen = render(() => (
      <Badge
        data-slot="tag"
        trailing="i-lucide-x"
        styles={{
          root: { width: '200px' },
          label: { width: '200px' },
          trailing: { width: '200px' },
        }}
      >
        Tag
      </Badge>
    ))

    const tag = screen.container.querySelector<HTMLElement>('[data-slot="tag"]')
    const label = screen.container.querySelector<HTMLElement>('[data-slot="label"]')
    const remove = screen.container.querySelector<HTMLElement>('[data-slot="trailing"]')

    expect(tag?.style.width).toBe('200px')
    expect(label?.style.width).toBe('200px')
    expect(remove?.style.width).toBe('200px')
  })
})
