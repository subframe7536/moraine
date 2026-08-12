import { createRoot } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import {
  createPointerGraceIntent,
  isPointInPointerGraceIntent,
  onLayerKeyDown,
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

describe('onLayerKeyDown', () => {
  test('does not close the menu for Escape emitted during IME composition', () => {
    const onClose = vi.fn()

    createRoot((dispose) => {
      const layer = useOverlayMenuLayerState()
      const event = new KeyboardEvent('keydown', {
        cancelable: true,
        isComposing: true,
        key: 'Escape',
      })

      onLayerKeyDown(event, layer, onClose)

      expect(event.defaultPrevented).toBe(false)
      expect(onClose).not.toHaveBeenCalled()
      dispose()
    })
  })
})

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

describe('useOverlayMenuLayerState', () => {
  test('normalizes and cycles typeahead while skipping disabled items', () => {
    vi.useFakeTimers()
    const elements = ['Banana', 'Blueberry', 'Bravo', 'Open file'].map((label) => {
      const element = document.createElement('div')
      element.textContent = label
      element.tabIndex = -1
      document.body.append(element)
      return element
    })

    try {
      createRoot((dispose) => {
        const layer = useOverlayMenuLayerState()
        const releases = elements.map((element, index) =>
          layer.registerItem({
            disabled: () => index === 1,
            element: () => element,
            hasSubmenu: false,
            id: `item-${index}`,
            textValue: () => element.textContent ?? undefined,
          }),
        )
        const press = (key: string): KeyboardEvent => {
          const event = new KeyboardEvent('keydown', { cancelable: true, key })
          layer.handleTypeaheadKeyDown(event)
          return event
        }

        expect(press('B').defaultPrevented).toBe(true)
        expect(document.activeElement).toBe(elements[0])

        press('B')
        expect(document.activeElement).toBe(elements[2])

        vi.advanceTimersByTime(500)
        press('O')
        expect(document.activeElement).toBe(elements[3])
        expect(press(' ').defaultPrevented).toBe(true)
        expect(document.activeElement).toBe(elements[3])

        vi.advanceTimersByTime(500)
        expect(press(' ').defaultPrevented).toBe(false)

        for (const release of releases) {
          release()
        }
        dispose()
      })
    } finally {
      for (const element of elements) {
        element.remove()
      }
      vi.useRealTimers()
    }
  })

  test('recovers navigation after the highlighted item is removed and handles all-disabled lists', () => {
    const first = document.createElement('div')
    const second = document.createElement('div')
    const disabled = document.createElement('div')
    first.tabIndex = -1
    second.tabIndex = -1
    disabled.tabIndex = -1
    document.body.append(first, second, disabled)

    try {
      createRoot((dispose) => {
        const layer = useOverlayMenuLayerState()
        const releaseFirst = layer.registerItem({
          disabled: () => false,
          element: () => first,
          hasSubmenu: false,
          id: 'first',
          textValue: () => 'First',
        })
        const releaseSecond = layer.registerItem({
          disabled: () => false,
          element: () => second,
          hasSubmenu: false,
          id: 'second',
          textValue: () => 'Second',
        })

        layer.focusFirstItem()
        expect(document.activeElement).toBe(first)
        releaseFirst()
        expect(layer.highlightedItemId()).toBeUndefined()

        layer.focusItemByOffset(1)
        expect(document.activeElement).toBe(second)
        releaseSecond()

        const releaseDisabled = layer.registerItem({
          disabled: () => true,
          element: () => disabled,
          hasSubmenu: false,
          id: 'disabled',
          textValue: () => 'Disabled',
        })
        layer.focusFirstItem()
        expect(layer.highlightedItemId()).toBeUndefined()

        releaseDisabled()
        dispose()
      })
    } finally {
      first.remove()
      second.remove()
      disabled.remove()
    }
  })
})
