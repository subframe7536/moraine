import { createRoot, createSignal } from 'solid-js'
import { afterEach, describe, expect, test, vi } from 'vitest'

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
      observe = vi.fn()
      unobserve = vi.fn()
      disconnect = vi.fn()

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
  test('publishes a new height when connected content resizes', () => {
    const notifiers = installResizeObserverMock()
    const lifecycle = createRoot((dispose) => ({
      dispose,
      state: createDisclosureState({ open: () => true }),
    }))
    const element = document.createElement('div')
    let scrollHeight = 10
    setScrollHeight(element, () => scrollHeight)
    document.body.append(element)

    lifecycle.state.registerMeasureElement(element)
    expect(lifecycle.state.contentHeight()).toBe(10)

    scrollHeight = 20
    notifiers[0]?.()
    expect(lifecycle.state.contentHeight()).toBe(20)

    element.remove()
    lifecycle.dispose()
  })

  test('ignores resize reports from a superseded measure element', () => {
    const notifiers = installResizeObserverMock()
    const lifecycle = createRoot((dispose) => ({
      dispose,
      state: createDisclosureState({ open: () => true }),
    }))
    const first = document.createElement('div')
    const second = document.createElement('div')
    let firstHeight = 10
    let secondHeight = 20
    setScrollHeight(first, () => firstHeight)
    setScrollHeight(second, () => secondHeight)
    document.body.append(first, second)

    lifecycle.state.registerMeasureElement(first)
    lifecycle.state.registerMeasureElement(second)
    expect(lifecycle.state.contentHeight()).toBe(20)

    firstHeight = 30
    notifiers[0]?.()
    expect(lifecycle.state.contentHeight()).toBe(20)

    secondHeight = 25
    notifiers[1]?.()
    expect(lifecycle.state.contentHeight()).toBe(25)

    first.remove()
    second.remove()
    lifecycle.dispose()
  })

  test('exposes reactive data attribute getters', () => {
    createRoot((dispose) => {
      const [open, setOpen] = createSignal(false)
      const [disabled, setDisabled] = createSignal(false)
      const state = createDisclosureState({ open, disabled })

      expect(state.dataAttrs['data-closed']).toBe('')
      expect(state.dataAttrs['data-disabled']).toBeUndefined()
      expect(state.dataAttrs['data-expanded']).toBeUndefined()

      setOpen(true)
      setDisabled(true)

      expect(state.dataAttrs['data-closed']).toBeUndefined()
      expect(state.dataAttrs['data-disabled']).toBe('')
      expect(state.dataAttrs['data-expanded']).toBe('')
      dispose()
    })
  })

  test('constructs without layout APIs or a mounted element', () => {
    vi.stubGlobal('ResizeObserver', undefined)

    expect(() => {
      createRoot((dispose) => {
        const [open, setOpen] = createSignal(false)
        createDisclosureState({ open })
        setOpen(true)
        dispose()
      })
    }).not.toThrow()
  })

  test('calculates shouldMount from the open state and mount mode', () => {
    createRoot((dispose) => {
      const [open, setOpen] = createSignal(false)
      const [mountMode, setMountMode] = createSignal<'unmount-on-hide' | 'keep-mounted'>(
        'unmount-on-hide',
      )
      const state = createDisclosureState({
        open,
        mountMode,
        transition: false,
      })

      expect(state.shouldMount()).toBe(false)

      setMountMode('keep-mounted')
      expect(state.shouldMount()).toBe(true)

      setMountMode('unmount-on-hide')
      setOpen(true)
      expect(state.shouldMount()).toBe(true)

      dispose()
    })
  })

  test('restores trigger focus when content closes while focused', async () => {
    let setOpen!: (v: boolean) => void
    let trigger!: HTMLButtonElement
    let innerInput!: HTMLInputElement
    let disposeRoot!: () => void

    createRoot((dispose) => {
      disposeRoot = dispose
      const [open, setControlledOpen] = createSignal(true)
      setOpen = setControlledOpen
      const state = createDisclosureState({ open })

      trigger = document.createElement('button')
      const content = document.createElement('div')
      innerInput = document.createElement('input')
      content.append(innerInput)
      document.body.append(trigger, content)

      state.setTriggerElement(trigger)
      state.registerContentElement(content)
    })

    innerInput.focus()
    expect(document.activeElement).toBe(innerInput)

    setOpen(false)
    await Promise.resolve()

    expect(document.activeElement).toBe(trigger)

    trigger.remove()
    innerInput.remove()
    disposeRoot()
  })

  test('does not restore trigger focus if focus was outside content upon close', async () => {
    let setOpen!: (v: boolean) => void
    let trigger!: HTMLButtonElement
    let outside!: HTMLButtonElement
    let disposeRoot!: () => void

    createRoot((dispose) => {
      disposeRoot = dispose
      const [open, setControlledOpen] = createSignal(true)
      setOpen = setControlledOpen
      const state = createDisclosureState({ open })

      trigger = document.createElement('button')
      outside = document.createElement('button')
      const content = document.createElement('div')
      document.body.append(trigger, outside, content)

      state.setTriggerElement(trigger)
      state.registerContentElement(content)
    })

    outside.focus()
    expect(document.activeElement).toBe(outside)

    setOpen(false)
    await Promise.resolve()

    expect(document.activeElement).toBe(outside)

    trigger.remove()
    outside.remove()
    disposeRoot()
  })

  test('restores trigger focus in iframe ownerDocument upon close', async () => {
    const iframe = document.createElement('iframe')
    document.body.append(iframe)
    const doc = iframe.contentDocument!

    let setOpen!: (v: boolean) => void
    let trigger!: HTMLButtonElement
    let input!: HTMLInputElement
    let disposeRoot!: () => void

    createRoot((dispose) => {
      disposeRoot = dispose
      const [open, setControlledOpen] = createSignal(true)
      setOpen = setControlledOpen
      const state = createDisclosureState({ open })

      trigger = doc.createElement('button')
      const content = doc.createElement('div')
      input = doc.createElement('input')
      content.append(input)
      doc.body.append(trigger, content)

      state.setTriggerElement(trigger)
      state.registerContentElement(content)
    })

    input.focus()
    expect(doc.activeElement).toBe(input)

    setOpen(false)
    await Promise.resolve()

    expect(doc.activeElement).toBe(trigger)

    disposeRoot()
    iframe.remove()
  })
})
