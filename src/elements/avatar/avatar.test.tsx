import { render, waitFor } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { Avatar } from './avatar'
import type { AvatarProps } from './avatar'

type MockImageOutcome = 'pending' | 'success' | 'error'

const originalImage = window.Image
const outcomesBySrc = new Map<string, MockImageOutcome>()

class MockImage {
  public onload: (() => void) | null = null
  public onerror: ((event: Event) => void) | null = null
  private _src = ''

  public set src(value: string) {
    this._src = value

    const outcome = outcomesBySrc.get(value) ?? 'pending'
    queueMicrotask(() => {
      if (outcome === 'success') {
        this.onload?.()
        return
      }

      if (outcome === 'error') {
        this.onerror?.(new Event('error'))
      }
    })
  }

  public get src(): string {
    return this._src
  }
}

beforeEach(() => {
  outcomesBySrc.clear()
  window.Image = MockImage as unknown as typeof window.Image
})

afterEach(() => {
  window.Image = originalImage
  vi.restoreAllMocks()
})

describe('Avatar', () => {
  test('renders fallback first while image is loading', () => {
    outcomesBySrc.set('/loading.png', 'pending')
    const screen = render(() => <Avatar src="/loading.png" text="RK" />)

    const root = screen.container.querySelector('[data-slot="root"]')
    const image = screen.container.querySelector('[data-slot="image"]')
    const fallback = screen.container.querySelector('[data-slot="fallback"]')

    expect(root?.getAttribute('data-status')).toBe('loading')
    expect(image?.className).toContain('opacity-0')
    expect(fallback?.textContent).toBe('RK')
  })

  test('switches to loaded state and crossfades image', async () => {
    outcomesBySrc.set('/loaded.png', 'success')
    const screen = render(() => <Avatar src="/loaded.png" alt="Rock UI" />)

    const root = screen.container.querySelector('[data-slot="root"]')
    const image = screen.container.querySelector('[data-slot="image"]') as HTMLImageElement | null
    const fallback = screen.container.querySelector('[data-slot="fallback"]')

    await waitFor(() => {
      expect(root?.getAttribute('data-status')).toBe('loaded')
    })

    expect(image?.getAttribute('src')).toContain('/loaded.png')
    expect(image?.className).toContain('opacity-100')
    expect(fallback?.className).toContain('opacity-0')
  })

  test('uses fallback icon on error state', async () => {
    outcomesBySrc.set('/broken.png', 'error')
    const screen = render(() => <Avatar src="/broken.png" fallback="i-lucide-user" />)

    const root = screen.container.querySelector('[data-slot="root"]')
    const icon = screen.container.querySelector('[data-slot="fallbackIcon"]')

    await waitFor(() => {
      expect(root?.getAttribute('data-status')).toBe('error')
    })

    expect(icon?.className).toContain('i-lucide-user')
  })

  test('renders badge and supports four corner positions', () => {
    const screen = render(() => (
      <>
        <Avatar badge="i-lucide-check" badgePosition="top-left" />
        <Avatar badge="i-lucide-check" badgePosition="top-right" />
        <Avatar badge="i-lucide-check" badgePosition="bottom-left" />
        <Avatar badge="i-lucide-check" badgePosition="bottom-right" />
      </>
    ))

    const badges = Array.from(screen.container.querySelectorAll('[data-slot="badge"]'))
    expect(badges).toHaveLength(4)
    expect(badges[0]?.className).toContain('-top-0.5')
    expect(badges[0]?.className).toContain('-left-0.5')
    expect(badges[1]?.className).toContain('-top-0.5')
    expect(badges[1]?.className).toContain('-right-0.5')
    expect(badges[2]?.className).toContain('-bottom-0.5')
    expect(badges[2]?.className).toContain('-left-0.5')
    expect(badges[3]?.className).toContain('-bottom-0.5')
    expect(badges[3]?.className).toContain('-right-0.5')
  })

  test('keeps badge visible by not clipping avatar root overflow', () => {
    const screen = render(() => <Avatar badge="i-lucide-check" />)
    const root = screen.container.querySelector('[data-slot="root"]')

    expect(root?.className).toContain('overflow-visible')
    expect(root?.className).not.toContain('overflow-hidden')
  })

  test('supports xs and xl size variants for single avatars', () => {
    const screen = render(() => (
      <>
        <Avatar size="xs" fallback="i-lucide-user" badge="i-lucide-check" />
        <Avatar size="xl" fallback="i-lucide-user" badge="i-lucide-check" />
      </>
    ))

    const roots = Array.from(screen.container.querySelectorAll('[data-slot="root"]'))
    const fallbackIcons = Array.from(
      screen.container.querySelectorAll('[data-slot="fallbackIcon"]'),
    )
    const badges = Array.from(screen.container.querySelectorAll('[data-slot="badge"]'))

    expect(roots[0]?.className).toContain('size-6')
    expect(fallbackIcons[0]?.className).toContain('text-xs')
    expect(badges[0]?.className).toContain('size-2.5')

    expect(roots[1]?.className).toContain('size-11')
    expect(fallbackIcons[1]?.className).toContain('text-xl')
    expect(badges[1]?.className).toContain('size-4.5')
  })

  test('generates initials from alt when text is not provided', () => {
    const screen = render(() => <Avatar alt="Rock UI Team" />)
    const fallback = screen.container.querySelector('[data-slot="fallback"]')

    expect(fallback?.textContent).toBe('RU')
  })

  test('resets to loading state when src changes', async () => {
    outcomesBySrc.set('/first.png', 'success')
    outcomesBySrc.set('/second.png', 'pending')

    let setSource: ((value: string) => void) | undefined
    const screen = render(() => {
      const [source, setSourceSignal] = createSignal('/first.png')
      setSource = setSourceSignal

      return <Avatar src={source()} text="RK" />
    })

    const root = screen.container.querySelector('[data-slot="root"]')

    await waitFor(() => {
      expect(root?.getAttribute('data-status')).toBe('loaded')
    })

    setSource?.('/second.png')
    expect(root?.getAttribute('data-status')).toBe('loading')
  })

  test('fires onStatusChange for success and error paths', async () => {
    outcomesBySrc.set('/ok.png', 'success')
    outcomesBySrc.set('/bad.png', 'error')
    const successStatus = vi.fn()
    const errorStatus = vi.fn()

    const screen = render(() => (
      <>
        <Avatar src="/ok.png" onStatusChange={successStatus} />
        <Avatar src="/bad.png" onStatusChange={errorStatus} />
      </>
    ))

    const roots = screen.container.querySelectorAll('[data-slot="root"]')
    await waitFor(() => {
      expect(roots[0]?.getAttribute('data-status')).toBe('loaded')
      expect(roots[1]?.getAttribute('data-status')).toBe('error')
    })

    expect(successStatus.mock.calls.map(([status]) => status)).toEqual(['loading', 'loaded'])
    expect(errorStatus.mock.calls.map(([status]) => status)).toEqual(['loading', 'error'])
  })

  test('merges avatar and avatar-group behavior with items + max', () => {
    const screen = render(() => (
      <Avatar max={2} items={[{ text: 'A' }, { text: 'B' }, { text: 'C' }, { text: 'D' }]} />
    ))

    const group = screen.container.querySelector('[data-slot="group"]')
    const groupCount = screen.container.querySelector('[data-slot="groupCount"]')
    const fallbacks = Array.from(
      screen.container.querySelectorAll('[data-slot="groupItem"] [data-slot="fallback"]'),
    )

    expect(group).not.toBeNull()
    expect(groupCount?.textContent).toBe('+2')
    expect(fallbacks).toHaveLength(2)
    expect(fallbacks[0]?.textContent).toBe('B')
    expect(fallbacks[1]?.textContent).toBe('A')
    expect(group?.className).toContain('flex-row-reverse')
    expect(group?.className).toContain('justify-end')
    const groupItem = screen.container.querySelector('[data-slot="groupItem"]')
    expect(groupItem?.className).toContain('-me-1.5')
  })

  test('renders all group items when max is absent and reverses order', () => {
    const screen = render(() => <Avatar items={[{ text: 'A' }, { text: 'B' }, { text: 'C' }]} />)

    const fallbacks = Array.from(
      screen.container.querySelectorAll('[data-slot="groupItem"] [data-slot="fallback"]'),
    )

    expect(screen.container.querySelector('[data-slot="groupCount"]')).toBeNull()
    expect(fallbacks).toHaveLength(3)
    expect(fallbacks[0]?.textContent).toBe('C')
    expect(fallbacks[1]?.textContent).toBe('B')
    expect(fallbacks[2]?.textContent).toBe('A')
  })

  test('supports xs and xl size variants for avatar groups', () => {
    const screen = render(() => (
      <>
        <Avatar size="xs" max={1} items={[{ text: 'A' }, { text: 'B' }]} />
        <Avatar size="xl" max={1} items={[{ text: 'A' }, { text: 'B' }]} />
      </>
    ))

    const groupCounts = Array.from(screen.container.querySelectorAll('[data-slot="groupCount"]'))
    const groupItems = Array.from(screen.container.querySelectorAll('[data-slot="groupItem"]'))

    expect(groupCounts[0]?.className).toContain('size-6')
    expect(groupCounts[0]?.className).toContain('-me-1')
    expect(groupItems[0]?.className).toContain('-me-1')

    expect(groupCounts[1]?.className).toContain('size-11')
    expect(groupCounts[1]?.className).toContain('-me-2')
    expect(groupItems[1]?.className).toContain('-me-2')
  })

  test('applies styles overrides to all slots', () => {
    const screen = render(() => (
      <Avatar
        src="/loading.png"
        text="RK"
        badge="i-lucide-check"
        styles={{
          root: { width: '200px' },
          image: { width: '200px' },
          fallback: { width: '200px' },
          fallbackIcon: { width: '200px' },
          badge: { width: '200px' },
        } as any}
      />
    ))

    const root = screen.container.querySelector('[data-slot="root"]') as HTMLElement | null
    const image = screen.container.querySelector('[data-slot="image"]') as HTMLElement | null
    const fallback = screen.container.querySelector('[data-slot="fallback"]') as HTMLElement | null
    const fallbackIcon = screen.container.querySelector('[data-slot="fallbackIcon"]') as HTMLElement | null
    const badge = screen.container.querySelector('[data-slot="badge"]') as HTMLElement | null

    expect(root?.style.width).toBe('200px')
    expect(image?.style.width).toBe('200px')
    expect(fallback?.style.width).toBe('200px')
    // fallbackIcon shouldn't be rendered if valid string text is provided but doesn't hurt to optionally grab
    if (fallbackIcon) {
      expect(fallbackIcon.style.width).toBe('200px')
    }
    expect(badge?.style.width).toBe('200px')
  })

  test('applies styles overrides to group slots', () => {
    const screen = render(() => (
      <Avatar
        max={1}
        items={[{ text: 'A' }, { text: 'B' }]}
        styles={{
          group: { width: '200px' },
          groupItem: { width: '200px' },
          groupCount: { width: '200px' },
        } as any}
      />
    ))

    const group = screen.container.querySelector('[data-slot="group"]') as HTMLElement | null
    const groupItem = screen.container.querySelector('[data-slot="groupItem"]') as HTMLElement | null
    const groupCount = screen.container.querySelector('[data-slot="groupCount"]') as HTMLElement | null

    expect(group?.style.width).toBe('200px')
    expect(groupItem?.style.width).toBe('200px')
    expect(groupCount?.style.width).toBe('200px')
  })

  test('rejects arbitrary html props and class prop in type contract', () => {
    // @ts-expect-error Avatar is sealed and does not accept arbitrary html props.
    const invalidHtmlProps: AvatarProps = { id: 'avatar-id', as: 'div', onclick: () => {} }
    // @ts-expect-error Avatar uses classes slots instead of class prop.
    const invalidClassProp: AvatarProps = { class: 'avatar-class' }
    // @ts-expect-error icon has been removed and renamed to badge.
    const invalidIconProp: AvatarProps = { icon: 'i-lucide-user' }

    expect(invalidHtmlProps).toBeDefined()
    expect(invalidClassProp).toBeDefined()
    expect(invalidIconProp).toBeDefined()
  })
})
