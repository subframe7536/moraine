import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { createSignal, Show } from 'solid-js'
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

function deferred(): { promise: Promise<void>; resolve: () => void } {
  let resolve: (() => void) | undefined
  const promise = new Promise<void>((nextResolve) => {
    resolve = nextResolve
  })

  return { promise, resolve: () => resolve?.() }
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('useTransitionPresence', () => {
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
