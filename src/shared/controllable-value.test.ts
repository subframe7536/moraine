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
    const [controlledValue, setControlledValue] = createSignal<string | undefined>(undefined)
    const [defaultValue, setDefaultValue] = createSignal('initial')
    const [[value], dispose] = createRoot(
      (d) =>
        [
          createControllableValue({
            value: controlledValue,
            defaultValue,
          }),
          d,
        ] as const,
    )

    expect(value()).toBe('initial')

    flush(() => setDefaultValue('changed'))
    flush(() => setControlledValue('controlled'))

    expect(value()).toBe('controlled')

    flush(() => setControlledValue(undefined))

    expect(value()).toBe('initial')
    dispose()
  })

  it('applies functional updates to the latest uncontrolled value', () => {
    const [[value, setValue], dispose] = createRoot(
      (d) =>
        [
          createControllableValue<number>({
            value: () => undefined,
            defaultValue: () => 1,
          }),
          d,
        ] as const,
    )

    flush(() => setValue((previous) => previous + 1))
    flush(() => setValue((previous) => previous + 1))

    expect(value()).toBe(3)
    dispose()
  })

  it('passes the controlled value to functional updates and keeps the uncontrolled value', () => {
    const [controlledValue, setControlledValue] = createSignal<number | undefined>(10)
    const [[value, setValue], dispose] = createRoot(
      (d) =>
        [
          createControllableValue({
            value: controlledValue,
            defaultValue: () => 1,
          }),
          d,
        ] as const,
    )
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

  it('reports changes for controlled and uncontrolled values', () => {
    const [controlledValue, setControlledValue] = createSignal<string | undefined>(undefined)
    const onChange = vi.fn<(...args: Array<any>) => void>()
    const [[value, setValue], dispose] = createRoot(
      (d) =>
        [
          createControllableValue({
            value: controlledValue,
            defaultValue: () => 'initial',
            onChange,
          }),
          d,
        ] as const,
    )

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

  it('keeps the resolved API concrete', () => {
    const [[value, setValue], dispose] = createRoot(
      (d) =>
        [
          createControllableValue<string>({
            value: () => undefined,
            defaultValue: () => 'default',
          }),
          d,
        ] as const,
    )
    const accessor: Accessor<string> = value
    const setter: (update: string | ((previous: string) => string)) => void = setValue

    expect(accessor()).toBe('default')
    flush(() => setter((previous) => `${previous}-next`))
    expect(value()).toBe('default-next')
    dispose()
  })

  it('composes synchronous uncontrolled writes before flush', () => {
    const onChange = vi.fn<(next: number) => void>()
    const [[value, setValue], dispose] = createRoot(
      (d) =>
        [
          createControllableValue<number>({
            value: () => undefined,
            defaultValue: () => 1,
            onChange,
          }),
          d,
        ] as const,
    )

    setValue((previous) => previous + 1)
    setValue((previous) => previous + 1)
    setValue(3)

    expect(value()).toBe(1)
    expect(onChange.mock.calls).toEqual([[2], [3]])

    flush()
    expect(value()).toBe(3)

    setValue(4)
    setValue(3)
    flush()

    expect(value()).toBe(3)
    expect(onChange.mock.calls).toEqual([[2], [3], [4], [3]])
    dispose()
  })

  it('supports function values and custom equality', () => {
    const firstFn = () => 'first'
    const secondFn = () => 'second'
    const [[fnValue, setFnValue], disposeFn] = createRoot(
      (d) =>
        [
          createControllableValue<() => string>({
            value: () => undefined,
            defaultValue: () => firstFn,
          }),
          d,
        ] as const,
    )

    expect(fnValue()).toBe(firstFn)
    flush(() => setFnValue(() => secondFn))
    expect(fnValue()).toBe(secondFn)
    disposeFn()

    const onChange = vi.fn<(next: ReadonlyArray<number>) => void>()
    const [[items, setItems], disposeItems] = createRoot(
      (d) =>
        [
          createControllableValue<ReadonlyArray<number>>({
            value: () => undefined,
            defaultValue: () => [1, 2],
            onChange,
            equals: (a, b) => a.length === b.length && a.every((v, i) => v === b[i]),
          }),
          d,
        ] as const,
    )

    flush(() => setItems([1, 2]))
    expect(onChange).not.toHaveBeenCalled()

    flush(() => setItems([1, 2, 3]))
    expect(items()).toEqual([1, 2, 3])
    expect(onChange).toHaveBeenCalledExactlyOnceWith([1, 2, 3])
    disposeItems()
  })
})
