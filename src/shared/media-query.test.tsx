import { render } from '@solidjs/testing-library'
import { createSignal, flush } from 'solid-js'
import { afterEach, describe, expect, vi, it } from 'vitest'

import { createMediaQuery } from './media-query'
const originalMatchMedia = window.matchMedia

function createMediaQueryList(matches: boolean): MediaQueryList {
  return {
    matches,
    media: '(min-width: 1px)',
    onchange: null,
    addEventListener: vi.fn<(...args: Array<any>) => void>(),
    removeEventListener: vi.fn<(...args: Array<any>) => void>(),
    dispatchEvent: vi.fn<(event: Event) => boolean>().mockReturnValue(true),
    addListener: vi.fn<(...args: Array<any>) => void>(),
    removeListener: vi.fn<(...args: Array<any>) => void>(),
  }
}

afterEach(() => {
  window.matchMedia = originalMatchMedia
})

describe('createMediaQuery', () => {
  it('keeps the server fallback through mount before applying the client match', async () => {
    const media = createMediaQueryList(true)
    window.matchMedia = vi.fn<() => any>(() => media)

    const screen = render(() => {
      const matches = createMediaQuery('(min-width: 1px)')
      return <div data-testid="matches">{String(matches())}</div>
    })

    expect(screen.getByTestId('matches').textContent).toBe('false')

    await Promise.resolve()
    await Promise.resolve()

    expect(screen.getByTestId('matches').textContent).toBe('true')
  })

  it('returns the fallback when matchMedia is unavailable', () => {
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

  it('replaces the listener when a reactive query changes', async () => {
    const firstMedia = createMediaQueryList(false)
    const secondMedia = createMediaQueryList(true)
    const matchMedia = vi.fn<(query: string) => any>((query) =>
      query === '(min-width: 1px)' ? firstMedia : secondMedia,
    )
    window.matchMedia = matchMedia
    const [query, setQuery] = createSignal('(min-width: 1px)')

    const screen = render(() => {
      const matches = createMediaQuery(query)
      return <div data-testid="matches">{String(matches())}</div>
    })

    flush(() => setQuery('(min-width: 2px)'))
    await Promise.resolve()
    await Promise.resolve()

    expect(screen.getByTestId('matches').textContent).toBe('true')
  })

  it('reacts to modern change events and removes the registered listener', async () => {
    const media = createMediaQueryList(false)
    window.matchMedia = vi.fn<() => any>(() => media)
    const screen = render(() => {
      const matches = createMediaQuery('(min-width: 1px)')
      return <div data-testid="matches">{String(matches())}</div>
    })
    await Promise.resolve()

    const listener = (media.addEventListener as ReturnType<typeof vi.fn>).mock.calls[0]?.[1] as (
      event: MediaQueryListEvent,
    ) => void
    listener({ matches: true } as MediaQueryListEvent)
    await Promise.resolve()

    expect(screen.getByTestId('matches').textContent).toBe('true')

    screen.unmount()

    expect(media.removeEventListener).toHaveBeenCalledWith('change', listener, undefined)
  })

  it('cancels a pending initial update when its owner is disposed', async () => {
    const media = createMediaQueryList(true)
    window.matchMedia = vi.fn<() => any>(() => media)
    let currentMatch: (() => boolean) | undefined
    const screen = render(() => {
      currentMatch = createMediaQuery('(min-width: 1px)')
      return null
    })

    screen.unmount()
    await Promise.resolve()

    expect(currentMatch?.()).toBe(false)
  })

  it('normalizes an @media prefix before creating the query list', async () => {
    const media = createMediaQueryList(false)
    const matchMedia = vi.fn<() => any>(() => media)
    window.matchMedia = matchMedia

    render(() => {
      createMediaQuery('@media (min-width: 1px)')
      return null
    })
    await Promise.resolve()

    expect(matchMedia).toHaveBeenCalledWith('(min-width: 1px)')
  })
})
