import { afterEach, describe, expect, test, vi } from 'vitest'

import { createOutsidePressHandlers } from './outside-press'

function pointerEvent(pointerId: number, defaultPrevented = false): PointerEvent {
  return {
    button: 0,
    clientX: 0,
    clientY: 0,
    ctrlKey: false,
    defaultPrevented,
    pointerId,
    pointerType: 'touch',
    target: document.body,
  } as unknown as PointerEvent
}

afterEach(() => {
  vi.useRealTimers()
})

describe('createOutsidePressHandlers', () => {
  test('disposes pending taps without allowing a later pointerup to dismiss', () => {
    vi.useFakeTimers()
    const onPress = vi.fn()
    const handlers = createOutsidePressHandlers({
      isEnabled: () => true,
      isInside: () => false,
      onPress,
    })

    handlers.pointerdown(pointerEvent(1))
    expect(vi.getTimerCount()).toBe(1)

    handlers.dispose()
    handlers.pointerup(pointerEvent(1))

    expect(vi.getTimerCount()).toBe(0)
    expect(onPress).not.toHaveBeenCalled()
  })

  test('ignores cancelled touch presses without poisoning the next tap', () => {
    vi.useFakeTimers()
    const onPress = vi.fn()
    const handlers = createOutsidePressHandlers({
      isEnabled: () => true,
      isInside: () => false,
      onPress,
    })

    handlers.pointerdown(pointerEvent(1, true))
    expect(vi.getTimerCount()).toBe(0)

    handlers.pointerdown(pointerEvent(2))
    handlers.pointerup(pointerEvent(2))

    expect(onPress).toHaveBeenCalledTimes(1)
  })

  test('does not let a replaced pointer timeout clear the newer press', () => {
    vi.useFakeTimers()
    const onPress = vi.fn()
    const handlers = createOutsidePressHandlers({
      isEnabled: () => true,
      isInside: () => false,
      onPress,
    })

    handlers.pointerdown(pointerEvent(1))
    vi.advanceTimersByTime(500)
    handlers.pointerdown(pointerEvent(1))
    vi.advanceTimersByTime(500)
    handlers.pointerup(pointerEvent(1))

    expect(onPress).toHaveBeenCalledTimes(1)
  })
})
