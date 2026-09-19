import type { Accessor } from 'solid-js'
import { createMemo, createRenderEffect, createRoot, createSignal, untrack } from 'solid-js'
import { describe, expect, it } from 'vitest'

import { useControllableValue } from './use-controllable-value'
import type { UseControllableValueOptions } from './use-controllable-value'

type ConcreteOptions = UseControllableValueOptions<string>
const invalidDefault: ConcreteOptions = {
  value: () => undefined,
  // @ts-expect-error The uncontrolled fallback must be concrete.
  defaultValue: () => undefined,
}
void invalidDefault

// @ts-expect-error Undefined cannot be part of the resolved state type.
const invalidOptions: UseControllableValueOptions<string | undefined> = {
  value: () => undefined,
  defaultValue: () => 'default',
}
void invalidOptions

describe('useControllableValue', () => {
  it('uses the initial default value for the lifetime of uncontrolled state', () => {
    createRoot((dispose) => {
      const [controlledValue, setControlledValue] = createSignal<string>()
      const [defaultValue, setDefaultValue] = createSignal('initial')
      const [value] = useControllableValue({
        value: controlledValue,
        defaultValue,
      })

      expect(value()).toBe('initial')

      setDefaultValue('changed')
      setControlledValue('controlled')

      expect(value()).toBe('controlled')

      setControlledValue(undefined)

      expect(value()).toBe('initial')
      dispose()
    })
  })

  it('applies functional updates to the latest uncontrolled value', () => {
    createRoot((dispose) => {
      const [value, setValue] = useControllableValue<number>({
        value: () => undefined,
        defaultValue: () => 1,
      })

      setValue((previous) => previous + 1)
      setValue((previous) => previous + 1)

      expect(value()).toBe(3)
      dispose()
    })
  })

  it('computes controlled updates without mutating the preserved uncontrolled value', () => {
    createRoot((dispose) => {
      const [controlledValue, setControlledValue] = createSignal<number | undefined>(10)
      const [value, setValue] = useControllableValue({
        value: controlledValue,
        defaultValue: () => 1,
      })
      let previousValue: number | undefined

      setValue((previous) => {
        previousValue = previous
        return 11
      })

      expect(previousValue).toBe(10)
      expect(value()).toBe(10)

      setControlledValue(undefined)

      expect(value()).toBe(1)
      dispose()
    })
  })

  it('does not publish Object.is-equal updates', () => {
    createRoot((dispose) => {
      const [value, setValue] = useControllableValue<number>({
        value: () => undefined,
        defaultValue: () => Number.NaN,
      })
      let evaluations = 0
      const observedValue = createMemo(() => {
        evaluations += 1
        return value()
      })

      let initial: number | undefined
      createRenderEffect(() => {
        initial = observedValue()
      })
      expect(initial).toBeNaN()

      setValue(Number.NaN)

      expect(initial).toBeNaN()
      expect(evaluations).toBe(1)
      dispose()
    })
  })

  it('does not publish equal resolved values across controlled mode transitions', () => {
    createRoot((dispose) => {
      const [controlledValue, setControlledValue] = createSignal<boolean>()
      const [value] = useControllableValue({
        value: controlledValue,
        defaultValue: () => false,
      })
      let evaluations = 0
      const observedValue = createMemo(() => {
        evaluations += 1
        return value()
      })

      expect(untrack(observedValue)).toBe(false)
      expect(evaluations).toBe(1)

      setControlledValue(false)
      expect(untrack(observedValue)).toBe(false)
      expect(evaluations).toBe(1)

      setControlledValue(true)
      expect(untrack(observedValue)).toBe(true)
      expect(evaluations).toBe(2)

      setControlledValue(false)
      expect(untrack(observedValue)).toBe(false)
      expect(evaluations).toBe(3)

      setControlledValue(undefined)
      expect(untrack(observedValue)).toBe(false)
      expect(evaluations).toBe(3)
      dispose()
    })
  })

  it('keeps the resolved API concrete', () => {
    createRoot((dispose) => {
      const [value, setValue] = useControllableValue<string>({
        value: () => undefined,
        defaultValue: () => 'default',
      })
      const accessor: Accessor<string> = value
      const setter: (update: string | ((previous: string) => string)) => void = setValue

      expect(accessor()).toBe('default')
      setter((previous) => `${previous}-next`)
      expect(value()).toBe('default-next')
      dispose()
    })
  })

  it('evaluates option getters once per relevant change', () => {
    createRoot((dispose) => {
      const [controlledValue, setControlledValue] = createSignal<number>()
      let valueReads = 0
      let defaultValueReads = 0
      const [value, setValue] = useControllableValue({
        value: () => {
          valueReads += 1
          return controlledValue()
        },
        defaultValue: () => {
          defaultValueReads += 1
          return 1
        },
      })

      expect(value()).toBe(1)
      expect(value()).toBe(1)
      expect(valueReads).toBe(1)
      expect(defaultValueReads).toBe(1)

      setControlledValue(2)
      expect(value()).toBe(2)
      expect(valueReads).toBe(2)

      setValue(3)
      expect(valueReads).toBe(2)
      dispose()
    })
  })
})
