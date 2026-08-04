import type { JSX } from 'solid-js'
import { Show, createMemo, mergeProps, onMount, splitProps } from 'solid-js'

import type { IconT } from '../../elements/icon/index.ts'
import { Icon } from '../../elements/icon/index.ts'
import type { ModelModifiers, ModifierValue } from '../../shared/input-modifiers.ts'
import { applyInputModifiers } from '../../shared/input-modifiers.ts'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'
import { callHandler, cn, useId } from '../../shared/utils.ts'
import { useFormField } from '../form-field/form-field-context.ts'
import type {
  FormDisableOption,
  FormIdentityOptions,
  FormReadOnlyOption,
  FormRequiredOption,
  FormValueOptions,
} from '../form-field/form-options.ts'

import type { InputVariantProps } from './input.class.ts'
import {
  inputInputVariants,
  inputLeadingVariants,
  inputRootVariants,
  inputTrailingVariants,
} from './input.class.ts'

export namespace InputT {
  export type Value = string | number | undefined

  export interface Slot<T = unknown> {
    /**
     * Input wrapper that positions icons, loading state, and the native input.
     */
    root?: T

    /** Native text input element. */
    input?: T

    /** Icon or loading indicator rendered before the input value. */
    leading?: T

    /** Icon or loading indicator rendered after the input value. */
    trailing?: T
  }

  export type Variant = InputVariantProps
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface Item {}

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
    onInput?: JSX.InputEventHandlerUnion<HTMLInputElement, InputEvent>

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
  export type Props<M extends ModelModifiers | undefined = ModelModifiers | undefined> = BaseProps<
    'div',
    Base<M>,
    Variant,
    Classes,
    Styles
  >
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
  type RootProps = InputProps<M> & {
    onPointerDown?: JSX.EventHandlerUnion<HTMLDivElement, PointerEvent>
  }
  const [local, rest] = splitProps(props as RootProps, [
    'id',
    'name',
    'value',
    'defaultValue',
    'required',
    'readOnly',
    'disabled',
    'size',
    'type',
    'placeholder',
    'autocomplete',
    'autofocus',
    'autofocusDelay',
    'maxLength',
    'leading',
    'trailing',
    'loading',
    'loadingIcon',
    'modelModifiers',
    'onValueChange',
    'onChange',
    'onInput',
    'onBlur',
    'onFocus',
    'children',
    'variant',
    'classes',
    'styles',
    'class',
    'style',
    'onPointerDown',
  ])
  const merged = mergeProps(
    {
      type: 'text',
      autocomplete: 'off',
      autofocusDelay: 0,
      variant: 'outlined' as InputVariantProps['variant'],
      loadingIcon: 'icon-loading' as IconT.Name,
    },
    local,
  )
  const leading = createMemo(() => merged.leading)
  const trailing = createMemo(() => merged.trailing)
  const loadingIcon = createMemo(() => merged.loadingIcon)

  const generatedId = useId(() => merged.id, 'input')
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

    if (field.value() !== undefined) {
      return { value: field.value() as InputT.Value }
    }

    if (merged.defaultValue !== undefined) {
      return { defaultValue: merged.defaultValue }
    }

    return {}
  })
  const loadingTarget = createMemo<'leading' | 'trailing'>(() => {
    if (leading()) {
      return 'leading'
    }

    if (trailing()) {
      return 'trailing'
    }

    return 'leading'
  })

  const resolvedLeading = createMemo<IconT.Name | undefined>(() => {
    if (merged.loading && loadingTarget() === 'leading') {
      return loadingIcon()
    }

    return leading()
  })
  const resolvedTrailing = createMemo<IconT.Name | undefined>(() => {
    if (merged.loading && loadingTarget() === 'trailing') {
      return loadingIcon()
    }

    return trailing()
  })

  const isLeadingLoading = createMemo(() =>
    Boolean(merged.loading && loadingTarget() === 'leading'),
  )
  const isTrailingLoading = createMemo(() =>
    Boolean(merged.loading && loadingTarget() === 'trailing'),
  )
  const readOnly = createMemo(() => Boolean(merged.readOnly))
  const dataAttrs = createMemo(() => ({
    'data-invalid': field.invalid() ? '' : undefined,
    'data-disabled': field.disabled() ? '' : undefined,
    'data-required': merged.required ? '' : undefined,
    'data-readonly': readOnly() ? '' : undefined,
  }))

  function updateInputValue(value: string): void {
    const nextValue = applyInputModifiers<ModifierValue<M>>(value, merged.modelModifiers)

    field.setFormValue(nextValue)
    merged.onValueChange?.(nextValue)
    field.emit('input')
  }

  const onInput: JSX.EventHandler<HTMLInputElement, InputEvent> = (event) => {
    const { defaultPrevented } = callHandler(event, merged.onInput)
    if (defaultPrevented) {
      return
    }

    if (!isLazy()) {
      updateInputValue(event.currentTarget.value)
    }
  }

  const onChange: JSX.EventHandler<HTMLInputElement, Event> = (event) => {
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

  const onBlur: JSX.FocusEventHandler<HTMLInputElement, FocusEvent> = (event) => {
    const { defaultPrevented } = callHandler(event, merged.onBlur)
    if (defaultPrevented) {
      return
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

  const onRootPointerDown: JSX.EventHandler<HTMLDivElement, PointerEvent> = (event) => {
    const { defaultPrevented } = callHandler(event, local.onPointerDown)
    if (defaultPrevented) {
      return
    }
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
      style={{ ...merged.styles?.root, ...merged.style }}
      class={inputRootVariants(
        {
          size: field.size(),
          variant: merged.variant,
        },
        merged.classes?.root,
        merged.class,
      )}
      onPointerDown={onRootPointerDown}
      {...dataAttrs()}
      {...rest}
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
        readOnly={readOnly()}
        autocomplete={merged.autocomplete}
        maxLength={merged.maxLength}
        aria-required={merged.required || undefined}
        aria-disabled={field.disabled() || undefined}
        aria-readonly={readOnly() || undefined}
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
        {...dataAttrs()}
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
