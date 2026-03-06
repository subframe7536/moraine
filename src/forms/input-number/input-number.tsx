import * as KobalteNumberField from '@kobalte/core/number-field'
import type { JSX } from 'solid-js'
import { createMemo, mergeProps, onCleanup, onMount, Show, splitProps } from 'solid-js'

import { Button } from '../../elements/button'
import type { ButtonProps } from '../../elements/button/button'
import type { IconName } from '../../elements/icon'
import { Icon } from '../../elements/icon'
import type { SlotClasses } from '../../shared/slot-class'
import { callHandler, useId } from '../../shared/utils'
import { useFormField } from '../form-field/form-field-context'
import type { FormDisableOption, FormIdentityOptions } from '../form-field/form-options'
import { FORM_ID_NAME_DISABLED_KEYS, FORM_INPUT_INTERACTION_KEYS } from '../form-field/form-options'

import type { InputNumberOrientation, InputNumberVariantProps } from './input-number.class'
import {
  inputNumberBaseVariants,
  inputNumberControlButtonVariants,
  inputNumberControlColumnVariants,
  inputNumberRootVariants,
  resolveInputNumberAlign,
} from './input-number.class'

type InputNumberControlButtonProps = Partial<
  Omit<ButtonProps<'button'>, 'children' | 'label' | 'onClick' | 'type'>
> & {
  'data-slot'?: 'increment' | 'decrement'
  onClickCapture?: JSX.EventHandlerUnion<HTMLButtonElement, MouseEvent>
}

type InputNumberSlots = 'root' | 'base' | 'increment' | 'decrement'

const INPUT_NUMBER_HOLD_REPEAT_DELAY = 400
const INPUT_NUMBER_HOLD_REPEAT_INTERVAL = 60

export type InputNumberClasses = SlotClasses<InputNumberSlots>

export interface InputNumberBaseProps
  extends
    Pick<InputNumberVariantProps, 'size' | 'variant' | 'highlight'>,
    FormIdentityOptions,
    FormDisableOption {
  orientation?: InputNumberOrientation
  placeholder?: string
  increment?: boolean | InputNumberControlButtonProps
  incrementIcon?: IconName
  incrementDisabled?: boolean
  decrement?: boolean | InputNumberControlButtonProps
  decrementIcon?: IconName
  decrementDisabled?: boolean
  autofocus?: boolean
  autofocusDelay?: number
  onBlur?: JSX.FocusEventHandlerUnion<HTMLInputElement, FocusEvent>
  onFocus?: JSX.FocusEventHandlerUnion<HTMLInputElement, FocusEvent>
  classes?: InputNumberClasses
}

export type InputNumberProps = InputNumberBaseProps &
  Omit<KobalteNumberField.NumberFieldRootProps, keyof InputNumberBaseProps | 'children' | 'class'>

export function InputNumber(props: InputNumberProps): JSX.Element {
  const merged = mergeProps(
    {
      variant: 'outlined' as const,
      orientation: 'horizontal' as const,
      increment: true,
      decrement: true,
      autofocusDelay: 0,
    },
    props,
  )

  const [formProps, controlProps, styleProps, restProps] = splitProps(
    merged as InputNumberProps,
    [...FORM_ID_NAME_DISABLED_KEYS, 'onRawValueChange', ...FORM_INPUT_INTERACTION_KEYS],
    [
      'placeholder',
      'orientation',
      'increment',
      'incrementIcon',
      'incrementDisabled',
      'decrement',
      'decrementIcon',
      'decrementDisabled',
      'autofocus',
      'autofocusDelay',
    ],
    ['size', 'variant', 'highlight', 'classes'],
  )

  const generatedId = useId(() => formProps.id, 'input-number')
  const field = useFormField(
    () => ({
      id: formProps.id,
      name: formProps.name,
      size: styleProps.size,
      highlight: styleProps.highlight,
      disabled: formProps.disabled,
    }),
    () => ({
      defaultId: generatedId(),
      defaultSize: 'md',
      initialValue: restProps.rawValue ?? restProps.defaultValue ?? 0,
    }),
  )

  let inputEl: HTMLInputElement | undefined
  let activeRepeatButton: HTMLButtonElement | undefined
  let holdRepeatTimeoutId: ReturnType<typeof setTimeout> | undefined
  let holdRepeatIntervalId: ReturnType<typeof setInterval> | undefined
  let clearSuppressTrustedClickTimeoutId: ReturnType<typeof setTimeout> | undefined
  let suppressTrustedClick = false
  let repeatedDuringPress = false

  const resolvedIncrement = createMemo(() => Boolean(controlProps.increment))

  const resolvedDecrement = createMemo(() => Boolean(controlProps.decrement))

  const resolvedOrientation = createMemo<InputNumberOrientation>(
    () => controlProps.orientation ?? 'horizontal',
  )

  const incrementIcon = createMemo<IconName>(() => {
    if (controlProps.incrementIcon) {
      return controlProps.incrementIcon
    }

    return resolvedOrientation() === 'vertical' ? 'icon-chevron-up' : 'icon-plus'
  })

  const decrementIcon = createMemo<IconName>(() => {
    if (controlProps.decrementIcon) {
      return controlProps.decrementIcon
    }

    return resolvedOrientation() === 'vertical' ? 'icon-chevron-down' : 'icon-minus'
  })

  const isVertical = createMemo(() => resolvedOrientation() === 'vertical')

  function clearHoldRepeatTimers(): void {
    if (holdRepeatTimeoutId) {
      clearTimeout(holdRepeatTimeoutId)
      holdRepeatTimeoutId = undefined
    }

    if (holdRepeatIntervalId) {
      clearInterval(holdRepeatIntervalId)
      holdRepeatIntervalId = undefined
    }
  }

  function clearSuppressTrustedClickTimeout(): void {
    if (clearSuppressTrustedClickTimeoutId) {
      clearTimeout(clearSuppressTrustedClickTimeoutId)
      clearSuppressTrustedClickTimeoutId = undefined
    }
  }

  function clickActiveRepeatButton(): void {
    if (!activeRepeatButton || activeRepeatButton.disabled || !activeRepeatButton.isConnected) {
      stopHoldRepeat()
      return
    }

    repeatedDuringPress = true
    activeRepeatButton.click()
  }

  function startHoldRepeat(button: HTMLButtonElement): void {
    if (button.disabled) {
      return
    }

    clearSuppressTrustedClickTimeout()
    suppressTrustedClick = false
    stopHoldRepeat()

    activeRepeatButton = button
    repeatedDuringPress = false
    holdRepeatTimeoutId = setTimeout(() => {
      clickActiveRepeatButton()
      holdRepeatIntervalId = setInterval(clickActiveRepeatButton, INPUT_NUMBER_HOLD_REPEAT_INTERVAL)
    }, INPUT_NUMBER_HOLD_REPEAT_DELAY)
  }

  function stopHoldRepeat(): void {
    const shouldSuppressTrustedClick = repeatedDuringPress

    clearHoldRepeatTimers()
    activeRepeatButton = undefined
    repeatedDuringPress = false

    if (!shouldSuppressTrustedClick) {
      return
    }

    suppressTrustedClick = true
    clearSuppressTrustedClickTimeout()
    clearSuppressTrustedClickTimeoutId = setTimeout(() => {
      suppressTrustedClick = false
      clearSuppressTrustedClickTimeoutId = undefined
    }, 0)
  }

  function onControlPointerDown(
    event: PointerEvent,
    handler: JSX.EventHandlerUnion<HTMLButtonElement, PointerEvent> | undefined,
  ): void {
    const { defaultPrevented } = callHandler(event, handler)

    if (defaultPrevented || (event.pointerType === 'mouse' && event.button !== 0)) {
      return
    }

    startHoldRepeat(event.currentTarget as HTMLButtonElement)
  }

  function onControlPointerStop(
    event: PointerEvent,
    handler: JSX.EventHandlerUnion<HTMLButtonElement, PointerEvent> | undefined,
  ): void {
    callHandler(event, handler)
    stopHoldRepeat()
  }

  function onControlClickCapture(
    event: MouseEvent,
    handler: JSX.EventHandlerUnion<HTMLButtonElement, MouseEvent> | undefined,
  ): void {
    callHandler(event, handler)

    if (!suppressTrustedClick || !event.isTrusted) {
      return
    }

    suppressTrustedClick = false
    clearSuppressTrustedClickTimeout()
    event.preventDefault()
    event.stopPropagation()
    event.stopImmediatePropagation()
  }

  onCleanup(() => {
    clearHoldRepeatTimers()
    clearSuppressTrustedClickTimeout()
  })

  function resolveControlProps(
    isIncrement: boolean,
    userProps: InputNumberControlButtonProps | undefined,
  ): InputNumberControlButtonProps {
    const resolvedClasses = userProps?.classes
    const slot = isIncrement ? 'increment' : 'decrement'

    return {
      'data-slot': slot,
      disabled:
        field.disabled() ||
        (isIncrement ? controlProps.incrementDisabled : controlProps.decrementDisabled),
      variant: 'ghost',
      size: `icon-${field.size()}`,
      'aria-label': isIncrement ? 'Increment' : 'Decrement',
      leading: <Icon name={isIncrement ? incrementIcon() : decrementIcon()} />,
      ...userProps,
      onPointerDown: (event: PointerEvent) => onControlPointerDown(event, userProps?.onPointerDown),
      onPointerUp: (event: PointerEvent) => onControlPointerStop(event, userProps?.onPointerUp),
      onPointerLeave: (event: PointerEvent) =>
        onControlPointerStop(event, userProps?.onPointerLeave),
      onPointerCancel: (event: PointerEvent) =>
        onControlPointerStop(event, userProps?.onPointerCancel),
      onClickCapture: (event: MouseEvent) =>
        onControlClickCapture(event, userProps?.onClickCapture),
      classes: {
        ...resolvedClasses,
        base: inputNumberControlButtonVariants(
          {
            control: slot,
            divided: !isIncrement && isVertical() && resolvedIncrement(),
            orientation: resolvedOrientation(),
          },
          isIncrement ? styleProps.classes?.increment : styleProps.classes?.decrement,
          resolvedClasses?.base,
        ),
      },
    }
  }

  function IncrementControl(): JSX.Element {
    return (
      <KobalteNumberField.IncrementTrigger
        as={Button}
        {...resolveControlProps(
          true,
          typeof controlProps.increment === 'object' ? controlProps.increment : undefined,
        )}
      />
    )
  }

  function DecrementControl(): JSX.Element {
    return (
      <KobalteNumberField.DecrementTrigger
        as={Button}
        {...resolveControlProps(
          false,
          typeof controlProps.decrement === 'object' ? controlProps.decrement : undefined,
        )}
      />
    )
  }

  function onRawValueChange(value: number): void {
    field.setFormValue(value)
    formProps.onRawValueChange?.(value)
    field.emit('change')
    field.emit('input')
  }

  const onBlur: JSX.FocusEventHandlerUnion<HTMLInputElement, FocusEvent> = (event) => {
    callHandler(event, formProps.onBlur as any)
    field.emit('blur')
  }

  const onFocus: JSX.FocusEventHandlerUnion<HTMLInputElement, FocusEvent> = (event) => {
    callHandler(event, formProps.onFocus as any)
    field.emit('focus')
  }

  onMount(() => {
    if (!controlProps.autofocus) {
      return
    }

    setTimeout(() => {
      inputEl?.focus()
    }, controlProps.autofocusDelay ?? 0)
  })

  return (
    <KobalteNumberField.Root
      id={`${field.id()}-root`}
      name={field.name()}
      disabled={field.disabled()}
      onRawValueChange={onRawValueChange}
      data-slot="root"
      data-invalid={field.invalid() ? '' : undefined}
      class={inputNumberRootVariants(
        {
          size: field.size(),
          variant: styleProps.variant,
          highlight: field.highlight(),
          disabled: field.disabled(),
        },
        styleProps.classes?.root,
      )}
      {...restProps}
    >
      <Show when={!isVertical() && resolvedDecrement()}>
        <DecrementControl />
      </Show>

      <KobalteNumberField.Input
        id={field.id()}
        ref={(e) => (inputEl = e)}
        placeholder={controlProps.placeholder}
        data-slot="base"
        class={inputNumberBaseVariants(
          {
            size: field.size(),
            align: resolveInputNumberAlign(resolvedOrientation(), resolvedDecrement()),
          },
          styleProps.classes?.base,
        )}
        onBlur={onBlur}
        onFocus={onFocus}
        {...field.ariaAttrs()}
      />

      <KobalteNumberField.HiddenInput />

      <Show when={isVertical() && (resolvedIncrement() || resolvedDecrement())}>
        <div data-slot="controls" class={inputNumberControlColumnVariants({ size: field.size() })}>
          <Show when={resolvedIncrement()}>
            <IncrementControl />
          </Show>
          <Show when={resolvedDecrement()}>
            <DecrementControl />
          </Show>
        </div>
      </Show>

      <Show when={!isVertical() && resolvedIncrement()}>
        <IncrementControl />
      </Show>
    </KobalteNumberField.Root>
  )
}
