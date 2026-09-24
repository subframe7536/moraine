import { afterEach, describe, expect, test, vi } from 'vitest'

import {
  createCompositionState,
  createOutsidePressHandlers,
  getFocusableElements,
  getTransformOrigin,
} from './utils'

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

describe('createCompositionState', () => {
  test('keeps the composition guard through the Safari composition-end Escape ordering', () => {
    vi.useFakeTimers()
    const state = createCompositionState()

    state.onCompositionStart()
    state.onCompositionEnd()
    expect(state.isComposing()).toBe(true)

    vi.advanceTimersByTime(99)
    expect(state.isComposing()).toBe(true)
    vi.advanceTimersByTime(1)
    expect(state.isComposing()).toBe(false)

    state.onCompositionStart()
    state.onCompositionEnd()
    state.dispose()
    vi.advanceTimersByTime(100)
    expect(state.isComposing()).toBe(false)
  })
})

describe('getFocusableElements', () => {
  test('uses native disabled, details, and radio-group tab rules', () => {
    const container = document.createElement('div')
    container.innerHTML = `
      <fieldset disabled>
        <legend><button id="legend">Legend</button></legend>
        <input id="fieldset-input" />
      </fieldset>
      <details>
        <summary id="summary">Summary <a id="summary-link" href="/help">Help</a></summary>
        <button id="details-button">Hidden</button>
      </details>
      <input id="first-radio" type="radio" name="unchecked" />
      <input id="second-radio" type="radio" name="unchecked" />
      <input id="unchecked-radio" type="radio" name="checked" />
      <input id="checked-radio" type="radio" name="checked" checked />
    `
    document.body.append(container)

    expect(getFocusableElements(container).map((element) => element.id)).toEqual([
      'legend',
      'summary',
      'summary-link',
      'first-radio',
      'checked-radio',
    ])

    container.remove()
  })

  test('traverses open shadow roots and excludes inert slotted ancestors', () => {
    const container = document.createElement('div')
    const host = document.createElement('div')
    const slottedButton = document.createElement('button')
    const shadowRoot = host.attachShadow({ mode: 'open' })
    shadowRoot.append(document.createElement('slot'))
    host.append(slottedButton)
    container.append(host)
    document.body.append(container)

    expect(getFocusableElements(container)).toEqual([slottedButton])

    host.setAttribute('inert', '')
    expect(getFocusableElements(container)).toEqual([])

    container.remove()
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
