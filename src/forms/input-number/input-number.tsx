import type { JSX } from 'solid-js'
import {
  createEffect,
  createMemo,
  createSignal,
  mergeProps,
  onCleanup,
  onMount,
  splitProps,
  Show,
  untrack,
} from 'solid-js'

import { Icon } from '../../elements/icon/index.ts'
import type { IconT } from '../../elements/icon/index.ts'
import { resolveComponentStyle, useMoraineConfig } from '../../shared/provider/index.ts'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'
import { useControllableValue } from '../../shared/use-controllable-value.ts'
import { callHandler, cn, useId } from '../../shared/utils.ts'
import { useFormField } from '../form/form-context.ts'
import type {
  FormDisableOption,
  FormIdentityOptions,
  FormReadOnlyOption,
  FormRequiredOption,
} from '../shared/form-options.ts'
import { useFormReset } from '../shared/use-form-reset.ts'

import type { InputNumberOrientation, InputNumberVariantProps } from './input-number.class.ts'
import {
  inputNumberControlColumnVariants,
  inputNumberRecipe,
  resolveInputNumberAlign,
} from './input-number.class.ts'

type ControlKind = 'increment' | 'decrement'
type PointerType = 'mouse' | 'touch' | 'pen'
type InputNumberControlProps = JSX.ButtonHTMLAttributes<HTMLButtonElement> & {
  [key: `data-${string}`]: string | undefined
}

interface PressRepeatState {
  activePointerId: number | null
  delayTimer: ReturnType<typeof setTimeout> | undefined
  repeatTimer: ReturnType<typeof setInterval> | undefined
  repeatStarted: boolean
  suppressNextClick: boolean
  syntheticClicksPending: number
  lastTriggeredAt: number
  lastPointerType: string | undefined
  targetEl: HTMLButtonElement | null
}

/**
 * Detects the decimal separator for the current locale.
 */
function getDecimalSeparator(locale?: string): string {
  const formatter = new Intl.NumberFormat(locale || undefined)
  const parts = formatter.formatToParts(1.1)
  const decimalPart = parts.find((part) => part.type === 'decimal')
  return decimalPart?.value ?? '.'
}

/**
 * Detects the thousands separator for the current locale.
 */
function getThousandsSeparator(locale?: string): string {
  const formatter = new Intl.NumberFormat(locale || undefined)
  const parts = formatter.formatToParts(1000)
  const groupPart = parts.find((part) => part.type === 'group')
  return groupPart?.value ?? ','
}

/**
 * Checks if a string represents a partial but valid in-progress number input.
 * Examples: "-", ".", "-.", "1.", "1.2", "-0.", locale-specific separators
 */
function isPartialNumber(value: string, locale?: string): boolean {
  if (value === '' || value === '-' || value === '+') {
    return true
  }

  const decimalSep = getDecimalSeparator(locale)

  // Just a decimal separator
  if (value === decimalSep || value === `-${decimalSep}` || value === `+${decimalSep}`) {
    return true
  }

  // Ends with decimal separator (e.g., "1.", "1.2.")
  if (value.endsWith(decimalSep)) {
    return true
  }

  return false
}

/**
 * Parses a locale-aware number string to a number.
 * Returns undefined if the string is not a valid complete number.
 */
function parseLocaleNumber(value: string, locale?: string): number | undefined {
  if (value === '' || value.trim() === '') {
    return undefined
  }

  const decimalSep = getDecimalSeparator(locale)
  const thousandsSep = getThousandsSeparator(locale)

  // Normalize: remove thousands separators and replace decimal separator with '.'
  let normalized = value
  if (thousandsSep) {
    normalized = normalized.replaceAll(thousandsSep, '')
  }
  if (decimalSep !== '.') {
    normalized = normalized.replace(decimalSep, '.')
  }

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : undefined
}

/**
 * Formats a number using locale-specific formatting.
 */
function formatLocaleNumber(value: number, locale?: string): string {
  return new Intl.NumberFormat(locale || undefined, {
    useGrouping: false,
    maximumFractionDigits: 20,
  }).format(value)
}

function toNumber(value: string | number | undefined, fallback: number, locale?: string): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : fallback
  }

  if (typeof value === 'string' && value.trim() !== '') {
    return parseLocaleNumber(value, locale) ?? fallback
  }

  return fallback
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function getDecimalPrecision(value: number): number {
  const [coefficient = '', exponentText] = String(value).toLowerCase().split('e')
  const fractionLength = coefficient.split('.')[1]?.length ?? 0
  const exponent = Number(exponentText ?? 0)

  return Math.max(0, fractionLength - exponent)
}

/** Adds decimal step values without exposing binary arithmetic noise. */
function addDecimal(value: number, amount: number): number {
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

export namespace InputNumberT {
  export interface Slot<T = unknown> {
    /**
     * Number input wrapper that owns the input and step controls.
     */
    root?: T

    /** Native number input element. */
    input?: T

    /** Button that increases the current numeric value. */
    increment?: T

    /** Button that decreases the current numeric value. */
    decrement?: T
  }

  export type Variant = InputNumberVariantProps
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface Item {}

  /**
   * Base props for the InputNumber component.
   */
  export interface Base
    extends FormIdentityOptions, FormDisableOption, FormRequiredOption, FormReadOnlyOption {
    /**
     * Controlled displayed value.
     */
    value?: string | number

    /**
     * Default displayed value for uncontrolled usage.
     */
    defaultValue?: string | number

    /**
     * Controlled numeric value. Takes precedence over `value`.
     */
    rawValue?: number

    /**
     * Minimum allowed numeric value.
     */
    minValue?: number

    /**
     * Maximum allowed numeric value.
     */
    maxValue?: number

    /**
     * The increment/decrement step size.
     * @default 1
     */
    step?: number

    /**
     * The step size used for PageUp/PageDown.
     * @default step * 10
     */
    largeStep?: number

    /**
     * Locale for number formatting and parsing.
     * Uses browser default if not specified.
     */
    locale?: string

    /**
     * Callback when the formatted string value changes.
     */
    onChange?: (value: string) => void

    /**
     * Callback when the numeric value changes.
     */
    onRawValueChange?: (value: number) => void

    /**
     * Placeholder text for the input.
     */
    placeholder?: string

    /**
     * Whether to show the increment button.
     * @default true
     */
    increment?: boolean

    /**
     * Icon for the increment button.
     * @default orientation === 'vertical' ? 'icon-chevron-up' : 'icon-plus'
     */
    incrementIcon?: IconT.Name

    /**
     * Whether the increment button is disabled.
     */
    incrementDisabled?: boolean

    /**
     * Whether to show the decrement button.
     * @default true
     */
    decrement?: boolean

    /**
     * Icon for the decrement button.
     * @default orientation === 'vertical' ? 'icon-chevron-down' : 'icon-minus'
     */
    decrementIcon?: IconT.Name

    /**
     * Whether the decrement button is disabled.
     */
    decrementDisabled?: boolean

    /**
     * Whether to automatically focus the input on mount.
     * @default false
     */
    autofocus?: boolean

    /**
     * Whether mouse wheel changes the value while the input is focused.
     * @default false
     */
    wheel?: boolean

    /**
     * Delay in milliseconds before focusing the input.
     * @default 0
     */
    autofocusDelay?: number

    /**
     * Callback when the input loses focus.
     */
    onBlur?: JSX.FocusEventHandlerUnion<HTMLInputElement, FocusEvent>

    /**
     * Callback when the input gains focus.
     */
    onFocus?: JSX.FocusEventHandlerUnion<HTMLInputElement, FocusEvent>

    /**
     * Callback when the increment button is clicked.
     */
    onIncrementClick?: JSX.EventHandlerUnion<HTMLButtonElement, MouseEvent>

    /**
     * Callback when the decrement button is clicked.
     */
    onDecrementClick?: JSX.EventHandlerUnion<HTMLButtonElement, MouseEvent>

    /**
     * Whether press-and-hold should trigger repeated value changes.
     * @default true
     */
    holdRepeat?: boolean

    /**
     * Delay in milliseconds before repeated value changes start.
     * @default 500
     */
    repeatDelayMs?: number

    /**
     * Interval in milliseconds between repeated value changes.
     * @default 80
     */
    repeatIntervalMs?: number

    /**
     * Minimum elapsed time in milliseconds between repeat triggers.
     * @default 0
     */
    repeatThrottleMs?: number

    /**
     * Pointer types that can trigger press-and-hold repeat.
     * @default 'all'
     */
    repeatPointerTypes?: 'all' | PointerType
  }

  /**
   * Props for the InputNumber component.
   */
  export type Props = BaseProps<'div', Base, Variant, Classes, Styles>
}

/**
 * Props for the InputNumber component.
 */
export interface InputNumberProps extends InputNumberT.Props {}

/** Numeric input with increment/decrement controls, step, and min/max constraints. */
export function InputNumber(props: InputNumberProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'id',
    'name',
    'value',
    'defaultValue',
    'rawValue',
    'minValue',
    'maxValue',
    'step',
    'largeStep',
    'locale',
    'onChange',
    'onRawValueChange',
    'orientation',
    'placeholder',
    'increment',
    'incrementIcon',
    'incrementDisabled',
    'decrement',
    'decrementIcon',
    'decrementDisabled',
    'autofocus',
    'wheel',
    'autofocusDelay',
    'onBlur',
    'onFocus',
    'onIncrementClick',
    'onDecrementClick',
    'holdRepeat',
    'repeatDelayMs',
    'repeatIntervalMs',
    'repeatThrottleMs',
    'repeatPointerTypes',
    'disabled',
    'required',
    'readOnly',
    'size',
    'variant',
    'classes',
    'styles',
    'class',
    'style',
  ])

  const config = useMoraineConfig()
  const provider = () => config().inputNumber

  const merged = mergeProps(
    {
      variant: 'outline' as const,
      orientation: 'horizontal' as const,
      increment: true,
      decrement: true,
      autofocusDelay: 0,
      holdRepeat: true,
      repeatDelayMs: 500,
      repeatIntervalMs: 80,
      repeatThrottleMs: 0,
      repeatPointerTypes: 'all' as const,
    },
    () => provider()?.defaultProps,
    local,
  )

  const initialDefaultValue = untrack(() => toNumber(merged.defaultValue, 0, merged.locale))
  const initialValue = untrack(() => {
    if (merged.rawValue !== undefined) {
      return toNumber(merged.rawValue, 0)
    }

    if (merged.value !== undefined) {
      return toNumber(merged.value, 0, merged.locale)
    }

    return initialDefaultValue
  })

  const readOnly = createMemo(() => Boolean(merged.readOnly))
  const generatedId = useId(() => merged.id, 'input-number')
  const field = useFormField(
    () => ({
      id: merged.id,
      name: merged.name,
      size: merged.size,
      disabled: merged.disabled,
      required: local.required,
      readOnly: readOnly(),
    }),
    () => ({
      defaultId: generatedId(),
      defaultSize: 'md',
      initialValue,
    }),
  )

  let inputEl: HTMLInputElement | undefined

  const explicitControlledValue = createMemo<number | undefined>(() => {
    if (merged.rawValue !== undefined) {
      return toNumber(merged.rawValue, 0)
    }

    if (merged.value !== undefined) {
      return toNumber(merged.value, 0, merged.locale)
    }

    return undefined
  })

  const [resolvedValue, setResolvedValue] = useControllableValue<number>({
    value: () => {
      const controlledValue = explicitControlledValue()
      if (controlledValue !== undefined) {
        return controlledValue
      }

      if (field.value() !== undefined) {
        return toNumber(field.value() as string | number | undefined, 0, merged.locale)
      }

      return undefined
    },
    defaultValue: () => initialDefaultValue,
  })

  const minValue = createMemo(() => merged.minValue ?? Number.MIN_SAFE_INTEGER)
  const maxValue = createMemo(() => merged.maxValue ?? Number.MAX_SAFE_INTEGER)
  const stepValue = createMemo(() => merged.step ?? 1)
  const largeStepValue = createMemo(() => merged.largeStep ?? stepValue() * 10)

  const currentValue = createMemo(() => clamp(resolvedValue() ?? 0, minValue(), maxValue()))
  const formattedValue = createMemo(() => formatLocaleNumber(currentValue(), merged.locale))
  const initialResetValue = untrack(currentValue)

  // Editable text is intentionally separate from the committed number so partial input survives.
  const [inputText, setInputText] = createSignal(
    untrack(() => formatLocaleNumber(initialResetValue, merged.locale)),
  )
  const [hasDirtyInput, setHasDirtyInput] = createSignal(false)
  const dataAttrs = createMemo(() => ({
    'data-invalid': field.invalid() ? '' : undefined,
    'data-disabled': field.disabled() ? '' : undefined,
    'data-readonly': readOnly() ? '' : undefined,
    'data-required': field.required() ? '' : undefined,
  }))

  // Explicit controlled props remain authoritative for FormField integrations.
  createEffect(() => {
    const value = explicitControlledValue()
    if (value !== undefined) {
      const boundedValue = clamp(value, minValue(), maxValue())
      const formValue = toNumber(field.value() as string | number | undefined, 0, merged.locale)
      if (!Object.is(formValue, boundedValue)) {
        field.setFormValue(boundedValue)
      }
    }
  })

  // Sync external numeric or locale changes without clobbering accepted manual text.
  createEffect(() => {
    const value = currentValue()
    const locale = merged.locale

    untrack(() => {
      if (hasDirtyInput()) {
        const parsed = parseLocaleNumber(inputText(), locale)
        if (parsed !== undefined && Object.is(clamp(parsed, minValue(), maxValue()), value)) {
          return
        }
      }

      setHasDirtyInput(false)
      setInputText(formatLocaleNumber(value, locale))
    })
  })

  const resolvedOrientation = createMemo<InputNumberOrientation>(
    () => merged.orientation ?? 'horizontal',
  )

  const incrementIcon = createMemo<IconT.Name>(() => {
    if (merged.incrementIcon) {
      return merged.incrementIcon
    }

    return resolvedOrientation() === 'vertical' ? 'icon-chevron-up' : 'icon-plus'
  })

  const decrementIcon = createMemo<IconT.Name>(() => {
    if (merged.decrementIcon) {
      return merged.decrementIcon
    }

    return resolvedOrientation() === 'vertical' ? 'icon-chevron-down' : 'icon-minus'
  })

  const isVertical = createMemo(() => resolvedOrientation() === 'vertical')
  const showIncrement = createMemo(() => merged.increment !== false)
  const showDecrement = createMemo(() => merged.decrement !== false)

  const slots = createMemo(() =>
    inputNumberRecipe({
      size: field.size(),
      variant: merged.variant,
      align: resolveInputNumberAlign(resolvedOrientation(), showDecrement()),
      orientation: resolvedOrientation(),
    }),
  )

  const resolved = resolveComponentStyle({
    get slots() {
      return slots()
    },
    get provider() {
      return provider()
    },
    get instance() {
      return {
        class: local.class,
        classes: local.classes,
        style: local.style,
        styles: local.styles,
      }
    },
  })

  function commitValue(nextValue: number): boolean {
    if (field.disabled() || readOnly() || !Number.isFinite(nextValue)) {
      return false
    }

    const boundedValue = clamp(nextValue, minValue(), maxValue())
    if (Object.is(boundedValue, currentValue())) {
      return false
    }

    const controlledValue = explicitControlledValue()

    if (controlledValue === undefined) {
      setResolvedValue(boundedValue)
      field.setFormValue(boundedValue)
    }

    merged.onRawValueChange?.(boundedValue)
    merged.onChange?.(formatLocaleNumber(boundedValue, merged.locale))

    if (controlledValue !== undefined) {
      const latestControlledValue = explicitControlledValue()
      field.setFormValue(
        latestControlledValue === undefined
          ? boundedValue
          : clamp(latestControlledValue, minValue(), maxValue()),
      )
    }

    field.emit('change')
    field.emit('input')
    return true
  }

  function getStepBase(): number {
    if (hasDirtyInput()) {
      const parsed = parseLocaleNumber(inputText(), merged.locale)
      if (parsed !== undefined) {
        return parsed
      }
    }

    return currentValue()
  }

  function stepBy(amount: number): void {
    const wasDirty = hasDirtyInput()
    const nextValue = addDecimal(getStepBase(), amount)
    const boundedValue = clamp(nextValue, minValue(), maxValue())
    const changed = commitValue(nextValue)

    if (changed && Object.is(currentValue(), boundedValue)) {
      setHasDirtyInput(false)
      setInputText(formattedValue())
      return
    }

    if (!wasDirty) {
      setInputText(formattedValue())
    }
  }

  function incrementValue(amount = stepValue()): void {
    stepBy(amount)
  }

  function decrementValue(amount = stepValue()): void {
    stepBy(-amount)
  }

  const selectionState = {
    count: 0,
    userSelect: '',
    webkitUserSelect: '',
  }

  const pressStates: Record<ControlKind, PressRepeatState> = {
    increment: {
      activePointerId: null,
      delayTimer: undefined,
      repeatTimer: undefined,
      repeatStarted: false,
      suppressNextClick: false,
      syntheticClicksPending: 0,
      lastTriggeredAt: 0,
      lastPointerType: undefined,
      targetEl: null,
    },
    decrement: {
      activePointerId: null,
      delayTimer: undefined,
      repeatTimer: undefined,
      repeatStarted: false,
      suppressNextClick: false,
      syntheticClicksPending: 0,
      lastTriggeredAt: 0,
      lastPointerType: undefined,
      targetEl: null,
    },
  }
  const [pressedControls, setPressedControls] = createSignal<Record<ControlKind, boolean>>({
    increment: false,
    decrement: false,
  })

  function setControlPressed(kind: ControlKind, pressed: boolean): void {
    setPressedControls((current) => {
      if (current[kind] === pressed) {
        return current
      }

      return { ...current, [kind]: pressed }
    })
  }

  function lockSelection(): void {
    if (typeof document === 'undefined') {
      return
    }

    if (selectionState.count === 0) {
      selectionState.userSelect = document.body.style.getPropertyValue('user-select')
      selectionState.webkitUserSelect = document.body.style.getPropertyValue('-webkit-user-select')
      document.body.style.setProperty('user-select', 'none')
      document.body.style.setProperty('-webkit-user-select', 'none')
    }

    selectionState.count += 1
  }

  function unlockSelection(): void {
    if (typeof document === 'undefined' || selectionState.count === 0) {
      return
    }

    selectionState.count -= 1

    if (selectionState.count === 0) {
      document.body.style.setProperty('user-select', selectionState.userSelect)
      document.body.style.setProperty('-webkit-user-select', selectionState.webkitUserSelect)
    }
  }

  function clearRepeatTimers(state: PressRepeatState): void {
    if (state.delayTimer) {
      clearTimeout(state.delayTimer)
      state.delayTimer = undefined
    }

    if (state.repeatTimer) {
      clearInterval(state.repeatTimer)
      state.repeatTimer = undefined
    }
  }

  function finishPress(kind: ControlKind, state: PressRepeatState, suppressClick: boolean): void {
    state.activePointerId = null
    state.targetEl = null
    state.suppressNextClick = suppressClick
    state.repeatStarted = false
    clearRepeatTimers(state)
    setControlPressed(kind, false)
    unlockSelection()
  }

  function isAllowedPointerType(pointerType: string): boolean {
    return merged.repeatPointerTypes === 'all' || merged.repeatPointerTypes === pointerType
  }

  function getControlUserOnClick(kind: ControlKind) {
    return kind === 'increment' ? merged.onIncrementClick : merged.onDecrementClick
  }

  function triggerControlClick(state: PressRepeatState): void {
    const throttleMs = Math.max(0, merged.repeatThrottleMs ?? 0)
    const now = Date.now()

    if (throttleMs > 0 && now - state.lastTriggeredAt < throttleMs) {
      return
    }

    state.lastTriggeredAt = now
    state.repeatStarted = true
    state.suppressNextClick = true
    state.syntheticClicksPending += 1
    state.targetEl?.click()
  }

  function onControlPointerDown(kind: ControlKind, event: PointerEvent): void {
    if (!merged.holdRepeat || event.button !== 0 || !isAllowedPointerType(event.pointerType)) {
      return
    }

    const state = pressStates[kind]

    if (state.activePointerId !== null) {
      return
    }

    state.activePointerId = event.pointerId
    state.targetEl = event.currentTarget as HTMLButtonElement
    state.lastPointerType = event.pointerType
    state.repeatStarted = false
    state.lastTriggeredAt = 0
    setControlPressed(kind, true)

    if (event.pointerType !== 'mouse' && event.cancelable) {
      event.preventDefault()
    }

    lockSelection()

    const delayMs = Math.max(0, merged.repeatDelayMs ?? 500)
    const intervalMs = Math.max(16, merged.repeatIntervalMs ?? 80)

    state.delayTimer = setTimeout(() => {
      if (state.activePointerId === null) {
        return
      }

      triggerControlClick(state)

      state.repeatTimer = setInterval(() => {
        if (state.activePointerId === null) {
          return
        }

        triggerControlClick(state)
      }, intervalMs)
    }, delayMs)
  }

  function onControlPointerUp(kind: ControlKind, event: PointerEvent): void {
    const state = pressStates[kind]

    if (state.activePointerId !== event.pointerId) {
      return
    }

    // Mouse pointerup is followed by a native click, so only synthesize for touch/pen.
    const shouldSynthesizeClick = !state.repeatStarted && state.lastPointerType !== 'mouse'

    if (shouldSynthesizeClick) {
      state.syntheticClicksPending += 1
      state.targetEl?.click()
    }

    finishPress(kind, state, state.repeatStarted || shouldSynthesizeClick)
  }

  function onControlPointerCancel(kind: ControlKind, event: PointerEvent): void {
    const state = pressStates[kind]

    if (state.activePointerId !== event.pointerId) {
      return
    }

    finishPress(kind, state, false)
  }

  function onControlPointerLeave(kind: ControlKind): void {
    const state = pressStates[kind]

    if (state.activePointerId === null) {
      return
    }

    finishPress(kind, state, false)
  }

  const onControlContextMenu: JSX.EventHandlerUnion<HTMLButtonElement, MouseEvent> = (event) => {
    const isTouchPointer = Object.values(pressStates).some(
      (state) =>
        state.targetEl === event.currentTarget &&
        (state.lastPointerType === 'touch' || state.lastPointerType === 'pen'),
    )

    if (isTouchPointer && event.cancelable) {
      event.preventDefault()
    }
  }

  function onControlClick(
    kind: ControlKind,
    event: Parameters<JSX.EventHandler<HTMLButtonElement, MouseEvent>>[0],
  ): void {
    const state = pressStates[kind]

    if (state.syntheticClicksPending > 0) {
      state.syntheticClicksPending -= 1
      callHandler(event, getControlUserOnClick(kind))
      if (!event.defaultPrevented) {
        if (kind === 'increment') {
          incrementValue()
        } else {
          decrementValue()
        }

        inputEl?.focus()
      }
      return
    }

    if (state.suppressNextClick) {
      state.suppressNextClick = false
      if (event.cancelable) {
        event.preventDefault()
      }
      event.stopPropagation()
      return
    }

    callHandler(event, getControlUserOnClick(kind))

    if (!event.defaultPrevented) {
      if (kind === 'increment') {
        incrementValue()
      } else {
        decrementValue()
      }

      inputEl?.focus()
    }
  }

  onCleanup(() => {
    clearRepeatTimers(pressStates.increment)
    clearRepeatTimers(pressStates.decrement)
    while (selectionState.count > 0) {
      unlockSelection()
    }
    setPressedControls({ increment: false, decrement: false })
  })

  function resolveControlProps(kind: ControlKind): InputNumberControlProps {
    const isIncrement = kind === 'increment'
    const isControlDisabled = (): boolean =>
      field.disabled() ||
      readOnly() ||
      (isIncrement
        ? Boolean(merged.incrementDisabled) || currentValue() >= maxValue()
        : Boolean(merged.decrementDisabled) || currentValue() <= minValue())

    return {
      'data-slot': kind,
      'data-variant': 'link',
      type: 'button',
      tabIndex: -1,
      'aria-label': isIncrement ? 'Increment' : 'Decrement',
      get 'data-size'() {
        return `icon-${field.size()}`
      },
      get 'aria-controls'() {
        return field.id()
      },
      get disabled() {
        return isControlDisabled()
      },
      get 'data-disabled'() {
        return isControlDisabled() ? '' : undefined
      },
      get 'data-active'() {
        return pressedControls()[kind] ? '' : undefined
      },
      get style() {
        return resolved.slotStyle(kind)
      },
      onClick: (event) => onControlClick(kind, event),
      onPointerDown: (event) => onControlPointerDown(kind, event),
      onPointerUp: (event) => onControlPointerUp(kind, event),
      onPointerCancel: (event) => onControlPointerCancel(kind, event),
      onLostPointerCapture: (event: PointerEvent) => onControlPointerCancel(kind, event),
      onPointerLeave: () => onControlPointerLeave(kind),
      onContextMenu: onControlContextMenu,
      get class() {
        return cn('select-none touch-none', resolved.slotClass(kind))
      },
    }
  }

  const onBlur: JSX.FocusEventHandler<HTMLInputElement, FocusEvent> = (event) => {
    const { defaultPrevented } = callHandler(event, merged.onBlur)
    if (defaultPrevented) {
      return
    }

    // On blur, try to parse and commit any partial input
    const rawInput = inputText()
    const parsed = parseLocaleNumber(rawInput, merged.locale)

    if (parsed !== undefined) {
      commitValue(parsed)
    }

    setHasDirtyInput(false)
    setInputText(formattedValue())

    field.emit('blur', event)
  }

  const onFocus: JSX.FocusEventHandler<HTMLInputElement, FocusEvent> = (event) => {
    const { defaultPrevented } = callHandler(event, merged.onFocus)
    if (defaultPrevented) {
      return
    }

    field.emit('focus', event)
  }

  const onWheel: JSX.EventHandler<HTMLInputElement, WheelEvent> = (event) => {
    if (
      !merged.wheel ||
      document.activeElement !== inputEl ||
      field.disabled() ||
      readOnly() ||
      event.ctrlKey ||
      event.deltaY === 0
    ) {
      return
    }

    if (event.cancelable) {
      event.preventDefault()
    }

    if (event.deltaY < 0) {
      incrementValue()
      return
    }

    decrementValue()
  }

  let autofocusTimeoutId: ReturnType<typeof setTimeout> | undefined

  onCleanup(() => {
    if (autofocusTimeoutId !== undefined) {
      clearTimeout(autofocusTimeoutId)
    }
  })

  useFormReset(
    () => inputEl?.form,
    () => {
      const controlledValue = explicitControlledValue()
      const nextValue = clamp(
        controlledValue === undefined ? initialResetValue : controlledValue,
        minValue(),
        maxValue(),
      )

      if (controlledValue === undefined) {
        setResolvedValue(nextValue)
      }
      field.setFormValue(nextValue)
      setHasDirtyInput(false)
      const nextInputText = formatLocaleNumber(nextValue, merged.locale)
      setInputText(nextInputText)
      if (inputEl) {
        inputEl.value = nextInputText
      }
    },
  )

  onMount(() => {
    if (inputEl) {
      inputEl.defaultValue = formatLocaleNumber(initialResetValue, merged.locale)
    }

    if (!merged.autofocus) {
      return
    }

    autofocusTimeoutId = setTimeout(() => {
      if (!field.disabled()) {
        inputEl?.focus()
      }
    }, merged.autofocusDelay ?? 0)
  })

  return (
    <div
      id={`${field.id()}-root`}
      role="group"
      data-slot="root"
      style={resolved.rootStyle()}
      class={cn('items-stretch', resolved.rootClass())}
      {...dataAttrs()}
      {...rest}
    >
      <Show when={!isVertical() && showDecrement()}>
        <button {...resolveControlProps('decrement')}>
          <Icon name={decrementIcon()} slotName="leading" />
        </button>
      </Show>

      <input
        type="text"
        inputMode="decimal"
        role="spinbutton"
        id={field.id()}
        ref={(e) => (inputEl = e)}
        name={field.name()}
        value={inputText()}
        required={field.required()}
        disabled={field.disabled()}
        readOnly={readOnly()}
        aria-valuemin={minValue()}
        aria-valuemax={maxValue()}
        aria-valuenow={currentValue()}
        aria-valuetext={formattedValue()}
        placeholder={merged.placeholder}
        data-slot="input"
        style={resolved.slotStyle('input')}
        class={resolved.slotClass('input')}
        onInput={(event) => {
          if (field.disabled() || readOnly()) {
            event.currentTarget.value = inputText()
            return
          }

          const rawInput = event.currentTarget.value
          setInputText(rawInput)
          setHasDirtyInput(true)

          // Only commit if it's a complete valid number
          const parsed = parseLocaleNumber(rawInput, merged.locale)
          if (parsed !== undefined && !isPartialNumber(rawInput, merged.locale)) {
            commitValue(parsed)
          }
        }}
        onChange={(event) => {
          if (field.disabled() || readOnly()) {
            event.currentTarget.value = inputText()
            return
          }

          const rawInput = event.currentTarget.value
          setInputText(rawInput)
          setHasDirtyInput(true)

          // On change (typically blur), try to parse and commit
          const parsed = parseLocaleNumber(rawInput, merged.locale)
          if (parsed !== undefined) {
            commitValue(parsed)
          } else if (rawInput.trim() === '' || isPartialNumber(rawInput, merged.locale)) {
            // Empty or partial input - keep current value but update display
            // This will be handled by onBlur
          } else {
            // Invalid input - revert to current value
            setInputText(formatLocaleNumber(currentValue(), merged.locale))
          }
        }}
        onKeyDown={(event) => {
          if (field.disabled() || readOnly()) {
            return
          }

          if (event.key === 'ArrowUp') {
            event.preventDefault()
            incrementValue()
            return
          }

          if (event.key === 'ArrowDown') {
            event.preventDefault()
            decrementValue()
            return
          }

          if (event.key === 'PageUp') {
            event.preventDefault()
            incrementValue(largeStepValue())
            return
          }

          if (event.key === 'PageDown') {
            event.preventDefault()
            decrementValue(largeStepValue())
            return
          }

          if (event.key === 'Home') {
            if (merged.minValue === undefined) {
              return
            }
            event.preventDefault()
            commitValue(minValue())
            setHasDirtyInput(false)
            setInputText(formattedValue())
            return
          }

          if (event.key === 'End') {
            if (merged.maxValue === undefined) {
              return
            }
            event.preventDefault()
            commitValue(maxValue())
            setHasDirtyInput(false)
            setInputText(formattedValue())
            return
          }

          if (event.key === 'Enter') {
            const parsed = parseLocaleNumber(inputText(), merged.locale)
            if (parsed !== undefined) {
              commitValue(parsed)
            }
            setHasDirtyInput(false)
            setInputText(formattedValue())
          }
        }}
        onBlur={onBlur}
        onFocus={onFocus}
        onWheel={onWheel}
        {...dataAttrs()}
        {...field.ariaAttrs()}
      />

      <Show when={isVertical() && (showIncrement() || showDecrement())}>
        <div
          data-slot="controls"
          class={inputNumberControlColumnVariants({
            size: field.size(),
          })}
        >
          <Show when={showIncrement()}>
            <button {...resolveControlProps('increment')}>
              <Icon name={incrementIcon()} slotName="leading" />
            </button>
          </Show>
          <Show when={showDecrement()}>
            <button {...resolveControlProps('decrement')}>
              <Icon name={decrementIcon()} slotName="leading" />
            </button>
          </Show>
        </div>
      </Show>

      <Show when={!isVertical() && showIncrement()}>
        <button {...resolveControlProps('increment')}>
          <Icon name={incrementIcon()} slotName="leading" />
        </button>
      </Show>
    </div>
  )
}
