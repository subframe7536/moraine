import type { JSX } from 'solid-js'
import {
  createEffect,
  createMemo,
  createSignal,
  mergeProps,
  onCleanup,
  onMount,
  Show,
} from 'solid-js'

import { Button } from '../../elements/button'
import type { ButtonT } from '../../elements/button'
import type { IconT } from '../../elements/icon'
import { Icon } from '../../elements/icon'
import { HiddenInput } from '../../shared/hidden-input'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types'
import { useControllableValue } from '../../shared/use-controllable-value'
import { callHandler, useId } from '../../shared/utils'
import { useFormField } from '../form-field/form-field-context'
import type {
  FormDisableOption,
  FormIdentityOptions,
  FormReadOnlyOption,
  FormRequiredOption,
} from '../form-field/form-options'

import type { InputNumberOrientation, InputNumberVariantProps } from './input-number.class'
import {
  inputNumberBaseVariants,
  inputNumberControlButtonVariants,
  inputNumberControlColumnVariants,
  inputNumberRootVariants,
  resolveInputNumberAlign,
} from './input-number.class'

type ControlKind = 'increment' | 'decrement'
type PointerType = 'mouse' | 'touch' | 'pen'

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

function toNumber(value: string | number | undefined, fallback: number): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : fallback
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }

  return fallback
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export namespace InputNumberT {
  export interface Slot<T = unknown> {
    /**
     * Number input wrapper that owns the input and step controls.
     * @deprecated Use top-level `class` and `style` props for the component root.
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
  export type Extend = never

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
     * The orientation of the control buttons.
     * @default 'horizontal'
     */
    orientation?: InputNumberOrientation

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
  export interface Props extends BaseProps<Base, Variant, Extend, Classes, Styles> {}
}

/**
 * Props for the InputNumber component.
 */
export interface InputNumberProps extends InputNumberT.Props {}

/** Numeric input with increment/decrement controls, step, and min/max constraints. */
export function InputNumber(props: InputNumberProps): JSX.Element {
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
    props,
  )

  const generatedId = useId(() => merged.id, 'input-number')
  const field = useFormField(
    () => ({
      id: merged.id,
      name: merged.name,
      size: merged.size,
      disabled: merged.disabled,
    }),
    () => ({
      defaultId: generatedId(),
      defaultSize: 'md',
      initialValue: merged.rawValue ?? merged.value ?? merged.defaultValue ?? 0,
    }),
  )

  let inputEl: HTMLInputElement | undefined

  // Track the raw input string separately from the committed numeric value
  const [inputText, setInputText] = createSignal<string>('')

  const [resolvedValue, setResolvedValue] = useControllableValue<number>({
    value: () => {
      if (merged.rawValue !== undefined) {
        return toNumber(merged.rawValue, 0)
      }

      if (merged.value !== undefined) {
        return toNumber(merged.value, 0)
      }

      if (field.value() !== undefined) {
        return toNumber(field.value() as string | number | undefined, 0)
      }

      return undefined
    },
    defaultValue: () => toNumber(merged.defaultValue, 0),
  })

  const minValue = createMemo(() => merged.minValue ?? Number.MIN_SAFE_INTEGER)
  const maxValue = createMemo(() => merged.maxValue ?? Number.MAX_SAFE_INTEGER)
  const stepValue = createMemo(() => merged.step ?? 1)
  const largeStepValue = createMemo(() => merged.largeStep ?? stepValue() * 10)
  const readOnly = createMemo(() => Boolean(merged.readOnly))

  const currentValue = createMemo(() => clamp(resolvedValue() ?? 0, minValue(), maxValue()))
  const dataAttrs = createMemo(() => ({
    'data-invalid': field.invalid() ? '' : undefined,
    'data-disabled': field.disabled() ? '' : undefined,
    'data-readonly': readOnly() ? '' : undefined,
    'data-required': merged.required ? '' : undefined,
  }))

  // Sync inputText with currentValue when it changes externally
  createEffect(() => {
    const value = currentValue()
    const formatted = formatLocaleNumber(value, merged.locale)
    // Update inputText when value changes from external source
    // This handles controlled components and initial values
    setInputText(formatted)
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

  const isBorderless = createMemo(() => merged.variant === 'ghost' || merged.variant === 'none')

  function commitValue(nextValue: number): void {
    if (field.disabled() || readOnly()) {
      return
    }

    const boundedValue = clamp(nextValue, minValue(), maxValue())

    setResolvedValue(boundedValue)
    // Don't update inputText here - let the effect handle it based on currentValue
    // This ensures controlled components work correctly

    field.setFormValue(boundedValue)
    merged.onRawValueChange?.(boundedValue)
    merged.onChange?.(String(boundedValue))
    field.emit('change')
    field.emit('input')
  }

  function incrementValue(amount = stepValue()): void {
    commitValue(currentValue() + amount)
  }

  function decrementValue(amount = stepValue()): void {
    commitValue(currentValue() - amount)
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

  function finishPress(state: PressRepeatState, suppressClick: boolean): void {
    state.activePointerId = null
    state.targetEl = null
    state.suppressNextClick = suppressClick
    state.repeatStarted = false
    clearRepeatTimers(state)
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

    finishPress(state, state.repeatStarted || shouldSynthesizeClick)
  }

  function onControlPointerCancel(kind: ControlKind, event: PointerEvent): void {
    const state = pressStates[kind]

    if (state.activePointerId !== event.pointerId) {
      return
    }

    finishPress(state, false)
  }

  function onControlPointerLeave(kind: ControlKind): void {
    const state = pressStates[kind]

    if (state.activePointerId === null) {
      return
    }

    finishPress(state, false)
  }

  const onControlContextMenu: JSX.EventHandlerUnion<HTMLButtonElement, MouseEvent> = (event) => {
    const eventTarget = event.currentTarget as HTMLButtonElement
    const isTouchPointer = Object.values(pressStates).some(
      (state) =>
        state.targetEl === eventTarget &&
        (state.lastPointerType === 'touch' || state.lastPointerType === 'pen'),
    )

    if (isTouchPointer && event.cancelable) {
      event.preventDefault()
    }
  }

  function onControlClick(kind: ControlKind, event: MouseEvent): void {
    const state = pressStates[kind]

    if (state.syntheticClicksPending > 0) {
      state.syntheticClicksPending -= 1
      const { defaultPrevented } = callHandler(event, getControlUserOnClick(kind))
      if (!defaultPrevented) {
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

    const { defaultPrevented } = callHandler(event, getControlUserOnClick(kind))

    if (!defaultPrevented) {
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
    unlockSelection()
  })

  function resolveControlProps(kind: ControlKind): ButtonT.Props {
    const isIncrement = kind === 'increment'

    return {
      slotName: kind,
      styles: { root: merged.styles?.[kind] },
      disabled:
        field.disabled() ||
        (isIncrement
          ? merged.incrementDisabled || currentValue() >= maxValue()
          : merged.decrementDisabled || currentValue() <= minValue()),
      variant: 'ghost',
      size: `icon-${field.size()}`,
      'aria-label': isIncrement ? 'Increment' : 'Decrement',
      leading: <Icon name={isIncrement ? incrementIcon() : decrementIcon()} />,
      onClick: (event) => onControlClick(kind, event),
      onPointerDown: (event) => onControlPointerDown(kind, event),
      onPointerUp: (event) => onControlPointerUp(kind, event),
      onPointerCancel: (event) => onControlPointerCancel(kind, event),
      onPointerLeave: () => onControlPointerLeave(kind),
      onContextMenu: onControlContextMenu,
      classes: {
        root: inputNumberControlButtonVariants(
          {
            control: kind,
            divided: !isIncrement && isVertical() && merged.increment,
            orientation: resolvedOrientation(),
          },
          'select-none touch-none',
          isBorderless() && 'border-transparent',
          merged.variant === 'none' && 'hover:bg-transparent',
          merged.classes?.[kind],
        ),
      },
    } as const
  }

  function IncrementControl(): JSX.Element {
    return <Button as="button" {...resolveControlProps('increment')} />
  }

  function DecrementControl(): JSX.Element {
    return <Button as="button" {...resolveControlProps('decrement')} />
  }

  const onBlur: JSX.FocusEventHandlerUnion<HTMLInputElement, FocusEvent> = (event) => {
    // On blur, try to parse and commit any partial input
    const rawInput = inputText()
    const parsed = parseLocaleNumber(rawInput, merged.locale)

    if (parsed !== undefined) {
      // Valid number (including partial like "7.") - commit it
      commitValue(parsed)
    } else {
      // Invalid or empty - revert to current value
      setInputText(formatLocaleNumber(currentValue(), merged.locale))
    }

    callHandler(event, merged.onBlur as any)
    field.emit('blur')
  }

  const onFocus: JSX.FocusEventHandlerUnion<HTMLInputElement, FocusEvent> = (event) => {
    callHandler(event, merged.onFocus as any)
    field.emit('focus')
  }

  const onWheel: JSX.EventHandlerUnion<HTMLInputElement, WheelEvent> = (event) => {
    if (!merged.wheel || (document.activeElement !== inputEl && !field.disabled())) {
      return
    }

    if (event.cancelable) {
      event.preventDefault()
    }

    if (field.disabled() || readOnly() || event.deltaY === 0) {
      return
    }

    if (event.deltaY < 0) {
      incrementValue()
      return
    }

    decrementValue()
  }

  onMount(() => {
    if (!merged.autofocus) {
      return
    }

    const autofocusTimeoutId = setTimeout(() => {
      inputEl?.focus()
    }, merged.autofocusDelay ?? 0)

    onCleanup(() => {
      clearTimeout(autofocusTimeoutId)
    })
  })

  return (
    <div
      id={`${field.id()}-root`}
      role="group"
      data-slot="root"
      style={{ ...merged.styles?.root, ...merged.style }}
      class={inputNumberRootVariants(
        {
          size: field.size(),
          variant: merged.variant,
        },
        merged.classes?.root,
        merged.class,
      )}
      {...dataAttrs()}
    >
      <Show when={!isVertical() && merged.decrement}>
        <DecrementControl />
      </Show>

      <input
        type="text"
        inputMode="decimal"
        role="spinbutton"
        id={field.id()}
        ref={(e) => (inputEl = e)}
        name={field.name()}
        value={inputText()}
        required={merged.required}
        disabled={field.disabled()}
        readOnly={readOnly()}
        aria-required={merged.required || undefined}
        aria-disabled={field.disabled() || undefined}
        aria-readonly={readOnly() || undefined}
        aria-valuemin={minValue()}
        aria-valuemax={maxValue()}
        aria-valuenow={currentValue()}
        placeholder={merged.placeholder}
        data-slot="input"
        style={merged.styles?.input}
        class={inputNumberBaseVariants(
          {
            size: field.size(),
            align: resolveInputNumberAlign(resolvedOrientation(), merged.decrement),
          },
          merged.classes?.input,
        )}
        onInput={(event) => {
          const rawInput = event.currentTarget.value
          setInputText(rawInput)

          // Only commit if it's a complete valid number
          const parsed = parseLocaleNumber(rawInput, merged.locale)
          if (parsed !== undefined && !isPartialNumber(rawInput, merged.locale)) {
            commitValue(parsed)
          }
        }}
        onChange={(event) => {
          const rawInput = event.currentTarget.value
          setInputText(rawInput)

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
            event.preventDefault()
            commitValue(minValue())
            return
          }

          if (event.key === 'End') {
            event.preventDefault()
            commitValue(maxValue())
          }
        }}
        onBlur={onBlur}
        onFocus={onFocus}
        onWheel={onWheel}
        {...dataAttrs()}
        {...field.ariaAttrs()}
      />

      <HiddenInput type="hidden" visuallyHidden={false} name={field.name()} value={inputText()} />

      <Show when={isVertical() && (merged.increment || merged.decrement)}>
        <div
          data-slot="controls"
          class={inputNumberControlColumnVariants({
            size: field.size(),
            borderless: isBorderless(),
          })}
        >
          <Show when={merged.increment}>
            <IncrementControl />
          </Show>
          <Show when={merged.decrement}>
            <DecrementControl />
          </Show>
        </div>
      </Show>

      <Show when={!isVertical() && merged.increment}>
        <IncrementControl />
      </Show>
    </div>
  )
}
