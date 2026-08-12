import type { Accessor } from 'solid-js'
import { createEffect, createMemo, untrack } from 'solid-js'

import type { ModelModifiers, ModifierValue } from '../../shared/input-modifiers.ts'
import { applyInputModifiers } from '../../shared/input-modifiers.ts'

type TextControlElement = HTMLInputElement | HTMLTextAreaElement
type TextControlValue = string | number | undefined

export interface UseTextControlValueOptions<
  TValue extends TextControlValue,
  M extends ModelModifiers | undefined,
> {
  defaultValue: Accessor<TValue>
  getElement: Accessor<TextControlElement | undefined>
  getFormValue: Accessor<unknown>
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

  createEffect(() => {
    const value = options.value()

    if (value !== undefined) {
      options.setFormValue(value)
    }
  })

  const valueProps = createMemo<{
    value?: TValue
    defaultValue?: TValue
  }>(() => {
    const controlledValue = options.value()
    if (controlledValue !== undefined) {
      return { value: controlledValue }
    }

    const formValue = options.getFormValue()
    if (formValue !== undefined) {
      return { value: formValue as TValue }
    }

    if (initialDefaultValue !== undefined) {
      return { value: initialDefaultValue, defaultValue: initialDefaultValue }
    }

    return {}
  })

  function applyValue(value: string): ModifierValue<M> {
    return applyInputModifiers<ModifierValue<M>>(value, options.modelModifiers())
  }

  function updateValue(value: string): void {
    const nextValue = applyValue(value)
    const controlledValue = options.value()

    if (controlledValue === undefined) {
      options.setFormValue(nextValue)
    }
    options.onValueChange()?.(nextValue)
    if (controlledValue !== undefined && Object.is(options.value(), controlledValue)) {
      options.setFormValue(controlledValue)
    }
  }

  function restoreControlledValue(): void {
    const value = options.value()
    const element = options.getElement()

    if (element && value !== undefined && options.shouldRestoreValue?.() !== false) {
      element.value = String(value)
    }
  }

  return {
    applyValue,
    initialDefaultValue,
    isLazy,
    restoreControlledValue,
    updateValue,
    valueProps,
  }
}
