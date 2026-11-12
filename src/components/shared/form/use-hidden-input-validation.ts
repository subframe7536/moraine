import { createSignal } from 'solid-js'
import type { Accessor, JSX } from 'solid-js'

export interface UseHiddenInputValidationOptions {
  focusTarget?: () => HTMLElement | undefined | null
  onInvalid?: (event: Event) => void
}

export interface UseHiddenInputValidationReturn {
  nativeInvalid: Accessor<boolean>
  setNativeInvalid: (value: boolean) => void
  resetNativeInvalid: () => void
  onInvalid: JSX.EventHandlerUnion<HTMLInputElement, Event>
}

export function useHiddenInputValidation(
  options?: UseHiddenInputValidationOptions | (() => HTMLElement | undefined | null),
): UseHiddenInputValidationReturn {
  const [nativeInvalid, setNativeInvalid] = createSignal(false)
  const resetNativeInvalid = () => setNativeInvalid(false)

  const onInvalid: JSX.EventHandlerUnion<HTMLInputElement, Event> = (event) => {
    event.preventDefault()
    setNativeInvalid(true)
    const target = typeof options === 'function' ? options() : options?.focusTarget?.()
    target?.focus()
    if (typeof options === 'object' && options?.onInvalid) {
      options.onInvalid(event)
    }
  }

  return {
    nativeInvalid,
    setNativeInvalid,
    resetNativeInvalid,
    onInvalid,
  }
}
