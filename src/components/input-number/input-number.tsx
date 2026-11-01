import type { JSX } from 'solid-js'
import {
  createEffect,
  createMemo,
  createSignal,
  mergeProps,
  on,
  onCleanup,
  onMount,
  splitProps,
  Show,
  untrack,
} from 'solid-js'
import { delegateEvents } from 'solid-js/web'

import { useRecipe } from '../../provider'
import { useLocale, useMessages } from '../../provider/locale/locale-context'
import {
  formatLocaleNumber,
  isPartialNumber,
  parseLocaleNumber,
  toNumber,
} from '../../provider/locale/number'
import { createControllableValue } from '../../shared/controllable-value'
import { createKeyDownHandler } from '../../shared/keyboard'
import { callHandler, callRef, createId } from '../../shared/utils'
import { useFormField, useFieldContext } from '../field/field-context'
import type { IconT } from '../icon'
import { Icon } from '../icon'
import { mergeFieldAriaAttributes } from '../shared/form/field-aria'
import { useFormReset } from '../shared/form/use-form-reset'
import { getActiveElement } from '../shared/overlay/dom'

import type { ControlKind } from './input-number-press'
import { createInputNumberPress } from './input-number-press'
import { defaultInputNumberMessages } from './input-number.messages'
import { inputNumberDataAttributes, inputNumberRecipe } from './input-number.recipe'
import type { InputNumberProps } from './input-number.types'

/** iPhone/iPad, including iPadOS that reports as MacIntel. */
function isIOSUserAgent(): boolean {
  const userAgent = globalThis.navigator?.userAgent ?? ''
  if (/iPad|iPhone|iPod/i.test(userAgent)) {
    return true
  }
  return (
    globalThis.navigator?.platform === 'MacIntel' && (globalThis.navigator.maxTouchPoints ?? 0) > 1
  )
}

type InputNumberControlProps = JSX.ButtonHTMLAttributes<HTMLButtonElement> & {
  [key: `data-${string}`]: string | undefined
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

/** Numeric input with increment/decrement controls, step, and min/max constraints. */
export function InputNumber(props: InputNumberProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'ref',
    'inputRef',
    'id',
    'name',
    'form',
    'value',
    'defaultValue',
    'rawValue',
    'minValue',
    'maxValue',
    'step',
    'largeStep',
    'locale',
    'onValueChange',
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
    'aria-label',
    'aria-labelledby',
    'aria-describedby',
    'aria-invalid',
    'aria-required',
    'aria-disabled',
    'aria-readonly',
    'size',
    'variant',
    'classes',
    'styles',
    'class',
    'style',
    'translations',
  ])
  const themeField = useFieldContext()
  const messages = useMessages('inputNumber', defaultInputNumberMessages, () => local.translations)
  const providerLocale = useLocale().locale
  const locale = () => local.locale ?? providerLocale()
  const {
    slots,
    slots: { root: rootSlot, input: inputSlot, controls: controlsSlot },
    variants,
  } = useRecipe(inputNumberRecipe, local, {
    data: {
      root: inputNumberDataAttributes.root(() => fieldDataState),
      input: inputNumberDataAttributes.input(() => ({
        ...fieldDataState,
        autoAlign: (): boolean => variants.align === undefined && !isVertical() && !showDecrement(),
      })),
      increment: inputNumberDataAttributes.increment(() => ({
        active: () => press.isActive('increment'),
        disabled: () => !isControlInteractive('increment'),
      })),
      decrement: inputNumberDataAttributes.decrement(() => ({
        active: () => press.isActive('decrement'),
        disabled: () => !isControlInteractive('decrement'),
      })),
    },
    context: () => ({ variants: { size: themeField?.size } }),
  })

  const merged = mergeProps(
    {
      holdRepeat: true,
      repeatPointerTypes: 'all' as const,
    },
    local,
  )

  const initialDefaultValue = untrack(() => toNumber(merged.defaultValue, 0, locale()))
  const initialValue = untrack(() => {
    if (merged.rawValue !== undefined) {
      return toNumber(merged.rawValue, 0)
    }

    if (merged.value !== undefined) {
      return toNumber(merged.value, 0, locale())
    }

    return initialDefaultValue
  })

  const generatedId = createId(() => merged.id, 'input-number')
  const field = useFormField(merged, {
    get defaultId() {
      return generatedId()
    },
    initialValue,
  })
  const readOnly = field.readOnly

  let inputEl: HTMLInputElement | undefined

  const explicitControlledValue = createMemo<number | undefined>(() => {
    if (merged.rawValue !== undefined) {
      return toNumber(merged.rawValue, 0)
    }

    if (merged.value !== undefined) {
      return toNumber(merged.value, 0, locale())
    }

    return undefined
  })

  const [resolvedValue, setResolvedValue] = createControllableValue<number>({
    value: () => {
      const controlledValue = explicitControlledValue()
      if (controlledValue !== undefined) {
        return controlledValue
      }

      if (field.value() !== undefined) {
        return toNumber(field.value() as string | number | undefined, 0, locale())
      }

      return undefined
    },
    defaultValue: () => initialDefaultValue,
  })

  const minValue = () => merged.minValue ?? Number.MIN_SAFE_INTEGER
  const maxValue = () => merged.maxValue ?? Number.MAX_SAFE_INTEGER
  const stepValue = () => (typeof merged.step === 'number' ? merged.step : Number(merged.step) || 1)
  const largeStepValue = () =>
    typeof merged.largeStep === 'number'
      ? merged.largeStep
      : Number(merged.largeStep) || stepValue() * 10

  const currentValue = createMemo(() => clamp(resolvedValue(), minValue(), maxValue()))
  const formattedValue = createMemo(() => formatLocaleNumber(currentValue(), locale()))
  const initialResetValue = untrack(currentValue)

  // Draft text exists only while actively typing uncommitted or partial input.
  const [draftText, setDraftText] = createSignal<string>()

  // Explicit controlled props remain authoritative for Field integrations.
  createEffect(
    on(
      [explicitControlledValue, minValue, maxValue, field.value, locale],
      ([value, min, max, formValue, localeTag]) => {
        if (value === undefined) {
          return
        }
        const boundedValue = clamp(value, min, max)
        if (
          !Object.is(toNumber(formValue as string | number | undefined, 0, localeTag), boundedValue)
        ) {
          field.setFormValue(boundedValue)
        }
      },
    ),
  )

  // Sync external numeric or locale changes without clobbering accepted manual text.
  createEffect(
    on([currentValue, locale], ([value, localeTag]) => {
      const draft = draftText()
      if (draft !== undefined) {
        const parsed = parseLocaleNumber(draft, localeTag)
        if (parsed !== undefined && Object.is(clamp(parsed, minValue(), maxValue()), value)) {
          return
        }
        setDraftText(undefined)
      }
    }),
  )

  const incrementIcon = (): IconT.Name => {
    if (merged.incrementIcon) {
      return merged.incrementIcon
    }

    return variants.orientation === 'vertical' ? 'icon-chevron-up' : 'icon-plus'
  }

  const decrementIcon = (): IconT.Name => {
    if (merged.decrementIcon) {
      return merged.decrementIcon
    }

    return variants.orientation === 'vertical' ? 'icon-chevron-down' : 'icon-minus'
  }

  const isVertical = createMemo(() => variants.orientation === 'vertical')
  const showIncrement = createMemo(() => merged.increment !== false)
  const showDecrement = createMemo(() => merged.decrement !== false)
  const fieldDataState = {
    invalid: field.invalid,
    disabled: field.disabled,
    readonly: readOnly,
    required: field.required,
  }

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
    merged.onValueChange?.(formatLocaleNumber(boundedValue, locale()))

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
    const draft = draftText()
    if (draft !== undefined) {
      const parsed = parseLocaleNumber(draft, locale())
      if (parsed !== undefined) {
        return parsed
      }
    }

    return currentValue()
  }

  function stepBy(amount: number): boolean {
    const wasDirty = draftText() !== undefined
    const nextValue = addDecimal(getStepBase(), amount)
    const boundedValue = clamp(nextValue, minValue(), maxValue())
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

  function incrementValue(amount = stepValue()): boolean {
    return stepBy(amount)
  }

  function decrementValue(amount = stepValue()): boolean {
    return stepBy(-amount)
  }

  function isControlInteractive(kind: ControlKind): boolean {
    const isIncrement = kind === 'increment'
    return (
      !field.disabled() &&
      !readOnly() &&
      (isIncrement ? showIncrement() : showDecrement()) &&
      !(isIncrement
        ? Boolean(merged.incrementDisabled) || currentValue() >= maxValue()
        : Boolean(merged.decrementDisabled) || currentValue() <= minValue())
    )
  }

  const press = createInputNumberPress({
    isInteractive: isControlInteractive,
    onStep: (kind) => {
      if (kind === 'increment') {
        incrementValue()
      } else {
        decrementValue()
      }
    },
    getUserOnClick: (kind) =>
      kind === 'increment' ? merged.onIncrementClick : merged.onDecrementClick,
    focusInput: () => inputEl?.focus(),
    getDocument: () => inputEl?.ownerDocument,
    holdRepeat: () => merged.holdRepeat,
    repeatDelayMs: () => merged.repeatDelayMs,
    repeatIntervalMs: () => merged.repeatIntervalMs,
    repeatThrottleMs: () => merged.repeatThrottleMs,
    repeatPointerTypes: () => merged.repeatPointerTypes,
  })

  function resolveControlProps(kind: ControlKind): InputNumberControlProps {
    const isIncrement = kind === 'increment'
    const isControlDisabled = (): boolean => !isControlInteractive(kind)
    const controlProps = mergeProps(slots[kind], {
      'data-slot': `input-number-${kind}`,
      type: 'button',
      tabIndex: -1,
      get 'aria-label'() {
        return isIncrement ? messages().increment : messages().decrement
      },
      get 'aria-controls'() {
        return field.id()
      },
      get disabled() {
        return isControlDisabled()
      },
      ...press.handlers(kind),
    })
    return controlProps as InputNumberControlProps
  }

  const onBlur: JSX.FocusEventHandler<HTMLInputElement, FocusEvent> = (event) => {
    const { defaultPrevented } = callHandler(event, merged.onBlur)
    if (defaultPrevented) {
      return
    }

    const draft = draftText()
    if (draft !== undefined) {
      const parsed = parseLocaleNumber(draft, locale())
      if (parsed !== undefined) {
        commitValue(parsed)
      }
      setDraftText(undefined)
    }

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
    const ownerDocument = inputEl?.ownerDocument
    if (
      !merged.wheel ||
      !ownerDocument ||
      getActiveElement(ownerDocument) !== inputEl ||
      field.disabled() ||
      readOnly() ||
      event.ctrlKey
    ) {
      return
    }

    const isHorizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY)
    const delta = event.shiftKey && isHorizontal ? event.deltaX : event.deltaY
    if (delta === 0 || (!event.shiftKey && isHorizontal)) {
      return
    }

    if (event.cancelable) {
      event.preventDefault()
    }

    if (delta < 0) {
      incrementValue(event.shiftKey ? largeStepValue() : stepValue())
      return
    }

    decrementValue(event.shiftKey ? largeStepValue() : stepValue())
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
      setDraftText(undefined)
      if (inputEl) {
        inputEl.value = formatLocaleNumber(nextValue, locale())
      }
    },
  )

  onMount(() => {
    if (inputEl) {
      inputEl.defaultValue = formatLocaleNumber(initialResetValue, locale())

      // Solid delegates these events on the global document by default.
      if (inputEl.ownerDocument !== document) {
        delegateEvents(
          ['click', 'contextmenu', 'input', 'keydown', 'pointerdown', 'pointerup'],
          inputEl.ownerDocument,
        )
      }
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

  const onInputKeyDown = createKeyDownHandler<HTMLInputElement>({
    disabled: () => field.disabled() || readOnly(),
    keys: {
      ArrowUp: () => incrementValue(),
      ArrowDown: () => decrementValue(),
      PageUp: () => incrementValue(largeStepValue()),
      PageDown: () => decrementValue(largeStepValue()),
      Home: {
        when: () => merged.minValue !== undefined,
        handle: () => {
          commitValue(minValue())
          setDraftText(undefined)
        },
      },
      End: {
        when: () => merged.maxValue !== undefined,
        handle: () => {
          commitValue(maxValue())
          setDraftText(undefined)
        },
      },
      Enter: {
        preventDefault: false,
        handle: () => {
          const draft = draftText()
          if (draft !== undefined) {
            const parsed = parseLocaleNumber(draft, locale())
            if (parsed !== undefined) {
              commitValue(parsed)
            }
            setDraftText(undefined)
          }
        },
      },
    },
  })

  return (
    <div
      role="group"
      data-slot="input-number"
      {...rootSlot}
      {...rest}
      id={`${field.id()}-root`}
      ref={(element) => callRef(local.ref, element)}
    >
      <Show when={!isVertical() && showDecrement()}>
        <button {...resolveControlProps('decrement')}>
          <Icon name={decrementIcon()} />
        </button>
      </Show>

      <input
        data-slot="input-number-input"
        type="text"
        // iOS decimal/numeric keyboards omit the minus key.
        inputMode={isIOSUserAgent() && minValue() < 0 ? 'text' : 'decimal'}
        role="spinbutton"
        placeholder={merged.placeholder}
        {...inputSlot}
        ref={(e) => {
          inputEl = e
          field.setControlRef(e)
          callRef(local.inputRef, e)
        }}
        id={field.id()}
        name={field.name()}
        form={merged.form}
        value={draftText() ?? formattedValue()}
        required={field.required()}
        disabled={field.disabled()}
        readonly={readOnly()}
        aria-valuemin={minValue()}
        aria-valuemax={maxValue()}
        aria-valuenow={currentValue()}
        aria-valuetext={formattedValue()}
        onInput={(event) => {
          if (field.disabled() || readOnly()) {
            event.currentTarget.value = draftText() ?? formattedValue()
            return
          }

          const rawInput = event.currentTarget.value
          setDraftText(rawInput)

          // Only commit if it's a complete valid number
          const parsed = parseLocaleNumber(rawInput, locale())
          if (parsed !== undefined && !isPartialNumber(rawInput, locale())) {
            commitValue(parsed)
          }
        }}
        onChange={(event) => {
          if (field.disabled() || readOnly()) {
            event.currentTarget.value = draftText() ?? formattedValue()
            return
          }

          const rawInput = event.currentTarget.value
          setDraftText(rawInput)

          // On change (typically blur), try to parse and commit
          const parsed = parseLocaleNumber(rawInput, locale())
          if (parsed !== undefined) {
            commitValue(parsed)
          } else if (rawInput.trim() === '' || isPartialNumber(rawInput, locale())) {
            // Empty or partial input - wait for blur
          } else {
            // Invalid input - revert to current value
            setDraftText(undefined)
          }
        }}
        onKeyDown={onInputKeyDown}
        onBlur={onBlur}
        onFocus={onFocus}
        onWheel={onWheel}
        {...mergeFieldAriaAttributes(local, field.ariaAttrs())}
      />

      <Show when={isVertical() && (showIncrement() || showDecrement())}>
        <div data-slot="input-number-controls" {...controlsSlot}>
          <Show when={showIncrement()}>
            <button {...resolveControlProps('increment')}>
              <Icon name={incrementIcon()} />
            </button>
          </Show>
          <Show when={showDecrement()}>
            <button {...resolveControlProps('decrement')}>
              <Icon name={decrementIcon()} />
            </button>
          </Show>
        </div>
      </Show>

      <Show when={!isVertical() && showIncrement()}>
        <button {...resolveControlProps('increment')}>
          <Icon name={incrementIcon()} />
        </button>
      </Show>
    </div>
  )
}
