import { createMemo, createRoot, createSignal } from 'solid-js'
import { describe, expect, it } from 'vitest'

import { useControllableValue } from './use-controllable-value.ts'

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

      setValue((previous) => (previous ?? 0) + 1)
      setValue((previous) => (previous ?? 0) + 1)

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

      expect(observedValue()).toBeNaN()

      setValue(Number.NaN)

      expect(observedValue()).toBeNaN()
      expect(evaluations).toBe(1)
      dispose()
    })
  })

  it('stores undefined as an uncontrolled value across mode transitions', () => {
    createRoot((dispose) => {
      const [controlledValue, setControlledValue] = createSignal<string>()
      const [value, setValue] = useControllableValue({
        value: controlledValue,
        defaultValue: () => 'default',
      })

      setValue(undefined)
      expect(value()).toBeUndefined()

      setControlledValue('controlled')
      expect(value()).toBe('controlled')

      setControlledValue(undefined)
      expect(value()).toBeUndefined()
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
