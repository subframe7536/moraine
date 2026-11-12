import type { Accessor } from 'solid-js'
import { createEffect, createMemo, createSignal, on } from 'solid-js'

import {
  formatLocaleNumber,
  isPartialNumber,
  parseLocaleNumber,
  toNumber,
} from '../../provider/locale/number'
import { createControllableValue } from '../../shared/controllable-value'
import { snapValueToStep } from '../slider/utils'

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function getDecimalPrecision(value: number): number {
  const [coefficient = '', exponentText] = String(value).toLowerCase().split('e')
  const fractionLength = coefficient.split('.')[1]?.length ?? 0
  const exponent = Number(exponentText ?? 0)

  return Math.max(0, fractionLength - exponent)
}

/** Adds decimal step values without exposing binary arithmetic noise. */
export function addDecimal(value: number, amount: number): number {
  const result = value + amount
  const precision = Math.max(getDecimalPrecision(value), getDecimalPrecision(amount))
  const multiplier = 10 ** precision

  if (!Number.isFinite(multiplier)) {
    return result
  }

  const multipliedValue = Math.round(value * multiplier)
  const multipliedAmount = Math.round(amount * multiplier)

  if (!Number.isSafeInteger(multipliedValue) || !Number.isSafeInteger(multipliedAmount)) {
    return result
  }

  return (multipliedValue + multipliedAmount) / multiplier
}

export interface CreateNumberInputOptions {
  explicitControlledValue: Accessor<number | undefined>
  fieldValue: Accessor<unknown>
  initialDefaultValue: number | undefined
  minValue: Accessor<number>
  maxValue: Accessor<number>
  rawMinValue?: Accessor<number | undefined>
  rawMaxValue?: Accessor<number | undefined>
  step: Accessor<number>
  largeStep: Accessor<number>
  stepSnapping: Accessor<boolean>
  locale: Accessor<string>
  formatOptions: Accessor<Intl.NumberFormatOptions | undefined>
  disabled: Accessor<boolean>
  readOnly: Accessor<boolean>
  onRawValueChange?: (value: number | undefined) => void
  onValueChange?: (value: string) => void
  setFormValue?: (value: number | undefined) => void
  resetNativeInvalid?: () => void
  emitChange?: () => void
  emitInput?: () => void
}

export function createNumberInput(options: CreateNumberInputOptions) {
  const [resolvedValue, setResolvedValue] = createControllableValue<number | undefined>({
    value: () => {
      const controlledValue = options.explicitControlledValue()
      if (controlledValue !== undefined) {
        return controlledValue
      }

      if (options.fieldValue() !== undefined) {
        return toNumber(
          options.fieldValue() as string | number | undefined,
          0,
          options.locale(),
          options.formatOptions(),
        )
      }

      return undefined
    },
    defaultValue: () => options.initialDefaultValue,
  })

  const currentValue = createMemo(() => {
    const value = resolvedValue()
    return value === undefined ? undefined : clamp(value, options.minValue(), options.maxValue())
  })

  const formattedValue = createMemo(() => {
    const value = currentValue()
    return value === undefined
      ? ''
      : formatLocaleNumber(value, options.locale(), options.formatOptions())
  })

  // Draft text exists only while actively typing uncommitted or partial input.
  const [draftText, setDraftText] = createSignal<string>()

  // Sync external numeric or locale changes without clobbering accepted manual text.
  createEffect(
    on([currentValue, options.locale], ([value, localeTag]) => {
      const draft = draftText()
      if (draft !== undefined) {
        const parsed = parseLocaleNumber(draft, localeTag, options.formatOptions())
        if (
          parsed !== undefined &&
          Object.is(clamp(parsed, options.minValue(), options.maxValue()), value)
        ) {
          return
        }
        setDraftText(undefined)
      }
    }),
  )

  function commitValue(nextValue: number): boolean {
    if (options.disabled() || options.readOnly() || !Number.isFinite(nextValue)) {
      return false
    }

    const committedValue = clamp(nextValue, options.minValue(), options.maxValue())
    if (Object.is(committedValue, currentValue())) {
      return false
    }

    const controlledValue = options.explicitControlledValue()

    if (controlledValue === undefined) {
      setResolvedValue(committedValue)
      options.setFormValue?.(committedValue)
    }

    options.resetNativeInvalid?.()
    options.onRawValueChange?.(committedValue)
    options.onValueChange?.(String(committedValue))

    options.emitChange?.()
    options.emitInput?.()
    return true
  }

  function clearValue(): boolean {
    if (options.disabled() || options.readOnly() || resolvedValue() === undefined) {
      return false
    }

    if (options.explicitControlledValue() === undefined) {
      setResolvedValue(undefined)
    }
    options.setFormValue?.(undefined)

    options.resetNativeInvalid?.()
    options.onRawValueChange?.(undefined)
    options.onValueChange?.('')

    options.emitChange?.()
    options.emitInput?.()
    return true
  }

  function getStepBase(): number {
    const draft = draftText()
    if (draft !== undefined) {
      const parsed = parseLocaleNumber(draft, options.locale(), options.formatOptions())
      if (parsed !== undefined) {
        return parsed
      }
    }

    return currentValue() ?? 0
  }

  function getSteppedValue(rawValue: number, amount: number): number {
    if (!options.stepSnapping() || amount === 0) {
      return addDecimal(rawValue, amount)
    }

    const step = Math.abs(amount)
    const min = options.rawMinValue?.() ?? Number.NaN
    const max = options.rawMaxValue?.() ?? Number.NaN

    let nextValue = snapValueToStep(rawValue, min, max, step)
    const movedInDirection = amount > 0 ? nextValue > rawValue : nextValue < rawValue
    if (!movedInDirection) {
      nextValue = snapValueToStep(addDecimal(rawValue, amount), min, max, step)
    }

    return nextValue
  }

  function stepBy(amount: number): boolean {
    const wasDirty = draftText() !== undefined
    const nextValue = getSteppedValue(getStepBase(), amount)
    const boundedValue = clamp(nextValue, options.minValue(), options.maxValue())
    const changed = commitValue(nextValue)

    if (changed && Object.is(currentValue(), boundedValue)) {
      setDraftText(undefined)
      return true
    }

    if (!wasDirty) {
      setDraftText(undefined)
    }

    return false
  }

  function incrementValue(amount = options.step()): boolean {
    return stepBy(amount)
  }

  function decrementValue(amount = options.step()): boolean {
    return stepBy(-amount)
  }

  function commitDraft(): void {
    const draft = draftText()
    if (draft !== undefined) {
      if (draft.trim() === '') {
        clearValue()
      } else {
        const parsed = parseLocaleNumber(draft, options.locale(), options.formatOptions())
        if (parsed !== undefined) {
          commitValue(parsed)
        }
      }
      setDraftText(undefined)
    }
  }

  function handleInput(rawInput: string): void {
    options.resetNativeInvalid?.()
    if (options.disabled() || options.readOnly()) {
      return
    }

    setDraftText(rawInput)

    const parsed = parseLocaleNumber(rawInput, options.locale(), options.formatOptions())
    if (
      parsed !== undefined &&
      !isPartialNumber(rawInput, options.locale(), options.formatOptions())
    ) {
      commitValue(parsed)
    }
  }

  function handleChange(rawInput: string): void {
    if (options.disabled() || options.readOnly()) {
      return
    }

    setDraftText(rawInput)

    const parsed = parseLocaleNumber(rawInput, options.locale(), options.formatOptions())
    if (parsed !== undefined) {
      commitValue(parsed)
    } else if (
      rawInput.trim() === '' ||
      isPartialNumber(rawInput, options.locale(), options.formatOptions())
    ) {
      // Empty or partial input - wait for blur
    } else {
      // Invalid input - revert
      setDraftText(undefined)
    }
  }

  function reset(initialResetValue: number | undefined): void {
    const controlledValue = options.explicitControlledValue()
    const nextValue =
      controlledValue === undefined
        ? initialResetValue
        : clamp(controlledValue, options.minValue(), options.maxValue())

    if (controlledValue === undefined) {
      setResolvedValue(nextValue)
    }
    options.setFormValue?.(nextValue)
    setDraftText(undefined)
    options.resetNativeInvalid?.()
  }

  return {
    resolvedValue,
    currentValue,
    formattedValue,
    draftText,
    setDraftText,
    commitValue,
    clearValue,
    stepBy,
    incrementValue,
    decrementValue,
    commitDraft,
    handleInput,
    handleChange,
    reset,
  }
}
