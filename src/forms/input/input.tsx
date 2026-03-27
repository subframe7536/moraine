import type { JSX } from 'solid-js'
import { Show, createMemo, mergeProps, onMount, splitProps } from 'solid-js'

import type { IconT } from '../../elements/icon'
import { Icon } from '../../elements/icon'
import type { ModelModifiers } from '../../shared/input-modifiers'
import { applyInputModifiers } from '../../shared/input-modifiers'
import type { BaseProps, SlotClasses, SlotStyles } from '../../shared/types'
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
  inputLeadingVariants,
  inputRootVariants,
  inputTrailingVariants,
} from './input.class'

export namespace InputT {
  export type Slot = 'root' | 'input' | 'leading' | 'trailing'

  export type Variant = InputVariantProps

  export interface Items {}

  export type Value = string | number | undefined

  export type Extend = never
  export type Classes = SlotClasses<Slot>
  export type Styles = SlotStyles<Slot>

  /**
   * Base props for the Input component.
   */
  export interface Base
    extends
      FormIdentityOptions,
      FormValueOptions<Value>,
      FormRequiredOption,
      FormReadOnlyOption,
      FormDisableOption {
    /**
     * The type of the input element.
     * @default 'text'
     */
    type?: JSX.InputHTMLAttributes<HTMLInputElement>['type']

    /**
     * The placeholder text for the input.
     */
    placeholder?: string

    /**
     * The autocomplete attribute for the input.
     * @default 'off'
     */
    autocomplete?: JSX.InputHTMLAttributes<HTMLInputElement>['autocomplete']

    /**
     * Whether the input should automatically receive focus on mount.
     * @default false
     */
    autofocus?: boolean

    /**
     * The delay in milliseconds before automatically focusing the input.
     * @default 0
     */
    autofocusDelay?: number

    /**
     * The maximum number of characters allowed in the input.
     */
    maxLength?: number

    /**
     * Leading icon name.
     */
    leading?: IconT.Name

    /**
     * Trailing icon name.
     */
    trailing?: IconT.Name

    /**
     * Whether the input is in a loading state.
     * @default false
     */
    loading?: boolean

    /**
     * The icon to show when the input is in a loading state.
     * @default 'icon-loading'
     */
    loadingIcon?: IconT.Name

    /**
     * Modifiers for the input value (e.g., trim, lazy).
     */
    modelModifiers?: ModelModifiers

    /**
     * Callback when the value changes.
     */
    onValueChange?: (value: Value) => void

    /**
     * Event handler for the input event.
     */
    onInput?: JSX.EventHandlerUnion<HTMLInputElement, InputEvent>

    /**
     * Event handler for the change event.
     */
    onChange?: JSX.EventHandlerUnion<HTMLInputElement, Event>

    /**
     * Event handler for the blur event.
     */
    onBlur?: JSX.FocusEventHandlerUnion<HTMLInputElement, FocusEvent>

    /**
     * Event handler for the focus event.
     */
    onFocus?: JSX.FocusEventHandlerUnion<HTMLInputElement, FocusEvent>

    /**
     * Additional content to render inside the input container.
     */
    children?: JSX.Element
  }

  /**
   * Props for the Input component.
   */
  export interface Props extends BaseProps<Base, Variant, Extend, Slot> {}
}

/**
 * Props for the Input component.
 */
export interface InputProps extends InputT.Props {}

/** Text input component with leading/trailing icon slots, loading state, and form field integration. */
export function Input(props: InputProps): JSX.Element {
  const merged = mergeProps(
    {
      type: 'text' as NonNullable<JSX.InputHTMLAttributes<HTMLInputElement>['type']>,
      autocomplete: 'off' as const,
      autofocusDelay: 0,
      variant: 'outlined' as const,
      loadingIcon: 'icon-loading' as IconT.Name,
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
    value?: InputT.Value
    defaultValue?: InputT.Value
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

  const resolvedLeading = createMemo<IconT.Name | undefined>(() => {
    if (styleProps.loading && loadingTarget() === 'leading') {
      return styleProps.loadingIcon
    }

    return styleProps.leading
  })
  const resolvedTrailing = createMemo<IconT.Name | undefined>(() => {
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

  function updateInputValue(value: string | null | undefined): void {
    const nextValue = applyInputModifiers<InputT.Value>(value, formProps.modelModifiers)

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
      style={merged.styles?.root}
      data-invalid={field.invalid() ? '' : undefined}
      data-disabled={field.disabled() ? '' : undefined}
      class={inputRootVariants(
        {
          size: field.size(),
          variant: styleProps.variant,
        },
        styleProps.classes?.root,
      )}
      onPointerDown={onRootPointerDown}
    >
      <Show when={resolvedLeading()}>
        {(iconName) => (
          <span
            data-slot="leading"
            style={merged.styles?.leading}
            class={inputLeadingVariants(
              {
                size: field.size(),
              },
              styleProps.classes?.leading,
            )}
          >
            <Icon
              name={iconName()}
              size={field.size()}
              class={cn(isLeadingLoading() && 'animate-loading')}
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
        style={merged.styles?.input}
        class={inputInputVariants(
          {
            type: baseProps.type === 'file' ? 'file' : undefined,
            hasLeading: Boolean(resolvedLeading()),
            hasTrailing: Boolean(resolvedTrailing()),
            size: styleProps.size,
          },
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
            style={merged.styles?.trailing}
            class={inputTrailingVariants(
              {
                size: field.size(),
              },
              styleProps.classes?.trailing,
            )}
          >
            <Icon
              name={iconName()}
              size={field.size()}
              class={cn(isTrailingLoading() && 'animate-loading')}
            />
          </span>
        )}
      </Show>
    </div>
  )
}
