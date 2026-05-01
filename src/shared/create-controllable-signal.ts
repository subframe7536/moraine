import type { Accessor } from 'solid-js'
import { createMemo, createSignal, untrack } from 'solid-js'

export interface CreateControllableSignalProps<T> {
  value?: Accessor<T | undefined>
  defaultValue?: Accessor<T | undefined>
  onChange?: (value: T) => void
}

export function createControllableSignal<T>(props: CreateControllableSignalProps<T>) {
  // Avoid subscribing the initial uncontrolled value to reactive callers. The
  // default should only seed local state once, like a standard uncontrolled prop.
  const [uncontrolledValue, setUncontrolledValue] = createSignal<T | undefined>(
    untrack(() => props.defaultValue?.()),
  )

  const value = createMemo<T | undefined>(() => {
    const controlledValue = props.value?.()
    return controlledValue !== undefined ? controlledValue : uncontrolledValue()
  })

  function setValue(nextValue: T): void {
    if (props.value?.() === undefined) {
      setUncontrolledValue(() => nextValue)
    }

    props.onChange?.(nextValue)
  }

  return [value, setValue] as const
}
