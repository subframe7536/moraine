import type { Accessor } from 'solid-js'
import { createMemo, createSignal, untrack } from 'solid-js'
export interface CreateControllableValueOptions<T> {
  value: Accessor<T | undefined>
  defaultValue: Accessor<T>
  onChange?: (value: T) => void
}

type ControllableValueUpdate<T> = T | ((previous: T) => T)

export function createControllableValue<T>(options: CreateControllableValueOptions<T>) {
  const initialDefaultValue = untrack(options.defaultValue)
  const [uncontrolledValue, setUncontrolledValue] = createSignal<T>(() => initialDefaultValue, {
    ownedWrite: true,
  })
  const controlledValue = createMemo(() => options.value())
  const value = createMemo<T>(() => {
    const controlled = controlledValue()
    return controlled === undefined ? uncontrolledValue() : controlled
  })
  // Solid 2 stages signal writes until flush, so a read inside the same
  // synchronous block cannot see an earlier setValue. Mirror the last write
  // so read-modify-write chains (expand siblings, select ranges, ...) still
  // compose instead of clobbering each other.
  let pendingUncontrolled: T | undefined
  let hasPending = false

  function setValue(update: ControllableValueUpdate<T>): void {
    untrack(() => {
      const controlled = controlledValue()
      const currentValue =
        controlled === undefined
          ? hasPending
            ? (pendingUncontrolled as T)
            : uncontrolledValue()
          : controlled
      const nextValue =
        typeof update === 'function' ? (update as (previous: T) => T)(currentValue) : update

      if (Object.is(nextValue, currentValue)) {
        return
      }

      if (controlled === undefined) {
        pendingUncontrolled = nextValue
        hasPending = true
        setUncontrolledValue(() => nextValue)
      }

      options.onChange?.(nextValue)
    })
  }

  return [value, setValue] as const
}
