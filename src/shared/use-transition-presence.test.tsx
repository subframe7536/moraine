import { fireEvent, render } from '@solidjs/testing-library'
import { createRoot, createSignal, onCleanup, Show } from 'solid-js'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { useTransitionPresence } from './use-transition-presence'
import type { TransitionPresenceState } from './use-transition-presence'

interface PresenceFixture {
  element: HTMLElement
  presence: TransitionPresenceState
  setOpen: (open: boolean) => void
}

function renderPresence(): PresenceFixture {
  let fixture: PresenceFixture | undefined

  render(() => {
    const [open, setOpen] = createSignal(true)
    const presence = useTransitionPresence({ open })

    return (
      <Show when={presence.present()}>
        <div
          {...presence.dataAttrs()}
          ref={(element) => {
            fixture = { element, presence, setOpen }
            presence.setElement(element)
          }}
        />
      </Show>
    )
  })

  if (!fixture) {
    throw new Error('Presence fixture did not mount')
  }

  return fixture
}

function installComputedStyle(
  values: (element: Element) => Partial<CSSStyleDeclaration> = () => ({}),
): void {
  vi.spyOn(window, 'getComputedStyle').mockImplementation(
    (element) =>
      Object.assign(
        {
          animationDelay: '0s',
          animationDuration: '0s',
          animationName: 'none',
          display: 'block',
        },
        values(element),
      ) as CSSStyleDeclaration,
  )
}

function dispatchAnimationEvent(
  element: HTMLElement,
  type: 'animationcancel' | 'animationend' | 'animationstart',
  animationName: string,
): void {
  const event = new Event(type, { bubbles: true })
  Object.defineProperty(event, 'animationName', { value: animationName })
  fireEvent(element, event)
}

async function flushExitDetection(): Promise<void> {
  await Promise.resolve()
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('useTransitionPresence', () => {
  test('is browser-independent while initially closed and reacts to opening', async () => {
    const lifecycle = createRoot((dispose) => {
      const [open, setOpen] = createSignal(false)
      const presence = useTransitionPresence({ open })

      expect(presence.present()).toBe(false)
      expect(presence.dataAttrs()).toEqual({ 'data-closed': '' })

      return { dispose, presence, setOpen }
    })

    lifecycle.setOpen(true)
    await Promise.resolve()

    expect(lifecycle.presence.present()).toBe(true)
    expect(lifecycle.presence.dataAttrs()).toEqual({ 'data-expanded': '' })

    lifecycle.dispose()
  })

  test('settles synchronously when no elements are registered', () => {
    const lifecycle = createRoot((dispose) => {
      const [open, setOpen] = createSignal(true)
      const presence = useTransitionPresence({ open })

      return { dispose, presence, setOpen }
    })

    lifecycle.setOpen(false)

    expect(lifecycle.presence.present()).toBe(false)
    lifecycle.dispose()
  })

  test('settles when the closed state has no exit animation', async () => {
    const fixture = renderPresence()
    let closed = false
    installComputedStyle(() => ({
      animationDuration: '100ms',
      animationName: closed ? 'none' : 'mo-enter',
    }))

    fixture.setOpen(false)
    closed = true
    await flushExitDetection()

    expect(fixture.element.getAttribute('data-closed')).toBe('')
    expect(fixture.presence.present()).toBe(false)
  })

  test('waits for an animation event when the environment cannot resolve animation styles', async () => {
    const fixture = renderPresence()
    installComputedStyle(() => ({
      animationDuration: 'auto',
      animationName: 'none',
    }))

    fixture.setOpen(false)
    await flushExitDetection()

    expect(fixture.presence.present()).toBe(true)

    dispatchAnimationEvent(fixture.element, 'animationend', 'mo-exit')
    expect(fixture.presence.present()).toBe(false)
  })

  test('keeps content mounted until its current exit animation settles', async () => {
    const fixture = renderPresence()
    let closed = false
    installComputedStyle(() => ({
      animationDuration: '100ms',
      animationName: closed ? 'mo-exit' : 'mo-enter',
    }))

    fixture.setOpen(false)
    closed = true
    await flushExitDetection()

    expect(fixture.element.getAttribute('data-closed')).toBe('')
    expect(fixture.presence.present()).toBe(true)

    dispatchAnimationEvent(fixture.element, 'animationend', 'mo-enter')
    expect(fixture.presence.present()).toBe(true)

    dispatchAnimationEvent(fixture.element, 'animationend', 'mo-exit')
    expect(fixture.presence.present()).toBe(false)
  })

  test('settles an exit animation when it is cancelled', async () => {
    const fixture = renderPresence()
    let closed = false
    installComputedStyle(() => ({
      animationDuration: '100ms',
      animationName: closed ? 'mo-exit' : 'mo-enter',
    }))

    fixture.setOpen(false)
    closed = true
    await flushExitDetection()
    dispatchAnimationEvent(fixture.element, 'animationcancel', 'mo-exit')

    expect(fixture.presence.present()).toBe(false)
  })

  test('waits for every changed animation name', async () => {
    const fixture = renderPresence()
    let closed = false
    installComputedStyle(() => ({
      animationDuration: '50ms, 100ms',
      animationName: closed ? 'fade, slide' : 'mo-enter',
    }))

    fixture.setOpen(false)
    closed = true
    await flushExitDetection()

    dispatchAnimationEvent(fixture.element, 'animationend', 'fade')
    expect(fixture.presence.present()).toBe(true)

    dispatchAnimationEvent(fixture.element, 'animationend', 'slide')
    expect(fixture.presence.present()).toBe(false)
  })

  test('waits for every registered element', async () => {
    let first: HTMLElement | undefined
    let second: HTMLElement | undefined
    let presence: TransitionPresenceState | undefined
    let setOpen: ((open: boolean) => void) | undefined
    let closed = false
    installComputedStyle((element) => ({
      animationDuration: '100ms',
      animationName: closed ? (element === first ? 'first-exit' : 'second-exit') : 'mo-enter',
    }))

    const screen = render(() => {
      const [open, updateOpen] = createSignal(true)
      const currentPresence = useTransitionPresence({ open })
      presence = currentPresence
      setOpen = updateOpen

      return (
        <Show when={currentPresence.present()}>
          <div
            ref={(element) => {
              first = element
              onCleanup(currentPresence.registerElement(element))
            }}
          />
          <div
            ref={(element) => {
              second = element
              onCleanup(currentPresence.registerElement(element))
            }}
          />
        </Show>
      )
    })

    if (!first || !second || !presence || !setOpen) {
      throw new Error('Multi-element fixture did not mount')
    }

    setOpen(false)
    closed = true
    await flushExitDetection()
    dispatchAnimationEvent(first, 'animationend', 'first-exit')

    expect(presence.present()).toBe(true)

    dispatchAnimationEvent(second, 'animationend', 'second-exit')
    expect(presence.present()).toBe(false)
    screen.unmount()
  })

  test('does not wait for an element removed while hiding', async () => {
    let first: HTMLElement | undefined
    let second: HTMLElement | undefined
    let unregisterSecond: (() => void) | undefined
    let presence: TransitionPresenceState | undefined
    let setOpen: ((open: boolean) => void) | undefined
    let closed = false
    installComputedStyle((element) => ({
      animationDuration: '100ms',
      animationName: closed ? (element === first ? 'first-exit' : 'second-exit') : 'mo-enter',
    }))

    const screen = render(() => {
      const [open, updateOpen] = createSignal(true)
      const currentPresence = useTransitionPresence({ open })
      presence = currentPresence
      setOpen = updateOpen

      return (
        <Show when={currentPresence.present()}>
          <div
            ref={(element) => {
              first = element
              onCleanup(currentPresence.registerElement(element))
            }}
          />
          <div
            ref={(element) => {
              second = element
              unregisterSecond = currentPresence.registerElement(element)
              onCleanup(unregisterSecond)
            }}
          />
        </Show>
      )
    })

    if (!first || !second || !presence || !setOpen || !unregisterSecond) {
      throw new Error('Removable fixture did not mount')
    }

    setOpen(false)
    closed = true
    await flushExitDetection()
    unregisterSecond()
    dispatchAnimationEvent(first, 'animationend', 'first-exit')

    expect(presence.present()).toBe(false)
    screen.unmount()
  })

  test('tracks a replacement element registered while hiding', async () => {
    const fixture = renderPresence()
    const replacement = document.createElement('div')
    document.body.append(replacement)
    let closed = false
    installComputedStyle((element) => ({
      animationDuration: '100ms',
      animationName: closed
        ? element === replacement
          ? 'replacement-exit'
          : 'initial-exit'
        : 'mo-enter',
    }))

    fixture.setOpen(false)
    closed = true
    await flushExitDetection()

    fixture.presence.setElement(replacement)
    await flushExitDetection()

    dispatchAnimationEvent(replacement, 'animationend', 'replacement-exit')
    expect(fixture.presence.present()).toBe(false)
    replacement.remove()
  })

  test('uses the computed exit duration as a fallback when an event is missing', async () => {
    vi.useFakeTimers()
    const fixture = renderPresence()
    let closed = false
    installComputedStyle(() => ({
      animationDelay: '25ms',
      animationDuration: '100ms',
      animationName: closed ? 'mo-exit' : 'mo-enter',
    }))

    fixture.setOpen(false)
    closed = true
    await flushExitDetection()
    vi.advanceTimersByTime(124)
    expect(fixture.presence.present()).toBe(true)

    vi.advanceTimersByTime(1)
    expect(fixture.presence.present()).toBe(false)
  })

  test('cancels a pending exit when reopened', async () => {
    vi.useFakeTimers()
    const fixture = renderPresence()
    let closed = false
    installComputedStyle(() => ({
      animationDuration: '100ms',
      animationName: closed ? 'mo-exit' : 'mo-enter',
    }))

    fixture.setOpen(false)
    closed = true
    await flushExitDetection()
    fixture.setOpen(true)
    closed = false
    vi.runAllTimers()

    expect(fixture.presence.present()).toBe(true)
    expect(vi.getTimerCount()).toBe(0)
  })

  test('ignores animation events from descendants', async () => {
    const fixture = renderPresence()
    const child = document.createElement('span')
    fixture.element.append(child)
    let closed = false
    installComputedStyle(() => ({
      animationDuration: '100ms',
      animationName: closed ? 'mo-exit' : 'mo-enter',
    }))

    fixture.setOpen(false)
    closed = true
    await flushExitDetection()
    dispatchAnimationEvent(child, 'animationend', 'mo-exit')

    expect(fixture.presence.present()).toBe(true)

    dispatchAnimationEvent(fixture.element, 'animationend', 'mo-exit')
    expect(fixture.presence.present()).toBe(false)
  })
})
