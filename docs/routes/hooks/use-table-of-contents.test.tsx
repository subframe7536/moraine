import { render } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { useTableOfContents } from './use-table-of-contents'
import type { OnThisPageEntry } from './use-table-of-contents'

const entries: OnThisPageEntry[] = [
  { id: 'a', label: 'A', level: 2 },
  { id: 'b', label: 'B', level: 2 },
  { id: 'c', label: 'C', level: 3 },
]

class ObserverMock {
  static instances: ObserverMock[] = []
  targets: Element[] = []
  disconnect = vi.fn()
  constructor(
    readonly callback: IntersectionObserverCallback,
    readonly options: IntersectionObserverInit,
  ) {
    ObserverMock.instances.push(this)
  }
  observe = (target: Element) => this.targets.push(target)
  emit(...states: [string, number][]) {
    this.callback(
      states.map(([id, ratio]) => ({
        target: document.getElementById(id)!,
        isIntersecting: ratio > 0,
        intersectionRatio: ratio,
      })) as unknown as IntersectionObserverEntry[],
      this as unknown as IntersectionObserver,
    )
  }
}

beforeEach(() => {
  ObserverMock.instances = []
  vi.stubGlobal('IntersectionObserver', ObserverMock)
})
afterEach(() => {
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})

function setup(hash = '#c') {
  const root = document.createElement('div')
  root.innerHTML = entries.map((entry) => `<h2 id="${entry.id}"></h2>`).join('')
  document.body.append(root)
  let positions = [70, 170, 270]
  vi.spyOn(root, 'getBoundingClientRect').mockReturnValue({ top: 0 } as DOMRect)
  entries.forEach((entry, index) => {
    vi.spyOn(document.getElementById(entry.id)!, 'getBoundingClientRect').mockImplementation(
      () => ({ top: positions[index] }) as DOMRect,
    )
  })
  const [currentEntries, setEntries] = createSignal(entries)
  let toc!: ReturnType<typeof useTableOfContents>
  const view = render(() => {
    toc = useTableOfContents(
      currentEntries,
      () => hash,
      () => root,
    )
    return <div />
  })
  return { root, toc, view, setEntries, setPositions: (next: number[]) => (positions = next) }
}

test('observes the supplied frame with a 52px top margin and 0.9 threshold', () => {
  const { view, root } = setup()
  const observer = ObserverMock.instances[0]!
  expect(observer.options).toMatchObject({ root, rootMargin: '-52px 0px 0px 0px', threshold: 0.9 })
  expect(observer.targets.map((target) => target.id)).toEqual(['a', 'b', 'c'])
  view.unmount()
  expect(observer.disconnect).toHaveBeenCalledOnce()
})

test('hash bootstraps, but ordered visible headings supersede it', () => {
  const { toc, view } = setup()
  expect(toc.primaryActiveId()).toBe('c')
  ObserverMock.instances[0]!.emit(['b', 1], ['a', 1])
  expect(toc.activeIds()).toEqual(['a', 'b'])
  expect(toc.primaryActiveId()).toBe('a')
  view.unmount()
})

test('fallback picks the nearest heading and crosses over at the midpoint', () => {
  const { toc, root, setPositions, view } = setup()
  ObserverMock.instances[0]!.emit(['a', 0], ['b', 0], ['c', 0])
  expect(toc.activeIds()).toEqual(['a'])
  setPositions([-60, 60, 200])
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    callback(0)
    return 1
  })
  root.dispatchEvent(new Event('scroll'))
  expect(toc.activeIds()).toEqual(['b'])
  view.unmount()
})

test('changed entries disconnect and observe the new set', () => {
  const { setEntries, view } = setup()
  const first = ObserverMock.instances[0]!
  setEntries([entries[2]!])
  expect(first.disconnect).toHaveBeenCalledOnce()
  expect(ObserverMock.instances[1]!.targets.map((target) => target.id)).toEqual(['c'])
  view.unmount()
})
