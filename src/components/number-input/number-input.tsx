import type { JSX } from '@solidjs/web'
import { delegateEvents, registerDelegatedContainer } from '@solidjs/web'
import {
  createEffect,
  createMemo,
  createSignal,
  merge,
  onCleanup,
  onSettled,
  Show,
  untrack,
  omit,
} from 'solid-js'

import { useRecipe } from '../../provider'
import { useLocale, useMessages } from '../../provider/locale/locale-context'
import { toNumber } from '../../provider/locale/number'
import { HiddenInput } from '../../shared/hidden-input'
import { createKeyDownHandler } from '../../shared/keyboard'
import { callHandler, callRef, createId, pick } from '../../shared/utils'
import { useFormField, useFieldContext } from '../field/field-context'
import type { IconT } from '../icon'
import { Icon } from '../icon'
import { mergeFieldAriaAttributes } from '../shared/form/field-aria'
import { useFormReset } from '../shared/form/use-form-reset'
import { useHiddenInputValidation } from '../shared/form/use-hidden-input-validation'
import { getActiveElement } from '../shared/overlay/dom'

import type { ControlKind, RepeatConfig } from './number-input-press'
import { createNumberInputPress } from './number-input-press'
import { clamp, createNumberInput } from './number-input-state'
import { defaultNumberInputMessages } from './number-input.messages'
import { numberInputDataAttributes, numberInputRecipe } from './number-input.recipe'
import type { NumberInputProps, NumberInputT } from './number-input.types'
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

type NumberInputControlProps = JSX.ButtonHTMLAttributes<HTMLButtonElement> & {
  [key: `data-${string}`]: string | undefined
}

/**
 * Numeric field with increment and decrement buttons, `step` and `min`/`max` constraints, and
 * locale-aware formatting. Use it for a numeric field with step controls; use a plain `Input`
 * when free-form numeric text is required and `Slider` when the value is chosen spatially. The
 * value is a plain `number`, or `null` while the input is empty; it is uncontrolled with
 * `defaultValue` or controlled through `value` and `onValueChange`, and clearing the input emits
 * `null`. Wrap it in `Field` for a label, description, and validation message.
 *
 * @example
 * ```tsx
 * import { createSignal, merge, omit } from 'solid-js'
 * import { Field, NumberInput } from 'moraine'
 *
 * const [quantity, setQuantity] = createSignal<number | null>(1)
 *
 * <Field label="Quantity">
 *   <NumberInput value={quantity()} onValueChange={setQuantity} min={0} max={10} step={1} />
 * </Field>
 * ```
 */
export function NumberInput(props: NumberInputProps): JSX.Element {
  const local = pick(
    props,
    'ref',
    'inputRef',
    'id',
    'name',
    'form',
    'value',
    'defaultValue',
    'min',
    'max',
    'step',
    'largeStep',
    'locale',
    'formatOptions',
    'stepSnapping',
    'onValueChange',
    'orientation',
    'placeholder',
    'increment',
    'incrementIcon',
    'incrementDisabled',
    'decrement',
    'decrementIcon',
    'decrementDisabled',
    'autoFocus',
    'wheel',
    'autoFocusDelay',
    'onBlur',
    'onFocus',
    'onStep',
    'repeat',
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
  )
  const rest = omit(
    props,
    'ref',
    'inputRef',
    'id',
    'name',
    'form',
    'value',
    'defaultValue',
    'min',
    'max',
    'step',
    'largeStep',
    'locale',
    'formatOptions',
    'stepSnapping',
    'onValueChange',
    'orientation',
    'placeholder',
    'increment',
    'incrementIcon',
    'incrementDisabled',
    'decrement',
    'decrementIcon',
    'decrementDisabled',
    'autoFocus',
    'wheel',
    'autoFocusDelay',
    'onBlur',
    'onFocus',
    'onStep',
    'repeat',
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
  )
  const themeField = useFieldContext()
  const messages = useMessages('numberInput', defaultNumberInputMessages, () => local.translations)
  const providerLocale = useLocale().locale
  const locale = () => local.locale ?? providerLocale()
  const {
    slots,
    slots: { root: rootSlot, input: inputSlot, controls: controlsSlot },
    variants,
  } = useRecipe(numberInputRecipe, local, {
    data: {
      root: numberInputDataAttributes.root(() => fieldDataState),
      input: numberInputDataAttributes.input(() => ({
        ...fieldDataState,
        autoAlign: (): boolean =>
          variants.textAlign === undefined && !isVertical() && !showDecrement(),
      })),
      increment: numberInputDataAttributes.increment(() => ({
        active: () => press.isActive('increment'),
        disabled: () => !isControlInteractive('increment'),
      })),
      decrement: numberInputDataAttributes.decrement(() => ({
        active: () => press.isActive('decrement'),
        disabled: () => !isControlInteractive('decrement'),
      })),
    },
    context: () => ({ variants: { size: themeField?.size } }),
  })

  const merged = merge(
    {
      stepSnapping: true,
    },
    local,
  )
  const formatOptions = () => merged.formatOptions

  const initialDefaultValue = untrack(() => merged.defaultValue ?? null)
  const initialValue = untrack(() =>
    merged.value === undefined ? initialDefaultValue : merged.value,
  )

  const generatedId = createId(() => merged.id, 'number-input')
  const field = useFormField(merged, {
    get defaultId() {
      return generatedId()
    },
    initialValue: initialValue ?? undefined,
  })
  const readOnly = field.readOnly

  let inputEl: HTMLInputElement | undefined

  const { nativeInvalid, resetNativeInvalid, onInvalid } = useHiddenInputValidation({
    focusTarget: () => inputEl,
  })

  const explicitControlledValue = () => merged.value

  const min = () => merged.min ?? Number.MIN_SAFE_INTEGER
  const max = () => merged.max ?? Number.MAX_SAFE_INTEGER
  const stepValue = () => (typeof merged.step === 'number' ? merged.step : Number(merged.step) || 1)
  const largeStepValue = () =>
    typeof merged.largeStep === 'number'
      ? merged.largeStep
      : Number(merged.largeStep) || stepValue() * 10

  const state = createNumberInput({
    explicitControlledValue,
    fieldValue: field.value,
    initialDefaultValue,
    min,
    max,
    rawMin: () => merged.min,
    rawMax: () => merged.max,
    step: stepValue,
    largeStep: largeStepValue,
    stepSnapping: () => merged.stepSnapping !== false,
    locale,
    formatOptions,
    disabled: field.disabled,
    readOnly,
    onValueChange: (value) => merged.onValueChange?.(value),
    setFormValue: (value) => field.setFormValue(value),
    resetNativeInvalid,
    emitChange: () => field.emit('change'),
    emitInput: () => field.emit('input'),
  })

  const initialResetValue = untrack(state.currentValue)

  // Explicit controlled props remain authoritative for Field integrations.
  createEffect(
    () => [explicitControlledValue(), min(), max(), field.value(), locale()],
    ([value, min, max, formValue, localeTag]) => {
      if (value === undefined) {
        return
      }
      if (value === null) {
        if (formValue !== undefined) {
          field.setFormValue(undefined)
        }
        return
      }
      const boundedValue = clamp(value, min, max)
      if (
        !Object.is(
          toNumber(
            formValue as string | number | undefined,
            Number.NaN,
            localeTag,
            formatOptions(),
          ),
          boundedValue,
        )
      ) {
        field.setFormValue(boundedValue)
      }
    },
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
    invalid: () => field.invalid() || nativeInvalid(),
    disabled: field.disabled,
    readonly: readOnly,
    required: field.required,
  }

  function stepDetails(
    kind: ControlKind,
    emitter: 'button' | 'keyboard' | 'wheel',
    event: Event,
    offset: number,
  ): NumberInputT.StepDetails {
    return {
      type: kind,
      emitter,
      event,
      offset,
      value: state.previewStep(kind === 'increment' ? offset : -offset),
    }
  }

  function step(
    kind: ControlKind,
    emitter: 'keyboard' | 'wheel',
    event: Event,
    offset: number,
  ): void {
    const details = stepDetails(kind, emitter, event, offset)
    if (kind === 'increment' ? state.incrementValue(offset) : state.decrementValue(offset)) {
      merged.onStep?.(details)
    }
  }

  function isControlInteractive(kind: ControlKind): boolean {
    const isIncrement = kind === 'increment'
    const value = state.currentValue()
    return (
      !field.disabled() &&
      !readOnly() &&
      (isIncrement ? showIncrement() : showDecrement()) &&
      !(isIncrement
        ? Boolean(merged.incrementDisabled) || (value !== null && value >= max())
        : Boolean(merged.decrementDisabled) || (value !== null && value <= min()))
    )
  }

  const repeatConfig = createMemo<RepeatConfig | null>(() => {
    if (merged.repeat === false) {
      return null
    }
    const cfg =
      typeof merged.repeat === 'object' && merged.repeat !== null ? merged.repeat : undefined
    return {
      delay: cfg?.delay ?? 500,
      interval: cfg?.interval ?? 80,
      throttle: cfg?.throttle ?? 0,
      pointerTypes: cfg?.pointerTypes ?? 'all',
    }
  })

  const press = createNumberInputPress({
    isInteractive: isControlInteractive,
    onStep: (kind) => {
      if (kind === 'increment') {
        state.incrementValue()
      } else {
        state.decrementValue()
      }
    },
    emitStep: (kind, event) => merged.onStep?.(stepDetails(kind, 'button', event, stepValue())),
    focusInput: () => inputEl?.focus(),
    getDocument: () => inputEl?.ownerDocument,
    repeat: repeatConfig,
  })

  function resolveControlProps(kind: ControlKind): NumberInputControlProps {
    const isIncrement = kind === 'increment'
    const isControlDisabled = (): boolean => !isControlInteractive(kind)
    const controlProps = merge(slots[kind], {
      'data-slot': `number-input-${kind}`,
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
    return controlProps as NumberInputControlProps
  }

  const onBlur: JSX.FocusEventHandler<HTMLInputElement, FocusEvent> = (event) => {
    const { defaultPrevented } = callHandler(event, merged.onBlur)
    if (defaultPrevented) {
      return
    }

    state.commitDraft()
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
      step('increment', 'wheel', event, event.shiftKey ? largeStepValue() : stepValue())
      return
    }

    step('decrement', 'wheel', event, event.shiftKey ? largeStepValue() : stepValue())
  }

  let autoFocusTimeoutId: ReturnType<typeof setTimeout> | undefined
  const [isIOS, setIsIOS] = createSignal(false)

  onCleanup(() => {
    if (autoFocusTimeoutId !== undefined) {
      clearTimeout(autoFocusTimeoutId)
    }
  })

  useFormReset(
    () => inputEl?.form,
    () => {
      state.reset(initialResetValue)
      if (inputEl) {
        inputEl.value = state.formattedValue()
      }
    },
  )

  onSettled(() => {
    if (isIOSUserAgent()) {
      setIsIOS(true)
    }

    if (inputEl && inputEl.ownerDocument !== document) {
      // Solid delegates these events on the global document by default.
      delegateEvents(['click', 'contextmenu', 'input', 'keydown', 'pointerdown', 'pointerup'])
      registerDelegatedContainer(inputEl.ownerDocument)
    }

    if (!merged.autoFocus) {
      return
    }

    autoFocusTimeoutId = setTimeout(() => {
      if (!field.disabled()) {
        inputEl?.focus()
      }
    }, merged.autoFocusDelay ?? 0)
  })

  const onInputKeyDown = createKeyDownHandler<HTMLInputElement>({
    disabled: () => field.disabled() || readOnly(),
    keys: {
      ArrowUp: (event) => step('increment', 'keyboard', event, stepValue()),
      ArrowDown: (event) => step('decrement', 'keyboard', event, stepValue()),
      PageUp: (event) => step('increment', 'keyboard', event, largeStepValue()),
      PageDown: (event) => step('decrement', 'keyboard', event, largeStepValue()),
      Home: {
        when: () => merged.min !== undefined,
        handle: () => {
          state.commitValue(min())
          state.setDraftText(undefined)
        },
      },
      End: {
        when: () => merged.max !== undefined,
        handle: () => {
          state.commitValue(max())
          state.setDraftText(undefined)
        },
      },
      Enter: {
        preventDefault: false,
        handle: () => {
          state.commitDraft()
        },
      },
    },
  })

  return (
    <div
      role="group"
      data-slot="number-input"
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

      <Show when={field.name()}>
        <HiddenInput
          type="text"
          tabindex={-1}
          aria-hidden="true"
          name={field.name()}
          form={merged.form}
          value={state.currentValue() !== null ? String(state.currentValue()) : ''}
          required={field.required()}
          disabled={field.disabled()}
          readonly={readOnly()}
          onInvalid={onInvalid}
        />
      </Show>

      <input
        data-slot="number-input-input"
        type="text"
        inputmode={isIOS() && min() < 0 ? 'text' : 'decimal'}
        role="spinbutton"
        placeholder={merged.placeholder}
        {...inputSlot}
        ref={(e) => {
          inputEl = e
          field.setControlRef(e)
          callRef(local.inputRef, e)
        }}
        id={field.id()}
        form={merged.form}
        value={state.draftText() ?? state.formattedValue()}
        required={field.required()}
        disabled={field.disabled()}
        readonly={readOnly()}
        aria-valuemin={merged.min}
        aria-valuemax={merged.max}
        aria-valuenow={state.currentValue() ?? undefined}
        aria-valuetext={state.formattedValue()}
        onInput={(event) => {
          if (field.disabled() || readOnly()) {
            event.currentTarget.value = state.draftText() ?? state.formattedValue()
            return
          }
          state.handleInput(event.currentTarget.value)
        }}
        onChange={(event) => {
          if (field.disabled() || readOnly()) {
            event.currentTarget.value = state.draftText() ?? state.formattedValue()
            return
          }
          state.handleChange(event.currentTarget.value)
        }}
        onKeyDown={onInputKeyDown}
        onBlur={onBlur}
        onFocus={onFocus}
        onWheel={onWheel}
        {...mergeFieldAriaAttributes(local, field.ariaAttrs())}
      />

      <Show when={isVertical() && (showIncrement() || showDecrement())}>
        <div data-slot="number-input-controls" {...controlsSlot}>
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
