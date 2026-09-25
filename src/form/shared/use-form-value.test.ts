import { createRoot, createSignal } from 'solid-js'
import { describe, expect, it, vi } from 'vitest'

import type { UseFormFieldReturn } from '../field/field-context.ts'

import { useFormValue } from './use-form-value.ts'

function createMockField(): UseFormFieldReturn & {
  lastFormValue: unknown
  emittedEvents: string[]
} {
  const [value, setValue] = createSignal<unknown>(undefined)
  const mock = {
    id: () => 'test-id',
    name: () => 'test-name',
    size: () => 'md' as const,
    disabled: () => false,
    required: () => false,
    readOnly: () => false,
    invalid: () => false,
    errors: () => [],
    error: () => undefined,
    fieldError: () => undefined,
    schemaError: () => undefined,
    descriptionId: () => undefined,
    errorId: () => undefined,
    ariaAttrs: () => ({}),
    setControlRef: vi.fn(),
    setFormValue: vi.fn((val: unknown) => {
      mock.lastFormValue = val
      setValue(val)
    }),
    emit: vi.fn((event: string) => {
      mock.emittedEvents.push(event)
    }),
    path: () => ['test-field'],
    value,
    runtimeState: () => ({
      touched: false,
      dirty: false,
      focused: false,
      validating: false,
      valid: true,
    }),
    lastFormValue: undefined as unknown,
    emittedEvents: [] as string[],
  }
  return mock
}

describe('useFormValue', () => {
  it('handles uncontrolled state with defaultValue and setValue', () => {
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
      expect(field.emit).toHaveBeenCalledWith('change')
      expect(field.emit).toHaveBeenCalledWith('input')

      dispose()
    })
  })

  it('handles controlled state with value accessor', async () => {
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
    // Value still reflects controlled signal until parent updates it
    expect(valueAccessor()).toBe('first')
    expect(field.setFormValue).toHaveBeenCalledWith('first')

    setControlled('second')
    expect(valueAccessor()).toBe('second')
    await Promise.resolve()
    expect(field.setFormValue).toHaveBeenCalledWith('second')

    disposeFn?.()
  })

  it('skips onValueChange and emits when isEqual returns true', () => {
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
      expect(field.emit).not.toHaveBeenCalled()

      dispose()
    })
  })

  it('resets uncontrolled state silently on reset()', () => {
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
      field.emittedEvents = []

      reset()
      expect(value()).toBe('initial')
      expect(field.setFormValue).toHaveBeenCalledWith('initial')
      expect(onValueChange).not.toHaveBeenCalled()
      expect(field.emittedEvents).toEqual([])

      dispose()
    })
  })

  it('custom isEqual allows complex objects/arrays comparison', () => {
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
