import type { Accessor } from 'solid-js'
import { createMemo, createSignal, untrack } from 'solid-js'

export interface UseControllableValueOptions<T> {
  value: Accessor<T | undefined>
  defaultValue: Accessor<T>
}

type ControllableValueUpdate<T> = T | ((previous: T) => T)

export function useControllableValue<T>(options: UseControllableValueOptions<T>) {
  const [uncontrolledValue, setUncontrolledValue] = createSignal<T>(untrack(options.defaultValue))
  const controlledValue = createMemo(() => options.value())

  const value: Accessor<T> = () => {
    const controlled = controlledValue()
    return controlled === undefined ? uncontrolledValue() : controlled
  }

  function setValue(update: ControllableValueUpdate<T>): void {
    untrack(() => {
      const controlled = controlledValue()
      const currentValue = controlled === undefined ? uncontrolledValue() : controlled
      const nextValue =
        typeof update === 'function' ? (update as (previous: T) => T)(currentValue) : update

      if (Object.is(nextValue, currentValue) || controlled !== undefined) {
        return
      }

      setUncontrolledValue(() => nextValue)
    })
  }

  return [value, setValue] as const
}
