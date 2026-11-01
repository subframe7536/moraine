import { describe, expect, test, vi } from 'vitest'

import { createKeyDownHandler, createKeyUpHandler, isComposingKeyboardEvent } from './keyboard'

function createMockKeyboardEvent(key: string, init: Partial<KeyboardEvent> = {}): KeyboardEvent {
  return {
    key,
    repeat: false,
    preventDefault: vi.fn(function (this: KeyboardEvent) {
      Object.defineProperty(this, 'defaultPrevented', { value: true, configurable: true })
    }),
    ...init,
  } as unknown as KeyboardEvent
}

function createHost(): { element: HTMLElement; eventInit: Partial<KeyboardEvent> } {
  const element = document.createElement('button')
  document.body.appendChild(element)
  return { element, eventInit: { currentTarget: element, target: element } }
}

describe('isComposingKeyboardEvent', () => {
  test.each([[{ isComposing: true }], [{ keyCode: 229 }], [{ which: 229 }]])(
    'detects composition from %j',
    (init) => {
      expect(isComposingKeyboardEvent(createMockKeyboardEvent('Enter', init))).toBe(true)
    },
  )

  test('returns false for a plain event', () => {
    expect(isComposingKeyboardEvent(createMockKeyboardEvent('Enter'))).toBe(false)
  })
})

describe('createKeyDownHandler', () => {
  test('dispatches a literal key binding with automatic preventDefault', () => {
    const { eventInit } = createHost()
    const handle = vi.fn()
    const onKeyDown = createKeyDownHandler({ keys: { Enter: handle } })

    const event = createMockKeyboardEvent('Enter', eventInit)
    onKeyDown(event)

    expect(event.preventDefault).toHaveBeenCalled()
    expect(handle).toHaveBeenCalledWith(event)
  })

  test('forwards the user handler first and stops when it prevents', () => {
    const { eventInit } = createHost()
    const handle = vi.fn()
    const user = vi.fn((event: KeyboardEvent) => event.preventDefault())
    const onKeyDown = createKeyDownHandler({
      onKeyDown: () => user,
      keys: { Enter: handle },
    })

    onKeyDown(createMockKeyboardEvent('Enter', eventInit))

    expect(user).toHaveBeenCalledOnce()
    expect(handle).not.toHaveBeenCalled()
  })

  test('supports array-form user handlers', () => {
    const { eventInit } = createHost()
    const user = vi.fn()
    const onKeyDown = createKeyDownHandler({
      onKeyDown: () => [user, 'data'],
      keys: { Enter: vi.fn() },
    })

    onKeyDown(createMockKeyboardEvent('Enter', eventInit))

    expect(user).toHaveBeenCalledWith('data', expect.anything())
  })

  test('stops on an already-prevented event', () => {
    const handle = vi.fn()
    const onKeyDown = createKeyDownHandler({ keys: { Enter: handle } })
    const event = createMockKeyboardEvent('Enter')
    Object.defineProperty(event, 'defaultPrevented', { value: true })

    onKeyDown(event)

    expect(handle).not.toHaveBeenCalled()
  })

  test('disabled skips the dispatch', () => {
    const handle = vi.fn()
    const onKeyDown = createKeyDownHandler({ disabled: () => true, keys: { Enter: handle } })

    onKeyDown(createMockKeyboardEvent('Enter'))

    expect(handle).not.toHaveBeenCalled()
  })

  test.each([[{ isComposing: true }], [{ keyCode: 229 }], [{ which: 229 }]])(
    'skips events during composition %j',
    (init) => {
      const handle = vi.fn()
      const onKeyDown = createKeyDownHandler({ keys: { Enter: handle } })

      onKeyDown(createMockKeyboardEvent('Enter', init))

      expect(handle).not.toHaveBeenCalled()
    },
  )

  test('composing accessor adds external composition state', () => {
    const handle = vi.fn()
    const onKeyDown = createKeyDownHandler({ composing: () => true, keys: { Enter: handle } })

    onKeyDown(createMockKeyboardEvent('Enter'))

    expect(handle).not.toHaveBeenCalled()
  })

  test('skipRepeat ignores auto-repeated events', () => {
    const handle = vi.fn()
    const onKeyDown = createKeyDownHandler({ skipRepeat: true, keys: { Enter: handle } })

    onKeyDown(createMockKeyboardEvent('Enter', { repeat: true }))

    expect(handle).not.toHaveBeenCalled()
  })

  test('currentTargetOnly requires the event to hit the host itself', () => {
    const { element } = createHost()
    const handle = vi.fn()
    const onKeyDown = createKeyDownHandler({ currentTargetOnly: true, keys: { Enter: handle } })

    onKeyDown(
      createMockKeyboardEvent('Enter', {
        currentTarget: element,
        target: document.createElement('span'),
      }),
    )

    expect(handle).not.toHaveBeenCalled()
  })

  test('ignoreModifiers skips events with a listed modifier', () => {
    const handle = vi.fn()
    const onKeyDown = createKeyDownHandler({
      ignoreModifiers: ['alt', 'ctrl'],
      keys: { a: handle, Enter: handle },
    })

    onKeyDown(createMockKeyboardEvent('a', { ctrlKey: true }))
    onKeyDown(createMockKeyboardEvent('Enter', { altKey: true }))
    expect(handle).not.toHaveBeenCalled()

    onKeyDown(createMockKeyboardEvent('a', { shiftKey: true }))
    expect(handle).toHaveBeenCalledOnce()
  })

  test("normalizes 'Spacebar' to ' '", () => {
    const handle = vi.fn()
    const onKeyDown = createKeyDownHandler({ keys: { ' ': handle } })

    const event = createMockKeyboardEvent('Spacebar')
    onKeyDown(event)

    expect(handle).toHaveBeenCalledOnce()
    expect(event.preventDefault).toHaveBeenCalled()
  })

  test('preventDefault: false keeps native default', () => {
    const handle = vi.fn()
    const onKeyDown = createKeyDownHandler({
      keys: { Enter: { handle, preventDefault: false } },
    })

    const event = createMockKeyboardEvent('Enter')
    onKeyDown(event)

    expect(handle).toHaveBeenCalledOnce()
    expect(event.preventDefault).not.toHaveBeenCalled()
  })

  test('when falling back to onUnhandled when the guard fails', () => {
    const handle = vi.fn()
    const onUnhandled = vi.fn()
    const onKeyDown = createKeyDownHandler({
      keys: { a: { handle, when: (event) => event.ctrlKey } },
      onUnhandled,
    })

    onKeyDown(createMockKeyboardEvent('a'))
    expect(handle).not.toHaveBeenCalled()
    expect(onUnhandled).toHaveBeenCalledOnce()

    onKeyDown(createMockKeyboardEvent('a', { ctrlKey: true }))
    expect(handle).toHaveBeenCalledOnce()
    expect(onUnhandled).toHaveBeenCalledOnce()
  })

  test('ignore swallows keys without preventDefault or onUnhandled', () => {
    const onUnhandled = vi.fn()
    const onKeyDown = createKeyDownHandler({ ignore: [' ', 'Home'], onUnhandled })

    const space = createMockKeyboardEvent(' ')
    onKeyDown(space)
    expect(space.preventDefault).not.toHaveBeenCalled()

    onKeyDown(createMockKeyboardEvent('Home'))
    expect(onUnhandled).not.toHaveBeenCalled()
  })

  test('onUnhandled receives unmatched keys after guards', () => {
    const onUnhandled = vi.fn()
    const onKeyDown = createKeyDownHandler({ keys: { Enter: vi.fn() }, onUnhandled })

    onKeyDown(createMockKeyboardEvent('x'))
    expect(onUnhandled).toHaveBeenCalledOnce()
  })

  test('keys may be computed per event', () => {
    const handle = vi.fn()
    const dynamic = vi.fn(() => ({ x: handle }))
    const onKeyDown = createKeyDownHandler({ keys: dynamic })

    const event = createMockKeyboardEvent('x')
    onKeyDown(event)

    expect(dynamic).toHaveBeenCalledWith(event)
    expect(handle).toHaveBeenCalledOnce()
  })

  test('forwarded args reach bindings and onUnhandled', () => {
    const handle = vi.fn()
    const onUnhandled = vi.fn()
    const onKeyDown = createKeyDownHandler<HTMLElement, [string, number]>({
      keys: { Enter: handle },
      onUnhandled,
    })

    const event = createMockKeyboardEvent('Enter')
    onKeyDown(event, 'item-1', 7)

    expect(handle).toHaveBeenCalledWith(event, 'item-1', 7)

    onKeyDown(createMockKeyboardEvent('x'), 'item-2', 8)
    expect(onUnhandled).toHaveBeenCalledWith(expect.anything(), 'item-2', 8)
  })
})

describe('createKeyDownHandler logical aliases', () => {
  function dispatch(key: string, options: Parameters<typeof createKeyDownHandler>[0]) {
    const handle = vi.fn()
    const onUnhandled = vi.fn()
    const onKeyDown = createKeyDownHandler({
      ...options,
      keys: (event, ...args) => ({
        ...(typeof options.keys === 'function' ? options.keys(event, ...args) : options.keys),
        alias: handle,
      }),
      onUnhandled,
    })
    const event = createMockKeyboardEvent(key)
    onKeyDown(event)
    return { event, handle, onUnhandled }
  }

  test('next/previous follow a horizontal axis', () => {
    const right = dispatch('ArrowRight', { keys: { next: undefined } })
    const left = dispatch('ArrowLeft', { keys: { previous: undefined } })
    expect(right.handle).not.toHaveBeenCalled()
    expect(right.onUnhandled).toHaveBeenCalledOnce()
    expect(left.onUnhandled).toHaveBeenCalledOnce()
  })

  test('next/previous resolve ArrowRight/ArrowLeft on horizontal ltr', () => {
    const next = vi.fn()
    const previous = vi.fn()
    const onKeyDown = createKeyDownHandler({ keys: { next, previous } })

    onKeyDown(createMockKeyboardEvent('ArrowRight'))
    onKeyDown(createMockKeyboardEvent('ArrowLeft'))

    expect(next).toHaveBeenCalledOnce()
    expect(previous).toHaveBeenCalledOnce()
  })

  test('horizontal rtl flips next/previous', () => {
    const next = vi.fn()
    const previous = vi.fn()
    const onKeyDown = createKeyDownHandler({
      direction: () => 'rtl',
      keys: { next, previous },
    })

    onKeyDown(createMockKeyboardEvent('ArrowLeft'))
    onKeyDown(createMockKeyboardEvent('ArrowRight'))

    expect(next).toHaveBeenCalledOnce()
    expect(previous).toHaveBeenCalledOnce()
  })

  test('next/previous resolve ArrowDown/ArrowUp on vertical', () => {
    const next = vi.fn()
    const previous = vi.fn()
    const onKeyDown = createKeyDownHandler({
      orientation: () => 'vertical',
      keys: { next, previous },
    })

    onKeyDown(createMockKeyboardEvent('ArrowDown'))
    onKeyDown(createMockKeyboardEvent('ArrowUp'))

    expect(next).toHaveBeenCalledOnce()
    expect(previous).toHaveBeenCalledOnce()
  })

  test('forward/backward resolve inline arrows regardless of orientation', () => {
    const forward = vi.fn()
    const backward = vi.fn()
    const onKeyDown = createKeyDownHandler({
      orientation: () => 'vertical',
      keys: { forward, backward },
    })

    onKeyDown(createMockKeyboardEvent('ArrowRight'))
    onKeyDown(createMockKeyboardEvent('ArrowLeft'))

    expect(forward).toHaveBeenCalledOnce()
    expect(backward).toHaveBeenCalledOnce()
  })

  test('rtl flips forward/backward', () => {
    const forward = vi.fn()
    const backward = vi.fn()
    const onKeyDown = createKeyDownHandler({
      direction: () => 'rtl',
      keys: { forward, backward },
    })

    onKeyDown(createMockKeyboardEvent('ArrowLeft'))
    onKeyDown(createMockKeyboardEvent('ArrowRight'))

    expect(forward).toHaveBeenCalledOnce()
    expect(backward).toHaveBeenCalledOnce()
  })

  test('open/close resolve ArrowDown/ArrowUp on horizontal', () => {
    const open = vi.fn()
    const close = vi.fn()
    const onKeyDown = createKeyDownHandler({ keys: { open, close } })

    onKeyDown(createMockKeyboardEvent('ArrowDown'))
    onKeyDown(createMockKeyboardEvent('ArrowUp'))

    expect(open).toHaveBeenCalledOnce()
    expect(close).toHaveBeenCalledOnce()
  })

  test('open/close resolve forward/backward arrows on vertical', () => {
    const open = vi.fn()
    const close = vi.fn()
    const onKeyDown = createKeyDownHandler({
      orientation: () => 'vertical',
      keys: { open, close },
    })

    onKeyDown(createMockKeyboardEvent('ArrowRight'))
    onKeyDown(createMockKeyboardEvent('ArrowLeft'))

    expect(open).toHaveBeenCalledOnce()
    expect(close).toHaveBeenCalledOnce()
  })

  test('a literal binding wins over an alias', () => {
    const literal = vi.fn()
    const alias = vi.fn()
    const onKeyDown = createKeyDownHandler({ keys: { ArrowRight: literal, next: alias } })

    onKeyDown(createMockKeyboardEvent('ArrowRight'))

    expect(literal).toHaveBeenCalledOnce()
    expect(alias).not.toHaveBeenCalled()
  })

  test('direction falls back to the host computed direction', () => {
    const element = document.createElement('div')
    element.dir = 'rtl'
    document.body.appendChild(element)
    const next = vi.fn()
    const onKeyDown = createKeyDownHandler({ keys: { next } })

    onKeyDown(createMockKeyboardEvent('ArrowLeft', { currentTarget: element, target: element }))

    expect(next).toHaveBeenCalledOnce()
    document.body.removeChild(element)
  })
})

describe('createKeyUpHandler', () => {
  test('dispatches keyup bindings and forwards the user handler', () => {
    const release = vi.fn()
    const user = vi.fn()
    const onKeyUp = createKeyUpHandler({
      onKeyUp: () => user,
      keys: { ' ': release },
    })

    const event = createMockKeyboardEvent(' ')
    onKeyUp(event)

    expect(user).toHaveBeenCalledOnce()
    expect(event.preventDefault).toHaveBeenCalled()
    expect(release).toHaveBeenCalledOnce()
  })
})
