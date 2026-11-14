import { createRoot, createSignal } from 'solid-js'
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
    setControlRef: vi.fn(),
    setFormValue: vi.fn((val: unknown) => setValue(val)),
    emit: vi.fn(),
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
    createRoot((dispose) => {
      const onValueChange = vi.fn()
      const field = createMockField()

      const [value, setValue] = useFormValue({
        defaultValue: () => 'initial',
        onValueChange,
        field,
      })

      expect(value()).toBe('initial')

      setValue('updated')
      expect(value()).toBe('updated')
      expect(onValueChange).toHaveBeenCalledWith('updated')
      expect(field.setFormValue).toHaveBeenCalledWith('updated')

      dispose()
    })
  })

  it('keeps the controlled value authoritative until the parent updates it', () => {
    let disposeFn: (() => void) | undefined
    const [controlled, setControlled] = createSignal('first')
    const onValueChange = vi.fn()
    const field = createMockField()
    let valueAccessor: () => string = () => ''
    let setValueFn: (v: string) => void = () => {}

    createRoot((dispose) => {
      disposeFn = dispose
      const [value, setValue] = useFormValue({
        value: controlled,
        onValueChange,
        field,
      })
      valueAccessor = value
      setValueFn = setValue
    })

    expect(valueAccessor()).toBe('first')

    setValueFn('second')
    expect(onValueChange).toHaveBeenCalledWith('second')
    expect(valueAccessor()).toBe('first')
    expect(field.setFormValue).toHaveBeenCalledWith('first')

    setControlled('second')
    expect(valueAccessor()).toBe('second')
    expect(field.setFormValue).toHaveBeenCalledWith('second')

    disposeFn?.()
  })

  it('does not notify when the next value is equal to the current one', () => {
    createRoot((dispose) => {
      const onValueChange = vi.fn()
      const field = createMockField()

      const [, setValue] = useFormValue({
        defaultValue: () => 'same',
        onValueChange,
        field,
      })

      setValue('same')
      expect(onValueChange).not.toHaveBeenCalled()

      dispose()
    })
  })

  it('resets an uncontrolled value to its default without notifying the caller', () => {
    createRoot((dispose) => {
      const onValueChange = vi.fn()
      const field = createMockField()

      const [value, setValue, reset] = useFormValue({
        defaultValue: () => 'initial',
        onValueChange,
        field,
      })

      setValue('dirty')
      expect(value()).toBe('dirty')
      onValueChange.mockClear()

      reset()
      expect(value()).toBe('initial')
      expect(field.setFormValue).toHaveBeenLastCalledWith('initial')
      expect(onValueChange).not.toHaveBeenCalled()

      dispose()
    })
  })

  it('uses a custom isEqual to compare complex values', () => {
    createRoot((dispose) => {
      const onValueChange = vi.fn()
      const field = createMockField()

      const [value, setValue] = useFormValue<string[]>({
        defaultValue: () => ['a', 'b'],
        onValueChange,
        field,
        isEqual: (a, b) => a.length === b.length && a.every((v, i) => v === b[i]),
      })

      setValue(['a', 'b'])
      expect(onValueChange).not.toHaveBeenCalled()

      setValue(['a', 'b', 'c'])
      expect(onValueChange).toHaveBeenCalledWith(['a', 'b', 'c'])
      expect(value()).toEqual(['a', 'b', 'c'])

      dispose()
    })
  })
})
