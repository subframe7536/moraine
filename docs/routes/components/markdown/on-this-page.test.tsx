import { Route, Router } from '@solidjs/router'
import { render } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import type { OnThisPageEntry } from '../../hooks/use-table-of-contents'

import { OnThisPage } from './on-this-page'

const [active, setActive] = createSignal<string[]>([])
vi.mock('../../hooks/use-table-of-contents', () => ({
  useTableOfContents: () => ({ activeIds: active, primaryActiveId: () => active()[0] ?? '' }),
}))

class ResizeObserverMock {
  static current: ResizeObserverMock
  callback: ResizeObserverCallback
  disconnect = vi.fn()
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
    ResizeObserverMock.current = this
  }
  observe = vi.fn()
  resize() {
    this.callback([], this as unknown as ResizeObserver)
  }
}

const entries: OnThisPageEntry[] = [
  { id: 'usage', label: 'Usage', level: 2 },
  { id: 'options', label: '`Options`', level: 3 },
  { id: 'api', label: 'API', level: 2 },
]

beforeEach(() => {
  setActive([])
  vi.stubGlobal('ResizeObserver', ResizeObserverMock)
  window.history.replaceState(null, '', '/input-number#usage')
})
afterEach(() => {
  vi.unstubAllGlobals()
  window.history.replaceState(null, '', '/')
})

function setup() {
  const view = render(() => (
    <Router>
      <Route path="/input-number" component={() => <OnThisPage entries={entries} />} />
    </Router>
  ))
  const links = [...view.container.querySelectorAll<HTMLAnchorElement>('a[data-toc-id]')]
  let layout = [
    [0, 32],
    [36, 32],
    [72, 40],
  ]
  links.forEach((link, index) => {
    Object.defineProperty(link, 'offsetTop', { get: () => layout[index]![0] })
    Object.defineProperty(link, 'offsetHeight', { get: () => layout[index]![1] })
  })
  const list = links[0]!.parentElement!
  Object.defineProperty(list, 'offsetHeight', { get: () => 112 })
  ResizeObserverMock.current.resize()
  const block = view.container.querySelector<HTMLElement>('[data-toc-active-range]')!
  return { view, links, block, setLayout: (next: number[][]) => (layout = next) }
}

test('links are native anchors and repeated ordinary clicks are not suppressed', () => {
  const { view, links } = setup()
  expect(links.map((link) => link.getAttribute('href'))).toEqual(['#usage', '#options', '#api'])
  expect(links.every((link) => link.target === '_self')).toBe(true)
  for (let click = 0; click < 2; click++) {
    const event = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 })
    links[0]!.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(false)
  }
  view.unmount()
})

test('one block spans the ordered active rows, including indentation and gaps', () => {
  const { view, links, block } = setup()
  expect(view.container.querySelectorAll('[data-toc-active-range]')).toHaveLength(1)
  setActive(['usage', 'options'])
  expect(block.style.clipPath).toBe('inset(0px 0 44px 0 round 8px)')
  expect(links[0]!.getAttribute('data-active')).toBe('')
  expect(links[0]!.getAttribute('aria-current')).toBe('location')
  expect(links[1]!.querySelector('code')?.textContent).toBe('Options')
  expect(links[1]!.querySelector('span')?.style.paddingInlineStart).toBe('1.5rem')
  setActive(['options', 'api'])
  expect(block.style.clipPath).toBe('inset(36px 0 0px 0 round 8px)')
  expect(links[0]!.hasAttribute('data-active')).toBe(false)
  expect(links[1]!.getAttribute('aria-current')).toBe('location')
  view.unmount()
  expect(ResizeObserverMock.current.disconnect).toHaveBeenCalledOnce()
})

test('resize refreshes cached positions and empty state hides the highlight', () => {
  const { view, block, setLayout } = setup()
  setActive(['api'])
  expect(block.style.clipPath).toBe('inset(72px 0 0px 0 round 8px)')
  setLayout([
    [0, 30],
    [34, 30],
    [68, 44],
  ])
  ResizeObserverMock.current.resize()
  expect(block.style.clipPath).toBe('inset(68px 0 0px 0 round 8px)')
  setActive([])
  expect(block.style.visibility).toBe('hidden')
  view.unmount()
})
