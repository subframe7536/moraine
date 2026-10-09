import type { Accessor } from 'solid-js'
import { createMemo, createSignal, untrack } from 'solid-js'

export interface CreateControllableValueOptions<T extends {} | null> {
  value: Accessor<T | undefined>
  defaultValue: Accessor<T>
  onChange?: (value: T) => void
}

type ControllableValueUpdate<T> = T | ((previous: T) => T)

export function createControllableValue<T extends {} | null>(
  options: CreateControllableValueOptions<T>,
) {
  const [uncontrolledValue, setUncontrolledValue] = createSignal<T>(untrack(options.defaultValue))
  const controlledValue = createMemo(() => options.value())
  const value = createMemo<T>(() => {
    const controlled = controlledValue()
    return controlled === undefined ? uncontrolledValue() : controlled
  })

  function setValue(update: ControllableValueUpdate<T>): void {
    untrack(() => {
      const controlled = controlledValue()
      const currentValue = controlled === undefined ? uncontrolledValue() : controlled
      const nextValue =
        typeof update === 'function' ? (update as (previous: T) => T)(currentValue) : update

      if (Object.is(nextValue, currentValue)) {
        return
      }

      if (controlled === undefined) {
        setUncontrolledValue(() => nextValue)
      }

      options.onChange?.(nextValue)
    })
  }

  return [value, setValue] as const
}
