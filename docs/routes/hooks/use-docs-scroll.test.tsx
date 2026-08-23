import { render } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { DOCS_SCROLL_TARGET_RETRY_FRAMES, useDocsScroll } from './use-docs-scroll.ts'

interface ScrollState {
  pathname: string
  hash: string
}

let frames = new Map<number, FrameRequestCallback>()
let nextFrame = 0
let originalRequestAnimationFrame: typeof requestAnimationFrame
let originalCancelAnimationFrame: typeof cancelAnimationFrame
let originalMatchMedia: typeof window.matchMedia

function flushAnimationFrames() {
  const pendingFrames = [...frames.values()]
  frames.clear()
  for (const frame of pendingFrames) {
    frame(0)
  }
}

function createTarget(id: string) {
  const target = document.createElement('h2')
  target.id = id
  target.scrollIntoView = vi.fn()
  document.body.append(target)
  return target
}

beforeEach(() => {
  frames = new Map()
  nextFrame = 0
  originalRequestAnimationFrame = globalThis.requestAnimationFrame
  originalCancelAnimationFrame = globalThis.cancelAnimationFrame
  originalMatchMedia = window.matchMedia
  globalThis.requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
    nextFrame += 1
    frames.set(nextFrame, callback)
    return nextFrame
  })
  globalThis.cancelAnimationFrame = vi.fn((frame: number) => {
    frames.delete(frame)
  })
  window.matchMedia = vi.fn(() => ({ matches: false })) as unknown as typeof window.matchMedia
})

afterEach(() => {
  document.body.innerHTML = ''
  globalThis.requestAnimationFrame = originalRequestAnimationFrame
  globalThis.cancelAnimationFrame = originalCancelAnimationFrame
  window.matchMedia = originalMatchMedia
  vi.restoreAllMocks()
})

describe('useDocsScroll', () => {
  test('resets the nested main only for a completed pathname change without a hash', () => {
    const root = document.createElement('main')
    root.scrollTop = 96
    const [location, setLocation] = createSignal<ScrollState>({ pathname: '/button', hash: '' })
    const [isRouting, setIsRouting] = createSignal(false)
    const [committedPath, setCommittedPath] = createSignal('/button')

    render(() => {
      useDocsScroll({ getLocation: location, isRouting, committedPath, getScrollRoot: () => root })
      return null
    })

    setIsRouting(true)
    setLocation({ pathname: '/input', hash: '' })
    setCommittedPath('/input')
    setIsRouting(false)

    expect(root.scrollTop).toBe(0)
  })

  test('waits for the cross-page commit, then scrolls hashes smoothly without resetting the root', () => {
    const root = document.createElement('main')
    root.scrollTop = 96
    const target = createTarget('usage')
    const [location, setLocation] = createSignal<ScrollState>({ pathname: '/button', hash: '' })
    const [isRouting, setIsRouting] = createSignal(false)
    const [committedPath, setCommittedPath] = createSignal('/button')

    render(() => {
      useDocsScroll({ getLocation: location, isRouting, committedPath, getScrollRoot: () => root })
      return null
    })

    setIsRouting(true)
    setLocation({ pathname: '/input', hash: '#usage' })
    setCommittedPath('/input')
    setIsRouting(false)
    flushAnimationFrames()

    expect(root.scrollTop).toBe(96)
    expect(target.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' })
  })

  test('handles same-page and history-like hash changes from reactive locations', () => {
    const first = createTarget('usage')
    const second = createTarget('api')
    const [location, setLocation] = createSignal<ScrollState>({ pathname: '/button', hash: '' })
    const isRouting = () => false
    const committedPath = () => '/button'

    render(() => {
      useDocsScroll({
        getLocation: location,
        isRouting,
        committedPath,
        getScrollRoot: () => undefined,
      })
      return null
    })

    setLocation({ pathname: '/button', hash: '#usage' })
    flushAnimationFrames()
    setLocation({ pathname: '/button', hash: '#api' })
    flushAnimationFrames()

    expect(first.scrollIntoView).toHaveBeenCalledTimes(1)
    expect(second.scrollIntoView).toHaveBeenCalledTimes(1)

    setLocation({ pathname: '/button', hash: '#api' })
    flushAnimationFrames()
    expect(second.scrollIntoView).toHaveBeenCalledTimes(2)
  })

  test('retries a late target for the named finite frame budget', () => {
    const [location] = createSignal<ScrollState>({ pathname: '/button', hash: '#late' })

    render(() => {
      useDocsScroll({
        getLocation: location,
        isRouting: () => false,
        committedPath: () => '/button',
        getScrollRoot: () => undefined,
      })
      return null
    })

    flushAnimationFrames()
    const target = createTarget('late')
    flushAnimationFrames()

    expect(target.scrollIntoView).toHaveBeenCalledTimes(1)
  })

  test('does not scroll unknown hashes and treats malformed cross-page hashes as no hash', () => {
    const root = document.createElement('main')
    root.scrollTop = 96
    const [location, setLocation] = createSignal<ScrollState>({ pathname: '/button', hash: '' })
    const [committedPath, setCommittedPath] = createSignal('/button')

    render(() => {
      useDocsScroll({
        getLocation: location,
        isRouting: () => false,
        committedPath,
        getScrollRoot: () => root,
      })
      return null
    })

    setLocation({ pathname: '/button', hash: '#missing' })
    for (let attempt = 0; attempt < DOCS_SCROLL_TARGET_RETRY_FRAMES; attempt += 1) {
      flushAnimationFrames()
    }
    expect(frames.size).toBe(0)
    expect(root.scrollTop).toBe(96)

    setCommittedPath('/input')
    setLocation({ pathname: '/input', hash: '#%E0%A4' })
    expect(root.scrollTop).toBe(0)
  })

  test('uses auto behavior for reduced motion and cancels superseded work on navigation and unmount', () => {
    window.matchMedia = vi.fn(() => ({ matches: true })) as unknown as typeof window.matchMedia
    const target = createTarget('usage')
    const [location, setLocation] = createSignal<ScrollState>({ pathname: '/button', hash: '#late' })
    const rendered = render(() => {
      useDocsScroll({
        getLocation: location,
        isRouting: () => false,
        committedPath: () => '/button',
        getScrollRoot: () => undefined,
      })
      return null
    })

    setLocation({ pathname: '/button', hash: '#usage' })
    expect(globalThis.cancelAnimationFrame).toHaveBeenCalled()
    flushAnimationFrames()
    expect(target.scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' })

    setLocation({ pathname: '/button', hash: '#later' })
    rendered.unmount()
    expect(globalThis.cancelAnimationFrame).toHaveBeenCalled()
  })
})
