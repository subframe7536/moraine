import { createSignal } from 'solid-js'
import type { Accessor, JSX } from 'solid-js'

export interface UseHiddenInputValidationOptions {
  focusTarget?: () => HTMLElement | undefined | null
}

export interface UseHiddenInputValidationReturn {
  nativeInvalid: Accessor<boolean>
  resetNativeInvalid: () => void
  onInvalid: JSX.EventHandlerUnion<HTMLInputElement, Event>
}

export function useHiddenInputValidation(
  options?: UseHiddenInputValidationOptions,
): UseHiddenInputValidationReturn {
  const [nativeInvalid, setNativeInvalid] = createSignal(false)
  const resetNativeInvalid = () => setNativeInvalid(false)

  const onInvalid: JSX.EventHandlerUnion<HTMLInputElement, Event> = (event) => {
    event.preventDefault()
    setNativeInvalid(true)
    options?.focusTarget?.()?.focus()
  }

  return {
    nativeInvalid,
    resetNativeInvalid,
    onInvalid,
  }
}
