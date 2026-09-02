import { createRoot } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { createTypeahead } from './typeahead'

describe('createTypeahead', () => {
  test('cycles repeated Unicode characters, skips disabled items, and resets after the timeout', () => {
    vi.useFakeTimers()
    const items = [
      { disabled: false, text: 'Ａlpha' },
      { disabled: true, text: 'Ａlternate' },
      { disabled: false, text: 'Another' },
    ]
    const onMatch = vi.fn()
    const dispose = createRoot((dispose) => {
      const typeahead = createTypeahead({
        getItems: () => items,
        getStartIndex: () => -1,
        getText: (item) => item.text,
        isDisabled: (item) => item.disabled,
        onMatch,
      })

      const first = new KeyboardEvent('keydown', { key: 'a', cancelable: true })
      const second = new KeyboardEvent('keydown', { key: 'ａ', cancelable: true })
      expect(typeahead.handleKeyDown(first)).toBe(true)
      expect(first.defaultPrevented).toBe(true)
      expect(typeahead.handleKeyDown(second)).toBe(true)

      vi.advanceTimersByTime(500)
      typeahead.handleKeyDown(new KeyboardEvent('keydown', { key: 'a', cancelable: true }))
      return dispose
    })

    expect(onMatch.mock.calls.map(([item]) => item.text)).toEqual(['Ａlpha', 'Another', 'Ａlpha'])
    dispose()
    vi.useRealTimers()
  })

  test('ignores modifiers and cleans pending timeouts on owner disposal', () => {
    vi.useFakeTimers()
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout')
    const dispose = createRoot((dispose) => {
      const typeahead = createTypeahead({
        getItems: () => [{ text: 'Alpha' }],
        getStartIndex: () => -1,
        getText: (item) => item.text,
        onMatch: () => undefined,
      })

      expect(
        typeahead.handleKeyDown(new KeyboardEvent('keydown', { ctrlKey: true, key: 'a' })),
      ).toBe(false)
      typeahead.handleKeyDown(new KeyboardEvent('keydown', { key: 'a' }))
      return dispose
    })

    dispose()
    expect(clearTimeoutSpy).toHaveBeenCalled()
    clearTimeoutSpy.mockRestore()
    vi.useRealTimers()
  })
})
