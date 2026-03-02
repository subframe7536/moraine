import * as KobalteNumberField from '@kobalte/core/number-field'
import type { JSX } from 'solid-js'
import { createMemo, mergeProps, onMount, Show, splitProps } from 'solid-js'

import { Button } from '../button'
import type { ButtonProps } from '../button/button'
import { useFormField } from '../form-field/form-field-context'
import type { FormDisableOption, FormIdentityOptions } from '../form-field/form-options'
import { FORM_ID_NAME_DISABLED_KEYS, FORM_INPUT_INTERACTION_KEYS } from '../form-field/form-options'
import type { IconName } from '../icon'
import { Icon } from '../icon'
import type { SlotClasses } from '../shared/slot-class'
import { callHandler, cn, useId } from '../shared/utils'

import type { InputNumberVariantProps } from './input-number.class'
import {
  inputNumberBaseVariants,
  inputNumberDecrementPaddingVariants,
  inputNumberDecrementVariants,
  inputNumberIncrementPaddingVariants,
  inputNumberIncrementVariants,
} from './input-number.class'

type InputNumberControlTrigger =
  | typeof KobalteNumberField.IncrementTrigger
  | typeof KobalteNumberField.DecrementTrigger

type InputNumberControlButtonProps = Partial<
  Omit<ButtonProps<'button'>, 'children' | 'label' | 'onClick' | 'type'>
>

type InputNumberSlots = 'root' | 'base' | 'increment' | 'decrement'

export type InputNumberClasses = SlotClasses<InputNumberSlots>

export interface InputNumberBaseProps
  extends
    Pick<InputNumberVariantProps, 'size' | 'variant' | 'highlight' | 'orientation'>,
    FormIdentityOptions,
    FormDisableOption {
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
      variant: 'outline' as const,
      orientation: 'horizontal' as const,
      increment: true,
      decrement: true,
      autofocusDelay: 0,
    },
    props,
  )

  const [formProps, controlProps, styleProps, rootProps] = splitProps(
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
    {
      defaultId: generatedId,
      defaultSize: 'md',
    },
  )

  let inputEl: HTMLInputElement | undefined

  const resolvedIncrement = createMemo(() => {
    if (controlProps.orientation === 'vertical') {
      return Boolean(controlProps.increment || controlProps.decrement)
    }

    return Boolean(controlProps.increment)
  })

  const resolvedDecrement = createMemo(() => {
    if (controlProps.orientation === 'vertical') {
      return false
    }

    return Boolean(controlProps.decrement)
  })

  const incrementIcon = createMemo<IconName>(() => {
    if (controlProps.incrementIcon) {
      return controlProps.incrementIcon
    }

    return controlProps.orientation === 'vertical' ? 'icon-chevron-up' : 'icon-plus'
  })

  const decrementIcon = createMemo<IconName>(() => {
    if (controlProps.decrementIcon) {
      return controlProps.decrementIcon
    }

    return controlProps.orientation === 'vertical' ? 'icon-chevron-down' : 'icon-minus'
  })

  const incrementProps = createMemo<InputNumberControlButtonProps | undefined>(() => {
    return typeof controlProps.increment === 'object' ? controlProps.increment : undefined
  })

  const decrementProps = createMemo<InputNumberControlButtonProps | undefined>(() => {
    return typeof controlProps.decrement === 'object' ? controlProps.decrement : undefined
  })

  function renderControl(config: {
    slot: 'increment' | 'decrement'
    trigger: InputNumberControlTrigger
    className: string
    disabled: boolean | undefined
    ariaLabel: 'Increment' | 'Decrement'
    icon: IconName
    buttonProps: InputNumberControlButtonProps | undefined
  }): JSX.Element {
    const Trigger = config.trigger

    return (
      <div data-slot={config.slot} class={config.className}>
        <Trigger
          as={Button}
          disabled={config.disabled}
          variant="ghost"
          size={`icon-${field.size()}`}
          aria-label={config.ariaLabel}
          leading={<Icon name={config.icon} />}
          {...config.buttonProps}
        />
      </div>
    )
  }

  function onRawValueChange(value: number): void {
    formProps.onRawValueChange?.(value)
    field.emitFormChange()
    field.emitFormInput()
  }

  const onBlur: JSX.FocusEventHandlerUnion<HTMLInputElement, FocusEvent> = (event) => {
    callHandler(event, formProps.onBlur as any)
    field.emitFormBlur()
  }

  const onFocus: JSX.FocusEventHandlerUnion<HTMLInputElement, FocusEvent> = (event) => {
    callHandler(event, formProps.onFocus as any)
    field.emitFormFocus()
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
      class={cn('relative inline-flex w-full items-center', styleProps.classes?.root)}
      {...rootProps}
    >
      <KobalteNumberField.Input
        id={field.id()}
        ref={(e) => (inputEl = e)}
        placeholder={controlProps.placeholder}
        data-slot="base"
        class={inputNumberBaseVariants(
          {
            size: field.size(),
            variant: styleProps.variant,
            highlight: field.highlight(),
            orientation: controlProps.orientation,
          },
          resolvedIncrement() && inputNumberIncrementPaddingVariants({ size: field.size() }),
          resolvedDecrement() && inputNumberDecrementPaddingVariants({ size: field.size() }),
          controlProps.orientation === 'horizontal' && !resolvedDecrement() && 'text-start',
          styleProps.classes?.base,
        )}
        onBlur={onBlur}
        onFocus={onFocus}
        {...field.ariaAttrs()}
      />

      <KobalteNumberField.HiddenInput data-slot="hidden-input" />

      <Show when={resolvedIncrement()}>
        {renderControl({
          slot: 'increment',
          trigger: KobalteNumberField.IncrementTrigger,
          className: inputNumberIncrementVariants(
            {
              orientation: controlProps.orientation,
              disabled: field.disabled() || controlProps.incrementDisabled,
            },
            styleProps.classes?.increment,
          ),
          disabled: field.disabled() || controlProps.incrementDisabled,
          ariaLabel: 'Increment',
          icon: incrementIcon(),
          buttonProps: incrementProps(),
        })}
      </Show>

      <Show when={resolvedDecrement()}>
        {renderControl({
          slot: 'decrement',
          trigger: KobalteNumberField.DecrementTrigger,
          className: inputNumberDecrementVariants(
            {
              orientation: controlProps.orientation,
              disabled: field.disabled() || controlProps.decrementDisabled,
            },
            styleProps.classes?.decrement,
          ),
          disabled: field.disabled() || controlProps.decrementDisabled,
          ariaLabel: 'Decrement',
          icon: decrementIcon(),
          buttonProps: decrementProps(),
        })}
      </Show>
    </KobalteNumberField.Root>
  )
}
