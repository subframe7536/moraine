import { render } from '@solidjs/testing-library'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { OnThisPage } from './on-this-page'

type ObserverCallback = ConstructorParameters<typeof IntersectionObserver>[0]

let observerCallback: ObserverCallback | undefined

class TestIntersectionObserver implements IntersectionObserver {
  readonly root = null
  readonly rootMargin = '-52px 0px 0px 0px'
  readonly scrollMargin = '0px 0px 0px 0px'
  readonly thresholds = [0]

  constructor(callback: ObserverCallback) {
    observerCallback = callback
  }

  disconnect = vi.fn()
  observe = vi.fn()
  takeRecords = vi.fn(() => [])
  unobserve = vi.fn()
}

function intersectionEntry(target: Element, isIntersecting: boolean): IntersectionObserverEntry {
  return {
    target,
    isIntersecting,
    boundingClientRect: target.getBoundingClientRect(),
    intersectionRatio: isIntersecting ? 1 : 0,
    intersectionRect: target.getBoundingClientRect(),
    rootBounds: null,
    time: 0,
  }
}

describe('OnThisPage', () => {
  beforeEach(() => {
    observerCallback = undefined
    vi.stubGlobal('IntersectionObserver', TestIntersectionObserver)
    history.replaceState(null, '', location.pathname)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('highlights every heading currently intersecting the viewport', () => {
    const firstHeading = document.createElement('h2')
    firstHeading.id = 'first'
    const secondHeading = document.createElement('h2')
    secondHeading.id = 'second'
    document.body.append(firstHeading, secondHeading)

    const screen = render(() => (
      <OnThisPage
        entries={[
          { id: 'first', label: 'First', level: 2 },
          { id: 'second', label: 'Second', level: 2 },
        ]}
      />
    ))
    observerCallback?.(
      [intersectionEntry(firstHeading, true), intersectionEntry(secondHeading, true)],
      {} as IntersectionObserver,
    )

    const firstLink = screen.getByRole('link', { name: 'First' })
    const secondLink = screen.getByRole('link', { name: 'Second' })
    expect(firstLink.hasAttribute('data-active')).toBe(true)
    expect(secondLink.hasAttribute('data-active')).toBe(true)
    expect(firstLink.getAttribute('aria-current')).toBe('location')
    expect(secondLink.hasAttribute('aria-current')).toBe(false)

    observerCallback?.([intersectionEntry(firstHeading, false)], {} as IntersectionObserver)
    expect(firstLink.hasAttribute('data-active')).toBe(false)
    expect(secondLink.hasAttribute('data-active')).toBe(true)

    firstHeading.remove()
    secondHeading.remove()
  })
})
