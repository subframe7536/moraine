import type { Accessor } from 'solid-js'
import { createMemo, createSignal, untrack } from 'solid-js'

export interface UseControllableValueOptions<T> {
  value: Accessor<T | undefined>
  defaultValue?: Accessor<T | undefined>
}

type ControllableValueUpdate<T> = T | undefined | ((previous: T | undefined) => T | undefined)

export function useControllableValue<T>(options: UseControllableValueOptions<T>) {
  const [uncontrolledValue, setUncontrolledValue] = createSignal<T | undefined>(
    untrack(() => options.defaultValue?.()),
  )
  const controlledValue = createMemo(() => options.value())
  const isControlled = createMemo(() => controlledValue() !== undefined)

  const value = createMemo<T | undefined>(() => {
    if (isControlled()) {
      return controlledValue()
    }

    return uncontrolledValue()
  })

  function setValue(update: ControllableValueUpdate<T>): void {
    untrack(() => {
      const currentValue = value()
      const nextValue =
        typeof update === 'function'
          ? (update as (previous: T | undefined) => T | undefined)(currentValue)
          : update

      if (Object.is(nextValue, currentValue) || isControlled()) {
        return
      }

      setUncontrolledValue(() => nextValue)
    })
  }

  return [value, setValue] as const
}
