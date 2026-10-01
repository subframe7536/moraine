import { cleanup, render } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { OnThisPage } from './on-this-page'

const [activeIds, setActiveIds] = createSignal(['usage'])
vi.mock('@solidjs/router', () => ({ useLocation: () => ({ hash: '' }) }))
vi.mock('../../../hooks/use-table-of-contents', () => ({
  useTableOfContents: () => ({ activeIds, primaryActiveId: () => activeIds()[0] }),
}))

const frames = new Map<number, FrameRequestCallback>()
let nextFrame = 0
const entries = [
  { id: 'usage', label: 'Usage', level: 1 },
  { id: 'anatomy', label: 'Anatomy', level: 1 },
]

beforeEach(() => {
  setActiveIds(['usage'])
  frames.clear()
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.set(++nextFrame, callback)
    return nextFrame
  })
  vi.stubGlobal('cancelAnimationFrame', (frame: number) => frames.delete(frame))
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe = vi.fn()
      disconnect = vi.fn()
    },
  )
  vi.spyOn(HTMLElement.prototype, 'offsetTop', 'get').mockImplementation(function (
    this: HTMLElement,
  ) {
    return this.dataset.tocId === 'anatomy' ? 30 : 0
  })
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (
    this: HTMLElement,
  ) {
    return this instanceof HTMLAnchorElement ? 20 : 60
  })
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

test('draws the measured block before enabling transitions, then follows later sections', () => {
  const result = render(() => <OnThisPage entries={entries} />)
  const indicator = result.container.querySelector<HTMLElement>('[aria-hidden="true"]')!
  expect(indicator.style.clipPath).toBe('inset(0px 0 40px 0 round 8px)')
  expect(indicator.hasAttribute('data-loaded')).toBe(false)
  expect(frames.size).toBe(1)
  const [frame, callback] = [...frames][0]!
  frames.delete(frame)
  callback(0)
  expect(indicator.hasAttribute('data-loaded')).toBe(true)
  setActiveIds(['anatomy'])
  expect(indicator.style.clipPath).toBe('inset(30px 0 10px 0 round 8px)')
  expect(indicator.hasAttribute('data-loaded')).toBe(true)
  expect(frames.size).toBe(0)
})

test('unmount cancels the pending loaded frame', () => {
  const result = render(() => <OnThisPage entries={entries} />)
  expect(frames.size).toBe(1)
  result.unmount()
  expect(frames.size).toBe(0)
})
