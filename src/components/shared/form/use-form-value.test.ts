import { createRoot, createSignal, flush } from 'solid-js'
import { describe, expect, it, vi } from 'vitest'

import type { UseFormFieldReturn } from '../../field/field-context'

import { useFormValue } from './use-form-value'
function createMockField(): UseFormFieldReturn {
  const [value, setValue] = createSignal<unknown>(undefined)
  return {
    id: () => 'test-id',
    name: () => 'test-name',
    size: () => 'md' as const,
    disabled: () => false,
    required: () => false,
    readOnly: () => false,
    invalid: () => false,
    ariaAttrs: () => ({}),
    setControlRef: vi.fn<(...args: Array<any>) => void>(),
    setFormValue: vi.fn<(val: unknown) => any>((val) => setValue(val)),
    emit: vi.fn<(...args: Array<any>) => void>(),
    path: () => ['test-field'],
    bound: () => true,
    value,
    runtimeState: () => ({
      touched: false,
      dirty: false,
      focused: false,
      validating: false,
      valid: true,
    }),
  }
}

describe('useFormValue', () => {
  it('updates the value, notifies the caller, and syncs the form field', () => {
    const onValueChange = vi.fn<(...args: Array<any>) => void>()
    const field = createMockField()

    const [[value, setValue], dispose] = createRoot(
      (d) =>
        [
          useFormValue({
            defaultValue: () => 'initial',
            onValueChange,
            field,
          }),
          d,
        ] as const,
    )

    expect(value()).toBe('initial')

    flush(() => setValue('updated'))
    expect(value()).toBe('updated')
    expect(onValueChange).toHaveBeenCalledWith('updated')
    expect(field.setFormValue).toHaveBeenCalledWith('updated')

    dispose()
  })

  it('keeps the controlled value authoritative until the parent updates it', () => {
    const [controlled, setControlled] = createSignal('first')
    const onValueChange = vi.fn<(...args: Array<any>) => void>()
    const field = createMockField()

    const [[value, setValue], dispose] = createRoot(
      (d) =>
        [
          useFormValue({
            value: controlled,
            onValueChange,
            field,
          }),
          d,
        ] as const,
    )

    expect(value()).toBe('first')

    flush(() => setValue('second'))
    expect(onValueChange).toHaveBeenCalledWith('second')
    expect(value()).toBe('first')
    expect(field.setFormValue).toHaveBeenCalledWith('first')

    flush(() => setControlled('second'))
    expect(value()).toBe('second')
    expect(field.setFormValue).toHaveBeenCalledWith('second')

    dispose()
  })

  it('does not notify when the next value is equal to the current one', () => {
    const onValueChange = vi.fn<(...args: Array<any>) => void>()
    const field = createMockField()

    const [[, setValue], dispose] = createRoot(
      (d) =>
        [
          useFormValue({
            defaultValue: () => 'same',
            onValueChange,
            field,
          }),
          d,
        ] as const,
    )

    flush(() => setValue('same'))
    expect(onValueChange).not.toHaveBeenCalled()

    dispose()
  })

  it('resets an uncontrolled value to its default without notifying the caller', () => {
    const onValueChange = vi.fn<(...args: Array<any>) => void>()
    const field = createMockField()

    const [[value, setValue, reset], dispose] = createRoot(
      (d) =>
        [
          useFormValue({
            defaultValue: () => 'initial',
            onValueChange,
            field,
          }),
          d,
        ] as const,
    )

    flush(() => setValue('dirty'))
    expect(value()).toBe('dirty')
    onValueChange.mockClear()

    flush(() => reset())
    expect(value()).toBe('initial')
    expect(field.setFormValue).toHaveBeenLastCalledWith('initial')
    expect(onValueChange).not.toHaveBeenCalled()

    dispose()
  })

  it('uses a custom isEqual to compare complex values', () => {
    const onValueChange = vi.fn<(...args: Array<any>) => void>()
    const field = createMockField()

    const [[value, setValue], dispose] = createRoot(
      (d) =>
        [
          useFormValue<Array<string>>({
            defaultValue: () => ['a', 'b'],
            onValueChange,
            field,
            isEqual: (a, b) => a.length === b.length && a.every((v, i) => v === b[i]),
          }),
          d,
        ] as const,
    )

    flush(() => setValue(['a', 'b']))
    expect(onValueChange).not.toHaveBeenCalled()

    flush(() => setValue(['a', 'b', 'c']))
    expect(onValueChange).toHaveBeenCalledWith(['a', 'b', 'c'])
    expect(value()).toEqual(['a', 'b', 'c'])

    dispose()
  })
})
