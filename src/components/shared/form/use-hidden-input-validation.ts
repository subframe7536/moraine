import type { JSX } from '@solidjs/web'
import { createSignal } from 'solid-js'
import type { Accessor } from 'solid-js'

import { settle } from '../../../shared/utils'
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
  const [nativeInvalid, setNativeInvalid] = createSignal(false, { ownedWrite: true })
  const resetNativeInvalid = () => setNativeInvalid(false)

  const onInvalid: JSX.EventHandlerUnion<HTMLInputElement, Event> = (event) => {
    event.preventDefault()
    settle(() => setNativeInvalid(true))
    options?.focusTarget?.()?.focus()
  }

  return {
    nativeInvalid,
    resetNativeInvalid,
    onInvalid,
  }
}
