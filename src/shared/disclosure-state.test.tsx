import { createRoot, createSignal } from 'solid-js'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { createDisclosureState } from './disclosure-state'

function setScrollHeight(element: HTMLElement, getValue: () => number): void {
  Object.defineProperty(element, 'scrollHeight', {
    configurable: true,
    get: getValue,
  })
}

interface ResizeObserverRecord {
  disconnect: ReturnType<typeof vi.fn>
  notify: () => void
  observe: ReturnType<typeof vi.fn>
}

function installResizeObserverMock(): ResizeObserverRecord[] {
  const records: ResizeObserverRecord[] = []

  vi.stubGlobal(
    'ResizeObserver',
    class {
      disconnect = vi.fn()
      observe = vi.fn()
      unobserve = vi.fn()

      constructor(callback: ResizeObserverCallback) {
        records.push({
          disconnect: this.disconnect,
          notify: () => callback([], this),
          observe: this.observe,
        })
      }
    },
  )

  return records
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('createDisclosureState', () => {
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

  test('ignores a queued measurement after the content element detaches', async () => {
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
    element.remove()
    await Promise.resolve()

    expect(lifecycle.state.contentHeight()).toBe(10)
    lifecycle.dispose()
  })

  test('remeasures connected content when its size changes', () => {
    const observers = installResizeObserverMock()

    const lifecycle = createRoot((dispose) => ({
      dispose,
      state: createDisclosureState({ open: () => true }),
    }))
    const element = document.createElement('div')
    let scrollHeight = 10
    setScrollHeight(element, () => scrollHeight)
    document.body.append(element)

    lifecycle.state.registerMeasureElement(element)
    scrollHeight = 20

    expect(observers[0]?.observe).toHaveBeenCalledWith(element)
    observers[0]?.notify()

    expect(lifecycle.state.contentHeight()).toBe(20)
    element.remove()
    lifecycle.dispose()
    expect(observers[0]?.disconnect).toHaveBeenCalledTimes(1)
  })

  test('remeasures the current element after open state changes', async () => {
    const lifecycle = createRoot((dispose) => {
      const [open, setOpen] = createSignal(false)
      return {
        dispose,
        setOpen,
        state: createDisclosureState({ open }),
      }
    })
    const element = document.createElement('div')
    let scrollHeight = 0
    setScrollHeight(element, () => scrollHeight)
    document.body.append(element)

    lifecycle.state.registerMeasureElement(element)
    await Promise.resolve()
    expect(lifecycle.state.contentHeight()).toBe(0)

    scrollHeight = 24
    lifecycle.setOpen(true)
    await Promise.resolve()

    expect(lifecycle.state.contentHeight()).toBe(24)
    element.remove()
    lifecycle.dispose()
  })

  test('disconnects and ignores measurements from a superseded element', async () => {
    const observers = installResizeObserverMock()
    const lifecycle = createRoot((dispose) => ({
      dispose,
      state: createDisclosureState({ open: () => true }),
    }))
    const firstElement = document.createElement('div')
    const secondElement = document.createElement('div')
    let firstHeight = 10
    let secondHeight = 20
    setScrollHeight(firstElement, () => firstHeight)
    setScrollHeight(secondElement, () => secondHeight)
    document.body.append(firstElement, secondElement)

    lifecycle.state.registerMeasureElement(firstElement)
    lifecycle.state.registerMeasureElement(secondElement)

    expect(observers[0]?.disconnect).toHaveBeenCalledTimes(1)
    expect(lifecycle.state.contentHeight()).toBe(20)

    firstHeight = 30
    observers[0]?.notify()
    await Promise.resolve()

    expect(lifecycle.state.contentHeight()).toBe(20)

    secondHeight = 25
    observers[1]?.notify()

    expect(lifecycle.state.contentHeight()).toBe(25)
    firstElement.remove()
    secondElement.remove()
    lifecycle.dispose()
    expect(observers[1]?.disconnect).toHaveBeenCalledTimes(1)
  })

  test('measures the latest registration and falls back when it is released', () => {
    const lifecycle = createRoot((dispose) => ({
      dispose,
      state: createDisclosureState({ open: () => true }),
    }))
    const first = document.createElement('div')
    const second = document.createElement('div')
    setScrollHeight(first, () => 10)
    setScrollHeight(second, () => 20)
    document.body.append(first, second)

    const releaseFirst = lifecycle.state.registerMeasureElement(first)
    const releaseSecond = lifecycle.state.registerMeasureElement(second)
    expect(lifecycle.state.contentHeight()).toBe(20)

    releaseSecond()
    expect(lifecycle.state.contentHeight()).toBe(10)

    releaseFirst()
    expect(lifecycle.state.contentHeight()).toBe(0)
    first.remove()
    second.remove()
    lifecycle.dispose()
  })

  test('constructs without layout APIs or a mounted element', () => {
    vi.stubGlobal('ResizeObserver', undefined)

    expect(() => {
      createRoot((dispose) => {
        const [open, setOpen] = createSignal(false)
        const state = createDisclosureState({ open })

        expect(state.contentHeight()).toBe(0)
        setOpen(true)
        expect(state.contentHeight()).toBe(0)
        dispose()
      })
    }).not.toThrow()
  })

  test('calculates shouldMount based on open state, unmountOnHide, and overrides', () => {
    createRoot((dispose) => {
      const [open, setOpen] = createSignal(false)
      const state = createDisclosureState({
        open,
        unmountOnHide: true,
        transition: false,
      })

      expect(state.shouldMount()).toBe(false)
      expect(state.shouldMount({ forceMount: true })).toBe(true)
      expect(state.shouldMount({ unmountOnHide: false })).toBe(true)

      setOpen(true)
      expect(state.shouldMount()).toBe(true)

      dispose()
    })
  })

  test('keeps measuring the newest registration when an older duplicate is released', () => {
    const lifecycle = createRoot((dispose) => ({
      dispose,
      state: createDisclosureState({ open: () => true }),
    }))
    const shell = document.createElement('div')
    const body = document.createElement('div')
    setScrollHeight(shell, () => 30)
    setScrollHeight(body, () => 10)
    document.body.append(shell, body)

    const releaseFirstShell = lifecycle.state.registerMeasureElement(shell)
    lifecycle.state.registerMeasureElement(body)
    lifecycle.state.registerMeasureElement(shell)
    expect(lifecycle.state.contentHeight()).toBe(30)

    releaseFirstShell()
    expect(lifecycle.state.contentHeight()).toBe(30)

    shell.remove()
    body.remove()
    lifecycle.dispose()
  })

  test('keeps the newer content element when a superseded one is released', () => {
    createRoot((dispose) => {
      const state = createDisclosureState({ open: () => true })
      const first = document.createElement('div')
      const second = document.createElement('div')
      setScrollHeight(first, () => 40)

      const releaseFirst = state.registerContentElement(first)
      expect(state.contentHeight()).toBe(0)
      state.registerContentElement(second)
      releaseFirst()

      expect(state.contentElement()).toBe(second)
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
