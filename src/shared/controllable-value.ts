import type { Accessor } from 'solid-js'
import { createMemo, createSignal, untrack } from 'solid-js'
export interface CreateControllableValueOptions<T> {
  value: Accessor<T | undefined>
  defaultValue: Accessor<T>
  onChange?: (value: T) => void
  /**
   * Compares previous and next values to suppress redundant updates and `onChange` calls.
   *
   * @default Object.is
   */
  equals?: (prev: T, next: T) => boolean
}

type ControllableValueUpdate<T> = T | ((previous: T) => T)

function resolveUpdate<T>(update: ControllableValueUpdate<T>, previous: T): T {
  return typeof update === 'function' ? (update as (previous: T) => T)(previous) : update
}

export function createControllableValue<T>(options: CreateControllableValueOptions<T>) {
  const equals = options.equals ?? Object.is
  const initialDefaultValue = untrack(options.defaultValue)
  const [uncontrolledValue, setUncontrolledValue] = createSignal<T>(
    (typeof initialDefaultValue === 'function'
      ? () => initialDefaultValue
      : initialDefaultValue) as never,
    { equals },
  )
  const value = createMemo<T>(
    () => {
      const controlled = options.value()
      return controlled === undefined ? uncontrolledValue() : controlled
    },
    { equals },
  )

  function setValue(update: ControllableValueUpdate<T>): void {
    const controlled = untrack(options.value)
    if (controlled !== undefined) {
      const nextValue = resolveUpdate(update, controlled)
      if (!equals(controlled, nextValue)) {
        untrack(() => options.onChange?.(nextValue))
      }
      return
    }

    let changed = false
    let nextValue!: T
    setUncontrolledValue((previous) => {
      nextValue = resolveUpdate(update, previous)
      changed = !equals(previous, nextValue)
      return changed ? nextValue : previous
    })
    if (changed) {
      untrack(() => options.onChange?.(nextValue))
    }
  }

  return [value, setValue] as const
}
