import type { Accessor } from 'solid-js'
import { createEffect, createMemo, createSignal, untrack } from 'solid-js'

import type { InputModifiers, ModifierValue } from '../../../shared/input-modifiers'
import { applyInputModifiers } from '../../../shared/input-modifiers'
type TextControlElement = HTMLInputElement | HTMLTextAreaElement
type TextControlValue = string | number | null

export interface UseTextControlValueOptions<
  TValue extends TextControlValue,
  TModifiers extends InputModifiers | undefined,
> {
  defaultValue: Accessor<TValue | undefined>
  getElement: Accessor<TextControlElement | undefined>
  getFormValue: Accessor<unknown>
  getFormPath?: Accessor<readonly (string | number)[] | undefined>
  modifiers: Accessor<TModifiers | undefined>
  onValueChange: Accessor<((value: ModifierValue<TModifiers>) => void) | undefined>
  setFormValue: (value: unknown) => void
  shouldRestoreValue?: Accessor<boolean>
  value: Accessor<TValue | undefined>
}

/** Shares controlled and uncontrolled value synchronization for native text controls. */
export function useTextControlValue<
  TValue extends TextControlValue,
  TModifiers extends InputModifiers | undefined,
>(options: UseTextControlValueOptions<TValue, TModifiers>) {
  const initialDefaultValue = untrack(options.defaultValue)
  const isLazy = createMemo(() => Boolean(options.modifiers()?.lazy))
  const [composing, setComposing] = createSignal(false)
  let compositionVersion = 0
  let preserveLazyCompositionDraft = false
  let lazyCompositionExternalValue: TValue | undefined

  createEffect(
    () => [options.value(), (() => options.getFormPath?.())()],
    ([value]) => {
      if (value !== undefined) {
        options.setFormValue(value)
      }
    },
  )

  function getExternalValue(): TValue | undefined {
    const controlledValue = options.value()
    if (controlledValue !== undefined) {
      return controlledValue
    }

    const formValue = options.getFormValue()
    if (formValue !== undefined) {
      return formValue as TValue
    }

    return undefined
  }

  const initialValue = untrack(() => {
    const externalValue = getExternalValue()
    return externalValue !== undefined ? externalValue : initialDefaultValue
  })
  const valueProps = createMemo<{
    value?: string | number
    defaultValue?: string | number
  }>(() => {
    const domValue = initialValue === null ? '' : initialValue
    if (options.value() !== undefined) {
      if (initialDefaultValue !== undefined) {
        return {
          value: domValue,
          defaultValue: initialDefaultValue === null ? '' : initialDefaultValue,
        }
      }

      return domValue !== undefined ? { value: domValue } : {}
    }

    if (initialDefaultValue !== undefined) {
      return { defaultValue: initialDefaultValue === null ? '' : initialDefaultValue }
    }

    return domValue !== undefined ? { defaultValue: domValue } : {}
  })

  function applyValue(value: string): ModifierValue<TModifiers> {
    return applyInputModifiers<ModifierValue<TModifiers>>(value, options.modifiers())
  }

  function updateValue(value: string): void {
    preserveLazyCompositionDraft = false
    const nextValue = applyValue(value)
    const controlledValue = options.value()

    options.onValueChange()?.(nextValue)
    if (controlledValue === undefined) {
      options.setFormValue(nextValue)
    }
    if (controlledValue !== undefined && Object.is(options.value(), controlledValue)) {
      options.setFormValue(controlledValue)
    }
  }

  function restoreValue(value: TValue | undefined): void {
    const element = options.getElement()

    if (element && value !== undefined && options.shouldRestoreValue?.() !== false) {
      element.value = String(value ?? '')
    }
  }

  function restoreControlledValue(): void {
    if (composing()) {
      return
    }

    restoreValue(options.value())
  }

  function onCompositionStart(): void {
    compositionVersion += 1
    if (isLazy()) {
      preserveLazyCompositionDraft = true
      lazyCompositionExternalValue = getExternalValue()
    }
    setComposing(true)
  }

  function onCompositionEnd(): void {
    const version = compositionVersion
    queueMicrotask(() => {
      if (compositionVersion === version) {
        setComposing(false)
      }
    })
  }

  createEffect(
    () => [options.value(), options.getFormValue(), composing(), isLazy()],
    ([controlledValue, formValue, isComposing, lazy]) => {
      if (!isComposing) {
        const externalValue =
          controlledValue !== undefined ? controlledValue : (formValue as TValue | undefined)
        const preserveDraft =
          lazy &&
          preserveLazyCompositionDraft &&
          Object.is(externalValue, lazyCompositionExternalValue)

        if (!preserveDraft) {
          preserveLazyCompositionDraft = false
          restoreValue(externalValue)
        }
      }
    },
  )

  return {
    applyValue,
    initialDefaultValue,
    isLazy,
    onCompositionEnd,
    onCompositionStart,
    restoreControlledValue,
    updateValue,
    valueProps,
  }
}
