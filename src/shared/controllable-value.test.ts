import type { Accessor } from 'solid-js'
import { createRoot, createSignal, flush } from 'solid-js'
import { describe, expect, it, vi } from 'vitest'

import { createControllableValue } from './controllable-value'
import type { CreateControllableValueOptions } from './controllable-value'
type ConcreteOptions = CreateControllableValueOptions<string>
const invalidDefault: ConcreteOptions = {
  value: () => undefined,
  // @ts-expect-error The uncontrolled fallback must be concrete.
  defaultValue: () => undefined,
}
void invalidDefault

describe('createControllableValue', () => {
  it('uses the initial default value for the lifetime of uncontrolled state', () => {
    createRoot((dispose) => {
      const [controlledValue, setControlledValue] = createSignal<string | undefined>(undefined, {
        ownedWrite: true,
      })
      const [defaultValue, setDefaultValue] = createSignal('initial', { ownedWrite: true })
      const [value] = createControllableValue({
        value: controlledValue,
        defaultValue,
      })

      expect(value()).toBe('initial')

      flush(() => setDefaultValue('changed'))
      flush(() => setControlledValue('controlled'))

      expect(value()).toBe('controlled')

      flush(() => setControlledValue(undefined))

      expect(value()).toBe('initial')
      dispose()
    })
  })

  it('applies functional updates to the latest uncontrolled value', () => {
    createRoot((dispose) => {
      const [value, setValue] = createControllableValue<number>({
        value: () => undefined,
        defaultValue: () => 1,
      })

      flush(() => setValue((previous) => previous + 1))
      flush(() => setValue((previous) => previous + 1))

      expect(value()).toBe(3)
      dispose()
    })
  })

  it('passes the controlled value to functional updates and keeps the uncontrolled value', () => {
    createRoot((dispose) => {
      const [controlledValue, setControlledValue] = createSignal<number | undefined>(10, {
        ownedWrite: true,
      })
      const [value, setValue] = createControllableValue({
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

      flush(() => setControlledValue(undefined))

      expect(value()).toBe(1)
      dispose()
    })
  })

  it('reports changes for controlled and uncontrolled values', () => {
    createRoot((dispose) => {
      const [controlledValue, setControlledValue] = createSignal<string | undefined>(undefined, {
        ownedWrite: true,
      })
      const onChange = vi.fn()
      const [value, setValue] = createControllableValue({
        value: controlledValue,
        defaultValue: () => 'initial',
        onChange,
      })

      flush(() => setValue('next'))
      expect(value()).toBe('next')
      expect(onChange).toHaveBeenCalledExactlyOnceWith('next')

      flush(() => setValue('next'))
      expect(onChange).toHaveBeenCalledOnce()

      flush(() => setControlledValue('controlled'))
      flush(() => setValue('proposed'))
      expect(value()).toBe('controlled')
      expect(onChange).toHaveBeenLastCalledWith('proposed')
      expect(onChange).toHaveBeenCalledTimes(2)

      dispose()
    })
  })

  it('keeps the resolved API concrete', () => {
    createRoot((dispose) => {
      const [value, setValue] = createControllableValue<string>({
        value: () => undefined,
        defaultValue: () => 'default',
      })
      const accessor: Accessor<string> = value
      const setter: (update: string | ((previous: string) => string)) => void = setValue

      expect(accessor()).toBe('default')
      flush(() => setter((previous) => `${previous}-next`))
      expect(value()).toBe('default-next')
      dispose()
    })
  })
})
