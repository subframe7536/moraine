import { createRoot } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { useHiddenInputValidation } from './use-hidden-input-validation'

describe('useHiddenInputValidation', () => {
  test('initializes with nativeInvalid false', () => {
    createRoot((dispose) => {
      const { nativeInvalid } = useHiddenInputValidation()
      expect(nativeInvalid()).toBe(false)
      dispose()
    })
  })

  test('prevents default, marks nativeInvalid true, and focuses target on onInvalid', () => {
    createRoot((dispose) => {
      const focus = vi.fn()
      const dummyTarget = { focus } as unknown as HTMLElement

      const { nativeInvalid, onInvalid } = useHiddenInputValidation({
        focusTarget: () => dummyTarget,
      })

      const event = new Event('invalid', { cancelable: true })
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault')

      // @ts-expect-error test event call
      onInvalid(event)

      expect(preventDefaultSpy).toHaveBeenCalledTimes(1)
      expect(nativeInvalid()).toBe(true)
      expect(focus).toHaveBeenCalledTimes(1)
      dispose()
    })
  })

  test('supports function syntax for focus target', () => {
    createRoot((dispose) => {
      const focus = vi.fn()
      const dummyTarget = { focus } as unknown as HTMLElement

      const { nativeInvalid, onInvalid, resetNativeInvalid } = useHiddenInputValidation(
        () => dummyTarget,
      )

      const event = new Event('invalid', { cancelable: true })
      // @ts-expect-error test event call
      onInvalid(event)

      expect(nativeInvalid()).toBe(true)
      expect(focus).toHaveBeenCalledTimes(1)

      resetNativeInvalid()
      expect(nativeInvalid()).toBe(false)
      dispose()
    })
  })

  test('invokes custom onInvalid callback if provided', () => {
    createRoot((dispose) => {
      const customOnInvalid = vi.fn()
      const { onInvalid } = useHiddenInputValidation({
        onInvalid: customOnInvalid,
      })

      const event = new Event('invalid', { cancelable: true })
      // @ts-expect-error test event call
      onInvalid(event)

      expect(customOnInvalid).toHaveBeenCalledWith(event)
      dispose()
    })
  })
})
