import { afterEach, describe, expect, vi, it } from 'vitest'

import { createCompositionState } from './composition'
afterEach(() => {
  vi.useRealTimers()
})

describe('createCompositionState', () => {
  it('keeps the composition guard through the Safari composition-end Escape ordering', () => {
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
