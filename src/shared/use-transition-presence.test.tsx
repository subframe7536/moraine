import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { createRoot, createSignal, Show } from 'solid-js'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { useTransitionPresence } from './use-transition-presence.ts'
import type {
  TransitionPresenceMotion,
  TransitionPresenceState,
} from './use-transition-presence.ts'

interface PresenceFixture {
  element: HTMLElement
  presence: TransitionPresenceState
  setOpen: (open: boolean) => void
}

function renderPresence(mode: TransitionPresenceMotion): PresenceFixture {
  let fixture: PresenceFixture | undefined

  render(() => {
    const [open, setOpen] = createSignal(true)
    const presence = useTransitionPresence({ open, mode })

    return (
      <Show when={presence.present()}>
        <div
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

function installComputedStyle(values: Partial<CSSStyleDeclaration> = {}): void {
  vi.spyOn(window, 'getComputedStyle').mockImplementation(
    () =>
      ({
        animationDelay: '0s',
        animationDuration: '0s',
        animationName: 'none',
        transitionDelay: '0s',
        transitionDuration: '0s',
        transitionProperty: 'none',
        ...values,
      }) as CSSStyleDeclaration,
  )
}

function disableWebAnimations(element: HTMLElement): void {
  Object.defineProperty(element, 'getAnimations', {
    configurable: true,
    value: undefined,
  })
}

function dispatchMotionEvent(
  element: HTMLElement,
  type: 'animationend' | 'transitionend',
  name: string,
): void {
  const event = new Event(type, { bubbles: true })
  Object.defineProperty(event, type === 'animationend' ? 'animationName' : 'propertyName', {
    value: name,
  })
  fireEvent(element, event)
}

function deferred(): { promise: Promise<void>; reject: () => void; resolve: () => void } {
  let reject: (() => void) | undefined
  let resolve: (() => void) | undefined
  const promise = new Promise<void>((nextResolve, nextReject) => {
    resolve = nextResolve
    reject = nextReject
  })

  return { promise, reject: () => reject?.(), resolve: () => resolve?.() }
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('useTransitionPresence', () => {
  test('keeps closed construction browser-independent and reacts to opening', async () => {
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

    lifecycle.setOpen(false)

    expect(lifecycle.presence.present()).toBe(false)
    expect(lifecycle.presence.dataAttrs()).toEqual({ 'data-closed': '' })
    lifecycle.dispose()
  })

  test('settles immediately when mode is none', () => {
    const fixture = renderPresence('none')

    fixture.setOpen(false)

    expect(fixture.presence.present()).toBe(false)
  })

  test('settles immediately when Web Animations reports no exit motion', () => {
    const fixture = renderPresence('both')
    installComputedStyle()
    Object.defineProperty(fixture.element, 'getAnimations', {
      configurable: true,
      value: () => [],
    })

    fixture.setOpen(false)

    expect(fixture.presence.present()).toBe(false)
  })

  test('settles immediately when computed styles report no exit motion', () => {
    const fixture = renderPresence('both')
    disableWebAnimations(fixture.element)
    installComputedStyle()

    fixture.setOpen(false)

    expect(fixture.presence.present()).toBe(false)
  })

  test('waits for every active Web Animation to settle', async () => {
    const fixture = renderPresence('both')
    const first = deferred()
    const second = deferred()
    Object.defineProperty(fixture.element, 'getAnimations', {
      configurable: true,
      value: () => [{ finished: first.promise }, { finished: second.promise }],
    })

    fixture.setOpen(false)
    first.resolve()
    await Promise.resolve()

    expect(fixture.presence.present()).toBe(true)

    second.resolve()
    await waitFor(() => {
      expect(fixture.presence.present()).toBe(false)
    })
  })

  test('settles animation fallback from its own end event', async () => {
    const fixture = renderPresence('animation')
    disableWebAnimations(fixture.element)
    installComputedStyle({
      animationDuration: '100ms',
      animationName: 'exit',
      transitionDuration: '1s',
      transitionProperty: 'opacity',
    })

    fixture.setOpen(false)
    await fireEvent.animationEnd(fixture.element)

    expect(fixture.presence.present()).toBe(false)
  })

  test('settles transition fallback from its own end event', async () => {
    const fixture = renderPresence('transition')
    disableWebAnimations(fixture.element)
    installComputedStyle({ transitionDuration: '100ms', transitionProperty: 'opacity' })

    fixture.setOpen(false)
    await fireEvent.transitionEnd(fixture.element)

    expect(fixture.presence.present()).toBe(false)
  })

  test('waits for every active transition property', async () => {
    const fixture = renderPresence('transition')
    disableWebAnimations(fixture.element)
    installComputedStyle({
      transitionDelay: '0s, 0s',
      transitionDuration: '50ms, 100ms',
      transitionProperty: 'opacity, transform',
    })

    fixture.setOpen(false)
    dispatchMotionEvent(fixture.element, 'transitionend', 'opacity')

    expect(fixture.presence.present()).toBe(true)

    dispatchMotionEvent(fixture.element, 'transitionend', 'transform')

    expect(fixture.presence.present()).toBe(false)
  })

  test('ignores unrelated and duplicate transition property events', async () => {
    const fixture = renderPresence('transition')
    disableWebAnimations(fixture.element)
    installComputedStyle({
      transitionDelay: '0s, 0s',
      transitionDuration: '50ms, 100ms',
      transitionProperty: 'opacity, transform',
    })

    fixture.setOpen(false)
    dispatchMotionEvent(fixture.element, 'transitionend', 'color')
    dispatchMotionEvent(fixture.element, 'transitionend', 'opacity')
    dispatchMotionEvent(fixture.element, 'transitionend', 'opacity')

    expect(fixture.presence.present()).toBe(true)

    dispatchMotionEvent(fixture.element, 'transitionend', 'transform')
    expect(fixture.presence.present()).toBe(false)
  })

  test('waits for every active CSS animation', async () => {
    const fixture = renderPresence('animation')
    disableWebAnimations(fixture.element)
    installComputedStyle({
      animationDelay: '0s, 0s',
      animationDuration: '50ms, 100ms',
      animationName: 'fade, slide',
    })

    fixture.setOpen(false)
    dispatchMotionEvent(fixture.element, 'animationend', 'fade')

    expect(fixture.presence.present()).toBe(true)

    dispatchMotionEvent(fixture.element, 'animationend', 'slide')

    expect(fixture.presence.present()).toBe(false)
  })

  test('ignores unrelated and duplicate animation-name events', async () => {
    const fixture = renderPresence('animation')
    disableWebAnimations(fixture.element)
    installComputedStyle({
      animationDelay: '0s, 0s',
      animationDuration: '50ms, 100ms',
      animationName: 'fade, slide',
    })

    fixture.setOpen(false)
    dispatchMotionEvent(fixture.element, 'animationend', 'pulse')
    dispatchMotionEvent(fixture.element, 'animationend', 'fade')
    dispatchMotionEvent(fixture.element, 'animationend', 'fade')

    expect(fixture.presence.present()).toBe(true)

    dispatchMotionEvent(fixture.element, 'animationend', 'slide')
    expect(fixture.presence.present()).toBe(false)
  })

  test('treats animation and transition cancellation events as settled motion', () => {
    const fixture = renderPresence('both')
    disableWebAnimations(fixture.element)
    installComputedStyle({
      animationDuration: '100ms',
      animationName: 'fade',
      transitionDuration: '100ms',
      transitionProperty: 'opacity',
    })

    fixture.setOpen(false)
    fireEvent(fixture.element, new Event('animationcancel', { bubbles: true }))

    expect(fixture.presence.present()).toBe(true)

    fireEvent(fixture.element, new Event('transitioncancel', { bubbles: true }))

    expect(fixture.presence.present()).toBe(false)
  })

  test('does not wait for an absent motion kind in both mode', async () => {
    const fixture = renderPresence('both')
    disableWebAnimations(fixture.element)
    installComputedStyle({ animationDuration: '100ms', animationName: 'exit' })

    fixture.setOpen(false)
    await fireEvent.animationEnd(fixture.element)

    expect(fixture.presence.present()).toBe(false)
  })

  test('uses the computed motion duration as a fallback when an event is missing', () => {
    vi.useFakeTimers()
    const fixture = renderPresence('animation')
    disableWebAnimations(fixture.element)
    installComputedStyle({
      animationDuration: '100ms',
      animationName: 'exit',
      transitionDuration: '1s',
      transitionProperty: 'opacity',
    })

    fixture.setOpen(false)
    vi.advanceTimersByTime(99)
    expect(fixture.presence.present()).toBe(true)

    vi.advanceTimersByTime(1)
    expect(fixture.presence.present()).toBe(false)
  })

  test('settles immediately when the exit element is already detached', () => {
    vi.useFakeTimers()
    const fixture = renderPresence('transition')
    disableWebAnimations(fixture.element)
    installComputedStyle({ transitionDuration: '100ms', transitionProperty: 'opacity' })

    fixture.element.remove()
    fixture.setOpen(false)

    expect(fixture.presence.present()).toBe(false)
    expect(vi.getTimerCount()).toBe(0)
  })

  test('cancels a pending close when reopened', async () => {
    const fixture = renderPresence('animation')
    const animation = deferred()
    Object.defineProperty(fixture.element, 'getAnimations', {
      configurable: true,
      value: () => [{ finished: animation.promise }],
    })

    fixture.setOpen(false)
    fixture.setOpen(true)
    animation.resolve()
    await Promise.resolve()

    expect(fixture.presence.present()).toBe(true)
  })

  test('clears a fallback timer when reopened', () => {
    vi.useFakeTimers()
    const fixture = renderPresence('transition')
    disableWebAnimations(fixture.element)
    installComputedStyle({ transitionDuration: '100ms', transitionProperty: 'opacity' })

    fixture.setOpen(false)
    fixture.setOpen(true)
    vi.runAllTimers()

    expect(fixture.presence.present()).toBe(true)
    expect(vi.getTimerCount()).toBe(0)
  })

  test('ignores completion from an element that was replaced during exit', async () => {
    const fixture = renderPresence('animation')
    const initialAnimation = deferred()
    const replacementAnimation = deferred()
    const replacementElement = document.createElement('div')
    document.body.append(replacementElement)
    Object.defineProperty(fixture.element, 'getAnimations', {
      configurable: true,
      value: () => [{ finished: initialAnimation.promise }],
    })
    Object.defineProperty(replacementElement, 'getAnimations', {
      configurable: true,
      value: () => [{ finished: replacementAnimation.promise }],
    })

    fixture.setOpen(false)
    fixture.presence.setElement(replacementElement)
    initialAnimation.resolve()
    await initialAnimation.promise
    await Promise.resolve()
    await Promise.resolve()

    expect(fixture.presence.present()).toBe(true)

    replacementAnimation.resolve()
    await waitFor(() => {
      expect(fixture.presence.present()).toBe(false)
    })
    replacementElement.remove()
  })

  test('waits for a replacement Web Animation after cancellation', async () => {
    const fixture = renderPresence('both')
    const initialAnimation = deferred()
    const replacementAnimation = deferred()
    let animations = [
      {
        finished: initialAnimation.promise,
        pending: false,
        playState: 'running',
      } as unknown as Animation,
    ]
    Object.defineProperty(fixture.element, 'getAnimations', {
      configurable: true,
      value: () => animations,
    })

    fixture.setOpen(false)
    animations = [
      {
        finished: replacementAnimation.promise,
        pending: false,
        playState: 'running',
      } as unknown as Animation,
    ]
    initialAnimation.reject()
    await Promise.resolve()
    await Promise.resolve()

    expect(fixture.presence.present()).toBe(true)

    animations = []
    replacementAnimation.resolve()
    await waitFor(() => {
      expect(fixture.presence.present()).toBe(false)
    })
  })

  test('ignores exit events from descendants', async () => {
    const fixture = renderPresence('animation')
    const child = document.createElement('span')
    fixture.element.append(child)
    disableWebAnimations(fixture.element)
    installComputedStyle({ animationDuration: '100ms', animationName: 'exit' })

    fixture.setOpen(false)
    await fireEvent.animationEnd(child)
    expect(fixture.presence.present()).toBe(true)

    await fireEvent.animationEnd(fixture.element)
    expect(fixture.presence.present()).toBe(false)
  })
})
