import type { Accessor } from 'solid-js'
import { createEffect, createMemo, createSignal, untrack } from 'solid-js'

import type { UseFormFieldReturn } from '../../field/field-context'
export interface UseFormValueOptions<T> {
  value?: Accessor<T | undefined>
  defaultValue?: Accessor<T | undefined>
  onValueChange?: (value: T) => void
  field?: UseFormFieldReturn
  isEqual?: (a: T, b: T) => boolean
}

/**
 * Manages controlled vs uncontrolled value state and coordinates Field synchronization.
 */
export function useFormValue<T>(
  options: UseFormValueOptions<T>,
): readonly [
  value: Accessor<T>,
  setValue: (update: T | ((previous: T) => T)) => void,
  reset: () => void,
] {
  const initialDefaultValue = untrack(() => options.defaultValue?.()) as T
  const [uncontrolledValue, setUncontrolledValue] = createSignal<T>(
    (typeof initialDefaultValue === 'function'
      ? () => initialDefaultValue
      : initialDefaultValue) as never,
  )

  const controlledValue = createMemo(() => {
    const controlled = options.value?.()
    if (controlled !== undefined) {
      return controlled
    }

    const formValue = options.field?.value()
    if (formValue !== undefined) {
      return formValue as T
    }

    return undefined
  })

  const value = createMemo<T>(() => {
    const controlled = controlledValue()
    return controlled === undefined ? uncontrolledValue() : controlled
  })

  // Synchronize external controlled updates and restore Field store when controlled
  createEffect(
    () => [options.value?.(), options.field?.value()],
    ([controlled, formValue]) => {
      if (controlled !== undefined && options.field && formValue !== controlled) {
        options.field.setFormValue(controlled)
      }
    },
  )

  const isEqual = options.isEqual ?? Object.is

  function setValue(update: T | ((previous: T) => T)): void {
    setValueInner(update)
  }

  function setValueInner(update: T | ((previous: T) => T)): void {
    const currentValue = value()
    const nextValue =
      typeof update === 'function' ? (update as (previous: T) => T)(currentValue) : update

    if (isEqual(nextValue, currentValue)) {
      return
    }

    if (options.value?.() === undefined) {
      setUncontrolledValue(() => nextValue)
      options.field?.setFormValue(nextValue)
    }

    options.onValueChange?.(nextValue)

    options.field?.emit('change')
    options.field?.emit('input')
  }

  function reset(): void {
    resetInner()
  }

  function resetInner(): void {
    if (options.value?.() === undefined) {
      setUncontrolledValue(() => initialDefaultValue)
      options.field?.setFormValue(initialDefaultValue)
    } else {
      const controlled = options.value() as T
      options.field?.setFormValue(controlled)
    }
  }

  return [value, setValue, reset] as const
}
