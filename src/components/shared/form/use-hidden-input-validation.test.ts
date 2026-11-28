import { createRoot, flush } from 'solid-js'
import { describe, expect, vi, it } from 'vitest'

import { useHiddenInputValidation } from './use-hidden-input-validation'
describe('useHiddenInputValidation', () => {
  it('initializes with nativeInvalid false', () => {
    const [{ nativeInvalid }, dispose] = createRoot((d) => [useHiddenInputValidation(), d] as const)
    expect(nativeInvalid()).toBe(false)
    dispose()
  })

  it('prevents default, marks nativeInvalid true, and focuses target on onInvalid', () => {
    const focus = vi.fn<(...args: Array<any>) => void>()
    const dummyTarget = { focus } as unknown as HTMLElement

    const [{ nativeInvalid, onInvalid }, dispose] = createRoot(
      (d) =>
        [
          useHiddenInputValidation({
            focusTarget: () => dummyTarget,
          }),
          d,
        ] as const,
    )

    const event = new Event('invalid', { cancelable: true })

    // @ts-expect-error test event call
    flush(() => onInvalid(event))

    expect(event.defaultPrevented).toBe(true)
    expect(nativeInvalid()).toBe(true)
    expect(focus).toHaveBeenCalledTimes(1)
    dispose()
  })

  it('resetNativeInvalid restores nativeInvalid to false', () => {
    const [{ nativeInvalid, onInvalid, resetNativeInvalid }, dispose] = createRoot(
      (d) => [useHiddenInputValidation(), d] as const,
    )

    const event = new Event('invalid', { cancelable: true })
    // @ts-expect-error test event call
    flush(() => onInvalid(event))

    expect(nativeInvalid()).toBe(true)

    flush(() => resetNativeInvalid())
    expect(nativeInvalid()).toBe(false)
    dispose()
  })
})
