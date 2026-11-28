import { createEffect, createRoot, createSignal, flush } from 'solid-js'
import { describe, expect, vi, it } from 'vitest'

import {
  attachEventListener,
  attachEventListenerMap,
  createEventListener,
  createEventListenerMap,
} from './event-listener'
function click(target: EventTarget) {
  target.dispatchEvent(new MouseEvent('click', { bubbles: true }))
}

describe('attachEventListener', () => {
  it('returns a noop cleanup when target is missing', () => {
    expect(() => {
      attachEventListener(undefined, 'click', () => {})()
    }).not.toThrow()
  })

  it('listens until the returned cleanup runs', () => {
    const target = document.createElement('button')
    const listener = vi.fn<(...args: Array<any>) => void>()

    const cleanup = attachEventListener(target, 'click', listener)
    click(target)
    expect(listener).toHaveBeenCalledOnce()

    cleanup()
    click(target)
    expect(listener).toHaveBeenCalledOnce()
  })

  it('honors the once option', () => {
    const target = document.createElement('button')
    const listener = vi.fn<(...args: Array<any>) => void>()

    attachEventListener(target, 'click', listener, { once: true })
    click(target)
    click(target)

    expect(listener).toHaveBeenCalledOnce()
  })

  it('does not swallow errors thrown by listeners', () => {
    const target = document.createElement('button')
    const error = new Error('listener boom')
    const onError = vi.fn<(err: unknown) => void>()
    const onWindowError = (event: ErrorEvent) => {
      event.preventDefault()
      onError(event.error)
    }
    window.addEventListener('error', onWindowError)
    try {
      const cleanup = attachEventListener(target, 'click', () => {
        throw error
      })
      click(target)
      cleanup()
    } finally {
      window.removeEventListener('error', onWindowError)
    }
    expect(onError).toHaveBeenCalledWith(error)
  })
})

describe('attachEventListenerMap', () => {
  it('registers every listener and disposes them together', () => {
    const target = document.createElement('button')
    const onClick = vi.fn<(...args: Array<any>) => void>()
    const onKeyDown = vi.fn<(...args: Array<any>) => void>()

    const cleanup = attachEventListenerMap(target, { click: onClick, keydown: onKeyDown })
    click(target)
    target.dispatchEvent(new KeyboardEvent('keydown'))
    expect(onClick).toHaveBeenCalledOnce()
    expect(onKeyDown).toHaveBeenCalledOnce()

    cleanup()
    click(target)
    target.dispatchEvent(new KeyboardEvent('keydown'))
    expect(onClick).toHaveBeenCalledOnce()
    expect(onKeyDown).toHaveBeenCalledOnce()
  })

  it('skips undefined entries', () => {
    const target = document.createElement('button')
    const onClick = vi.fn<(...args: Array<any>) => void>()

    attachEventListenerMap(target, { click: onClick, keydown: undefined })
    click(target)
    target.dispatchEvent(new KeyboardEvent('keydown'))

    expect(onClick).toHaveBeenCalledOnce()
  })
})

describe('createEventListener', () => {
  it('stops calling the listener once its owner is disposed', () => {
    const target = document.createElement('button')
    const listener = vi.fn<(...args: Array<any>) => void>()

    createRoot((dispose) => {
      createEventListener(target, 'click', listener)
      click(target)
      expect(listener).toHaveBeenCalledOnce()
      dispose()
    })

    click(target)
    expect(listener).toHaveBeenCalledOnce()
  })

  it('honors capture when the listener sits on an ancestor', () => {
    const parent = document.createElement('div')
    const child = document.createElement('button')
    parent.append(child)
    const order: Array<string> = []

    createRoot((dispose) => {
      createEventListener(parent, 'click', () => order.push('parent'), true)
      child.addEventListener('click', () => order.push('child'))
      click(child)
      dispose()
    })

    expect(order).toEqual(['parent', 'child'])
  })

  it('detaches the previous target when the target changes', async () => {
    const first = document.createElement('button')
    const second = document.createElement('button')
    const listener = vi.fn<(...args: Array<any>) => void>()

    const lifecycle = createRoot((dispose) => {
      const [target, setTarget] = createSignal<HTMLElement | undefined>(first)
      createEffect(target, (element) => {
        return createEventListener(element, 'click', listener)
      })
      return { dispose, setTarget }
    })

    await Promise.resolve()
    click(first)
    expect(listener).toHaveBeenCalledTimes(1)

    flush(() => lifecycle.setTarget(second))
    await Promise.resolve()
    click(first)
    expect(listener).toHaveBeenCalledTimes(1)
    click(second)
    expect(listener).toHaveBeenCalledTimes(2)

    lifecycle.dispose()
  })

  it('dispatches the latest reactive state without duplicate registration', () => {
    const target = document.createElement('button')
    const seen: Array<string> = []

    createRoot((dispose) => {
      const [value, setValue] = createSignal('first', { ownedWrite: true })
      createEventListener(target, 'click', () => {
        seen.push(value())
      })
      click(target)
      flush(() => setValue('second'))
      click(target)
      expect(seen).toEqual(['first', 'second'])
      dispose()
    })
  })

  it('is safe to construct without a target', () => {
    expect(() => {
      createRoot((dispose) => {
        createEventListener(undefined, 'custom', () => {})
        dispose()
      })
    }).not.toThrow()
  })
})

describe('createEventListenerMap', () => {
  it('registers multiple listeners and removes them on cleanup', () => {
    const target = document.createElement('button')
    const onClick = vi.fn<(...args: Array<any>) => void>()
    const onFocusIn = vi.fn<(...args: Array<any>) => void>()

    createRoot((dispose) => {
      createEventListenerMap(target, { click: onClick, focusin: onFocusIn })
      click(target)
      target.dispatchEvent(new FocusEvent('focusin'))
      expect(onClick).toHaveBeenCalledOnce()
      expect(onFocusIn).toHaveBeenCalledOnce()
      dispose()
    })

    click(target)
    target.dispatchEvent(new FocusEvent('focusin'))
    expect(onClick).toHaveBeenCalledOnce()
    expect(onFocusIn).toHaveBeenCalledOnce()
  })

  it('per-event options override map-level options', () => {
    const target = document.createElement('div')
    const child = document.createElement('button')
    target.append(child)
    const order: Array<string> = []

    createRoot((dispose) => {
      createEventListenerMap(
        target,
        {
          click: [() => order.push('parent'), { capture: false }],
        },
        { capture: true },
      )
      child.addEventListener('click', () => order.push('child'))
      click(child)
      dispose()
    })

    expect(order).toEqual(['child', 'parent'])
  })

  it('handles a missing target gracefully', () => {
    expect(() => {
      createRoot((dispose) => {
        createEventListenerMap(undefined, { click: () => {} })
        dispose()
      })
    }).not.toThrow()
  })
})
