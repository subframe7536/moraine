import type { Accessor } from 'solid-js'
import { createEffect, createMemo, createSignal, on, untrack } from 'solid-js'

import type { ModelModifiers, ModifierValue } from '../../shared/input-modifiers'
import { applyInputModifiers } from '../../shared/input-modifiers'

type TextControlElement = HTMLInputElement | HTMLTextAreaElement
type TextControlValue = string | number | undefined

export interface UseTextControlValueOptions<
  TValue extends TextControlValue,
  M extends ModelModifiers | undefined,
> {
  defaultValue: Accessor<TValue>
  getElement: Accessor<TextControlElement | undefined>
  getFormValue: Accessor<unknown>
  getFormPath?: Accessor<readonly (string | number)[] | undefined>
  modelModifiers: Accessor<M | undefined>
  onValueChange: Accessor<((value: ModifierValue<M>) => void) | undefined>
  setFormValue: (value: unknown) => void
  shouldRestoreValue?: Accessor<boolean>
  value: Accessor<TValue>
}

/** Shares controlled and uncontrolled value synchronization for native text controls. */
export function useTextControlValue<
  TValue extends TextControlValue,
  M extends ModelModifiers | undefined,
>(options: UseTextControlValueOptions<TValue, M>) {
  const initialDefaultValue = untrack(options.defaultValue)
  const isLazy = createMemo(() => Boolean(options.modelModifiers()?.lazy))
  const [composing, setComposing] = createSignal(false)
  let compositionVersion = 0
  let preserveLazyCompositionDraft = false
  let lazyCompositionExternalValue: TValue | undefined

  createEffect(
    on([options.value, () => options.getFormPath?.()], ([value]) => {
      if (value !== undefined) {
        options.setFormValue(value)
      }
    }),
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

  const initialValue = untrack(() => getExternalValue() ?? initialDefaultValue)
  const valueProps = createMemo<{
    value?: TValue
    defaultValue?: TValue
  }>(() => {
    if (initialDefaultValue !== undefined) {
      return { value: initialValue, defaultValue: initialDefaultValue }
    }

    return initialValue !== undefined ? { value: initialValue } : {}
  })

  function applyValue(value: string): ModifierValue<M> {
    return applyInputModifiers<ModifierValue<M>>(value, options.modelModifiers())
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
      element.value = String(value)
    }
  }

  function restoreControlledValue(): void {
    if (composing()) {
      return
    }

    restoreValue(getExternalValue())
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
    on(
      [options.value, options.getFormValue, composing, isLazy],
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
    ),
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
