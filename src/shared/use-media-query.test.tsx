import { render } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { createMediaQuery } from './use-media-query'

const originalMatchMedia = window.matchMedia

function createMediaQueryList(matches: boolean): MediaQueryList {
  return {
    matches,
    media: '(min-width: 1px)',
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
  }
}

afterEach(() => {
  window.matchMedia = originalMatchMedia
})

describe('createMediaQuery', () => {
  test('keeps the server fallback through mount before applying the client match', async () => {
    const media = createMediaQueryList(true)
    window.matchMedia = vi.fn(() => media)

    const screen = render(() => {
      const matches = createMediaQuery('(min-width: 1px)')
      return <div data-testid="matches">{String(matches())}</div>
    })

    expect(screen.getByTestId('matches').textContent).toBe('false')

    await Promise.resolve()

    expect(screen.getByTestId('matches').textContent).toBe('true')
  })

  test('returns the fallback when matchMedia is unavailable', () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: undefined,
      writable: true,
    })

    expect(() => {
      const screen = render(() => {
        const matches = createMediaQuery('(min-width: 1px)', true)
        return <div data-testid="matches">{String(matches())}</div>
      })

      expect(screen.getByTestId('matches').textContent).toBe('true')
    }).not.toThrow()
  })

  test('uses legacy MediaQueryList listeners when modern listeners are unavailable', async () => {
    const addListener = vi.fn()
    const removeListener = vi.fn()
    const media = {
      matches: false,
      media: '(min-width: 1px)',
      onchange: null,
      addEventListener: undefined,
      removeEventListener: undefined,
      dispatchEvent: vi.fn(),
      addListener,
      removeListener,
    } as unknown as MediaQueryList
    window.matchMedia = vi.fn(() => media)

    const screen = render(() => {
      const matches = createMediaQuery('(min-width: 1px)')
      return <div data-testid="matches">{String(matches())}</div>
    })
    await Promise.resolve()

    const listener = addListener.mock.calls[0]?.[0] as (event: MediaQueryListEvent) => void
    listener({ matches: true } as MediaQueryListEvent)

    expect(screen.getByTestId('matches').textContent).toBe('true')

    screen.unmount()

    expect(removeListener).toHaveBeenCalledWith(listener)
  })

  test('replaces the listener when a reactive query changes', async () => {
    const firstMedia = createMediaQueryList(false)
    const secondMedia = createMediaQueryList(true)
    const matchMedia = vi.fn((query: string) =>
      query === '(min-width: 1px)' ? firstMedia : secondMedia,
    )
    window.matchMedia = matchMedia
    const [query, setQuery] = createSignal('(min-width: 1px)')

    const screen = render(() => {
      const matches = createMediaQuery(query)
      return <div data-testid="matches">{String(matches())}</div>
    })

    setQuery('(min-width: 2px)')
    await Promise.resolve()

    expect(firstMedia.removeEventListener).toHaveBeenCalledWith(
      'change',
      (firstMedia.addEventListener as ReturnType<typeof vi.fn>).mock.calls[0]?.[1],
      undefined,
    )
    expect(secondMedia.addEventListener).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('matches').textContent).toBe('true')
  })

  test('reacts to modern change events and removes the registered listener', async () => {
    const media = createMediaQueryList(false)
    window.matchMedia = vi.fn(() => media)
    const screen = render(() => {
      const matches = createMediaQuery('(min-width: 1px)')
      return <div data-testid="matches">{String(matches())}</div>
    })
    await Promise.resolve()

    const listener = (media.addEventListener as ReturnType<typeof vi.fn>).mock.calls[0]?.[1] as (
      event: MediaQueryListEvent,
    ) => void
    listener({ matches: true } as MediaQueryListEvent)

    expect(screen.getByTestId('matches').textContent).toBe('true')

    screen.unmount()

    expect(media.removeEventListener).toHaveBeenCalledWith('change', listener, undefined)
  })

  test('cancels a pending initial update when its owner is disposed', async () => {
    const media = createMediaQueryList(true)
    window.matchMedia = vi.fn(() => media)
    let currentMatch: (() => boolean) | undefined
    const screen = render(() => {
      currentMatch = createMediaQuery('(min-width: 1px)')
      return null
    })

    screen.unmount()
    await Promise.resolve()

    expect(currentMatch?.()).toBe(false)
  })

  test('normalizes an @media prefix before creating the query list', async () => {
    const media = createMediaQueryList(false)
    const matchMedia = vi.fn(() => media)
    window.matchMedia = matchMedia

    render(() => {
      createMediaQuery('@media (min-width: 1px)')
      return null
    })
    await Promise.resolve()

    expect(matchMedia).toHaveBeenCalledWith('(min-width: 1px)')
  })
})
