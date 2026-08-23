import { render } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { useTableOfContents } from './use-table-of-contents.ts'

const entries = [
  { id: 'usage', label: 'Usage', level: 2 },
  { id: 'api', label: 'API', level: 2 },
]

let observer: MockIntersectionObserver | undefined
let originalIntersectionObserver: typeof IntersectionObserver

class MockIntersectionObserver {
  observe = vi.fn()
  disconnect = vi.fn()
  constructor(
    readonly callback: IntersectionObserverCallback,
    readonly options?: IntersectionObserverInit,
  ) {
    observer = this
  }
  root = null
  rootMargin = ''
  thresholds: number[] = []
  takeRecords = () => []
  unobserve = vi.fn()
}

beforeEach(() => {
  observer = undefined
  originalIntersectionObserver = globalThis.IntersectionObserver
  globalThis.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver
})

afterEach(() => {
  document.body.innerHTML = ''
  globalThis.IntersectionObserver = originalIntersectionObserver
  vi.restoreAllMocks()
})

describe('useTableOfContents', () => {
  test('observes headings within the nested main root and derives visible active IDs', () => {
    const [hash] = createSignal('')
    const screen = render(() => {
      const toc = useTableOfContents(
        () => entries,
        hash,
        () => document.querySelector<HTMLElement>('[data-slot="main"]') ?? undefined,
      )
      return (
        <main data-slot="main">
          <h2 id="usage">Usage</h2>
          <h2 id="api">API</h2>
          <output data-testid="active">{toc.activeIds().join(',')}</output>
        </main>
      )
    })

    const root = screen.container.querySelector('[data-slot="main"]')
    expect(observer?.options?.root).toBe(root)
    expect(observer?.observe).toHaveBeenCalledTimes(2)

    observer?.callback(
      [
        {
          target: document.getElementById('usage')!,
          isIntersecting: true,
        } as unknown as IntersectionObserverEntry,
      ],
      observer as unknown as IntersectionObserver,
    )
    expect(screen.getByTestId('active').textContent).toBe('usage')
  })

  test('uses the reactive router hash for primary active state without scrolling', () => {
    const scrollIntoView = vi.fn()
    HTMLElement.prototype.scrollIntoView = scrollIntoView
    const [hash, setHash] = createSignal('#usage')
    let primaryActiveId: (() => string) | undefined

    render(() => {
      const toc = useTableOfContents(() => entries, hash, () => undefined)
      primaryActiveId = toc.primaryActiveId
      return null
    })

    expect(primaryActiveId?.()).toBe('usage')
    setHash('#api')
    expect(primaryActiveId?.()).toBe('api')
    expect(scrollIntoView).not.toHaveBeenCalled()
  })

  test('disconnects its observer on cleanup', () => {
    const screen = render(() => {
      useTableOfContents(() => entries, () => '', () => undefined)
      return <h2 id="usage">Usage</h2>
    })

    screen.unmount()
    expect(observer?.disconnect).toHaveBeenCalledTimes(1)
  })
})
