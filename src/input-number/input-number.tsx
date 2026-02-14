import * as KobalteNumberField from '@kobalte/core/number-field'
import type { JSX } from 'solid-js'
import { createMemo, mergeProps, onMount, Show, splitProps } from 'solid-js'

import { Button } from '../button'
import type { ButtonProps } from '../button/button'
import { useFormField } from '../form-field/form-field-context'
import type { IconName } from '../icon'
import { Icon } from '../icon'
import { callHandler, cn, useId } from '../shared/utils'

import type { InputNumberVariantProps } from './input-number.class'
import {
  inputNumberBaseVariants,
  inputNumberDecrementVariants,
  inputNumberIncrementVariants,
  inputNumberRootVariants,
} from './input-number.class'

type InputNumberColor = NonNullable<InputNumberVariantProps['color']>
type InputNumberSize = NonNullable<InputNumberVariantProps['size']>
type InputNumberButtonSize = NonNullable<ButtonProps<'button'>['size']>

type InputNumberControlButtonProps = Partial<
  Omit<ButtonProps<'button'>, 'children' | 'label' | 'onClick' | 'type'>
>

export interface InputNumberClasses {
  root?: string
  base?: string
  increment?: string
  decrement?: string
}

export interface InputNumberBaseProps extends Pick<
  InputNumberVariantProps,
  'size' | 'color' | 'variant' | 'highlight' | 'orientation'
> {
  id?: string
  name?: string
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
  class?: string
  classes?: InputNumberClasses
}

export type InputNumberProps = InputNumberBaseProps &
  Omit<KobalteNumberField.NumberFieldRootProps, keyof InputNumberBaseProps | 'children'>

function normalizeInputNumberColor(value?: string): InputNumberColor {
  if (value === 'secondary' || value === 'neutral' || value === 'error') {
    return value
  }

  return 'primary'
}

function normalizeInputNumberSize(value?: string): InputNumberSize {
  if (value === 'xs' || value === 'sm' || value === 'lg' || value === 'xl') {
    return value
  }

  return 'md'
}

function toButtonIconSize(size: InputNumberSize): InputNumberButtonSize {
  if (size === 'xs') {
    return 'icon-xs'
  }

  if (size === 'sm') {
    return 'icon-sm'
  }

  if (size === 'lg') {
    return 'icon-lg'
  }

  if (size === 'xl') {
    return 'icon-xl'
  }

  return 'icon'
}

export function InputNumber(props: InputNumberProps): JSX.Element {
  const merged = mergeProps(
    {
      size: 'md' as const,
      color: 'primary' as const,
      variant: 'outline' as const,
      orientation: 'horizontal' as const,
      increment: true,
      decrement: true,
      autofocusDelay: 0,
    },
    props,
  )

  const [local, rest] = splitProps(merged as InputNumberProps, [
    'id',
    'name',
    'placeholder',
    'size',
    'color',
    'variant',
    'highlight',
    'orientation',
    'increment',
    'incrementIcon',
    'incrementDisabled',
    'decrement',
    'decrementIcon',
    'decrementDisabled',
    'autofocus',
    'autofocusDelay',
    'onRawValueChange',
    'onBlur',
    'onFocus',
    'class',
    'classes',
    'disabled',
  ])

  const field = useFormField(() => ({
    id: local.id,
    name: local.name,
    size: local.size,
    color: local.color,
    highlight: local.highlight,
    disabled: local.disabled,
  }))
  const generatedId = useId(() => local.id, 'input-number')

  let inputEl: HTMLInputElement | undefined

  const inputId = createMemo(() => field.id() ?? generatedId())
  const rootId = createMemo(() => `${inputId()}-root`)
  const resolvedSize = createMemo(() => normalizeInputNumberSize(field.size() ?? local.size))
  const resolvedColor = createMemo(() => normalizeInputNumberColor(field.color() ?? local.color))
  const resolvedHighlight = createMemo(() => field.highlight() ?? local.highlight)
  const disabled = createMemo(() => field.disabled())
  const ariaAttrs = createMemo(() => field.ariaAttrs() ?? {})
  const buttonSize = createMemo(() => toButtonIconSize(resolvedSize()))

  const resolvedIncrement = createMemo(() => {
    if (local.orientation === 'vertical') {
      return Boolean(local.increment || local.decrement)
    }

    return Boolean(local.increment)
  })

  const resolvedDecrement = createMemo(() => {
    if (local.orientation === 'vertical') {
      return false
    }

    return Boolean(local.decrement)
  })

  const incrementIcon = createMemo<IconName>(() => {
    if (local.incrementIcon) {
      return local.incrementIcon
    }

    return local.orientation === 'vertical' ? 'icon-chevron-up' : 'icon-plus'
  })

  const decrementIcon = createMemo<IconName>(() => {
    if (local.decrementIcon) {
      return local.decrementIcon
    }

    return local.orientation === 'vertical' ? 'icon-chevron-down' : 'icon-minus'
  })

  const incrementProps = createMemo<InputNumberControlButtonProps | undefined>(() => {
    return typeof local.increment === 'object' ? local.increment : undefined
  })

  const decrementProps = createMemo<InputNumberControlButtonProps | undefined>(() => {
    return typeof local.decrement === 'object' ? local.decrement : undefined
  })

  function onRawValueChange(value: number): void {
    local.onRawValueChange?.(value)
    field.emitFormChange()
    field.emitFormInput()
  }

  const onBlur: JSX.FocusEventHandlerUnion<HTMLInputElement, FocusEvent> = (event) => {
    callHandler(event, local.onBlur as any)
    field.emitFormBlur()
  }

  const onFocus: JSX.FocusEventHandlerUnion<HTMLInputElement, FocusEvent> = (event) => {
    callHandler(event, local.onFocus as any)
    field.emitFormFocus()
  }

  onMount(() => {
    if (!local.autofocus) {
      return
    }

    setTimeout(() => {
      inputEl?.focus()
    }, local.autofocusDelay ?? 0)
  })

  return (
    <KobalteNumberField.Root
      id={rootId()}
      name={field.name()}
      disabled={disabled()}
      onRawValueChange={onRawValueChange}
      data-slot="root"
      class={cn(inputNumberRootVariants(), local.classes?.root, local.class)}
      {...rest}
    >
      <KobalteNumberField.Input
        id={inputId()}
        ref={(e) => (inputEl = e)}
        placeholder={local.placeholder}
        data-slot="base"
        class={cn(
          inputNumberBaseVariants({
            color: resolvedColor(),
            size: resolvedSize(),
            variant: local.variant,
            highlight: resolvedHighlight(),
            orientation: local.orientation,
            increment: resolvedIncrement(),
            decrement: resolvedDecrement(),
          }),
          local.classes?.base,
        )}
        onBlur={onBlur}
        onFocus={onFocus}
        {...(ariaAttrs() as Record<string, string | boolean | undefined>)}
      />

      <KobalteNumberField.HiddenInput data-slot="hidden-input" />

      <Show when={resolvedIncrement()}>
        <div
          data-slot="increment"
          class={cn(
            inputNumberIncrementVariants({
              orientation: local.orientation,
              disabled: disabled() || local.incrementDisabled,
            }),
            local.classes?.increment,
          )}
        >
          <KobalteNumberField.IncrementTrigger
            as={Button}
            disabled={disabled() || local.incrementDisabled}
            variant="ghost"
            size={buttonSize()}
            aria-label="Increment"
            leading={<Icon name={incrementIcon()} />}
            {...incrementProps()}
          />
        </div>
      </Show>

      <Show when={resolvedDecrement()}>
        <div
          data-slot="decrement"
          class={cn(
            inputNumberDecrementVariants({
              orientation: local.orientation,
              disabled: disabled() || local.decrementDisabled,
            }),
            local.classes?.decrement,
          )}
        >
          <KobalteNumberField.DecrementTrigger
            as={Button}
            disabled={disabled() || local.decrementDisabled}
            variant="ghost"
            size={buttonSize()}
            aria-label="Decrement"
            leading={<Icon name={decrementIcon()} />}
            {...decrementProps()}
          />
        </div>
      </Show>
    </KobalteNumberField.Root>
  )
}
