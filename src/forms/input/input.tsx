import type { JSX } from 'solid-js'
import { Show, createMemo, mergeProps, onMount, splitProps } from 'solid-js'

import type { IconName } from '../../elements/icon'
import { Icon } from '../../elements/icon'
import type { ModelModifiers } from '../../shared/input-modifiers'
import { applyInputModifiers } from '../../shared/input-modifiers'
import type { SlotClasses } from '../../shared/slot-class'
import { callHandler, cn, useId } from '../../shared/utils'
import { useFormField } from '../form-field/form-field-context'
import type {
  FormDisableOption,
  FormIdentityOptions,
  FormReadOnlyOption,
  FormRequiredOption,
  FormValueOptions,
} from '../form-field/form-options'
import { FORM_ID_NAME_DISABLED_KEYS, FORM_INPUT_INTERACTION_KEYS } from '../form-field/form-options'

import type { InputVariantProps } from './input.class'
import {
  inputInputVariants,
  inputEndPaddingNoSlotVariants,
  inputEndPaddingWithSlotVariants,
  inputLeadingVariants,
  inputRootVariants,
  inputStartPaddingNoSlotVariants,
  inputStartPaddingWithSlotVariants,
  inputTrailingVariants,
} from './input.class'

type InputStyleVariantProps = Pick<InputVariantProps, 'size' | 'variant' | 'highlight'>

export type InputValue = string | number | undefined

type InputSlots = 'root' | 'input' | 'leading' | 'trailing'

export type InputClasses = SlotClasses<InputSlots>

export interface InputBaseProps
  extends
    InputStyleVariantProps,
    FormIdentityOptions,
    FormValueOptions<InputValue>,
    FormRequiredOption,
    FormReadOnlyOption,
    FormDisableOption {
  type?: JSX.InputHTMLAttributes<HTMLInputElement>['type']
  placeholder?: string
  autocomplete?: JSX.InputHTMLAttributes<HTMLInputElement>['autocomplete']
  autofocus?: boolean
  autofocusDelay?: number
  maxLength?: number
  /**
   * String will regard as icon class, for UnoCSS's presetIcons to render
   */
  leading?: IconName
  /**
   * String will regard as icon class, for UnoCSS's presetIcons to render
   */
  trailing?: IconName
  loading?: boolean
  loadingIcon?: IconName
  modelModifiers?: ModelModifiers
  onValueChange?: (value: InputValue) => void
  onInput?: JSX.EventHandlerUnion<HTMLInputElement, InputEvent>
  onChange?: JSX.EventHandlerUnion<HTMLInputElement, Event>
  onBlur?: JSX.FocusEventHandlerUnion<HTMLInputElement, FocusEvent>
  onFocus?: JSX.FocusEventHandlerUnion<HTMLInputElement, FocusEvent>
  classes?: InputClasses
  children?: JSX.Element
}

export type InputProps = InputBaseProps

export function Input(props: InputProps): JSX.Element {
  const merged = mergeProps(
    {
      type: 'text' as NonNullable<JSX.InputHTMLAttributes<HTMLInputElement>['type']>,
      autocomplete: 'off' as const,
      autofocusDelay: 0,
      variant: 'outlined' as const,
      loadingIcon: 'icon-loading' as IconName,
    },
    props,
  )

  const [formProps, baseProps, styleProps] = splitProps(
    merged as InputProps,
    [
      ...FORM_ID_NAME_DISABLED_KEYS,
      'value',
      'required',
      'readOnly',
      'modelModifiers',
      'onValueChange',
      'onInput',
      'onChange',
      ...FORM_INPUT_INTERACTION_KEYS,
    ],
    ['type', 'placeholder', 'autocomplete', 'autofocus', 'autofocusDelay', 'maxLength', 'children'],
  )

  const generatedId = useId(() => formProps.id, 'input')
  const field = useFormField(
    () => ({
      id: formProps.id,
      name: formProps.name,
      size: styleProps.size,
      highlight: styleProps.highlight,
      disabled: formProps.disabled,
    }),
    () => ({
      deferInputValidation: true,
      defaultId: generatedId(),
      defaultSize: 'md',
      initialValue: styleProps.defaultValue ?? '',
    }),
  )

  let inputEl: HTMLInputElement | undefined

  const isLazy = createMemo(() => Boolean(formProps.modelModifiers?.lazy))

  const inputValueProps = createMemo<{
    value?: InputValue
    defaultValue?: InputValue
  }>(() => {
    if (formProps.value !== undefined) {
      return { value: formProps.value }
    }

    if (styleProps.defaultValue !== undefined) {
      return { defaultValue: styleProps.defaultValue }
    }

    return {}
  })
  const loadingTarget = createMemo<'leading' | 'trailing'>(() => {
    if (styleProps.leading) {
      return 'leading'
    }

    if (styleProps.trailing) {
      return 'trailing'
    }

    return 'leading'
  })

  const resolvedLeading = createMemo<IconName | undefined>(() => {
    if (styleProps.loading && loadingTarget() === 'leading') {
      return styleProps.loadingIcon
    }

    return styleProps.leading
  })
  const resolvedTrailing = createMemo<IconName | undefined>(() => {
    if (styleProps.loading && loadingTarget() === 'trailing') {
      return styleProps.loadingIcon
    }

    return styleProps.trailing
  })

  const isLeadingLoading = createMemo(() =>
    Boolean(styleProps.loading && loadingTarget() === 'leading'),
  )
  const isTrailingLoading = createMemo(() =>
    Boolean(styleProps.loading && loadingTarget() === 'trailing'),
  )

  const iconSizeClass = createMemo(() => {
    if (field.size() === 'xl') {
      return 'text-lg'
    }

    if (field.size() === 'md' || field.size() === 'lg') {
      return 'text-base'
    }

    return 'text-sm'
  })

  const hasLeading = createMemo(() => Boolean(resolvedLeading()))
  const hasTrailing = createMemo(() => Boolean(resolvedTrailing()))

  function updateInputValue(value: string | null | undefined): void {
    const nextValue = applyInputModifiers<InputValue>(value, formProps.modelModifiers)

    field.setFormValue(nextValue)
    formProps.onValueChange?.(nextValue)
    field.emit('input')
  }

  const onInput: JSX.EventHandlerUnion<HTMLInputElement, InputEvent> = (event) => {
    callHandler(event, formProps.onInput as JSX.EventHandlerUnion<HTMLInputElement, InputEvent>)

    if (!isLazy()) {
      updateInputValue(event.currentTarget.value)
    }
  }

  const onChange: JSX.EventHandlerUnion<HTMLInputElement, Event> = (event) => {
    const value = event.currentTarget.value

    if (isLazy()) {
      updateInputValue(value)
    }

    if (formProps.modelModifiers?.trim) {
      event.currentTarget.value = value.trim()
    }

    field.emit('change')
    callHandler(event, formProps.onChange as JSX.EventHandlerUnion<HTMLInputElement, Event>)
  }

  const onBlur: JSX.FocusEventHandlerUnion<HTMLInputElement, FocusEvent> = (event) => {
    field.emit('blur')
    callHandler(event, formProps.onBlur as any)
  }

  const onFocus: JSX.FocusEventHandlerUnion<HTMLInputElement, FocusEvent> = (event) => {
    field.emit('focus')
    callHandler(event, formProps.onFocus as any)
  }

  const onRootPointerDown: JSX.EventHandlerUnion<HTMLDivElement, PointerEvent> = (event) => {
    if (event.button !== 0 || event.defaultPrevented || event.target === inputEl) {
      return
    }

    inputEl?.focus()
  }

  onMount(() => {
    if (!baseProps.autofocus) {
      return
    }

    setTimeout(() => {
      inputEl?.focus()
    }, baseProps.autofocusDelay ?? 0)
  })

  return (
    <div
      data-slot="root"
      data-invalid={field.invalid() ? '' : undefined}
      class={inputRootVariants(
        {
          size: field.size(),
          variant: styleProps.variant,
          highlight: field.highlight(),
          disabled: field.disabled(),
        },
        styleProps.classes?.root,
      )}
      onPointerDown={onRootPointerDown}
    >
      <Show when={resolvedLeading()}>
        {(iconName) => (
          <span
            data-slot="leading"
            class={inputLeadingVariants(
              {
                size: field.size(),
              },
              styleProps.classes?.leading,
            )}
          >
            <Icon
              name={iconName()}
              class={cn('shrink-0', iconSizeClass(), isLeadingLoading() && 'animate-spin')}
            />
          </span>
        )}
      </Show>

      <input
        id={field.id()}
        ref={(element) => (inputEl = element)}
        type={baseProps.type}
        name={field.name()}
        placeholder={baseProps.placeholder}
        required={formProps.required}
        disabled={field.disabled()}
        readOnly={formProps.readOnly}
        autocomplete={baseProps.autocomplete}
        maxLength={baseProps.maxLength}
        data-slot="input"
        class={inputInputVariants(
          {
            type: baseProps.type === 'file' ? 'file' : undefined,
          },
          hasLeading()
            ? inputStartPaddingWithSlotVariants({
                size: field.size(),
              })
            : inputStartPaddingNoSlotVariants({
                size: field.size(),
              }),
          hasTrailing()
            ? inputEndPaddingWithSlotVariants({
                size: field.size(),
              })
            : inputEndPaddingNoSlotVariants({
                size: field.size(),
              }),
          styleProps.classes?.input,
        )}
        onInput={onInput}
        onChange={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
        {...field.ariaAttrs()}
        {...inputValueProps()}
      />

      {baseProps.children}

      <Show when={resolvedTrailing()}>
        {(iconName) => (
          <span
            data-slot="trailing"
            class={inputTrailingVariants(
              {
                size: field.size(),
              },
              styleProps.classes?.trailing,
            )}
          >
            <Icon
              name={iconName()}
              class={cn('shrink-0', iconSizeClass(), isTrailingLoading() && 'animate-spin')}
            />
          </span>
        )}
      </Show>
    </div>
  )
}
