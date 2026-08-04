import { createRoot } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import {
  attachEventListener,
  attachEventListenerMap,
  useEventListener,
  useEventListenerMap,
} from './use-event-listener.ts'

function createTarget() {
  return {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  } as unknown as HTMLElement
}

describe('attachEventListener', () => {
  test('returns a noop cleanup when target is missing', () => {
    expect(() => {
      attachEventListener(undefined, 'click', () => {})()
    }).not.toThrow()
  })
})

describe('attachEventListeners', () => {
  test('registers all listeners and disposes them together', () => {
    const target = createTarget()

    const cleanup = attachEventListenerMap(
      target,
      {
        click: () => {},
        keydown: () => {},
      },
      true,
    )

    expect(target.addEventListener).toHaveBeenCalledTimes(2)

    cleanup()

    expect(target.removeEventListener).toHaveBeenCalledTimes(2)
    expect(target.removeEventListener).toHaveBeenNthCalledWith(
      1,
      'click',
      expect.any(Function),
      true,
    )
    expect(target.removeEventListener).toHaveBeenNthCalledWith(
      2,
      'keydown',
      expect.any(Function),
      true,
    )
  })
})

describe('useEventListener', () => {
  test('registers a listener and removes it on cleanup', () => {
    const target = createTarget()
    const listener = vi.fn<(event: MouseEvent) => void>()

    createRoot((dispose) => {
      useEventListener(target, 'click', listener, true)

      expect(target.addEventListener).toHaveBeenCalledTimes(1)
      expect(target.addEventListener).toHaveBeenCalledWith('click', expect.any(Function), true)

      const wrappedListener = (target.addEventListener as ReturnType<typeof vi.fn>).mock
        .calls[0]?.[1] as EventListener
      const event = { type: 'click' } as MouseEvent

      wrappedListener(event)
      expect(listener).toHaveBeenCalledWith(event)

      dispose()
    })

    const wrappedListener = (target.addEventListener as ReturnType<typeof vi.fn>).mock
      .calls[0]?.[1] as EventListener

    expect(target.removeEventListener).toHaveBeenCalledTimes(1)
    expect(target.removeEventListener).toHaveBeenCalledWith('click', wrappedListener, true)
  })

  test('normalizes object options for cleanup', () => {
    const target = createTarget()

    createRoot((dispose) => {
      useEventListener(target, 'click', () => {}, { capture: true, passive: true })
      dispose()
    })

    const wrappedListener = (target.addEventListener as ReturnType<typeof vi.fn>).mock
      .calls[0]?.[1] as EventListener

    expect(target.removeEventListener).toHaveBeenCalledWith('click', wrappedListener, {
      capture: true,
      passive: true,
    })
  })
})

describe('useEventListeners', () => {
  test('registers multiple listeners and removes them on cleanup', () => {
    const target = createTarget()

    createRoot((dispose) => {
      useEventListenerMap(target, {
        click: () => {},
        focusin: () => {},
      })

      expect(target.addEventListener).toHaveBeenCalledTimes(2)

      dispose()
    })

    expect(target.removeEventListener).toHaveBeenCalledTimes(2)
  })
})
