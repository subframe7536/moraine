import { afterEach, describe, expect, test, vi } from 'vitest'

import { createOutsidePressHandlers, getTransformOrigin } from './utils'

function pointerEvent(pointerId: number): PointerEvent {
  return {
    button: 0,
    clientX: 0,
    clientY: 0,
    ctrlKey: false,
    defaultPrevented: false,
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

describe('getTransformOrigin', () => {
  const geometry = {
    gutter: 8,
    reference: { height: 20, width: 50, x: 100, y: 20 },
    x: 100,
    y: 48,
  }

  test('uses the aligned edge until collision shift breaks it', () => {
    expect(getTransformOrigin('bottom-start', 'ltr', geometry)).toBe('0% -8px')
    expect(getTransformOrigin('bottom-start', 'rtl', geometry)).toBe('100% -8px')
    expect(getTransformOrigin('bottom-start', 'ltr', { ...geometry, shift: { x: 2 } })).toBe(
      '25px -8px',
    )
  })

  test('uses the anchor center on the side axis when overlap shifts the popup', () => {
    expect(
      getTransformOrigin('bottom', 'ltr', {
        ...geometry,
        overlap: true,
        shift: { y: 12 },
      }),
    ).toBe('25px -18px')
    expect(getTransformOrigin('right-end', 'ltr', geometry)).toBe('-8px 100%')
  })
})
