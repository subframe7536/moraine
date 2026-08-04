import { createRoot } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import {
  createPointerGraceIntent,
  isPointInPointerGraceIntent,
  useOverlayMenuLayerState,
} from './menu.utils.ts'

function createRectElement(rect: {
  bottom: number
  left: number
  right: number
  top: number
}): HTMLElement {
  const element = {} as HTMLElement

  element.getBoundingClientRect = () =>
    ({
      ...rect,
      height: rect.bottom - rect.top,
      width: rect.right - rect.left,
      x: rect.left,
      y: rect.top,
      toJSON: () => ({}),
    }) as DOMRect

  return element
}

function installWindowStub(): () => void {
  const previousWindow = globalThis.window

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: globalThis,
    writable: true,
  })

  return () => {
    if (previousWindow === undefined) {
      Reflect.deleteProperty(globalThis, 'window')
      return
    }

    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: previousWindow,
      writable: true,
    })
  }
}

describe('createPointerGraceIntent', () => {
  test('keeps the right-side corridor between the leave point and submenu open', () => {
    const trigger = createRectElement({
      bottom: 120,
      left: 0,
      right: 50,
      top: 80,
    })
    const content = createRectElement({
      bottom: 200,
      left: 60,
      right: 140,
      top: 40,
    })

    const intent = createPointerGraceIntent('right-start', [50, 80], trigger, content)

    expect(isPointInPointerGraceIntent([55, 80], intent)).toBe(true)
    expect(isPointInPointerGraceIntent([80, 80], intent)).toBe(true)
    expect(isPointInPointerGraceIntent([10, 180], intent)).toBe(false)
  })

  test('does not clear the active grace timer when leaving another submenu trigger inside the safe area', () => {
    vi.useFakeTimers()
    const restoreWindow = installWindowStub()

    try {
      const firstTrigger = createRectElement({
        bottom: 120,
        left: 0,
        right: 50,
        top: 80,
      })
      const firstContent = createRectElement({
        bottom: 200,
        left: 60,
        right: 140,
        top: 40,
      })
      const pendingTarget = {} as HTMLElement
      const pendingPointerEnter = vi.fn()

      createRoot((dispose) => {
        const layer = useOverlayMenuLayerState()

        layer.queuePointerEnter(pendingTarget, pendingPointerEnter)
        layer.setPointerGraceIntent(
          createPointerGraceIntent('right-start', [50, 80], firstTrigger, firstContent),
        )

        vi.advanceTimersByTime(150)

        layer.setPointerGraceIntent(null, [80, 80])

        vi.advanceTimersByTime(149)
        expect(pendingPointerEnter).not.toHaveBeenCalled()

        vi.advanceTimersByTime(1)
        expect(pendingPointerEnter).toHaveBeenCalledTimes(1)

        dispose()
      })
    } finally {
      restoreWindow()
      vi.useRealTimers()
    }
  })

  test('does not restart the active grace timer when another submenu trigger updates it inside the safe area', () => {
    vi.useFakeTimers()
    const restoreWindow = installWindowStub()

    try {
      const firstTrigger = createRectElement({
        bottom: 120,
        left: 0,
        right: 50,
        top: 80,
      })
      const firstContent = createRectElement({
        bottom: 200,
        left: 60,
        right: 140,
        top: 40,
      })
      const secondTrigger = createRectElement({
        bottom: 170,
        left: 0,
        right: 50,
        top: 130,
      })
      const secondContent = createRectElement({
        bottom: 220,
        left: 60,
        right: 140,
        top: 120,
      })
      const pendingTarget = {} as HTMLElement
      const pendingPointerEnter = vi.fn()

      createRoot((dispose) => {
        const layer = useOverlayMenuLayerState()

        layer.queuePointerEnter(pendingTarget, pendingPointerEnter)
        layer.setPointerGraceIntent(
          createPointerGraceIntent('right-start', [50, 80], firstTrigger, firstContent),
        )

        vi.advanceTimersByTime(150)

        layer.setPointerGraceIntent(
          createPointerGraceIntent('right-start', [50, 130], secondTrigger, secondContent),
          [80, 80],
        )

        vi.advanceTimersByTime(149)
        expect(pendingPointerEnter).not.toHaveBeenCalled()

        vi.advanceTimersByTime(1)
        expect(pendingPointerEnter).toHaveBeenCalledTimes(1)

        dispose()
      })
    } finally {
      restoreWindow()
      vi.useRealTimers()
    }
  })
})
