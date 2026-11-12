import { createEffect, createRoot, createSignal, on } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

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
  test('returns a noop cleanup when target is missing', () => {
    expect(() => {
      attachEventListener(undefined, 'click', () => {})()
    }).not.toThrow()
  })

  test('listens until the returned cleanup runs', () => {
    const target = document.createElement('button')
    const listener = vi.fn()

    const cleanup = attachEventListener(target, 'click', listener)
    click(target)
    expect(listener).toHaveBeenCalledOnce()

    cleanup()
    click(target)
    expect(listener).toHaveBeenCalledOnce()
  })

  test('honors the once option', () => {
    const target = document.createElement('button')
    const listener = vi.fn()

    attachEventListener(target, 'click', listener, { once: true })
    click(target)
    click(target)

    expect(listener).toHaveBeenCalledOnce()
  })
})

describe('attachEventListenerMap', () => {
  test('registers every listener and disposes them together', () => {
    const target = document.createElement('button')
    const onClick = vi.fn()
    const onKeyDown = vi.fn()

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

  test('skips undefined entries', () => {
    const target = document.createElement('button')
    const onClick = vi.fn()

    attachEventListenerMap(target, { click: onClick, keydown: undefined })
    click(target)
    target.dispatchEvent(new KeyboardEvent('keydown'))

    expect(onClick).toHaveBeenCalledOnce()
  })
})

describe('createEventListener', () => {
  test('stops calling the listener once its owner is disposed', () => {
    const target = document.createElement('button')
    const listener = vi.fn()

    createRoot((dispose) => {
      createEventListener(target, 'click', listener)
      click(target)
      expect(listener).toHaveBeenCalledOnce()
      dispose()
    })

    click(target)
    expect(listener).toHaveBeenCalledOnce()
  })

  test('honors capture when the listener sits on an ancestor', () => {
    const parent = document.createElement('div')
    const child = document.createElement('button')
    parent.append(child)
    const order: string[] = []

    createRoot((dispose) => {
      createEventListener(parent, 'click', () => order.push('parent'), true)
      child.addEventListener('click', () => order.push('child'))
      click(child)
      dispose()
    })

    expect(order).toEqual(['parent', 'child'])
  })

  test('detaches the previous target when the target changes', async () => {
    const first = document.createElement('button')
    const second = document.createElement('button')
    const listener = vi.fn()

    const lifecycle = createRoot((dispose) => {
      const [target, setTarget] = createSignal<HTMLElement | undefined>(first)
      createEffect(
        on(target, (element) => {
          createEventListener(element, 'click', listener)
        }),
      )
      return { dispose, setTarget }
    })

    await Promise.resolve()
    click(first)
    expect(listener).toHaveBeenCalledTimes(1)

    lifecycle.setTarget(second)
    click(first)
    expect(listener).toHaveBeenCalledTimes(1)
    click(second)
    expect(listener).toHaveBeenCalledTimes(2)

    lifecycle.dispose()
  })

  test('dispatches the latest reactive state without duplicate registration', () => {
    const target = document.createElement('button')
    const seen: string[] = []

    createRoot((dispose) => {
      const [value, setValue] = createSignal('first')
      createEventListener(target, 'click', () => {
        seen.push(value())
      })
      click(target)
      setValue('second')
      click(target)
      expect(seen).toEqual(['first', 'second'])
      dispose()
    })
  })

  test('is safe to construct without a target', () => {
    expect(() => {
      createRoot((dispose) => {
        createEventListener(undefined, 'custom', () => {})
        dispose()
      })
    }).not.toThrow()
  })
})

describe('createEventListenerMap', () => {
  test('registers multiple listeners and removes them on cleanup', () => {
    const target = document.createElement('button')
    const onClick = vi.fn()
    const onFocusIn = vi.fn()

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

  test('per-event options override map-level options', () => {
    const target = document.createElement('div')
    const child = document.createElement('button')
    target.append(child)
    const order: string[] = []

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

  test('handles a missing target gracefully', () => {
    expect(() => {
      createRoot((dispose) => {
        createEventListenerMap(undefined, { click: () => {} })
        dispose()
      })
    }).not.toThrow()
  })
})
