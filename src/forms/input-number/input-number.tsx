import * as KobalteNumberField from '@kobalte/core/number-field'
import type { JSX } from 'solid-js'
import { createMemo, mergeProps, onMount, Show, splitProps } from 'solid-js'

import { Button } from '../../elements/button'
import type { ButtonProps } from '../../elements/button/button'
import type { IconName } from '../../elements/icon'
import { Icon } from '../../elements/icon'
import type { SlotClasses } from '../../shared/slot-class'
import { callHandler, cn, useId } from '../../shared/utils'
import { useFormField } from '../form-field/form-field-context'
import type { FormDisableOption, FormIdentityOptions } from '../form-field/form-options'
import { FORM_ID_NAME_DISABLED_KEYS, FORM_INPUT_INTERACTION_KEYS } from '../form-field/form-options'

import type { InputNumberVariantProps } from './input-number.class'
import {
  inputNumberBaseVariants,
  inputNumberControlButtonVariants,
  inputNumberDecrementVariants,
  inputNumberIncrementVariants,
  inputNumberPaddingVariants,
} from './input-number.class'

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

  const resolvedIncrement = createMemo(() => Boolean(controlProps.increment))

  const resolvedDecrement = createMemo(() => Boolean(controlProps.decrement))

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
      class={cn('relative inline-flex w-full items-center', styleProps.classes?.root)}
      {...restProps}
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
          inputNumberPaddingVariants({
            size: field.size(),
            orientation: controlProps.orientation,
            increment: resolvedIncrement(),
            decrement: resolvedDecrement(),
          }),
          controlProps.orientation === 'horizontal' && !resolvedDecrement() && 'text-start',
          styleProps.classes?.base,
        )}
        onBlur={onBlur}
        onFocus={onFocus}
        {...field.ariaAttrs()}
      />

      <KobalteNumberField.HiddenInput />

      <Show when={resolvedIncrement()}>
        <div
          data-slot="increment"
          class={inputNumberIncrementVariants(
            {
              orientation: controlProps.orientation,
              disabled: field.disabled() || controlProps.incrementDisabled,
            },
            styleProps.classes?.increment,
          )}
        >
          <KobalteNumberField.IncrementTrigger
            as={Button}
            disabled={field.disabled() || controlProps.incrementDisabled}
            variant="ghost"
            size={`icon-${field.size()}`}
            aria-label="Increment"
            leading={<Icon name={incrementIcon()} />}
            {...incrementProps()}
            classes={{
              ...incrementProps()?.classes,
              base: cn(
                incrementProps()?.classes?.base,
                inputNumberControlButtonVariants({ orientation: controlProps.orientation }),
              ),
            }}
          />
        </div>
      </Show>

      <Show when={resolvedDecrement()}>
        <div
          data-slot="decrement"
          class={inputNumberDecrementVariants(
            {
              orientation: controlProps.orientation,
              disabled: field.disabled() || controlProps.decrementDisabled,
            },
            styleProps.classes?.decrement,
          )}
        >
          <KobalteNumberField.DecrementTrigger
            as={Button}
            disabled={field.disabled() || controlProps.decrementDisabled}
            variant="ghost"
            size={`icon-${field.size()}`}
            aria-label="Decrement"
            leading={<Icon name={decrementIcon()} />}
            {...decrementProps()}
            classes={{
              ...decrementProps()?.classes,
              base: cn(
                decrementProps()?.classes?.base,
                inputNumberControlButtonVariants({ orientation: controlProps.orientation }),
              ),
            }}
          />
        </div>
      </Show>
    </KobalteNumberField.Root>
  )
}
