import type { JSX } from 'solid-js'
import { Show, createMemo, mergeProps, onMount } from 'solid-js'

import type { IconT } from '../../elements/icon'
import { Icon } from '../../elements/icon'
import type { ModelModifiers, ModifierValue } from '../../shared/input-modifiers'
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

import type { InputVariantProps } from './input.class'
import {
  inputInputVariants,
  inputLeadingVariants,
  inputRootVariants,
  inputTrailingVariants,
} from './input.class'

export namespace InputT {
  export type Value = string | number | undefined

  export type Slot = 'root' | 'input' | 'leading' | 'trailing'

  export type Variant = InputVariantProps

  export type Classes = SlotClasses<Slot>
  export type Styles = SlotStyles<Slot>
  export type Extend = never

  export interface Items {}

  /**
   * Base props for the Input component.
   */
  export interface Base<M extends ModelModifiers | undefined = ModelModifiers | undefined>
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
    maxLength?: number | string

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
     * Modifiers for the input value (e.g., trim, lazy, number).
     */
    modelModifiers?: M

    /**
     * Callback when the input value changes during input.
     */
    onValueChange?: (value: ModifierValue<M>) => void

    /**
     * Callback when the input value change is committed.
     */
    onChange?: (value: ModifierValue<M>) => void

    /**
     * Event handler for the input event.
     */
    onInput?: JSX.EventHandlerUnion<HTMLInputElement, InputEvent>

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
  export interface Props<
    M extends ModelModifiers | undefined = ModelModifiers | undefined,
  > extends BaseProps<Base<M>, Variant, Extend, Slot> {}
}

/**
 * Props for the Input component.
 */
export interface InputProps<
  M extends ModelModifiers | undefined = ModelModifiers | undefined,
> extends InputT.Props<M> {}

/** Text input component with leading/trailing icon slots, loading state, and form field integration. */
export function Input<M extends ModelModifiers | undefined = ModelModifiers | undefined>(
  props: InputProps<M>,
): JSX.Element {
  const merged = mergeProps(
    {
      type: 'text',
      autocomplete: 'off',
      autofocusDelay: 0,
      variant: 'outlined' as InputVariantProps['variant'],
      loadingIcon: 'icon-loading' as IconT.Name,
    },
    props,
  )

  const generatedId = useId(() => merged.id, 'input')
  const field = useFormField(
    () => ({
      id: merged.id,
      name: merged.name,
      size: merged.size,
      disabled: merged.disabled,
    }),
    () => ({
      deferInputValidation: true,
      defaultId: generatedId(),
      defaultSize: 'md',
      initialValue: merged.defaultValue ?? '',
    }),
  )

  let inputEl: HTMLInputElement | undefined

  const isLazy = createMemo(() => Boolean(merged.modelModifiers?.lazy))

  const inputValueProps = createMemo<{
    value?: InputT.Value
    defaultValue?: InputT.Value
  }>(() => {
    if (merged.value !== undefined) {
      return { value: merged.value }
    }

    if (merged.defaultValue !== undefined) {
      return { defaultValue: merged.defaultValue }
    }

    return {}
  })
  const loadingTarget = createMemo<'leading' | 'trailing'>(() => {
    if (merged.leading) {
      return 'leading'
    }

    if (merged.trailing) {
      return 'trailing'
    }

    return 'leading'
  })

  const resolvedLeading = createMemo<IconT.Name | undefined>(() => {
    if (merged.loading && loadingTarget() === 'leading') {
      return merged.loadingIcon
    }

    return merged.leading
  })
  const resolvedTrailing = createMemo<IconT.Name | undefined>(() => {
    if (merged.loading && loadingTarget() === 'trailing') {
      return merged.loadingIcon
    }

    return merged.trailing
  })

  const isLeadingLoading = createMemo(() =>
    Boolean(merged.loading && loadingTarget() === 'leading'),
  )
  const isTrailingLoading = createMemo(() =>
    Boolean(merged.loading && loadingTarget() === 'trailing'),
  )

  function updateInputValue(value: string): void {
    const nextValue = applyInputModifiers<ModifierValue<M>>(value, merged.modelModifiers)

    field.setFormValue(nextValue)
    merged.onValueChange?.(nextValue)
    field.emit('input')
  }

  const onInput: JSX.EventHandlerUnion<HTMLInputElement, InputEvent> = (event) => {
    callHandler(event, merged.onInput as JSX.EventHandlerUnion<HTMLInputElement, InputEvent>)

    if (!isLazy()) {
      updateInputValue(event.currentTarget.value)
    }
  }

  const onChange: JSX.EventHandlerUnion<HTMLInputElement, Event> = (event) => {
    const value = event.currentTarget.value

    if (isLazy()) {
      updateInputValue(value)
    }

    if (merged.modelModifiers?.trim) {
      event.currentTarget.value = value.trim()
    }

    field.emit('change')
    merged.onChange?.(applyInputModifiers<ModifierValue<M>>(value, merged.modelModifiers))
  }

  const onBlur: JSX.FocusEventHandlerUnion<HTMLInputElement, FocusEvent> = (event) => {
    field.emit('blur')
    callHandler(event, merged.onBlur as any)
  }

  const onFocus: JSX.FocusEventHandlerUnion<HTMLInputElement, FocusEvent> = (event) => {
    field.emit('focus')
    callHandler(event, merged.onFocus as any)
  }

  const onRootPointerDown: JSX.EventHandlerUnion<HTMLDivElement, PointerEvent> = (event) => {
    if (event.button !== 0 || event.defaultPrevented || event.target === inputEl) {
      return
    }

    inputEl?.focus()
  }

  onMount(() => {
    if (!merged.autofocus) {
      return
    }

    setTimeout(() => {
      inputEl?.focus()
    }, merged.autofocusDelay ?? 0)
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
          variant: merged.variant,
        },
        merged.classes?.root,
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
              merged.classes?.leading,
            )}
          >
            <Icon
              name={iconName()}
              size={field.size()}
              class={cn(isLeadingLoading() && 'effect-loading')}
            />
          </span>
        )}
      </Show>

      <input
        id={field.id()}
        ref={(element) => (inputEl = element)}
        type={merged.type}
        name={field.name()}
        placeholder={merged.placeholder}
        required={merged.required}
        disabled={field.disabled()}
        readOnly={merged.readOnly}
        autocomplete={merged.autocomplete}
        maxLength={merged.maxLength}
        data-slot="input"
        style={merged.styles?.input}
        class={inputInputVariants(
          {
            type: merged.type === 'file' ? 'file' : undefined,
            hasLeading: Boolean(resolvedLeading()),
            hasTrailing: Boolean(resolvedTrailing()),
            size: merged.size,
          },
          merged.classes?.input,
        )}
        onInput={onInput}
        onChange={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
        {...field.ariaAttrs()}
        {...inputValueProps()}
      />

      {merged.children}

      <Show when={resolvedTrailing()}>
        {(iconName) => (
          <span
            data-slot="trailing"
            style={merged.styles?.trailing}
            class={inputTrailingVariants(
              {
                size: field.size(),
              },
              merged.classes?.trailing,
            )}
          >
            <Icon
              name={iconName()}
              size={field.size()}
              class={cn(isTrailingLoading() && 'effect-loading')}
            />
          </span>
        )}
      </Show>
    </div>
  )
}
