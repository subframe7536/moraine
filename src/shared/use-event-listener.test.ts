import { createEffect, createRoot, createSignal } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import {
  attachEventListener,
  attachEventListenerMap,
  useEventListener,
  useEventListenerMap,
} from './use-event-listener'

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

  test('forwards advanced options unchanged to registration and cleanup', () => {
    const target = createTarget()
    const controller = new AbortController()
    const options = {
      capture: true,
      passive: true,
      once: true,
      signal: controller.signal,
    }
    const listener = vi.fn<(event: MouseEvent) => void>()

    const cleanup = attachEventListener(target, 'click', listener, options)

    expect(target.addEventListener).toHaveBeenCalledWith('click', listener, options)

    cleanup()

    expect(target.removeEventListener).toHaveBeenCalledWith('click', listener, options)
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

  test('registers and removes only defined map entries', () => {
    const target = createTarget()
    const click = vi.fn<(event: MouseEvent) => void>()

    const cleanup = attachEventListenerMap(target, {
      click,
      keydown: undefined,
    })

    expect(target.addEventListener).toHaveBeenCalledTimes(1)
    expect(target.addEventListener).toHaveBeenCalledWith('click', click, undefined)

    cleanup()

    expect(target.removeEventListener).toHaveBeenCalledTimes(1)
    expect(target.removeEventListener).toHaveBeenCalledWith('click', click, undefined)
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

  test('detaches the previous target before attaching a replacement', async () => {
    const firstTarget = createTarget()
    const secondTarget = createTarget()

    const lifecycle = createRoot((dispose) => {
      const [target, setTarget] = createSignal<HTMLElement | undefined>(firstTarget)

      createEffect(() => {
        useEventListener(target(), 'click', () => {})
      })

      return { dispose, setTarget }
    })

    await Promise.resolve()

    expect(firstTarget.addEventListener).toHaveBeenCalledTimes(1)

    lifecycle.setTarget(secondTarget)

    expect(firstTarget.removeEventListener).toHaveBeenCalledTimes(1)
    expect(secondTarget.addEventListener).toHaveBeenCalledTimes(1)
    expect(
      (firstTarget.removeEventListener as ReturnType<typeof vi.fn>).mock.invocationCallOrder[0],
    ).toBeLessThan(
      (secondTarget.addEventListener as ReturnType<typeof vi.fn>).mock.invocationCallOrder[0]!,
    )

    lifecycle.setTarget(undefined)

    expect(secondTarget.removeEventListener).toHaveBeenCalledTimes(1)
    lifecycle.dispose()
  })

  test('dispatches current reactive state without duplicate registration', () => {
    const target = createTarget()
    const seen: string[] = []

    createRoot((dispose) => {
      const [value, setValue] = createSignal('first')

      useEventListener(target, 'click', () => {
        seen.push(value())
      })

      const registeredListener = (target.addEventListener as ReturnType<typeof vi.fn>).mock
        .calls[0]?.[1] as EventListener

      registeredListener(new MouseEvent('click'))
      setValue('second')
      registeredListener(new MouseEvent('click'))

      expect(seen).toEqual(['first', 'second'])
      expect(target.addEventListener).toHaveBeenCalledTimes(1)
      dispose()
    })
  })

  test('re-registers changed options without retaining the previous registration', async () => {
    const target = createTarget()

    const lifecycle = createRoot((dispose) => {
      const [capture, setCapture] = createSignal(false)

      createEffect(() => {
        useEventListener(target, 'click', () => {}, { capture: capture(), passive: true })
      })

      return { dispose, setCapture }
    })

    await Promise.resolve()

    expect(target.addEventListener).toHaveBeenLastCalledWith('click', expect.any(Function), {
      capture: false,
      passive: true,
    })

    lifecycle.setCapture(true)

    expect(target.removeEventListener).toHaveBeenCalledTimes(1)
    expect(target.addEventListener).toHaveBeenCalledTimes(2)
    expect(target.addEventListener).toHaveBeenLastCalledWith('click', expect.any(Function), {
      capture: true,
      passive: true,
    })
    lifecycle.dispose()
  })

  test('is safe to construct without a browser target', () => {
    expect(() => {
      createRoot((dispose) => {
        useEventListener(undefined, 'custom', () => {})
        dispose()
      })
    }).not.toThrow()
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
