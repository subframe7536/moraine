import { createRoot, createSignal, flush } from 'solid-js'
import { afterEach, describe, expect, vi, it } from 'vitest'

import { createDisclosureState } from './disclosure-state'
function setScrollHeight(element: HTMLElement, getValue: () => number): void {
  Object.defineProperty(element, 'scrollHeight', { configurable: true, get: getValue })
}

/** Stubs ResizeObserver so a test can simulate the browser reporting a resize. */
function installResizeObserverMock(): Array<() => void> {
  const notifiers: Array<() => void> = []
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe = vi.fn<(...args: Array<any>) => void>()
      unobserve = vi.fn<(...args: Array<any>) => void>()
      disconnect = vi.fn<(...args: Array<any>) => void>()

      constructor(callback: ResizeObserverCallback) {
        notifiers.push(() => callback([], this))
      }
    },
  )
  return notifiers
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('createDisclosureState', () => {
  it('publishes a new height when connected content resizes', () => {
    const notifiers = installResizeObserverMock()
    const lifecycle = createRoot((dispose) => ({
      dispose,
      state: createDisclosureState({ open: () => true }),
    }))
    const element = document.createElement('div')
    let scrollHeight = 10
    flush(() => setScrollHeight(element, () => scrollHeight))
    document.body.append(element)

    flush(() => lifecycle.state.registerMeasureElement(element))
    expect(lifecycle.state.contentHeight()).toBe(10)

    scrollHeight = 20
    flush(() => notifiers[0]?.())
    expect(lifecycle.state.contentHeight()).toBe(20)

    element.remove()
    lifecycle.dispose()
  })

  it('ignores resize reports from a superseded measure element', () => {
    const notifiers = installResizeObserverMock()
    const lifecycle = createRoot((dispose) => ({
      dispose,
      state: createDisclosureState({ open: () => true }),
    }))
    const first = document.createElement('div')
    const second = document.createElement('div')
    let firstHeight = 10
    let secondHeight = 20
    flush(() => setScrollHeight(first, () => firstHeight))
    flush(() => setScrollHeight(second, () => secondHeight))
    document.body.append(first, second)

    flush(() => lifecycle.state.registerMeasureElement(first))
    flush(() => lifecycle.state.registerMeasureElement(second))
    expect(lifecycle.state.contentHeight()).toBe(20)

    firstHeight = 30
    flush(() => notifiers[0]?.())
    expect(lifecycle.state.contentHeight()).toBe(20)

    secondHeight = 25
    flush(() => notifiers[1]?.())
    expect(lifecycle.state.contentHeight()).toBe(25)

    first.remove()
    second.remove()
    lifecycle.dispose()
  })

  it('exposes reactive data attribute getters', () => {
    createRoot((dispose) => {
      const [open, setOpen] = createSignal(false, { ownedWrite: true })
      const [disabled, setDisabled] = createSignal(false, { ownedWrite: true })
      const state = createDisclosureState({ open, disabled })

      expect(state.dataAttrs['data-closed']).toBe('')
      expect(state.dataAttrs['data-disabled']).toBeUndefined()
      expect(state.dataAttrs['data-expanded']).toBeUndefined()

      flush(() => setOpen(true))
      flush(() => setDisabled(true))

      expect(state.dataAttrs['data-closed']).toBeUndefined()
      expect(state.dataAttrs['data-disabled']).toBe('')
      expect(state.dataAttrs['data-expanded']).toBe('')
      dispose()
    })
  })

  it('constructs without layout APIs or a mounted element', () => {
    vi.stubGlobal('ResizeObserver', undefined)

    expect(() => {
      createRoot((dispose) => {
        const [open, setOpen] = createSignal(false, { ownedWrite: true })
        createDisclosureState({ open })
        flush(() => setOpen(true))
        dispose()
      })
    }).not.toThrow()
  })

  it('calculates shouldMount from the open state and forceMount', () => {
    createRoot((dispose) => {
      const [open, setOpen] = createSignal(false, { ownedWrite: true })
      const [forceMount, setForceMount] = createSignal(false, { ownedWrite: true })
      const state = createDisclosureState({
        open,
        forceMount,
        transition: false,
      })

      expect(state.shouldMount()).toBe(false)

      flush(() => setForceMount(true))
      expect(state.shouldMount()).toBe(true)

      flush(() => setForceMount(false))
      flush(() => setOpen(true))
      expect(state.shouldMount()).toBe(true)

      dispose()
    })
  })

  it('restores trigger focus when content closes while focused', async () => {
    let setOpen!: (v: boolean) => void
    let trigger!: HTMLButtonElement
    let innerInput!: HTMLInputElement
    let disposeRoot!: () => void

    createRoot((dispose) => {
      disposeRoot = dispose
      const [open, setControlledOpen] = createSignal(true, { ownedWrite: true })
      setOpen = setControlledOpen
      const state = createDisclosureState({ open })

      trigger = document.createElement('button')
      const content = document.createElement('div')
      innerInput = document.createElement('input')
      content.append(innerInput)
      document.body.append(trigger, content)

      flush(() => state.setTriggerElement(trigger))
      flush(() => state.registerContentElement(content))
    })

    innerInput.focus()
    expect(document.activeElement).toBe(innerInput)

    flush(() => setOpen(false))
    await Promise.resolve()

    expect(document.activeElement).toBe(trigger)

    trigger.remove()
    innerInput.remove()
    disposeRoot()
  })

  it('does not restore trigger focus if focus was outside content upon close', async () => {
    let setOpen!: (v: boolean) => void
    let trigger!: HTMLButtonElement
    let outside!: HTMLButtonElement
    let disposeRoot!: () => void

    createRoot((dispose) => {
      disposeRoot = dispose
      const [open, setControlledOpen] = createSignal(true, { ownedWrite: true })
      setOpen = setControlledOpen
      const state = createDisclosureState({ open })

      trigger = document.createElement('button')
      outside = document.createElement('button')
      const content = document.createElement('div')
      document.body.append(trigger, outside, content)

      flush(() => state.setTriggerElement(trigger))
      flush(() => state.registerContentElement(content))
    })

    outside.focus()
    expect(document.activeElement).toBe(outside)

    flush(() => setOpen(false))
    await Promise.resolve()

    expect(document.activeElement).toBe(outside)

    trigger.remove()
    outside.remove()
    disposeRoot()
  })

  it('restores trigger focus in iframe ownerDocument upon close', async () => {
    const iframe = document.createElement('iframe')
    document.body.append(iframe)
    const doc = iframe.contentDocument!

    let setOpen!: (v: boolean) => void
    let trigger!: HTMLButtonElement
    let input!: HTMLInputElement
    let disposeRoot!: () => void

    createRoot((dispose) => {
      disposeRoot = dispose
      const [open, setControlledOpen] = createSignal(true, { ownedWrite: true })
      setOpen = setControlledOpen
      const state = createDisclosureState({ open })

      trigger = doc.createElement('button')
      const content = doc.createElement('div')
      input = doc.createElement('input')
      content.append(input)
      doc.body.append(trigger, content)

      flush(() => state.setTriggerElement(trigger))
      flush(() => state.registerContentElement(content))
    })

    input.focus()
    expect(doc.activeElement).toBe(input)

    flush(() => setOpen(false))
    await Promise.resolve()

    expect(doc.activeElement).toBe(trigger)

    disposeRoot()
    iframe.remove()
  })

  it('measures the latest registration and falls back when it is released', () => {
    const lifecycle = createRoot((dispose) => ({
      dispose,
      state: createDisclosureState({ open: () => true }),
    }))
    const first = document.createElement('div')
    const second = document.createElement('div')
    flush(() => setScrollHeight(first, () => 10))
    flush(() => setScrollHeight(second, () => 20))
    document.body.append(first, second)

    const releaseFirst = lifecycle.state.registerMeasureElement(first)
    const releaseSecond = lifecycle.state.registerMeasureElement(second)
    flush()
    expect(lifecycle.state.contentHeight()).toBe(20)

    flush(() => releaseSecond())
    expect(lifecycle.state.contentHeight()).toBe(10)

    flush(() => releaseFirst())
    expect(lifecycle.state.contentHeight()).toBe(0)
    first.remove()
    second.remove()
    lifecycle.dispose()
  })

  it('keeps measuring the newest registration when an older duplicate is released', () => {
    const lifecycle = createRoot((dispose) => ({
      dispose,
      state: createDisclosureState({ open: () => true }),
    }))
    const shell = document.createElement('div')
    const body = document.createElement('div')
    flush(() => setScrollHeight(shell, () => 30))
    flush(() => setScrollHeight(body, () => 10))
    document.body.append(shell, body)

    const releaseFirstShell = lifecycle.state.registerMeasureElement(shell)
    flush(() => lifecycle.state.registerMeasureElement(body))
    flush(() => lifecycle.state.registerMeasureElement(shell))
    expect(lifecycle.state.contentHeight()).toBe(30)

    flush(() => releaseFirstShell())
    expect(lifecycle.state.contentHeight()).toBe(30)

    shell.remove()
    body.remove()
    lifecycle.dispose()
  })

  it('keeps the newer content element when a superseded one is released', () => {
    createRoot((dispose) => {
      const state = createDisclosureState({ open: () => true })
      const first = document.createElement('div')
      const second = document.createElement('div')
      flush(() => setScrollHeight(first, () => 40))

      const releaseFirst = state.registerContentElement(first)
      expect(state.contentHeight()).toBe(0)
      flush(() => state.registerContentElement(second))
      flush(() => releaseFirst())
      expect(state.contentElement()).toBe(second)
      dispose()
    })
  })
})
