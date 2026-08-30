import { render, waitFor } from '@solidjs/testing-library'
import { createComponent, createSignal } from 'solid-js'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { AvatarGroup } from './avatar-group.tsx'
import type { AvatarGroupT } from './avatar-group.tsx'
import { Avatar } from './avatar.tsx'
import type { AvatarT, AvatarProps } from './avatar.tsx'

type MockImageOutcome = 'pending' | 'success' | 'error' | 'cached-success' | 'cached-error'

const originalImage = window.Image
const outcomesBySrc = new Map<string, MockImageOutcome>()
const mockImages: MockImage[] = []

class MockImage {
  public complete = false
  public naturalWidth = 0
  public onload: (() => void) | null = null
  public onerror: ((event: Event) => void) | null = null
  private _src = ''

  public constructor() {
    mockImages.push(this)
  }

  public set src(value: string) {
    this._src = value

    const outcome = outcomesBySrc.get(value) ?? 'pending'
    if (outcome === 'cached-success' || outcome === 'cached-error') {
      this.complete = true
      this.naturalWidth = outcome === 'cached-success' ? 100 : 0
      return
    }

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
  mockImages.length = 0
  window.Image = MockImage as unknown as typeof window.Image
})

afterEach(() => {
  window.Image = originalImage
  vi.restoreAllMocks()
})

describe('Avatar', () => {
  test('renders nothing when avatar group items is undefined or empty', () => {
    const screen = render(() => (
      <>
        <AvatarGroup />
        <AvatarGroup items={[]} />
      </>
    ))

    expect(screen.container.querySelectorAll('[data-slot="root"]')).toHaveLength(0)
  })

  test('renders avatar as single avatar structure', () => {
    const screen = render(() => <Avatar text="MR" />)

    expect(screen.container.querySelector('[data-slot="root"]')).not.toBeNull()
    expect(screen.container.querySelector('[data-slot="item"]')).toBeNull()
  })

  test('renders fallback first while image is loading', () => {
    outcomesBySrc.set('/loading.png', 'pending')
    const screen = render(() => <Avatar src="/loading.png" text="MR" />)

    const root = screen.container.querySelector('[data-slot="root"]')
    const image = screen.container.querySelector('[data-slot="image"]')
    const fallback = screen.container.querySelector('[data-slot="fallback"]')

    expect(root?.getAttribute('data-status')).toBe('loading')
    expect(image?.className).toContain('hidden-hitless')
    expect(image?.getAttribute('aria-hidden')).toBe('true')
    expect(fallback?.textContent).toBe('MR')
  })

  test('switches to loaded state and crossfades image', async () => {
    outcomesBySrc.set('/loaded.png', 'success')
    const screen = render(() => <Avatar src="/loaded.png" alt="Moraine" />)

    const root = screen.container.querySelector('[data-slot="root"]')

    await waitFor(() => {
      expect(root?.getAttribute('data-status')).toBe('loaded')
    })

    const image = screen.container.querySelector('[data-slot="image"]')
    const fallback = screen.container.querySelector('[data-slot="fallback"]')
    expect(image?.getAttribute('src')).toContain('/loaded.png')
    expect(image?.className).toContain('opacity-100')
    expect(fallback?.className).toContain('hidden-hitless')
    expect(fallback?.getAttribute('aria-hidden')).toBe('true')
  })

  test.each([
    ['cached-success', 'loaded'],
    ['cached-error', 'error'],
  ] as const)('resolves %s probes synchronously without an idle callback', (outcome, status) => {
    outcomesBySrc.set('/cached.png', outcome)
    const onStatusChange = vi.fn()
    const screen = render(() => (
      <Avatar src="/cached.png" alt="Cached avatar" onStatusChange={onStatusChange} />
    ))

    const root = screen.container.querySelector('[data-slot="root"]')
    expect(root?.getAttribute('data-status')).toBe(status)
    expect(onStatusChange).not.toHaveBeenCalledWith('idle')

    if (status === 'loaded') {
      expect(screen.container.querySelector('[data-slot="image"]')).not.toBeNull()
      expect(
        screen.container.querySelector('[data-slot="fallback"]')?.getAttribute('aria-hidden'),
      ).toBe('true')
    } else {
      expect(
        screen.container.querySelector('[data-slot="image"]')?.getAttribute('aria-hidden'),
      ).toBe('true')
      expect(screen.container.querySelector('[data-slot="fallback"]')).not.toBeNull()
    }
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

  test('supports sm and lg size variants for single avatars', () => {
    const screen = render(() => (
      <>
        <Avatar size="sm" fallback="i-lucide-user" badge="i-lucide-check" />
        <Avatar size="lg" fallback="i-lucide-user" badge="i-lucide-check" />
      </>
    ))

    const roots = Array.from(screen.container.querySelectorAll('[data-slot="root"]'))
    const fallbackIcons = Array.from(
      screen.container.querySelectorAll('[data-slot="fallbackIcon"]'),
    )
    const badges = Array.from(screen.container.querySelectorAll('[data-slot="badge"]'))

    expect(roots[0]?.className).toContain('size-6')
    expect(fallbackIcons[0]?.className).toContain('text-sm')
    expect(badges[0]?.className).toContain('size-3')

    expect(roots[1]?.className).toContain('size-10')
    expect(fallbackIcons[1]?.className).toContain('text-lg')
    expect(badges[1]?.className).toContain('size-4')
  })

  test('generates initials from alt when text is not provided', () => {
    const screen = render(() => <Avatar alt="Moraine Team" />)
    const fallback = screen.container.querySelector('[data-slot="fallback"]')

    expect(fallback?.textContent).toBe('MT')
  })

  test('generates Unicode-safe initials across non-space whitespace', () => {
    const screen = render(() => <Avatar alt={'Ada\t😀 Lovelace'} />)
    const fallback = screen.container.querySelector('[data-slot="fallback"]')

    expect(fallback?.textContent).toBe('A😀')
  })

  test('resets to loading state when src changes', async () => {
    outcomesBySrc.set('/first.png', 'success')
    outcomesBySrc.set('/second.png', 'pending')

    let setSource: ((value: string) => void) | undefined
    const screen = render(() => {
      const [source, setSourceSignal] = createSignal('/first.png')
      setSource = setSourceSignal

      return <Avatar src={source()} text="MR" />
    })

    const root = screen.container.querySelector('[data-slot="root"]')

    await waitFor(() => {
      expect(root?.getAttribute('data-status')).toBe('loaded')
    })

    setSource?.('/second.png')
    expect(root?.getAttribute('data-status')).toBe('loading')
  })

  test('does not restart loading when src changes only by surrounding whitespace', async () => {
    outcomesBySrc.set('/same.png', 'success')
    const onStatusChange = vi.fn()
    const [source, setSource] = createSignal('/same.png')
    const screen = render(() => (
      <Avatar src={source()} alt="Same" onStatusChange={onStatusChange} />
    ))

    await waitFor(() => {
      expect(
        screen.container.querySelector('[data-slot="root"]')?.getAttribute('data-status'),
      ).toBe('loaded')
    })
    expect(mockImages).toHaveLength(1)

    setSource('  /same.png  ')
    await Promise.resolve()

    expect(mockImages).toHaveLength(1)
    expect(onStatusChange.mock.calls.map(([status]) => status)).toEqual(['loading', 'loaded'])
  })

  test('does not restart a pending load when the status callback changes', () => {
    outcomesBySrc.set('/pending.png', 'pending')
    const firstCallback = vi.fn()
    const secondCallback = vi.fn()
    const [callback, setCallback] = createSignal<(status: string) => void>(firstCallback)

    render(() => <Avatar src="/pending.png" onStatusChange={callback()} />)
    expect(mockImages).toHaveLength(1)
    expect(firstCallback.mock.calls.map(([status]) => status)).toEqual(['loading'])

    setCallback(() => secondCallback)
    mockImages[0]?.onload?.()

    expect(mockImages).toHaveLength(1)
    expect(firstCallback.mock.calls.map(([status]) => status)).toEqual(['loading'])
    expect(secondCallback.mock.calls.map(([status]) => status)).toEqual(['loaded'])
  })

  test('treats blank sources as errors without constructing a loader or emitting idle', () => {
    const onStatusChange = vi.fn()
    const screen = render(() => <Avatar src={' \t '} onStatusChange={onStatusChange} />)

    expect(screen.container.querySelector('[data-slot="root"]')?.getAttribute('data-status')).toBe(
      'error',
    )
    expect(mockImages).toHaveLength(0)
    expect(onStatusChange.mock.calls.map(([status]) => status)).toEqual(['error'])
  })

  test('ignores stale load events after source replacement and disposal', async () => {
    const [source, setSource] = createSignal('/first.png')
    const onStatusChange = vi.fn()
    const screen = render(() => <Avatar src={source()} onStatusChange={onStatusChange} />)
    const firstLoader = mockImages[0]

    setSource('/second.png')
    const secondLoader = mockImages[1]
    firstLoader?.onload?.()

    expect(screen.container.querySelector('[data-slot="root"]')?.getAttribute('data-status')).toBe(
      'loading',
    )

    secondLoader?.onload?.()
    expect(screen.container.querySelector('[data-slot="root"]')?.getAttribute('data-status')).toBe(
      'loaded',
    )

    screen.unmount()
    secondLoader?.onerror?.(new Event('error'))
    expect(onStatusChange.mock.calls.map(([status]) => status)).toEqual(['loading', 'loaded'])
  })

  test('exposes exactly one accessible image across fallback and loaded states', async () => {
    outcomesBySrc.set('/profile.png', 'pending')
    const screen = render(() => (
      <Avatar src="/profile.png" alt="Jane Doe" fallback="i-lucide-user" />
    ))

    const fallback = screen.getByRole('img', { name: 'Jane Doe' })
    expect(fallback.tagName).toBe('SPAN')
    expect(screen.container.querySelector('[data-slot="image"]')?.getAttribute('aria-hidden')).toBe(
      'true',
    )

    mockImages[0]?.onload?.()

    await waitFor(() => {
      const image = screen.getByRole('img', { name: 'Jane Doe' })
      expect(image.tagName).toBe('IMG')
    })
    expect(
      screen.container.querySelector('[data-slot="fallback"]')?.getAttribute('aria-hidden'),
    ).toBe('true')
  })

  test('lets a caller root label own image semantics without duplicate descendants', () => {
    outcomesBySrc.set('/profile.png', 'cached-success')
    const screen = render(() => (
      <Avatar src="/profile.png" alt="Original" aria-label="Account owner" />
    ))

    const root = screen.getByRole('img', { name: 'Account owner' })
    const image = screen.container.querySelector('[data-slot="image"]')

    expect(root.getAttribute('data-slot')).toBe('root')
    expect(image?.getAttribute('aria-hidden')).toBe('true')
    expect(screen.queryByRole('img', { name: 'Original' })).toBeNull()
  })

  test('keeps an empty-alt avatar decorative while its fallback is visible', () => {
    const screen = render(() => <Avatar alt="" />)

    expect(screen.queryByRole('img')).toBeNull()
    expect(
      screen.container.querySelector('[data-slot="fallback"]')?.getAttribute('role'),
    ).toBeNull()
  })

  test('keeps badge icons passive and creates no internal tab stop', () => {
    const screen = render(() => <Avatar badge="i-lucide-check" text="MR" />)
    const badge = screen.container.querySelector('[data-slot="badge"]')

    expect(badge?.className).toContain('pointer-events-none')
    expect(screen.container.querySelector('[tabindex="0"]')).toBeNull()
  })

  test('reads reactive fallback inputs once per rendered value', () => {
    let altReads = 0
    let fallbackReads = 0
    let badgeReads = 0

    render(() =>
      createComponent(Avatar, {
        get alt() {
          altReads += 1
          return 'Jane Doe'
        },
        get fallback() {
          fallbackReads += 1
          return 'i-lucide-user'
        },
        get badge() {
          badgeReads += 1
          return 'i-lucide-check'
        },
      }),
    )

    expect(altReads).toBe(1)
    expect(fallbackReads).toBe(1)
    expect(badgeReads).toBe(1)
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

  test('renders avatar group with items + max', () => {
    const screen = render(() => (
      <AvatarGroup max={2} items={[{ text: 'A' }, { text: 'B' }, { text: 'C' }, { text: 'D' }]} />
    ))

    const root = screen.container.querySelector('[data-slot="root"]')
    const count = screen.container.querySelector('[data-slot="count"]')
    const fallbacks = Array.from(
      screen.container.querySelectorAll('[data-slot="item"] [data-slot="fallback"]'),
    )

    expect(root).not.toBeNull()
    expect(count?.textContent).toBe('+2')
    expect(fallbacks).toHaveLength(2)
    expect(fallbacks[0]?.textContent).toBe('B')
    expect(fallbacks[1]?.textContent).toBe('A')
    expect(root?.className).toContain('flex-row-reverse')
    expect(root?.className).toContain('justify-end')
    const item = screen.container.querySelector('[data-slot="item"]')
    expect(item?.className).toContain('-me-2')
  })

  test('renders all group items when max is absent and reverses order', () => {
    const screen = render(() => (
      <AvatarGroup items={[{ text: 'A' }, { text: 'B' }, { text: 'C' }]} />
    ))

    const fallbacks = Array.from(
      screen.container.querySelectorAll('[data-slot="item"] [data-slot="fallback"]'),
    )

    expect(screen.container.querySelector('[data-slot="count"]')).toBeNull()
    expect(fallbacks).toHaveLength(3)
    expect(fallbacks[0]?.textContent).toBe('C')
    expect(fallbacks[1]?.textContent).toBe('B')
    expect(fallbacks[2]?.textContent).toBe('A')
  })

  test('supports sm and lg size variants for avatar groups', () => {
    const screen = render(() => (
      <>
        <AvatarGroup size="sm" max={1} items={[{ text: 'A' }, { text: 'B' }]} />
        <AvatarGroup size="lg" max={1} items={[{ text: 'A' }, { text: 'B' }]} />
      </>
    ))

    const groupCounts = Array.from(screen.container.querySelectorAll('[data-slot="count"]'))
    const groupItems = Array.from(screen.container.querySelectorAll('[data-slot="item"]'))

    expect(groupCounts[0]?.className).toContain('size-6')
    expect(groupCounts[0]?.className).toContain('-me-2')
    expect(groupItems[0]?.className).toContain('-me-2')

    expect(groupCounts[1]?.className).toContain('size-10')
    expect(groupCounts[1]?.className).toContain('-me-2')
    expect(groupItems[1]?.className).toContain('-me-2')
  })

  test('applies styles overrides to all slots', () => {
    outcomesBySrc.set('/styled.png', 'cached-success')
    const screen = render(() => (
      <>
        <Avatar
          src="/styled.png"
          styles={{
            root: { width: '200px' },
            image: { width: '200px' },
          }}
        />
        <Avatar
          fallback="i-lucide-user"
          badge="i-lucide-check"
          styles={{
            fallback: { width: '200px' },
            fallbackIcon: { width: '200px' },
            badge: { width: '200px' },
          }}
        />
      </>
    ))

    const root = screen.container.querySelector<HTMLElement>('[data-slot="root"]')
    const image = screen.container.querySelector<HTMLElement>('[data-slot="image"]')
    const fallback = Array.from(
      screen.container.querySelectorAll<HTMLElement>('[data-slot="fallback"]'),
    ).at(-1)
    const fallbackIcon = screen.container.querySelector<HTMLElement>('[data-slot="fallbackIcon"]')
    const badge = screen.container.querySelector<HTMLElement>('[data-slot="badge"]')

    expect(root?.style.width).toBe('200px')
    expect(image?.style.width).toBe('200px')
    expect(fallback?.style.width).toBe('200px')
    expect(fallbackIcon?.style.width).toBe('200px')
    expect(badge?.style.width).toBe('200px')
  })

  test('applies styles overrides to group slots', () => {
    const screen = render(() => (
      <AvatarGroup
        max={1}
        items={[{ text: 'A' }, { text: 'B' }]}
        styles={{
          root: { width: '200px' },
          item: { width: '200px' },
          count: { width: '200px' },
        }}
      />
    ))

    const root = screen.container.querySelector<HTMLElement>('[data-slot="root"]')
    const item = screen.container.querySelector<HTMLElement>('[data-slot="item"]')
    const count = screen.container.querySelector<HTMLElement>('[data-slot="count"]')

    expect(root?.style.width).toBe('200px')
    expect(item?.style.width).toBe('200px')
    expect(count?.style.width).toBe('200px')
  })

  test('accepts arbitrary root props while accepting root class prop in type contract', () => {
    const invalidHtmlProps: AvatarProps = { id: 'avatar-id', as: 'div', onclick: () => {} }
    const validClassProp: AvatarProps = { class: 'avatar-class' }
    const invalidItemsProp: AvatarProps = { items: [{ badge: 'i-lucide-user' }] }
    const validSingleProp: AvatarProps = { badge: 'i-lucide-user' }
    const item: AvatarT.Item = {}
    const base: AvatarT.Base = { badge: 'i-lucide-user' }
    const groupItem: AvatarGroupT.Item = { badge: 'i-lucide-user' }

    expect(invalidHtmlProps).toBeDefined()
    expect(validClassProp).toBeDefined()
    expect(invalidItemsProp).toBeDefined()
    expect(validSingleProp).toBeDefined()
    expect(item).toBeDefined()
    expect(base).toBeDefined()
    expect(groupItem).toBeDefined()
  })
})
