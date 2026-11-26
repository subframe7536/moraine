import { createRoot, flush } from 'solid-js'
import { describe, expect, vi, it } from 'vitest'

import { useHiddenInputValidation } from './use-hidden-input-validation'
describe('useHiddenInputValidation', () => {
  it('initializes with nativeInvalid false', () => {
    createRoot((dispose) => {
      const { nativeInvalid } = useHiddenInputValidation()
      expect(nativeInvalid()).toBe(false)
      dispose()
    })
  })

  it('prevents default, marks nativeInvalid true, and focuses target on onInvalid', () => {
    createRoot((dispose) => {
      const focus = vi.fn<(...args: Array<any>) => void>()
      const dummyTarget = { focus } as unknown as HTMLElement

      const { nativeInvalid, onInvalid } = useHiddenInputValidation({
        focusTarget: () => dummyTarget,
      })

      const event = new Event('invalid', { cancelable: true })

      // @ts-expect-error test event call
      flush(() => onInvalid(event))

      expect(event.defaultPrevented).toBe(true)
      expect(nativeInvalid()).toBe(true)
      expect(focus).toHaveBeenCalledTimes(1)
      dispose()
    })
  })

  it('resetNativeInvalid restores nativeInvalid to false', () => {
    createRoot((dispose) => {
      const { nativeInvalid, onInvalid, resetNativeInvalid } = useHiddenInputValidation()

      const event = new Event('invalid', { cancelable: true })
      // @ts-expect-error test event call
      flush(() => onInvalid(event))

      expect(nativeInvalid()).toBe(true)

      flush(() => resetNativeInvalid())
      expect(nativeInvalid()).toBe(false)
      dispose()
    })
  })
})
